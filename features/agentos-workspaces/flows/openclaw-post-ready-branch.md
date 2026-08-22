# Flow · Open a short-lived OpenClaw launch after workspace readiness

> ID: `openclaw-post-ready-branch` · Trigger: The owner chooses OpenClaw from the exact ready workspace

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `account-owner` | `openclaw-launch` | Issue a secure launch for the exact workspace | The launch axis advances from idle to opening |
| 2 | `account-owner` | `openclaw-launch` | Connect, renew, expire or revoke the short-lived launch | Launch state changes without changing workspace readiness |

## Outcomes

- OpenClaw access is optional, exact-workspace scoped and independently stateful

Evidence: `EV-001`, `EV-007`, `EV-008`, `EV-009`, `EV-012`, `EV-013`
