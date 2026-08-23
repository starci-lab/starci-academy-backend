# States · Practice and assessment

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `assessment-ready` | initial | Assessment ready | assessment-pending, assessment-error | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-006` |
| `assessment-pending` | pending | Assessment pending | assessment-complete, assessment-error | `EV-009`, `EV-010` |
| `assessment-complete` | success | Assessment complete | terminal | `EV-008`, `EV-009`, `EV-010` |
| `assessment-error` | error | Assessment failed | assessment-ready | `EV-002`, `EV-009`, `EV-010` |
