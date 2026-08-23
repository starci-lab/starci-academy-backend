# Overview · AgentOS AI and knowledge provisioning

## Purpose

An authenticated AgentOS workspace owner receives one budgeted workspace-scoped OpenRouter credential, a pinned DeepSeek chat model, one pinned 4096-dimensional Qwen3 embedding profile, immutable Nivo and module knowledge artifacts, atomic non-destructive workspace Qdrant recovery, policy-bounded uploaded-document ingestion and a durable owner-safe AI readiness result before the AI runtime is treated as ready.

## Included

- Idempotent one-key-per-workspace OpenRouter credential minting, encrypted secret delivery, plan-funded spend limits and event-driven disable or destruction lifecycle
- Pinned DeepSeek chat-model identity validated against the configured OpenRouter provider
- Centrally built immutable Nivo common-knowledge and solution-module vector artifacts pinned to nivo-qwen3-embedding-8b-4096-v1 with version and digest provenance
- Workspace-local Qdrant staging-generation import and atomic stable-alias switch that preserves customer-uploaded knowledge and the previous verified generation
- Policy-bounded PDF, DOCX, UTF-8 plain-text and Markdown upload quarantine, fail-closed ClamAV scanning, extraction, chunking, embedding, indexing, removal and refusal states
- Owner-safe AI and knowledge readiness visibility backed by a durable ai_readiness_test workspace operation
- Provisioning, workspace knowledge and module-installation status projections owned by their existing routes

## Excluded

- Returning or rendering raw OpenRouter credentials or provider management handles
- Allowing a workspace pod to query or mount Nivo's central Qdrant directly
- Returning raw document text, vector values, point identifiers, raw prompts or raw provider responses through the console
- An owner-selectable provider or arbitrary chat-model picker
- Changing immutable solution-module catalogue identities, versions or installation ownership
- Treating a successful Helm release alone as proof that the AI runtime can answer
- Ask-until-complete custom-module intake, conversational requirement elicitation and module interview orchestration owned by agentos-module-studio

## Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/nivo-fe.git | `ca8109dc2c5ca4f6e631c41528b7af2eac598ca0` |
| be | https://github.com/starci-lab/nivo-backend.git | `b56ca6b1d19bd9b511830c398381f6eb4a902e1c` |
