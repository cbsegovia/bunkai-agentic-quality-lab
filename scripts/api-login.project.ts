/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  PROJECT-SPECIFIC AUTHENTICATION ADAPTER                        ║
 * ║  THIS is the only file to adapt to YOUR project's auth flow.     ║
 * ║  It ships once with the scaffold and is never overwritten by     ║
 * ║  `bun run up` - the CLI around it (scripts/lib/api-login-core.ts) ║
 * ║  keeps syncing, so upstream improvements arrive without          ║
 * ║  clobbering this adaptation.                                     ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * The boilerplate default is POST /auth/login with `{ email, password }`
 * returning `{ access_token, token_type, expires_in, refresh_token? }`.
 * Your project may use OAuth2 form data, an API key, a PAT exchange, or a
 * different response shape: change the two functions below.
 *
 * Contract (see `ApiLoginAdapter` in scripts/lib/api-login-core.ts):
 *   buildAuthPayload            (required) request body for the auth endpoint
 *   extractTokenFromResponse    (required) token fields out of the response
 *   loginEndpoint               (optional) overrides config.auth.loginEndpoint
 *   headers                     (optional) extra request headers
 *   environments                (optional) positional environments this project
 *                               accepts; keep in sync with the `Environment`
 *                               union in config/variables.ts
 *   extraFlags                  (optional) project flags that take a value
 *                               (e.g. ['--method']); their values arrive in
 *                               `context.flags` and never get mistaken for the
 *                               positional environment
 *   authenticate                (optional) LAST RESORT - see below
 *
 * ── `authenticate` is the LAST RESORT ─────────────────────────────────────
 * Export it only when the flow cannot be expressed as ONE request: reusing a
 * token you already hold (zero requests), branching on a 401, chaining several
 * requests across different paths, or reading the credential from somewhere
 * other than that one response body. It replaces the core's POST entirely, so
 * this project stops receiving upstream improvements to the request phase -
 * retry, backoff, timeouts, error rendering - and owns them itself. That is
 * expressiveness bought with divergence: take it only when there is no
 * alternative, and keep `buildAuthPayload` for every flow that is one request.
 *
 *   export async function authenticate(
 *     { email, password }: { email: string, password: string },
 *     context: ApiLoginContext,
 *     io: ApiLoginIo,
 *   ): Promise<ExtractedToken | null> {
 *     const response = await io.fetch(`${io.apiUrl}/auth/token`, { ... });
 *     if (!response.ok) {
 *       io.log(`Auth failed with ${response.status}`, 'error');
 *       return null;   // the core exits 1; log the reason yourself
 *     }
 *     return { accessToken: '...', tokenType: 'Bearer', expiresIn: 3600, refreshToken: null };
 *   }
 *
 * Everything around it is unchanged: argument parsing, `--role`, `--profile`,
 * `--help`, the empty-token check and the three output files stay the core's.
 */

import type { ApiLoginContext, ExtractedToken } from './lib/api-login-core';

/**
 * Environments accepted as the positional argument. MUST match the
 * `Environment` union in config/variables.ts (add 'qa' / 'production' in both
 * places when the project grows them).
 */
export const environments = ['local', 'staging'] as const;

/**
 * Build the request body for the auth endpoint.
 * Override for different auth formats (e.g. `{ username, password }`, OAuth2).
 */
export function buildAuthPayload(
  email: string,
  password: string,
  _context: ApiLoginContext,
): Record<string, unknown> {
  return { email, password };
}

/**
 * Extract the token fields from the auth response.
 *
 * Bunkai TMS — POST /api/v1/auth/signin with { email, password } returns
 * SigninResponse: { user, session: {...}, pat: { token, scopes, expires_at }, warning }.
 * IMPORTANT: the Bearer token is `pat.token`, NOT `session.access_token` —
 * verified against staging, the raw Supabase session JWT is REJECTED by
 * GET /v1/me (401 "Invalid token"). Only the PAT authenticates over Bearer;
 * `session` is what the browser uses via cookies.
 * The PAT has no fixed TTL in this response (`expires_at: null` unless the
 * caller requested one via `pat_expires_in_days`) — fall back to 24h for
 * `expiresIn` bookkeeping.
 *
 * A top-level `access_token` (the boilerplate's default shape) is accepted as a
 * fallback so the synced scripts/api-login.test.ts keeps passing; Bunkai itself
 * never returns one at the top level.
 */
export function extractTokenFromResponse(
  body: Record<string, unknown>,
  _context: ApiLoginContext,
): ExtractedToken {
  const pat = body.pat as Record<string, unknown> | undefined;
  if (pat) {
    return {
      accessToken: String(pat.token ?? ''),
      tokenType: 'Bearer',
      expiresIn: 86400,
      refreshToken: null, // PATs don't refresh — re-run `bun run api:login` to mint a new one
    };
  }
  return {
    accessToken: String(body.access_token ?? ''),
    tokenType: String(body.token_type ?? 'Bearer'),
    expiresIn: Number(body.expires_in ?? 86400),
    refreshToken: body.refresh_token ? String(body.refresh_token) : null,
  };
}
