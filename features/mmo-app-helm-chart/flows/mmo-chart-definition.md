# Flow · Define and validate the MMO chart package

> ID: `mmo-chart-definition` · Trigger: The owner requires one backend-consumable Helm chart for the MMO application.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `control-plane-maintainer` | `mmo-chart-package` | Record the MMO chart as accepted intent while preserving every unresolved runtime decision. | The chart requirement is pending and cannot be mistaken for implemented provisioning. |
| 2 | `control-plane-maintainer` | `mmo-chart-package` | Resolve the artifact owner, chart reference form and complete MMO runtime values contract. | The chart package has enough product truth to be authored without borrowing Academy behavior. |
| 3 | `control-plane-maintainer` | `mmo-chart-package` | Run deterministic Helm lint and template validation with representative non-secret values. | The chart is either validated for backend resolution or refused with an explicit chart error. |

## Outcomes

- One MMO chart artifact can be resolved and validated without enabling MMO provisioning or inventing its customer flow.

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`
