/**
 * KATA Architecture - BK-258 Home Open Bugs Card E2E Test
 *
 * TC1 (BK-1093): the Home "Open bugs" card shows the workspace total with a
 * P1-P4 breakdown that sums to it. The API read is the oracle: the baseline is
 * observed before seeding (shared workspace), every expectation is a delta,
 * and the card must equal a fresh API read afterwards.
 *
 * `clearAuthToken()` makes every API call use the session cookie, the same
 * identity the browser renders, so both sides see the same active workspace.
 * Cleanup archives the seeded module: bugs of an archived module drop out of
 * the open count, which restores the baseline.
 *
 * Project: e2e (depends on ui-setup)
 */

import type { OpenBugsCounts } from '@data/types';

import { expect, test } from '@TestFixture';

const SEEDED = [
  { severity: 'P1', status: 'open' },
  { severity: 'P2', status: 'open' },
  { severity: 'P2', status: 'in_progress' },
  { severity: 'P3', status: 'open' },
  { severity: 'P4', status: 'in_progress' },
] as const;

test.describe('BK-258: Home open bugs card', { tag: ['@critical'] }, () => {
  test('BK-1093: should show the open bug total with a P1-P4 breakdown that sums to it given open bugs at several severities', async ({ test: fixture }) => {
    const { api, ui } = fixture;
    fixture.clearAuthToken();

    const [, me] = await api.auth.getCurrentUser();
    const workspaceId = me.active_workspace_id;
    expect(workspaceId).toBeTruthy();

    const [, baseline] = await api.openBugs.getOpenBugs(workspaceId!);

    const [, project] = await api.projects.createProjectSuccessfully(workspaceId!, api.data.createProject({ name: `BK-258 QA ${api.data.createTestId('home')}` }));
    const [, created] = await api.projects.createModuleSuccessfully({
      projectId: project.project.id,
      payload: api.data.createModule(),
    });

    try {
      for (const seed of SEEDED) {
        const [, filed] = await api.bugs.createBugSuccessfully({
          project_id: project.project.id,
          module_id: created.module.id,
          ...api.data.createBug({ severity: seed.severity }),
        });
        if (seed.status === 'in_progress') {
          await api.bugs.advanceBugStatusSuccessfully({ bugId: filed.bug.id, status: 'in_progress' });
        }
      }

      const expected: OpenBugsCounts = {
        total: baseline.open_count + SEEDED.length,
        P1: baseline.by_severity.P1 + 1,
        P2: baseline.by_severity.P2 + 2,
        P3: baseline.by_severity.P3 + 1,
        P4: baseline.by_severity.P4 + 1,
      };

      await ui.home.open();
      // The ATC proved the card shows exactly `expected`; the API oracle must agree with it.
      await ui.home.showsOpenBugTotalWithSeverityBreakdown(expected);

      const [, oracle] = await api.openBugs.getOpenBugs(workspaceId!);
      expect(oracle.open_count).toBe(expected.total);
      expect(oracle.by_severity).toEqual({ P1: expected.P1, P2: expected.P2, P3: expected.P3, P4: expected.P4 });
    }
    finally {
      // Cleanup must never replace the in-flight test failure: warn and move on.
      try {
        await api.projects.archiveModuleSuccessfully(created.module.id);

        const [, after] = await api.openBugs.getOpenBugs(workspaceId!);
        if (after.open_count !== baseline.open_count) {
          console.warn(`[BK-1093] workspace did not return to its baseline: before=${baseline.open_count} after=${after.open_count}`);
        }
      }
      catch (error) {
        console.warn(`[BK-1093] cleanup failed, archive module ${created.module.id} manually: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  });
});
