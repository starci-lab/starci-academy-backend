# Flow · Recoverable content challenge

> ID: `content-challenge-journey` · Trigger: An authenticated learner with course access opens a challenge attached to course content.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `learner` | `content-challenge` | Open the exact Challenge and inspect prerequisites, scored requirements, guided steps, expected outputs, hint policy, rubric and attempt history | The learner understands the authored task structure, required evidence and availability without repeated or flattened content |
| 2 | `learner` | `content-challenge` | Complete one or more typed deliverables, choose an eligible grading model and save a recoverable draft | Every deliverable value and the learner model choice are resumable without replacing a submitted attempt |
| 3 | `learner` | `content-challenge` | Review the exact deliverables, selected grading model and submission effects before confirming | The reviewed snapshot is explicit and confirmation creates one immutable submission intent |
| 4 | `learner` | `content-challenge` | Confirm and submit the reviewed draft once | One immutable attempt version enters deterministic validation and rubric-constrained evaluation with the selected model |
| 5 | `learner` | `content-challenge` | Inspect criterion evidence, gaps, uncertainty, model identity and the next learning action | A server-authoritative passed, needs-revision or evaluation-unavailable result is visible |
| 6 | `learner` | `content-challenge` | Start a new attempt from the result or resume an interrupted evaluation | A new draft or resumed evaluation preserves prior immutable attempt and result history |

## Outcomes

- The learner proves applied course knowledge through a recoverable attempt and receives trustworthy evidence-linked feedback for the next learning action

Evidence: `EV-004`, `EV-005`, `EV-016`, `EV-017`, `EV-018`, `EV-019`, `EV-020`
