# Contracts · Study library

## Entities

- `flashcard-deck`: id, title, description, difficulty, card count, due count, mastered count — `EV-002`
- `flashcard-review-session`: session id, review source, optional deck id, ordered cards, current position, graded positions, reviewed count, status — `EV-001`, `EV-006`, `EV-010`, `EV-011`
- `flashcard-quiz-session`: session id, configuration, ordered cards, deadline, current position, per-card outcomes, status — `EV-010`, `EV-011`
- `flashcard-session-result`: session id, completion metrics, scheduling or coverage evidence, XP when applicable, weak topics, next study actions — `EV-010`, `EV-011`
- `foundation-category`: id, title, description, thumbnail, resources — `EV-003`, `EV-004`, `EV-007`

## Operations

| Operation | Kind / owner | Input | Output |
|---|---|---|---|
| `startFlashcardReviewSession` | mutation / backend | deck id, card order | resumable review session |
| `syncFlashcardReviewSessionProgress` | mutation / backend | session and review progress | acknowledged resumable progress |
| `reviewFlashcard` | mutation / backend | card, session and four-grade recall | existing scheduling result |
| `completeFlashcardReviewSession` | mutation / backend | session and completed review evidence | review result identity |
| `startFlashcardQuizSession` | mutation / backend | course, existing configuration and card order | resumable timed quiz |
| `syncFlashcardQuizSessionProgress` | mutation / backend | session, current position and outcomes | acknowledged quiz progress |
| `completeFlashcardQuizSession` | mutation / backend | session and per-card result evidence | server-derived coverage, XP and result |
| `foundations` | query / backend | category id and pagination | foundation page |

Failures remain explicit in `model.json`. No redesign may invent an operation or change an existing input, score, schedule, access gate or route identity.
