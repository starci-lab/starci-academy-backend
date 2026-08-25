# Flow · Complete a mock interview

> ID: `mock-interview-journey` · Trigger: A learner opens the mock interview route for a course.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `learner` | `mock-interview-setup` | Choose the interview level and kind | The setup is ready to start |
| 2 | `learner` | `mock-interview-setup` | Start the interview | The server draws and persists the interview session |
| 3 | `learner` | `mock-interview-session` | Complete the interview turns | The session reaches an assessed outcome |
| 4 | `learner` | `mock-interview-result` | Inspect the assessed result | The learner sees the completed interview assessment |

## Outcomes

- The learner completes a persisted mock interview journey from setup through assessed result

Evidence: `EV-006`, `EV-007`, `EV-008`, `EV-010`, `EV-013`
