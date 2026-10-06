/**
 * KATA Architecture - BK-258 Open-bugs API Contract Integration Test
 *
 * TC8 (BK-1100): the workspace open-bugs read returns a well-formed,
 * self-consistent payload, identical whichever accepted credential is used
 * (default login PAT, a minted `atc:read` PAT, a cookie session).
 *
 * Credential order matters: the signin that creates the cookie pollutes the
 * test's own cookie jar, so the cookie row runs LAST and the bearer rows run
 * on a cookie-free context.
 *
 * Project: integration (depends on api-setup, no browser cookies)
 */

import { isDeepStrictEqual } from 'node:util';

import { config, expect, test } from '@TestFixture';

test.describe('BK-258: Open-bugs API contract', { tag: ['@regression'] }, () => {
  test('BK-1100: should return open_count and by_severity with the same values when a workspace member calls the open-bugs API with each accepted credential', async ({ api }) => {
    const [, me] = await api.auth.getCurrentUser();
    const workspaceId = me.active_workspace_id;
    expect(workspaceId).toBeTruthy();

    const pat = await api.auth.mintScopedPat({ scopes: ['atc:read'] });
    try {
      // Row 1: default login PAT, already set by the `api` fixture.
      const [, byDefaultPat] = await api.openBugs.expectOpenBugsContract(workspaceId!);

      // Row 2: minted PAT holding only `atc:read`.
      api.setAuthToken(pat.token);
      const [, byMintedPat] = await api.openBugs.expectOpenBugsContract(workspaceId!);

      // Row 3: cookie session only (signin sets the cookie, then drop the bearer).
      const [, signin] = await api.auth.authenticateSuccessfully(config.testUser);
      api.clearAuthToken();
      const [, byCookie] = await api.openBugs.expectOpenBugsContract(workspaceId!);

      // Shared staging workspace: another actor may file a bug between the sequential reads.
      // Re-read with a default-scope login PAT and tolerate exactly one concurrent change:
      // all three credentials must agree with the first snapshot OR with the final one.
      api.setAuthToken(signin.pat.token);
      const [, finalSnapshot] = await api.openBugs.getOpenBugs(workspaceId!);

      expect(Object.keys(byDefaultPat.by_severity).sort()).toEqual(['P1', 'P2', 'P3', 'P4']);
      const matchesFirstSnapshot = [byMintedPat, byCookie].every(body => isDeepStrictEqual(body, byDefaultPat));
      const matchesFinalSnapshot = [byDefaultPat, byMintedPat, byCookie].every(body => isDeepStrictEqual(body, finalSnapshot));
      if (!matchesFirstSnapshot) {
        expect(matchesFinalSnapshot, 'credentials disagree and the bodies do not match the final re-read either').toBe(true);
      }
    }
    finally {
      await pat.revoke();
    }
  });
});
