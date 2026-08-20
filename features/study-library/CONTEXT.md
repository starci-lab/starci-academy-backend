# Study library

> Business identity: `starci-academy/study-library@c801a8150af4b11f18b353797a3c5f112633dee5123f2ba9fafa2b4033734dd8`
>
> Source heads: `fe@84bf3be6565a`, `be@eca4e018044f`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Learners use course flashcard review and quiz sessions, browse foundational reference materials, and inspect the course mind map as complementary study modes.

**Primary actor.** Learner

**Primary outcome.** The learner receives a resumable study session or reaches the selected reference material

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
