# Overview · AgentOS AI and knowledge provisioning

## Purpose

An authenticated AgentOS workspace owner receives a workspace-scoped OpenRouter credential, a pinned DeepSeek chat model, immutable Nivo and module knowledge artifacts, non-destructive workspace Qdrant recovery, uploaded-document ingestion and an owner-safe AI readiness result before the AI runtime is treated as ready.

## Included

- Idempotent per-workspace OpenRouter credential minting and secret delivery during AgentOS provisioning
- Pinned DeepSeek chat-model identity validated against the configured OpenRouter provider
- Centrally built immutable Nivo common-knowledge and solution-module vector artifacts with version and digest provenance
- Workspace-local Qdrant recovery or import that preserves customer-uploaded knowledge
- Scanned uploaded-document extraction, chunking, embedding, indexing, retry and refusal states
- Owner-safe AI and knowledge readiness visibility and a bounded readiness test for one exact workspace
- Provisioning, module-studio and module-installation status projections owned by their existing routes

## Excluded

- Returning or rendering raw OpenRouter credentials or provider management handles
- Allowing a workspace pod to query or mount Nivo's central Qdrant directly
- Returning raw document text, vector values, point identifiers, raw prompts or raw provider responses through the console
- An owner-selectable provider or arbitrary chat-model picker
- Changing immutable solution-module catalogue identities, versions or installation ownership
- Treating a successful Helm release alone as proof that the AI runtime can answer

## Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/nivo-fe.git | `6a43e8d11050efb84d95f73e4103044f6dcfb15a` |
| be | https://github.com/starci-lab/nivo-backend.git | `77ce9d7dda36dae185be9983d4ff0771c769381c` |
