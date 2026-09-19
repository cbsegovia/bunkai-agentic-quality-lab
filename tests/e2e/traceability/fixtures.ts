/**
 * BK-990 — shared fixture identity for the BK-50 traceability e2e tests.
 *
 * The one literal a human must maintain: Bunkai's API has no endpoint to
 * search or list all projects in a workspace, so the project cannot be
 * discovered at runtime — only a specific story within a KNOWN project can
 * (see `TraceabilityPage.discoverFullCoverageStoryId`). Keep this a
 * readable, single-purpose slug, never a UUID.
 */
export const FIXTURE_PROJECT_SLUG = 'bk-45-traceability-fixtures';
