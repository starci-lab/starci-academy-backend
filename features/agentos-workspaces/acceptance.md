# Acceptance · AgentOS workspace lifecycle and control center

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Creating an AgentOS order establishes /[locale]/agentos/orders/[orderId] as the exact resumable journey context. | `EV-001`, `EV-003` |
| `AC-02` | The Wallet waypoint identifies and pays the invoice linked to that exact order and exposes a return to the same order rather than choosing an unrelated unpaid invoice. | `EV-001`, `EV-003`, `EV-004` |
| `AC-03` | When provisioning resolves a ready workspaceId, the primary action opens /[locale]/agentos/workspaces/[workspaceId], not the generic AgentOS index. | `EV-001`, `EV-003`, `EV-005` |
| `AC-04` | Module detail and OpenClaw launch are reachable only as optional branches from a ready exact workspace and are absent from required primary progress. | `EV-001`, `EV-006`, `EV-007`, `EV-009` |
| `AC-05` | Launch idle, opening, connected, blocked, expired and disconnected transitions remain independent from request, payment, provisioning and workspace readiness states. | `EV-001`, `EV-008`, `EV-012`, `EV-013` |
| `AC-06` | The control center renders no runnable update, plan change, backup, reset or rebuild control until the corresponding public backend operation exists. | `EV-010` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
