/**
 * KATA Architecture - BK-266 Projects Index Navigation Test
 *
 * TC03 (BK-606) — every index entry leads to that exact project.
 *
 * Seeds and reads inside a workspace of its own (see listProjectsInIndex): the
 * shared staging workspace no longer shows new projects in its index.
 *
 * Project: e2e (depends on ui-setup)
 */

import { test } from '@TestFixture';

test.describe('BK-266: Projects index navigation', { tag: ['@critical'] }, () => {
  test('BK-266: should navigate to the exact project activated from the index', async ({ test: fixture }) => {
    const { ui, api } = fixture;
    fixture.clearAuthToken();

    const [, created] = await api.projects.createWorkspaceSuccessfully();
    const workspaceId = created.workspace.id;
    await ui.projects.selectWorkspace(workspaceId);

    const project = ui.data.createProject();
    const [, body] = await api.projects.createProjectSuccessfully(workspaceId, project);

    await ui.projects.open();
    await ui.projects.activateProjectEntryNavigatesToProject(body.project.slug);
  });
});
