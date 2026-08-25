# Flow · Take a Quick quiz

> ID: `flashcard-quick-quiz` · Trigger: A learner chooses Quick quiz or resumes a quiz.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | learner | flashcard-library | Open Begin, History or Stats | Requested setup or evidence view opens |
| 2 | learner | flashcard-library | Configure the run within existing capabilities | A playable request is ready |
| 3 | platform | flashcard-library | Persist the timed run before navigation | A resumable identity and deadline are returned |
| 4 | learner | quick-quiz-session | Answer, check and reveal the solution | Per-card outcomes are acknowledged |
| 5 | learner | quick-quiz-session | Leave, resume, expire, or confirm finishing early | Valid work restores or completed evidence finalizes |
| 6 | learner | quick-quiz-result | Inspect coverage, XP, outcomes and weak topics | Retry, return, or open contextual study |

Outcome: The learner completes or safely pauses a persisted Quick quiz and receives evidence-linked follow-up.

Evidence: `EV-001`, `EV-009`, `EV-010`, `EV-011`
