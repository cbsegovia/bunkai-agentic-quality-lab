/**
 * KATA Architecture - BK-258 Home Open Bugs Card: zero state
 *
 * TC4 (BK-1096), reduced slice: a workspace with no open bug shows `0`, the
 * "Nothing outstanding right now." message and no severity chips. Only the
 * render branch is automated, against the existing "BK-258 QA Fixture"
 * workspace (found by name, never by id). The "only resolved/closed" and "only
 * archived-module" rows stay manual: they change the cause of the zero, not the
 * render branch, and need permanent staging residue to seed.
 *
 * Nothing is written to staging. The browser is pointed at the fixture
 * workspace through the `bk_active_ws` cookie of the per-test browser context
 * (discarded at test end); the user's server-side active workspace is never
 * changed. The test fails loudly when the fixture workspace is missing or holds
 * an open bug, so it can never pass falsely.
 *
 * Project: e2e (depends on ui-setup)
 */

import { expect, test } from '@TestFixture';

const FIXTURE_WORKSPACE = 'BK-258 QA Fixture';
const NO_BUGS = { open_count: 0, by_severity: { P1: 0, P2: 0, P3: 0, P4: 0 } };

test.describe('BK-258: Home open bugs card zero state', { tag: ['@regression'] }, () => {
  test('BK-1096: should show 0 and the Nothing outstanding message without severity chips given a workspace with no open bug', async ({ test: fixture }) => {
    const { api, ui } = fixture;
    fixture.clearAuthToken();

    const [, me] = await api.auth.getCurrentUser();
    const fixtureWorkspace = me.workspaces.find(workspace => workspace.name === FIXTURE_WORKSPACE);
    expect(fixtureWorkspace, `precondition: workspace "${FIXTURE_WORKSPACE}" must exist for the test user on this environment`).toBeDefined();
    const workspaceId = fixtureWorkspace!.id;

    const [, before] = await api.openBugs.getOpenBugs(workspaceId);
    expect(before, `precondition: workspace "${FIXTURE_WORKSPACE}" must hold no open bug in an active module; archive or close any open bug there`).toMatchObject(NO_BUGS);

    await ui.home.selectWorkspace(workspaceId);
    await ui.home.open();
    await ui.home.showsZeroStateWithoutSeverityChips();

    // The card rendered the zero state; the server must agree.
    const [, oracle] = await api.openBugs.getOpenBugs(workspaceId);
    expect(oracle).toMatchObject(NO_BUGS);
  });
});
