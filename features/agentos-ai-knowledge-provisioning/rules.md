# Business rules · AgentOS AI and knowledge provisioning

## BR-01

Every AgentOS workspace receives exactly one OpenRouter credential. Its initial lifetime limit equals workspace.instance.plan.creditGrantUsd; renewal or top-up raises the lifetime limit to current provider spend plus that plan grant. Rotation is event-driven only, suspension disables the key, deprovisioning reconciles usage then destroys it, the raw key remains in encrypted custody and no owner-facing response exposes it or its provider management handle.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-006`, `EV-007`, `EV-017`, `EV-020`, `EV-021`, `EV-022`

## BR-02

The workspace chat model is pinned to deepseek/deepseek-v4-flash through OpenRouter and must be provider-validated before the runtime can be considered AI-ready.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-005`

## BR-03

Chat-model choice and knowledge embedding geometry are separate contracts. Every common, module, upload and retrieval vector uses embedding profile nivo-qwen3-embedding-8b-4096-v1: qwen3-embedding:8b for the global builder, qwen/qwen3-embedding-8b through workspace OpenRouter, and dimension 4096. Any model or geometry change creates a new profile and requires a staged rebuild.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-010`, `EV-011`, `EV-017`, `EV-018`

## BR-04

Nivo common knowledge and each immutable solution-module knowledge package are vectorized in Nivo's global Qdrant into versioned digest-bound artifacts; installing a module copies its declared artifact into the workspace knowledge generation without giving that workspace direct access to global Qdrant.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-008`, `EV-009`, `EV-010`, `EV-017`

## BR-05

Knowledge recovery writes a staging collection behind a stable workspace alias, copies every existing customer and uploaded-document point, imports the declared common and module artifacts, verifies geometry, artifact digests, origin counts, customer point identities and scoped retrieval, then switches the alias atomically. Failure leaves the alias unchanged and retains the previous verified generation.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-008`, `EV-017`, `EV-019`

## BR-06

An uploaded module document is accepted only for PDF, DOCX, UTF-8 text or Markdown at no more than 20971520 bytes. It becomes retrieval knowledge only after fail-closed ClamAV quarantine scanning, supported text extraction without PDF OCR, deterministic chunking, pinned-profile embedding and scoped Qdrant indexing; filename-only indexing never satisfies readiness.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-011`, `EV-017`, `EV-028`, `EV-029`

## BR-07

A module agent may search the common version, explicitly shared workspace sources and the private knowledge matching its exact installationId, moduleKey and knowledgeVersion; it may not search another installation's private layer.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-009`, `EV-010`

## BR-08

A durable ai_readiness_test operation permits one concurrent run, a 30000 ms deadline, zero retries, a 300000 ms cooldown, at most 2048 input/context tokens and 256 output tokens, and exactly one embedding call, one scoped retrieval and one DeepSeek completion. Helm success or service health without that bounded call is insufficient.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-014`, `EV-015`, `EV-017`, `EV-023`, `EV-024`

## BR-09

Workspace readiness surfaces return only provider and model identity, masked credential status, artifact provenance, document counts by origin, component verdicts, timestamps and safe failure codes; they never return raw keys, document text, vectors, point identifiers, raw prompts or raw provider responses.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-012`

## BR-10

Automatic provisioning and owner-triggered retries share the durable ai_readiness_test operation. Provisioning persists knowledgeRecoveryOperationId and readinessOperationId and sets aiReady only after success; failure preserves the workspace and last verified knowledge with aiReady=false.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-008`, `EV-011`, `EV-017`, `EV-023`, `EV-025`, `EV-026`, `EV-027`

## BR-11

Removing an active uploaded document immediately removes its retrieval points and access, then deletes the retained original object within 24 hours. Malware or policy-refused objects are deleted immediately after a safe failure code is persisted; otherwise the original is retained while its attachment is active.

- Strength: `confirmed`
- Evidence: `EV-017`, `EV-028`

## BR-12

This capability owns AI credential, knowledge artifact, document-ingestion and readiness provisioning only; ask-until-complete custom-module intake and module interview orchestration remain exclusively under agentos-module-studio.

- Strength: `confirmed`
- Evidence: `EV-017`, `EV-030`
