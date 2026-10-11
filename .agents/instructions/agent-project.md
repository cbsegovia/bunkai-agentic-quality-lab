---
id: project
title: 'Project-specific instructions'
load_when: 'anything specific to this project: its own conventions, guardrails, environments or vocabulary not covered by another section'
triggers: []
paths: []
---

# Project-specific instructions

> Project-owned overlay. The boilerplate delivers this file once and never overwrites it; every other file in this folder is synced from upstream. Write this project's own rules here, one heading per topic, instead of editing `AGENTS.md` or a synced section. Knowledge about the system under test belongs in a project context skill (`<aspect>-context`), not here.

Add `triggers:` regex sources to the frontmatter above when a rule here should be routed by keyword (the hook reads them), and keep every `NEVER` / `MUST` line reachable: cite `Rule #N`, binding: `/<skill>`, or enforced: `bun run <script>` (checked by `bun run instructions:check`).

## Project context skills

One row per skill this project authored: the `<aspect>-context` skills `project-context` mode `context-skill` creates, and any other skill the project added. The skill router in `agent-skills-and-mcps.md` is synced, so `bun run up` overwrites a row written there; this file is never overwritten. Add each skill's trigger phrases to `triggers:` above as regex sources too, so the hook routes this file when a prompt names them. `bun run instructions:check` fails a row whose `.agents/skills/<slug>/SKILL.md` does not exist.

| Skill | Trigger | Purpose |
|---|---|---|

## Git Strategy (this repository)

The source of truth is the `git_strategy:` block in `.agents/project.yaml`; `bun run git:policy verify` compares it with the host. This repository runs `github-flow`: the production branch is the one `git_strategy.protected` names (it is the remote default branch, not a literal `main`), every change is a short-lived prefixed branch (`docs/*`, `test/*`, `chore/*`, `feat/*`) merged by PR, and direct push to the production branch is a declared policy (`git_strategy.policy.direct_push_to_protected`), resolved per Rule #5.

- No integration branch: this repository has no `staging` branch. Do not assume one exists.
- The strategy was chosen through Strategy Setup (`strategy_source: chosen`): `git-flow-master` does not offer Strategy Setup again unless the user asks to change it.
- `git_strategy.policy.accepted_divergences` is empty on purpose, so `git:policy verify` reports no drift. A ruleset that blocks direct pushes would turn that into a real divergence needing an entry there.
- `docs/workflows/git-flow.md` is legacy for this repository: it describes a `staging` flow that does not apply.
- Test-automation PRs use `.agents/skills/git-flow-master/references/pr-test-automation.md`; the title format is `{type}({ISSUE-KEY}): {description}`.
