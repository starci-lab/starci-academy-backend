# Flow · Resolve and provision one registered application

> ID: `multi-app-provisioning-journey` · Trigger: An instance-shaped catalogue fulfillment names an application key

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `control-plane` | `app-registry` | Resolve the provisionable_apps row by stable key | The app-specific policy is available |
| 2 | `control-plane` | `app-registry` | Check whether the row is provisionable | Unavailable apps are refused before instance creation |
| 3 | `control-plane` | `app-registry` | Resolve the row's Helm chart argument and optional version | The installer receives the app-owned chart source |
| 4 | `control-plane` | `app-registry` | Run the row's ordered pipeline and app-specific child configuration | Different applications share the registry lifecycle while retaining distinct child policies |

## Outcomes

- A new application can be represented by data and policy keys without extending a product enum or adding a chart-selection branch

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
