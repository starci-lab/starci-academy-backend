# Flow · Template app lifecycle

> ID: `app-lifecycle-journey` · Trigger: Choose Build on a supported template

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `account-actor` | `apps-catalogue` | Choose Build on a supported template | Submit a stable app slug |
| 2 | `account-actor` | `template-app-provisioning` | Submit a stable app slug | Follow deployment progress |
| 3 | `account-actor` | `template-app-provisioning` | Follow deployment progress | Open the ready app control center |
| 4 | `account-actor` | `template-app-provisioning` | Open the ready app control center | A draft expert site and deployment identity are created |

## Outcomes

- A draft expert site and deployment identity are created
- A failed or unsupported request is shown explicitly

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
