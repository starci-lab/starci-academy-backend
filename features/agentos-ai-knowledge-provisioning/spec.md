# AgentOS AI and knowledge provisioning

> Business head: `fc3aa3a27c96ad672b9713fdaa7a6a7cf0cf00c272f22c0d8ca49e58cad3e689`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

An authenticated AgentOS workspace owner receives one budgeted workspace-scoped OpenRouter credential, a pinned DeepSeek chat model, one pinned 4096-dimensional Qwen3 embedding profile, immutable Nivo and module knowledge artifacts, atomic non-destructive workspace Qdrant recovery, policy-bounded uploaded-document ingestion and a durable owner-safe AI readiness result before the AI runtime is treated as ready.

Included:
- Idempotent one-key-per-workspace OpenRouter credential minting, encrypted secret delivery, plan-funded spend limits and event-driven disable or destruction lifecycle
- Pinned DeepSeek chat-model identity validated against the configured OpenRouter provider
- Centrally built immutable Nivo common-knowledge and solution-module vector artifacts pinned to nivo-qwen3-embedding-8b-4096-v1 with version and digest provenance
- Workspace-local Qdrant staging-generation import and atomic stable-alias switch that preserves customer-uploaded knowledge and the previous verified generation
- Policy-bounded PDF, DOCX, UTF-8 plain-text and Markdown upload quarantine, fail-closed ClamAV scanning, extraction, chunking, embedding, indexing, removal and refusal states
- Owner-safe AI and knowledge readiness visibility backed by a durable ai_readiness_test workspace operation
- Provisioning, workspace knowledge and module-installation status projections owned by their existing routes

Excluded:
- Returning or rendering raw OpenRouter credentials or provider management handles
- Allowing a workspace pod to query or mount Nivo's central Qdrant directly
- Returning raw document text, vector values, point identifiers, raw prompts or raw provider responses through the console
- An owner-selectable provider or arbitrary chat-model picker
- Changing immutable solution-module catalogue identities, versions or installation ownership
- Treating a successful Helm release alone as proof that the AI runtime can answer
- Ask-until-complete custom-module intake, conversational requirement elicitation and module interview orchestration owned by agentos-module-studio

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/nivo-fe.git | `6a43e8d11050efb84d95f73e4103044f6dcfb15a` |
| be | https://github.com/starci-lab/nivo-backend.git | `77ce9d7dda36dae185be9983d4ff0771c769381c` |

## 3. Actors and access

### Authenticated owner of one exact AgentOS workspace

- Observe AI provisioning and knowledge readiness without receiving infrastructure credentials
- Inspect the pinned provider and chat model, knowledge origins, artifact versions and safe failure status
- Upload module documents and observe their scan, extraction and indexing progression
- Run or retry one bounded AI readiness test for the exact workspace
- Request an existing workspace knowledge reindex without accessing raw documents or Qdrant administration

Evidence: `EV-001`, `EV-002`, `EV-012`, `EV-013`

## 4. Entry points and surfaces

### AI runtime provisioning

- ID: `agentos-ai-provisioning`
- Route: `/[locale]/agentos/orders/[orderId]`
- Purpose: Show the credential, model, knowledge recovery and readiness milestones that must pass before the exact workspace AI runtime is ready.
- Regions: `ai-provision-progress`
- Navigation: AgentOS order (active), Exact workspace (unavailable)

Evidence: `EV-001`, `EV-005`, `EV-006`, `EV-007`, `EV-008`

### AI and Knowledge

- ID: `workspace-ai-knowledge`
- Route: `/[locale]/agentos/workspaces/[workspaceId]`
- Purpose: Let the exact workspace owner understand whether its AI can answer, what knowledge origins are current and which safe recovery action is available.
- Regions: `ai-runtime-readiness`, `knowledge-origins`
- Navigation: Workspace (available), AI and Knowledge (active)

Evidence: `EV-001`, `EV-002`, `EV-012`, `EV-013`, `EV-014`, `EV-015`

### Module knowledge ingestion

- ID: `module-knowledge-ingestion`
- Route: `/[locale]/agentos/workspaces/[workspaceId]/modules/studio/[moduleId]`
- Purpose: Show whether each uploaded module document has progressed from a scan-ready object into scoped retrievable knowledge.
- Regions: `uploaded-knowledge-documents`
- Navigation: Module studio (active), AI and Knowledge (available)

