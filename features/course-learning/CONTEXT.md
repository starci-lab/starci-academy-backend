# Course learning and discussion

> Business identity: `starci-academy/course-learning@17affc37597c4f7b17a75d069376ccfd15d99e58edd8ad9f4d4ed077cd4e464b`
>
> Source heads: authority `pending` · base `51001ee3d9db5fdb5f81173ad63d695b51870734be4de03fd689cff4b0796fa3` · `fe@b78f77ec4490`, `be@0ed7b7bc8e1b`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Enrolled learners navigate course modules and lesson content, read or edit source snapshots, mark progress, react, discuss lessons, and complete embedded content challenges.

**Primary actor.** Learner

**Primary outcome.** The learner advances through course content with persisted engagement evidence

**Never does.** Standalone coding-practice catalog

## Invariants

- `BR-01` — A lesson can settle as pending, ready, locked or failed and exposes independently settling source, reaction and discussion regions.
- `BR-02` — Read state and comments require authenticated course access guards.

## Primary flow

```text
course-home-ready → lesson-ready → lesson-pending → lesson-ready
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `course-home` | `/[lang]/courses/[displayId]/learn` | Review course progress and continue with the most relevant learning action. | [surface](surfaces/course-home.md) |
| `content-map` | `/[lang]/courses/[displayId]/learn/content` | Choose the next module or lesson. | [surface](surfaces/content-map.md) |
| `lesson-workspace` | `/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]` | Read lesson content and use its engagement tools. | [surface](surfaces/lesson-workspace.md) |
| `content-challenge` | `/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]/challenges/[challengeId]{/result}` | Attempt a challenge attached to a lesson and inspect its result. | [surface](surfaces/content-challenge.md) |
| `course-qa` | `/[lang]/courses/[displayId]/learn/qa` | Open the course-level Q&A surface. | [surface](surfaces/course-qa.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `markContentAsReaded` | backend | content id, read flag | updated learner content state |
| `createComment` | backend | content id, optional parent comment, body | created comment |

## Explicit unknowns

- `locked-recovery-policy` — Which exact purchase or enrollment action should every locked lesson show? Impact: The lesson surface confirms a locked state but does not establish one universal recovery action across all entry contexts.

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
