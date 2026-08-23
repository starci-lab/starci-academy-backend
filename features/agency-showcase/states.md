# States · Agency showcase and lead capture

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `showcase-ready` | initial | Showcase ready | lead-pending | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `lead-pending` | pending | Contact lead sending | lead-sent, lead-error | `EV-007`, `EV-008` |
| `lead-sent` | success | Contact lead sent | terminal | `EV-007`, `EV-008` |
| `lead-error` | error | Contact lead failed | showcase-ready | `EV-007`, `EV-008` |
