# Flow · Take a scored cloze assessment

> ID: `flashcard-quick-quiz` · Trigger: A learner chooses the cloze assessment or resumes a valid assessment session.

| # | Actor | Surface / state | Action | Result |
|---|---|---|---|---|
| 1 | learner | `flashcard-library` / `quiz-configuring` | Open Begin, History or Stats for the cloze assessment | The requested assessment setup or evidence view opens |
| 2 | learner | `flashcard-library` / `quiz-configuring` | Choose scope, run size and level from cards that each contain at least one valid cloze blank | Every selected question is playable as a word-bank cloze question |
| 3 | platform | `flashcard-library` / `quiz-starting` | Validate cloze eligibility and persist the playable timed assessment before navigation | A resumable assessment identity and deadline are returned, or an explicit unavailable state explains insufficient eligible questions |
| 4 | learner | `quick-quiz-session` / `quiz-active` | Fill every blank by selecting terms from the word bank, revise choices before checking, then check and inspect the solution | Per-blank outcomes and progress are acknowledged without any reveal-and-rate fallback |
| 5 | learner | `quick-quiz-session` / `quiz-saving` | Leave for later, resume a valid run, expire, or recover from an invalid legacy or mixed-card run | Valid work restores; non-cloze or malformed work returns to setup without being scored as an assessment |
| 6 | learner | `quick-quiz-result` / `quiz-result` | Inspect coverage, XP, per-card outcomes and weak topics | The learner retries, returns, or opens contextual study |

Outcome: The learner completes or safely pauses a cloze-valid scored assessment and receives evidence-linked follow-up

Evidence: `EV-001`, `EV-009`, `EV-010`, `EV-011`, `EV-012`, `EV-013`, `EV-014`, `EV-015`
