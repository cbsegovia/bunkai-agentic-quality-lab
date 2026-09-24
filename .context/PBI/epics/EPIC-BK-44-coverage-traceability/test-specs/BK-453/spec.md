# BK-453: TC23: should render the "select a user story" prompt when no ?story= param is present

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Phase** | Standalone (regression-driven) |
| **Items** | 1 TC |
| **Dependencies** | None |
| **Requires** | Authenticated staging session (Owner/viewer role) only. No story/AC/ATC/Test/Run/Defect data of any kind. |
| **Source** | Story: BK-45 (entry-state guard, no single AC number assigned) · Test: BK-453 (Candidate, ROI 40.0) · ATP outline: TC-BK45-23 |

## Summary

BK-453 covers the traceability route's entry-state guard: hitting `/projects/{project_slug}/traceability` with the `story` query param entirely absent. The view must render the "select a user story" prompt and must NOT attempt a chain-fetch network request at all — the regression this guards against is treating an absent param as an empty string and passing it straight through to the chain-fetch RPC (unhandled error, malformed request, or a silent fallback to some default story). Unlike BK-445 (its sibling, the fully-covered-chain happy path), this TC needs **no seeded story data whatsoever** — it is the bare, unparameterized route. ROI = 40.0 (Frequency 4 × Impact 2 × Stability 5 / Effort 1 × Dependencies 1).

## Preconditions

- Authenticated workspace member, viewer role or above.
- No story, AC, ATC, Test, Run, or Defect data required — the route is hit with `story` omitted entirely.

## Test Cases

### BK-453: should render the "select a user story" prompt when no ?story= query param is present

**Preconditions**: Authenticated viewer+ session; no `story` query param supplied.
**Action**: Navigate to `/projects/{project_slug}/traceability` (no `?story=`).
**Expected Output**:
- The "select a user story" prompt state renders.
- The chain view (`traceability-chain-view`) does NOT render.
- No chain-fetch network request (`GET /v1/projects/{id}/traceability?story=...`) is observed at any point during or after the navigation.

```gherkin
@medium @regression @e2e @automation-candidate @BK-45
Scenario: BK-453 - should render the "select a user story" prompt when no ?story= param is present
  Given an authenticated workspace member with at least viewer role
  When the member opens "/projects/{project_slug}/traceability" with no `story` query param
  Then the "select a user story" prompt state renders
  And the chain view does not render
  And no chain-fetch network request is attempted
```

## Merged TCs (if any)

None — BK-453 is a single Equivalence Partition (the "param entirely absent" case). It is explicitly distinct from any TC exercising an invalid/malformed `story` value (a different partition, not in this batch) and from BK-445's "fully covered story" partition.

## Updated TCs (if any)

None.

## Acceptance Criteria

- [ ] 1 TC automated: prompt-state render + zero chain-fetch requests when `story` is absent.
- [ ] Test passes on staging (default env for this repo) with no data precondition beyond an authenticated session.
- [ ] Existing `TraceabilityPage.expectNoStorySelectedPrompt` placeholder ATC (`@atc('BK-111')`) is resolved to the real Jira Test ID `@atc('BK-453')` per the component's own docblock note — already annotated in-code as "(BK-45 TC-BK45-23)", i.e. this exact TC. See `automation-plan.md` §2 for the reuse-vs-new-method call and the network-assertion gap the current body does not yet cover.
