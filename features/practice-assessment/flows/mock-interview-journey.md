# Flow · Practise through a resumable mock interview loop

> ID: `mock-interview-journey` · Trigger: A learner opens the mock interview route for a course.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `learner` | `mock-interview-setup` | Open the course mock interview home | The learner can resume an unfinished session, prepare a new one, or inspect prior development |
| 2 | `learner` | `mock-interview-setup` | Resume the saved session or choose interview format and target level | A resumable session opens or a new setup is ready with its format contract explained |
| 3 | `learner` | `mock-interview-setup` | Start the configured interview | The server draws and persists a course-scoped session with a declared phase or turn total |
| 4 | `learner` | `mock-interview-session` | Answer and submit each interview prompt | Submitted turns and the server-confirmed position remain recoverable across leave, refresh and reconnect |
| 5 | `platform` | `mock-interview-result` | Assess the completed interview against the declared rubric | The learner sees truthful submitting, grading, delayed or failed status until an assessment exists |
| 6 | `learner` | `mock-interview-result` | Inspect answer-linked strengths, gaps and course recommendations | The learner chooses a weak-area practice, a new full interview, or recommended course content |
| 7 | `learner` | `mock-interview-setup` | Review graded history and comparable progress | The learner sees attempt details or an explicit insufficient-data explanation instead of misleading zeroes |

## Outcomes

- The learner repeatedly practises a course-scoped interview without losing confirmed work and converts evidence-based assessment into a next learning action

Evidence: `EV-006`, `EV-007`, `EV-008`, `EV-010`, `EV-013`, `EV-015`
