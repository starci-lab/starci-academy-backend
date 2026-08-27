# Flow · Personal project learning loop

> ID: `personal-project-learning-loop` · Trigger: An enrolled learner opens the personal-project roadmap.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `learner` | `personal-project-roadmap` | Resume the project | Backend-determined next task, progress and repository summary are visible |
| 2 | `learner` | `personal-project-task` | Read the task | Brief stays readable independently of ancillary recovery |
| 3 | `learner` | `personal-project-task` | Choose language, Auto or eligible model, branch and optional token | Active review intent is summarized |
| 4 | `learner` | `personal-project-task` | Submit repository evidence once | One asynchronous review job binds task, repository, language and model intent |
| 5 | `learner` | `personal-project-task` | Observe queued/processing state | The same in-flight review survives reload and accidental duplicate submit is blocked |
| 6 | `learner` | `personal-project-result` | Inspect a completed attempt | Score, verdict, served model and findings are coherent for the selected attempt |
| 7 | `learner` | `personal-project-result` | Revise after failure or continue after pass | Settings remain available for revision or the deterministic next task opens |

## Outcome

The learner finishes a personal-project milestone through traceable repository and AI-grading evidence without losing course context.

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-009`, `EV-010`, `EV-011`, `EV-012`, `EV-013`, `EV-014`, `EV-015`, `EV-016`
