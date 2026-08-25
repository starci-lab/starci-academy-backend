# States · Study library

| State | Kind | Reader sees | Main transitions |
|---|---|---|---|
| `flashcard-ready` | initial | Hub readiness and mode choice | study-configuring, quiz-configuring, flashcard-empty, flashcard-error |
| `study-configuring` | active | Due/deck and all/due choices | study-starting, flashcard-ready, flashcard-error |
| `study-starting` | pending | Review session persistence | study-active, study-invalid, flashcard-error |
| `study-active` | active | Focused card review | study-saving, study-result, study-invalid |
| `study-saving` | pending | Progress or completion write | study-active, study-result, flashcard-error |
| `study-invalid` | error | Missing, invalid or expired review | study-configuring, flashcard-ready |
| `study-result` | success | Review evidence and next actions | study-configuring, flashcard-ready |
| `quiz-configuring` | active | Begin, History, Stats and run setup | quiz-starting, flashcard-ready, flashcard-error |
| `quiz-starting` | pending | Playable timed run persistence | quiz-active, quiz-invalid, flashcard-error |
| `quiz-active` | active | Focused timed question work | quiz-saving, quiz-result, quiz-invalid |
| `quiz-saving` | pending | Progress or completion write | quiz-active, quiz-result, flashcard-error |
| `quiz-invalid` | error | Invalid or expired quiz | quiz-configuring, flashcard-ready |
| `quiz-result` | success | Coverage, XP and next actions | quiz-configuring, flashcard-ready |
| `flashcard-empty` | empty | No playable flashcard work | flashcard-ready |
| `flashcard-error` | error | Recoverable remote failure | flashcard-ready, study-active, quiz-active |
