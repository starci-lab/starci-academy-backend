<!-- starci-workflow: v2 -->
## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\nivo-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | core / Nivo console |
| Database | primary PostgreSQL (`InjectPrimaryEntityManager`) |
| Repo / branch | D:\Repositories\nivo-backend @ main |
| Purpose | Bổ sung read model và operation boundary để FE xem/probe liên tục resource, render Helm stack và thao tác Update pod, downgrade, backup, reset/reprovision/rebuild an toàn. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\instance-lifecycle-operations.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; không viết backend production source. |

### SCHEMA AUDIT

Schema GraphQL live tại `http://127.0.0.1:3067/graphql` đã được introspect không lọc.

| Existing operation | Finding |
|---|---|
| `myInstances` | Có instance spine với `id`, `instanceId`, `appKey`, `detailId`, `name`, `plan`, `ram`, `vcpu`, `status`; chưa có Helm release/component/PVC/readiness/capability. |
| `resources` / `updateResource` | Là domain Resource riêng (`ResourceGraphQLType`), không phải lifecycle của `InstanceEntity`; không được dùng làm alias cho app runtime. |
| `manageAgentWorkspace` | Có action `suspend/resume/retryProvision` cho AgentOS workspace; giữ owner hiện tại, chỉ cần đưa capability/state vào read model nếu tương thích. |
| `upgradeCatalogTier` | Chỉ cho tier cao hơn và phát hành invoice proration; không phải downgrade và không phải pod update. |
| `deployExpertSite` / `provisionExpertSite` / `stopExpertSiteDeployment` | Expert-site-specific; publish durable owner hiện tại là `ExpertProvisionDispatcher`; không mở thêm đường dispatch thứ hai. |
| `/api/ops/lifecycle/reprovision`, `/rebuild`, `/wipe` | Operator-only HTTP, có guardrail/backup ladder; chưa phải customer GraphQL door. Không hạ quyền bằng cách gọi các endpoint này từ browser user. |
| Socket.IO `/provisioning` | Đã có `deployment.status` và `workspace.status` theo owner room; chưa có generic `instance.operation`/stack component delta. |

### SIBLING EVIDENCE

| Sibling | Shape mirrored |
|---|---|
| `src/features/core/api/core/graphql/queries/instances/my-instances/` | Query folder đầy đủ gồm query, handler, service, resolver, module, module-definition, GraphQL response và twin handler spec; đọc primary DB bằng `ICQRSHandler`. |
| `src/features/core/api/core/graphql/mutations/agent-workspace/manage-agent-workspace/` | GraphQL customer mutation với typed input/action enum, auth guard, response envelope, service và twin spec. |
| `src/features/core/api/core/graphql/mutations/catalog/upgrade-catalog-tier/` | Billing operation kiểm tra ownership/order/tier và từ chối target không hợp lệ; downgrade không được giả dạng upgrade. |
| `src/features/core/api/core/http/lifecycle/reprovision-instance/`, `rebuild-instance/`, `wipe-instance/` | CQRS command/handler/service/controller/module/type/twin; confirmation và backup semantics nằm ở handler/service hiện có. |
| `src/modules/bussiness/expert-deploy/expert-deploy-k8s-watcher.service.ts` | Đã đọc Deployment/Pod/Ingress từ K8s trong BE; đây là seam để mở rộng probe, không tạo client K8s ở FE. |
| `src/modules/platform/socketio/gateways/provisioning/` | Gateway nhận transition emitter và emit vào owner room; event payload phải có stable identity và không leak secret/raw Helm output. |

### PROPOSED CAPABILITY

Không tạo `TemplateAppEntity`. Resource identity vẫn là `InstanceEntity`, app identity là `ProvisionableAppEntity`, product detail là `ExpertSiteEntity` hoặc `AgentWorkspaceEntity`.

Luồng runtime dự kiến:

`K8s probe/watch → instance runtime snapshot (idempotent) → GraphQL query + Socket.IO delta → FE`

Luồng action dự kiến:

`customer GraphQL door → CQRS command → owner service/dispatcher → operation ledger → probe/watch → snapshot/event`

Database snapshot ưu tiên Bitnami legacy chỉ là chart/runtime metadata đã được backend project; không hardcode chart trong FE và không biến label Bitnami thành logic provisioning.

### FILE TREE

#### Runtime snapshot and probe

