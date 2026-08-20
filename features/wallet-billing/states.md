# States · Wallet and invoice settlement

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `resting` | initial | resting | empty | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `empty` | empty | empty | answered | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `answered` | success | answered | refused | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `refused` | error | refused | paying | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `paying` | pending | paying | paid | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `paid` | success | paid | terminal | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
