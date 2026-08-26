# Course learning and discussion

> Business identity: `starci-academy/course-learning@c325716e5b230f001b7ed2297be9524beecc96071ff68954241f34fde355bc51`
>
> Source heads: authority `implemented` · base `579d8899ae412ffd21567a2a6ac6033674d3ecf3eac3dab77c7aec0ceb787601` · `fe@16d5692ce07f`, `be@451ac8583742`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Enrolled learners navigate course modules, use the shared module conversation and kind-specific workbench, and prove applied knowledge through recoverable, trustworthy content Challenges.

**Primary actor.** Learner

**Primary outcome.** The learner advances through course content with persisted engagement evidence and evidence-linked Challenge feedback.

**Never does.** Redefine Mock Interview, Flashcards/quick quiz, Playground, Global Chat, enrollment policy, provider topology or the authoring studio.

## Invariants

- `BR-01` — A lesson can settle as pending, ready, locked or failed and exposes independently settling source, reaction and discussion regions.
- `BR-02` — Read state and comments require authenticated course access guards.
- `BR-03` — Every learning module has exactly one required kind.
- `BR-04` — Chat is a shared capability of every learning module and is not one module kind; document, accounting or spreadsheet, scheduling or calendar, and future kinds identify workbench behavior.
- `BR-05` — Shared module identity, ordering, lifecycle and conversation frame remain common while exactly one module kind owns the additional workbench state, behavior and learner presentation.
- `BR-06` — Adding a future module kind must not redefine the business contract of the base learning-module aggregate.
- `BR-07` — Opening any module mounts one shared conversational shell and exactly one workbench resolved from its kind registry entry.
- `BR-08`–`BR-10` — Challenge access, revision binding, drafts and idempotent immutable submission remain server-enforced.
- `BR-11`–`BR-12` — Deterministic checks and rubric-constrained AI produce evidence; platform policy alone finalizes result and progress.
- `BR-13`–`BR-19` — Feedback is evidence-linked, hints do not leak solutions, injections cannot change authority, failures recover safely, retries preserve history and locale does not alter rubric meaning.

## Primary flow

```text
course-home-ready → lesson-ready → lesson-pending → lesson-ready

challenge-ready → challenge-draft → challenge-submitting → challenge-evaluating → challenge-result
                                                        ↘ challenge-evaluation-unavailable
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `course-home` | `/[lang]/courses/[displayId]/learn` | Review course progress and continue with the most relevant learning action. | [surface](surfaces/course-home.md) |
| `content-map` | `/[lang]/courses/[displayId]/learn/content` | Choose the next module or lesson. | [surface](surfaces/content-map.md) |
| `lesson-workspace` | `/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]` | Use the shared module conversation and the workbench selected by the module kind. | [surface](surfaces/lesson-workspace.md) |
| `content-challenge` | `/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]/challenges/[challengeId]{/result}` | Complete a recoverable applied-learning attempt and receive trustworthy evidence-linked feedback without leaving the course context. | [surface](surfaces/content-challenge.md) |
| `course-qa` | `/[lang]/courses/[displayId]/learn/qa` | Open the course-level Q&A surface. | [surface](surfaces/course-qa.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `markContentAsReaded` | backend | content id, read flag | updated learner content state |
| `createComment` | backend | content id, optional parent comment, body | created comment |
| `saveChallengeDraft` | backend | learner, challenge revision, expected draft revision, answer/artifacts | saved draft revision |
| `submitChallengeAttempt` | backend | learner, challenge/rubric/draft revisions, idempotency key | immutable attempt revision and evaluation status |
| `evaluateChallengeAttempt` | backend | attempt, challenge, rubric and policy revisions | deterministic and AI advisory evidence |
| `finalizeChallengeResult` | backend | attempt, evidence and policy revisions | authoritative result, progress transition and audit revision |
| `retryChallengeAttempt` | backend | learner and prior attempt revision | new draft with preserved history |

## Explicit unknowns

- `locked-recovery-policy` — Which exact purchase or enrollment action should every locked lesson show? Impact: The lesson surface confirms a locked state but does not establish one universal recovery action across all entry contexts.
- `module-kind-mutation` — May a module change kind after creation, or must it be replaced or migrated? Impact: The owner confirmed exactly one kind but did not authorize an in-place kind transition.
- `module-kind-persistence` — Which persistence inheritance strategy implements the approved module-kind contract? Impact: STI, CTI, JSONB and referenced aggregates remain architecture alternatives, not business truth.
- `module-kind-permissions` — Which authoring and learner permissions are common versus kind-specific? Impact: The shared and kind-owned permission boundary remains undefined.
- `module-conversation-cardinality` — Does one module own one conversation or multiple threads? Impact: The owner confirmed a common chat frame but did not define conversation cardinality or mailbox behavior.
- `module-workbench-integration` — Are external workbenches embedded, linked, or implemented natively? Impact: Spreadsheet, Excel and calendar examples establish workbench purpose but not provider or integration strategy.
- `challenge-attempt-persistence` — Which physical store and transaction boundary own challenge records? Impact: Architecture must assign storage, writer, migration, backup and recovery ownership.
- `challenge-ai-runtime` — Which model provider, queue and structured-output implementation realize evaluation? Impact: Runtime choices must preserve approved authority and failure semantics.

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
