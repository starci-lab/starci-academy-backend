# Flow · Operations dashboard

> ID: `operations-dashboard-journey` · Trigger: Open the protected overview

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `account-actor` | `operations-overview` | Open the protected overview | Read independently settled service summaries |
| 2 | `account-actor` | `operations-overview` | Read independently settled service summaries | Follow an available management destination |
| 3 | `account-actor` | `operations-overview` | Follow an available management destination | The owner sees every answer that succeeded even when another query is refused |

## Outcomes

- The owner sees every answer that succeeded even when another query is refused

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`
