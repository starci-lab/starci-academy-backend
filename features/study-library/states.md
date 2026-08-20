# States · Study library

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `study-ready` | initial | Study mode ready | study-pending, study-empty, study-error | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005` |
| `study-pending` | pending | Study session pending | study-ready, study-error | `EV-006`, `EV-007` |
| `study-empty` | empty | No study material | study-ready | `EV-002`, `EV-004` |
| `study-error` | error | Study tool failed | study-ready | `EV-002`, `EV-004` |