| Path | Holds / shape decision |
|---|---|
| `src/modules/platform/databases/postgresql/primary/entities/instance-runtime-snapshot.entity.ts` | One current projection per instance: observed time, release/chart identity, component readiness, storage/PVC summary, public-safe reason; entity explicitly names `instance_runtime_snapshots`. |
| `src/modules/platform/databases/postgresql/primary/migrations/1788xxxxxxxxxx-instance-runtime-snapshots.ts` | Primary migration for the projection table, owner/index/unique instance identity and timestamps. Exact timestamp must follow the live migration tail at Review. |
| `src/modules/platform/databases/postgresql/primary/primary.module.ts` | MODIFY: register entity and migration in the primary datasource, mirroring existing `ExpertDeploymentEntity` registration. |
| `src/modules/bussiness/instance-operations/types/runtime-snapshot.ts` | Named BE types for release, component, storage and public snapshot states; no `any`/inline destructured types. |
| `src/modules/bussiness/instance-operations/types/operation.ts` | Operation kind/state/capability unions and stable operation identity. |
| `src/modules/bussiness/instance-operations/instance-runtime-probe.service.ts` | K8s read-only probe for Deployment/StatefulSet/Pod/Ingress; reuses kubeconfig/config seam and returns public-safe typed observation. |
| `src/modules/bussiness/instance-operations/instance-runtime-probe.service.spec.ts` | Probe mapping, missing resources, stale observation, K8s error and secret-redaction twin. |
| `src/modules/bussiness/instance-operations/instance-runtime-snapshot.service.ts` | Idempotent upsert/recompute from authoritative K8s/entity state; duplicate watch delivery cannot increment counters. |
| `src/modules/bussiness/instance-operations/instance-runtime-snapshot.service.spec.ts` | Upsert convergence, duplicate observation, stale timestamp, deleted component and transaction manager boundary. |
| `src/modules/bussiness/instance-operations/instance-operations.module.ts` | Business wiring for probe/snapshot/operation owners; no GraphQL/controller import edge. |
| `src/modules/bussiness/instance-operations/instance-operations.module-definition.ts` | Module-definition boundary mirroring current business modules. |

#### Customer read doors

| Path | Holds / shape decision |
|---|---|
| `src/features/core/api/core/graphql/queries/instances/my-instance-operations/my-instance-operations.query.ts` | CQRS query message carrying authenticated user + instance id. |
| `src/features/core/api/core/graphql/queries/instances/my-instance-operations/my-instance-operations.handler.ts` | Ownership-scoped read of instance/app/active operation/capabilities/errors from primary DB; throws domain not-found/forbidden semantics. |
| `src/features/core/api/core/graphql/queries/instances/my-instance-operations/my-instance-operations.service.ts` | One-line query bus dispatch. |
| `src/features/core/api/core/graphql/queries/instances/my-instance-operations/my-instance-operations.resolver.ts` | Authenticated GraphQL query door; no K8s call and no business logic. |
| `src/features/core/api/core/graphql/queries/instances/my-instance-operations/graphql-types/input.ts` | `instanceId: ID!` only if resolver args require a named input; Review must mirror the sibling query convention. |
| `src/features/core/api/core/graphql/queries/instances/my-instance-operations/graphql-types/response.ts` | Envelope plus public operation snapshot, capability set and latest error. |
| `src/features/core/api/core/graphql/queries/instances/my-instance-operations/graphql-types/index.ts` | Explicit GraphQL type exports, matching sibling query folder. |
| `src/features/core/api/core/graphql/queries/instances/my-instance-operations/my-instance-operations.module.ts` | Resolver/service/handler registration. |
| `src/features/core/api/core/graphql/queries/instances/my-instance-operations/my-instance-operations.module-definition.ts` | Dynamic module definition. |
| `src/features/core/api/core/graphql/queries/instances/my-instance-operations/my-instance-operations.handler.spec.ts` | Query twin for ownership, empty/no operation, pending/running/ready/failed and stale snapshot. |
| `src/features/core/api/core/graphql/queries/instances/my-instance-helm-stack/my-instance-helm-stack.query.ts` | CQRS query message for one owned instance runtime projection. |
| `src/features/core/api/core/graphql/queries/instances/my-instance-helm-stack/my-instance-helm-stack.handler.ts` | Reads the current idempotent snapshot; never executes Helm or K8s from request path. |
| `src/features/core/api/core/graphql/queries/instances/my-instance-helm-stack/my-instance-helm-stack.service.ts` | One-line query dispatch. |
| `src/features/core/api/core/graphql/queries/instances/my-instance-helm-stack/my-instance-helm-stack.resolver.ts` | Authenticated query door. |
| `src/features/core/api/core/graphql/queries/instances/my-instance-helm-stack/graphql-types/response.ts` | Release/chart/components/storage/readiness public projection; raw namespace/secrets/output excluded. |
| `src/features/core/api/core/graphql/queries/instances/my-instance-helm-stack/graphql-types/index.ts` | Explicit GraphQL type exports. |
| `src/features/core/api/core/graphql/queries/instances/my-instance-helm-stack/my-instance-helm-stack.module.ts` | Query wiring. |
| `src/features/core/api/core/graphql/queries/instances/my-instance-helm-stack/my-instance-helm-stack.module-definition.ts` | Query module definition. |
| `src/features/core/api/core/graphql/queries/instances/my-instance-helm-stack/my-instance-helm-stack.handler.spec.ts` | Query twin for missing snapshot, empty components/storage, owner boundary and failed observation. |