Evidence: `EV-001`, `EV-011`, `EV-017`, `EV-028`, `EV-029`, `EV-030`

### Module knowledge status

- ID: `module-knowledge-status`
- Route: `/[locale]/agentos/workspaces/[workspaceId]/modules/[installationId]`
- Purpose: Bind one immutable installed module to its exact package, vector artifact, workspace import and retrieval scope.
- Regions: `module-artifact-binding`
- Navigation: Installed module (active), AI and Knowledge (available)

Evidence: `EV-001`, `EV-003`, `EV-009`, `EV-010`

## 5. Business flows

### Provision a usable workspace AI runtime

Trigger: A paid AgentOS order begins provisioning one exact workspace

1. **workspace-owner** — Observe the exact order while Nivo idempotently mints and delivers the workspace credential and pins the DeepSeek model → Credential and model configuration progress without exposing the raw key
2. **workspace-owner** — Observe immutable Nivo and installed-module knowledge artifacts being recovered or imported into workspace Qdrant → Artifact versions and Qdrant recovery status are bound to the exact workspace
3. **workspace-owner** — Observe the bounded model, embedding, Qdrant and scoped-retrieval verification → The workspace becomes AI-ready only after every required check passes

Outcomes:
- The owner reaches an exact workspace whose AI runtime is proven usable rather than merely installed
- A failure remains attributable to credential, model, embedding, Qdrant, knowledge recovery or scoped retrieval

