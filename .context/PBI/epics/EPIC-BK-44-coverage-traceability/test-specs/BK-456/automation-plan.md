# Test Automation Plan: BK-456

> Ticket: BK-456 — BK-45: TC02: should render the minimum populated chain given 1 AC, 1 ATC, 1 Test and 1 Run
> Type: e2e
> Sprint: current (regression-driven, single ATC)
> Created: 2026-08-25

## 1. Ticket Summary

- What to test: single-page render of the minimum non-empty evidence chain (AC -> ATC -> Test -> Run) for a story whose chain depth is exactly 1 at every one of those 4 layers — the lower Boundary Value Analysis case for chain-depth rendering.
- Acceptance Criteria: BK-45 AC-01 (Full chain display), read under its BVA-lower-boundary partition — AC-01's own scenario text says "1 or more" at every layer; TC-02 exercises the "1" edge of that range, distinct from BK-445's "more than 1 somewhere / Defect present" partition.
- Dependencies: Sibling of BK-445 (BK-456 is the ticket BK-445's own `atc/BK-445.md` §6 and `plan.md` explicitly named as the reserved BVA-lower-boundary case — "No BVA owed here — chain-depth boundaries are TC-02 (lower) ... not this TC"). No code dependency — same component, no shared Steps module needed for a single-ATC read-only check.

## 2. Architecture Decisions

### Component Strategy

| Decision | Value | Rationale |
|---|---|---|
| Component | `TraceabilityPage` (`tests/components/ui/TraceabilityPage.ts`) — **existing, extend** | Already registered in `kata-manifest.json` (`components.ui[]`). Same screen `expectChainRenders`/`expectNoStorySelectedPrompt`/`expectNonDisclosureNotFound`/BK-50's export ATCs already live on. |
| Method | `expectMinimalChainRenders` — **new method, not a reuse of `expectChainRenders`** | See "Reuse vs new method" analysis below. |
| Fixture | `{ ui }` | Pure UI verification against already-seeded staging data — no API setup needed inside the test. Same pattern as `BK-445`/`BK-448`/`BK-453`. |
| Test file | `tests/e2e/traceability/renderMinimalChain.test.ts` | New file, verb+Feature naming (`renderFullChain.test.ts` is the sibling for BK-445; `nonDisclosureNotFound.test.ts` for BK-448). |
| Preconditions | Discover, no new seeding (see §4) | The BK-445 fixture story already satisfies this TC's stated precondition verbatim. |

### Reuse vs new method (the Plan's central decision)

`expectChainRenders` (`@atc('BK-445')`) already walks every AC card -> every ATC row -> Test name -> Run status pill -> Defect block, and **requires at least one Defect per Run** as a fixed assertion (`expect(defectCount, ...).toBeGreaterThan(0)`). BK-456's own Gherkin (`atc/BK-456.md` §"Test design" in the synced Test issue) never mentions a Defect at all — its Given clause bounds the chain at "1 acceptance criterion, bound to exactly 1 ATC, 1 Test and 1 Run", and its Then clauses stop at "the Test renders its Run with a status pill". Reusing `expectChainRenders` unmodified would incidentally pass today (the fixture story happens to carry 1 Defect), but it would silently couple BK-456's contract to a layer BK-456 does not own, and would NOT prove the actual regression risk this TC exists for: that the UI's per-layer loop tolerates the single-row array case (`array.length === 1`) rather than a hidden `>= 2` assumption. `expectChainRenders`'s existing assertions only ever check `count > 0` (n-or-more), never `count === 1` (exactly-one) — that distinction is the entire point of a BVA-lower-boundary TC, and merging it into the N-or-more method would mean the boundary is never actually exercised as a boundary.

Conclusion: **new method**, same component, same story fixture, deliberately narrower and boundary-exact assertions. This mirrors the BK-448 precedent (new method on the same component rather than stretching an existing one whose contract didn't match).

### [E2E ONLY] UI Elements

| Element | Locator Strategy | Locator Value | Status |
|---|---|---|---|
| Chain view root | `data-testid` | `traceability-chain-view` | Confirmed (component docblock, reused from BK-445/BK-448/BK-453) |
| Per-AC card | `data-testid` | `traceability-ac-{acId}` | Confirmed |
| Per-ATC row | `data-testid` | `traceability-atc-row-{atcId}` | Confirmed |
| ATC title | CSS class (no testid) | `div.truncate.text-fg-1` (1st col, scoped under ATC row) | Confirmed via BK-445's live DOM inspection — reused verbatim, same component/build |
| ATC layer badge | CSS class (no testid) | `span.status-chip` (1st col, text content) | Confirmed via BK-445's live DOM inspection — reused verbatim |
| Test name | CSS class (no testid) | `span.truncate.text-fg-2` (2nd col) | Confirmed via BK-445's live DOM inspection — reused verbatim |
| Run status pill | CSS class (no testid) | `span.status-chip` (3rd col, `.nth(1)` among `status-chip`s in the row) | Confirmed via BK-445's live DOM inspection — reused verbatim |

No new selectors are being introduced — every locator this ATC needs was already empirically confirmed while coding BK-445 against this exact component and this exact fixture story. Nothing here is being asserted "unconfirmed" going into Code phase; the only genuinely new work in Code phase is the exact-count (`=== 1`) assertions, which are new expression, not new selectors.

## 3. ATC Registry

### Existing ATCs (Reuse)

None reused as-is. `expectChainRenders` (`@atc('BK-445')`) is read for selector precedent only, not called from the new method (ATCs never call ATCs, and this is a new, narrower ATC regardless).

### New ATCs (Create)

| ATC ID | Component | Method | Description |
|---|---|---|---|
| `BK-456` | `TraceabilityPage` | `expectMinimalChainRenders` | New method. Opens the chain view for a story with an exactly-1-deep chain through Run, and asserts (a) exactly one AC card, (b) exactly one ATC row within it, (c) that row's title/layer badge/Test-name/Run-status-pill cells are all non-empty. No Defect assertion (out of this TC's stated scope; the fixture story's incidental Defect is neither asserted present nor absent). |

### New Helpers (No @atc)

None. Single-use traversal, inline per the locators-inline rule (same call as BK-445 — evaluate extraction only once reused 2+ times).

## 4. Test Data Strategy

| Precondition | Pattern | Feasibility | Notes |
|---|---|---|---|
| Story with exactly 1 AC -> 1 ATC -> 1 Test -> 1 Run | **Discover (already resolved — reuse, no new seeding)** | Feasible | The BK-445 fixture story (`bk-45-traceability-fixtures` project, story `cb997c18-3b51-45e3-8a16-84d7aa3bd222`) is 1 AC (`820b8d2f-a076-4a96-bb29-a34eaefaea04`) -> 1 ATC (`06391422-2283-4688-995b-74f39f6cb564`) -> 1 Test (`63a40920-1c90-4650-995b-9008b6331a3f`) -> 1 Run (`bad5feff-aa28-4bc2-b814-b72f558625f4`, Failed/closed). That is an EXACT structural match for BK-456's stated precondition ("exactly 1 acceptance criterion, bound to exactly 1 ATC, 1 Test and 1 Run") — the precondition never mentions Defect count, so the fixture's 1 linked Defect (required by BK-445, incidental here) does not disqualify reuse. Per BK-445's own automation-plan.md §4: "Other BK-45 TCs needing a different chain shape must add a new sibling Story, not mutate this one" — BK-456 does NOT need a different chain shape, so no new Story is added. Seeding a second story purely to strip the Defect layer would add maintenance surface for zero contract benefit, since BK-456 never asserts Defect absence either. |
| Authenticated viewer+ session | **Discover (existing)** | Feasible | Reuse the already-authenticated staging session pattern via `config.testUser` from `@variables`/`.env` (`STAGING_USER_EMAIL`/`STAGING_USER_PASSWORD`, resolving to `bunkai-staging-qa3@olkacoraug.resend.app`, Owner of the fixture workspace — satisfies "viewer or above"). Never hardcoded. |

No Modify/Generate needed — read-only verification against pre-existing seeded state (same story BK-445 already uses live), no cleanup/teardown.

## 5. Test Scenarios

### File: `tests/e2e/traceability/renderMinimalChain.test.ts`

Fixture: `{ ui }`

#### Scenario 1: minimum populated chain renders exactly (lower BVA boundary)

Test: `"BK-456: should render the minimum populated chain when a story has exactly 1 AC, 1 ATC, 1 Test and 1 Run"`
Preconditions: reuse the BK-445 fixture story (already satisfies the exact-1-per-layer precondition, no Discover query needed at runtime beyond the known constants — same pattern `renderFullChain.test.ts` established: module-level `FIXTURE_PROJECT_SLUG` / `FIXTURE_STORY_ID` constants with an origin comment).
ATCs called: `TraceabilityPage.expectMinimalChainRenders({ projectSlug, userStoryId })` — `@atc('BK-456')`.
Test-level assertions: none beyond what the ATC itself asserts — single-ATC boundary check, no flow-level comparison.
Teardown: none — read-only.

## 6. Open Questions

None blocking. All locators are reused verbatim from BK-445's already-empirically-confirmed set (same component, same build, same fixture story) — nothing new to probe live before Code phase. The only implementation-time decision is the exact-count (`toHaveCount(1)`-style) assertion shape, which is a code-writing detail, not an open question about the environment or data.

## 7. Implementation Order

- [ ] Add `expectMinimalChainRenders` to `TraceabilityPage` (`@atc('BK-456')`), asserting exactly 1 AC card, exactly 1 ATC row inside it, and non-empty ATC title / layer badge / Test name / Run status pill cells — no Defect assertion.
- [ ] Create `tests/e2e/traceability/renderMinimalChain.test.ts` using `{ ui }`, reusing the BK-445 fixture constants (`FIXTURE_PROJECT_SLUG` / `FIXTURE_STORY_ID` values).
- [ ] Run tests and validate (`bun run test`, `bun run types:check`, `bun run lint:check`).
- [ ] `bun run kata:manifest` + stage `kata-manifest.json` (confirms `BK-456` lands cleanly, 18 total ATCs, no duplicates).
- [ ] Update TMS status BK-456 -> In Automation via `/test-documentation`.

## 8. Success Criteria

- [ ] AC-01 covered at its BVA-lower-boundary partition — distinct from BK-445's "fully populated / Defect-required" partition. No further BVA owed by this TC at the lower end; the upper chain-depth boundary (TC-03, "50+ ATCs") is a separate, not-yet-real Jira Test.
- [ ] KATA compliance (inline locators, `@atc` on the state-verifying method only, no ATC-calls-ATC).
- [ ] Fixture correct (`{ ui }`, no browser-less API-only path needed).
- [ ] No hardcoded waits.
- [ ] Aliases used (`@ui/`, `@utils/`, `@TestContext`, `@variables`).
- [ ] Tests pass locally against staging.
- [ ] TMS marked Automated once Review passes.
