# Acceptance · AgentOS AI and knowledge provisioning

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Provisioning one AgentOS workspace idempotently mints or reuses exactly one workspace-scoped OpenRouter credential with initial lifetime limit workspace.instance.plan.creditGrantUsd, stores its raw value only in encrypted secret custody, delivers it to that workspace and never returns it to the owner. | `EV-001`, `EV-006`, `EV-007`, `EV-017`, `EV-020`, `EV-021` |
| `AC-02` | The workspace uses the provider-validated deepseek/deepseek-v4-flash chat model and exposes that identity without offering an arbitrary model or provider picker. | `EV-001`, `EV-005` |
| `AC-03` | Nivo common knowledge and every installed module knowledge package are represented in global Qdrant by immutable versioned digest-bound artifacts using nivo-qwen3-embedding-8b-4096-v1 at dimension 4096 and copied into the exact workspace without direct global-Qdrant access. | `EV-001`, `EV-008`, `EV-009`, `EV-010`, `EV-017`, `EV-018` |
| `AC-04` | Knowledge recovery builds a staging collection, copies all customer and upload points, imports declared artifacts, verifies geometry, digests, origin counts, customer point identities and scoped retrieval, and only then atomically switches the stable alias while retaining the previous verified generation. | `EV-001`, `EV-008`, `EV-017`, `EV-019` |
| `AC-05` | A PDF, DOCX, UTF-8 text or Markdown upload of at most 20971520 bytes is quarantined, scanned fail-closed by ClamAV, extracted by its supported non-OCR extractor, deterministically chunked, embedded with nivo-qwen3-embedding-8b-4096-v1 and indexed with workspace and module scope; filename-only vectors fail acceptance. | `EV-001`, `EV-011`, `EV-017`, `EV-028`, `EV-029` |
| `AC-06` | One upload failure exposes its policy, scan, extraction, embedding or index failure code and retry without discarding another document or changing module-intake state; malware and refused objects are deleted immediately after safe failure persistence. | `EV-001`, `EV-011`, `EV-017`, `EV-028`, `EV-030` |
| `AC-07` | Automatic provisioning persists knowledgeRecoveryOperationId and readinessOperationId, then one durable ai_readiness_test executes within 30000 ms and zero retries using one embedding, one scoped retrieval and one DeepSeek completion before reporting aiReady=true. | `EV-001`, `EV-014`, `EV-015`, `EV-016`, `EV-017`, `EV-023`, `EV-025`, `EV-026`, `EV-027` |
| `AC-08` | The owner can request one readiness operation when no run is active and its 300000 ms cooldown has elapsed, with 2048 input/context tokens and 256 output tokens maximum, and receives component verdicts, timestamp and safe failure code without raw keys, provider response, prompt, document text, vectors or point identifiers. | `EV-001`, `EV-012`, `EV-014`, `EV-017`, `EV-023`, `EV-024` |
| `AC-09` | Module retrieval is constrained to the declared common version, explicitly shared workspace sources and the private knowledge matching the exact installationId, moduleKey and knowledgeVersion. | `EV-001`, `EV-009`, `EV-010` |
| `AC-10` | The workspace control center, provisioning flow, existing attachment management and installation detail expose only their owned AI and knowledge states while sharing one backend-owned readiness truth; no operation or surface in this feature performs ask-until-complete module intake or interview orchestration. | `EV-001`, `EV-002`, `EV-003`, `EV-012`, `EV-013`, `EV-017`, `EV-030` |
| `AC-11` | A renewal or top-up sets the workspace key lifetime limit to current provider spend plus plan.creditGrantUsd; suspension disables it; deprovisioning reconciles usage and then destroys it; no scheduled rotation is introduced. | `EV-017`, `EV-020`, `EV-021`, `EV-022` |
| `AC-12` | Owner removal makes the document immediately unavailable to retrieval and deletes its retained original object within 24 hours while keeping only safe lifecycle evidence. | `EV-017`, `EV-028`, `EV-030` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