Evidence: `EV-001`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-015`

### Bring common and module knowledge to the exact declared versions

Trigger: A workspace is provisioned, its common knowledge changes or an immutable solution module is installed or upgraded

1. **workspace-owner** — Inspect common and installed-module knowledge versions and their current workspace status → The owner sees version and digest provenance without receiving the artifact URL or vector contents
2. **workspace-owner** — Observe recovery or import for the exact version set → Common and private module knowledge become searchable without deleting uploaded knowledge

Outcomes:
- Knowledge refreshes are idempotent by artifact version and digest
- A failed refresh leaves the last verified knowledge and every customer upload recoverable

Evidence: `EV-001`, `EV-008`, `EV-009`, `EV-010`, `EV-013`

### Turn an uploaded module document into scoped workspace knowledge

Trigger: The workspace owner attaches a policy-allowed document to one exact module without starting or changing that module's conversational intake

1. **workspace-owner** — Upload an allowed PDF, DOCX, UTF-8 text or Markdown document of at most 20971520 bytes to quarantine and observe its fail-closed ClamAV result → Only a policy-compliant scan-ready document advances to its supported text extractor
2. **workspace-owner** — Observe extraction, chunking, embedding and scoped indexing → The document becomes indexed for the exact workspace and module or exposes a local retryable refusal
3. **workspace-owner** — Inspect the module's knowledge version, uploaded sources and current binding status → The owner can distinguish Nivo, module-package and uploaded knowledge origins

Outcomes:
- Successful uploaded content becomes scoped retrieval material instead of only stored attachment metadata
- One failed document does not discard another document or the existing module profile
- Document ingestion remains independent from ask-until-complete module intake and interview orchestration

Evidence: `EV-001`, `EV-003`, `EV-010`, `EV-011`, `EV-017`, `EV-028`, `EV-029`, `EV-030`

### Remove uploaded module knowledge and its retained object

Trigger: The workspace owner removes one active uploaded module document

1. **workspace-owner** — Remove the document from the exact workspace and module scope → Its retrieval points and access are removed immediately
2. **workspace-owner** — Observe the retained original object's deletion status → The object is deleted within 24 hours while a safe owner-visible status is retained

Outcomes:
- Removed content cannot be retrieved after the owner action succeeds
- Malware and policy-refused objects are deleted immediately after their safe failure code is persisted

Evidence: `EV-017`, `EV-028`, `EV-030`

### Verify that the exact workspace can answer with its own AI and knowledge

Trigger: Automatic provisioning reaches verification or the owner runs the test from AI and Knowledge

1. **workspace-owner** — Run a bounded readiness test for the exact workspace → The backend asks the workspace runtime to verify its credential, model, embedding, Qdrant and scoped retrieval
2. **workspace-owner** — Read the component verdicts, timestamp and safe failure code → The owner receives an actionable pass or refusal without raw provider output, secrets or document contents

Outcomes:
- A passing result proves the call used the workspace credential and the declared knowledge scope
- A refusal preserves the existing workspace and exposes which readiness component requires recovery

Evidence: `EV-001`, `EV-014`, `EV-015`, `EV-016`

## 6. Business rules

### BR-01

Every AgentOS workspace receives exactly one OpenRouter credential. Its initial lifetime limit equals workspace.instance.plan.creditGrantUsd; renewal or top-up raises the lifetime limit to current provider spend plus that plan grant. Rotation is event-driven only, suspension disables the key, deprovisioning reconciles usage then destroys it, the raw key remains in encrypted custody and no owner-facing response exposes it or its provider management handle.

Strength: **confirmed** · Evidence: `EV-001`, `EV-006`, `EV-007`, `EV-017`, `EV-020`, `EV-021`, `EV-022`

### BR-02

The workspace chat model is pinned to deepseek/deepseek-v4-flash through OpenRouter and must be provider-validated before the runtime can be considered AI-ready.

Strength: **confirmed** · Evidence: `EV-001`, `EV-005`

### BR-03

Chat-model choice and knowledge embedding geometry are separate contracts. Every common, module, upload and retrieval vector uses embedding profile nivo-qwen3-embedding-8b-4096-v1: qwen3-embedding:8b for the global builder, qwen/qwen3-embedding-8b through workspace OpenRouter, and dimension 4096. Any model or geometry change creates a new profile and requires a staged rebuild.

Strength: **confirmed** · Evidence: `EV-001`, `EV-010`, `EV-011`, `EV-017`, `EV-018`

### BR-04

Nivo common knowledge and each immutable solution-module knowledge package are vectorized in Nivo's global Qdrant into versioned digest-bound artifacts; installing a module copies its declared artifact into the workspace knowledge generation without giving that workspace direct access to global Qdrant.

Strength: **confirmed** · Evidence: `EV-001`, `EV-008`, `EV-009`, `EV-010`, `EV-017`

### BR-05

Knowledge recovery writes a staging collection behind a stable workspace alias, copies every existing customer and uploaded-document point, imports the declared common and module artifacts, verifies geometry, artifact digests, origin counts, customer point identities and scoped retrieval, then switches the alias atomically. Failure leaves the alias unchanged and retains the previous verified generation.

Strength: **confirmed** · Evidence: `EV-001`, `EV-008`, `EV-017`, `EV-019`

### BR-06

An uploaded module document is accepted only for PDF, DOCX, UTF-8 text or Markdown at no more than 20971520 bytes. It becomes retrieval knowledge only after fail-closed ClamAV quarantine scanning, supported text extraction without PDF OCR, deterministic chunking, pinned-profile embedding and scoped Qdrant indexing; filename-only indexing never satisfies readiness.

Strength: **confirmed** · Evidence: `EV-001`, `EV-011`, `EV-017`, `EV-028`, `EV-029`

### BR-07

A module agent may search the common version, explicitly shared workspace sources and the private knowledge matching its exact installationId, moduleKey and knowledgeVersion; it may not search another installation's private layer.

Strength: **confirmed** · Evidence: `EV-001`, `EV-009`, `EV-010`

### BR-08

A durable ai_readiness_test operation permits one concurrent run, a 30000 ms deadline, zero retries, a 300000 ms cooldown, at most 2048 input/context tokens and 256 output tokens, and exactly one embedding call, one scoped retrieval and one DeepSeek completion. Helm success or service health without that bounded call is insufficient.

Strength: **confirmed** · Evidence: `EV-001`, `EV-014`, `EV-015`, `EV-017`, `EV-023`, `EV-024`

### BR-09

Workspace readiness surfaces return only provider and model identity, masked credential status, artifact provenance, document counts by origin, component verdicts, timestamps and safe failure codes; they never return raw keys, document text, vectors, point identifiers, raw prompts or raw provider responses.

Strength: **confirmed** · Evidence: `EV-001`, `EV-012`

### BR-10

Automatic provisioning and owner-triggered retries share the durable ai_readiness_test operation. Provisioning persists knowledgeRecoveryOperationId and readinessOperationId and sets aiReady only after success; failure preserves the workspace and last verified knowledge with aiReady=false.

Strength: **confirmed** · Evidence: `EV-001`, `EV-008`, `EV-011`, `EV-017`, `EV-023`, `EV-025`, `EV-026`, `EV-027`

### BR-11

Removing an active uploaded document immediately removes its retrieval points and access, then deletes the retained original object within 24 hours. Malware or policy-refused objects are deleted immediately after a safe failure code is persisted; otherwise the original is retained while its attachment is active.

Strength: **confirmed** · Evidence: `EV-017`, `EV-028`

### BR-12

This capability owns AI credential, knowledge artifact, document-ingestion and readiness provisioning only; ask-until-complete custom-module intake and module interview orchestration remain exclusively under agentos-module-studio.

Strength: **confirmed** · Evidence: `EV-017`, `EV-030`

## 7. State model

- **AI runtime provisioning has not started** (`ai-provision-pending`, initial) → ai-key-configuring — `EV-001`
- **The workspace credential and pinned model are being configured** (`ai-key-configuring`, pending) → ai-knowledge-recovering, ai-readiness-refused — `EV-001`, `EV-005`, `EV-006`, `EV-007`
- **Versioned Nivo and module knowledge is being recovered or imported** (`ai-knowledge-recovering`, pending) → ai-readiness-testing, ai-readiness-refused — `EV-001`, `EV-008`, `EV-009`, `EV-010`
- **The exact workspace AI and scoped knowledge path is being tested** (`ai-readiness-testing`, pending) → ai-ready, ai-readiness-refused — `EV-001`, `EV-014`, `EV-015`
- **The workspace AI runtime and scoped knowledge path passed** (`ai-ready`, success) → ai-readiness-testing, knowledge-refreshing, document-uploading — `EV-001`
- **One required AI readiness component failed or is unavailable** (`ai-readiness-refused`, error) → ai-key-configuring, ai-knowledge-recovering, ai-readiness-testing — `EV-001`
- **Common or module knowledge is refreshing** (`knowledge-refreshing`, pending) → knowledge-current, knowledge-refused — `EV-001`, `EV-008`, `EV-010`, `EV-013`
- **All declared common and module knowledge versions are current** (`knowledge-current`, success) → knowledge-refreshing, document-uploading — `EV-001`
- **Knowledge refresh was refused while the last verified state remains available** (`knowledge-refused`, error) → knowledge-refreshing — `EV-001`
- **A module document is uploading to quarantine** (`document-uploading`, pending) → document-scanning, document-refused — `EV-001`, `EV-011`
- **The uploaded module document is being scanned** (`document-scanning`, pending) → document-extracting, document-refused — `EV-001`
- **Text is being extracted and chunked from a scan-ready document** (`document-extracting`, pending) → document-embedding, document-refused — `EV-001`, `EV-011`
- **Document chunks are being embedded and indexed into the scoped workspace collection** (`document-embedding`, pending) → document-indexed, document-refused — `EV-001`, `EV-011`
- **The uploaded document is available to its declared module knowledge scope** (`document-indexed`, success) → knowledge-refreshing, document-removing — `EV-001`, `EV-017`
- **The document's retrieval points and access are being removed** (`document-removing`, pending) → document-removed, document-refused — `EV-017`, `EV-028`
- **Retrieval access is removed and retained-object deletion is complete or due within 24 hours** (`document-removed`, success) → terminal — `EV-017`, `EV-028`
- **The document could not be scanned, extracted, embedded or indexed** (`document-refused`, error) → document-uploading — `EV-001`, `EV-011`

## 8. Entities and data

- **Workspace AI runtime profile**: workspaceId, provider, chatModel, embeddingProfileId, credentialStatus, providerKeyReference, providerSpendUsd, lifetimeLimitUsd, provisionStatus, knowledgeRecoveryOperationId, readinessOperationId, aiReady, lastReadinessRunId — `EV-001`, `EV-005`, `EV-006`, `EV-017`, `EV-020`, `EV-021`, `EV-022`, `EV-025`
- **Immutable vector knowledge artifact**: artifactId, scope, version, digest, embeddingProfile, embeddingDimension, globalCollectionReference, objectReference, status, publishedAt — `EV-001`, `EV-008`, `EV-009`, `EV-017`, `EV-018`
- **Workspace knowledge binding**: workspaceId, commonArtifactId, moduleArtifactIds, recoveredVersions, stableAlias, activeGeneration, stagingCollection, previousVerifiedGeneration, qdrantStatus, verifiedOriginCounts, verifiedCustomerPointIdentities, origins, lastUpdatedAt — `EV-001`, `EV-010`, `EV-012`, `EV-017`, `EV-019`
- **Uploaded module document ingestion**: documentId, workspaceId, moduleId, filename, mediaType, sizeBytes, checksum, storageKey, objectRetentionStatus, scanStatus, extractionStatus, embeddingStatus, indexStatus, retrievalRemovedAt, objectDeletionDueAt, failureCode, updatedAt — `EV-001`, `EV-011`, `EV-017`, `EV-028`, `EV-029`
- **Workspace AI readiness run**: runId, operationKind, operationId, workspaceId, modelStatus, embeddingStatus, qdrantStatus, retrievalStatus, deadlineMs, cooldownMs, inputTokenLimit, outputTokenLimit, startedAt, completedAt, failureCode — `EV-001`, `EV-014`, `EV-015`, `EV-017`, `EV-023`, `EV-024`

## 9. Operations and APIs

- **provisionAgentosAiRuntime** (command, backend) — input: workspaceId, planCode, embeddingProfileId, commonKnowledgeVersion, moduleArtifactRefs, idempotencyKey; output: workspace AI profile, knowledgeRecoveryOperationId, readinessOperationId, aiReady; failures: workspace not owned or not provisionable, OpenRouter management credential unavailable, workspace key mint or secret delivery failed, DeepSeek model unavailable, knowledge artifact unavailable, Qdrant staging generation verification failed while stable alias remains unchanged, readiness test refused while workspace and last verified knowledge remain available — `EV-001`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-017`, `EV-025`, `EV-026`, `EV-027`
- **reconcileAgentosWorkspaceKeyLifecycle** (command, backend) — input: workspaceId, lifecycle event, current provider spend, plan creditGrantUsd, idempotencyKey; output: provider key status, lifetime limitUsd, usage reconciliation status; failures: workspace key unavailable, provider usage lookup failed, limit update failed, disable or destroy failed — `EV-006`, `EV-015`, `EV-017`, `EV-020`, `EV-021`, `EV-022`
- **publishAgentosKnowledgeArtifact** (command, backend) — input: scope, source version, source digest, embedding profile nivo-qwen3-embedding-8b-4096-v1, embedding dimension 4096; output: immutable artifact identity, vector digest, published status; failures: source package invalid, embedding profile unavailable, vectorization failed, artifact publication failed — `EV-001`, `EV-008`, `EV-009`, `EV-010`, `EV-017`, `EV-018`
- **recoverAgentosWorkspaceKnowledge** (command, backend) — input: workspaceId, artifact identities, expected embedding profile nivo-qwen3-embedding-8b-4096-v1, stable workspace alias, idempotencyKey; output: recovered versions, verified staging generation, atomic alias switch result, previous verified generation, workspace knowledge status; failures: workspace unavailable, artifact digest mismatch, embedding geometry mismatch, origin counts or customer point identities mismatch, scoped retrieval verification failed, Qdrant recovery failed with stable alias unchanged, uploaded-knowledge preservation could not be proven — `EV-001`, `EV-004`, `EV-008`, `EV-017`, `EV-019`
- **ingestAgentosModuleDocument** (command, backend) — input: workspaceId, moduleId, documentId, quarantined object reference, allowed media type, sizeBytes no greater than 20971520, idempotencyKey; output: ingestion status, indexed document identity, knowledge origin summary, object retention or deletion status; failures: workspace or module not owned, media type not allowed or file exceeds 20971520 bytes, ClamAV unavailable or scan refused, content extraction failed, embedding failed, Qdrant indexing failed — `EV-001`, `EV-011`, `EV-017`, `EV-028`, `EV-029`
- **removeAgentosModuleDocument** (mutation, backend) — input: workspaceId, moduleId, documentId, idempotencyKey; output: retrieval removal timestamp, object deletion status, object deletion due timestamp; failures: workspace, module or document not owned, retrieval point removal failed, object deletion scheduling failed — `EV-017`, `EV-028`, `EV-030`
- **myAgentosAiKnowledgeReadiness** (query, backend) — input: workspaceId; output: provider and pinned model, embedding profile and dimension, masked credential status, knowledge artifact versions and origins, Qdrant status, knowledge recovery operation identity, readiness operation identity, aiReady, latest readiness component verdicts, safe failure codes and timestamps; failures: workspace not owned, runtime not provisioned, readiness report unavailable — `EV-001`, `EV-002`, `EV-012`, `EV-017`, `EV-023`
- **runAgentosAiReadinessTest** (mutation, backend) — input: workspaceId, idempotencyKey; output: ai_readiness_test operationId, accepted status; failures: workspace not owned or not ready for testing, test already running, 300000 ms cooldown active, workspace runtime unreachable — `EV-001`, `EV-014`, `EV-015`, `EV-016`, `EV-017`, `EV-023`, `EV-024`
- **reportAgentosAiReadiness** (event, backend) — input: workspace identity, ai_readiness_test operation identity, component verdicts, safe failure code, completedAt; output: persisted owner-safe readiness summary, aiReady true only after every check passes; failures: workspace assertion invalid, run identity stale, report shape invalid — `EV-001`, `EV-012`, `EV-017`, `EV-023`
- **reindexAgentWorkspaceKnowledge** (mutation, backend) — input: workspaceId, idempotencyKey; output: operationId, knowledge reindex status; failures: workspace not owned, runtime unavailable, reindex already running — `EV-013`

