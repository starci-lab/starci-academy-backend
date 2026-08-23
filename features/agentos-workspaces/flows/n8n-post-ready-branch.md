# Flow · Open a short-lived n8n launch after workspace readiness

> ID: `n8n-post-ready-branch` · Trigger: The owner chooses n8n from the exact ready workspace

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `account-owner` | `n8n-launch` | Issue an app-bound n8n launch for the exact workspace | The n8n launch axis advances from idle to opening |
| 2 | `account-owner` | `n8n-launch` | Connect, renew, expire or revoke the short-lived n8n launch | n8n launch state changes without changing workspace readiness |

## Outcomes

- n8n access is optional, exact-workspace scoped, credential-free and independently stateful

Evidence: `EV-019`, `EV-020`, `EV-025`