#### Customer action doors

| Path | Holds / shape decision |
|---|---|
| `src/features/core/api/core/graphql/mutations/instances/update-instance-pod/` (command, handler, service, resolver, module, module-definition, GraphQL input/response/index, handler spec) | One operation for chart/image/value update with explicit target and no scale side effect; delegates to the durable owner for the app. |
| `src/features/core/api/core/graphql/mutations/instances/request-instance-plan-change/` (same CQRS/GraphQL file family + handler spec) | Separate upgrade/downgrade billing/plan semantics; reuses catalog tier validation and does not call pod Helm directly. |
| `src/features/core/api/core/graphql/mutations/instances/request-instance-backup/` (same CQRS/GraphQL file family + handler spec) | Snapshot request with artifact ledger/verification state; no destructive action is allowed to skip this owner. |
| `src/features/core/api/core/graphql/mutations/instances/request-instance-recovery/` (same CQRS/GraphQL file family + handler spec) | Customer-safe recovery action mapping to reprovision/rebuild only when capability + verified backup + explicit acknowledgement pass; wipe remains operator-only unless separately approved. |
| `src/modules/bussiness/instance-operations/instance-operation-dispatcher.ts` | Idempotency/concurrency fence and owner routing; one active operation per instance, stable operation id, no duplicate queue job. |
| `src/modules/bussiness/instance-operations/instance-operation-dispatcher.spec.ts` | Duplicate request, concurrent writer, already-running, unsupported app, action mismatch and owner routing matrix. |

#### Realtime transport

| Path | Holds / shape decision |
|---|---|
| `src/modules/bussiness/provisioning-events/types.ts` | MODIFY: add generic instance-operation/runtime-observation identity without changing existing deployment/workspace event meanings. |
| `src/modules/platform/socketio/gateways/provisioning/enums.ts` | MODIFY: add `instance.operation` or a source-backed event name only after naming review. |
| `src/modules/platform/socketio/gateways/provisioning/types/message.ts` | MODIFY: typed public-safe payload with `operationId`, `instanceId`, `phase`, `componentKey?`, `observedAt`, `reason?`. |
| `src/modules/platform/socketio/gateways/provisioning/provisioning.gateway.ts` | MODIFY: relay instance transitions to the authenticated owner room, preserving existing deployment/workspace branches. |
| `src/modules/platform/socketio/gateways/provisioning/provisioning.gateway.spec.ts` | Extend twin for matching owner, wrong owner, duplicate event, deployment/workspace compatibility and generic instance event. |
| `src/modules/bussiness/instance-operations/instance-runtime-watch.service.ts` | Watch/poll K8s observations asynchronously, persist snapshot, emit transition only when public state changes; no event delta arithmetic. |
| `src/modules/bussiness/instance-operations/instance-runtime-watch.service.spec.ts` | Transition de-duplication, reconnect/retry, timeout, K8s unavailable, ready/failed and stale watch cases. |

#### Composition and end-to-end proof

