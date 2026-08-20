# States · Progress, profile and league

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `progress-ready` | initial | Progress surface ready | progress-pending, progress-empty, progress-error | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `progress-pending` | pending | Progress action pending | progress-ready, progress-error | `EV-007`, `EV-008`, `EV-009` |
| `progress-empty` | empty | No public or league evidence | progress-ready | `EV-004`, `EV-006` |
| `progress-error` | error | Progress request failed | progress-ready | `EV-002`, `EV-006` |
