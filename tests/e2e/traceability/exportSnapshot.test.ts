/**
 * KATA Architecture - BK-50 Traceability Export Snapshot Tests
 *
 * TC01 (BK-331), TC02 (BK-332) and TC03 (BK-333) — the story's happy path,
 * the self-containment guarantee, and the immutability guarantee. See
 * BK-50 spec.md §1 for why none of them re-asserts rendered markup: the 13
 * unit tests in `lib/traceability/export-snapshot.test.ts` already do that.
 *
 * BK-990: the fixture story is resolved at runtime by title, not
 * hardcoded — see `TraceabilityPage.discoverFullCoverageStoryId` and
 * `./fixtures.ts` for why the project slug is the one thing that still
 * cannot be discovered (no project-search API exists).
 *
 * Project: e2e (depends on ui-setup)
 */

import { join } from 'node:path';
import { expect, test } from '@TestFixture';
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

test.describe('BK-50: Traceability export snapshot', { tag: ['@critical'] }, () => {
  test('BK-50: should download a self-contained document carrying the full chain, its identity and the export timestamp', async ({ ui }) => {
    const savePath = join('tests/data/downloads', `${ui.data.createTestId('bk331')}.html`);

    await ui.traceability.goto({ projectSlug: FIXTURE_PROJECT_SLUG, userStoryId: fixtureStoryId });
    const downloadedPath = await ui.traceability.exportSnapshot(savePath);

    expect(downloadedPath).toBe(savePath);
  });

  test('BK-50: should render the downloaded snapshot completely with zero external requests when opened offline', async ({ ui }) => {
    const savePath = join('tests/data/downloads', `${ui.data.createTestId('bk332')}.html`);

    await ui.traceability.goto({ projectSlug: FIXTURE_PROJECT_SLUG, userStoryId: fixtureStoryId });
    await ui.traceability.exportSnapshot(savePath);

    // Chained after the TC01 download rather than re-exporting — BK-50
    // spec.md §5, "Dependencies: needs a downloaded artifact from TC01".
    await ui.snapshot.openOffline(savePath);
  });

  test('BK-50: should preserve the chain exactly as captured when the live chain changes after export', async ({ test: fixture }) => {
    const { ui, api } = fixture;
    const t0Path = join('tests/data/downloads', `${ui.data.createTestId('bk333-t0')}.html`);
    const t1Path = join('tests/data/downloads', `${ui.data.createTestId('bk333-t1')}.html`);
    const mutatedTitle = `${ui.data.createTestId('bk333-mutated')} — DO NOT SAVE`;

    await ui.traceability.goto({ projectSlug: FIXTURE_PROJECT_SLUG, userStoryId: fixtureStoryId });
    const originalTitle = await ui.traceability.page.locator('h1').first().textContent() ?? '';

    await api.userStory.mutateStoryTitleAndRestore({
      storyId: fixtureStoryId,
      mutatedTitle,
      run: async () => {
        await ui.traceability.exportSnapshot(t0Path);

        await ui.traceability.goto({ projectSlug: FIXTURE_PROJECT_SLUG, userStoryId: fixtureStoryId });
        await ui.traceability.exportSnapshot(t1Path);
      },
    });

    // Flow-level comparison — T0 vs T1 — stays here, not inside either ATC.
    await ui.snapshot.expectSnapshotUnchangedAfterMutation({
      snapshotPath: t0Path,
      expectedTitle: originalTitle.trim(),
    });
    const t1Title = await ui.snapshot.readStoryTitle(t1Path);
    expect(t1Title).toBe(mutatedTitle);
  });
});
