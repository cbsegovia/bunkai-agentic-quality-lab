/**
 * KATA Architecture - BK-50 Traceability Screen Access Tests
 *
 * TC04 (BK-334) and TC06 (BK-336) are split away from the export flow
 * because neither exports anything — one is an auth gate, the other a
 * scope guard. Grouping them with the export tests would make the file
 * name a lie (BK-50 spec.md §5).
 *
 * BK-990: the fixture story is resolved at runtime by title, not
 * hardcoded — see `TraceabilityPage.discoverFullCoverageStoryId` and
 * `./fixtures.ts` for why the project slug is the one thing that still
 * cannot be discovered (no project-search API exists).
 *
 * Project: e2e (depends on ui-setup)
 */

import { test } from '@TestFixture';
import { TraceabilityPage } from '@ui/TraceabilityPage';
import { config } from '@variables';
import { FIXTURE_PROJECT_SLUG } from './fixtures';

let fixtureStoryId: string;

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({ storageState: config.auth.storageStatePath });
  const page = await context.newPage();
  fixtureStoryId = await new TraceabilityPage({ page }).discoverFullCoverageStoryId(FIXTURE_PROJECT_SLUG);
  await context.close();
});

test.describe('BK-50: Traceability screen access', () => {
  test('BK-50: should redirect an unauthenticated browser to login without rendering data', { tag: ['@critical', '@security'] }, async ({ ui }) => {
    await ui.traceability.expectAnonymousRedirectToLogin(
      `/projects/${FIXTURE_PROJECT_SLUG}/traceability?story=${fixtureStoryId}`,
    );
  });

  test('BK-50: should expose no hosted artifact, public link or share control anywhere on the traceability screen', { tag: ['@security'] }, async ({ ui }) => {
    await ui.traceability.goto({ projectSlug: FIXTURE_PROJECT_SLUG, userStoryId: fixtureStoryId });
    await ui.traceability.expectNoShareAffordance();
  });
});
