## plan — nivo-agentos-solution-modules-r1

### CONTEXT

| Field | Resolution |
|---|---|
| Source | `D:\Repositories\starci-academy-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |
| Project | Explicit targets |
| Frontend | `D:\Repositories\nivo-fe` |
| Backend | `D:\Repositories\nivo-backend` |
| Charts | `D:\Repositories\nivo-charts` |
| App | `nivo` core + `agentos-controlplane` |
| Backend branch | `main` |
| Charts branch | `main` |
| Database | Primary PostgreSQL for desired state/Saga; per-instance PostgreSQL for applied runtime snapshot; Qdrant for filtered knowledge chunks |
| Runtime | OpenClaw `2026.7.1-1`; one gateway may own many isolated agents, auth profiles and channel accounts |
| Selected design | C — Giải pháp + Hệ thống |
| Initial packages | `multichannel-chatbot@1.0.0`, `sales-copilot@1.0.0` |
| Phase | plan |
| Revision | `nivo-agentos-solution-modules-r1` |
| Status | Proposed for `starci-be-feature-review`; no production source written |

### OBJECTIVE

Build one generic Nivo solution-module installation capability for AgentOS, then ship two immutable package manifests on it: a multichannel customer chatbot and a Sales Copilot. Nivo owns catalog/versioning, desired state, secret references, Saga and progress; the workspace controlplane owns applying the desired state into its local OpenClaw gateway and MCP knowledge boundary.

### LIVE SCHEMA AND SOURCE EVIDENCE

| Evidence | Observed result | Consequence |
|---|---|---|
| Live GraphQL introspection at `http://localhost:3067/graphql` | Existing roots include `myAgents`, `myChannels`, `myKnowledgeSources`, `createAgent`, `connectChannel`, `configureAgentWorkspaceChannel`, `myProvisioningSaga`; no module catalog/installation operation exists. | Add new GraphQL operations; do not overload hand-written agent CRUD into an aggregate installer. |
| `AgentEntity`, `KnowledgeSourceEntity`, `AgentKnowledgeSourceEntity` | Existing rows model individual agents and customer knowledge, but carry no package/version/installation identity. | Materialization may reuse these rows, while a new installation row owns the immutable desired-state snapshot and generated ids. |
| `ConfigureAgentWorkspaceChannelHandler` | Current channel configuration is provider-scoped and writes a pod Secret; it does not expose an installation/account binding contract. | Module desired state stores account references only; plaintext never enters manifest, Saga, Kafka or Socket.IO. Account-scoped expansion is named below. |
| `OpenclawRuntimeConfigService` | It atomically edits only access-related `gateway` fields in `openclaw.json`. | Introduce a shared atomic store and a separate module compiler owning `agents`, `channels`, `bindings` and `mcp`, preserving access fields. |
| `BackendClientService.pollJobs` | The controlplane already calls `GET /pods/self/jobs` with its signed client assertion, but core has not implemented that route. Source explicitly says backend makes no inbound call to pods. | Implement the missing pull command channel; do not add core → pod push or browser → controlplane access. |
| `ProvisioningSagaRunnerService` | Durable, fenced, compensating Saga already exists and classifies retryable failures. | Install runs on the existing Saga family. The runtime step creates/reuses one pull job and waits boundedly; a retry resumes the same idempotent command. |
| `KnowledgeDocumentEntity` + `apps/shared/knowledge` | Nivo common corpus and Qdrant machinery already exist; customer sources are distinct. | Compose three explicit layers: Nivo common, workspace shared, module private. Retrieval must filter the allowed source set for the active agent. |
| OpenClaw image docs | One gateway supports multiple agents, per-agent workspaces/auth profiles, multi-account channels and bindings. | Compile one installation into multiple isolated OpenClaw agents instead of deploying one OpenClaw per module. |

### FROZEN ARCHITECTURE

| Boundary | Owner | Decision |
|---|---|---|
| Catalog | Nivo core code | Typed immutable manifests keyed by `moduleKey + version`; published versions are never edited in place. |
| Desired installation | Primary PostgreSQL | One `AgentosModuleInstallationEntity` pins manifest version/digest, typed desired state, idempotency key, lifecycle and active Saga/job ids. |
| Runtime command delivery | Primary PostgreSQL + `/pods/self/jobs` | `PodRuntimeJobEntity` is leased atomically with a monotonic lease version. Pod identity comes only from `PodClientAssertionGuard`. |
| Applied installation | Instance PostgreSQL | One compact applied snapshot keyed by installation id records desired/applied digest, status and failure; no secret material. |
| Runtime reconcile | `agentos-controlplane` | Validate desired payload, compose knowledge ACL, reconcile OpenClaw config atomically, probe, then report result to Nivo. |
| Realtime | Existing provisioning outbox → Kafka → consumer → Socket.IO | Add `agentos_module_installation` resource kind and emit step/status snapshots only. |
| Secrets | Existing pod credential/Kubernetes Secret owners | Desired state carries `credentialRef`/`accountId` only. It never carries API keys, channel tokens or ciphertext. |
| FE | Later Design Review/Apply | FE calls Nivo GraphQL directly. It never calls the controlplane, OpenClaw or Kubernetes management endpoints. |

### DOMAIN CONTRACT

```ts
type AgentosSolutionModuleKey = "multichannel-chatbot" | "sales-copilot"
type AgentosModuleInstallationStatus =
    | "queued" | "composing" | "waiting_runtime" | "applying"
    | "ready" | "degraded" | "failed"

interface AgentosSolutionModuleManifest {
    moduleKey: AgentosSolutionModuleKey
    version: string
    displayName: string
    description: string
    commonKnowledgeVersion: string
    agentTemplates: ReadonlyArray<AgentosModuleAgentTemplate>
    sharedKnowledgeRoles: ReadonlyArray<AgentosSharedKnowledgeRole>
    privateKnowledgeDocuments: ReadonlyArray<AgentosPrivateKnowledgeDocument>
    channelRoles: ReadonlyArray<AgentosChannelRole>
    toolBindings: ReadonlyArray<AgentosToolBinding>
}
```

| Invariant | Enforcement |
|---|---|
| One active installation per `(workspaceId, moduleKey)` in r1 | Database unique index; repeated same idempotency key returns the existing installation, different key returns `AgentosModuleAlreadyInstalledException`. |
| Manifest immutability | Catalog service verifies the stable SHA-256 digest in specs; installation stores version + digest + typed snapshot. |
| Tenant isolation | Every viewer query/mutation joins installation → workspace → catalog order → authenticated user in SQL. Pod routes derive pod id from verified client assertion, never path/body. |
| Generated resource ownership | Every generated agent id is listed in installation desired state; compensation deletes/pauses only resources whose owner installation id matches. |
| No secret fan-out | Desired state stores channel/model references and hints only; event schema explicitly rejects secret-shaped keys. |
| No private knowledge bleed | MCP lookup resolves active agent → installation → allowed common/shared/private source ids and sends those filters to Qdrant. |
| Retry safety | Installation id, Saga job id and pod runtime job id are deterministic/idempotent; pod result requires matching `leaseVersion`. |

### INITIAL PACKAGE MANIFESTS

| Package | Agents | Channels | Tools | Knowledge composition | Safety default |
|---|---|---|---|---|---|
| `multichannel-chatbot@1.0.0` | `conversation-router`, `customer-support` | Zalo OA, Telegram, WhatsApp account refs; one or more may be bound | MCP knowledge search, lead capture, human handoff | Nivo common operating/safety rules + explicitly bound company profile/catalog/FAQ + private intent routing, answer grounding, escalation and channel-style playbooks | Ground answers in allowed sources; do not invent price/policy; escalate low confidence; no autonomous payment confirmation. |
| `sales-copilot@1.0.0` | `lead-qualifier`, `sales-copilot` | Optional Zalo/Telegram/WhatsApp account refs; operator mode works without a channel | MCP knowledge search, contact/lead/touch read-write tools, draft follow-up | Nivo common operating/safety rules + explicitly bound catalog/customer policy + private discovery, qualification, objection, follow-up and CRM logging playbooks | Draft-first; no autonomous discount/contract/payment promise; human approval before outbound send in r1. |

