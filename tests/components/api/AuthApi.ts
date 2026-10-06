/**
 * KATA Architecture - Layer 3: Auth API Component
 *
 * API component for authentication operations against Bunkai TMS.
 *
 * Bunkai auth is a 4-step, cookie-session flow (Supabase SSR) — NOT a single
 * password-form-returns-JWT flow. See config/variables.ts `auth` block for
 * the full sequence. `signin` ALSO returns a bearer `session.access_token` +
 * a PAT in its body (used by the agentic curl maneuver via scripts/api-login.ts),
 * so ApiBase's Bearer-token model still applies even though the browser flow
 * is cookie-based.
 *
 * ATCs follow flow-based design: each ATC is an ACTION + VERIFICATION,
 * not a simple GET. Read-only operations are helpers (no @atc).
 *
 * NOTE: `@atc('BK-101'/'BK-102')` below are PLACEHOLDER IDs — no real Jira
 * Test issue exists yet for these auth flows. Run `/test-documentation` to
 * create the real BK Test issues, then swap these for the real keys before
 * treating this suite as regression-complete (CLAUDE.md Rule #12).
 *
 * Endpoints (confirmed against the synced OpenAPI contract):
 * - POST /api/v1/auth/check-email - {exists, confirmed} for an email
 * - POST /api/v1/auth/signin      - {email, password} -> session + user + pat
 * - GET  /api/v1/me                - identity snapshot (requires session/PAT)
 */

import type { APIResponse } from '@playwright/test';
import type { CheckEmailPayload, CheckEmailResponse, ErrorEnvelope, MeResponse, SigninPayload, SigninResponse } from '@schemas/auth.types';
import type { TestContextOptions } from '@TestContext';

import { ApiBase } from '@api/ApiBase';
import { expect, request as playwrightRequest } from '@playwright/test';
import { atc, step } from '@utils/decorators';

// Re-export types for consumers that import from AuthApi
export type { CheckEmailPayload, CheckEmailResponse, ErrorEnvelope, MeResponse, SigninPayload, SigninResponse } from '@schemas/auth.types';

// ============================================
// Scoped PAT types (BK-258)
// ============================================

/** One capability a PAT can be minted with (from the signin contract). */
export type PatScope = NonNullable<SigninPayload['pat_scopes']>[number];

/** A short-lived PAT minted in its own cookie jar, with its own cleanup. */
export interface ScopedPat {
  token: string
  id: string
  scopes: PatScope[]
  /** Revokes the PAT with the session of the context that minted it, then disposes that context. Never throws. */
  revoke: () => Promise<void>
}

// ============================================
// Auth API Component
// ============================================

export class AuthApi extends ApiBase {
  constructor(options: TestContextOptions) {
    super(options);
  }

  // ============================================
  // Helpers - Read-only operations (no @atc)
  // ============================================

  /**
   * Helper: Get current authenticated principal (user + workspaces + active workspace).
   *
   * Read-only GET — used as a verification step inside ATCs
   * or for test-level assertions. Not an ATC because it's
   * just a data retrieval, not a complete action flow.
   */
  @step
  async getCurrentUser(): Promise<[APIResponse, MeResponse]> {
    const [response, body] = await this.apiGET<MeResponse>(this.config.auth.meEndpoint);
    return [response, body];
  }

  /**
   * Helper: check whether an email is registered and confirmed.
   * First step of the real sign-in flow — not an ATC on its own since it has
   * no side effect, but every login ATC below calls it first.
   */
  @step
  async checkEmail(email: string): Promise<[APIResponse, CheckEmailResponse]> {
    const [response, body] = await this.apiPOST<CheckEmailResponse, CheckEmailPayload>(
      this.config.auth.checkEmailEndpoint,
      { email },
    );
    return [response, body];
  }

