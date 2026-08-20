# Flow · Expert academy control center

> ID: `academy-control-center-journey` · Trigger: Open an owned app

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `account-actor` | `academy-control-center` | Open an owned app | Choose Growth or System |
| 2 | `account-actor` | `academy-control-center` | Choose Growth or System | Read the relevant owner-scoped domain block |
| 3 | `account-actor` | `academy-control-center` | Read the relevant owner-scoped domain block | Perform an available student, lead or integration action |
| 4 | `account-actor` | `academy-control-center` | Perform an available student, lead or integration action | The academy owner sees only the selected owned site |

## Outcomes

- The academy owner sees only the selected owned site
- Secret values are accepted but not shown again

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