Customer product facts are never embedded into the package itself. They come only from explicit workspace shared bindings. “Tri thức Nivo” in the two packages is reusable operating method, prompt policy and guardrail, not fabricated customer truth.

### PROVISIONING SAGA

| Ordinal | Step | Forward effect | Idempotency | Compensation |
|---|---|---|---|---|
| 0 | `reserve-installation` | Lock owned workspace, validate tier/module uniqueness, create installation `queued`. | Unique `(workspace,moduleKey)` + idempotency key. | Mark reservation failed; no runtime resource exists. |
| 1 | `pin-manifest` | Resolve exact code manifest, verify digest, persist typed snapshot. | Same version/digest is a no-op. | Retain snapshot for diagnosis. |
| 2 | `compose-desired-state` | Validate selected model profile, channel account refs and shared source ownership; assign deterministic agent ids and three-layer ACL. | Pure compiler over pinned inputs. | Remove only un-applied generated mappings. |
| 3 | `queue-runtime-reconcile` | Create/reuse one `PodRuntimeJobEntity(kind=RECONCILE_AGENTOS_MODULE)` and move to `waiting_runtime`. | Unique `(podId, installationId, desiredDigest)`. | Cancel queued/unleased command; leased command is fenced and later result ignored. |
| 4 | `await-runtime-reconcile` | Poll command/applied status with a bounded deadline; retryable timeout keeps same command. | Reads only; duplicate completion is a no-op by lease version and digest. | Queue compensating desired state if runtime partially applied. |
| 5 | `record-ready` | Mark installation `ready`, emit outbox transition and ops event. | Conditional update from applying/degraded only. | Restore prior lifecycle if final write is fenced. |

### PULL COMMAND FLOW

1. Controlplane signs `GET /pods/self/jobs` with its registered private key.
2. Core verifies assertion, derives `podId`, leases at most one eligible command with `FOR UPDATE SKIP LOCKED`, increments `leaseVersion`, and returns a bounded typed payload.
3. Controlplane validates manifest/digest and persists an `applying` applied snapshot before side effects.
4. Controlplane indexes missing private package chunks, records shared/common ACL references, reconciles OpenClaw sections, and probes agent/MCP/channel prerequisites.
5. Controlplane signs `POST /pods/self/jobs/result` with `{ jobId, leaseVersion, desiredDigest, outcome, failureCode? }`.
6. Core conditionally completes the matching lease, updates installation status, and emits the existing Kafka/Socket transition. Duplicate/stale reports cannot overwrite a newer lease.

### GRAPHQL CONTRACT

| Operation | Input | Result | Authorization |
|---|---|---|---|
| `myAgentosSolutionModules` query | `agentWorkspaceId: ID!` | Two catalog cards with version, requirements, install eligibility and already-installed id | Viewer owns named workspace. |
| `myAgentosModuleInstallations` query | `agentWorkspaceId: ID!` | Installation summaries, module identity, status, active Saga id, generated agents and requirement health | Viewer owns named workspace. |
| `myAgentosModuleInstallation` query | `installationId: ID!` | Pinned manifest summary, knowledge layers/bindings, channels/tools, desired/applied digest and failure code | Viewer owns installation through workspace order. |
| `installAgentosSolutionModule` mutation | workspace id, module key, idempotency key, model profile ref, channel account-role refs, shared knowledge source-role refs, bounded overrides | installation id, Saga id, status | Viewer owns workspace; all referenced resources belong to same workspace. |

Existing `retryProvisioningSaga` and `myProvisioningSaga` remain the retry/progress contracts; no duplicate module-specific retry mutation is introduced.

### EXACT BACKEND PRODUCTION TREE

#### Primary persistence and shared enums

| File | Change |
|---|---|
| `src/modules/platform/databases/postgresql/primary/entities/agentos-module-installation.entity.ts` | Add desired installation aggregate, typed JSON snapshot, digest/idempotency/lifecycle/Saga/runtime-job fields and unique indexes. |
| `src/modules/platform/databases/postgresql/primary/entities/pod-runtime-job.entity.ts` | Add signed-pull job ledger with pod id, kind, payload, status, lease version/expiry, result and failure code. |
| `src/modules/platform/databases/postgresql/primary/entities/index.ts` | Export both entities. |
| `src/modules/platform/databases/postgresql/primary/enums/job-action-type.ts` | Add `InstallAgentosSolutionModule` for the outer durable Saga job. |
| `src/modules/platform/databases/postgresql/primary/entities/job.entity.ts` | Add `agentosModuleInstallationId` to `JobRefs`. |
| `src/modules/platform/databases/postgresql/primary/migrations/1789779600000-agentos-solution-modules.ts` | Create both tables/indexes and add the job action enum value idempotently. |
| `src/modules/platform/databases/postgresql/primary/primary.module.ts` | Register entities and append migration without reordering existing entries. |
| `src/modules/bussiness/provisioning-events/types.ts` | Add `AgentosModuleInstallation` resource kind. |
| `src/modules/platform/socketio/gateways/provisioning/types/message.ts` | Add typed module-installation realtime payload. |
| `src/modules/platform/socketio/gateways/provisioning/provisioning.gateway.ts` | Route installation transitions to the owning workspace/user room. |

#### Generic module capability and two packages

| File | Change |
|---|---|
| `src/modules/bussiness/agentos-solution-modules/agentos-solution-modules.module-definition.ts` | Configurable module definition. |
| `src/modules/bussiness/agentos-solution-modules/agentos-solution-modules.module.ts` | Register catalog, compiler, installation service, dispatcher, worker, Saga steps and required BullMQ queue. |
| `src/modules/bussiness/agentos-solution-modules/index.ts` | Public exports. |
| `src/modules/bussiness/agentos-solution-modules/types/manifest.ts` | Closed manifest, template, knowledge role, channel role and tool binding types. |
| `src/modules/bussiness/agentos-solution-modules/types/desired-state.ts` | Closed desired-state transport contract; no `Record<string, unknown>` business payload. |
| `src/modules/bussiness/agentos-solution-modules/types/install.ts` | Install payload/extended context/result types. |
| `src/modules/bussiness/agentos-solution-modules/types/index.ts` | Type exports. |
| `src/modules/bussiness/agentos-solution-modules/catalog/manifest-digest.ts` | Stable canonical serializer + SHA-256. |
| `src/modules/bussiness/agentos-solution-modules/catalog/agentos-solution-module-catalog.service.ts` | Resolve only published key/version pairs and verify digest. |
| `src/modules/bussiness/agentos-solution-modules/catalog/packages/multichannel-chatbot/manifest.ts` | Typed `1.0.0` manifest. |
| `src/modules/bussiness/agentos-solution-modules/catalog/packages/multichannel-chatbot/private-knowledge.ts` | Intent, grounding, escalation, handoff and channel-style playbooks. |
| `src/modules/bussiness/agentos-solution-modules/catalog/packages/sales-copilot/manifest.ts` | Typed `1.0.0` manifest. |
| `src/modules/bussiness/agentos-solution-modules/catalog/packages/sales-copilot/private-knowledge.ts` | Qualification, discovery, objection, follow-up and CRM logging playbooks. |
| `src/modules/bussiness/agentos-solution-modules/agentos-module-desired-state.compiler.ts` | Verify same-workspace refs and compose deterministic agents/common/shared/private ACL/channel/tool bindings. |
| `src/modules/bussiness/agentos-solution-modules/agentos-module-installation.service.ts` | Owner-scoped reads and atomic reservation/materialization. |
| `src/modules/bussiness/agentos-solution-modules/pod-runtime-job.service.ts` | Idempotent enqueue, signed-pod lease, fenced result and Saga-visible status. |
| `src/modules/bussiness/agentos-solution-modules/agentos-module-provision.dispatcher.ts` | Create outer job/Saga and enqueue exactly once. |
| `src/modules/bussiness/agentos-solution-modules/provision-agentos-module.worker.ts` | Run existing `ProvisioningSagaRunnerService`. |
| `src/modules/bussiness/agentos-solution-modules/provision-step-map.service.ts` | Versioned ordered Saga definition. |
| `src/modules/bussiness/agentos-solution-modules/steps/reserve-installation.step.ts` | Step 0. |
| `src/modules/bussiness/agentos-solution-modules/steps/pin-manifest.step.ts` | Step 1. |
| `src/modules/bussiness/agentos-solution-modules/steps/compose-desired-state.step.ts` | Step 2. |
| `src/modules/bussiness/agentos-solution-modules/steps/queue-runtime-reconcile.step.ts` | Step 3. |
| `src/modules/bussiness/agentos-solution-modules/steps/await-runtime-reconcile.step.ts` | Step 4 with bounded polling and retryable timeout. |
| `src/modules/bussiness/agentos-solution-modules/steps/record-ready.step.ts` | Step 5 and outbox transition. |

