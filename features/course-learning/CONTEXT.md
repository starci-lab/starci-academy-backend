# Course learning and discussion

> Business identity: `starci-academy/course-learning@17b1d88700e40db815dc135b7b6fb8ebe85eea667dd867ff50bbf3c948d94473`
>
> Source heads: authority `modeled` · base `a95043aa570304bef99e3d2954159e8d4857550efaabba6784450480ffb749dc` · `fe@f14e3c24b4a0`, `be@eeeaef30b60b`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Enrolled learners navigate course modules with exactly one kind, enter the kind-specific workspace, read or edit lesson content, mark progress, react, discuss lessons, and complete embedded challenges.

**Primary actor.** Learner

**Primary outcome.** The learner advances through course content with persisted engagement evidence

**Never does.** Standalone coding-practice catalog

## Invariants

- `BR-01` — A lesson can settle as pending, ready, locked or failed and exposes independently settling source, reaction and discussion regions.
- `BR-02` — Read state and comments require authenticated course access guards.
- `BR-03` — Every learning module has exactly one required kind.
- `BR-04` — Chatbot and document are initial module kinds, not the complete or permanently closed kind set.
- `BR-05` — Shared module identity, ordering and lifecycle remain common while each kind owns its specific state, behavior and learner presentation.
- `BR-06` — Adding a future module kind must not redefine the business contract of the base learning-module aggregate.
- `BR-07` — A chatbot module opens a mailbox and conversation workspace; a document module opens a document workspace.

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
- `module-kind-mutation` — May a module change kind after creation, or must it be replaced or migrated? Impact: The owner confirmed exactly one kind but did not authorize an in-place kind transition.
- `module-kind-persistence` — Which persistence inheritance strategy implements the approved module-kind contract? Impact: STI, CTI, JSONB and referenced aggregates remain architecture alternatives, not business truth.
- `module-kind-permissions` — Which authoring and learner permissions are common versus kind-specific? Impact: The shared and kind-owned permission boundary remains undefined.

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
