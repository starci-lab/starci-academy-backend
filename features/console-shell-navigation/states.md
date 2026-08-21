# States · Shared console shell navigation

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `expanded` | initial | Expanded desktop rail | terminal | `EV-001`, `EV-002` |
| `mobile-closed` | initial | Mobile drawer closed | mobile-open | `EV-001`, `EV-004`, `EV-005` |
| `mobile-open` | success | Mobile drawer open | mobile-closed | `EV-004`, `EV-005` |
