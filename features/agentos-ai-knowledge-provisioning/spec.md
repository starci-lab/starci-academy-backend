# AgentOS AI and knowledge provisioning

> Business head: `4abf705ead029f7d282b75a5b40948a4ddd3c2def530c65c400ef12a8ad29c7e`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

An authenticated AgentOS workspace owner receives a workspace-scoped OpenRouter credential, a pinned DeepSeek chat model, immutable Nivo and module knowledge artifacts, non-destructive workspace Qdrant recovery, uploaded-document ingestion and an owner-safe AI readiness result before the AI runtime is treated as ready.

Included:
- Idempotent per-workspace OpenRouter credential minting and secret delivery during AgentOS provisioning
- Pinned DeepSeek chat-model identity validated against the configured OpenRouter provider
- Centrally built immutable Nivo common-knowledge and solution-module vector artifacts with version and digest provenance
- Workspace-local Qdrant recovery or import that preserves customer-uploaded knowledge
- Scanned uploaded-document extraction, chunking, embedding, indexing, retry and refusal states
- Owner-safe AI and knowledge readiness visibility and a bounded readiness test for one exact workspace
- Provisioning, module-studio and module-installation status projections owned by their existing routes

Excluded:
- Returning or rendering raw OpenRouter credentials or provider management handles
- Allowing a workspace pod to query or mount Nivo's central Qdrant directly
- Returning raw document text, vector values, point identifiers, raw prompts or raw provider responses through the console
- An owner-selectable provider or arbitrary chat-model picker
- Changing immutable solution-module catalogue identities, versions or installation ownership
- Treating a successful Helm release alone as proof that the AI runtime can answer

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/nivo-fe.git | `894e608bba73d791e5d2767cdc420da770c8c42b` |
| be | https://github.com/starci-lab/nivo-backend.git | `ac05d90e7b6b59eb9dc4128872f3c02ba254e59a` |

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

Evidence: `EV-001`, `EV-011`

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

Trigger: The workspace owner attaches a document to one exact custom module

1. **workspace-owner** — Upload the document to quarantine and observe its scan result → Only a scan-ready document advances to content processing
2. **workspace-owner** — Observe extraction, chunking, embedding and scoped indexing → The document becomes indexed for the exact workspace and module or exposes a local retryable refusal
3. **workspace-owner** — Inspect the module's knowledge version, uploaded sources and current binding status → The owner can distinguish Nivo, module-package and uploaded knowledge origins

Outcomes:
- Successful uploaded content becomes scoped retrieval material instead of only stored attachment metadata
- One failed document does not discard another document or the existing module profile

Evidence: `EV-001`, `EV-003`, `EV-010`, `EV-011`

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

Every AgentOS workspace receives its own OpenRouter credential; minting and delivery are idempotent, the provider key is stored encrypted for delivery, and no owner-facing response contains the raw key or provider management handle.

Strength: **confirmed** · Evidence: `EV-001`, `EV-006`, `EV-007`

### BR-02

The workspace chat model is pinned to deepseek/deepseek-v4-flash through OpenRouter and must be provider-validated before the runtime can be considered AI-ready.

Strength: **confirmed** · Evidence: `EV-001`, `EV-005`

### BR-03

Chat-model choice and knowledge embedding geometry are separate contracts; every common, module, upload and retrieval vector in one workspace must use one compatible pinned embedding profile and dimension.

Strength: **confirmed** · Evidence: `EV-001`, `EV-010`, `EV-011`

### BR-04

Nivo common knowledge and each immutable solution-module knowledge package are vectorized centrally into versioned digest-bound artifacts and imported into a workspace without giving that workspace direct access to central Qdrant.

Strength: **confirmed** · Evidence: `EV-001`, `EV-008`, `EV-009`, `EV-010`

### BR-05

Recovering or refreshing a Nivo or module artifact never deletes, replaces or makes unreachable customer-uploaded knowledge; the last verified state remains recoverable when refresh fails.

Strength: **confirmed** · Evidence: `EV-001`, `EV-008`

### BR-06

An uploaded module document becomes retrieval knowledge only after successful quarantine scan, content extraction, deterministic chunking, embedding and scoped Qdrant indexing; filename-only indexing never satisfies readiness.

Strength: **confirmed** · Evidence: `EV-001`, `EV-011`

### BR-07

