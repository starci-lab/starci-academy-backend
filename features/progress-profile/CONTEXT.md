# Progress, profile and league

> Business identity: `starci-academy/progress-profile@11029753f34b38d79333a42d96b955e849b94b7976aea8b37aed00387d158604`
>
> Source heads: `fe@6db677598290`, `be@0ed7b7bc8e1b`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Authenticated learners review their learning dashboard, quests, streak, goals, job readiness and community tabs; inspect public profile evidence; update profile settings; and compare weekly or global league standing.

**Primary actor.** Learner

**Primary outcome.** The learner can understand current progress, public evidence and comparative standing

**Never does.** Course-specific learning execution

## Invariants

- `BR-01` — The dashboard is authenticated and keeps overview blocks independently settling rather than treating the whole page as one request.
- `BR-02` — Profile updates are partial: omitted keys remain unchanged, explicit null clears nullable fields, strings are trimmed where declared, and the refreshed row is returned.
- `BR-03` — A daily quest reward can be claimed only after completion and only once per day in one atomic grant.
- `BR-04` — The league surface supports weekly and global scopes and preserves the viewer's own standing alongside ranked identities.

## Primary flow

```text
progress-ready → progress-pending → progress-ready → progress-ready
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `learning-dashboard` | `/[lang]/dashboard{?tab=overview|explore|courses|community}` | Summarize identity, learning momentum and available destinations. | [surface](surfaces/learning-dashboard.md) |
| `public-profile` | `/[lang]/profile/[username]{/activity|/cv|/projects|/challenges|/skills}` | Present job readiness, courses, contributions, project, challenge and skill evidence. | [surface](surfaces/public-profile.md) |
| `league-standing` | `/[lang]/league` | Compare weekly or global standing and identify the viewer's position. | [surface](surfaces/league-standing.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `updateProfile` | backend | partial identity, preference and branding patch | refreshed user |
| `claimDailyQuestReward` | backend | none | granted points and completion |
| `myLeague` | backend | none | weekly tier and ranked cohort |

## Explicit unknowns

- `global-league-contract` — Does the global league tab use the same myLeague response or a separate query? Impact: The UI proves a global selection, while the cited backend query explicitly guarantees the viewer's weekly league only.

## LOADS

| Need | Read |
|---|---|
| Scope, terminology and exclusions | [overview.md](overview.md) |
| Actor permissions and ownership | [actors.md](actors.md) |
| One user journey | `flows/<flow-id>.md` |
| One renderable screen | `surfaces/<surface-id>.md` |
| Business invariants | [rules.md](rules.md) |
| State transitions | [states.md](states.md) |
| Entities, inputs, outputs and failures | [contracts.md](contracts.md) |
| Completion and regression proof | [acceptance.md](acceptance.md) |
| Machine rendering/query | [model.json](model.json) |
| Exact source provenance | [evidence.json](evidence.json) |

## Context rule

Do not load every module by default. `CONTEXT.md` plus the one flow or surface being changed is the normal prompt. `model.json` is authoritative for machines; Markdown files are generated projections. Unknowns remain unknown until routed source or an explicit owner decision resolves them.
