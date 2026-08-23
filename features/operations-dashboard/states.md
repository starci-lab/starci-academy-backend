# States · Operations dashboard

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `resting` | initial | resting | empty | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005` |
| `empty` | empty | empty | answered | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005` |
| `answered` | success | answered | refused | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005` |
| `refused` | error | refused | terminal | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005` |