## 10. Acceptance conditions

- **AC-01** Provisioning one AgentOS workspace idempotently mints or reuses exactly one workspace-scoped OpenRouter credential with initial lifetime limit workspace.instance.plan.creditGrantUsd, stores its raw value only in encrypted secret custody, delivers it to that workspace and never returns it to the owner. — `EV-001`, `EV-006`, `EV-007`, `EV-017`, `EV-020`, `EV-021`
- **AC-02** The workspace uses the provider-validated deepseek/deepseek-v4-flash chat model and exposes that identity without offering an arbitrary model or provider picker. — `EV-001`, `EV-005`
- **AC-03** Nivo common knowledge and every installed module knowledge package are represented in global Qdrant by immutable versioned digest-bound artifacts using nivo-qwen3-embedding-8b-4096-v1 at dimension 4096 and copied into the exact workspace without direct global-Qdrant access. — `EV-001`, `EV-008`, `EV-009`, `EV-010`, `EV-017`, `EV-018`
- **AC-04** Knowledge recovery builds a staging collection, copies all customer and upload points, imports declared artifacts, verifies geometry, digests, origin counts, customer point identities and scoped retrieval, and only then atomically switches the stable alias while retaining the previous verified generation. — `EV-001`, `EV-008`, `EV-017`, `EV-019`
- **AC-05** A PDF, DOCX, UTF-8 text or Markdown upload of at most 20971520 bytes is quarantined, scanned fail-closed by ClamAV, extracted by its supported non-OCR extractor, deterministically chunked, embedded with nivo-qwen3-embedding-8b-4096-v1 and indexed with workspace and module scope; filename-only vectors fail acceptance. — `EV-001`, `EV-011`, `EV-017`, `EV-028`, `EV-029`
- **AC-06** One upload failure exposes its policy, scan, extraction, embedding or index failure code and retry without discarding another document or changing module-intake state; malware and refused objects are deleted immediately after safe failure persistence. — `EV-001`, `EV-011`, `EV-017`, `EV-028`, `EV-030`
- **AC-07** Automatic provisioning persists knowledgeRecoveryOperationId and readinessOperationId, then one durable ai_readiness_test executes within 30000 ms and zero retries using one embedding, one scoped retrieval and one DeepSeek completion before reporting aiReady=true. — `EV-001`, `EV-014`, `EV-015`, `EV-016`, `EV-017`, `EV-023`, `EV-025`, `EV-026`, `EV-027`
- **AC-08** The owner can request one readiness operation when no run is active and its 300000 ms cooldown has elapsed, with 2048 input/context tokens and 256 output tokens maximum, and receives component verdicts, timestamp and safe failure code without raw keys, provider response, prompt, document text, vectors or point identifiers. — `EV-001`, `EV-012`, `EV-014`, `EV-017`, `EV-023`, `EV-024`
- **AC-09** Module retrieval is constrained to the declared common version, explicitly shared workspace sources and the private knowledge matching the exact installationId, moduleKey and knowledgeVersion. — `EV-001`, `EV-009`, `EV-010`
- **AC-10** The workspace control center, provisioning flow, existing attachment management and installation detail expose only their owned AI and knowledge states while sharing one backend-owned readiness truth; no operation or surface in this feature performs ask-until-complete module intake or interview orchestration. — `EV-001`, `EV-002`, `EV-003`, `EV-012`, `EV-013`, `EV-017`, `EV-030`
- **AC-11** A renewal or top-up sets the workspace key lifetime limit to current provider spend plus plan.creditGrantUsd; suspension disables it; deprovisioning reconciles usage and then destroys it; no scheduled rotation is introduced. — `EV-017`, `EV-020`, `EV-021`, `EV-022`
- **AC-12** Owner removal makes the document immediately unavailable to retrieval and deletes its retained original object within 24 hours while keeping only safe lifecycle evidence. — `EV-017`, `EV-028`, `EV-030`

