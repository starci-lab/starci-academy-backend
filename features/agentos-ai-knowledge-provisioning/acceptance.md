# Acceptance · AgentOS AI and knowledge provisioning

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Provisioning one AgentOS workspace idempotently mints or reuses exactly one workspace-scoped OpenRouter credential, stores its raw value only in encrypted secret custody, delivers it to that workspace and never returns it to the owner. | `EV-001`, `EV-006`, `EV-007` |
| `AC-02` | The workspace uses the provider-validated deepseek/deepseek-v4-flash chat model and exposes that identity without offering an arbitrary model or provider picker. | `EV-001`, `EV-005` |
| `AC-03` | Nivo common knowledge and every installed module knowledge package are represented by immutable versioned digest-bound vector artifacts and imported into the exact workspace without direct central-Qdrant access. | `EV-001`, `EV-008`, `EV-009`, `EV-010` |
| `AC-04` | Knowledge recovery or refresh proves that all pre-existing uploaded-document knowledge remains reachable before replacing the last verified workspace state. | `EV-001`, `EV-008` |
| `AC-05` | A scan-ready uploaded module document is downloaded from object storage, extracted, deterministically chunked, embedded with the workspace-compatible profile and indexed with workspace and module scope; filename-only vectors fail acceptance. | `EV-001`, `EV-011` |
| `AC-06` | One upload failure exposes its scan, extraction, embedding or index failure code and retry without discarding another document, accepted interview answer or module specification. | `EV-001`, `EV-011` |
| `AC-07` | Automatic provisioning runs a bounded test through the exact workspace credential, pinned chat model, compatible embedding lane, workspace Qdrant and scoped retrieval before reporting AI-ready. | `EV-001`, `EV-014`, `EV-015`, `EV-016` |
| `AC-08` | The owner can rerun readiness from the exact workspace and receives component verdicts, timestamp and safe failure code without raw keys, provider response, prompt, document text, vectors or point identifiers. | `EV-001`, `EV-012`, `EV-014` |
| `AC-09` | Module retrieval is constrained to the declared common version, explicitly shared workspace sources and the private knowledge matching the exact installationId, moduleKey and knowledgeVersion. | `EV-001`, `EV-009`, `EV-010` |
| `AC-10` | The workspace control center, provisioning flow, module studio and installation detail expose only the states and actions owned by their existing routes while sharing one backend-owned readiness truth. | `EV-001`, `EV-002`, `EV-003`, `EV-012`, `EV-013` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
