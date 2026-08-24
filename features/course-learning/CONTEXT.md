# Course learning and discussion

> Business identity: `starci-academy/course-learning@579d8899ae412ffd21567a2a6ac6033674d3ecf3eac3dab77c7aec0ceb787601`
>
> Source heads: authority `modeled` · base `17b1d88700e40db815dc135b7b6fb8ebe85eea667dd867ff50bbf3c948d94473` · `fe@f14e3c24b4a0`, `be@eeeaef30b60b`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Enrolled learners navigate course modules with exactly one kind, use the shared module conversation, work in the kind-specific workbench, track progress, and complete learning activities.

**Primary actor.** Learner

**Primary outcome.** The learner advances through course content with persisted engagement evidence

**Never does.** Standalone coding-practice catalog

## Invariants

- `BR-01` — A lesson can settle as pending, ready, locked or failed and exposes independently settling source, reaction and discussion regions.
- `BR-02` — Read state and comments require authenticated course access guards.
- `BR-03` — Every learning module has exactly one required kind.
- `BR-04` — Chat is a shared capability of every learning module and is not one module kind; document, accounting or spreadsheet, scheduling or calendar, and future kinds identify workbench behavior.
- `BR-05` — Shared module identity, ordering, lifecycle and conversation frame remain common while exactly one module kind owns the additional workbench state, behavior and learner presentation.
- `BR-06` — Adding a future module kind must not redefine the business contract of the base learning-module aggregate.
- `BR-07` — Opening any module mounts one shared conversational shell and exactly one workbench resolved from its kind registry entry.

## Primary flow

```text
course-home-ready → lesson-ready → lesson-pending → lesson-ready
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `course-home` | `/[lang]/courses/[displayId]/learn` | Review course progress and continue with the most relevant learning action. | [surface](surfaces/course-home.md) |
| `content-map` | `/[lang]/courses/[displayId]/learn/content` | Choose the next module or lesson. | [surface](surfaces/content-map.md) |
| `lesson-workspace` | `/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]` | Use the shared module conversation and the workbench selected by the module kind. | [surface](surfaces/lesson-workspace.md) |
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
- `module-conversation-cardinality` — Does one module own one conversation or multiple threads? Impact: The owner confirmed a common chat frame but did not define conversation cardinality or mailbox behavior.
- `module-workbench-integration` — Are external workbenches embedded, linked, or implemented natively? Impact: Spreadsheet, Excel and calendar examples establish workbench purpose but not provider or integration strategy.

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