## 11. Explicit unknowns

No unresolved question is recorded.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | owner | `decision:2d5c21ecafe90bb00091ac3021bcbcd37dcf4f4080593685afb7df4dadca0ecd` | owner-decision | Create Nivo agentos-ai-knowledge-provisioning as pending owner intent with per-workspace OpenRouter credentials, DeepSeek deepseek/deepseek-v4-flash, immutable Nivo common and module knowledge snapshots, scanned uploaded-document extraction and vector ingestion, non-destructive workspace Qdrant recovery, and an owner-safe AI readiness test that gates workspace readiness without exposing secrets, raw documents, point identifiers, or raw provider responses. |
| EV-002 | fe | `apps/app/src/app/[locale]/(console)/agentos/workspaces/[workspaceId]/page.tsx:1` | route | The frontend mounts one exact locale-aware owner workspace control-center route by workspaceId. |
| EV-003 | fe | `apps/app/src/app/[locale]/(console)/agentos/workspaces/[workspaceId]/modules/[installationId]/page.tsx:1` | route | The frontend mounts one solution-module installation detail beneath the exact workspace and binds workspaceId plus installationId. |
| EV-004 | be | `apps/agentos-cli/src/config.ts:112` | contract | The AgentOS CLI resolves a workspace-local Qdrant endpoint and named collection rather than a central control-plane search path. |
| EV-005 | be | `apps/agentos-cli/src/config.ts:176` | contract | The AgentOS CLI defaults the OpenRouter model to deepseek/deepseek-v4-flash and requires OPENROUTER_INSTANCE_KEY as the instance-owned credential. |
| EV-006 | be | `src/modules/bussiness/expert-provision/secrets/instance-model-key.service.ts:108` | api | The backend can idempotently mint a bounded OpenRouter key per instance, persist the provider key id and store the raw value through encrypted provision-secret custody. |
| EV-007 | be | `src/modules/bussiness/pod-registration/pod-access-token.service.ts:42` | contract | The committed AgentOS pod credential path explicitly says per-instance OpenRouter mint delivery remains a separate unwired change. |
| EV-008 | be | `apps/agentos-cli/src/knowledge/knowledge-snapshot.service.ts:18` | contract | The AgentOS CLI recovers a versioned Qdrant snapshot by presigned URL, while its committed contract explicitly names backend snapshot publication and version-mismatch fallback as unbuilt follow-up work. |
| EV-009 | be | `src/modules/bussiness/agentos-solution-modules/types/manifest.ts:1` | contract | Solution-module manifests expose immutable module versions, common and private knowledge versions and an operational-data knowledge-package locator rather than embedding mutable document bodies in new manifests. |
| EV-010 | be | `apps/agentos-controlplane/src/module-runtime/module-knowledge-reconciler.service.ts:14` | api | The control plane currently writes module package documents into workspace knowledge with installationId, moduleKey and knowledgeVersion metadata. |
| EV-011 | be | `apps/agentos-cli/src/documents/queue-drain.service.ts:72` | api | The upload queue owns per-document indexing and failure states but currently embeds only the filename; MinIO download, extraction and chunking are explicitly unbuilt. |
| EV-012 | be | `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-knowledge-runtime/my-agent-workspace-knowledge-runtime.handler.ts:20` | api | The owner-scoped backend query returns MCP/Qdrant health, document counts and origins, timestamps and reindex status for one exact workspace. |
| EV-013 | be | `src/features/core/api/core/graphql/mutations/agent-workspace/reindex-agent-workspace-knowledge/reindex-agent-workspace-knowledge.handler.ts:20` | api | The backend exposes an owner-scoped idempotent workspace knowledge-reindex operation and returns its operation status. |
| EV-014 | be | `src/tests/harness/draft-lead-reply.harness-spec.ts:20` | test | The AI harness calls the OpenRouter-compatible production prompt lane, grades nondeterministic output and loudly skips rather than faking success when its provider credential is absent. |
| EV-015 | be | `src/tests/e2e/controlplane/instance-key-attribution.live-spec.ts:222` | test | A live test mints a bounded per-instance OpenRouter key, sends a real DeepSeek call and distinguishes spend on that key from spend on Nivo's platform key. |
| EV-016 | be | `package.json:15` | test | The repository declares separate AI harness and AgentOS live-test commands rather than making paid-provider tests part of the ordinary deterministic lane. |
| EV-017 | owner | `decision:7494806cb79f7916fe7483450b64950ac607d82f888290112fada6569617fa59` | owner-decision | Approve R2 owner intent: exclude ask-until-complete module intake; pin nivo-qwen3-embedding-8b-4096-v1 at dimension 4096; copy immutable Nivo and installed-module artifacts from global Qdrant into a verified staging workspace generation before atomic alias switch; accept only PDF, DOCX, UTF-8 text and Markdown up to 20971520 bytes through fail-closed ClamAV and defined retention; own one plan-funded event-rotated OpenRouter key per workspace; and gate aiReady through one durable ai_readiness_test with a 30000 ms deadline, zero retries, 300000 ms cooldown, 2048 input/context tokens and 256 output tokens. |
| EV-018 | be | `src/modules/platform/env/config.ts:725` | contract | Backend configuration already pins qwen3-embedding:8b and qwen/qwen3-embedding-8b to measured dimension 4096 and refuses incompatible cloud and self-hosted embedding geometry. |
| EV-019 | be | `apps/shared/knowledge/knowledge-reindex.service.ts:44` | contract | The current knowledge reindex authority requires customer uploads to survive, uses two collections rather than rebuilding in place, keeps the old collection and permits a failed generation to be abandoned safely. |
| EV-020 | be | `src/modules/platform/databases/postgresql/primary/entities/subscription-plan.entity.ts:306` | contract | The AgentOS subscription plan owns creditGrantUsd and defines renewal as a lifetime limit equal to current provider spend plus the grant. |
| EV-021 | be | `src/modules/platform/databases/postgresql/primary/entities/instance.entity.ts:231` | contract | The provisioned instance owns the subscription-plan relation from which the workspace key grant is resolved. |
| EV-022 | be | `src/modules/platform/databases/postgresql/primary/entities/instance-model-key.entity.ts:83` | contract | The instance model-key authority records lifetime limitUsd and supports provider usage reads, disablement and destruction without exposing the raw key. |
| EV-023 | be | `src/modules/platform/databases/postgresql/primary/entities/agent-workspace-operation.entity.ts:11` | contract | Agent workspace operations are durable idempotent audit rows, while the current operation-kind union does not yet contain ai_readiness_test. |
| EV-024 | be | `src/modules/bussiness/agent-workspace-operations/agent-workspace-operation-runner.service.ts:69` | api | The current workspace operation runner loads the workspace instance plan and dispatches bounded operation kinds, providing the sibling lifecycle that ai_readiness_test must extend. |
| EV-025 | be | `src/modules/bussiness/agentos-provision/types/payload.ts:1` | contract | The current provisioning payload lacks AI profile, knowledge-recovery operation and readiness-operation identities, so R2 requires those outputs rather than treating them as already implemented. |
| EV-026 | be | `src/modules/bussiness/agentos-provision/provision-step-map.service.ts:24` | contract | The current AgentOS provisioning map has four infrastructure steps and no explicit AI-key, knowledge-recovery or readiness step. |
| EV-027 | be | `src/modules/bussiness/agentos-provision/steps/record-outcome.step.ts:36` | contract | The current outcome step activates the workspace directly, so R2 must persist aiReady=false until knowledge recovery and the durable readiness operation pass. |
| EV-028 | be | `src/modules/platform/databases/postgresql/primary/entities/agentos-module-attachment.entity.ts:14` | contract | The attachment authority currently stores media type, byte size, scanner lifecycle, storage key and safe failure code while external object bytes and scanner execution remain outside the row. |
| EV-029 | be | `src/features/core/api/core/graphql/mutations/agent-workspace/prepare-agentos-module-attachment-upload/graphql-types/input.ts:1` | api | The current upload input accepts a generic media type and positive byte size but does not yet enforce the R2 MIME allowlist or 20971520-byte ceiling. |
| EV-030 | fe | `apps/app/src/modules/api/console.ts:754` | api | The frontend exposes custom-module intake answers and attachment preparation, finalization and removal as separate operations, supporting R2's boundary that document knowledge provisioning must not own ask-until-complete intake. |
