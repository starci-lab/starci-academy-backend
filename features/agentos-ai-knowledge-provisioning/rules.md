# Business rules · AgentOS AI and knowledge provisioning

## BR-01

Every AgentOS workspace receives its own OpenRouter credential; minting and delivery are idempotent, the provider key is stored encrypted for delivery, and no owner-facing response contains the raw key or provider management handle.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-006`, `EV-007`

## BR-02

The workspace chat model is pinned to deepseek/deepseek-v4-flash through OpenRouter and must be provider-validated before the runtime can be considered AI-ready.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-005`

## BR-03

Chat-model choice and knowledge embedding geometry are separate contracts; every common, module, upload and retrieval vector in one workspace must use one compatible pinned embedding profile and dimension.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-010`, `EV-011`

## BR-04

Nivo common knowledge and each immutable solution-module knowledge package are vectorized centrally into versioned digest-bound artifacts and imported into a workspace without giving that workspace direct access to central Qdrant.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-008`, `EV-009`, `EV-010`

## BR-05

Recovering or refreshing a Nivo or module artifact never deletes, replaces or makes unreachable customer-uploaded knowledge; the last verified state remains recoverable when refresh fails.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-008`

## BR-06

An uploaded module document becomes retrieval knowledge only after successful quarantine scan, content extraction, deterministic chunking, embedding and scoped Qdrant indexing; filename-only indexing never satisfies readiness.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-011`

## BR-07

A module agent may search the common version, explicitly shared workspace sources and the private knowledge matching its exact installationId, moduleKey and knowledgeVersion; it may not search another installation's private layer.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-009`, `EV-010`

## BR-08

AI readiness verifies the actual workspace credential, pinned model, embedding lane, workspace Qdrant and scoped retrieval; Helm success or service health without that bounded call is insufficient.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-014`, `EV-015`

## BR-09

Workspace readiness surfaces return only provider and model identity, masked credential status, artifact provenance, document counts by origin, component verdicts, timestamps and safe failure codes; they never return raw keys, document text, vectors, point identifiers, raw prompts or raw provider responses.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-012`

## BR-10

Automatic provisioning and owner-triggered retries share one idempotent readiness state machine; a refusal does not destroy an already-created workspace, accepted module specification or successfully indexed document.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-008`, `EV-011`