| Path | Holds / shape decision |
|---|---|
| Existing core composition root identified by `nest-cli.json`/core app module | MODIFY only after Review identifies the exact root file; register capability there, never from a sibling feature module. |
| `src/tests/e2e/nivo/instance-lifecycle-operations.e2e-spec.ts` | Authenticated GraphQL flow: query snapshot → request operation → query pending → transition → query ready/failed; proves owner isolation and one operation. |
| `src/tests/e2e/nivo/instance-lifecycle-operations.live-spec.ts` | Real local K8s/Helm proof for one Template App instance; captures snapshot and Socket.IO event with stable ids. |
| `src/tests/e2e/nivo/instance-lifecycle-operations.k8s-spec.ts` | Read-only K8s probe mapping against local kubeconfig; no secrets in output. |

### TEST MATRIX

| Area | Cases to enumerate before branches exist |
|---|---|
| Ownership | own instance, foreign instance, missing id, orphan site/workspace, app registry missing. |
| Snapshot | no snapshot, empty components, all components ready, one not ready, failed probe, stale timestamp, repeated identical observation. |
| Helm projection | web/api/worker Deployment, PostgreSQL/Redis Bitnami StatefulSet, ingress, PVC present/missing, scale-ready metadata, raw secret/output redaction. |
| Update pod | valid target, invalid chart/image, unsupported app, active operation, duplicate request, concurrent request, failed Helm, watch timeout, ready transition. |
| Plan change | higher tier, lower tier, same tier, cross-item tier, unpaid/active/cancelled order, duplicate invoice, ownership refusal. |
| Backup | backup success, artifact absent, checksum mismatch, unverified result, duplicate backup, storage unavailable, backup already running. |
| Recovery | reprovision with verified backup, rebuild acknowledgement mismatch, no verified backup, foreign instance, already recovering, wipe remains operator-only. |
| Realtime | matching owner room, wrong owner ignored, matching operation id, stale event ignored, duplicate event idempotent, reconnect snapshot convergence, deployment/workspace events unchanged. |
| Product registry | `agentos`, `ai_academy`, `mmo`, unsupported/non-provisionable app, null chartRef, Bitnami legacy chart metadata. |
| Transport | GraphQL HTTP 200 success envelope, domain exception envelope, Socket.IO subscribe/auth failure, terminal/log redaction. |
| Flow | tester sign-in → open resource → inspect stack → update pod → watch pending/running/ready or honest failed → retry/reconcile; separate downgrade/backup/recovery branches. |

### BOUNDARY AND EXCLUSIONS

| Boundary | Decision |
|---|---|
| AgentOS | Reuse `manageAgentWorkspace` semantics where they match; do not replace workspace status with instance status without a mapping proof. |
| ExpertSite publish | Existing durable `publishExpertSite → ExpertProvisionDispatcher` remains sole creation/provision owner. |
| Wipe VPS | Keep platform-operator HTTP boundary in this revision; customer-facing wipe needs separate destructive approval. |
| Backup bytes | Existing `BackupService`, artifact store and verification rules remain owners; new door must call them, not duplicate snapshots. |
| K8s mutation | Helm/subprocess/worker remains BE-only; read probe uses existing K8s watcher/client seam. |
| FE | No frontend source, no GraphQL client source, no fake fixtures in this Plan. |

### OUTPUTS

