# Surface · Flashcards

> ID: `flashcard-library` · Route: `/[lang]/courses/[displayId]/learn/flashcards/{review|quiz}`

## Job

Understand flashcard readiness, enter unchanged Study, or start or resume the separate scored cloze assessment.

## Study (`study-overview`)

Today's due queue, mastery, resumable work, searchable decks and all-versus-due configuration.

| Kind | Representative content | States | Actions | Evidence |
|---|---|---|---|---|
| collection | Cards due (`status`), Retention (`fact`), Saved Study session (`status`), Decks (`entity`) | pending, ready, empty, failed | Start review → `startFlashcardReviewSession`, Resume → `study-session`, Choose all or due cards → `study-configuring` | `EV-001`, `EV-002`, `EV-006`, `EV-010`, `EV-011` |

## Cloze assessment (`quick-quiz-overview`)

Begin, History and Stats with eligible-question count, existing run configuration and resumable work.

| Kind | Representative content | States | Actions | Evidence |
|---|---|---|---|---|
| flow | Begin (`field`), Eligible cloze questions (`fact`), History (`entity`), Stats (`fact`), Saved assessment (`status`) | pending, ready, unavailable, empty, failed, invalid | Start assessment → `startFlashcardQuizSession`, Resume → `quick-quiz-session` | `EV-012`, `EV-013`, `EV-014`, `EV-015` |

Evidence: `EV-001`, `EV-002`, `EV-010`, `EV-011`, `EV-012`, `EV-013`, `EV-015`