A module agent may search the common version, explicitly shared workspace sources and the private knowledge matching its exact installationId, moduleKey and knowledgeVersion; it may not search another installation's private layer.

Strength: **confirmed** · Evidence: `EV-001`, `EV-009`, `EV-010`

### BR-08

AI readiness verifies the actual workspace credential, pinned model, embedding lane, workspace Qdrant and scoped retrieval; Helm success or service health without that bounded call is insufficient.

Strength: **confirmed** · Evidence: `EV-001`, `EV-014`, `EV-015`

### BR-09

Workspace readiness surfaces return only provider and model identity, masked credential status, artifact provenance, document counts by origin, component verdicts, timestamps and safe failure codes; they never return raw keys, document text, vectors, point identifiers, raw prompts or raw provider responses.

Strength: **confirmed** · Evidence: `EV-001`, `EV-012`

### BR-10

Automatic provisioning and owner-triggered retries share one idempotent readiness state machine; a refusal does not destroy an already-created workspace, accepted module specification or successfully indexed document.

Strength: **confirmed** · Evidence: `EV-001`, `EV-008`, `EV-011`

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
- **The uploaded document is available to its declared module knowledge scope** (`document-indexed`, success) → knowledge-refreshing — `EV-001`
- **The document could not be scanned, extracted, embedded or indexed** (`document-refused`, error) → document-uploading — `EV-001`, `EV-011`

## 8. Entities and data

- **Workspace AI runtime profile**: workspaceId, provider, chatModel, credentialStatus, providerKeyReference, provisionStatus, lastReadinessRunId — `EV-001`, `EV-005`, `EV-006`
- **Immutable vector knowledge artifact**: artifactId, scope, version, digest, embeddingProfile, objectReference, status, publishedAt — `EV-001`, `EV-008`, `EV-009`
- **Workspace knowledge binding**: workspaceId, commonArtifactId, moduleArtifactIds, recoveredVersions, qdrantStatus, origins, lastUpdatedAt — `EV-001`, `EV-010`, `EV-012`
- **Uploaded module document ingestion**: documentId, workspaceId, moduleId, filename, checksum, scanStatus, extractionStatus, embeddingStatus, indexStatus, failureCode, updatedAt — `EV-001`, `EV-011`
- **Workspace AI readiness run**: runId, workspaceId, modelStatus, embeddingStatus, qdrantStatus, retrievalStatus, startedAt, completedAt, failureCode — `EV-001`, `EV-014`, `EV-015`

## 9. Operations and APIs

- **provisionAgentosAiRuntime** (command, backend) — input: workspaceId, planCode, commonKnowledgeVersion, moduleArtifactRefs, idempotencyKey; output: workspace AI profile, knowledge recovery operation, readiness run identity; failures: workspace not owned or not provisionable, OpenRouter management credential unavailable, workspace key mint or secret delivery failed, DeepSeek model unavailable, knowledge artifact unavailable, Qdrant recovery failed, readiness test refused — `EV-001`, `EV-005`, `EV-006`, `EV-007`, `EV-008`
- **publishAgentosKnowledgeArtifact** (command, backend) — input: scope, source version, source digest, embedding profile; output: immutable artifact identity, vector digest, published status; failures: source package invalid, embedding profile unavailable, vectorization failed, artifact publication failed — `EV-001`, `EV-008`, `EV-009`, `EV-010`
- **recoverAgentosWorkspaceKnowledge** (command, backend) — input: workspaceId, artifact identities, expected embedding profile, idempotencyKey; output: recovered versions, workspace knowledge status; failures: workspace unavailable, artifact digest mismatch, embedding geometry mismatch, Qdrant recovery failed, uploaded-knowledge preservation could not be proven — `EV-001`, `EV-004`, `EV-008`
- **ingestAgentosModuleDocument** (command, backend) — input: workspaceId, moduleId, documentId, scan-ready object reference, idempotencyKey; output: ingestion status, indexed document identity, knowledge origin summary; failures: workspace or module not owned, document not scan-ready, content extraction failed, embedding failed, Qdrant indexing failed — `EV-001`, `EV-011`
- **myAgentosAiKnowledgeReadiness** (query, backend) — input: workspaceId; output: provider and pinned model, masked credential status, knowledge artifact versions and origins, Qdrant status, latest readiness component verdicts, safe failure codes and timestamps; failures: workspace not owned, runtime not provisioned, readiness report unavailable — `EV-001`, `EV-002`, `EV-012`
- **runAgentosAiReadinessTest** (mutation, backend) — input: workspaceId, idempotencyKey; output: readiness run identity, accepted status; failures: workspace not owned or not ready for testing, test already running, test budget or rate limit exceeded, workspace runtime unreachable — `EV-001`, `EV-014`, `EV-015`, `EV-016`
- **reportAgentosAiReadiness** (event, backend) — input: workspace identity, run identity, component verdicts, safe failure code, completedAt; output: persisted owner-safe readiness summary; failures: workspace assertion invalid, run identity stale, report shape invalid — `EV-001`, `EV-012`
- **reindexAgentWorkspaceKnowledge** (mutation, backend) — input: workspaceId, idempotencyKey; output: operationId, knowledge reindex status; failures: workspace not owned, runtime unavailable, reindex already running — `EV-013`

