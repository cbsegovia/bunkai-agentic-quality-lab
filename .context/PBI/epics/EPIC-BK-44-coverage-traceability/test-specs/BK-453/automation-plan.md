# Test Automation Plan: BK-453

> Ticket: BK-453 — BK-45: TC23: should render the "select a user story" prompt when no ?story= param is present
> Type: e2e
> Sprint: current (regression-driven, single ATC)
> Created: 2026-08-24

## 1. Ticket Summary

- What to test: hitting the traceability route with no `?story=` param renders the "select a user story" prompt state, never the chain view, and never fires the chain-fetch request.
- Acceptance Criteria: BK-45's route entry-state guard (not numbered AC-01..07 in `acceptance-criteria.md` — those all assume a resolved `userStoryId`; this TC covers the guard that runs *before* any of them, per the TC's own "Why this is regression-worthy" note).
- Dependencies: None. Unlike BK-445 (parked — no staging story currently satisfies the full 5-layer precondition), BK-453 has **zero data precondition** — confirmed by reading both the synced TC body (`Preconditions: None beyond an authenticated session`) and the story's own `acceptance-criteria.md` (no AC references this guard state; it is implied infrastructure the ACs assume already holds).

## 2. Architecture Decisions

### Component Strategy

| Decision | Value | Rationale |
|---|---|---|
| Component | `TraceabilityPage` (`tests/components/ui/TraceabilityPage.ts`) — **existing, extend** | Already registered in `kata-manifest.json` (`components.ui[]`). Same screen `expectChainRenders` (BK-445) and BK-50's export ATCs already live on. |
| Method | `expectNoStorySelectedPrompt` — **existing, upgrade in place** | Currently decorated `@atc('BK-111')`, a documented placeholder (component docblock: "BK-110/BK-111 below are PLACEHOLDER IDs... The real BK-45 Test issues (BK-445..BK-464) are the ones that should eventually replace them"). The method's own JSDoc already reads *"expects the prompt state, not the chain view and no fetch attempted (BK-45 TC-BK45-23)"* — i.e. it was written with BK-453 in mind from the start. Current body asserts prompt visible + chain-view not-visible, but does **not** assert the "no fetch attempted" half of its own docblock claim — that assertion needs to be added, not just the decorator swapped (see the gap below). |
| Fixture | `{ ui }` | Pure UI + network-observation verification against the bare route — no API setup needed inside the test, no seeded data of any kind. |
| Test file | `tests/e2e/traceability/noStorySelected.test.ts` | New file — no existing e2e spec covers this ATC yet (mirrors BK-445's plan: `tests/e2e/traceability/` was not found populated on disk in that session either). |
| Preconditions | None (Discover N/A — nothing to discover) | Authenticated session only; reuse the same staging credential pattern BK-445 already documented. |

### [E2E ONLY] UI Elements

| Element | Locator Strategy | Locator Value | Status |
|---|---|---|---|
| No-story-selected prompt | `data-testid` | `traceability-no-story-selected` | Confirmed (component docblock, verified against `origin/staging`; already used by the existing `expectNoStorySelectedPrompt` body) |
| Chain view root (must NOT render) | `data-testid` | `traceability-chain-view` | Confirmed (same source; already asserted `.not.toBeVisible()` in the existing body) |
| Chain-fetch network request (must NOT fire) | Network route pattern | `**/v1/projects/*/traceability?story=*` (the exact path `TraceabilityApi.getStoryChainSuccessfully` / `expectMismatchedPairNotFound` call: `GET /v1/projects/{id}/traceability?story={userStoryId}`) | Confirmed from `tests/components/api/TraceabilityApi.ts` — this is the one and only endpoint this route's chain fetch can hit; no separate UI-layer endpoint exists per the BFF pattern this repo follows |

### Gap in the existing placeholder body (must be closed in Code phase)

`expectNoStorySelectedPrompt`'s current implementation (read from `tests/components/ui/TraceabilityPage.ts`, lines ~80-86) only asserts two visibility conditions:

```typescript
@atc('BK-111')
async expectNoStorySelectedPrompt(projectSlug: string): Promise<void> {
  await this.page.goto(this.buildUrl(`/projects/${projectSlug}/traceability`));

  await expect(this.page.locator('[data-testid="traceability-no-story-selected"]')).toBeVisible({ timeout: 10000 });
  await expect(this.page.locator('[data-testid="traceability-chain-view"]')).not.toBeVisible();
}
```

BK-453's own AC (TC body, `## Expected results`) requires a **third** assertion the method's docblock already promises but the body does not implement: *"no chain-fetch network request is attempted"*. `chain-view not visible` proves the view didn't render the chain — it does NOT prove the request was never sent (a request could fire, fail, or be ignored client-side, and the DOM assertion would still pass). Code phase must add a request-observation guard (e.g. register a `page.on('request', ...)` collector matching the `**/v1/projects/*/traceability*` pattern **before** `page.goto`, then assert zero matches after the prompt assertion) so the ATC actually verifies what its own docblock and BK-453's AC both claim. This is an **assertion-body expansion**, not a new component or a new method — same reuse pattern BK-445 applied to `expectChainRenders`.

### ADR-candidate (flag only — do not create)

None new for this ticket. The placeholder-ID retirement pattern flagged in BK-445's automation-plan.md §2 (whether `TraceabilityPage`'s remaining placeholders graduate one at a time or in a batch) applies here too — BK-453 is the second instance of that same pattern (`BK-111` → `BK-453`, following `BK-110` → `BK-445`). Not re-flagging as a new candidate; the existing flag in BK-445's plan already covers it. Once a third instance lands, that plan's note should be the one promoted to an ADR, not a fresh one here.

