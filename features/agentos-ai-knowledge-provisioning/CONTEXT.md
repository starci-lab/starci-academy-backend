# AgentOS AI and knowledge provisioning

> Business identity: `nivo/agentos-ai-knowledge-provisioning@9dff5307ad1c43b9ac8750936988857ae3c4eb1b08c9359d2a58a6abf5e14b8c`
>
> Source heads: authority `pending` · `fe@6a43e8d11050`, `be@77ce9d7dda36`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** An authenticated AgentOS workspace owner receives one budgeted workspace-scoped OpenRouter credential, a pinned DeepSeek chat model, one pinned 4096-dimensional Qwen3 embedding profile, immutable Nivo and module knowledge artifacts, atomic non-destructive workspace Qdrant recovery, policy-bounded uploaded-document ingestion and a durable owner-safe AI readiness result before the AI runtime is treated as ready.

**Primary actor.** Authenticated owner of one exact AgentOS workspace

**Primary outcome.** The owner reaches an exact workspace whose AI runtime is proven usable rather than merely installed

**Never does.** Returning or rendering raw OpenRouter credentials or provider management handles

## Invariants

- `BR-01` — Every AgentOS workspace receives exactly one OpenRouter credential. Its initial lifetime limit equals workspace.instance.plan.creditGrantUsd; renewal or top-up raises the lifetime limit to current provider spend plus that plan grant. Rotation is event-driven only, suspension disables the key, deprovisioning reconciles usage then destroys it, the raw key remains in encrypted custody and no owner-facing response exposes it or its provider management handle.
- `BR-02` — The workspace chat model is pinned to deepseek/deepseek-v4-flash through OpenRouter and must be provider-validated before the runtime can be considered AI-ready.
- `BR-03` — Chat-model choice and knowledge embedding geometry are separate contracts. Every common, module, upload and retrieval vector uses embedding profile nivo-qwen3-embedding-8b-4096-v1: qwen3-embedding:8b for the global builder, qwen/qwen3-embedding-8b through workspace OpenRouter, and dimension 4096. Any model or geometry change creates a new profile and requires a staged rebuild.
- `BR-04` — Nivo common knowledge and each immutable solution-module knowledge package are vectorized in Nivo's global Qdrant into versioned digest-bound artifacts; installing a module copies its declared artifact into the workspace knowledge generation without giving that workspace direct access to global Qdrant.
- `BR-05` — Knowledge recovery writes a staging collection behind a stable workspace alias, copies every existing customer and uploaded-document point, imports the declared common and module artifacts, verifies geometry, artifact digests, origin counts, customer point identities and scoped retrieval, then switches the alias atomically. Failure leaves the alias unchanged and retains the previous verified generation.

## Primary flow

```text
ai-key-configuring → ai-knowledge-recovering → ai-readiness-testing
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `agentos-ai-provisioning` | `/[locale]/agentos/orders/[orderId]` | Show the credential, model, knowledge recovery and readiness milestones that must pass before the exact workspace AI runtime is ready. | [surface](surfaces/agentos-ai-provisioning.md) |
| `workspace-ai-knowledge` | `/[locale]/agentos/workspaces/[workspaceId]` | Let the exact workspace owner understand whether its AI can answer, what knowledge origins are current and which safe recovery action is available. | [surface](surfaces/workspace-ai-knowledge.md) |
| `module-knowledge-ingestion` | `/[locale]/agentos/workspaces/[workspaceId]/modules/studio/[moduleId]` | Show whether each uploaded module document has progressed from a scan-ready object into scoped retrievable knowledge. | [surface](surfaces/module-knowledge-ingestion.md) |
| `module-knowledge-status` | `/[locale]/agentos/workspaces/[workspaceId]/modules/[installationId]` | Bind one immutable installed module to its exact package, vector artifact, workspace import and retrieval scope. | [surface](surfaces/module-knowledge-status.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `provisionAgentosAiRuntime` | backend | workspaceId, planCode, embeddingProfileId, commonKnowledgeVersion, moduleArtifactRefs, idempotencyKey | workspace AI profile, knowledgeRecoveryOperationId, readinessOperationId, aiReady |
| `reconcileAgentosWorkspaceKeyLifecycle` | backend | workspaceId, lifecycle event, current provider spend, plan creditGrantUsd, idempotencyKey | provider key status, lifetime limitUsd, usage reconciliation status |
| `publishAgentosKnowledgeArtifact` | backend | scope, source version, source digest, embedding profile nivo-qwen3-embedding-8b-4096-v1, embedding dimension 4096 | immutable artifact identity, vector digest, published status |
| `recoverAgentosWorkspaceKnowledge` | backend | workspaceId, artifact identities, expected embedding profile nivo-qwen3-embedding-8b-4096-v1, stable workspace alias, idempotencyKey | recovered versions, verified staging generation, atomic alias switch result, previous verified generation, workspace knowledge status |
| `ingestAgentosModuleDocument` | backend | workspaceId, moduleId, documentId, quarantined object reference, allowed media type, sizeBytes no greater than 20971520, idempotencyKey | ingestion status, indexed document identity, knowledge origin summary, object retention or deletion status |
| `removeAgentosModuleDocument` | backend | workspaceId, moduleId, documentId, idempotencyKey | retrieval removal timestamp, object deletion status, object deletion due timestamp |
| `myAgentosAiKnowledgeReadiness` | backend | workspaceId | provider and pinned model, embedding profile and dimension, masked credential status, knowledge artifact versions and origins, Qdrant status, knowledge recovery operation identity, readiness operation identity, aiReady, latest readiness component verdicts, safe failure codes and timestamps |
| `runAgentosAiReadinessTest` | backend | workspaceId, idempotencyKey | ai_readiness_test operationId, accepted status |

## Explicit unknowns

- No unresolved question is recorded.

## LOADS

| Need | Read |
|---|---|
| Scope, terminology and exclusions | [overview.md](overview.md) |
| Actor permissions and ownership | [actors.md](actors.md) |
| One user journey | `flows/<flow-id>.md` |
| One renderable screen | `surfaces/<surface-id>.md` |
| Business invariants | [rules.md](rules.md) |
| State transitions | [states.md](states.md) |
| Entities, inputs, outputs and failures | [contracts.md](contracts.md) |
| Completion and regression proof | [acceptance.md](acceptance.md) |
| Machine rendering/query | [model.json](model.json) |
| Exact source provenance | [evidence.json](evidence.json) |

## Context rule

Do not load every module by default. `CONTEXT.md` plus the one flow or surface being changed is the normal prompt. `model.json` is authoritative for machines; Markdown files are generated projections. Unknowns remain unknown until routed source or an explicit owner decision resolves them.
