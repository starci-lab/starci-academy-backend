# States · Template app lifecycle

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `catalog-loading` | initial | catalog-loading | request | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `request` | pending | request | submitting | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `submitting` | pending | submitting | accepted | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `accepted` | pending | accepted | preparing | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `preparing` | pending | preparing | ready | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `ready` | success | ready | failed | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `failed` | error | failed | unsupported | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `unsupported` | pending | unsupported | terminal | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