| Concept | Result |
|---|---|
| Backend capability brief | Đã định nghĩa owner cho runtime snapshot/probe, customer read doors, action doors và Socket.IO delta. |
| Data model | `InstanceEntity` là spine; `ProvisionableAppEntity` định danh app; runtime snapshot là projection idempotent, không phải TemplateAppEntity. |
| Product safety | Update pod, plan change, backup và recovery được tách semantics; wipe chưa hạ từ operator-only. |
| Test contract | Đã liệt kê branch, boundary, concurrency, ownership, K8s/Helm và live transport cases trước khi code tồn tại. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\instance-lifecycle-operations.md` | `added` — BE Feature Plan; không sửa product source. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Customer action boundary | **Approve four separate customer doors: Update pod, Plan change, Backup, Recovery; keep Wipe operator-only** (khuyến nghị); hoặc dùng một generic `manageInstanceOperation` door, hoặc chỉ làm read/probe trước. |
| Runtime snapshot persistence | **Persist one idempotent current snapshot per instance** (khuyến nghị cho re-entry/Socket reconnect); hoặc probe K8s on-demand trong mỗi query và không lưu projection. |
| Chart compatibility | **Record Bitnami legacy as chart metadata/capability and preserve PVC/release identity**; không đổi chart trong feature này. |

### WARNINGS

| Warning | Impact |
|---|---|
| Live schema chưa có generic instance operation/Helm stack fields. | FE Apply không thể bắt đầu trước khi BE contract được Review/Apply. |
| `upgradeCatalogTier` hiện chỉ cho higher tier và billing invoice. | Không gọi nó là downgrade; plan change cần thêm semantics/operation hoặc explicit refusal. |
| Operator HTTP recovery hiện nhận body + platform role. | Expose nó cho customer GraphQL mà không thiết kế lại ownership/acknowledgement sẽ là privilege escalation. |
| K8s watcher hiện chủ yếu settles `ExpertDeployment`. | Generic MMO/AgentOS component snapshots cần mapping app/chart rõ ràng; không copy expert-specific constants. |
| Workflow validator có lỗi lịch sử ngoài scope. | Review chỉ nên đánh giá record mới và ghi rõ legacy findings. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| FE gọi K8s/Helm trực tiếp | BE probe/watch rồi project | Credential, ownership và lifecycle truth không được đưa ra browser. |
| Một mutation tự switch mọi action nhưng không có ledger/guard | Bốn operation doors có owner/guard riêng | Backup, billing, pod update và recovery có side effects/acknowledgement khác nhau. |
| Dùng `resources`/`ResourceGraphQLType` làm instance runtime | Query mới theo `InstanceEntity` | `Resource` là domain khác, có `resourceId`/capacity/service windows và không chứa Helm stack. |
| Dùng raw Helm output làm FE contract | Public-safe projection | Tránh leak secret/namespace/tool internals và giữ schema ổn định. |

### OWED

| Owed | Cleared by |
|---|---|
| User approval cho action boundary + snapshot persistence | Chọn một revision trong `$starci-be-feature-review`. |
| Exact migration timestamp/composition root | BE Review đọc live migration tail và core composition root. |
| Backend schema proof | Apply chạy schema introspection, twin specs, e2e flow và live K8s/Socket proof. |

Invite: `$starci-be-feature-review`

## review

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\nivo-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | core / Nivo console |
| Database | primary PostgreSQL (`InjectPrimaryEntityManager`) |
| Repo / branch | D:\Repositories\nivo-backend @ main |
| Purpose | Review và freeze runtime snapshot, Helm projection, four customer operation doors và Socket.IO transport. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\instance-lifecycle-operations.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; không viết production source. |

### REVIEW DECISIONS

| Decision | Frozen result |
|---|---|
| Action boundary | Bốn door riêng: `updateInstancePod`, `requestInstancePlanChange`, `requestInstanceBackup`, `requestInstanceRecovery`. Wipe vẫn operator-only HTTP. |
| Snapshot | Persist một current snapshot/idempotent per `InstanceEntity` ở primary PostgreSQL; query không probe K8s đồng bộ. |
| Probe owner | `InstanceRuntimeWatchService`/`InstanceRuntimeProbeService` ở business layer; đọc Deployment/StatefulSet/Pod/Ingress, không tạo Helm mutation path mới. |
| Chart policy | `ProvisionableAppEntity.chartRef/chartVersion` là source; Bitnami legacy chỉ là metadata/capability, PVC/release identity được giữ. |
| Event policy | Generic instance operation event mở rộng `ProvisioningTransitionEmitter` và owner room; event payload public-safe, idempotent theo operation/observedAt. |
| Module wiring | `InstanceOperationsModule` là `@Global` business capability, đăng ký tại `apps/core/src/app.module.ts`; feature folders không import sideways module. |
| Approved revision | `nivo-instance-lifecycle-operations-persisted-snapshot-r1` |

### EXACT PRODUCTION FILE TREE

All paths below are the approved Apply boundary; no wildcard and no additional file may be added without returning to Review.

| Area | Exact files |
|---|---|
| Persistence | `src/modules/platform/databases/postgresql/primary/entities/instance-runtime-snapshot.entity.ts`; `src/modules/platform/databases/postgresql/primary/migrations/1787616000000-instance-runtime-snapshots.ts`; `src/modules/platform/databases/postgresql/primary/primary.module.ts` |
| Business types/probe | `src/modules/bussiness/instance-operations/types/runtime-snapshot.ts`; `src/modules/bussiness/instance-operations/types/operation.ts`; `src/modules/bussiness/instance-operations/instance-runtime-probe.service.ts`; `src/modules/bussiness/instance-operations/instance-runtime-probe.service.spec.ts`; `src/modules/bussiness/instance-operations/instance-runtime-snapshot.service.ts`; `src/modules/bussiness/instance-operations/instance-runtime-snapshot.service.spec.ts`; `src/modules/bussiness/instance-operations/instance-runtime-watch.service.ts`; `src/modules/bussiness/instance-operations/instance-runtime-watch.service.spec.ts`; `src/modules/bussiness/instance-operations/instance-operation-dispatcher.ts`; `src/modules/bussiness/instance-operations/instance-operation-dispatcher.spec.ts`; `src/modules/bussiness/instance-operations/instance-operations.module.ts`; `src/modules/bussiness/instance-operations/instance-operations.module-definition.ts` |
| Exceptions | `src/modules/platform/exceptions/errors/instance-operations/instance-operation-not-found.ts`; `src/modules/platform/exceptions/errors/instance-operations/instance-operation-already-running.ts`; `src/modules/platform/exceptions/errors/instance-operations/instance-operation-not-permitted.ts`; `src/modules/platform/exceptions/errors/instance-operations/instance-operation-confirmation-mismatch.ts`; `src/modules/platform/exceptions/errors/instance-operations/instance-runtime-snapshot-unavailable.ts`; `src/modules/platform/exceptions/errors/instance-operations/instance-operation-target-invalid.ts` |
| Customer query: operations | `src/features/core/api/core/graphql/queries/instances/my-instance-operations/index.ts`; `my-instance-operations.query.ts`; `my-instance-operations.handler.ts`; `my-instance-operations.handler.spec.ts`; `my-instance-operations.service.ts`; `my-instance-operations.resolver.ts`; `my-instance-operations.module.ts`; `my-instance-operations.module-definition.ts`; `graphql-types/index.ts`; `graphql-types/response.ts` |
| Customer query: Helm | `src/features/core/api/core/graphql/queries/instances/my-instance-helm-stack/index.ts`; `my-instance-helm-stack.query.ts`; `my-instance-helm-stack.handler.ts`; `my-instance-helm-stack.handler.spec.ts`; `my-instance-helm-stack.service.ts`; `my-instance-helm-stack.resolver.ts`; `my-instance-helm-stack.module.ts`; `my-instance-helm-stack.module-definition.ts`; `graphql-types/index.ts`; `graphql-types/response.ts` |
| Mutation: pod | `src/features/core/api/core/graphql/mutations/instances/update-instance-pod/index.ts`; `update-instance-pod.command.ts`; `update-instance-pod.handler.ts`; `update-instance-pod.handler.spec.ts`; `update-instance-pod.service.ts`; `update-instance-pod.resolver.ts`; `update-instance-pod.module.ts`; `update-instance-pod.module-definition.ts`; `graphql-types/index.ts`; `graphql-types/input.ts`; `graphql-types/response.ts`; `types/index.ts`; `types/update-instance-pod.ts` |
| Mutation: plan | `src/features/core/api/core/graphql/mutations/instances/request-instance-plan-change/index.ts`; `request-instance-plan-change.command.ts`; `request-instance-plan-change.handler.ts`; `request-instance-plan-change.handler.spec.ts`; `request-instance-plan-change.service.ts`; `request-instance-plan-change.resolver.ts`; `request-instance-plan-change.module.ts`; `request-instance-plan-change.module-definition.ts`; `graphql-types/index.ts`; `graphql-types/input.ts`; `graphql-types/response.ts`; `types/index.ts`; `types/request-instance-plan-change.ts` |
| Mutation: backup | `src/features/core/api/core/graphql/mutations/instances/request-instance-backup/index.ts`; `request-instance-backup.command.ts`; `request-instance-backup.handler.ts`; `request-instance-backup.handler.spec.ts`; `request-instance-backup.service.ts`; `request-instance-backup.resolver.ts`; `request-instance-backup.module.ts`; `request-instance-backup.module-definition.ts`; `graphql-types/index.ts`; `graphql-types/input.ts`; `graphql-types/response.ts`; `types/index.ts`; `types/request-instance-backup.ts` |
| Mutation: recovery | `src/features/core/api/core/graphql/mutations/instances/request-instance-recovery/index.ts`; `request-instance-recovery.command.ts`; `request-instance-recovery.handler.ts`; `request-instance-recovery.handler.spec.ts`; `request-instance-recovery.service.ts`; `request-instance-recovery.resolver.ts`; `request-instance-recovery.module.ts`; `request-instance-recovery.module-definition.ts`; `graphql-types/index.ts`; `graphql-types/input.ts`; `graphql-types/response.ts`; `types/index.ts`; `types/request-instance-recovery.ts` |
| Realtime | `src/modules/bussiness/provisioning-events/types.ts`; `src/modules/platform/socketio/gateways/provisioning/enums.ts`; `src/modules/platform/socketio/gateways/provisioning/types/message.ts`; `src/modules/platform/socketio/gateways/provisioning/provisioning.gateway.ts`; `src/modules/platform/socketio/gateways/provisioning/provisioning.gateway.spec.ts` |
| Composition | `apps/core/src/app.module.ts` |
| E2E/live | `src/tests/e2e/nivo/instance-lifecycle-operations.e2e-spec.ts`; `src/tests/e2e/nivo/instance-lifecycle-operations.live-spec.ts`; `src/tests/e2e/nivo/instance-lifecycle-operations.k8s-spec.ts` |

### CONTRACTS

| Contract | Frozen shape |
|---|---|
| `myInstanceOperations(instanceId: ID!)` | `instanceId`, `appKey`, `status`, `capabilities[]`, `activeOperation`, `lastError`, `observedAt`; ownership-scoped and envelope-wrapped. |
| `myInstanceHelmStack(instanceId: ID!)` | `releaseName`, `chartName`, `chartVersion`, `components[]`, `storage[]`, `observedAt`; no raw namespace, secret, kubeconfig or Helm output. |
| Component | `key`, `kind`, `status`, `desiredReplicas`, `readyReplicas`, `image`, `pvcSize`, `storagePolicy`. |
| Operation | `id`, `instanceId`, `kind`, `phase`, `requestedAt`, `updatedAt`, `reason`, `targetSummary`. |
| `updateInstancePod` | `instanceId`, explicit target chart/image/value input; returns accepted operation identity, never synchronous Ready. |
| `requestInstancePlanChange` | owned catalog order + target tier; higher/lower tier semantics explicit; billing remains source of truth. |
| `requestInstanceBackup` | instance identity + reason/ack where required; returns operation/backup identity and verification phase. |
| `requestInstanceRecovery` | instance identity + `reprovision|rebuild`, explicit acknowledgement, verified-backup gate; no wipe action. |
| Socket event | `instance.operation` with `operationId`, `instanceId`, `phase`, optional `componentKey`, `observedAt`, optional public-safe `reason`. |

### TEST MATRIX REVIEW

The Plan matrix is accepted and frozen. In addition, each new handler must prove the exact result/error identity, ownership and concurrent second writer; each query must prove primary datasource and snapshot staleness; the live flow must enter through authenticated GraphQL and real `/provisioning` Socket.IO, not direct service calls.

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User approved the recommended revision: four separate doors, persisted snapshot, BE-owned K8s probe/watch and operator-only wipe. |

### WARNINGS

| Warning | Impact |
|---|---|
| The current live schema has none of the four new customer operation fields. | Apply must create the exact tree above; FE cannot be wired before GraphQL introspection proves it. |
| `1787616000000` is the next planned migration slot after the current live tail. | Apply must re-check the migration tail before writing; a collision returns to Review. |
| K8s component mapping is app/chart dependent. | `agentos`, `ai_academy` and `mmo` must each either provide a chart mapping or return a typed unavailable state; no guessed component list. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| One generic `manageInstanceOperation` mutation | Four separate doors | Different billing, backup, pod and recovery semantics need different guards and result types. |
| Customer-facing `wipeInstance` | Keep `/api/ops/lifecycle/wipe` operator-only | Wipe destroys release/storage and requires platform attribution. |
| On-demand K8s probe inside GraphQL resolver | Async watcher + persisted snapshot | A query must be bounded and re-entry must not depend on a multi-minute Helm/K8s read. |
| Raw Bitnami/Helm internals in GraphQL | Public-safe projection | Prevent secret/infrastructure leakage and keep FE contract stable. |

### OWED

| Owed | Cleared by |
|---|---|
| Exact app-specific chart component mapping | Apply fixture/live K8s inspection for `agentos`, `ai_academy`, `mmo`; unavailable state is required when chart does not expose it. |
| Live K8s/Socket proof | Run the three approved E2E/live specs with worker and local kubeconfig enabled. |
| Baseline and source writes | `$starci-be-feature-apply` after this approved revision. |

Approved revision: `nivo-instance-lifecycle-operations-persisted-snapshot-r1`

### OUTPUTS

| Concept | Result |
|---|---|
| Approved capability | Customer-visible lifecycle operations backed by an idempotent instance runtime snapshot. |
| Approved architecture | `InstanceEntity → runtime snapshot → GraphQL/Socket.IO`; K8s and Helm remain BE-owned. |
| Approved operation boundary | Pod update, plan change, backup and recovery are separate; wipe remains operator-only. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\instance-lifecycle-operations.md` | `modified` — appended Review r1; no production source changed. |

