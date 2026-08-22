# States · Multi-app provisioning registry

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `registered` | initial | Registered | unavailable, ready | `EV-001`, `EV-002` |
| `unavailable` | partial | Not provisionable | terminal | `EV-001`, `EV-003`, `EV-005` |
| `ready` | success | Ready to provision | provisioning | `EV-001`, `EV-004`, `EV-006` |
| `provisioning` | pending | Running app policy | terminal | `EV-001`, `EV-002`, `EV-003` |
| `apps-loading` | pending | Apps loading | apps-ready, apps-empty, apps-failed | `EV-007` |
| `apps-ready` | success | Apps ready | terminal | `EV-007` |
| `apps-empty` | empty | No current apps | terminal | `EV-007` |
| `apps-failed` | error | Apps unavailable | apps-loading | `EV-007` |