## 3. ATC Registry

### Existing ATCs (Reuse — decorator swap + assertion-body expansion, not a new component)

| ATC ID | Component | Method | Description |
|---|---|---|---|
| ~~BK-111~~ → **BK-453** | `TraceabilityPage` | `expectNoStorySelectedPrompt` | Placeholder retired; body expanded from "2 visibility checks" to "2 visibility checks + 1 network-absence check" per BK-453's own AC. |

### New ATCs (Create)

None. No new component, no new decorator ID beyond the BK-111→BK-453 swap above.

### New Helpers (No @atc)

None planned. The network-request collector is a local closure inside the ATC body (single use, not reused across the class) — per the inline-locator/inline-logic rule, it stays inline unless a second ATC in this component needs the same "assert no request matching pattern X fired" shape, at which point it would be worth extracting to a `private readonly` helper.

## 4. Test Data Strategy

| Precondition | Pattern | Feasibility | Notes |
|---|---|---|---|
| Authenticated viewer+ session | **Discover** (existing) | Feasible | Reuse the already-authenticated staging session pattern documented in BK-445's plan (`bunkai-staging-userbunk@olkacoraug.resend.app`, Owner role — satisfies "viewer or above"). Credentials via `config.testUser` from `@variables`, `.env` (`STAGING_USER_EMAIL` / `STAGING_USER_PASSWORD`) — never hardcoded. `.env` confirmed to define these keys (values not inspected here). |
| Story / AC / ATC / Test / Run / Defect data | **N/A** | N/A | Explicitly not required — this TC's entire point is that no story context exists yet. No Discover/Modify/Generate needed for any of these entities. |

No Modify/Generate needed anywhere in this plan — this ATC is read-only route verification with no mutation and no cleanup/teardown.

## 5. Test Scenarios

### File: `tests/e2e/traceability/noStorySelected.test.ts`

Fixture: `{ ui }`

#### Scenario 1: "select a user story" prompt renders and no chain-fetch fires (happy path)

Test: `"BK-453: should render the select a user story prompt when no story query param is present"`
Preconditions: Authenticated session only (no data Discover needed).
ATCs called: `TraceabilityPage.expectNoStorySelectedPrompt(projectSlug)` — `@atc('BK-453')`.
Test-level assertions: none beyond what the ATC itself asserts (fixed assertions live inside the ATC per the Fixed vs Test-level split — this is a single-ATC happy-path test with no flow-level comparison).
Teardown: none — read-only, no mutation.

## 6. Open Questions (surfaced to orchestrator/user — do NOT guess)

1. **`{project_slug}` source at Code time.** The synced TC's `## Variables` table says: `{project_slug}` — "Project settings, or the `/projects` list". BK-445's plan discovered the workspace currently has exactly one project (BK-23 Test Project) — Code phase should confirm the same project slug is still the only one / still valid rather than assuming BK-445's finding is still current, but this is a much lower-risk Discover than BK-445's story-UUID problem (a project slug, not a specific data shape). Not a blocker for planning.
2. **Network-observation mechanism choice.** Two viable Playwright patterns exist for "assert this request never fires": (a) a `page.on('request', ...)` collector registered before `goto`, asserted empty after; (b) `page.route(pattern, route => { throw / fail })` to hard-fail on any match. Recommend (a) — it fails with a clear assertion diff (URL list) rather than an unhandled route-handler exception, and matches this repo's existing style of `expect(...)` assertions rather than a `page.route` abort/mock idiom, which the codebase currently only uses for the export-download interception (`exportSnapshot`'s `Promise.all` pattern is a different mechanism). Code phase should confirm this against `references/e2e-patterns.md`'s network-mocking guidance before implementing; not a plan blocker, just a technique choice to make once in Code.

## 7. Implementation Order

- [ ] Confirm the project slug to navigate with (resolve open question §6.1).
- [ ] Swap `TraceabilityPage.expectNoStorySelectedPrompt`'s decorator `@atc('BK-111')` → `@atc('BK-453')` and expand its JSDoc to document the network-absence assertion explicitly.
- [ ] Add the network-request-absence guard to the ATC body (resolve open question §6.2 for the exact mechanism), scoped to `**/v1/projects/*/traceability?story=*`.
- [ ] Create `tests/e2e/traceability/noStorySelected.test.ts` using `{ ui }`.
- [ ] Run tests and validate (`bun run test`, `bun run types:check`, `bun run lint:check`).
- [ ] `bun run kata:manifest` + stage `kata-manifest.json` (confirms the BK-111→BK-453 rename is picked up cleanly).
- [ ] Update TMS status BK-453 → In Automation via `/test-documentation`.

## 8. Success Criteria

- [ ] Entry-state guard covered — the floor, not the bar. This is the single positive/only-partition case for "param absent" (no other partition exists for this specific guard — a malformed/invalid `story` value, if ever specified, would be a separate TC and a separate EP partition, not owed by this TC).
- [ ] No BVA owed here — there is no range/limit/length/date-window on a boolean presence/absence check.
- [ ] KATA compliance (inline network-observation logic, `@atc` on the state-verifying method only, no ATC-calls-ATC).
- [ ] Fixture correct (`{ ui }`, no API-only path needed).
- [ ] No hardcoded waits.
- [ ] Aliases used (`@ui/`, `@utils/`, `@TestContext`, `@variables`).
- [ ] Tests pass locally against staging.
- [ ] TMS marked Automated once Review passes.
