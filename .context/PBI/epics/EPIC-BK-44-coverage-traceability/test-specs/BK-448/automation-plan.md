# Test Automation Plan: BK-448

> Ticket: BK-448 — BK-45: TC16: should return an identical non-disclosure response given foreign-workspace or nonexistent story
> Type: e2e
> Sprint: current (regression-driven, single parametrized ATC, partially blocked)
> Created: 2026-08-25

## 1. Ticket Summary

- What to test: two negative inputs to the traceability route (a real foreign-workspace story, a random nonexistent story ID) must return the byte-identical uniform 404 "User story not found." response, with zero chain data anywhere (DOM or network payload).
- Acceptance Criteria: BK-45 AC-05, second scenario (cross-workspace access) — reworded by the ATP's own recommendation to "uniform 404 (non-disclosure)" rather than a literal 403.
- Dependencies: Row 1 needs a second staging workspace — currently not constructible (Settings → Members = "Coming soon"). Row 2 has no dependency.

## 2. Architecture Decisions

### Component Strategy

| Decision | Value | Rationale |
|---|---|---|
| Component | `TraceabilityPage` (`tests/components/ui/TraceabilityPage.ts`) — **existing, extend** | Same screen `expectChainRenders`/`expectNoStorySelectedPrompt`/BK-50's export+auth ATCs already live on. Registered in `kata-manifest.json`. |
| Method | `expectNonDisclosureNotFound` — **new** | No existing UI-layer ATC covers this. `TraceabilityApi.expectMismatchedPairNotFound` (`@atc('BK-109')`, a documented placeholder) covers the same *mismatched-pair 404* assertion at the pure-API layer (status 404, `error.code === 'not_found'`) — but BK-448's own Test Design explicitly demands more: a live browser navigation and a DOM assertion that zero chain data renders, which a pure API call cannot prove. See §"Duplicate check" below — this is a promotion opportunity for the docstring's forward-reference, not a literal duplicate. |
| Fixture | `{ ui }` | Pure UI navigation + DOM/network assertion. No API setup needed inside the test (no fixture data to seed for row 2; row 1 is parked, not coded). |
| Test file | `tests/e2e/traceability/nonDisclosureNotFound.test.ts` | New file — no existing e2e spec covers this scenario. |
| Preconditions | Discover (row 2: none needed, generate a random UUID at runtime) | Row 1 has no Discover path — the data does not exist and cannot be created (see Blockers in `spec.md`). |

### Duplicate check (mandatory pre-flight, run before proposing new code)

Cross-checked `kata-manifest.json` (`components.api[].atcs[]`, `components.ui[].atcs[]`) and the BK-50 sibling story (`STORY-BK-50-.../test-cases/README.md`) for an already-automated TC covering this exact Precondition + Action + Assertions:

