# BK-445: TC01: should render the full 5-layer chain for a fully covered story

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Phase** | Standalone (regression-driven) |
| **Items** | 1 TC |
| **Dependencies** | None |
| **Requires** | Authenticated staging session (Owner/viewer role), a seeded story with AC→ATC→Test→Run→Defect fully populated for every AC |
| **Source** | Story: BK-45 (AC-01) · Test: BK-445 (Candidate, ROI 25.0) · ATP outline: TC-BK45-01 |

## Summary

BK-445 is the story's core happy path: proving all 5 evidence-chain layers (Acceptance Criterion → ATC → Test → Run → Defect) render together on a single page load for a real seeded story, with no broken/null cells and no extra navigation. This is the story's reason for existing — a regression that broke any single layer join (e.g. Test→Run mapping) while leaving the RPC/view-state unit tests intact would still ship a broken chain. ROI = 25.0 (Frequency 5 × Impact 5 × Stability 4 / Effort 2 × Dependencies 2).

## Preconditions

- Authenticated workspace member, viewer role or above.
- A user story in project `{project_slug}` with 1+ acceptance criteria, each bound to at least one ATC, each ATC contained in at least one Test, each Test with at least one completed Run, each Run with a linked Defect.
- Manually-verified during BK-45 Stage 2 (2026-08-08) against the BK-35 retest-anchor story (AC → 3 ATCs → 2 Tests → 3 Runs → 3 Defects) — see `automation-plan.md` §Data Strategy for the Discover approach and the fixture-selection open question this leaves for Code phase.

## Test Cases

### BK-445: should render the full 5-layer chain when a story has complete AC→ATC→Test→Run→Defect coverage

**Preconditions**: Authenticated viewer+ session; a seeded story with every AC bound through to at least one Defect.
**Action**: Navigate to `/projects/{project_slug}/traceability?story={story_id}`.
**Expected Output**:
- The chain view renders on the single page load — no additional navigation/redirect.
- Every AC is shown with its title and its bound ATC(s).
- Every ATC shows its title, layer (UI/API/Unit), and its linked Test.
- Every Test shows its single latest Run with a status pill (pass/fail/blocked/skipped/aborted/running).
- Every Run shows its linked Defect(s) — ID, title, current status.
- No cell in the rendered chain is broken, empty, or null where data exists.

```gherkin
@regression @e2e @automation-candidate @BK-45
Scenario: BK-445 - should render the full 5-layer chain when a story has complete AC-ATC-Test-Run-Defect coverage
  Given an authenticated workspace member with at least viewer role
  And a user story "{story_id}" in project "{project_slug}" with 1 or more acceptance criteria, each bound to an ATC, a Test, a Run and a linked Defect
  When the member navigates to "/projects/{project_slug}/traceability?story={story_id}"
  Then the traceability view renders on a single page load, with no extra navigation
  And every acceptance criterion is shown with its bound ATC
  And every ATC shows its linked Test
  And every Test shows its latest Run with a status pill
  And every Run shows its linked Defect(s)
  And no cell is broken or null
```

## Merged TCs (if any)

None — BK-445 is a single Equivalence Partition (the "fully covered" positive case). It is explicitly kept separate from TC-02 (minimum chain, BVA-lower boundary) and TC-11 (mixed coverage, a different partition) per the ATP's technique-derivation table — no EP-merge collapses across those.

## Updated TCs (if any)

None.

## Acceptance Criteria

- [ ] 1 TC automated: full single-page 5-layer chain render for a fully covered story.
- [ ] Test passes on staging (the only env this story's data currently exists in).
- [ ] Existing `TraceabilityPage.expectChainRenders` placeholder ATC (`@atc('BK-110')`) is resolved to the real Jira Test ID `@atc('BK-445')` per the component's own docblock note — see `automation-plan.md` §Architecture Decisions for the reuse-vs-new-method call.