  /**
   * Helper: mint a PAT restricted to the given scopes, in a standalone
   * request context (its own cookie jar) so the calling test's context never
   * receives the signin session cookie.
   *
   * Setup-only, no @atc. The PAT self-expires in 1 day as a safety net; the
   * returned `revoke()` removes it earlier. PATs cannot revoke tokens (403
   * "Use a browser session", spike S4), so revocation uses the minting
   * context's cookie session.
   */
  @step
  async mintScopedPat(args: { scopes: PatScope[] }): Promise<ScopedPat> {
    const { email, password } = this.config.testUser;
    const context = await playwrightRequest.newContext();

    try {
      const signinResponse = await context.post(this.apiEndpoint(this.config.auth.signinEndpoint), {
        headers: this.requestHeaders,
        data: {
          email,
          password,
          pat_name: `bk258-qa-${this.data.createTestId('pat')}`,
          pat_scopes: args.scopes,
          pat_expires_in_days: 1,
        } satisfies SigninPayload,
        timeout: this.config.browser.defaultTimeout,
      });
      expect(signinResponse.status()).toBe(200);

      const body = (await signinResponse.json()) as SigninResponse;
      expect(body.pat.scopes).toEqual(args.scopes);

      return {
        token: body.pat.token,
        id: body.pat.id,
        scopes: body.pat.scopes,
        revoke: async () => {
          try {
            const revokeResponse = await context.delete(this.apiEndpoint(`/v1/tokens/${body.pat.id}`), {
              headers: this.requestHeaders,
              timeout: this.config.browser.defaultTimeout,
            });
            // 404 = already revoked; any other non-2xx leaves a live PAT behind.
            if (!revokeResponse.ok() && revokeResponse.status() !== 404) {
              console.warn(`[mintScopedPat] PAT revoke failed: status=${revokeResponse.status()} tokenId=${body.pat.id} (self-expires in 1 day)`);
            }
          }
          catch {
            // Best-effort cleanup: the PAT self-expires after 1 day.
          }
          finally {
            await context.dispose();
          }
        },
      };
    }
    catch (error) {
      await context.dispose();
      throw error;
    }
  }

  // ============================================
  // ATCs - Complete Test Cases (ACTION + VERIFICATION)
  // ============================================

  /**
   * ATC: Authenticate with valid credentials - expects success (200)
   *
   * Complete flow:
   * 1. POST credentials to /v1/auth/signin (ACTION)
   * 2. GET /v1/me to confirm session is valid (VERIFICATION)
   * 3. Validate session/user response
   *
   * IMPORTANT: the bearer token for `Authorization` header calls is
   * `body.pat.token`, NOT `body.session.access_token`. Verified empirically
   * against staging: the raw Supabase session JWT (`session.access_token`)
   * is rejected by `GET /v1/me` with 401 `{"error":"Invalid token"}` — only
   * the PAT authenticates over Bearer. `session.access_token` is what the
   * BROWSER uses via cookies (see LoginPage/ui-auth.setup — cookie flow,
   * no bearer header involved); this API component always talks Bearer, so
   * it always uses the PAT.
   *
   * @param credentials - Email and password (existing, confirmed account)
   */
  @atc('BK-101')
  async authenticateSuccessfully(
    credentials: SigninPayload,
  ): Promise<[APIResponse, SigninResponse, SigninPayload]> {
    // ACTION: POST credentials to signin
    const [response, body, sentPayload] = await this.apiPOST<SigninResponse, SigninPayload>(
      this.config.auth.signinEndpoint,
      credentials,
    );

    // Fixed assertions - validates successful authentication
    expect(response.status()).toBe(200);
    expect(body.pat.token).toBeDefined();
    expect(body.user.email).toBe(credentials.email);

    // Store the PAT (not session.access_token — see note above) for subsequent requests
    this.setAuthToken(body.pat.token);

    // VERIFICATION: Confirm the session is valid via GET /v1/me
    const [meResponse, meBody] = await this.getCurrentUser();
    expect(meResponse.status()).toBe(200);
    expect(meBody.user).toBeDefined();

    return [response, body, sentPayload];
  }

  /**
   * ATC: Sign in with invalid credentials - expects error (401)
   *
   * Complete flow:
   * 1. POST invalid credentials to /v1/auth/signin (ACTION)
   * 2. GET /v1/me to confirm NO session was created (VERIFICATION)
   * 3. Validate uniform error envelope (`error.code === 'unauthorized'`)
   *
   * @param credentials - Invalid email or password
   */
  @atc('BK-102')
  async signInWithInvalidCredentials(
    credentials: SigninPayload,
  ): Promise<[APIResponse, ErrorEnvelope, SigninPayload]> {
    // ACTION: POST invalid credentials
    const [response, body, sentPayload] = await this.apiPOST<ErrorEnvelope, SigninPayload>(
      this.config.auth.signinEndpoint,
      credentials,
    );

    // Fixed assertions - validates the uniform error envelope
    expect(response.status()).toBe(401);
    expect(response.ok()).toBe(false);
    expect(body.error.code).toBe('unauthorized');

    // VERIFICATION: Confirm no session was created via GET /v1/me → 401
    const savedToken = this.authToken;
    this.clearAuthToken();
    const [meResponse] = await this.getCurrentUser();
    expect(meResponse.status()).toBe(401);
    // Restore token if one existed before this ATC
    if (savedToken) {
      this.setAuthToken(savedToken);
    }

    return [response, body, sentPayload];
  }
}
