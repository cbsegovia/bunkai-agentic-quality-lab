/**
 * KATA Architecture - BK-258 Home Open Bugs Card: status counting rule
 *
 * TC2 (BK-1094): the Home "Open bugs" card counts `open` and `in_progress`
 * bugs and excludes `resolved` and `closed` ones. EP outline, 4 rows, one ATC:
 * the two counted rows double as seeding controls (a "+0" row would pass
 * vacuously if seeding silently failed).
 *
 * The workspace is shared, so every expectation is a delta over a baseline read
 * right before seeding. The baseline must hold at least one open bug: with zero
 * the card renders the zero state (no chips), which is BK-1096's scope.
 *
 * `clearAuthToken()` makes every API call use the session cookie, the same
 * identity the browser renders. Cleanup archives the seeded module (bugs of an
 * archived module drop out of the open count).
 *
 * Project: e2e (depends on ui-setup)
 */

import type { ApiFixture } from '@ApiFixture';
import type { BugDetail } from '@schemas/bug.types';

import { expect, test } from '@TestFixture';

const ROWS: ReadonlyArray<{ status: BugDetail['status'], advances: BugDetail['status'][], delta: 0 | 1 }> = [
  { status: 'open', advances: [], delta: 1 },
  { status: 'in_progress', advances: ['in_progress'], delta: 1 },
  { status: 'resolved', advances: ['in_progress', 'resolved'], delta: 0 },
  { status: 'closed', advances: ['in_progress', 'resolved', 'closed'], delta: 0 },
];

// Projects cannot be deleted and the existing QA project is ranked out of
// `recent-projects` (max 20), so it is created once per run and reused by all rows.
let qaProjectId: string | undefined;

async function resolveQaProject(api: ApiFixture, workspaceId: string): Promise<string> {
  if (!qaProjectId) {
    const [, project] = await api.projects.createProjectSuccessfully(workspaceId, api.data.createProject({ name: `BK-258 QA status ${api.data.createTestId('rule')}` }));
    qaProjectId = project.project.id;
  }
  return qaProjectId;
}

test.describe('BK-258: Home open bugs card status rule', { tag: ['@critical', '@regression'] }, () => {
  for (const row of ROWS) {
    test(`BK-1094: should ${row.delta ? 'count' : 'exclude'} a P3 bug in status ${row.status} in the Home open bugs total`, async ({ test: fixture }) => {
      const { api, ui } = fixture;
      fixture.clearAuthToken();

      const [, me] = await api.auth.getCurrentUser();
      const workspaceId = me.active_workspace_id;
      expect(workspaceId).toBeTruthy();

      const [, baseline] = await api.openBugs.getOpenBugs(workspaceId!);
      expect(baseline.open_count, 'precondition: the shared workspace needs at least 1 open bug so the severity chips render').toBeGreaterThan(0);

      const projectId = await resolveQaProject(api, workspaceId!);
      const [, created] = await api.projects.createModuleSuccessfully({
        projectId,
        payload: api.data.createModule(),
      });

      try {
        const [, filed] = await api.bugs.createBugSuccessfully({
          project_id: projectId,
          module_id: created.module.id,
          ...api.data.createBug({ severity: 'P3' }),
        });
        for (const status of row.advances) {
          await api.bugs.advanceBugStatusSuccessfully({ bugId: filed.bug.id, status });
        }

        const expected = {
          total: baseline.open_count + row.delta,
          P3: baseline.by_severity.P3 + row.delta,
        };

        await ui.home.open();
        await ui.home.showsCountedBugTotalAndMinorChip(expected);

        // The card matched `expected`; the server must agree and echo the counted statuses.
        const [, oracle] = await api.openBugs.getOpenBugs(workspaceId!);
        expect(oracle.open_statuses).toEqual(['open', 'in_progress']);
        expect(oracle.open_count).toBe(expected.total);
        expect(oracle.by_severity.P3).toBe(expected.P3);
      }
      finally {
        // Cleanup must never replace the in-flight test failure: warn and move on.
        try {
          await api.projects.archiveModuleSuccessfully(created.module.id);

          const [, after] = await api.openBugs.getOpenBugs(workspaceId!);
          if (after.open_count !== baseline.open_count) {
            console.warn(`[BK-1094] workspace did not return to its baseline: before=${baseline.open_count} after=${after.open_count}`);
          }
        }
        catch (error) {
          console.warn(`[BK-1094] cleanup failed, archive module ${created.module.id} manually: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    });
  }
});