Invite: `$starci-be-feature-apply`

## APPLY — 2026-08-15

### CONTEXT

| Field | Value |
|---|---|
| Source | `D:\Repositories\starci-academy-backend` |
| Project | `nivo` |
| Frontend | `D:\Repositories\nivo-fe` |
| Backend | `D:\Repositories\nivo-backend` |
| App | `core` |
| Approved revision | `nivo-instance-lifecycle-operations-persisted-snapshot-r1` |
| Baseline | `7c93da9 chore: baseline instance lifecycle operations boundary` (empty baseline because the worktree already contained unrelated user changes) |

### IMPLEMENTED

- Added the idempotent `instance_runtime_snapshots` entity, migration and primary datasource registration.
- Added public-safe K8s deployment/PVC probe and snapshot refresh service, registered in the core composition root.
- Added the `instance.operation` Socket.IO event shape and relay branch alongside existing deployment/workspace events.

### VERIFICATION

| Check | Result |
|---|---|
| `npm run build` in `D:\Repositories\nivo-backend` | PASS |
| Migration slot check | PASS; `1787616000000` was the next planned slot when written |
| Raw Helm/secrets in public event payload | PASS; payload is operation/instance/phase/reason/observedAt only |
| GraphQL customer doors and live authenticated flow | OWED; remaining approved exact tree is not yet implemented |
| Live K8s + Socket.IO proof | OWED; no honest PASS claimed without the GraphQL doors and operation dispatcher |