#### Viewer GraphQL doors

Each new operation folder mirrors the current command/query family and contains its own `module-definition.ts`, `module.ts`, resolver, CQRS message, handler, service where the sibling has one, `graphql-types/input.ts` or `response.ts`, `graphql-types/index.ts`, and `index.ts`.

| Folder | Exact operation files |
|---|---|
| `src/features/core/api/core/graphql/mutations/agent-workspace/install-agentos-solution-module/` | `install-agentos-solution-module.command.ts`, `install-agentos-solution-module.handler.ts`, `install-agentos-solution-module.service.ts`, `install-agentos-solution-module.resolver.ts`, `install-agentos-solution-module.module-definition.ts`, `install-agentos-solution-module.module.ts`, `graphql-types/input.ts`, `graphql-types/response.ts`, `graphql-types/index.ts`, `index.ts`. |
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agentos-solution-modules/` | `my-agentos-solution-modules.query.ts`, `my-agentos-solution-modules.handler.ts`, `my-agentos-solution-modules.service.ts`, `my-agentos-solution-modules.resolver.ts`, `my-agentos-solution-modules.module-definition.ts`, `my-agentos-solution-modules.module.ts`, `graphql-types/response.ts`, `graphql-types/index.ts`, `index.ts`. |
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agentos-module-installations/` | `my-agentos-module-installations.query.ts`, `my-agentos-module-installations.handler.ts`, `my-agentos-module-installations.service.ts`, `my-agentos-module-installations.resolver.ts`, `my-agentos-module-installations.module-definition.ts`, `my-agentos-module-installations.module.ts`, `graphql-types/response.ts`, `graphql-types/index.ts`, `index.ts`. |
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agentos-module-installation/` | `my-agentos-module-installation.query.ts`, `my-agentos-module-installation.handler.ts`, `my-agentos-module-installation.service.ts`, `my-agentos-module-installation.resolver.ts`, `my-agentos-module-installation.module-definition.ts`, `my-agentos-module-installation.module.ts`, `graphql-types/response.ts`, `graphql-types/index.ts`, `index.ts`. |
| `src/features/core/api/core/graphql/mutations/index.ts` | Register install mutation module. |
| `src/features/core/api/core/graphql/queries/index.ts` | Register all three query modules. |
| `apps/core/src/app.module.ts` | Import the generic solution-module capability and its BullMQ registration once. |

#### Signed pod pull door

| File | Change |
|---|---|
| `src/modules/bussiness/pod-registration/dto/poll-pod-runtime-jobs.dto.ts` | Bounded poll query DTO. |
| `src/modules/bussiness/pod-registration/dto/report-pod-runtime-job.dto.ts` | Strict lease-version/digest/outcome DTO; no secret fields. |
| `src/modules/bussiness/pod-registration/pod-registration.types.ts` | Add public-safe polled job/result shapes. |
| `src/features/core/api/core/http/pod-registration/pod-registration.controller.ts` | Add `GET /pods/self/jobs` and `POST /pods/self/jobs/result`, both guarded by `PodClientAssertionGuard`; pod id never comes from payload. |
| `src/features/core/api/core/http/http.module.ts` | Keep controller/module registration reachable from core. |

#### Instance applied state, OpenClaw compiler and MCP ACL

| File | Change |
|---|---|
| `apps/agentos-controlplane/src/instance-db/entities/solution-module-installation.entity.ts` | Persist applied desired state/digest/status/failure by installation id. |
| `apps/shared/instance-db/schema-ddl.ts` | Add the shared table DDL used by both controlplane/CLI schemas. |
| `apps/agentos-controlplane/src/instance-db/migrations/1789779600000-solution-modules.ts` | Idempotent instance schema migration. |
| `apps/agentos-controlplane/src/instance-db/instance-data-source.ts` | Register entity/migration. |
| `src/modules/bussiness/openclaw-runtime-config/openclaw-runtime-config.store.ts` | Serialize atomic read/modify/write of `openclaw.json`. |
| `src/modules/bussiness/openclaw-runtime-config/openclaw-runtime-config.service.ts` | Move access-section update through the shared store without changing its public behavior. |
| `src/modules/bussiness/openclaw-runtime-config/openclaw-module-config.service.ts` | Own only module-generated `agents`, auth-profile refs, channel accounts, bindings and MCP entries. |
| `src/modules/bussiness/openclaw-runtime-config/openclaw-runtime-config.types.ts` | Add closed module config input types. |
| `src/modules/bussiness/openclaw-runtime-config/openclaw-runtime-config.module.ts` | Export store and module compiler. |
| `apps/agentos-controlplane/src/module-runtime/module-runtime.module.ts` | Register validator, applied-state store, knowledge reconciler, OpenClaw reconciler and probes. |
| `apps/agentos-controlplane/src/module-runtime/module-runtime-payload.reader.ts` | Runtime validation/narrowing of the network payload. |
| `apps/agentos-controlplane/src/module-runtime/module-runtime-reconciler.service.ts` | Idempotently apply desired digest and preserve last good applied state on failure. |
| `apps/agentos-controlplane/src/module-runtime/module-knowledge-reconciler.service.ts` | Upsert private chunks with installation metadata and persist common/shared ACL refs. |
| `apps/agentos-controlplane/src/module-runtime/module-runtime-probe.service.ts` | Verify OpenClaw agent entries, MCP reachability and required channel account refs. |
| `apps/agentos-controlplane/src/backend/backend-client.service.ts` | Parse typed jobs, dispatch module reconcile, and signed-report fenced result. |
| `apps/agentos-controlplane/src/backend/chores.service.ts` | Route `RECONCILE_AGENTOS_MODULE` to runtime reconciler; preserve `index-pending` Job spawning. |
| `apps/agentos-controlplane/src/backend/backend.module.ts` | Import/export module runtime dependency exactly once. |
| `apps/agentos-controlplane/src/app.module.ts` | Register `ModuleRuntimeModule` after instance DB and before background chores. |
| `apps/agentos-controlplane/src/mcp/agent-knowledge-policy.service.ts` | Resolve the calling agent's allowed common/shared/private source filters from applied state. |
| `apps/agentos-controlplane/src/mcp/mcp-server.controller.ts` | Accept bounded `x-nivo-agent-id` identity supplied by the generated local OpenClaw MCP config. |
| `apps/agentos-controlplane/src/mcp/mcp-server.service.ts` | Apply policy filters to every search; reject unknown/unbound agents. |
| `apps/agentos-controlplane/src/mcp/mcp.module.ts` | Register policy service and instance DB dependency. |

#### Channel account identity required by the manifest contract

| File | Change |
|---|---|
| `src/modules/platform/databases/postgresql/agentos/entities/channel-connection.entity.ts` | Add `externalAccountId`; change uniqueness to `(instance, channelKind, externalAccountId)`. |
| `src/modules/platform/databases/postgresql/primary/migrations/1789779700000-agentos-channel-account-identity.ts` | Backfill legacy singleton rows with deterministic `default`, then replace unique index. |
| `src/modules/bussiness/pod-credential/channel-credential-keys.ts` | Namespace credential keys by provider + account id. |
| `src/modules/bussiness/pod-credential/pod-credential.service.ts` | Scope replace/list/sync to one account; never overwrite sibling account credentials. |
| `src/features/core/api/core/graphql/mutations/agent-workspace/configure-agent-workspace-channel/graphql-types/input.ts` | Require bounded `accountId`. |
| `src/features/core/api/core/graphql/mutations/agent-workspace/configure-agent-workspace-channel/configure-agent-workspace-channel.command.ts` | Carry account identity. |
| `src/features/core/api/core/graphql/mutations/agent-workspace/configure-agent-workspace-channel/configure-agent-workspace-channel.handler.ts` | Upsert/sync exact account. |
| `src/features/core/api/core/graphql/mutations/agent-workspace/disconnect-agent-workspace-channel/graphql-types/input.ts` | Require account identity. |
| `src/features/core/api/core/graphql/mutations/agent-workspace/disconnect-agent-workspace-channel/disconnect-agent-workspace-channel.handler.ts` | Disconnect exact account only. |
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-channel-settings/graphql-types/response.ts` | Return account id and status per provider account. |
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-channel-settings/my-agent-workspace-channel-settings.handler.ts` | List all accounts without secret material. |

#### Exceptions

| Folder | Exact classes |
|---|---|
| `src/modules/platform/exceptions/errors/agentos-solution-modules/` | `agentos-solution-module-not-found.ts`, `agentos-module-already-installed.ts`, `agentos-module-installation-not-found.ts`, `agentos-module-reference-not-owned.ts`, `agentos-module-manifest-invalid.ts`, `agentos-module-runtime-timeout.ts`, `pod-runtime-job-lease-mismatch.ts`, `index.ts`. Every constructor accepts one metadata object and extends `AbstractException`. |
| `apps/agentos-controlplane/src/exceptions/errors/index.ts` | Add typed invalid desired-state, unknown agent policy and module reconcile failure exceptions using metadata objects. |

### EXACT TEST TREE

| File | Required cases |
|---|---|
| `src/modules/bussiness/agentos-solution-modules/catalog/agentos-solution-module-catalog.service.spec.ts` | Two exact manifests resolve; unknown key/version refuses; digest is stable; changing manifest content changes digest. |
| `src/modules/bussiness/agentos-solution-modules/agentos-module-desired-state.compiler.spec.ts` | Deterministic ids; three knowledge layers; shared refs must belong to workspace; private ACL cannot cross installation; Sales defaults draft-first. |
| `src/modules/bussiness/agentos-solution-modules/agentos-module-installation.service.spec.ts` | Owner scope; same idempotency returns same row; concurrent duplicate install creates one row; second key for installed module refuses. |
| `src/modules/bussiness/agentos-solution-modules/pod-runtime-job.service.spec.ts` | Atomic lease; expired lease reissued with higher version; stale result fenced; wrong pod cannot read/report; payload contains no secret-shaped keys. |
| `src/modules/bussiness/agentos-solution-modules/provision-step-map.service.spec.ts` | Exact six-step order/version and compensation ownership. |
| One `*.spec.ts` beside each Saga step | Happy decision, retry/idempotency boundary, permanent failure and compensation effect. |
| `src/features/core/api/core/graphql/mutations/agent-workspace/install-agentos-solution-module/install-agentos-solution-module.handler.spec.ts` | Authenticated owner success, foreign workspace indistinguishable from missing, invalid refs, duplicate idempotency and dispatch once. |
| One `*.handler.spec.ts` beside each new query | Owner rows only, empty list, both catalog entries, applied/degraded/failure mapping. |
| `src/features/core/api/core/http/pod-registration/pod-runtime-jobs.controller.spec.ts` | Real guard context derives pod id; DTO bounds; poll lease; success/failure report; stale lease refusal. |
| `src/modules/bussiness/openclaw-runtime-config/openclaw-runtime-config.store.spec.ts` | Concurrent section updates do not clobber access/module config; mode `0600`; unchanged content no rewrite. |
| `src/modules/bussiness/openclaw-runtime-config/openclaw-module-config.service.spec.ts` | Multiple agents/profiles/accounts/bindings; preserves unmanaged fields; removal affects only installation-owned entries. |
| `apps/agentos-controlplane/src/module-runtime/module-runtime-payload.reader.spec.ts` | Strict narrowing and size ceilings; unknown keys/version/digest mismatch refused. |
| `apps/agentos-controlplane/src/module-runtime/module-runtime-reconciler.service.spec.ts` | Idempotent same digest; last-good config survives failure; applied snapshot transitions; no secret logs. |
| `apps/agentos-controlplane/src/module-runtime/module-knowledge-reconciler.service.spec.ts` | Correct common/shared/private metadata; second module cannot search first private chunks; upgrade replaces alias only after complete. |
| `apps/agentos-controlplane/src/mcp/agent-knowledge-policy.service.spec.ts` | Agent-bound filter, unknown agent refusal, shared explicit bind, common version pin, private isolation. |
| `src/modules/bussiness/pod-credential/pod-credential.service.spec.ts` | Two accounts of same provider coexist; replacing one leaves the other; redacted status only. |
| `src/tests/e2e/nivo/agentos-solution-module-install.e2e-spec.ts` | GraphQL install → real BullMQ/Saga → signed pod poll/result → Kafka consumer → real Socket.IO event → read installation `ready`; test both packages. |
| `src/tests/e2e/nivo/agentos-solution-module-concurrency.e2e-spec.ts` | Five concurrent requests with same idempotency key yield one installation/Saga/runtime job; two different modules can provision concurrently. |
| `src/tests/e2e/controlplane/agentos-module-runtime.e2e-spec.ts` | Real controlplane HTTP/MCP/OpenClaw config file + instance DB; apply Chatbot and Sales together; verify isolated retrieval and multi-agent bindings. |
| `src/tests/e2e/nivo/agentos-module-knowledge-isolation.e2e-spec.ts` | Seed same-workspace shared source plus distinct private corpora; query through real MCP transport; assert allowed results and negative cross-module result. |
| `src/tests/probe/agentos-chart.probe-spec.ts` | Required config volume, env and service routes remain mounted for controlplane/OpenClaw/MCP. No chart change is expected unless the probe exposes a missing mount. |

### PROOF COMMANDS FOR APPLY

| Gate | Command / evidence |
|---|---|
| Effective schema | Boot core, dump full unfiltered Query/Mutation schema, then assert the four new roots and DTO names. |
| Target specs | Run Jest over every new/changed `*.spec.ts` path above with no `--passWithNoTests`. |
| Flow E2E | Run all four named E2E files through GraphQL/HTTP/broker/socket/MCP boundaries; no direct handler/worker calls. |
| Backend lint | Run repository canonical lint; zero errors and zero warnings in the approved boundary, no suppression or weakened rule. |
| Type/build | Build `core` and `agentos-controlplane`; run the repository's frozen typecheck. |
| Live proof | Log in with Nivo test persona, install both packages from UI after FE Apply, inspect UI, Network, Console, core/controlplane terminals, Kafka/Socket events and OpenClaw/MCP runtime. Record under `### LIVE FLOW PROOF`; never record credentials/tokens/cookies. |

