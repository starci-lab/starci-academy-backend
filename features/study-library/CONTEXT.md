# Study library

> Business identity: `starci-academy/study-library@bc22cf3ec1eb3f07ddeac2ec5fa7999398e5849736188daacc5a09436dc9562d`
>
> Source heads: authority `approved` · base `1f134aaa1d014eb977ca8f8d974e3d7002a01d1a115931f0b7a180b4c8c2c84b` · `fe@595fd21545ad`, `be@eccda3bd9df9`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** A course-level flashcard hub preserves the existing spaced-repetition Study branch and provides a separate scored cloze assessment whose questions are filled from a word bank, never falling back to review behavior.

**Primary actor.** Learner

**Primary outcome.** Preserve the existing Study journey while delivering a trustworthy scored cloze assessment with explicit eligibility, recovery and result evidence.

**Never does.** Redesign Study; turn assessment into multiple choice; fall back to reveal-and-rate or SM-2; treat legacy UI as authority.

## Invariants

- `BR-01` — Existing Study and the scored cloze assessment are explicit sibling modes and never collapse into one ambiguous session.
- `BR-02` — A review or quiz session is persisted before navigation to focused work.
- `BR-03` — Live work restores the persisted session identity, card order and acknowledged progress.
- `BR-04` — Leaving unfinished Study or Quick quiz work preserves resumability; finishing early requires confirmation and reports only completed work.
- `BR-05` — A live session route represents in-progress work and a dedicated result route represents completed work.
- `BR-06` — Invalid, missing or expired sessions recover to a safe setup or overview with an explanation.
- `BR-07` — Study scheduling and route identity remain unchanged; assessment playability requires cloze-valid cards and scoring remains correct blanks over total positive blanks.
- `BR-08` — Results prioritize weak-topic and contextual next-study actions over decorative celebration.
- `BR-09` — Every remote-data surface exposes pending, ready, empty, failed and retry or recovery behavior.
- `BR-10` — Foundation browsing supports pagination and can settle as pending, ready, empty, failed or partial.
- `BR-11` — An assessment question is playable only when its card contains at least one valid cloze blank.
- `BR-12` — Every assessment blank is filled by selecting a term from the provided word bank; the learner may revise unchecked choices.
- `BR-13` — Assessment mode never falls back to answer reveal, self-reported recall rating or SM-2 review behavior.
- `BR-14` — When the selected scope cannot supply enough cloze-valid questions, starting is blocked with an explicit eligible-count explanation.
- `BR-15` — Each scored question has totalBlanks greater than zero; coverage is derived from correctBlanks divided by totalBlanks and cannot be fabricated by the client.
- `BR-16` — A pre-existing mixed or malformed assessment session cannot continue through review fallback; it recovers to setup without producing a scored assessment completion.
- `BR-17` — The existing Study branch is neither redesigned nor removed by this revision.

## Primary flows

```text
flashcard-ready → study-configuring → study-starting → study-active → study-result
flashcard-ready → quiz-configuring → quiz-starting → quiz-active → quiz-result
quiz-configuring → quiz-unavailable → quiz-configuring
quiz-active → quiz-invalid → quiz-configuring
```

## Surface map

| Surface | Route | Purpose |
|---|---|---|
| `flashcard-library` | `/[lang]/courses/[displayId]/learn/flashcards/{review\|quiz}` | Understand flashcard readiness, enter unchanged Study, or start or resume the separate scored cloze assessment. |
| `study-session` | `/[lang]/courses/[displayId]/learn/flashcards/review/sessions/[sessionId]` | Work through persisted spaced-repetition cards without surrounding distraction. |
| `study-result` | `/[lang]/courses/[displayId]/learn/flashcards/review/sessions/[sessionId]/result` | Explain completed review evidence and guide the next study action. |
| `quick-quiz-session` | `/[lang]/courses/[displayId]/learn/flashcards/quiz/sessions/[sessionId]` | Complete persisted timed cloze questions by selecting word-bank terms into every blank, with clear checking and recovery. |
| `quick-quiz-result` | `/[lang]/courses/[displayId]/learn/flashcards/quiz/sessions/[sessionId]/result` | Explain cloze performance by correct and total blanks and guide evidence-linked follow-up. |
| `foundation-library` | `/[lang]/courses/[displayId]/learn/foundations{/[categoryId]/[foundationId]}` | Find and open reference foundations by category. |
| `course-mind-map` | `/[lang]/courses/[displayId]/learn/mind-map` | Inspect the course knowledge structure as a mind map. |

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

`model.json` is authoritative for machines. The existing Study branch is outside this revision. Legacy manifest `EV-011` is reference-only. Unknowns remain unknown until current routed source or an explicit owner decision resolves them.
