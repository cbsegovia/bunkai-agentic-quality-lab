/**
 * KATA Architecture - BK-258 Open-bugs API Access Control Integration Test
 *
 * TC9 (BK-1101): the workspace open-bugs aggregate is readable only with a
 * valid session or a PAT holding `atc:read`. Decision table, one Playwright
 * test per row so every row gets its own fresh `request` context and a cookie
 * minted in one row can never leak into another.
 *
 * Project: integration (depends on api-setup, no browser cookies)
 */

import type { AccessExpectation } from '@api/OpenBugsApi';

import { faker } from '@faker-js/faker';
import { config, expect, test } from '@TestFixture';

interface AccessRow {
  credential: string
  status: number
  expected: AccessExpectation
}

const DENIED_NO_CREDENTIAL: AccessRow = { credential: 'no credential', status: 401, expected: { status: 401, code: 'unauthorized' } };
const DENIED_INVALID_BEARER: AccessRow = { credential: 'an invalid bearer token', status: 401, expected: { status: 401, code: 'unauthorized' } };
const DENIED_NO_ATC_READ: AccessRow = { credential: 'a PAT without atc:read', status: 403, expected: { status: 403, code: 'forbidden', message: 'atc:read' } };
const ALLOWED_ATC_READ: AccessRow = { credential: 'a PAT with atc:read', status: 200, expected: { status: 200 } };
const ALLOWED_COOKIE: AccessRow = { credential: 'a cookie session', status: 200, expected: { status: 200 } };

test.describe('BK-258: Open-bugs API access control', { tag: ['@critical'] }, () => {
  test(`BK-1101: should respond ${DENIED_NO_CREDENTIAL.status} when the open-bugs read is called with ${DENIED_NO_CREDENTIAL.credential}`, async ({ api }) => {
    const [, me] = await api.auth.getCurrentUser();
    api.clearAuthToken();

    await api.openBugs.expectAccessDecision({ workspaceId: me.active_workspace_id!, expected: DENIED_NO_CREDENTIAL.expected });
  });

  test(`BK-1101: should respond ${DENIED_INVALID_BEARER.status} when the open-bugs read is called with ${DENIED_INVALID_BEARER.credential}`, async ({ api }) => {
    const [, me] = await api.auth.getCurrentUser();
    api.setAuthToken(faker.string.alphanumeric(32));

    await api.openBugs.expectAccessDecision({ workspaceId: me.active_workspace_id!, expected: DENIED_INVALID_BEARER.expected });
  });

  test(`BK-1101: should respond ${DENIED_NO_ATC_READ.status} when the open-bugs read is called with ${DENIED_NO_ATC_READ.credential}`, async ({ api }) => {
    const [, me] = await api.auth.getCurrentUser();
    const pat = await api.auth.mintScopedPat({ scopes: ['run:execute'] });
    try {
      api.setAuthToken(pat.token);

      await api.openBugs.expectAccessDecision({ workspaceId: me.active_workspace_id!, expected: DENIED_NO_ATC_READ.expected });
    }
    finally {
      await pat.revoke();
    }
  });

  test(`BK-1101: should respond ${ALLOWED_ATC_READ.status} when the open-bugs read is called with ${ALLOWED_ATC_READ.credential}`, async ({ api }) => {
    const [, me] = await api.auth.getCurrentUser();
    const pat = await api.auth.mintScopedPat({ scopes: ['atc:read'] });
    try {
      api.setAuthToken(pat.token);

      await api.openBugs.expectAccessDecision({ workspaceId: me.active_workspace_id!, expected: ALLOWED_ATC_READ.expected });
    }
    finally {
      await pat.revoke();
    }
  });

  test(`BK-1101: should respond ${ALLOWED_COOKIE.status} when the open-bugs read is called with ${ALLOWED_COOKIE.credential}`, async ({ api }) => {
    const [, me] = await api.auth.getCurrentUser();
    await api.auth.authenticateSuccessfully(config.testUser);
    api.clearAuthToken();

    expect(me.active_workspace_id).toBeTruthy();
    await api.openBugs.expectAccessDecision({ workspaceId: me.active_workspace_id!, expected: ALLOWED_COOKIE.expected });
  });
});