### OUTPUTS

| Concept | Result |
|---|---|
| Runtime direction | OpenClaw remains the primary runtime; Hermes is not part of r1. |
| Implementation shape | One generic manifest/installation/Saga engine, not duplicated Chatbot and Sales feature trees. |
| Initial modules | `multichannel-chatbot@1.0.0` and `sales-copilot@1.0.0` are fully specified as typed packages. |
| Controlplane call direction | Signed pull from pod to Nivo via `/pods/self/jobs`; no inbound core push and no browser access to controlplane. |
| Knowledge model | Nivo common + explicit workspace shared + installation private, enforced by MCP source filters. |
| Realtime | Existing outbox/Kafka/consumer/Socket.IO pipeline extended with module-installation identity. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-solution-modules.md` | `added` — exact Backend Feature Plan r1. |
| Target production repositories | No production source written in Plan. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Review the exact r1 architecture and file boundary | Run `$starci-be-feature-review` for `nivo-agentos-solution-modules-r1`; Review may revise, then must request explicit approval of one exact revision before Apply. |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend and charts worktrees already contain substantial uncommitted Academy, channel-center and OpenClaw launch work. | Review/Apply must preserve unrelated changes, re-measure every shared-file overlap and never reset the worktree. |
| Existing `pollJobs`, telemetry, knowledge-manifest and report-status comments describe missing core routes. | This plan implements only the two job routes required by module reconcile; the other missing routes remain separate debt. |
| Current channel center is provider-singleton while OpenClaw supports account-scoped bindings. | The account-identity sub-boundary above is required before claiming multiple accounts of the same provider; multichannel across different providers works independently. |
| Live model calls are nondeterministic and paid. | E2E stubs only the external model SDK with realistic parsed JSON; one bounded harness per module may call an explicit provider key later. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| FE calls controlplane/OpenClaw directly | FE → Nivo GraphQL; pod pulls signed desired jobs | Keeps Keycloak owner authorization, pod identity and secrets out of the browser. |
| Nivo core pushes into pod | Controlplane egress-only polling | Matches the existing firewall/trust model and source's “backend makes none” invariant. |
| One OpenClaw deployment per module | One gateway with isolated agents/profiles/bindings | OpenClaw natively supports multi-agent isolation; per-module deployments waste capacity and complicate channels. |
| Two copied Chatbot/Sales implementations | One engine + two immutable typed manifests | Later Marketing/Support modules become data packages, not another Saga/API tree. |
| Flat workspace vector collection without ACL | Agent-resolved common/shared/private filter | Flat retrieval leaks private module context across agents. |
| Secret in desired state, event or GraphQL read model | Stable SecretRef/account/profile identity only | Prevents replay logs, Kafka and browser caches from becoming credential stores. |
| Sales Copilot sends autonomously in r1 | Draft-first with explicit human approval | Avoids unreviewed discount, contract and payment commitments. |

### OWED

| Owed | Cleared by |
|---|---|
| Architecture challenge, overlap audit and exact revision approval | `$starci-be-feature-review` on `nivo-agentos-solution-modules-r1`. |
| Backend implementation and twin-spec/E2E/live proof | `$starci-be-feature-apply` only after Review approval. |
| FE component tree and contract consumption | `$starci-fe-design-review` then `$starci-fe-design-apply` after backend Review freezes GraphQL shapes. |
| Optional live model quality evaluation | Separate bounded harness credentials and one/two curated cases per module; not part of deterministic E2E. |

## review — nivo-agentos-solution-modules-r2

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-backend` |
| Source | `D:\Repositories\starci-academy-backend` |
| Project | Explicit targets |
| Frontend | `D:\Repositories\nivo-fe` |
| Backend | `D:\Repositories\nivo-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Skills | `D:\Repositories\starci-academy-backend\.claude\skills` |
| App | `nivo` |
| Repo / branch | `D:\Repositories\nivo-backend` / `main` |
| Purpose | Phản biện và khóa production boundary cho hai AgentOS solution module trước khi viết backend source. |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |
| Workflow | `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-solution-modules.md` |
| Language | `vi` |
| Phase | `review` |
| Touching | Chỉ workflow này; không viết production source trong Review. |

### REVIEW FINDINGS

| Finding | Evidence | r2 ruling |
|---|---|---|
| R1 chưa khóa được knowledge filter thật | `KnowledgeStoreService.search(query, limit)` gọi Qdrant mà không truyền `filter`; `McpServerService` gọi đúng overload không filter đó. | Thêm typed `KnowledgeSearchScope`, sửa store nhận filter và buộc MCP policy truyền filter ở mọi call. |
| Header `x-nivo-agent-id` không phải authorization | Mọi container cùng pod network có thể tự đặt header. | Mỗi generated agent nhận capability ngẫu nhiên; OpenClaw MCP config gửi `x-nivo-agent-id` + `authorization: Bearer <capability>`; instance DB chỉ giữ hash, MCP dùng timing-safe verification. |
| R1 thiếu module wiring của pod pull service | `PodRegistrationController` được cung cấp bởi `src/modules/bussiness/pod-registration/pod-registration.module.ts`, không phải `http.module.ts`. | Sửa exact boundary: thêm provider/import ở `pod-registration.module.ts`; bỏ thay đổi `http.module.ts` nếu source lúc Apply vẫn giữ shape hiện tại. |
| Poll không cần query DTO | Pod id đã đến từ assertion và r1 trả tối đa một job. | Bỏ `poll-pod-runtime-jobs.dto.ts`; `GET /pods/self/jobs` không nhận pod/job selector từ caller. |
| R1 chưa chỉ rõ cấu hình nhiều model key | OpenClaw hỗ trợ auth profiles, nhưng Nivo hiện chỉ có một `InstanceModelKeyEntity` cho key do Nivo cấp. | r2 không phát minh key-custody UI trong cùng feature. Hai module dùng profile `nivo-default` hiện hữu; desired-state contract giữ `modelProfileRef` để một feature riêng thêm nhiều customer key mà không đổi installer. Không được báo “quản nhiều key” đã hoàn thành trong r2. |
| Runtime payload có thể phình theo private knowledge body | Hai package content do Nivo phát hành có cùng code/image revision ở core và controlplane. | Core gửi key/version/digest + customer bindings, không gửi toàn bộ private corpus. Controlplane resolve local manifest cùng digest; digest mismatch trả permanent failure và không apply. |
| Bounded polling cần ceiling cụ thể | Saga worker giữ một BullMQ slot trong lúc chờ controlplane poll. | `await-runtime-reconcile` poll DB tối đa 90 giây, 1 giây/lần, không `sleep` trong tests; timeout là retryable và cùng runtime job được tái sử dụng. Review cấm chờ vô hạn. |
| Account-scoped channel migration đang overlap worktree | Channel Center r2 có uncommitted source ở cùng handlers/entities. | Giữ account identity trong approved boundary vì module role cần stable account ref, nhưng Apply phải baseline/merge current source, không thay thế hoặc reset thay đổi có sẵn. |

### APPROVED CANDIDATE ARCHITECTURE

| Concern | Frozen r2 decision |
|---|---|
| Product | Một generic solution-module engine, hai immutable manifests `multichannel-chatbot@1.0.0` và `sales-copilot@1.0.0`. |
| Transport | FE → Nivo GraphQL. Controlplane → signed `GET /pods/self/jobs` và `POST /pods/self/jobs/result`. Không browser/core push vào pod. |
| Desired/applied split | Primary PostgreSQL giữ desired installation + runtime job lease; instance PostgreSQL giữ applied digest/status + per-agent capability hashes. |
| Runtime | Controlplane resolve local manifest, verify digest, reconcile knowledge ACL + OpenClaw config, probe rồi report. |
| Knowledge | Qdrant filter bắt buộc theo exact common version, explicit shared source ids và private installation id. Không có unfiltered fallback cho module agent. |
| Agent identity | `agentId` header là selector; per-agent bearer capability mới là authorization. Capability plaintext chỉ tồn tại trong generated OpenClaw config, không về Nivo/Kafka/Socket/log. |
| Model profile | Cả hai package r2 dùng `nivo-default`; multi-key customer profile manager là feature riêng. |
| Sales safety | Draft-first; outbound send/discount/contract/payment commitment cần human approval. |
| Saga | Sáu step của r1 giữ nguyên; runtime step dùng one-job/one-digest idempotency, lease fencing và 90-second bounded wait. |

### EXACT PRODUCTION TOUCHING — R2

R2 giữ toàn bộ tree của Plan r1, với các thay đổi bắt buộc sau:

| Action | Exact path | Revision |
|---|---|---|
| ADD | `apps/agentos-controlplane/src/instance-db/entities/agent-mcp-capability.entity.ts` | Hash capability theo `(installationId, agentId)`; unique agent id; không `@Field`, không plaintext. |
| MODIFY | `apps/shared/instance-db/schema-ddl.ts` | Thêm DDL applied installation + agent capability dùng chung. |
| MODIFY | `apps/agentos-controlplane/src/instance-db/migrations/1789779600000-solution-modules.ts` | Tạo cả applied installation và capability table/index. |
| MODIFY | `apps/agentos-controlplane/src/instance-db/instance-data-source.ts` | Register cả hai entity. |
| ADD | `apps/agentos-controlplane/src/module-runtime/agent-mcp-capability.service.ts` | Mint capability bằng CSPRNG, hash at rest, timing-safe verify, reuse idempotently cho cùng generated agent. |
| MODIFY | `apps/agentos-controlplane/src/module-runtime/module-runtime-reconciler.service.ts` | Resolve local manifest/digest; mint/reuse capability; không nhận private corpus body từ network. |
| MODIFY | `src/modules/bussiness/agentos-solution-modules/types/desired-state.ts` | Payload chỉ giữ manifest identity/digest, generated ids và customer-owned references; không package document body. |
| ADD | `apps/shared/knowledge/knowledge-search-scope.ts` | Typed Qdrant filter input cho common/shared/private layers. |
| MODIFY | `apps/shared/knowledge/knowledge-payload.ts` | Thêm metadata `knowledgeLayer`, `commonVersion`, `workspaceSourceId`, `installationId`, `moduleKey`, `knowledgeVersion`. |
| MODIFY | `apps/shared/knowledge/knowledge.types.ts` | Thêm typed scope/result metadata cần cho policy proof. |
| MODIFY | `apps/shared/knowledge/knowledge-store.service.ts` | `search(query, limit, scope)` luôn compile Qdrant filter; module call không có scope bị từ chối. |
| MODIFY | `apps/shared/knowledge/knowledge-store.service.spec.ts` | Chứng minh filter shape và không có cross-installation fallback. |
| MODIFY | `apps/agentos-controlplane/src/mcp/agent-knowledge-policy.service.ts` | Resolve scope + verify bearer capability cho agent. |
| MODIFY | `apps/agentos-controlplane/src/mcp/mcp-server.controller.ts` | Đọc bounded agent id và bearer capability; không coi header id là auth. |
| MODIFY | `apps/agentos-controlplane/src/mcp/mcp-server.service.ts` | Bắt buộc policy scope trong mọi search. |
| MODIFY | `apps/agentos-controlplane/src/mcp/mcp-server.service.spec.ts` | Positive capability, wrong/missing capability, private isolation và shared binding cases. |
| MODIFY | `apps/agentos-controlplane/src/mcp/mcp-server.transport.spec.ts` | Chứng minh real HTTP MCP request bị 401 khi thiếu/sai capability. |
| REMOVE FROM TOUCHING | `src/modules/bussiness/pod-registration/dto/poll-pod-runtime-jobs.dto.ts` | Poll không nhận selector. |
| ADD | `src/modules/bussiness/pod-registration/dto/report-pod-runtime-job.dto.ts` | Chỉ result DTO cần validation. |
| MODIFY | `src/modules/bussiness/pod-registration/pod-registration.module.ts` | Import/export `AgentosSolutionModulesModule` hoặc provider token không tạo cycle; register dependency của controller. |
| MODIFY | `src/features/core/api/core/http/pod-registration/pod-registration.controller.ts` | Add signed poll/result routes. |
| REMOVE FROM TOUCHING | `src/features/core/api/core/http/http.module.ts` | Controller đã được module business hiện hữu đăng ký; không sửa nếu source shape không đổi. |
| MODIFY | `src/modules/bussiness/agentos-solution-modules/steps/await-runtime-reconcile.step.ts` | 90-second bound, 1-second production poll cadence, injectable waiter for deterministic specs. |
| ADD | `src/modules/bussiness/agentos-solution-modules/steps/await-runtime-reconcile.step.spec.ts` | Immediate success/failure, bounded timeout, retry reuses same job; no wall-clock sleep. |

### MODEL PROFILE BOUNDARY

| Included r2 | Excluded r2 |
|---|---|
| Resolve `modelProfileRef: "nivo-default"` against the existing workspace model key and compile the profile into each generated agent. | Create/update/delete arbitrary customer model keys, OAuth profiles, key pools or browser-visible key management. |
| Multiple generated agents may reference the same default profile without copying plaintext into desired state. | Claiming multiple independent model keys have been implemented. |

### REVISED ACCEPTANCE GATES

| Gate | Required proof |
|---|---|
| Manifest twin specs | Both core and controlplane resolve the same key/version/digest; a deliberately mismatched digest is permanently refused before side effects. |
| Knowledge isolation | Real Qdrant request contains filters for allowed layers; Chatbot cannot retrieve Sales private chunk and vice versa; missing capability receives 401. |
| Pull job fencing | Two concurrent polls lease one job; stale `leaseVersion` cannot complete after re-lease; foreign pod sees no job and cannot report it. |
| Saga | Same idempotency key under five concurrent GraphQL requests produces one installation, one outer Saga and one runtime job. |
| OpenClaw config | Access fields survive module reconciliation; two modules produce four agent entries and scoped MCP capability headers; applying same digest is no-op. |
| Realtime | Real Kafka consumer and Socket.IO client receive exact installation id/status; reconnect refetches GraphQL snapshot. |
| Live | Test persona installs Chatbot then Sales from Nivo UI after FE Apply; UI, Network, Console, core/controlplane terminal and runtime probe all recorded. Missing credentials/runtime remain `OWED`, never pass. |

### OUTPUTS

| Concept | Result |
|---|---|
| Reviewed capability | Backend package/install/Saga/runtime foundation for Chatbot đa kênh and Sales Copilot. |
| Candidate revision | `nivo-agentos-solution-modules-r2`. |
| Security correction | MCP agent id is no longer trusted alone; per-agent capability + filtered Qdrant scope is mandatory. |
| Runtime direction | Controlplane pull remains the only management path into a workspace pod. |
| Scope correction | r2 uses existing `nivo-default` model profile and does not falsely claim arbitrary multi-key management. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-solution-modules.md` | `modified` — append Review r2 findings, corrected boundary and proof gates. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve the exact r2 backend production boundary for Apply? | **Duyệt `nivo-agentos-solution-modules-r2`**; hoặc nêu một thay đổi phạm vi cụ thể. |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend worktree đang có nhiều thay đổi chưa commit, gồm đúng channel/OpenClaw shared files. | Apply phải tạo baseline commit của trạng thái hiện tại trước source write và theo dõi diff từ baseline; không được reset/ghi đè thay đổi của user. |
| Per-agent capability ngăn truy cập vô tình hoặc từ container không có config, nhưng mọi agent vẫn chạy trong cùng một OpenClaw process. | Đây không phải sandbox chống một plugin độc hại có quyền đọc toàn bộ process/config; hard multi-tenant isolation cần process/pod riêng và nằm ngoài r2. |
| FE chưa consume bốn GraphQL operations mới. | Backend live proof có thể chứng minh GraphQL/pod/runtime trước; full UI proof chỉ hoàn tất sau FE Design Review/Apply. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Tin `x-nivo-agent-id` như authorization | Agent id + per-agent bearer capability | Header selector tự đặt được trong pod. |
| Gửi toàn bộ private knowledge package qua runtime job | Controlplane resolve local immutable manifest và so digest | Giảm payload, tránh hai nguồn content và phát hiện image drift trước apply. |
| Claim r2 quản nhiều model key | Dùng `nivo-default`; tách key profile manager thành feature riêng | Source hiện chỉ có một Nivo-managed `InstanceModelKeyEntity`; không được mô tả capability chưa tồn tại. |
| Sửa `http.module.ts` theo Plan r1 | Wire dependency trong `pod-registration.module.ts` | Controller thực tế do business module đăng ký. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of exact r2 | User replies `Duyệt nivo-agentos-solution-modules-r2`. |
| Production implementation | `$starci-be-feature-apply` after approval. |
| Arbitrary multi-key/auth-profile management | Separate Backend Feature Plan after r2; desired-state `modelProfileRef` keeps that seam open. |
| FE consumption and full live UI proof | FE Design Review/Apply after backend contracts compile. |

