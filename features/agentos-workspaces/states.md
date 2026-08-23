# States · AgentOS workspace lifecycle and control center

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `order-request` | initial | Order · request | order-submitting | `EV-002` |
| `order-submitting` | pending | Order · submitting | order-awaiting-payment, workspace-failed | `EV-002` |
| `order-awaiting-payment` | pending | Order · awaiting payment | order-accepted, workspace-failed | `EV-002`, `EV-003` |
| `order-accepted` | pending | Order · accepted | workspace-preparing, workspace-failed | `EV-002` |
| `wallet-awaiting-payment` | initial | Wallet · awaiting payment | wallet-paying | `EV-001`, `EV-004` |
| `wallet-paying` | pending | Wallet · paying | wallet-paid, wallet-refused | `EV-004` |
| `wallet-paid` | success | Wallet · paid | terminal | `EV-001`, `EV-004` |
| `wallet-refused` | error | Wallet · refused | wallet-paying | `EV-004` |
| `workspace-preparing` | pending | Workspace · preparing | workspace-ready, workspace-failed | `EV-002` |
| `workspace-ready` | success | Workspace · ready | terminal | `EV-001`, `EV-002`, `EV-005`, `EV-010` |
| `workspace-failed` | error | Workspace · failed | terminal | `EV-002` |
| `module-loading` | pending | Module · loading | module-ready, module-refused | `EV-006`, `EV-011` |
| `module-ready` | success | Module · ready | terminal | `EV-006`, `EV-011` |
| `module-refused` | error | Module · refused | terminal | `EV-006`, `EV-011` |
| `launch-idle` | initial | Launch · idle | launch-opening | `EV-008` |
| `launch-opening` | pending | Launch · opening | launch-connected, launch-blocked, launch-expired | `EV-008`, `EV-012`, `EV-013` |
| `launch-connected` | success | Launch · connected | launch-expired, launch-disconnected | `EV-008`, `EV-013` |
| `launch-blocked` | error | Launch · blocked | launch-opening | `EV-008`, `EV-012`, `EV-013` |
| `launch-expired` | error | Launch · expired | launch-opening | `EV-008`, `EV-013` |
| `launch-disconnected` | partial | Launch · disconnected | launch-opening | `EV-008` |
| `operation-idle` | initial | Operation · idle | operation-running | `EV-018`, `EV-025` |
| `operation-running` | pending | Operation · running | operation-succeeded, operation-refused | `EV-025` |
| `operation-succeeded` | success | Operation · succeeded | terminal | `EV-025` |
| `operation-refused` | error | Operation · refused | operation-idle | `EV-025` |
| `plan-awaiting-payment` | pending | Plan change · awaiting payment | plan-applying, operation-refused | `EV-001`, `EV-025` |
| `plan-applying` | pending | Plan change · applying | operation-succeeded, operation-refused | `EV-025` |
| `knowledge-loading` | pending | Knowledge runtime · loading | knowledge-ready, knowledge-degraded | `EV-022`, `EV-025` |
| `knowledge-ready` | success | Knowledge runtime · ready | knowledge-reindexing | `EV-022`, `EV-025` |
| `knowledge-degraded` | partial | Knowledge runtime · degraded | knowledge-loading, knowledge-reindexing | `EV-022`, `EV-025` |
| `knowledge-reindexing` | pending | Knowledge runtime · reindexing | knowledge-ready, knowledge-refused | `EV-025` |
| `knowledge-refused` | error | Knowledge runtime · refused | knowledge-reindexing | `EV-025` |
