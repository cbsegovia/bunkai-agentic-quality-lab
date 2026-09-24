# BK-266 — Automation Spec

Ticket-driven scope. Source: `/test-documentation` Stage 4 Candidate verdicts (9 of 13 TCs).
Manual (BK-616) and Deferred (BK-608, BK-613, BK-614) are terminal — not automated.

## Product surface (verified against `origin/staging`, upex-bunkai-tms)

| Route | Purpose |
|---|---|
| `/projects` | Index — `app/(app)/projects/page.tsx` |
| `/projects/new` | Dedicated create route — `app/(app)/projects/create-project-form.tsx` |
| `POST /api/v1/workspaces/{workspaceId}/projects` | Real REST create endpoint the form itself calls — usable for API-seeded test data |

### Confirmed selectors (`data-testid`)

| Selector | Where |
|---|---|
| `projects-list` | `<ul>` wrapping the index |
| `projects-list-item-{slug}` | Each entry, keyed by slug |
| `projects-empty` / `projects-empty-create` | Empty-state container + its CTA |
| `projects-new-link` | Index-header "New project" link (only rendered when NOT empty) |
| `create-project-form` | The `/projects/new` form |
| `create-project-name` | Name input |
| `create-project-name-hint` | Validation error text |
| `create-project-description` | Description textarea |
| `create-project-error` | Server-side error (e.g. duplicate name) |
| `create-project-submit` | Submit button |

The left-sidebar "New project" control (`components/layout/AppSidebar.tsx:513-519`, AC10 / TC12) has **no `data-testid`** — it's a bare `<Link href="/projects/new" title="New project">`. Locate by accessible name/title, not a fabricated testid.

## ATC map (Candidate TCs only)

| TC | ATC method | Component |
|---|---|---|
| BK-604 | `listProjectsOldestFirstWithNameAndSlug` | `ProjectsPage` |
| BK-605 | `listSingleProjectAtLowerBoundary` | `ProjectsPage` |
| BK-606 | `activateProjectEntryNavigatesToProject` | `ProjectsPage` |
| BK-607 | `showsDescriptionWhenPresentOmitsWhenAbsent` (Outline — called twice, both rows share one `@atc`) | `ProjectsPage` |
| BK-609 | `createProjectFromDedicatedRouteLandsOnProject` | `ProjectsPage` |
| BK-610 | `rejectsShortNameAndPreservesInput` | `ProjectsPage` |
| BK-611 | `acceptsThreeCharacterBoundaryName` | `ProjectsPage` |
| BK-612 | `refusesDuplicateProjectName` | `ProjectsPage` |
| BK-615 | `newProjectNavControlOpensCreateRoute` | `ProjectsPage` |

All 9 are UI actions/assertions — no ATC needed on the API side. `ProjectsApi.createProjectSuccessfully` is a **setup helper** (`@step`, no `@atc`) used only to seed list-scenario preconditions (BK-604/605/607 need 1-3 pre-existing projects) — it has no dedicated TMS Test of its own, mirroring the `AuthApi.checkEmail` / `getCurrentUser` precedent (read/setup helpers stay undecorated by `@atc`).

## kata-manifest.json cross-check

No `ProjectsPage` or `ProjectsApi` component exists yet (checked 2026-08-26). No `@atc('BK-60x')` ID is already taken. Clean to proceed — new components, no duplication risk.