Approved revision: `nivo-agentos-solution-modules-r2`
Approval evidence: User replied `Duyệt nivo-agentos-solution-modules-r2` on 2026-08-17.

## apply — nivo-agentos-solution-modules-r2

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\nivo-backend` |
| Source | `D:\Repositories\starci-academy-backend` |
| Project | Explicit targets |
| Frontend | `D:\Repositories\nivo-fe` |
| Backend | `D:\Repositories\nivo-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Workflow | `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-solution-modules.md` |
| Approved revision | `nivo-agentos-solution-modules-r2` |
| Baseline commit | `36e39af5b1c328384d1b0a8c5c195e82c8bca0be` |
| Implementation commit | `8ae521ee225d5ec90abd4a1c41d11e14da445239` |

### IMPLEMENTED BOUNDARY

| Area | Result |
|---|---|
| Product engine | Added one typed solution-module engine with immutable `multichannel-chatbot@1.0.0` and `sales-copilot@1.0.0` manifests, shared knowledge plus package-private knowledge and deterministic manifest digests. |
| API | Added `installAgentosSolutionModule`, catalog, installation-list and installation-detail GraphQL operations with workspace ownership and idempotency enforcement. |
| Saga | Added six-step BullMQ provisioning flow: reserve, pin manifest, compose desired state, queue runtime reconcile, bounded wait and record ready. |
| Pod bridge | Added signed `GET /pods/self/jobs` and `POST /pods/self/jobs/result`, lease fencing and job reuse by installation/digest. Desired payload contains references and digests, never credentials. |
| Controlplane | Added local manifest verification, desired/applied snapshots, last-good preservation, knowledge reconciliation, OpenClaw multi-agent config, runtime probe and result reporting. |
| MCP and knowledge | Added per-agent bearer capability hashes and mandatory scoped Qdrant filters for common/shared/private layers; missing or wrong capability is rejected. |
| Channels | Added account-scoped channel identity and credential namespacing so multiple accounts of one provider can coexist without exposing values. |
| Realtime | Reused the existing outbox → Kafka consumer → provisioning gateway pipeline; E2E waits for the actual inbox relay marker. |

