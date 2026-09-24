# Test Automation Plan: BK-447

> Ticket: BK-447 — BK-45: TC14: should redirect an unauthenticated user to login with no chain data rendered first
> Type: e2e
> Sprint: current (regression-driven, single ATC)
> Created: 2026-08-25

## 1. Ticket Summary

- What to test: unauthenticated navigation to the traceability screen redirects to `/login` before any chain data paints or is fetched.
- Acceptance Criteria: BK-45 AC-05, first scenario ("Unauthenticated user attempts to access a traceability view").
- Dependencies: None on unavailable staging data (see `spec.md` "Precondition data status" — confirmed empirically, not assumed). One **decision dependency**: §2 below.

## 2. Architecture Decisions — and the decision this plan does NOT make silently

### Component Strategy

| Decision | Value | Rationale |
|---|---|---|
| Component | `TraceabilityPage` (`tests/components/ui/TraceabilityPage.ts`) — existing, no change | Already registered in `kata-manifest.json`. Same screen every other BK-45/BK-50 ATC in this component lives on. |
| Method | `expectAnonymousRedirectToLogin` — **already implements this exact scenario, already decorated `@atc('BK-334')`** | Opens a fresh unauthenticated browser context, navigates the given path, waits for `/login` redirect (asserting `next=<path>`), and asserts `traceability-chain-view` never becomes visible. This is BK-447's own Precondition + Action + Assertions, verbatim. |
| Fixture | `{ ui }` (the method itself opens its own anonymous context internally — does not consume the shared authenticated `page`) | Matches the existing `BK-50: should redirect an unauthenticated browser...` test in `traceabilityAccess.test.ts`. |

### The reuse question this plan surfaces instead of deciding

