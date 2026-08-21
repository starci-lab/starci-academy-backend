# States · Shared console shell navigation

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `expanded` | initial | Expanded desktop rail | collapsed | `EV-001`, `EV-002`, `EV-006` |
| `collapsed` | success | Compact desktop rail | expanded | `EV-006` |
| `mobile-closed` | initial | Mobile drawer closed | mobile-open | `EV-001`, `EV-004`, `EV-005`, `EV-006` |
| `mobile-open` | success | Mobile drawer open | mobile-closed | `EV-004`, `EV-005`, `EV-006` |