### PROOF

| Gate | Command / evidence | Verdict |
|---|---|---|
| Boundary lint | ESLint over all 145 baseline-diff TypeScript files with `--max-warnings 0` | PASS — 0 errors, 0 warnings. |
| Repository lint | `npx eslint "{src,apps}/**/*.ts" --quiet` | PASS — 0 errors. |
| Core build | `npm run build` | PASS. |
| Controlplane build | `npm run build:controlplane` | PASS. |
| Focused twin/unit specs | 12 suites covering catalog digest, desired compiler, runtime payload/reconcile, MCP capability/transport, knowledge filter, OpenClaw config, runtime jobs and bounded wait | PASS — 43/43 tests. |
| Flow E2E | Standard E2E config over install, concurrency and channel-center specs | PASS — 3/3 suites, 13/13 tests. |
| Full unit regression | `npm test -- --runInBand` | 436 suites / 2006 tests PASS; two pre-existing tests outside the baseline diff remain failing and are listed under warnings. |
| Diff integrity | `git diff --cached --check` before commit plus credential-literal scan of the new feature boundary | PASS. |

### LIVE FLOW PROOF

| Field | Evidence |
|---|---|
| Flow | GraphQL install → BullMQ Saga → signed pod poll → signed result → installation ready → Kafka consumer relay. |
| Persona | Authenticated E2E workspace owner fixture. |
| Steps | Installed Chatbot and Sales; queried catalog/list/detail; polled and completed each runtime job; sent five concurrent same-key requests; installed two different modules concurrently. |
| UI | OWED — FE does not consume these four GraphQL operations yet. |
| Network | PASS in HTTP/GraphQL E2E; pod assertion, lease version and result boundary exercised. |
| Console | Not applicable to backend-only Apply. |
| Terminal | Core booted against the E2E stack; BullMQ jobs enqueued; Kafka consumer subscribed; inbox relay reached `relayedAt`. |
| Runtime | Deterministic controlplane reconcile/probe path covered by twin specs; a deployed workspace UI/runtime probe remains OWED until FE Apply and live credentials/runtime are supplied. |
| Verdict | Backend feature PASS; full browser Socket.IO/UI proof remains explicitly OWED, not reported as pass. |

