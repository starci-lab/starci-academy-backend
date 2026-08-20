# Flow · AgentOS workspace lifecycle and control center

> ID: `agentos-workspaces-journey` · Trigger: Request an AgentOS plan

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `account-actor` | `agentos-order` | Request an AgentOS plan | Settle the linked invoice |
| 2 | `account-actor` | `agentos-workspace` | Settle the linked invoice | Wait for workspace fulfillment |
| 3 | `account-actor` | `agentos-solution-detail` | Wait for workspace fulfillment | Open the workspace and manage a solution or application |
| 4 | `account-actor` | `agentos-solution-detail` | Open the workspace and manage a solution or application | The ready workspace appears in AgentOS management |

## Outcomes

- The ready workspace appears in AgentOS management
- Unsupported operations remain descriptive rather than fake controls

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`
