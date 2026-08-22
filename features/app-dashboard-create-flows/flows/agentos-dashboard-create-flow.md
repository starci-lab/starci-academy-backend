# Flow · Manage and create AgentOS workspaces

> ID: `agentos-dashboard-create-flow` · Trigger: An authenticated owner opens the AgentOS product dashboard or chooses its create action.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `app-owner` | `agentos-dashboard` | Review existing AgentOS workspaces on the management-only dashboard. | The owner can manage an existing workspace or navigate to the separate create route. |
| 2 | `app-owner` | `agentos-create` | Open /:locale/agentos/create without a persisted identifier. | A new AgentOS request can be entered independently of the workspace list. |
| 3 | `app-owner` | `agentos-order-resume` | Continue on /:locale/agentos/orders/:orderId after order persistence. | The persisted order owns its payment and provisioning resume state. |
| 4 | `app-owner` | `agentos-workspace` | Open /:locale/agentos/workspaces/:workspaceId after workspace readiness. | The persisted workspace owns its terminal management experience. |

## Outcomes

- AgentOS dashboard management, pre-persistence creation, persisted-order resume and terminal workspace management each have one unambiguous route owner.

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`