## 10. Acceptance conditions

- **AC-01** Provisioning one AgentOS workspace idempotently mints or reuses exactly one workspace-scoped OpenRouter credential, stores its raw value only in encrypted secret custody, delivers it to that workspace and never returns it to the owner. — `EV-001`, `EV-006`, `EV-007`
- **AC-02** The workspace uses the provider-validated deepseek/deepseek-v4-flash chat model and exposes that identity without offering an arbitrary model or provider picker. — `EV-001`, `EV-005`
- **AC-03** Nivo common knowledge and every installed module knowledge package are represented by immutable versioned digest-bound vector artifacts and imported into the exact workspace without direct central-Qdrant access. — `EV-001`, `EV-008`, `EV-009`, `EV-010`
- **AC-04** Knowledge recovery or refresh proves that all pre-existing uploaded-document knowledge remains reachable before replacing the last verified workspace state. — `EV-001`, `EV-008`
- **AC-05** A scan-ready uploaded module document is downloaded from object storage, extracted, deterministically chunked, embedded with the workspace-compatible profile and indexed with workspace and module scope; filename-only vectors fail acceptance. — `EV-001`, `EV-011`
- **AC-06** One upload failure exposes its scan, extraction, embedding or index failure code and retry without discarding another document, accepted interview answer or module specification. — `EV-001`, `EV-011`
- **AC-07** Automatic provisioning runs a bounded test through the exact workspace credential, pinned chat model, compatible embedding lane, workspace Qdrant and scoped retrieval before reporting AI-ready. — `EV-001`, `EV-014`, `EV-015`, `EV-016`
- **AC-08** The owner can rerun readiness from the exact workspace and receives component verdicts, timestamp and safe failure code without raw keys, provider response, prompt, document text, vectors or point identifiers. — `EV-001`, `EV-012`, `EV-014`
- **AC-09** Module retrieval is constrained to the declared common version, explicitly shared workspace sources and the private knowledge matching the exact installationId, moduleKey and knowledgeVersion. — `EV-001`, `EV-009`, `EV-010`
- **AC-10** The workspace control center, provisioning flow, module studio and installation detail expose only the states and actions owned by their existing routes while sharing one backend-owned readiness truth. — `EV-001`, `EV-002`, `EV-003`, `EV-012`, `EV-013`

## 11. Explicit unknowns

- **Which exact embedding model, version and vector dimension are pinned across central artifact builds, uploaded-document ingestion and workspace retrieval?** — Implementation must not combine incompatible vector geometries; the model records compatibility as mandatory but leaves provider selection to backend planning.
- **Which collection, alias, import or merge protocol atomically refreshes common and module artifacts while preserving uploaded-document points and the last verified index?** — Full collection snapshot replacement cannot ship until this preservation proof exists.
- **Which MIME types, file limits, scanner, extractors and retention policy own production module documents?** — The ingestion flow can be designed and planned, but exact field constraints and extractor coverage remain unavailable.
- **Which AgentOS plan determines the OpenRouter spend ceiling, rotation cadence and revocation behavior for a workspace key?** — Provisioning must create an isolated key, but billing limits and lifecycle automation cannot be implemented as guessed constants.
- **Which timeout, retry count, cooldown and cost ceiling apply to automatic and owner-triggered readiness tests?** — The test must be bounded and idempotent, but exact operational limits require an approved policy.

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
