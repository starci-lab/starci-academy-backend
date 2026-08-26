# States · Study library

| State | Kind | Meaning | Main transitions | Evidence |
|---|---|---|---|---|
| `flashcard-ready` | initial | Flashcard hub ready | `study-configuring`, `quiz-configuring`, `flashcard-empty`, `flashcard-error` | `EV-001`, `EV-002`, `EV-010`, `EV-011` |
| `study-configuring` | active | Study configuration ready | `study-starting`, `flashcard-ready`, `flashcard-error` | `EV-002`, `EV-010`, `EV-011` |
| `study-starting` | pending | Study session starting | `study-active`, `study-invalid`, `flashcard-error` | `EV-006`, `EV-010`, `EV-011` |
| `study-active` | active | Study session active | `study-saving`, `study-result`, `study-invalid` | `EV-006`, `EV-010`, `EV-011` |
| `study-saving` | pending | Study progress saving or completing | `study-active`, `study-result`, `flashcard-error` | `EV-006`, `EV-010`, `EV-011` |
| `study-invalid` | error | Study session unavailable | `study-configuring`, `flashcard-ready` | `EV-010`, `EV-011` |
| `study-result` | success | Study result ready | `study-configuring`, `flashcard-ready` | `EV-010`, `EV-011` |
| `quiz-configuring` | active | Cloze assessment setup, history or stats ready | `quiz-starting`, `flashcard-ready`, `flashcard-error`, `quiz-unavailable` | `EV-010`, `EV-011` |
| `quiz-starting` | pending | Cloze assessment starting | `quiz-active`, `quiz-invalid`, `flashcard-error`, `quiz-unavailable` | `EV-010`, `EV-011` |
| `quiz-active` | active | Cloze assessment active | `quiz-saving`, `quiz-result`, `quiz-invalid` | `EV-010`, `EV-011` |
| `quiz-saving` | pending | Cloze assessment progress saving or completing | `quiz-active`, `quiz-result`, `flashcard-error` | `EV-010`, `EV-011` |
| `quiz-unavailable` | empty | Insufficient cloze-valid questions | `quiz-configuring`, `flashcard-ready` | `EV-012`, `EV-013`, `EV-014` |
| `quiz-invalid` | error | Cloze assessment invalid, malformed or expired | `quiz-configuring`, `flashcard-ready` | `EV-010`, `EV-011` |
| `quiz-result` | success | Cloze assessment result ready | `quiz-configuring`, `flashcard-ready` | `EV-010`, `EV-011` |
| `flashcard-empty` | empty | No flashcard work available | `flashcard-ready` | `EV-002`, `EV-010`, `EV-011` |
| `flashcard-error` | error | Flashcard work failed | `flashcard-ready`, `study-active`, `quiz-active` | `EV-002`, `EV-010`, `EV-011` |
