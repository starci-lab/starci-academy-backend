# Study library

> Business identity: `starci-academy/study-library@1f134aaa1d014eb977ca8f8d974e3d7002a01d1a115931f0b7a180b4c8c2c84b`
>
> Source heads: authority `approved` · base `9d78d0d20b04aaa1eba272432456ecbabbd2b2f079943e31e3530c2b89e3e3b9` · `fe@f14e3c24b4a`, `be@88a395908477`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** A flashcard hub leads into either spaced-repetition Study or a configurable Quick quiz, preserves unfinished work, and closes each run with actionable results.

**Primary actor.** Learner

**Primary outcome.** The learner starts or resumes the right flashcard mode, completes or safely pauses acknowledged work, and understands the next study action.

**Never does.** Change backend contracts, scoring, scheduling, access gates or route identity; treat legacy UI as authority.

## Invariants

- `BR-01` — Study and Quick quiz are explicit sibling modes.
- `BR-02` — Persist before focused navigation.
- `BR-03` — Restore exact acknowledged progress.
- `BR-04` — Leave preserves resumability; finish early is confirmed.
- `BR-05` — Live and result routes have distinct meaning.
- `BR-06` — Invalid or expired sessions recover safely.
- `BR-07` — Existing product contracts remain frozen.
- `BR-08` — Results drive next study.
- `BR-09` — Remote states are complete.
- `BR-10` — Foundations remain unchanged.

## Primary flows

```text
flashcard-ready → study-configuring → study-starting → study-active → study-result
flashcard-ready → quiz-configuring → quiz-starting → quiz-active → quiz-result
```

## Surface map

| Surface | Route | Owns |
|---|---|---|
| `flashcard-library` | `/[lang]/courses/[displayId]/learn/flashcards/{review|quiz}` | Readiness, mode choice, Study overview, Quick quiz Begin/History/Stats and resume. |
| `study-session` | `.../flashcards/review/sessions/[sessionId]` | Focused spaced-repetition work. |
| `study-result` | `.../flashcards/review/sessions/[sessionId]/result` | Review evidence and next study. |
| `quick-quiz-session` | `.../flashcards/quiz/sessions/[sessionId]` | Focused timed quiz work. |
| `quick-quiz-result` | `.../flashcards/quiz/sessions/[sessionId]/result` | Coverage, XP, outcomes and next study. |
| `foundation-library` | `/[lang]/courses/[displayId]/learn/foundations{/[categoryId]/[foundationId]}` | Existing foundation browsing. |
| `course-mind-map` | `/[lang]/courses/[displayId]/learn/mind-map` | Existing course concept map. |

## LOADS

| Need | Read |
|---|---|
| Scope, terminology and exclusions | [overview.md](overview.md) |
| Actor permissions and ownership | [actors.md](actors.md) |
| One customer journey | `flows/<flow-id>.md` |
| One renderable screen | `surfaces/<surface-id>.md` |
| Business invariants | [rules.md](rules.md) |
| State transitions | [states.md](states.md) |
| Entities, inputs, outputs and failures | [contracts.md](contracts.md) |
| Completion and regression proof | [acceptance.md](acceptance.md) |
| Machine rendering/query | [model.json](model.json) |
| Exact provenance | [evidence.json](evidence.json) |

## Context rule

`model.json` is authoritative for machines. Legacy manifest `EV-011` is reference-only. Unknowns remain unknown until current routed source or an explicit owner decision resolves them.
