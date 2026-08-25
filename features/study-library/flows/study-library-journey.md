# Flow · Study library

> ID: `study-library-journey` · Trigger: A learner opens a course study-tool route.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `learner` | `flashcard-library` | Choose flashcards, foundations or mind map | The selected study surface opens |
| 2 | `learner` | `flashcard-library` | Start or resume a due/deck flashcard session | A persisted ordered review session is returned |
| 3 | `learner` | `flashcard-session` | Review or answer each ordered flashcard while tracking progress | The learner advances through the persisted session |
| 4 | `learner` | `flashcard-session` | Leave and later resume an incomplete flashcard session | The learner returns to the saved session position |
| 5 | `learner` | `flashcard-session` | Finish the ordered cards and inspect the result | The result and available next study action are shown |
| 6 | `learner` | `foundation-library` | Search or page foundation categories and open a resource | The selected reference content opens |

## Outcomes

- The learner receives a resumable study session, completes the ordered cards and understands the next study action, or reaches the selected reference material

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-009`
