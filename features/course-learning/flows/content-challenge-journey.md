# Flow · Recoverable content challenge

> ID: `content-challenge-journey` · Trigger: An authenticated learner with course access opens a Challenge attached to course content.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `learner` | `content-challenge` | Open the exact Challenge and review its task, constraints, rubric and permitted-help policy | The learner understands required evidence and availability |
| 2 | `learner` | `content-challenge` | Create and save a recoverable draft while requesting only policy-permitted progressive hints | The latest draft is resumable without replacing a submitted attempt |
| 3 | `learner` | `content-challenge` | Submit the current draft once | One immutable attempt enters deterministic validation and rubric-constrained evaluation |
| 4 | `learner` | `content-challenge` | Inspect criterion evidence, gaps, uncertainty and next learning action | A server-authoritative passed, needs-revision or evaluation-unavailable result is visible |
| 5 | `learner` | `content-challenge` | Start a new attempt or resume an interrupted evaluation | Prior attempt and result history remain intact |

## Outcomes

- The learner proves applied course knowledge through a recoverable attempt and receives trustworthy evidence-linked feedback for the next learning action.

Evidence: `EV-004`, `EV-005`, `EV-016`, `EV-017`
