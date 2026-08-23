# Acceptance · AgentOS workspace lifecycle and control center

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Creating an AgentOS order establishes /[locale]/agentos/orders/[orderId] as the exact resumable journey context. | `EV-001`, `EV-003` |
| `AC-02` | The Wallet waypoint identifies and pays the invoice linked to that exact order and exposes a return to the same order rather than choosing an unrelated unpaid invoice. | `EV-001`, `EV-003`, `EV-004` |
| `AC-03` | When provisioning resolves a ready workspaceId, the primary action opens /[locale]/agentos/workspaces/[workspaceId], not the generic AgentOS index. | `EV-001`, `EV-003`, `EV-005` |
| `AC-04` | Module detail and OpenClaw launch are reachable only as optional branches from a ready exact workspace and are absent from required primary progress. | `EV-001`, `EV-006`, `EV-007`, `EV-009` |
| `AC-05` | Launch idle, opening, connected, blocked, expired and disconnected transitions remain independent from request, payment, provisioning and workspace readiness states. | `EV-001`, `EV-008`, `EV-012`, `EV-013` |
| `AC-06` | Update, plan change, backup, restart and rebuild controls become runnable only through their corresponding public owner-scoped backend operations and expose real pending, success and refusal states. | `EV-018`, `EV-025` |
| `AC-07` | A ready exact workspace can issue, renew and revoke n8n launch with the same app-bound short-lived security and independent launch state used by OpenClaw. | `EV-019`, `EV-020`, `EV-025` |
| `AC-08` | Restart preserves persistent data; backup verifies its artifact; rebuild requires explicit confirmation plus a fresh verified backup and never masquerades as Restart. | `EV-021`, `EV-025` |
| `AC-09` | Plan change returns an exact adjustment order and linked Wallet invoice and does not apply the new plan until payment succeeds. | `EV-001`, `EV-025` |
| `AC-10` | Infrastructure exposes MCP and Qdrant health, knowledge document counts by origin, last update and reindex state without credentials, raw text, point ids, admin routes or control-plane search. | `EV-022`, `EV-023`, `EV-024`, `EV-025` |
| `AC-11` | Launch, operation and knowledge reindex conditions render as block states inside the existing workspace page architecture; they do not become page states unless page anatomy changes. | `EV-025` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
