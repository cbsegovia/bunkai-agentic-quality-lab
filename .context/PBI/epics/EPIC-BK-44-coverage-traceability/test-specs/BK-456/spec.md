# BK-456: TC02: should render the minimum populated chain given 1 AC, 1 ATC, 1 Test and 1 Run

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Phase** | Standalone (regression-driven) |
| **Items** | 1 TC |
| **Dependencies** | None — sibling of BK-445 (same component, same fixture story), but a distinct partition/boundary per both TCs' own technique-derivation tables. |
| **Requires** | Authenticated staging session (viewer role or above), a seeded story whose chain depth is exactly 1 AC / 1 ATC / 1 Test / 1 Run |
| **Source** | Story: BK-45 (AC-01, BVA-lower-boundary reading) · Test: BK-456 (Candidate, ROI 12.0) · ATP outline: TC-BK45-02 |

## Summary

BK-456 is the lower Boundary Value Analysis case for chain-depth rendering: the absolute minimum non-empty data at every layer named in the TC (1 AC, 1 ATC, 1 Test, 1 Run) must still render without null or broken cells. This is deliberately NOT the same partition as BK-445 (the "fully populated, N-can-be->1, Defect-required" happy path) — it targets the class of off-by-one bug list-rendering code tends to hide, where code paths written assuming "N items" quietly assume N >= 2 (e.g. `.slice(1)`, index-based sibling lookups, pluralization branches). ROI = 12.0 (Frequency 4 x Impact 3 x Stability 4 / Effort 2 x Dependencies 2).

## Preconditions

- Authenticated workspace member, viewer role or above.
- A user story in project `{project_slug}` with exactly 1 acceptance criterion, bound to exactly 1 ATC, contained in exactly 1 Test, with exactly 1 recorded Run.
- **Resolved without seeding new data.** The story already seeded for BK-445 (`bk-45-traceability-fixtures` / `cb997c18-3b51-45e3-8a16-84d7aa3bd222`) has exactly 1 AC -> 1 ATC -> 1 Test -> 1 Run — it structurally satisfies this TC's stated precondition verbatim. It also carries 1 linked Defect, which BK-445 needed and BK-456 does not mention — see `automation-plan.md` §4 for why that extra layer does not disqualify reuse (Defect count is outside both this TC's Given clause and its Then assertions).

## Test Cases

### BK-456: should render the minimum populated chain when a story has exactly 1 AC, 1 ATC, 1 Test and 1 Run

**Preconditions**: Authenticated viewer+ session; a seeded story whose chain depth is exactly 1 at every layer through Run.
**Action**: Navigate to `/projects/{project_slug}/traceability?story={story_id}`.
**Expected Output**:
- The single acceptance criterion renders with its ATC.
- The ATC renders its Test.
- The Test renders its Run with a status pill.
- No cell is broken, null, or shows a placeholder meant for a missing layer.
- (Boundary-specific, beyond the literal AC wording) exactly one AC card and exactly one ATC row render — proving the single-row array path does not silently drop or duplicate under N=1.

```gherkin
@regression @e2e @automation-candidate @BK-45
Scenario: BK-456 - should render the minimum populated chain given 1 AC, 1 ATC, 1 Test and 1 Run
  Given an authenticated workspace member with at least viewer role
  And a user story "{story_id}" in project "{project_slug}" with exactly 1 acceptance criterion, bound to exactly 1 ATC, 1 Test and 1 Run
  When the member navigates to "/projects/{project_slug}/traceability?story={story_id}"
  Then the single acceptance criterion renders with its ATC
  And the ATC renders its Test
  And the Test renders its Run with a status pill
  And no cell is broken, null, or shows a placeholder meant for a missing layer
```

## Merged TCs (if any)

None — single Equivalence Partition (the boundary-minimum case), N/A for merge. Explicitly kept separate from BK-445 (fully-populated/N>1/Defect-required partition) and TC-03 (upper chain-depth boundary, not yet a real Jira Test at plan time) per the ATP's technique-derivation table.

## Updated TCs (if any)

None.

## Acceptance Criteria

- [ ] 1 TC automated: single-page chain render for the minimum non-empty chain depth (1/1/1/1) through the Run layer.
- [ ] Test passes on staging (the only env this story's data currently exists in) — reuses the BK-445 fixture story, no new seeding required.
- [ ] New `TraceabilityPage` ATC method (`@atc('BK-456')`) — NOT a reuse of `expectChainRenders` (`@atc('BK-445')`), because that method's fixed assertions require a linked Defect and iterate assuming N-can-be->1; this TC's contract is narrower (AC/ATC/Test/Run only, Defect-agnostic) and boundary-specific (asserts exactly 1, not >=1) — see `automation-plan.md` §2 for the reuse-vs-new-method analysis.
