# Acceptance · Separated app dashboards and create flows

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | The AgentOS and Template Apps dashboard routes never render an embedded create or provisioning form. | `EV-001`, `EV-002`, `EV-005` |
| `AC-02` | Each dashboard create action navigates to its dedicated pre-persistence route: /:locale/agentos/create or /:locale/apps/create/:templateKey. | `EV-001`, `EV-006`, `EV-007` |
| `AC-03` | Neither create route carries orderId, workspaceId or siteId; templateKey remains selection context only. | `EV-001`, `EV-003`, `EV-004`, `EV-006`, `EV-009`, `EV-010` |
| `AC-04` | After AgentOS order persistence, frontend navigation replaces the create route with /:locale/agentos/orders/:orderId. | `EV-001`, `EV-003` |
| `AC-05` | After Template App site persistence, frontend navigation replaces the create route with /:locale/apps/:siteId/provisioning. | `EV-001`, `EV-008`, `EV-009` |
| `AC-06` | Direct reload and resume remain owned by the persisted AgentOS order, AgentOS workspace or Template App site routes. | `EV-001`, `EV-003`, `EV-004`, `EV-009`, `EV-010` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
