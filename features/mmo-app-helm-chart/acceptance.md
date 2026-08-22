# Acceptance · MMO application Helm chart

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | One distinct MMO Helm chart package exists at an explicitly approved artifact owner and passes deterministic Helm lint and template validation. | `EV-001` |
| `AC-02` | The backend can resolve the approved MMO chart reference and optional version through the generic chart-source contract without an MMO chart-selection branch. | `EV-001`, `EV-004`, `EV-005` |
| `AC-03` | MMO remains non-provisionable and gains no catalogue, frontend or management behavior under this feature. | `EV-001`, `EV-002` |
| `AC-04` | A null, unsupported or missing MMO chart source is refused before Helm executes. | `EV-004` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
