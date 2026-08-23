# States · Projects and career

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `project-ready` | initial | Project or career surface ready | project-pending, project-complete, project-error | `EV-001`, `EV-004`, `EV-005` |
| `project-pending` | pending | Project submission pending | project-ready, project-complete, project-error | `EV-007` |
| `project-complete` | success | Project milestone complete | terminal | `EV-003`, `EV-004` |
| `project-error` | error | Project or career request failed | project-ready | `EV-004`, `EV-005` |
