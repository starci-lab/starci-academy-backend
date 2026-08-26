# Surface · Cloze assessment session

> ID: `quick-quiz-session` · Route: `/[lang]/courses/[displayId]/learn/flashcards/quiz/sessions/[sessionId]`

## Job

Complete persisted timed cloze questions by selecting word-bank terms into every blank, with clear checking and recovery.

## Cloze assessment (`quick-quiz-work`)

Deadline, progress, cloze prompt, ordered blanks, word bank, learner selections, checked solution and safe exit controls with no review fallback.

| Kind | Representative content | States | Actions | Evidence |
|---|---|---|---|---|
| flow | Time remaining (`status`), Cloze question (`entity`), Answer blanks (`field`), Word bank (`field`), Checked solution (`status`) | pending, ready, checking, saving, expired, failed | Check answer → `quiz-solution`, Exit and resume later → `flashcard-library`, Finish early → `quick-quiz-result` | `EV-012`, `EV-013`, `EV-014`, `EV-015` |

Evidence: `EV-012`, `EV-013`, `EV-014`, `EV-015`
