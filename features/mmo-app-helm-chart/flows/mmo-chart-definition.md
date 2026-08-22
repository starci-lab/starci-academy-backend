# Flow · Define and validate the MMO chart package

> ID: `mmo-chart-definition` · Trigger: The owner requires one backend-consumable Helm chart for the MMO application.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `control-plane-maintainer` | `mmo-chart-package` | Open implementation for the approved charts/mmo artifact while preserving every unresolved activation decision. | The exact generic chart contract is in progress and cannot be mistaken for implemented provisioning. |
| 2 | `control-plane-maintainer` | `mmo-chart-package` | Define charts/mmo with required image repository, image tag and service port plus configurable ingress, persistence and probes. | The generic chart package can be authored without borrowing Academy runtime behavior or inventing concrete deployment values. |
| 3 | `control-plane-maintainer` | `mmo-chart-package` | Run deterministic Helm lint and template validation with representative non-secret values. | The chart is either validated for backend resolution or refused with an explicit chart error. |

## Outcomes

- One MMO chart artifact can be resolved and validated without enabling MMO provisioning or inventing its customer flow.

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-009`
