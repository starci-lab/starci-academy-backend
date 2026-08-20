# Projects and career

> Business identity: `starci-academy/projects-career@5879c49105264073469a07bd554395d44c6720211a10981fc8f58c5485e6faeb`
>
> Source heads: `fe@84bf3be6565a`, `be@eca4e018044f`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Learners progress through course personal-project milestones, submit a GitHub repository for an enrollment, inspect task feedback, and browse headhunting companies and consultants connected to the course.

**Primary actor.** Learner

**Primary outcome.** The learner's enrollment retains the project repository and career destinations remain discoverable

**Never does.** Public profile presentation of completed projects

## Invariants

- `BR-01` — The personal project roadmap exposes a deterministic next task, completion percentage/facts and milestone task navigation.
- `BR-02` — Submitting a personal GitHub URL requires an authenticated user and an enrollment for the selected course, then persists the URL on that enrollment.
- `BR-03` — The headhunting directory separates company and consultant results and can mark individual actions unavailable.

## Primary flow

```text
project-ready → project-pending → project-ready
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `personal-project-roadmap` | `/[lang]/courses/[displayId]/learn/personal-project` | Show the next task and milestone completion evidence. | [surface](surfaces/personal-project-roadmap.md) |
| `personal-project-task` | `/[lang]/courses/[displayId]/learn/personal-project/tasks/[taskId]{/result}` | Complete a task, submit repository evidence and inspect feedback. | [surface](surfaces/personal-project-task.md) |
| `headhunting-directory` | `/[lang]/courses/[displayId]/learn/headhuntings` | Find headhunting companies and consultants. | [surface](surfaces/headhunting-directory.md) |
| `headhunting-company` | `/[lang]/courses/[displayId]/learn/headhunting-companies/[companyId]` | Inspect one company from the course career directory. | [surface](surfaces/headhunting-company.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `submitPersonalGithubUrl` | backend | course id, GitHub URL | updated enrollment |
| `headhuntingCompanies` | backend | none | headhunting companies |

## Explicit unknowns

- `consultant-contact-outcome` — What exact channel and response follows an available consultant contact action? Impact: The directory proves conditional contact availability but the cited surface and company query do not establish the downstream communication contract.

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