1. **`kata-manifest.json`** — `BK-448` does not appear anywhere in the registry (no ID collision). The closest neighbor is `BK-109` (`TraceabilityApi.expectMismatchedPairNotFound`) — but that is (a) a **placeholder ID**, not a real automated Jira Test, and (b) **API-only**: it never opens a browser, never asserts on the DOM. BK-448's own Gherkin ("the member opens ..." + "zero chain data ... in the DOM") is explicitly UI-level. Not a duplicate — a distinct, currently-unautomated scenario. The component's own docblock names BK-448 as `BK-109`'s eventual real-ID replacement; that forward-note is **only partially right** — BK-448 supersedes BK-109's *coverage intent* but not its *code*, because the UI-level DOM assertion BK-448 requires is strictly broader than what BK-109's API-only body checks. Recommendation (non-blocking, flag only): once BK-448 lands, retire `BK-109`'s "eventually replaced by BK-448" docstring language — the two stay separate ATCs at separate layers (API vs UI), each earning its keep (API ATC = fast regression guard on the RPC error mapping; UI ATC = the DOM/network non-disclosure proof neither the API test nor the unit test can give). This is the corrected framing; not an ADR — layer separation is inherent to KATA (`ApiBase` vs `UiBase`), not a new architectural decision.
2. **BK-50 sibling story** (`STORY-BK-50-.../test-cases/README.md`, Stage 4 report) — checked for a cross-story duplicate the way BK-447/BK-334 turned out to be. Found the **opposite** of a duplicate: BK-50 identified the identical scenario pair (`TC-BK50-09` foreign-workspace, `TC-BK50-10` nonexistent-story) and explicitly **Deferred both**, never created as Jira Tests, never automated — TC-09 blocked by the same "no second workspace" gap this plan hits; TC-10 deferred as "marginal addition" (already asserted at DB-integration level + by BK-50's own TC05 route-envelope test). **Conclusion: nothing already automated does what BK-448 asks for at the UI layer.** BK-448 is genuinely new work, not a duplicate to close via traceability link.

**Verdict: NOT a duplicate. Proceed to design new code for the unblocked row only (row 2).**

## 3. ATC Registry

### Existing ATCs (Reuse)

None directly reused as a base — `expectChainRenders`, `expectNoStorySelectedPrompt`, `expectAnonymousRedirectToLogin`, `exportSnapshot`, `expectNoShareAffordance` are all distinct scenarios on the same component; none implements a 404/non-disclosure check. `goto()` (existing `@step` navigation helper) is reused for the navigation itself where it fits the interception timing (see §6 open question — may need a bespoke navigation + response-wait sequence instead of the plain `goto()` helper, since the assertion needs the traceability fetch response captured, not just page load).

### New ATCs (Create)

| ATC ID | Component | Method | Description |
|---|---|---|---|
| `BK-448` | `TraceabilityPage` | `expectNonDisclosureNotFound` | Navigate to the traceability route with a target story ID that is either foreign-workspace or nonexistent; assert the network response is a uniform 404 "User story not found." and that zero chain-layer DOM nodes render. Parametrized by `targetStoryId` + a descriptive label for the test-file `describe`/`test` name — one method, two callers (one coded, one `test.fixme`'d), per the Test Design doctrine's EP-merge rule (same action, same outcome → one ATC, not two). |

### New Helpers (No @atc)

None planned. If capturing the traceability fetch response needs a repeated wait-pattern (used only once here), keep it inline in the ATC body per the inline-locator/inline-logic rule — do not pre-extract a helper for a single call site.

## 4. Test Data Strategy

| Precondition | Pattern | Feasibility | Notes |
|---|---|---|---|
| Random nonexistent story UUID (row 2) | **Generate** | Feasible now | `crypto.randomUUID()` or the repo's faker helper — no persistence, no cleanup, guaranteed no collision with a real row. |
| Foreign-workspace real story (row 1) | **Discover** (blocked) | **Not feasible today** | Needs a second workspace with membership control — Settings → Members is "Coming soon" on this build (confirmed 3× independently: BK-45 TC-15/TC-16 Stage 2 execution, BK-50 TC-09 Stage 4 deferral, and this session's own `.env` check showing only one `STAGING_USER_*` identity exists). No Generate path exists either — workspace creation/invite is a product-UI gap, not something test setup can route around via API (no documented `[API_TOOL]` endpoint for workspace-membership seeding was found in this pass; would need a fresh OpenAPI check if unblocked). |
| Authenticated member session (either row) | **Discover** (existing) | Feasible | Reuse the standard authenticated staging session pattern (`config.testUser` from `@variables`, `.env` `STAGING_USER_EMAIL`/`PASSWORD`). |

No Modify needed. No teardown — read-only navigation, no mutation.

## 5. Test Scenarios

### File: `tests/e2e/traceability/nonDisclosureNotFound.test.ts`

Fixture: `{ ui }`

#### Scenario 1: nonexistent story ID returns uniform 404, zero leak (CODE NOW)

Test: `"BK-448: should return a uniform 404 non-disclosure response for a nonexistent story ID"`
Preconditions: Generate a random UUID with no matching row.
ATCs called: `TraceabilityPage.expectNonDisclosureNotFound({ projectSlug, targetStoryId: randomUUID() })` — `@atc('BK-448')`.
Test-level assertions: none beyond the ATC (single-scenario, no flow comparison).
Teardown: none — read-only, nothing generated persists server-side.

#### Scenario 2: foreign-workspace story returns the identical uniform 404 (PARKED)

Test: `"BK-448: should return a uniform 404 non-disclosure response for a foreign-workspace story"` — write as `test.fixme('BK-448: ...', async ({ ui }) => { ... })` with a leading comment citing this plan's Blockers section and linking BK-50 TC-09 / BK-45 TC-15. Do not delete or omit the scenario — `test.fixme` keeps it visible in the suite/report as a known gap, not silently missing.
Un-parking trigger: Settings → Members ships a real invite/second-workspace-membership path on staging.

## 6. Open Questions — RESOLVED empirically during Code phase (2026-08-25, live against staging)

1. **Message-assertion target: RESOLVED — neither network response nor DOM text; mechanism does not exist on this build.** Live probe (qa3 session, `playwright-cli`, `bk-45-traceability-fixtures` project, random nonexistent UUID) found: the traceability route is a single SSR document navigation that always returns HTTP 200 (confirmed via full request-log inspection — request #1 in the log is the navigation itself, `=> [200]`), whether the story resolves or not. The underlying `GET /v1/projects/{id}/traceability?story={id}` 404 (already asserted at the API layer by `TraceabilityApi.expectMismatchedPairNotFound`, `@atc('BK-109')`) happens server-side and is **never exposed as a client-observable network response** — no `/v1/projects/.../traceability` XHR ever fires, and there is no Retry control on this route's not-found state to trigger one. The literal string "User story not found." does not appear anywhere in the DOM (`document.body.innerHTML.includes('User story not found')` = `false`). **Corrected conclusion: this ATC cannot and should not assert a literal message or a captured 404 response — that assertion already lives at the API layer (BK-109). The UI layer's provable contract is the DOM non-disclosure state.**
2. **Zero-chain-data DOM assertion scope — RESOLVED, and the DOM testid itself was wrong.** The component docblock's assumed `[data-testid="traceability-error"]` / `[data-testid="traceability-retry"]` do NOT exist on this route today (confirmed absent via `innerHTML.includes(...)` = `false` for both). The actual client-rendered state is the shared app-wide `[data-testid="workbench-not-found"]` component (heading "This item is no longer available", body "It may have been deleted, or you don't have access to it. The rest of the project is still here.", a "Back to project" link — no Retry). `expectNonDisclosureNotFound` asserts `workbench-not-found` visible, `traceability-chain-view` not visible, and zero-count on both `traceability-ac-*` and `traceability-atc-row-*` node selectors — confirmed against a live success-case page (`traceability-chain-view` + real `traceability-ac-{id}`/`traceability-atc-row-{id}` nodes DO render for an accessible story, proving the selectors are real and the negative-case zero-count is meaningful, not a typo'd selector that would trivially always pass).
3. **`goto()` reuse — RESOLVED: reused as-is.** Since no response-wait is needed (finding #1 — there is nothing to wait for), the new ATC calls the existing `@step goto()` helper directly rather than inlining a bespoke `Promise.all` navigation; the timing-contract concern that motivated this open question does not apply once the network-interception premise itself was found false.

### Row 1 (foreign-workspace) — re-probed live, BLOCKED for a DIFFERENT exact reason than previously recorded

Since this plan was written, `qa3` was discovered to now own its own workspace ("QA Automation Workspace" / project `bk-45-traceability-fixtures`), which looked like it might finally supply a genuine second workspace to test cross-workspace non-disclosure against. Probed live:

- `https://staging-upexbunkai.vercel.app/projects/bk-23-test-project` (the legacy/original workspace's only project) → Next.js app-shell **"404: This page could not be found."** — the bare framework 404, confirmed via page title + snapshot showing only the app shell/sidebar (still authenticated as `qa3`) with no `workbench-not-found`, no `traceability-*` testid, nothing app-level rendered — this 404 fires before the `/traceability` route or any of its components ever mount.
- Same result whether or not a `?story=` suffix is appended — the project shell itself is unreachable to `qa3`, not just the story within it.
- `qa3` therefore has exactly ONE reachable project (`bk-45-traceability-fixtures`). Any story ID probed against it that doesn't belong to it is a **same-project mismatch** — functionally and observably identical to the nonexistent-UUID case already coded (both hit `workbench-not-found`), never a genuine cross-*workspace* case, because there is no second reachable project to host a "real but foreign" story.

**Corrected verdict**: Row 1 remains BLOCKED, but the root cause is no longer "no second workspace exists at all" (one now does) — it is "the only project belonging to that second/legacy workspace is itself unreachable at the project-shell level, before the traceability route is ever reached, so there is no way to pair a resolvable project shell with a genuinely foreign story." `test.fixme` retained with this corrected reason; un-parking trigger updated to "a second WORKSPACE with a reachable PROJECT exists," not merely "a second workspace exists."

## 7. Implementation Order

- [ ] Resolve open question §6.1 (network-interceptability of the traceability fetch on first paint) via a live `origin/staging` DOM/network probe, same method BK-445's Code phase used.
- [ ] Write `TraceabilityPage.expectNonDisclosureNotFound(args: { projectSlug: string, targetStoryId: string })` — `@atc('BK-448')`, asserting response status 404 + message per §6.1's resolved mechanism, and zero chain-view visibility.
- [ ] Create `tests/e2e/traceability/nonDisclosureNotFound.test.ts` with Scenario 1 (coded) and Scenario 2 (`test.fixme`, blocker comment).
- [ ] Run tests and validate (`bun run test`, `bun run types:check`, `bun run lint:check`) — only Scenario 1 executes; `test.fixme` reports as expected-skip, not a failure.
- [ ] `bun run kata:manifest` + stage `kata-manifest.json`.
- [ ] Update TMS status BK-448 → In Automation (partial, row 2 only) via `/test-documentation`; leave a comment noting row 1's park + un-parking trigger.

## 8. Success Criteria

- [ ] AC-05 (second scenario) partition covered for the unblocked input (nonexistent story) — the floor for this TC's runnable half.
- [ ] Row 1 (foreign-workspace) explicitly and visibly parked, not silently dropped — traceable to this plan's Blockers section.
- [ ] KATA compliance (inline logic, `@atc` on the one state-verifying method, no ATC-calls-ATC, max 2 positional params via object param).
- [ ] Fixture correct (`{ ui }`).
- [ ] No hardcoded waits — response captured via `waitForResponse`/`waitForEvent`, not `waitForTimeout`.
- [ ] Aliases used (`@ui/`, `@utils/`, `@TestContext`, `@variables`, `@playwright/test`).
- [ ] Scenario 1 passes on staging; Scenario 2 remains a tracked `fixme`.
- [ ] TMS marked "In Automation" (not "Automated") until row 1 unblocks — do not mark the TC fully Automated while one Example row is parked.
