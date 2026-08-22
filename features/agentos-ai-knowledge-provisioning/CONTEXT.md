# AgentOS AI and knowledge provisioning

> Business identity: `nivo/agentos-ai-knowledge-provisioning@7da1c6645d9d10f087553bec77a7fd1d954afe74c532cf67e2c89f4ea43e45c5`
>
> Source heads: authority `pending` · `fe@894e608bba73`, `be@ac05d90e7b6b`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** An authenticated AgentOS workspace owner receives a workspace-scoped OpenRouter credential, a pinned DeepSeek chat model, immutable Nivo and module knowledge artifacts, non-destructive workspace Qdrant recovery, uploaded-document ingestion and an owner-safe AI readiness result before the AI runtime is treated as ready.

**Primary actor.** Authenticated owner of one exact AgentOS workspace

**Primary outcome.** The owner reaches an exact workspace whose AI runtime is proven usable rather than merely installed

**Never does.** Returning or rendering raw OpenRouter credentials or provider management handles

## Invariants

- `BR-01` — Every AgentOS workspace receives its own OpenRouter credential; minting and delivery are idempotent, the provider key is stored encrypted for delivery, and no owner-facing response contains the raw key or provider management handle.
- `BR-02` — The workspace chat model is pinned to deepseek/deepseek-v4-flash through OpenRouter and must be provider-validated before the runtime can be considered AI-ready.
- `BR-03` — Chat-model choice and knowledge embedding geometry are separate contracts; every common, module, upload and retrieval vector in one workspace must use one compatible pinned embedding profile and dimension.
- `BR-04` — Nivo common knowledge and each immutable solution-module knowledge package are vectorized centrally into versioned digest-bound artifacts and imported into a workspace without giving that workspace direct access to central Qdrant.
- `BR-05` — Recovering or refreshing a Nivo or module artifact never deletes, replaces or makes unreachable customer-uploaded knowledge; the last verified state remains recoverable when refresh fails.

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
| `provisionAgentosAiRuntime` | backend | workspaceId, planCode, commonKnowledgeVersion, moduleArtifactRefs, idempotencyKey | workspace AI profile, knowledge recovery operation, readiness run identity |
| `publishAgentosKnowledgeArtifact` | backend | scope, source version, source digest, embedding profile | immutable artifact identity, vector digest, published status |
| `recoverAgentosWorkspaceKnowledge` | backend | workspaceId, artifact identities, expected embedding profile, idempotencyKey | recovered versions, workspace knowledge status |
| `ingestAgentosModuleDocument` | backend | workspaceId, moduleId, documentId, scan-ready object reference, idempotencyKey | ingestion status, indexed document identity, knowledge origin summary |
| `myAgentosAiKnowledgeReadiness` | backend | workspaceId | provider and pinned model, masked credential status, knowledge artifact versions and origins, Qdrant status, latest readiness component verdicts, safe failure codes and timestamps |
| `runAgentosAiReadinessTest` | backend | workspaceId, idempotencyKey | readiness run identity, accepted status |
| `reportAgentosAiReadiness` | backend | workspace identity, run identity, component verdicts, safe failure code, completedAt | persisted owner-safe readiness summary |
| `reindexAgentWorkspaceKnowledge` | backend | workspaceId, idempotencyKey | operationId, knowledge reindex status |

## Explicit unknowns

- `embedding-profile-and-geometry` — Which exact embedding model, version and vector dimension are pinned across central artifact builds, uploaded-document ingestion and workspace retrieval? Impact: Implementation must not combine incompatible vector geometries; the model records compatibility as mandatory but leaves provider selection to backend planning.
- `non-destructive-artifact-import` — Which collection, alias, import or merge protocol atomically refreshes common and module artifacts while preserving uploaded-document points and the last verified index? Impact: Full collection snapshot replacement cannot ship until this preservation proof exists.
- `production-document-policy` — Which MIME types, file limits, scanner, extractors and retention policy own production module documents? Impact: The ingestion flow can be designed and planned, but exact field constraints and extractor coverage remain unavailable.
- `workspace-key-budget-and-rotation` — Which AgentOS plan determines the OpenRouter spend ceiling, rotation cadence and revocation behavior for a workspace key? Impact: Provisioning must create an isolated key, but billing limits and lifecycle automation cannot be implemented as guessed constants.
- `readiness-test-budget` — Which timeout, retry count, cooldown and cost ceiling apply to automatic and owner-triggered readiness tests? Impact: The test must be bounded and idempotent, but exact operational limits require an approved policy.

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
