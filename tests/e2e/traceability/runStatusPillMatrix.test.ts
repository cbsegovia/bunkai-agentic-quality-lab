/**
 * KATA Architecture - BK-45 Traceability Run-Status Pill Matrix
 *
 * BK-457 (TC04): the latest-run status pill must show the matching copy for
 * each of the 4 terminal run statuses (Pass/Fail/Blocked/Aborted), per the
 * AC-01 vocabulary corrected post-BK-317 (the shipped "Aborted" pill vs. the
 * AC's originally-specified "skipped" vocabulary).
 *
 * BK-458 (TC05): a Run still in-flight must show the in-progress state, not
 * a stale prior run's pass/fail/blocked pill.
 *
 * Fixture story (seeded 2026-08-25 via the real Test/Run/mark/abort/finish
 * API - no direct DB write, shared by both TCs): workspace "QA Automation
 * Workspace", project `bk-45-traceability-fixtures`, story "QA Fixture:
 * run-status pill matrix (BK-457/BK-458)". Each of the 5 ATCs below carries
 * its own dedicated Test + Run:
 * - "Pill - Pass": step marked passed, run finished passed.
 * - "Pill - Fail": step marked failed, run finished failed.
 * - "Pill - Blocked": step marked blocked, run finished failed.
 * - "Pill - Skipped (Aborted)": run aborted before any step executed (the
 *   real mechanism the AC-01 "skipped" vocabulary maps to on this build).
 * - "Pill - Running (in-flight)": an EARLIER run finished passed, then a
 *   SECOND run was started - proves BK-458's "no stale leak" half of the
 *   contract, not just a lone in-flight run. The seeded second run was closed
 *   by staging after ~4h, so BK-458 now starts its own run each time and
 *   aborts it when done.
 */

import { test } from '@TestFixture';

const FIXTURE_PROJECT_SLUG = 'bk-45-traceability-fixtures';
const FIXTURE_STORY_ID = '75eebe7a-bc46-48c8-8dd0-fe82306e6dec';

const ATC_PASS = '11111712-d1f8-49bc-96f6-799f2b5a57cf';
const ATC_FAIL = 'cdd29932-353f-45fa-921d-c6e8fe0b845b';
const ATC_BLOCKED = '5599febe-f2e0-4fe8-aa17-f1e979040e6a';
const ATC_ABORTED = '52c8f9a8-acc5-482d-b2c1-30eb3d34c3b5';
const ATC_RUNNING = 'ec9cc8ff-61d3-484d-b29a-73ac79f20c20';

// BK-458 opens a fresh run on this Test (the one behind ATC_RUNNING) in the
// project's Staging environment.
const TEST_RUNNING = '3a54dfca-124f-4171-b463-a75f78dfff20';
const FIXTURE_ENVIRONMENT_ID = '505f6453-8ab9-4df1-8ffc-57f87e3d19b3';

test.describe('BK-45: Traceability run-status pill matrix', () => {
  test('BK-457: should render the Pass pill for a passed run', async ({ ui }) => {
    await ui.traceability.expectRunStatusPillMatchesTerminalStatus({
      projectSlug: FIXTURE_PROJECT_SLUG,
      userStoryId: FIXTURE_STORY_ID,
      atcId: ATC_PASS,
      expectedCopy: 'Pass',
    });
  });

  test('BK-457: should render the Fail pill for a failed run', async ({ ui }) => {
    await ui.traceability.expectRunStatusPillMatchesTerminalStatus({
      projectSlug: FIXTURE_PROJECT_SLUG,
      userStoryId: FIXTURE_STORY_ID,
      atcId: ATC_FAIL,
      expectedCopy: 'Fail',
    });
  });

  test('BK-457: should render the Blocked pill for a blocked run', async ({ ui }) => {
    await ui.traceability.expectRunStatusPillMatchesTerminalStatus({
      projectSlug: FIXTURE_PROJECT_SLUG,
      userStoryId: FIXTURE_STORY_ID,
      atcId: ATC_BLOCKED,
      expectedCopy: 'Blocked',
    });
  });

  test('BK-457: should render the Aborted pill for a skipped run (AC-01 vocabulary, post-BK-317)', async ({ ui }) => {
    await ui.traceability.expectRunStatusPillMatchesTerminalStatus({
      projectSlug: FIXTURE_PROJECT_SLUG,
      userStoryId: FIXTURE_STORY_ID,
      atcId: ATC_ABORTED,
      expectedCopy: 'Aborted',
    });
  });

  test('BK-458: should not show a misleading verdict when the latest run is in-flight', async ({ test: fixture }) => {
    const { api, ui } = fixture;
    // Same identity the browser renders (session cookie), not the PAT.
    fixture.clearAuthToken();

    // Staging closes a Run left open for ~4h, so the in-flight run cannot be a
    // permanent fixture: this test opens its own on top of the earlier finished
    // run, and closes it again afterwards.
    const [, started] = await api.runs.startRunSuccessfully({
      testId: TEST_RUNNING,
      environmentId: FIXTURE_ENVIRONMENT_ID,
    });

    try {
      await ui.traceability.expectInFlightRunNotMisleading({
        projectSlug: FIXTURE_PROJECT_SLUG,
        userStoryId: FIXTURE_STORY_ID,
        atcId: ATC_RUNNING,
      });
    }
    finally {
      // Cleanup must never replace the in-flight test failure: warn and move on.
      try {
        await api.runs.abortRunSuccessfully({ runId: started.run.id, reason: 'BK-458 test cleanup' });
      }
      catch (error) {
        console.warn(`[BK-458] cleanup failed, abort run ${started.run.id} manually: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  });
});
