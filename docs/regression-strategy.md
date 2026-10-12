# Regression strategy

How this suite decides what runs, what gates a release, and what happens to a test that stops being trustworthy. The pipelines live in `.github/workflows/`; the failure rubric lives in `.agents/skills/regression-testing/references/failure-classification.md`.

## The lanes

| Lane | Trigger | What it runs | Gates a release |
|---|---|---|---|
| PR build | every pull request | lint, types, repo checks (`.github/workflows/build.yml`) | yes, to merge |
| Smoke | daily, and on demand | only tests tagged `@critical`, UI and API (`bun run test:smoke`) | yes |
| Regression | daily, and on demand | every integration test, then every E2E test (`.github/workflows/regression.yml`) | yes |
| Quarantine | with every regression run | only tests tagged `@quarantine` (`bun run test:quarantine`) | never |

Integration runs before E2E on purpose: an API break shows up in seconds and spares a browser run that would fail for the same cause.

## What enters the regression, and why

The regression is the whole automated suite, ordered by cost. The priority is expressed with tags, not with a second list that can drift:

- `@critical`: the journeys whose failure makes the product unusable (sign-in and session, reaching a project, the Home open-bugs card, traceability access). These form the smoke lane and are the first thing read after a red night.
- `@regression`: the remaining checks worth running on every build because they guard behavior that already shipped.
- A case is automated only when it passes the ROI gate of `/test-documentation`: it is repeatable, its oracle is stable, and a failure would cost more than the test costs to maintain. Cases that fail that gate stay as manual Test issues.

The tag set is read from the code, so the current members of each lane are always one search away: `grep -rn "@critical" tests/`.

## A test that fails: three different answers

| Situation | What to do | Counts against the gate |
|---|---|---|
| It fails because of a bug that is already filed | Keep it running and mark it `test.fail('Blocked by BK-123')` with the bug key. It stays in the suite and reports when the bug is fixed. | no, it is KNOWN-BLOCKED |
| It fails sometimes on an unchanged build | Quarantine it (below). | no, while quarantined |
| It fails because the product or the test broke | Fix it now. This is a regression and blocks the release. | yes |

Never switch a test off without a reason written next to it. A `test.fixme` carries the exact blocker in a comment, as the parked BK-448 case does.

## Quarantining a flaky test

A test is flaky when it fails on more than 20% of the last 10 runs of the same build. The rule and its edge cases are in the failure-classification reference.

1. Tag the test: add `@quarantine` to its title or `tag` list. The gating projects exclude it with `grepInvert`, and the quarantine projects pick it up.
2. Open a tracking ticket in Jira for the instability and put its key in a comment next to the tag. A quarantine without a ticket is a test switched off.
3. Leave it in the lane. It keeps running on every regression and its result is published as the `quarantine-test-results` artifact, outside the gating pass-rate.
4. Release it when it passes 10 consecutive quarantine runs: remove the tag and close the ticket.
5. Review the lane every sprint. A test that stays quarantined for more than one sprint is deleted or rewritten, not kept.

Retries stay at zero (`retries: 0` in `playwright.config.ts`): a retry hides the flake instead of exposing it.

## Reading the result

The Allure report of each run is published with its history at the repository's GitHub Pages site, under `staging/regression/`. After every scheduled regression, the nightly triage routine described in `.agents/automations/nightly-regression-triage.md` classifies each failure, computes the verdict (GO, CAUTION or NO-GO) and reports it to a person.
