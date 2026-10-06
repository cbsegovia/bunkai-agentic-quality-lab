/**
 * KATA Architecture - Layer 3: Open Bugs API Component
 *
 * API component for BK-258's workspace open-bugs read
 * (`GET /api/v1/workspaces/{id}/open-bugs`, Bearer `atc:read` or cookie session).
 *
 * The credential is NOT a parameter of any method here: it is whatever the
 * test set on this component (`api.setAuthToken` / `api.clearAuthToken`), the
 * same convention as `TraceabilityApi.expectUnauthenticatedRejection`.
 *
 * Observed on staging (BK-258 Phase 2 spikes):
 * - 401 `unauthorized` for no credential ("Authentication required.") and for
 *   an invalid bearer ("Invalid token.")
 * - 403 `forbidden` "Missing required capability: atc:read" for a PAT without it
 * - A bearer wins over a session cookie when both are present
 */

import type { APIResponse } from '@playwright/test';
import type { ErrorEnvelope } from '@schemas/auth.types';
import type { OpenBugs } from '@schemas/workspace.types';
import type { TestContextOptions } from '@TestContext';

import { ApiBase } from '@api/ApiBase';
import { expect } from '@playwright/test';
import { atc, step } from '@utils/decorators';

// Re-export types for consumers that import from OpenBugsApi
export type { OpenBugs, OpenBugsBySeverity } from '@schemas/workspace.types';

// ============================================
// Types
// ============================================

/** Expected outcome of the open-bugs read for the credential currently set on the component. */
export type AccessExpectation
  = | { status: 401, code: 'unauthorized' }
    | { status: 403, code: 'forbidden', message: string | RegExp }
    | { status: 200 };

const SEVERITY_KEYS = ['P1', 'P2', 'P3', 'P4'];

// ============================================
// Open Bugs API Component
// ============================================

export class OpenBugsApi extends ApiBase {
  constructor(options: TestContextOptions) {
    super(options);
  }

  // ============================================
  // Helpers - Read-only operations (no @atc)
  // ============================================

  /**
   * Helper: plain read of the workspace open-bugs summary, no assertions.
   * Baseline and parity oracle for the Home card tests.
   */
  @step
  async getOpenBugs(workspaceId: string): Promise<[APIResponse, OpenBugs]> {
    const [response, body] = await this.apiGET<OpenBugs>(`/v1/workspaces/${workspaceId}/open-bugs`);
    return [response, body];
  }

  // ============================================
  // ATCs - Complete Test Cases (ACTION + VERIFICATION)
  // ============================================

  /**
   * ATC: Read the workspace open-bugs summary with the credential currently
   * set on this component - expects 200 and a self-consistent body.
   *
   * Complete flow:
   * 1. GET the open-bugs read (ACTION)
   * 2. Validate status, shape and arithmetic of the payload (VERIFICATION)
   *
   * @param workspaceId - workspace the caller belongs to
   */
  @atc('BK-1100')
  async expectOpenBugsContract(workspaceId: string): Promise<[APIResponse, OpenBugs]> {
    const [response, body] = await this.apiGET<OpenBugs>(`/v1/workspaces/${workspaceId}/open-bugs`);

    expect(response.status()).toBe(200);
    expectWellFormedCounts(body);
    expect(body.open_statuses).toEqual(['open', 'in_progress']);

    return [response, body];
  }

  /**
   * ATC: The open-bugs read, called with whatever credential is currently set
   * on this component, answers the expected authorization decision.
   *
   * Denied (401/403) responses must carry ONLY the error envelope (no count
   * leak). Allowed (200) responses must be well-formed.
   *
   * @param args - workspace id and the decision expected for the credential in use
   * @param args.workspaceId - workspace the caller belongs to
   * @param args.expected - authorization decision expected for the credential in use
   */
  @atc('BK-1101')
  async expectAccessDecision(
    args: { workspaceId: string, expected: AccessExpectation },
  ): Promise<[APIResponse, OpenBugs | ErrorEnvelope]> {
    const { workspaceId, expected } = args;
    const [response, body] = await this.apiGET<OpenBugs | ErrorEnvelope>(`/v1/workspaces/${workspaceId}/open-bugs`);

    expect(response.status()).toBe(expected.status);

    if (expected.status === 200) {
      expectWellFormedCounts(body as OpenBugs);
      return [response, body];
    }

    const envelope = body as ErrorEnvelope;
    // Non-disclosure: a denied caller receives the error envelope and nothing else.
    expect(Object.keys(envelope)).toEqual(['error']);
    expect(envelope.error.code).toBe(expected.code);

    if (expected.status === 403) {
      if (typeof expected.message === 'string') {
        expect(envelope.error.message).toContain(expected.message);
      }
      else {
        expect(envelope.error.message).toMatch(expected.message);
      }
    }

    return [response, body];
  }
}

// ============================================
// Shared assertions (module-private, not ATCs)
// ============================================

function expectWellFormedCounts(body: OpenBugs): void {
  expect(Number.isInteger(body.open_count)).toBe(true);
  expect(body.open_count).toBeGreaterThanOrEqual(0);
  expect(Object.keys(body.by_severity).sort()).toEqual(SEVERITY_KEYS);

  let sum = 0;
  for (const key of SEVERITY_KEYS) {
    const value = body.by_severity[key as keyof OpenBugs['by_severity']];
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
    sum += value;
  }
  expect(body.open_count).toBe(sum);
}