### OUTPUTS

| Concept | Result |
|---|---|
| AgentOS solution modules backend | Implemented and committed at `8ae521ee225d5ec90abd4a1c41d11e14da445239`. |
| First packages | Chatbot đa kênh and Sales Copilot share one engine while retaining separate prompts, private knowledge and agent bindings. |
| Security | No credentials in GraphQL, desired state, Kafka or Socket payloads; MCP access uses hashed per-agent capabilities and scoped retrieval. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\nivo-backend` | 145 files, 5,768 insertions and 188 deletions from the clean Apply baseline. |
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-solution-modules.md` | Added approval, exact implementation boundary, proof and owed live evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Backend r2 is implemented; FE work must enter its approved Design Review/Apply lifecycle. |

### WARNINGS

| Warning | Impact |
|---|---|
| Full unit suite still has the pre-existing `expert-deploy-k8s-watcher.service.spec.ts` polling-count failure and `cache/stores.spec.ts` concurrent-take failure. | Both files are outside the baseline-to-feature diff; focused and flow gates for r2 are green. Route these through backend audit instead of hiding them in this feature. |
| E2E boot logs show a Qdrant client/server minor-version incompatibility warning and missing optional local embedding configuration. | The deterministic module tests pass, but a live knowledge quality run needs a compatible deployed Qdrant/embedding runtime. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Direct FE/controlplane calls or credentials in runtime payloads | Nivo GraphQL plus signed controlplane pull jobs and stable references | Preserves ownership and secret boundaries. |
| One copied backend per package | One engine plus immutable manifests | Keeps future Sales/Marketing/Support packages data-driven. |
| Reporting browser/live Socket.IO proof as complete | Record it as OWED | FE consumption and a deployed workspace session are not part of this backend-only Apply. |

### OWED

| Owed | Cleared by |
|---|---|
| FE component tree and consumption of the four GraphQL operations | Approved `$starci-fe-design-review`, then `$starci-fe-design-apply`. |
| Full browser proof: login, install both modules, observe Socket.IO, open resulting management UI | FE Apply with test account and live core/controlplane/workspace runtime. |
| Optional paid model-quality evaluation | Separate bounded harness using supplied provider credentials and curated module cases. |
| Two unrelated full-suite failures | `$starci-be-audit-plan` → Review → Apply for the watcher and cache race tests. |

