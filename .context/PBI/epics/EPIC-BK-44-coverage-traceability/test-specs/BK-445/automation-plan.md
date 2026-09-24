# Test Automation Plan: BK-445

> Ticket: BK-445 — BK-45: TC01: should render the full 5-layer chain for a fully covered story
> Type: e2e
> Sprint: current (regression-driven, single ATC)
> Created: 2026-08-24

## 1. Ticket Summary

- What to test: single-page render of the full evidence chain (AC → ATC → Test → Run → Defect) for a story with complete coverage on every AC.
- Acceptance Criteria: BK-45 AC-01 (Full chain display, covered story).
- Dependencies: None — this is the first BK-445..BK-464 real-ID ATC to land against `TraceabilityPage`. It sets the precedent the remaining 19 will follow.

## 2. Architecture Decisions

### Component Strategy

| Decision | Value | Rationale |
|---|---|---|
| Component | `TraceabilityPage` (`tests/components/ui/TraceabilityPage.ts`) — **existing, extend** | Already registered in `kata-manifest.json` (`components.ui[]`). No new Page class — this is the same screen `expectChainRenders`/`expectNoStorySelectedPrompt`/BK-50's export ATCs already live on. |
| Method | `expectChainRenders` — **existing, upgrade in place** | Currently decorated `@atc('BK-110')`, a documented placeholder (see the component's own docblock: "BK-110/BK-111 below are PLACEHOLDER IDs — no real Jira Test issue exists yet... The real BK-45 Test issues (BK-445..BK-464) are the ones that should eventually replace them"). Its current body only asserts `[data-testid="traceability-chain-view"]` is visible — a shallow check, not what BK-445's own AC-01 demands (every AC/ATC/Test/Run/Defect cell individually verified). Reuse the method identity (same Precondition + Action = same TC per the ATC Identity Rule), replace the decorator `BK-110` → `BK-445`, and expand the assertion body to the full 5-layer check. |
| Fixture | `{ ui }` | Pure UI verification against already-seeded staging data — no API setup needed inside the test. |
| Test file | `tests/e2e/traceability/renderFullChain.test.ts` | New file — no existing e2e spec covers this ATC yet (`tests/e2e/traceability/` was not found on disk in this session; BK-50's plan only sketches signatures, no test files confirmed present). |
| Preconditions | Discover (see §4) | Data already exists on staging; no Generate/Modify needed. |

### [E2E ONLY] UI Elements

| Element | Locator Strategy | Locator Value | Status |
|---|---|---|---|
| Chain view root | `data-testid` | `traceability-chain-view` | Confirmed (component docblock, verified against `origin/staging`) |
| Per-AC card | `data-testid` | `traceability-ac-{acId}` | Confirmed |
| Per-ATC row | `data-testid` | `traceability-atc-row-{atcId}` | Confirmed |
| ATC layer badge (UI/API/Unit) | unknown | — | **Not confirmed — open question, see §6** |
| Test name (per ATC) | unknown | — | **Not confirmed — open question, see §6** |
| Latest-run status pill | unknown | — | **Not confirmed — open question, see §6** |
| Defect id/title/status | unknown | — | **Not confirmed — open question, see §6** |

### ADR-candidate (flag only — do not create)

The `BK-110`→`BK-445` decorator swap this ticket performs is the **first instance** of a pattern that will repeat 19 more times (BK-456, BK-457, BK-458, BK-459, BK-460… through BK-464, plus BK-446–BK-455 for the remaining ATP outlines). Two things are architectural and hard to reverse once 2-3 more tickets land the same way:

1. **Placeholder-ID retirement policy** — whether every future BK-45 TC continues to "graduate" a `TraceabilityPage` placeholder ATC (BK-110/BK-111) into its real ID one at a time, or whether the placeholders get retired in one batch, and how `kata-manifest.json`'s freshness gate is expected to handle an ID that disappears from the registry mid-epic (it is not a duplicate, but a rename — the gate has not been exercised against that case before).
2. **Shared seeded-fixture reuse across 20 TCs** — `bk-45-fixtures`'s story `d57804e8-…` and the BK-35 retest-anchor story `27223d20-…` are both referenced by name across multiple TC preconditions (§4 discusses which one BK-445 itself resolves to). If a `TraceabilitySteps` module or a shared `DataFactory` entry ends up seeding/discovering this fixture set for 3+ of the remaining ATCs, that reuse contract is exactly the kind of fixture-lifecycle decision the doctrine promotes to an ADR.

Per Gotcha #17 / `agentic-qa-core/references/adr-doctrine.md`, this plan **flags** both candidates rather than deciding them — a standalone `.context/ADR/ADR-NNNN-<slug>.md` should be authored once the second or third TC in this batch is actually coded and the pattern is confirmed, not preemptively on TC01 alone.

## 3. ATC Registry

### Existing ATCs (Reuse — decorator swap, not a new component)

| ATC ID | Component | Method | Description |
|---|---|---|---|
| ~~BK-110~~ → **BK-445** | `TraceabilityPage` | `expectChainRenders` | Placeholder retired; body expanded from container-visibility-only to the full 5-layer assertion set BK-445's own AC-01 requires. |

### New ATCs (Create)

None. No new component, no new decorator ID beyond the BK-110→BK-445 swap above.

### New Helpers (No @atc)

None planned for this ticket. If the expanded assertion body needs a repeated per-AC-card traversal helper (e.g. iterating every `traceability-ac-{acId}` and asserting its nested rows), evaluate during Code phase whether it is reused 2+ times inside the class before extracting — per the inline-locator rule, a single-use traversal stays inline in the ATC body.

## 4. Test Data Strategy

| Precondition | Pattern | Feasibility | Notes |
|---|---|---|---|
| Story with every AC bound through AC→ATC→Test→Run→Defect | **Discover** (resolved — see fixture identity below) | Feasible | Neither prior candidate (`bk-45-fixtures` `d57804e8-…`, 0 defects; BK-35 retest-anchor `27223d20-…`, since drifted) satisfied the precondition at Code-phase time. Resolved by seeding a brand-new, dedicated workspace + project + story owned by the `.env`-driven test account itself, so no other session can drift its chain shape: workspace "QA Automation Workspace" (owner `bunkai-staging-qa3@olkacoraug.resend.app`), project slug `bk-45-traceability-fixtures`, story "QA Fixture: full coverage story for BK-45 automation" (`cb997c18-3b51-45e3-8a16-84d7aa3bd222`) — 1 AC (`820b8d2f-a076-4a96-bb29-a34eaefaea04`) → 1 ATC (`06391422-2283-4688-995b-74f39f6cb564`) → 1 Test (`63a40920-1c90-4650-995b-9008b6331a3f`) → 1 Run, Failed/closed (`bad5feff-aa28-4bc2-b814-b72f558625f4`) → 1 linked open Defect. Referenced as fixture constants in `renderFullChain.test.ts` (`FIXTURE_PROJECT_SLUG`, `FIXTURE_STORY_ID`) with a short origin comment — this project's sole purpose is BK-45 fixtures, so it is legitimate fixture data, not a hardcoded discovery shortcut. Other BK-45 TCs needing a different chain shape must add a new sibling Story, not mutate this one. |
| Authenticated viewer+ session | **Discover** (existing) | Feasible | Reuse the already-authenticated staging session pattern via `config.testUser` from `@variables`/`.env` (`STAGING_USER_EMAIL`/`STAGING_USER_PASSWORD`, resolving to `bunkai-staging-qa3@olkacoraug.resend.app`, Owner of the fixture workspace — satisfies "viewer or above"). Never hardcoded. |

No Modify/Generate needed — this ATC is read-only verification against pre-existing seeded state, and no cleanup/teardown is required since nothing is mutated.

## 5. Test Scenarios

### File: `tests/e2e/traceability/renderFullChain.test.ts`

Fixture: `{ ui }`

#### Scenario 1: full 5-layer chain renders for a fully covered story (happy path)

Test: `"BK-445: should render the full 5-layer chain when a story has complete AC-ATC-Test-Run-Defect coverage"`
Preconditions: Discover a story satisfying every AC → ATC → Test → Run → Defect (see §4).
ATCs called: `TraceabilityPage.expectChainRenders({ projectSlug, userStoryId })` — `@atc('BK-445')`.
Test-level assertions: none beyond what the ATC itself asserts (fixed assertions live inside the ATC per the Fixed vs Test-level split — this is a single-ATC happy-path test with no flow-level comparison).
Teardown: none — read-only.

## 6. Open Questions — RESOLVED during Code phase

1. **Missing `data-testid` coverage for 4 of the 7 sub-cells.** Confirmed via live DOM inspection against the fixture story (see component docblock for the full mapping): no `data-testid` exists for ATC title, ATC layer badge, Test name, Run status pill, or Defect block — all are positional/CSS-class selectors scoped under the confirmed `[data-testid="traceability-atc-row-{atcId}"]` root. The defect ID is never rendered in the DOM; only title + status are asserted, per the component docblock and this ticket's own instructions.
2. **Which story UUID Code phase Discovered against** — resolved. See §4 fixture identity (`bk-45-traceability-fixtures` / `cb997c18-3b51-45e3-8a16-84d7aa3bd222`), seeded specifically for this purpose in a dedicated workspace owned by the `.env`-driven test account.
3. **ADR candidates** — see §2 "ADR-candidate" box. Not blocking; noted for a future framework-development session once the pattern repeats.

## 7. Implementation Order

- [ ] Discover the current staging story satisfying the full 5-layer precondition (resolve open question §6.2).
- [ ] Confirm the 4 missing `data-testid`s (resolve open question §6.1) via a fresh `origin/staging` component read or a live DOM probe.
- [ ] Swap `TraceabilityPage.expectChainRenders`'s decorator `@atc('BK-110')` → `@atc('BK-445')` and expand its JSDoc.
- [ ] Expand `expectChainRenders`'s assertion body: per-AC title, per-ATC title + layer, per-Test name, per-Test latest-run status pill, per-Run linked defect(s).
- [ ] Create `tests/e2e/traceability/renderFullChain.test.ts` using `{ ui }`.
- [ ] Run tests and validate (`bun run test`, `bun run types:check`, `bun run lint:check`).
- [ ] `bun run kata:manifest` + stage `kata-manifest.json` (confirms the BK-110→BK-445 rename is picked up cleanly).
- [ ] Update TMS status BK-445 → In Automation via `/test-documentation`.

## 8. Success Criteria

- [ ] AC-01 covered — the floor, not the bar. This is the AC's own "positive/full coverage" partition; no risk-beyond-AC exploration is owed by this single TC (BK-45's ATP already assigns the negative/boundary/state-transition risk to the other 19 outlines — TC-02 through TC-26 — so BK-445 stays scoped to its one EP partition per the ATP's own technique-derivation table).
- [ ] No BVA owed here — chain-depth boundaries are TC-02 (lower) and TC-03 (upper), not this TC.
- [ ] KATA compliance (inline locators, `@atc` on the state-verifying method only, no ATC-calls-ATC).
- [ ] Fixture correct (`{ ui }`, no browser-less API-only path needed).
- [ ] No hardcoded waits.
- [ ] Aliases used (`@ui/`, `@utils/`, `@TestContext`, `@variables`).
- [ ] Tests pass locally against staging.
- [ ] TMS marked Automated once Review passes.
