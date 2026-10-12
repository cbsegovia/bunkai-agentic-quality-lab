/**
 * KATA Architecture - Layer 3: Runs API Component
 *
 * Setup-only helpers for BK-45's in-flight run test (BK-458): start a Run of an
 * existing Test and abort it again. No `@atc` here: these writes have no Jira
 * Test of their own (same precedent as `BugsApi` and `ProjectsApi`).
 *
 * Why the test seeds its own run: staging closes a Run that stays open for
 * about four hours (the fixture run started 2026-08-25 23:02 was closed at
 * 03:15:00 the next day), so a permanently open fixture run cannot exist.
 *
 * Endpoints:
 * - POST /api/v1/runs              - start a Run (Idempotency-Key header required)
 * - POST /api/v1/runs/{id}/abort   - close a `running` Run with a reason
 */

import type { APIResponse } from '@playwright/test';
import type { AbortRunResponse, RunCreateBody, StartRunResponse } from '@schemas/run.types';
import type { TestContextOptions } from '@TestContext';

import { randomUUID } from 'node:crypto';

import { ApiBase } from '@api/ApiBase';
import { expect } from '@playwright/test';
import { step } from '@utils/decorators';

// Re-export types for consumers that import from RunsApi
export type { AbortRunResponse, Run, RunCreateBody, StartRunResponse } from '@schemas/run.types';

// ============================================
// Runs API Component
// ============================================

export class RunsApi extends ApiBase {
  constructor(options: TestContextOptions) {
    super(options);
  }

  // ============================================
  // Helpers - Setup only (no @atc)
  // ============================================

  /**
   * Helper: start a Run of a Test. Fails fast (asserts 201 and `running`) so a
   * broken seed surfaces at the precondition. A fresh Idempotency-Key per call
   * makes every call a new Run.
   *
   * @param args - the Test to run and the Project environment to run it in
   * @param args.testId - Test to start a Run of
   * @param args.environmentId - configured environment of the Test's Project
   */
  @step
  async startRunSuccessfully(
    args: { testId: string, environmentId: string },
  ): Promise<[APIResponse, StartRunResponse]> {
    const [response, body] = await this.apiPOST<StartRunResponse, RunCreateBody>(
      '/v1/runs',
      { test_id: args.testId, environment_id: args.environmentId },
      { headers: { 'Idempotency-Key': randomUUID() } },
    );
    expect(response.status()).toBe(201);
    expect(body.run.status).toBe('running');
    return [response, body];
  }

  /**
   * Helper: abort a `running` Run. Fails fast (asserts 200 and `aborted`).
   *
   * @param args - the Run to close and the reason to record (3..500 chars)
   * @param args.runId - Run to abort
   * @param args.reason - why it is aborted
   */
  @step
  async abortRunSuccessfully(
    args: { runId: string, reason: string },
  ): Promise<[APIResponse, AbortRunResponse]> {
    const [response, body] = await this.apiPOST<AbortRunResponse, { reason: string }>(
      `/v1/runs/${args.runId}/abort`,
      { reason: args.reason },
    );
    expect(response.status()).toBe(200);
    expect(body.run.status).toBe('aborted');
    return [response, body];
  }
}
