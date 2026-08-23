# States · Expert academy control center

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `restoring` | initial | restoring | ready | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `ready` | success | ready | refused | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `refused` | error | refused | empty | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `empty` | empty | empty | saving | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `saving` | pending | saving | saved | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `saved` | success | saved | action-failed | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `action-failed` | error | action-failed | terminal | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
