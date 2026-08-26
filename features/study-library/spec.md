# Study library

> Business head: `bc22cf3ec1eb3f07ddeac2ec5fa7999398e5849736188daacc5a09436dc9562d`
>
> Generated projection of the immutable model. Update through the routed business-authority workflow.

## Overview

A course-level flashcard hub preserves the existing spaced-repetition Study branch and provides a separate scored cloze assessment whose questions are filled from a word bank, never falling back to review behavior.

## Authority boundary

- Existing Study is explicitly unchanged and outside this revision.
- The assessment is cloze-only, word-bank driven and scored per blank.
- Frontend and backend share a backend-owned eligibility and result-validity boundary.
- Non-cloze cards, zero-blank outcomes and mixed legacy sessions cannot produce scored completion.

## Flows

- **Enter flashcards** — The learner enters the right flashcard branch or resumes acknowledged work
- **Study flashcards** — The learner completes or safely pauses a persisted spaced-repetition run and receives a clear next study action
- **Take a scored cloze assessment** — The learner completes or safely pauses a cloze-valid scored assessment and receives evidence-linked follow-up
- **Use reference study tools** — Existing Foundations and Mind map behavior remains available outside the flashcard redesign

## Surfaces

| Surface | Route | Purpose |
|---|---|---|
| `flashcard-library` | `/[lang]/courses/[displayId]/learn/flashcards/{review\|quiz}` | Understand flashcard readiness, enter unchanged Study, or start or resume the separate scored cloze assessment. |
| `study-session` | `/[lang]/courses/[displayId]/learn/flashcards/review/sessions/[sessionId]` | Work through persisted spaced-repetition cards without surrounding distraction. |
| `study-result` | `/[lang]/courses/[displayId]/learn/flashcards/review/sessions/[sessionId]/result` | Explain completed review evidence and guide the next study action. |
| `quick-quiz-session` | `/[lang]/courses/[displayId]/learn/flashcards/quiz/sessions/[sessionId]` | Complete persisted timed cloze questions by selecting word-bank terms into every blank, with clear checking and recovery. |
| `quick-quiz-result` | `/[lang]/courses/[displayId]/learn/flashcards/quiz/sessions/[sessionId]/result` | Explain cloze performance by correct and total blanks and guide evidence-linked follow-up. |
| `foundation-library` | `/[lang]/courses/[displayId]/learn/foundations{/[categoryId]/[foundationId]}` | Find and open reference foundations by category. |
| `course-mind-map` | `/[lang]/courses/[displayId]/learn/mind-map` | Inspect the course knowledge structure as a mind map. |

## State summary

Hub: ready, empty, error. Study: configuring, starting, active, saving, invalid, result. Assessment: configuring, starting, active, saving, unavailable, invalid or expired, result.

## Acceptance focus

1. Every assessment card contains at least one valid cloze blank.
2. Learners fill blanks from a word bank and may revise unchecked choices.
3. Backend rejects non-cloze card IDs and zero-blank outcomes.
4. Insufficient eligible content blocks start with an explicit explanation.
5. Invalid or mixed legacy sessions recover without false scoring.
6. Study behavior and scheduling remain unchanged.

## Evidence

Current source evidence is `EV-001`–`EV-007`, `EV-013` and `EV-014`; owner decisions and observations are `EV-008`–`EV-012` and `EV-015`. Legacy manifest `EV-011` remains reference-only.
