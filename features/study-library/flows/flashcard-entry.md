# Flow · Enter flashcards

> ID: `flashcard-entry` · Trigger: A learner opens the course flashcard route.

| # | Actor | Surface / state | Action | Result |
|---|---|---|---|---|
| 1 | learner | `flashcard-library` / `flashcard-ready` | Inspect due work, mastery, decks and resumable work | The learner understands what can be continued or started |
| 2 | learner | `flashcard-library` / `flashcard-ready` | Choose existing Study or the scored cloze assessment | The selected branch opens without collapsing assessment into review |

Outcome: The learner enters the right flashcard branch or resumes acknowledged work

Evidence: `EV-001`, `EV-002`, `EV-009`, `EV-010`, `EV-011`, `EV-012`