### VERDICT

PARTIAL APPLY. The runtime snapshot/probe/realtime foundation builds successfully. The feature is not complete and must not be presented as approved end-to-end until the four GraphQL mutations, two queries, dispatcher, tests and live proof are implemented.

### E2E RUN — 2026-08-15

| Command | Result |
|---|---|
| `npm run test:e2e:nivo -- --testPathPattern "(instance-operations|instance-provision|instance-wipe-recovery-ladder)"` | FAIL/INTERRUPTED; Jest option matched the broad Nivo suite rather than only the requested files, and the run exposed existing environment/runtime failures. |
| App boot | Started, then later suites hit `MissingDriverError: Wrong driver: "undefined"` while TypeORM retried primary DB connection. |
| Existing E2E failures observed | Payment gateway env unset; `N8nProvisionService` absent in wipe suite; GraphQL error extensions missing in several assertions; AgentOS provision could not create wallet top-up pay link. |
| New instance lifecycle GraphQL/Socket flow | NOT RUN; the approved customer doors and operation dispatcher are still absent. |

### E2E VERDICT

NO PASS. The current repository cannot claim full E2E for this feature. The captured failures are recorded as evidence, not waived.

### TARGETED E2E PROOF

`npx jest --config src/tests/e2e/jest-e2e.js --runInBand --runTestsByPath src/tests/e2e/nivo/instance-operations.e2e-spec.ts src/tests/e2e/nivo/instance-provision.e2e-spec.ts`

- `instance-operations.e2e-spec.ts`: **PASS**, 13 passed, 1 skipped.
- `instance-provision.e2e-spec.ts`: **FAIL**, AgentOS flow could not create the wallet top-up pay link because payment gateway configuration was undefined.
- New approved lifecycle GraphQL doors and `instance.operation` authenticated flow: **NOT PRESENT**, therefore no full-feature PASS.
