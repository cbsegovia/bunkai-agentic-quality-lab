# BK-266 — Automation Plan

## Fixture

`{ test }` (hybrid) — API seeds precondition projects, UI drives + verifies every ATC. No pure API-only ATC exists in this scope, so `{ api }` alone is never used standalone; `{ ui }` alone would work for BK-609/610/611/612/615/606 (no seeding needed) but the file groups by feature, not by fixture purity, and the shared `TestFixture` costs nothing extra.

## New components

### `tests/components/api/ProjectsApi.ts` (extends `ApiBase`)

```ts
@step
async createProjectSuccessfully(payload: { workspaceId: string; name: string; description?: string })
  : Promise<[APIResponse, CreateProjectResponse]>
// POST /api/v1/workspaces/{workspaceId}/projects
// asserts response.status() === 201, returns [response, body] (body.project.slug needed by callers)
```

Workspace id comes from `AuthApi.getCurrentUser()` (existing helper, `MeResponse.activeWorkspace.id` — confirm exact field name against `api/schemas/auth.types.ts` at code time; adjust if the schema names it differently).

### `tests/components/ui/ProjectsPage.ts` (extends `UiBase`)

Helper (no `@atc`):
- `open()` — `page.goto('/projects')`

ATCs (locators inline per KATA rule — extract only if reused 2+ times in this file):

1. `@atc('BK-604') listProjectsOldestFirstWithNameAndSlug(expected: { name: string; slug: string }[])`
   Precondition (test file, via `ProjectsApi`): 3 projects seeded oldest-to-newest.
   Action: `open()`.
   Assert: `projects-list` children in the given order; each `projects-list-item-{slug}` shows name + slug text; `create-project-form` testid is NOT present on this page.

2. `@atc('BK-605') listSingleProjectAtLowerBoundary(expected: { name: string; slug: string })`
   Precondition: exactly 1 project seeded.
   Action: `open()`.
   Assert: `projects-list` has exactly one `projects-list-item-{slug}`, name+slug correct. (Kept as its own ATC/TC per the existing separate Jira Test BK-605 — not merged into #1's parametrization, since the TMS entities are already split; a future test-documentation pass could propose merging BK-604/605 into one Scenario Outline TC, but that's a TMS-side change, not this session's call.)

3. `@atc('BK-606') activateProjectEntryNavigatesToProject(slug: string)`
   Precondition: 1 seeded project.
   Action: `open()`, click `projects-list-item-{slug}`.
   Assert: `page` URL becomes `/projects/{slug}`.

4. `@atc('BK-607') showsDescriptionWhenPresentOmitsWhenAbsent(row: { slug: string; description: string | null })`
   Precondition: 2 seeded projects, one with a description, one without.
   Action: `open()`.
   Assert: when `description` is set, the entry shows that text; when `null`, no empty description line renders. Test file calls this ATC twice (Examples rows) — same `@atc('BK-607')` ID both times, per the existing Scenario Outline TC.

5. `@atc('BK-609') createProjectFromDedicatedRouteLandsOnProject(name: string)`
   No seed needed.
   Action: `page.goto('/projects/new')`, fill `create-project-name`, click `create-project-submit`.
   Assert: URL becomes `/projects/{slug}` (server-derived slug — read it off the resulting URL, don't precompute); then `open()` again and assert the new project is listed.

6. `@atc('BK-610') rejectsShortNameAndPreservesInput(name: string)` (2-char name)
   Action: on `/projects/new`, fill `create-project-name` with a 2-char value, attempt submit.
   Assert: `create-project-name-hint` shows the length error, `create-project-name` still holds the typed value, URL stays `/projects/new`.

7. `@atc('BK-611') acceptsThreeCharacterBoundaryName(name: string)` (exactly 3 chars — BVA pairing with #6)
   Action: on `/projects/new`, fill exactly 3 chars.
   Assert: `create-project-name-hint` is not shown / `create-project-submit` is enabled (client-side boundary, per BK-266's ATR note that this validates live before submit).

8. `@atc('BK-612') refusesDuplicateProjectName(name: string)`
   Precondition: 1 seeded project with `name`.
   Action: on `/projects/new`, submit the same `name`.
   Assert: `create-project-error` shows "A project with this name already exists here.", URL stays `/projects/new`, no second `projects-list-item-{slug}` appears back on the index.

9. `@atc('BK-615') newProjectNavControlOpensCreateRoute()`
   Action: from any in-shell page (e.g. after `open()` on `/projects`), click the sidebar link by accessible name/title `"New project"` (no testid — see spec.md).
   Assert: URL becomes `/projects/new`, not `/projects`.

## Test files

| File | ATCs |
|---|---|
| `tests/e2e/projects/listProjectsInIndex.test.ts` | BK-604, BK-605, BK-607 |
| `tests/e2e/projects/navigateFromProjectsIndex.test.ts` | BK-606 |
| `tests/e2e/projects/createProjectFromDedicatedRoute.test.ts` | BK-609, BK-610, BK-611, BK-612 |
| `tests/e2e/projects/openCreateRouteFromSidebar.test.ts` | BK-615 |

## Fixture registration

- `ApiFixture.ts` — add `readonly projects: ProjectsApi;`
- `UiFixture.ts` — add `readonly projects: ProjectsPage;`

## Test data

All names/descriptions generated per-test via `TestContext.generateUserData()` / faker helpers (rule: no shared state between tests) — every seeded project gets a unique name so parallel test runs never collide on the duplicate-name check (BK-612 is the one ATC that deliberately reuses a name, and it reuses its OWN seeded name within the same test, not a fixture-wide constant).

## Risks

- `MeResponse` schema field name for the active workspace id is assumed (`activeWorkspace.id`) from the component's doc comment, not re-verified against `api/schemas/auth.types.ts` in this planning pass — Code phase must confirm before wiring `ProjectsApi.createProjectSuccessfully`.
- BK-611's "acceptance" assertion is UI-only (error clears / button enables) since AC6 is worded as rejection and the acceptance boundary is inferred from the ATR's live-testing note, not from a distinct AC sentence — flagged in case Review wants a stronger server-side assertion (e.g. also confirming the project actually gets created if submitted).

## Verification checklist

- [ ] `bun run test tests/e2e/projects/` all green
- [ ] `bun run types:check` clean
- [ ] `bun run lint:check` clean
- [ ] `bun run kata:manifest` regenerated + staged
- [ ] All 9 `@atc('BK-6xx')` IDs match the real Candidate Jira Test keys (no placeholders)
