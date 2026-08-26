# Contracts · Study library

## Entities

- `flashcard-deck` (Flashcard deck): id, title, description, difficulty, card count, due count, mastered count, cloze-eligible card count — `EV-002`, `EV-013`
- `flashcard-review-session` (Flashcard review session): session id, review source, optional deck id, ordered cards, current position, graded positions, reviewed count, status — `EV-001`, `EV-006`, `EV-010`, `EV-011`
- `flashcard-quiz-session` (Flashcard cloze assessment session): session id, configuration, ordered cloze-valid cards, deadline, current position, per-card correct blanks, per-card positive total blanks, status — `EV-012`, `EV-013`, `EV-014`
- `flashcard-session-result` (Flashcard session result): session id, completion metrics, scheduling or coverage evidence, XP when applicable, weak topics, next study actions — `EV-010`, `EV-011`
- `foundation-category` (Foundation category): id, title, description, thumbnail, resources — `EV-003`, `EV-004`, `EV-007`

## Operations

| Operation | Kind / owner | Input | Output | Failures | Evidence |
|---|---|---|---|---|---|
| `startFlashcardReviewSession` | mutation / backend | deck id, card order | resumable review session | authentication rejected, deck unavailable, session creation failed | `EV-006`, `EV-010` |
| `syncFlashcardReviewSessionProgress` | mutation / backend | session id, current position, reviewed and graded positions | acknowledged resumable progress | session unavailable, progress sync failed | `EV-010`, `EV-011` |
| `reviewFlashcard` | mutation / backend | card id, session id, Again, Hard, Good or Easy grade | existing spaced-repetition schedule result | card unavailable, rating failed | `EV-010`, `EV-011` |
| `completeFlashcardReviewSession` | mutation / backend | session id, completed review evidence | review result identity | session unavailable, completion failed | `EV-010`, `EV-011` |
| `startFlashcardQuizSession` | mutation / backend | course identity, existing assessment configuration, ordered card identities | resumable timed cloze assessment session containing only cloze-valid questions | access rejected, insufficient cloze-valid questions, non-cloze or malformed card selection rejected, session creation failed | `EV-012`, `EV-013`, `EV-014` |
| `syncFlashcardQuizSessionProgress` | mutation / backend | session id, current position, per-card correctBlanks and positive totalBlanks outcomes | acknowledged resumable quiz progress | session invalid or expired, progress sync failed | `EV-012`, `EV-014` |
| `completeFlashcardQuizSession` | mutation / backend | session id, per-card correctBlanks and positive totalBlanks evidence | server-validated coverage, XP and result identity | session invalid or expired, zero-blank or non-session card evidence rejected, completion failed | `EV-012`, `EV-014` |
| `foundations` | query / backend | category id, pagination | foundation page | category missing, query failed | `EV-007` |

Assessment eligibility and score validity are backend-owned. Frontend may preflight and explain eligibility, but cannot authorize non-cloze cards or zero-blank outcomes.
