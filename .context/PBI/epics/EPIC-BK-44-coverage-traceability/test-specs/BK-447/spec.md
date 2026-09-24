# BK-447: TC14: should redirect an unauthenticated user to login with no chain data rendered first

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Phase** | Standalone (regression-driven) |
| **Items** | 1 TC (see "Merged TCs" — collapses onto an already-existing ATC, does not mint a new one) |
| **Dependencies** | None on staging data availability — see Preconditions. Depends on a decision documented in `automation-plan.md` §2 before this ticket can be marked Automated. |
| **Source** | Story: BK-45 (AC-05, first scenario — "Unauthenticated user attempts to access a traceability view") · Test: BK-447 (Candidate, ROI 40.0) · ATP outline: TC-BK45-14 |

## Summary

BK-447 covers BK-45's AC-05 auth-gate scenario: an unauthenticated browser opening a traceability view URL must be redirected to `/login` before any chain data (AC/ATC/Test/Run/Defect) reaches the DOM or the network. This is the same HIGH-risk auth-veto category BK-45's ATP flags project-wide.

**Key finding (read before Code phase):** this exact scenario — same Precondition (no session) + same Action (navigate to a traceability URL) + same Assertions (redirect to `/login` before paint, no chain markup, no chain-fetch request) — is **already fully implemented** as `TraceabilityPage.expectAnonymousRedirectToLogin(path)`, decorated `@atc('BK-334')`. `BK-334` is BK-50's own TC04 (BK-50 is the sibling Story — "export the chain as a snapshot" — that shares this same screen; export is explicitly Out of Scope for BK-45, but the auth guard is independently declared in-scope by both Stories' own ACs: BK-45 AC-05 and BK-50's TC04). Per the TC Identity Rule (Precondition + Action = 1 TC) and the EP-merge doctrine (same expected output = one ATC, never duplicated), BK-447 and BK-334 are the **same test case**, filed twice under two different Stories in the same Epic. This is a cross-story traceability duplication, not a gap in automation — see `automation-plan.md` §2 for the reuse decision and the options put to the user.

ROI = 40.0 (Frequency 4 × Impact 5 × Stability 4 / Effort 2 × Dependencies 1) — per the synced TC's own scoring.

## Preconditions

- **No active session** (fresh, unauthenticated browser context — not the shared authenticated `page` the `ui`/`test` fixtures provide by default).
- A traceability URL naming a project/story that actually resolves (confirmed necessary — see "Precondition data status" below), not a placeholder/non-existent path.

### Precondition data status (confirmed empirically, not assumed)

The synced TC's own Gherkin precondition line reads *"a user story `{story_id}` that exists and has a populated chain"* — read literally, this looks like the same kind of staging-data dependency that parked BK-445. It is **not**, for two independent reasons found by reading the codebase and prior session history rather than assuming:

1. **The API-layer sibling ATC (`TraceabilityApi.expectUnauthenticatedRejection`, `@atc('BK-335')`) already ran live on staging and passed** (`.session/test-automation/BK-50/progress.md`, Phase 2, 2026-08-16): *"Auth-gate check happens before any project/story lookup, so random UUIDs are legitimate test data; no workspace membership needed."* The guard fires before any data resolution — by design, the "populated chain" clause in the Gherkin describes the kind of URL a real user would be redirected away from, not a functional dependency of the guard itself.
2. **The UI-layer sibling (`BK-334`, the same ATC this ticket reuses) needs a real, resolvable path to produce a *trustworthy* result** — not because the guard depends on chain content, but because an empirical run against a placeholder path was **inconclusive**: it did not redirect within the 10s timeout, and the session log explicitly declines to call that a confirmed defect, since a non-existent path may 404/error through a different code path than the one this ATC targets (same progress.md, Phase 2). The fix was not "find populated chain data" — it was "point at a project/story that actually resolves." That real fixture (`bk-23-test-project` / story `d57804e8-d614-445e-b707-8c25d9ca5dac`) was located and wired into `tests/e2e/traceability/traceabilityAccess.test.ts` on 2026-08-19 and is already what BK-334's own test uses.

**Conclusion**: BK-447 is unblocked by the same staging-data gap that parked BK-445 (no story anywhere on staging currently satisfies AC-01's full 5-layer precondition) — BK-447 does **not** need a fully-populated chain, only an existing, resolvable project/story, which is already known-good and already wired into the codebase for BK-334's use. The one open item is not data — it is the traceability/reuse decision in `automation-plan.md` §2, and a re-run confirmation (BK-334's own test is written and lint/type-clean but its last live attempt used the old placeholder path, before the fixture was fixed 2026-08-19 — it has not yet been re-run against the corrected constants).

## Test Cases

### BK-447: should redirect an unauthenticated user to login with no chain data rendered first

**Preconditions**: No active session (fresh browser context, no `storageState`); a resolvable project/story URL.
**Action**: Navigate to `/projects/{project_slug}/traceability?story={story_id}` with no session.
**Expected Output**:
- Redirected to `/login` (with `next=<original path>`) before any response paints.
- No AC/ATC/Test/Run/Defect data appears in the DOM at any point (`traceability-chain-view` never visible).
- No chain-fetch network request for `{story_id}` is observed before the redirect.

```gherkin
@medium @regression @e2e @automation-candidate @BK-45
Scenario: BK-447 - should redirect an unauthenticated user to login with no chain data rendered first
  Given no active session (unauthenticated browser context)
  And a user story "{story_id}" that exists on a resolvable project
  When the browser opens "/projects/{project_slug}/traceability?story={story_id}"
  Then the browser is redirected to the login route before the response paints
  And no acceptance criterion, ATC, Test, Run, or Defect data appears in the DOM at any point
  And no chain-fetch network request for "{story_id}" is observed before the redirect
```

## Merged TCs (if any)

**BK-447 collapses onto `BK-334`'s existing ATC** (`TraceabilityPage.expectAnonymousRedirectToLogin`) — not a new ATC. This is not an Equivalence-Partitioning merge within one TC's own input space (the usual use of this section); it is a cross-Story duplicate at the TC level: BK-45's AC-05 (unauthenticated access) and BK-50's TC04 describe the identical Precondition + Action + Assertions against the identical screen. See `automation-plan.md` §2 for the two options presented to the user and the recommended default (traceability link, no new test code) versus the alternative (an independent `test()` entry reusing the same ATC method under its existing `@atc('BK-334')` identity).

## Updated TCs (if any)

None from this ticket's own scope. If the user picks automation-plan.md §2's Option B, `tests/e2e/traceability/traceabilityAccess.test.ts` gains one additional `test()` (no component change).

## Acceptance Criteria

- [ ] BK-45 AC-05 (first scenario, unauthenticated access) is covered — confirmed already satisfied in code by `BK-334`'s ATC; this checklist item closes via a traceability/TMS action, not new test code, unless the user picks Option B.
- [ ] `BK-334`'s existing test (`tests/e2e/traceability/traceabilityAccess.test.ts`) is re-run against the corrected fixture constants (`bk-23-test-project` / `d57804e8-d614-445e-b707-8c25d9ca5dac`, fixed 2026-08-19) — it has not been re-verified live since that fix, per the file's own header note.
- [ ] Cross-story duplication (BK-447 vs BK-334) is resolved in the TMS — either via `/fix-traceability`, a manual Jira link/close, or an explicit note on BK-447 that it shares automation with BK-334 — before either ticket is marked fully "AUTOMATED" without qualification.
