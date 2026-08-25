# Flow · Complete a guided Playground

> ID: `playground-journey` · Trigger: A learner opens the Playground catalog for a course.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `learner` | `playground-catalog` | Choose a guided Playground | The selected Playground setup opens |
| 2 | `learner` | `playground-setup` | Pair a machine and satisfy every declared readiness check | The setup becomes ready for explicit entry |
| 3 | `learner` | `playground-setup` | Enter the prepared Playground | The guided live workspace opens without discarding setup context |
| 4 | `learner` | `playground-session` | Follow the guide and use the playground-kind workspace | The learner completes or safely reconnects to the live session |

## Outcomes

- The learner moves from discovery through explicit readiness into a guided live Playground session.

Evidence: `EV-004`, `EV-005`, `EV-014`
