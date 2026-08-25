# Study library

> Business identity: `starci-academy/study-library@9d78d0d20b04aaa1eba272432456ecbabbd2b2f079943e31e3530c2b89e3e3b9`
>
> Source heads: authority `approved` · base `b5a638183a3de17e38b457cd0d639e1e008b5812914d7e78f0c7472026c76699` · `fe@f14e3c24b4a`, `be@88a395908477`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Learners use course flashcard review and quiz sessions, browse foundational reference materials, and inspect the course mind map as complementary study modes.

**Primary actor.** Learner

**Primary outcome.** The learner receives a resumable study session, completes the ordered cards and understands the next study action, or reaches the selected reference material

**Never does.** Standalone coding problems

## Invariants

- `BR-01` — Flashcard review distinguishes due work, deck statistics, resume state and pending/ready/empty/failed outcomes.
- `BR-02` — Starting a flashcard review persists the chosen deck and card order as a resumable session.
- `BR-03` — Foundation browsing supports pagination and can settle as pending, ready, empty, failed or partial.

## Primary flow

```text
study-ready → study-pending → study-ready
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `flashcard-library` | `/[lang]/courses/[displayId]/learn/flashcards/{review|quiz}` | Choose review or quiz work and start or resume a session. | [surface](surfaces/flashcard-library.md) |
| `flashcard-session` | `/[lang]/courses/[displayId]/learn/flashcards/{review|quiz}/sessions/[sessionId]{/result}` | Work through an ordered review or quiz and inspect the result. | [surface](surfaces/flashcard-session.md) |
| `foundation-library` | `/[lang]/courses/[displayId]/learn/foundations{/[categoryId]/[foundationId]}` | Find and open reference foundations by category. | [surface](surfaces/foundation-library.md) |
| `course-mind-map` | `/[lang]/courses/[displayId]/learn/mind-map` | Inspect the course knowledge structure as a mind map. | [surface](surfaces/course-mind-map.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `startFlashcardReviewSession` | backend | deck id, card order | resumable review session |
| `foundations` | backend | category id, pagination | foundation page |

## Explicit unknowns

- `mind-map-editability` — Is the learner ever allowed to edit the course mind map? Impact: The current route proves a viewing surface only, so prototypes must not invent authoring controls.

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
