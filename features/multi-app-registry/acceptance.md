# Acceptance · Multi-app provisioning registry

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | A provisionable app row stores a stable key, one Helm chart reference and the app-specific identity, pipeline, step, secret, config-builder, plan and availability policies. | `EV-001`, `EV-002` |
| `AC-02` | Generic fulfillment resolves an app row, refuses unavailable apps before durable instance creation and binds created instances to the registry row. | `EV-003`, `EV-005` |
| `AC-03` | Chart resolution returns the selected app's filesystem or OCI Helm chart argument and rejects absent or unresolved sources before invoking Helm. | `EV-004`, `EV-006` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
