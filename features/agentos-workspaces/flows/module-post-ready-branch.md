# Flow · Inspect an installed solution module after workspace readiness

> ID: `module-post-ready-branch` · Trigger: The owner chooses a solution installation from the exact ready workspace

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `account-owner` | `agentos-module` | Choose one installation belonging to the exact workspace | The nested module route preserves both workspace and installation identity |
| 2 | `account-owner` | `agentos-module` | Inspect package lifecycle and generated bindings | Module detail remains an optional branch from the ready workspace |

## Outcomes

- The owner can inspect one installation without extending the primary provisioning journey

Evidence: `EV-001`, `EV-006`, `EV-009`, `EV-011`
