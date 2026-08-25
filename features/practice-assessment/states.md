# States · Practice and assessment

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `assessment-ready` | initial | Assessment ready | assessment-pending, assessment-error | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-006` |
| `assessment-pending` | pending | Assessment pending | assessment-complete, assessment-error | `EV-009`, `EV-010` |
| `assessment-complete` | success | Assessment complete | terminal | `EV-008`, `EV-009`, `EV-010` |
| `assessment-error` | error | Assessment failed | assessment-ready | `EV-002`, `EV-009`, `EV-010` |
| `playground-catalog-ready` | initial | Playground catalog ready | playground-setup-pending | `EV-004`, `EV-014` |
| `playground-setup-pending` | pending | Playground setup pending | playground-setup-ready, playground-setup-error | `EV-014` |
| `playground-setup-ready` | success | Playground setup ready | playground-session-active | `EV-014` |
| `playground-setup-error` | error | Playground setup failed | playground-setup-pending | `EV-014` |
| `playground-session-active` | success | Playground session active | playground-session-reconnecting, playground-session-complete, playground-session-error | `EV-005`, `EV-014` |
| `playground-session-reconnecting` | pending | Playground session reconnecting | playground-session-active, playground-session-error | `EV-014` |
| `playground-session-complete` | success | Playground session complete | terminal | `EV-014` |
| `playground-session-error` | error | Playground session failed | playground-session-reconnecting | `EV-014` |
