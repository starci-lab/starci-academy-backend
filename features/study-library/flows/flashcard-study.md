# Flow · Study flashcards

> ID: `flashcard-study` · Trigger: A learner chooses Study or resumes review.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | learner | flashcard-library | Choose today's due queue or a deck | Available review scope is visible |
| 2 | learner | flashcard-library | For a deck, choose all cards or only due cards | A valid scope is ready |
| 3 | platform | flashcard-library | Persist ordered review before navigation | A resumable identity is returned |
| 4 | learner | study-session | Reveal and rate Again, Hard, Good or Easy | Progress is acknowledged and advances |
| 5 | learner | study-session | Leave, resume, or confirm finishing early | Work remains resumable or finalizes honestly |
| 6 | learner | study-result | Inspect grades, duration, next due and weak topics | Return or open recommended study |

Outcome: The learner completes or safely pauses a persisted spaced-repetition run and receives a clear next action.

Evidence: `EV-002`, `EV-006`, `EV-009`, `EV-010`, `EV-011`
