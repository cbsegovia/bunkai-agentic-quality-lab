/**
 * KATA Architecture - Layer 3: Traceability API Component
 *
 * API component for BK-45's evidence chain read
 * (GET /api/v1/projects/{id}/traceability?story={userStoryId}).
 *
 * `{id}` (the Project) is a CONSISTENCY ASSERTION on the URL, never a scope
 * parameter — the RPC derives the real Project from the Story's own
 * `module_id`. A mismatched {id}/story pair 404s byte-identical to an
 * unknown story (BK-329 ruling, comment 12171/12176). This component's
 * two negative ATCs below exist specifically to regression-guard that.
 *
 * ATCs follow flow-based design: each ATC is an ACTION + VERIFICATION.
 *
 * `expectUnauthenticatedRejection` carries the real `BK-335` (BK-50 TC05).
 * The BK-45 evidence-chain flows are covered at the UI layer by the real
 * Tests BK-445..BK-464 in `TraceabilityPage`.
 */

import type { APIResponse } from '@playwright/test';
import type { ErrorEnvelope } from '@schemas/auth.types';
import type { TestContextOptions } from '@TestContext';

import { ApiBase } from '@api/ApiBase';
import { expect } from '@playwright/test';
import { atc } from '@utils/decorators';

// Re-export types for consumers that import from TraceabilityApi
export type { ErrorEnvelope } from '@schemas/auth.types';
export type { GetTraceabilityResponse } from '@schemas/traceability.types';

// ============================================
// Traceability API Component
// ============================================

export class TraceabilityApi extends ApiBase {
  constructor(options: TestContextOptions) {
    super(options);
  }

  // ============================================
  // ATCs - Complete Test Cases (ACTION + VERIFICATION)
  // ============================================

  /**
   * ATC: Request the chain with an unauthenticated caller - expects 401
   * (BK-50 TC05 — no auth header, no session cookie, and the body must
   * carry no story/criteria/ATC/run/defect data, not just the right status)
   *
   * @param args - the Project and Story to request (content is irrelevant — must never render)
   * @param args.projectId - Project to request the chain for
   * @param args.userStoryId - Story to request the chain for
   */
  @atc('BK-335')
  async expectUnauthenticatedRejection(
    args: { projectId: string, userStoryId: string },
  ): Promise<[APIResponse, ErrorEnvelope]> {
    const savedToken = this.authToken;
    this.clearAuthToken();

    const [response, body] = await this.apiGET<ErrorEnvelope>(
      `/v1/projects/${args.projectId}/traceability?story=${args.userStoryId}`,
    );

    expect(response.status()).toBe(401);
    expect(body.error.code).toBe('unauthorized');
    // Non-disclosure: the envelope must carry nothing beyond `error` — no
    // story/criteria/ATC/run/defect keys leaking through a wider payload.
    expect(Object.keys(body)).toEqual(['error']);

    if (savedToken) {
      this.setAuthToken(savedToken);
    }

    return [response, body];
  }
}
