# OPENSOURCE GOAL — StarCi

> Living target state for this project. Every workflow, every op chain, every verdict
> should be measured against this file. Update `S*` when the owner sharpens the target —
> never silently reinterpret it.

## Mission

Make StarCi a runtime good enough to **open-source and publish content about**.
Not "tests pass" — *a stranger can clone it, run it, understand it, and trust it*.

## Target state S*

| Dimension | Done means |
|---|---|
| **Architecture** | `.claude/` is the canonical modular layout — `modules/` context, `kernel/` spine, `scripts/{checks,route}/`, `schemas/`, `sqlite/`. No `.dist` build step. Legacy isolated in `legacy/`. |
| **Operating model** | Chat → goal → `[Kernel]` agent (1/project) → `[Op]` agents (1 op = 1 agent) → spine settle → re-plan. Works on any project, not just this repo. |
| **Durability** | `.starciwork/runtime.sqlite` is the single truth — state survives worktree deletion, reboots, agent churn. Zero input loss, zero lease drift. |
| **Correctness** | Work-correction policy enforced: wrong business flow → re-run from affected boundary with fresh evidence. No debt ledgers, no stale-evidence assertions. |
| **Test quality** | E2E via real HTTP/GraphQL clients over real `TestingModule` stacks on BOTH example apps. Unit tests cover real business journeys, not stub assertions. Sonar + Codecov wired and green. |
| **Determinism** | Model/op routing is declarative and reproducible — same inputs → same selection, with cited reasons. Spine code (not agent prose) settles truth. |
| **Docs** | SKILL.md load order is accurate; a new agent cold-starts correctly from `AGENTS.md` alone. Architecture docs match what the code actually does. |
| **Demonstrability** | The whole loop is showable: prompt → plan → dispatched ops → evidence → settled verdict. This is the content story. |

## Continuous verification loop

Not a one-shot gate — a standing loop every kernel session runs:

1. **SURVEY** — read `.starciwork` + this file's S* → compute current gap Δ
2. **CHAIN** — plan ops closing Δ (PARSE→SURVEY→GAP→CHAIN→VALIDATE per `modules/goal/`)
3. **DISPATCH** — one `[Op]` agent per operation, scoped ownership, fresh evidence required
4. **SETTLE** — spine validates verdicts; stale/invalid evidence → re-verify leg, never accept
5. **RE-PLAN** — verdict revealing wrong assumptions → invalidate state → re-plan from boundary
6. **REPEAT** until every S* row holds with fresh evidence

## Explicitly out of scope

- `knowledge/` stays untouched.
- Feature work on the example apps beyond what testing requires.
- Anything that optimizes for looking done instead of being done.

## Current known gaps

- `.dist` removal wave in flight (tinkle-14..23).
- Kernel/dispatch modules being built (tinkle-9..13).
- `scripts/checks` move + compact-format check updates (tinkle-4, v11-5).
- Frontend render re-capture (v7-9).
- Sonar/Codecov per-project encrypted tokens under `.stacks` via SOPS — pending.