`kata-manifest.json` was cross-checked (Critical Rule #12) before writing this plan. `BK-447` does **not** appear anywhere in `components.api[].atcs[]` or `components.ui[].atcs[]` — so a literal ID-collision check passes. But a **semantic** duplicate exists: `BK-334` already covers the identical scenario. This is different from the BK-445/BK-453 precedent (both of those "promoted" a `TraceabilityPage` **placeholder** ID — `BK-110`/`BK-111` — that the component's own docblock says "no real Jira Test issue exists yet" for). `BK-334` is not a placeholder: it is BK-50's own real, already-shipped TC04, coded and lint/type-clean in a prior session (`.session/test-automation/BK-50/progress.md`, Phase 2, 2026-08-16). Swapping its decorator to `@atc('BK-447')` the way BK-110→BK-445 and BK-111→BK-453 were swapped would silently sever BK-50's own traceability to a TC it already owns and has an existing `test()` titled `'BK-50: should redirect an unauthenticated browser to login without rendering data'` for — a destructive, hard-to-reverse rename of a live ID, not a placeholder graduation. This plan does not make that call unilaterally.

**Two options, presented — pick one before Phase 2 (there may be no Phase 2 at all under Option A):**

- **Option A — Traceability-only, no new test code (recommended default).** Leave `expectAnonymousRedirectToLogin` and its `@atc('BK-334')` decorator untouched. Record in the TMS that BK-447 is satisfied by the same automated check as BK-334 (e.g. via `/fix-traceability`, an Xray "is duplicated by" / "tests" link, or a shared ATS entry covering both Story ATPs) rather than writing a second `test()` that re-runs byte-identical assertions under a different title. This is the doctrine-correct outcome of the TC Identity Rule + EP-merge principle applied across Stories, not just within one TC's input space — running the same Precondition+Action+Assertions twice adds CI time and a second point of flakiness for zero additional coverage.
- **Option B — Independent test-file entry, same ATC identity.** Add one more `test()` to `tests/e2e/traceability/traceabilityAccess.test.ts` (or a new file, see §5), titled with `BK-447` per naming rule #14, calling the same `ui.traceability.expectAnonymousRedirectToLogin(path)` method. No new component code, no new decorator. Accept that the ATC execution reported to the TMS via the tracing NDJSON will show under `@atc('BK-334')`, not `BK-447` — the decorator identifies the underlying check, not every Jira Test issue that happens to describe it — and that BK-447's own TMS status would need to be set to Automated by cross-reference (comment/link to BK-334's run), not by an NDJSON entry carrying its own key. Pick this only if the team wants BK-447 to show a literal `test()` line in the suite for audit/readability reasons, independent of the TMS-linking question.

Neither option requires a new `@atc` ID or a new component method. The choice is purely about whether a second, functionally-redundant `test()` gets written — a call for the user/QA lead, not for this plan to make alone.

### ADR-candidate (flag only — do not create)

Cross-story TC duplication against a shared UI component is a pattern likely to recur for the rest of BK-45's TC batch (TC-BK45-14 through TC-BK45-26) wherever a BK-45 outline overlaps a BK-50 outline on the same screen (both Stories share `TraceabilityPage`). If a second instance of "two real Jira Test IDs, same Precondition+Action+Assertions, different Story" turns up while automating another BK-45 TC, that is the point to promote this into a standing rule (e.g. "the ATC identity is owned by whichever real ID shipped first; later TCs describing the same check link, they do not duplicate") rather than re-litigating it ticket by ticket. Not promoted to an ADR now — one instance is a finding, not yet a pattern (per Gotcha #17 / `adr-doctrine.md`).

## 3. ATC Registry

### Existing ATCs (Reuse — no code change under Option A; test-file-only addition under Option B)

| ATC ID | Component | Method | Description |
|---|---|---|---|
| `BK-334` (unchanged) | `TraceabilityPage` | `expectAnonymousRedirectToLogin` | Already implements BK-447's exact scenario. No decorator swap — `BK-334` is a real, already-shipped ID, not a placeholder. |

### New ATCs (Create)

None. No new component, no new decorator ID.

### New Helpers (No @atc)

None.

## 4. Test Data Strategy

| Precondition | Pattern | Feasibility | Notes |
|---|---|---|---|
| Resolvable project/story URL | **Discover (already resolved)** | Feasible — already done | `bk-23-test-project` / `d57804e8-d614-445e-b707-8c25d9ca5dac`, confirmed rendering the chain live on 2026-08-19 (`traceabilityAccess.test.ts` header) — the same constants BK-334's own test already uses. No new Discover work needed; re-verify still current at Code/re-run time per the same file's own "re-run against these before trusting this ATC either way" note. |
| No active session | **N/A (explicitly the negative case)** | Feasible | The ATC opens its own fresh, credential-less `browser.newContext()` internally — no `.env` credentials consumed by this specific check. |

No Modify/Generate needed — read-only, no mutation, no cleanup/teardown.

## 5. Test Scenarios (only relevant if Option B is chosen)

### File: `tests/e2e/traceability/traceabilityAccess.test.ts` (existing — extend, do not fork a new file)

Fixture: `{ ui }`

#### Scenario 1: unauthenticated redirect, BK-45's own TC (Option B only)

Test: `"BK-447: should redirect an unauthenticated user to login with no chain data rendered first"`
Preconditions: none beyond the already-resolved fixture project/story (§4).
ATCs called: `TraceabilityPage.expectAnonymousRedirectToLogin(path)` — `@atc('BK-334')` (unchanged).
Test-level assertions: none beyond what the ATC itself asserts.
Teardown: none — read-only, the ATC closes its own anonymous context internally (`finally`).

Home file rationale: `traceabilityAccess.test.ts` already exists and already hosts the `BK-50` sibling test for this exact method — grouping by screen/feature ("access") rather than by which Story's ID happens to be attached matches this repo's "one file per feature" naming rule (#15) better than forking a `BK-45`-only file for a test that would be byte-identical in body to one already in that file.

## 6. Open Questions (surfaced to orchestrator/user — do NOT guess)

1. **Option A vs Option B (§2)** — the one blocking decision. Nothing in Phase 2 can proceed sensibly until this is picked, because Option A has no Phase 2 at all (a TMS/traceability action instead) and Option B's Phase 2 is a single `test()` line, not a component change.
2. **Re-run BK-334 against the corrected fixture.** Independent of the Option A/B choice, BK-334's own test has not been live-verified since the fixture constants were corrected 2026-08-19 (last live attempt, 2026-08-16, used the old placeholder path and was inconclusive). Whoever closes this out should re-run `tests/e2e/traceability/traceabilityAccess.test.ts` against staging and confirm it now passes — this is a re-verification of existing code, not new work this ticket owns, but it is a precondition for either option being able to claim BK-447 "passes."
3. **Does the unauthenticated context in `expectAnonymousRedirectToLogin` need any `.env` credential at all?** Confirmed no — it deliberately opens a credential-less context. Noted here only because every other ATC in this component's neighborhood (BK-110/BK-445, BK-111/BK-453, BK-336) does need `STAGING_USER_EMAIL`/`STAGING_USER_PASSWORD`; this one and `BK-335` (the API sibling) are the two exceptions in this component's neighborhood.

## 7. Implementation Order

- [ ] Get the Option A vs Option B decision from the user/QA lead (§2, §6.1).
- [ ] **If Option A**: no code. Run `/fix-traceability` (or the manual Jira/Xray equivalent) to link BK-447 to BK-334's coverage; update BK-447's TMS status via `/test-documentation` with a note explaining the shared automation.
- [ ] **If Option B**: add the single `test()` from §5 to `tests/e2e/traceability/traceabilityAccess.test.ts`. No component/decorator change.
- [ ] Either way: re-run `traceabilityAccess.test.ts` against staging to confirm BK-334's logic still passes against the corrected fixture constants (§6.2) — this is the one live-verification gap regardless of which option is chosen.
- [ ] `bun run types:check` / `bun run lint:check` (Option B only — Option A touches no test code).
- [ ] `bun run kata:manifest` + stage `kata-manifest.json` (Option B only, and only if the manifest actually changes — it may not, since no new component/ATC is added, only a new `test()` inside an already-registered component).

## 8. Success Criteria

- [ ] BK-45 AC-05 (unauthenticated-access scenario) is provably covered — the floor. No BVA/State-Transition/Decision-Table/Pairwise owed: this is a single boolean precondition (session present/absent), the same technique-derivation conclusion BK-453 reached for its own boolean-presence guard.
- [ ] No duplicate ATC minted — cross-checked against `kata-manifest.json`, confirmed no literal ID collision, and the semantic-duplicate finding is surfaced rather than silently resolved either way.
- [ ] KATA compliance preserved either way (Option A changes nothing; Option B's single `test()` follows the existing sibling test's exact shape).
- [ ] Fixture correct (`{ ui }`).
- [ ] Live re-verification of `BK-334`'s logic against the corrected fixture, independent of which option is picked.
- [ ] TMS reflects the true relationship between BK-447 and BK-334 — no ticket silently double-counted as two independent automated tests when they are one.