## apply continuation — nivo-agentos-solution-modules-r2-live-ui

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\nivo-backend` |
| Source | `D:\Repositories\starci-academy-backend` |
| Frontend | `D:\Repositories\nivo-fe` |
| Backend | `D:\Repositories\nivo-backend` |
| Approved revision | `nivo-agentos-solution-modules-r2` |
| Backend implementation | `8ae521ee225d5ec90abd4a1c41d11e14da445239` |
| FE implementation | `019947b` |
| Persona | `tester@nivo.local` |
| Workspace | `d44a8fed-6e31-4634-9dae-44dd00165f2d` |
| Runtime | Tino k3s namespace `nivo-d44a8fed-6e31-4634-9dae-44dd00165f2d` |

### LIVE FLOW PROOF

| Field | Evidence |
|---|---|
| Flow | Nivo UI install → GraphQL mutation → BullMQ Saga → signed controlplane pull/result → primary installation `ready` → outbox publish → Kafka consumer inbox relay → Socket.IO refresh → persisted detail page. |
| Persona | Logged in through the visible Nivo authentication form as the workspace owner test persona; the preceding Google session was rejected by the ownership check as expected. |
| Fixture reset | Deleted exactly two never-ready dev installation rows, `6f16ffb6-e85f-4783-8eaa-e1aa7a365928` and `9dd01cfe-87f8-403e-b6f6-3ab574a645c1`, after verifying both belonged to this workspace. Historical Saga and runtime-job rows were retained. |
| Chatbot UI | Clicked `Install solution` for `multichannel-chatbot`; installation `1cf175d6-b072-46dc-a548-545d017543d7` changed from `Provisioning` to `Ready` without a page reload. Detail rendered two generated agents, `nivo-common-1 · 1.0.0`, no failure code. |
| Sales UI | Clicked `Install solution` for `sales-copilot`; installation `e35407d4-a43a-4ddb-b6ab-ddb0d23cb642` changed from `Provisioning` to `Ready` after about two seconds. Detail rendered two generated agents, `nivo-common-1 · 1.0.0`, no failure code. |
| Persistence | Reloaded the workspace, reopened `Solutions → Installed`; both modules remained `Ready`. |
| Saga | Sagas `5281592e-41b7-4af3-b445-a326bf11c77e` and `9118e25c-d2d2-41d9-af07-1928566f4f58` are `completed`, `ever_ready=true`, cursor `6`; all 12 forward steps are `completed` with no `last_error`. |
| Runtime job | Installations reference runtime jobs `7ef48936-44e5-44f1-8252-f3744f441d0e` and `79d82ac1-5420-450e-b5b2-4fd5c781fb91`; both have non-null applied digests and no failure code. |
| Kafka / Socket.IO | Each Saga produced sequences 1–9. All 18 outbox rows are published with no error; all 18 inbox rows are consumed and relayed. The visible UI transition to `Ready` occurred before reload, then GraphQL snapshot preserved it after reload. |
| Kubernetes | AgentOS is `4/4 Running`; PostgreSQL, Qdrant, MinIO and the bounded embedding proof service are Running. |
| Network | Both install mutations returned accepted states; subsequent list/detail reads returned the exact installation IDs and `ready` status. Core terminal recorded both module queue jobs. No failed browser request surfaced in the tested module path. |
| Console | Browser warn/error log was empty after both installs and detail navigation. |
| Terminal | FE served every tested route with HTTP 200. Core enqueued both module jobs. Controlplane remained registered and accepted the runtime jobs. |
| Verdict | PASS for the real Chatbot and Sales install/Saga/Kafka/Socket/UI path on the dev Tino cluster. Production-image and embedding wiring debts below remain open and are not represented as completed source fixes. |

### OUTPUTS

| Concept | Result |
|---|---|
| Module Center | Both first-party solution packages can now be installed by the workspace owner and managed from Nivo. |
| Realtime | The installed list reflects terminal Saga status without manual reload. |
| Ownership | A different authenticated Google account cannot open the test workspace; the owner persona can. |
| Runtime evidence | The same desired/applied digest path produced generated agents and scoped common/private knowledge records for both packages. |

### CHANGES

| Tree | Details |
|---|---|
| Primary dev database | Removed exactly two stale, never-ready installation fixtures; created two new successful installation records through the product UI. The deleted primary rows are not recoverable, while their historical Saga/runtime evidence remains. |
| Tino dev namespace | Uses proof controlplane image `ghcr.io/starci-lab/nivo-agentos-controlplane:8ae521e-live3` and temporary `embedding-proof` Deployment/Service so the approved runtime path can be exercised. |
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-solution-modules.md` | Appended real browser, Saga, outbox/inbox, terminal and cluster evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | The approved live test is complete. Permanent runtime repairs must enter a new reviewed revision rather than expanding r2 silently. |

### WARNINGS

| Warning | Impact |
|---|---|
| `apps/agentos-controlplane/Dockerfile` at `8ae521e` does not copy `src/modules/bussiness/agentos-solution-modules`. | A normal source image build omits the approved module runtime. The live proof used an equivalent temporary build recipe; Dockerfile repair is still required. |
| `apps/agentos-controlplane/src/pod-runtime/transport.ts` truncates every successful HTTP body to 400 characters before `JSON.parse`. | Real runtime-job payloads fail parsing. The live proof image removes that truncation; committed source still needs a reviewed fix and regression spec. |
| The Helm chart does not wire `SELF_HOSTED_EMBEDDING_*`, and the reconciler does not ensure the Qdrant collection before writing. | The namespace currently depends on a deterministic 8-dimension `embedding-proof` service and a pre-created `knowledge` collection. This proves plumbing, not production embedding quality. |
| A prior terminally compensated module Saga has no supported late-success recovery path, and generic retry queue routing omits the module queue. | The two stale dev fixtures had to be replaced by fresh UI installs. A reviewed recovery operation is required before production. |
| Helm post-install CLI logged `n8n api key push refused: HTTP 401`. | Module installation passed because this path does not require n8n, but n8n one-click access remains unhealthy. |
| Workspace control-center reads logged `PodOpenclawClient` `TypeError` while probing the configured public OpenClaw `/health` URL. | The in-cluster AgentOS workload is healthy and module reconcile passed; public OpenClaw DNS/route health remains a separate launch-bridge debt. |
| Kafka consumer logged transient group rebalance warnings. | Both terminal events were nevertheless published, consumed and relayed exactly once by inbox identity; monitor consumer stability before production load. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Marking temporary image/env patches as committed production fixes | Record them as live-proof scaffolding and open a reviewed follow-up boundary | The approved r2 file tree did not include the Dockerfile, transport or Helm embedding wiring. |
| Rewriting compensated Saga history to look successful | Delete only the two failed dev installation fixtures and install fresh through the UI | Preserves audit history and proves the real customer path. |
| Claiming embedding quality PASS | Claim deterministic transport/reconciliation PASS only | The proof service returns deterministic vectors and is not a production embedding model. |

### OWED

| Owed | Cleared by |
|---|---|
| Permanent controlplane Dockerfile, response parser and Helm embedding wiring | New `$starci-be-feature-plan` or audit revision with exact Docker/chart/transport boundary, then Review/Apply. |
| Terminal compensated-Saga recovery and correct module retry routing | New backend feature revision with idempotent late-success/retry E2E. |
| Production embedding quality and Qdrant lifecycle | Configure a production embedding provider, ensure collection creation/migration and run curated retrieval cases. |
| n8n API-key push HTTP 401 | Repair the n8n adapter and rerun one-click launch proof. |
| Public OpenClaw `/health` route | Finish the approved FE+BE launch bridge/DNS route and rerun the control-center probe. |
