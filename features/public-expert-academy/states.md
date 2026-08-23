# States · Public expert academy

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `catalog-ready` | initial | catalog-ready | catalog-empty | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `catalog-empty` | empty | catalog-empty | lead-idle | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `lead-idle` | pending | lead-idle | lead-sending | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `lead-sending` | pending | lead-sending | lead-sent | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `lead-sent` | success | lead-sent | lead-failed | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `lead-failed` | error | lead-failed | terminal | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
