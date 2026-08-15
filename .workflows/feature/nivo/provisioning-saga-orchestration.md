<!-- starci-workflow: v2 -->

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo — Nest application `core` trong `nest-cli.json` |
| Database | primary PostgreSQL qua `InjectPrimaryEntityManager`; Redis/BullMQ chỉ là dispatcher |
| Repo / branch | `D:\Repositories\nivo-backend @ main`, HEAD `e58eb909a1cfe9b30c031d7e074704111edaf969`; worktree đang có nhiều thay đổi của người dùng và phải được giữ nguyên |
| Purpose | Thiết kế durable Saga orchestration cho hai definition độc lập: AgentOS và TemplateApp-backed provisioning (Expert/MMO), có compensation, retry, fencing và realtime outbox. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\provisioning-saga-orchestration.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; không sửa source backend, frontend, chart hay runtime trong Plan. |

### OBJECTIVE

Giữ nguyên production entry hiện tại:

- AgentOS: `orderCatalogItem -> payInvoice -> CatalogFulfillmentDispatcher -> AgentosProvisionDispatcher`.
- Template App: `provisionExpertSite -> ExpertProvisionDispatcher`; Expert và MMO là definition của `TemplateAppEntity`/`ProvisionableAppEntity`, không phải biến thể của AgentOS.

Sau dispatch, mỗi lần provision trở thành một durable Saga có definition version cố định, forward steps idempotent, compensation chạy ngược thứ tự và retry không làm lặp external side effect. Mọi state transition được commit cùng durable outbox, publisher chuyển nó lên Kafka, consumer group của Nivo validate/dedupe rồi mới relay Socket.IO cho FE; không có DB/Kafka dual-write và FE không kết nối thẳng Kafka.

### LIVE SCHEMA EVIDENCE

| Evidence | Result |
|---|---|
| Endpoint | Unfiltered introspection tại `http://localhost:3067/graphql` thành công. |
| Existing customer mutations | Có `orderCatalogItem`, `payInvoice`, `provisionExpertSite`, `deployExpertSite`, `manageAgentWorkspace`, `stopExpertSiteDeployment`; không có generic provisioning-Saga mutation. |
| Existing customer queries | Có `myAgentWorkspace`, `myCatalogOrders`, `myExpertSiteDeployment`, `myExpertSites`; chưa có durable step/compensation projection. |
| Existing realtime transport | Không có GraphQL subscription; progression đi qua Socket.IO namespace `/provisioning`. |
| Transport verdict | Không thêm mutation để bắt đầu provision. Thêm owner-scoped query `myProvisioningSaga` và mutation `retryProvisioningSaga`/`cancelProvisioningSaga` để UI đọc, retry và cancel đúng durable run. |

### SOURCE AND SIBLING EVIDENCE

| Exact source | Finding |
|---|---|
| `src/modules/bussiness/jobs/runner/job-step-runner.service.ts` | Đã có claim, monotonic fencing token, re-read sau mỗi step và quiet exit khi fenced out; đây là nền đúng để mở rộng, không thay bằng `@nestjs/cqrs` `@Saga()`. |
| `src/modules/platform/databases/postgresql/primary/entities/job.entity.ts` | `jobs` là queue ledger, có `currentStep`, `maxSteps`, `executionResults`, attempts và fence; chưa biểu diễn reverse cursor hay từng compensation attempt. |
| `src/modules/bussiness/agentos-provision/provision-step-map.service.ts` | Forward definition hiện tại: reserve capacity -> mint bootstrap -> Helm install -> record outcome. |
| `src/modules/bussiness/expert-provision/provision-step-map.service.ts` | Forward definition hiện tại: mint secrets/model key -> Helm install -> bootstrap tenant Keycloak -> record outcome. |
| `src/modules/bussiness/agentos-provision/provision-agentos.worker.ts` | Catch hiện đánh workspace/instance failed, release reservation và emit trực tiếp; Helm release, bootstrap credential và namespace không được bù trừ. |
| `src/modules/bussiness/expert-provision/provision-expert-site.worker.ts` | Catch chỉ ghi failure lên site/deployment rồi để BullMQ retry; secret, OpenRouter key, Helm release và Keycloak state không có compensation journal. |
| `src/modules/bussiness/provisioning-events/provisioning-transition.emitter.ts` | `EventEmitter` chỉ sống trong process; DB commit và socket emit không atomic. Live proof đã thấy DB terminal `failed` nhưng browser không nhận đến khi reload. |
| `src/modules/bussiness/instance-lifecycle/instance-release-destroyer.service.ts` | Đã có sibling cho `helm uninstall` và explicit PVC delete; Saga phải dùng capability qua port ở composition root, không copy shell logic vào step. |
| `src/modules/integrations/openrouter-keys/openrouter-key.service.ts` | Đã có `setDisabled` và `destroy`; compensation phải reconcile usage trước, sau đó revoke/destroy theo policy được duyệt. |
| `src/modules/bussiness/cluster-capacity/cluster-capacity-reservation.service.ts` | Reservation có idempotent instance key và `release`; shared Tino node lifecycle không được compensation bởi một product Saga riêng lẻ. |
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace` | Query sibling dùng Query/Handler/CQRS và owner scope trong DB query; query Saga mới mirror family này. |
| `src/features/core/api/core/graphql/mutations/expert-sites/provision-expert-site` | Mutation sibling giữ authorization/guard ở transport slice và gọi capability; retry/cancel Saga mirror boundary này, không chứa orchestration trong service/resolver. |

### ARCHITECTURE CONCEPT

| Concept | Design |
|---|---|
| Queue ownership | `JobEntity` tiếp tục là BullMQ dispatch ledger và fencing owner. Không tạo queue engine mới, không dùng Nest `@Saga()` event choreography. |
| Saga ownership | Thêm `ProvisioningSagaEntity` 1:1 với `jobs.id` để giữ definition key/version, resource identity, direction, terminal state, forward/compensation cursor và public failure code. |
| Step journal | Thêm `ProvisioningSagaStepEntity` unique `(saga_id, step_key)` để giữ forward state/result/error và compensation state/result/error. Không dùng một JSON blob làm audit trail. |
| Definition contract | `AbstractProvisioningSagaStep` có stable `stepKey`, `forward`, optional `compensate`; mỗi definition cung cấp ordered immutable list và version. Step được re-run phải idempotent theo key `<sagaId>:<stepKey>:forward|compensate`. |
| Failure classification | Retryable failure giữ direction `forward` và để BullMQ retry. Permanent failure hoặc hết attempt budget atomically chuyển Saga sang `compensating`; runner chỉ chạy reverse từ những step đã `completed`. |
| Compensation failure | Saga dừng ở `compensation_failed`; requeue tiếp tục đúng compensation cursor, không quay lại forward. Chỉ sau `compensated` mới cho phép một fresh provisioning Saga mới. |
| Cancel | Owner cancel chỉ được chấp nhận trước terminal Ready/Active; nó fence worker hiện tại, chuyển sang compensation và enqueue cùng job id. |
| Realtime | Mỗi Saga/domain transition ghi `ProvisioningOutboxEntity` trong cùng PostgreSQL transaction. Outbox publisher gửi Kafka topic `nivo.provisioning.lifecycle.v1`; Nivo consumer group `nivo-provisioning-realtime-v1` validate schema, ghi inbox idempotency rồi relay local transition tới owner-scoped Socket.IO. FE vẫn reload/query canonical Saga khi socket trễ. |
| Capacity | Product Saga chỉ release reservation của chính instance. Tino node add/remove thuộc capacity controller; một Saga thất bại không được xóa shared node. Scale-in chỉ xảy ra sau zero reservation + drain/PVC gates. |
| Product boundaries | AgentOS và TemplateApp dùng chung runner/journal/outbox nhưng có hai definition/step map riêng. Expert/MMO dùng TemplateApp definition/config; AgentOS không xuất hiện như Template App. |

### KAFKA EVENT CONTRACT

| Field | Decision |
|---|---|
| Topic | `nivo.provisioning.lifecycle.v1`; version nằm cả trong topic và envelope để consumer từ chối shape lạ. |
| Partition key | `sagaId`, giữ thứ tự transition của một Saga; không key theo owner vì nhiều Saga của một owner được phép tiến song song. |
| Envelope | `eventId`, `schemaVersion`, `occurredAt`, `sagaId`, `definitionKey`, `resourceKind`, `resourceId`, `ownerId`, `status`, `direction`, `stepKey`, sanitized `reason`, `sequence`. Không có secret, token, raw upstream body hay stack trace. |
| Delivery | At-least-once. Producer đánh outbox `publishedAt` sau broker ack; consumer ghi unique `eventId` vào inbox trước relay. Duplicate Kafka delivery là no-op. |
| Ordering | Consumer chỉ apply `sequence` lớn hơn projection hiện tại; out-of-order/duplicate không làm FE lùi journey. |
| Consumer failure | Không commit Kafka offset nếu validate/persist/relay preparation lỗi. Poison schema đi dead-letter topic `nivo.provisioning.lifecycle.dlq.v1` với sanitized metadata, không retry vô hạn. |
| Socket compatibility | Consumer map canonical Saga event về existing `workspace.status`/`deployment.status`, đồng thời phát `provisioning.saga.status` cho journey chi tiết. FE reducer dedupe bằng `eventId` và ignore lower `sequence`. |

### STATE MACHINE

| Current | Trigger | Next | Durable action |
|---|---|---|---|
| `queued` | worker claim | `running_forward` | Bump job fence; emit outbox snapshot. |
| `running_forward` | step completed | `running_forward` hoặc `completed` | Commit step journal + cursor + domain write + outbox trong một DB transaction. |
| `running_forward` | retryable error, budget còn | `waiting_retry` | Persist sanitized error; BullMQ backoff; không compensate. |
| `waiting_retry` | new claim | `running_forward` | Re-run đúng incomplete step bằng idempotency key. |
| `running_forward` | permanent error / exhausted | `compensating` | Freeze original failure; compensation cursor = last completed compensable step. |
| `running_forward` / `waiting_retry` | accepted cancel | `compensating` | Fence current owner; enqueue compensation. |
| `compensating` | compensation completed | `compensating` hoặc `compensated` | Commit reverse step + outbox; never return to forward. |
| `compensating` | compensation error | `compensation_failed` | Keep exact reverse cursor and sanitized operator evidence. |
| `completed` | any retry/cancel | refused | Terminal Ready/Active is managed by lifecycle operations, not provisioning Saga. |
| `compensated` | new provision request | new Saga id | Historical run remains immutable. |

### COMPENSATION MAP

| Definition / forward step | Compensation | Notes |
|---|---|---|
| AgentOS `reserve-capacity` | Release only this instance reservation as failed/cancelled. | Never delete a Tino node here. |
| AgentOS `mint-bootstrap` | Revoke pod registrations and delete encrypted bootstrap credential row created by this Saga. | Journal must prove ownership before delete; pre-existing credential is retained. |
| AgentOS `install-chart` | Helm uninstall, then delete PVCs/namespace only under the approved pre-Ready policy. | Idempotent `not found` is success. |
| AgentOS `record-outcome` | None. | Terminal projection step; must not be marked completed before K8s Ready. |
| TemplateApp `mint-secrets` | Reconcile final OpenRouter usage, destroy Saga-owned key, delete its ledger/raw secret and locally minted provision secrets. | Pre-existing keys/secrets are retained. |
| TemplateApp `install-chart` | Helm uninstall, then approved pre-Ready PVC/namespace cleanup. | Shared destroy port receives product-specific release identity. |
| TemplateApp `bootstrap-keycloak` | No independent remote delete; removal of the dedicated per-tenant namespace removes its Keycloak. | Never touch shared Nivo Keycloak. |
| TemplateApp `record-outcome` | None. | Ready/AwaitingDNS is terminal success, not compensated by provisioning. |

### EXACT PRODUCTION FILE TREE

All paths below are prospective Apply files. Review may narrow them; Apply may not silently widen them.

| Action | Exact path | Responsibility / shape evidence |
|---|---|---|
| ADD | `src/modules/platform/databases/postgresql/primary/entities/provisioning-saga.entity.ts` | Durable Saga run, 1:1 loose correlation with Job, definition version and state machine. |
| ADD | `src/modules/platform/databases/postgresql/primary/entities/provisioning-saga-step.entity.ts` | Per-step forward/compensation journal and unique stable key. |
| ADD | `src/modules/platform/databases/postgresql/primary/entities/provisioning-outbox.entity.ts` | Persisted Kafka message with sequence, retry and published timestamps. |
| ADD | `src/modules/platform/databases/postgresql/primary/entities/provisioning-event-inbox.entity.ts` | Consumer idempotency ledger keyed by Kafka `eventId`. |
| MODIFY | `src/modules/platform/databases/postgresql/primary/entities/index.ts` | Export all four entities. |
| MODIFY | `src/modules/platform/databases/postgresql/primary/primary.module.ts` | Register all four on primary PostgreSQL, not expert or AgentOS connections. |
| ADD | `src/modules/platform/databases/postgresql/primary/enums/provisioning-saga-status.ts` | Exhaustive run states including retry/compensation terminals. |
| ADD | `src/modules/platform/databases/postgresql/primary/enums/provisioning-saga-step-status.ts` | Forward and compensation step states. |
| MODIFY | `src/modules/platform/databases/postgresql/primary/enums/index.ts` | Export new enums. |
| ADD | `src/modules/platform/databases/postgresql/primary/migrations/1787788800000-provisioning-sagas.ts` | Tables, enum types, uniqueness, cursor checks and outbox indexes; timestamp rechecked in Review. |
| ADD | `src/modules/bussiness/provisioning-saga/provisioning-saga.module-definition.ts` | Configurable module definition matching repository modules. |
| ADD | `src/modules/bussiness/provisioning-saga/provisioning-saga.module.ts` | Expose dispatcher/runner/read/retry/cancel ports only; no product-module imports. |
| ADD | `src/modules/bussiness/provisioning-saga/atomic/provisioning-saga-action.service.ts` | Transactional create/claim/advance/fail/compensate writes guarded by Job fence. |
| ADD | `src/modules/bussiness/provisioning-saga/atomic/provisioning-saga-action.service.spec.ts` | Twin tests for every state/fence/concurrent writer branch. |
| ADD | `src/modules/bussiness/provisioning-saga/runner/provisioning-saga-runner.service.ts` | Generic forward/retry/reverse loop; owns no product policy. |
| ADD | `src/modules/bussiness/provisioning-saga/runner/provisioning-saga-runner.service.spec.ts` | Twin tests for crash resume, exhaustion, reverse order and compensation resume. |
| ADD | `src/modules/bussiness/provisioning-saga/types/context.ts` | Typed run context and `AbstractProvisioningSagaStep`. |
| ADD | `src/modules/bussiness/provisioning-saga/types/definition.ts` | Definition key/version/ordered-step contracts. |
| ADD | `src/modules/bussiness/provisioning-saga/types/failure.ts` | Discriminated retryable/permanent/cancel classification. |
| ADD | `src/modules/bussiness/provisioning-saga/types/snapshot.ts` | Internal/public sanitized Saga snapshot. |
| ADD | `src/modules/bussiness/provisioning-saga/types/index.ts` | Barrel for named Saga contracts. |
| ADD | `src/modules/bussiness/provisioning-saga/provisioning-saga-query.service.ts` | Owner-scoped read projection for transport and socket recovery. |
| ADD | `src/modules/bussiness/provisioning-saga/provisioning-saga-command.service.ts` | Owner-scoped retry/cancel policy; delegates queue enqueue after commit. |
| ADD | `src/modules/bussiness/provisioning-saga/provisioning-saga-command.service.spec.ts` | Authorization, terminal refusal, fence and duplicate command tests. |
| MODIFY | `src/modules/bussiness/jobs/atomic/job-action.service.ts` | Add transaction-safe claim/requeue primitives required by Saga; preserve generic job API. |
| MODIFY | `src/modules/bussiness/jobs/atomic/job-action.service.spec.ts` | Prove new fenced primitives and no regression. |
| MODIFY | `src/modules/bussiness/jobs/types/job.ts` | Named params for new atomic primitives; no anonymous object drift. |
| ADD | `src/modules/bussiness/provisioning-events/provisioning-outbox.service.ts` | Append outbox row in caller transaction; never emit before commit. |
| ADD | `src/modules/bussiness/provisioning-events/provisioning-outbox.service.spec.ts` | Same-transaction and duplicate event-key proofs. |
| ADD | `src/modules/bussiness/provisioning-events/provisioning-outbox.publisher.ts` | Poll/claim unpublished rows, publish Kafka with Saga partition key, retry and mark broker-acked. |
| ADD | `src/modules/bussiness/provisioning-events/provisioning-outbox.publisher.spec.ts` | Restart, duplicate publish, broker ack failure and ordering tests. |
| ADD | `src/modules/bussiness/provisioning-events/provisioning-event-consumer.service.ts` | Kafka consumer handler: validate envelope, inbox dedupe, monotonic projection and local relay. |
| ADD | `src/modules/bussiness/provisioning-events/provisioning-event-consumer.service.spec.ts` | Duplicate, out-of-order, invalid schema, DLQ and owner relay tests. |
| ADD | `src/modules/bussiness/provisioning-events/provisioning-event-schema.ts` | Runtime parser/narrower for v1 envelope; no unsafe cast from Kafka bytes. |
| ADD | `src/modules/bussiness/provisioning-events/provisioning-event-schema.spec.ts` | Every required/optional field, enum member and secret-field refusal. |
| MODIFY | `src/modules/bussiness/provisioning-events/provisioning-events.module.ts` | Register/export durable outbox, Kafka publisher/consumer and local relay. |
| MODIFY | `src/modules/bussiness/provisioning-events/types.ts` | Add Saga id, definition, direction, step and event id without exposing raw error/secret. |
| MODIFY | `package.json` | Add `kafkajs` runtime dependency and `@testcontainers/kafka` dev dependency; do not add a second Nest microservice framework. |
| MODIFY | `package-lock.json` | Lock exact Kafka client/testcontainer dependency graph. |
| ADD | `src/modules/integrations/kafka/kafka.module-definition.ts` | Configurable integration module. |
| ADD | `src/modules/integrations/kafka/kafka.module.ts` | Own producer/consumer lifecycle and export narrow client ports. |
| ADD | `src/modules/integrations/kafka/kafka-client.service.ts` | `kafkajs` connect/send/subscribe/disconnect with idempotent producer and manual offset semantics. |
| ADD | `src/modules/integrations/kafka/kafka-client.service.spec.ts` | Lifecycle, send headers/key, consumer ack and reconnect tests. |
| ADD | `src/modules/integrations/kafka/types/kafka-message.ts` | Named producer/consumer message contracts. |
| ADD | `src/modules/integrations/kafka/types/index.ts` | Kafka integration type barrel. |
| MODIFY | `src/modules/platform/env/config.ts` | Brokers, client id, consumer group, topics, TLS/SASL file pointers and enable flags; no literal credential. |
| MODIFY | `.stacks/dev/runtime/env/KEYS.md` | Document Kafka TLS/SASL secret names only. |
| MODIFY | `.stacks/dev/infra/compose/compose.yaml` | Add one local KRaft Kafka service and healthcheck for dev/full E2E runtime. |
| MODIFY | `src/modules/platform/socketio/gateways/provisioning/types/message.ts` | Wire type mirrors durable transition. |
| MODIFY | `src/modules/platform/socketio/gateways/provisioning/enums.ts` | Add `provisioning.saga.status` while preserving existing workspace/deployment events. |
| MODIFY | `src/modules/platform/socketio/gateways/provisioning/provisioning.gateway.ts` | Relay only consumer-validated local events; include event id/sequence and preserve owner rooms. |
| MODIFY | `src/modules/platform/socketio/gateways/provisioning/provisioning.gateway.spec.ts` | Prove owner isolation, compatibility mapping, duplicate event id and sequence behavior. |
| MODIFY | `src/modules/bussiness/agentos-provision/agentos-provision.dispatcher.ts` | Create Job + Saga + step journal atomically, enqueue after commit. |
| MODIFY | `src/modules/bussiness/agentos-provision/agentos-provision.dispatcher.spec.ts` | Atomic dispatch, duplicate active Saga and enqueue failure evidence. |
| MODIFY | `src/modules/bussiness/agentos-provision/provision-agentos.worker.ts` | Delegate the complete lifecycle to Saga runner; remove ad-hoc catch cleanup. |
| MODIFY | `src/modules/bussiness/agentos-provision/provision-agentos.worker.spec.ts` | Retry/exhaustion/compensation and fenced worker behavior. |
| RENAME | `src/modules/bussiness/agentos-provision/provision-step-map.service.ts` -> `src/modules/bussiness/agentos-provision/agentos-provision-saga.definition.ts` | Stable AgentOS definition key/version and ordered compensable steps. |
| RENAME | `src/modules/bussiness/agentos-provision/provision-step-map.service.spec.ts` -> `src/modules/bussiness/agentos-provision/agentos-provision-saga.definition.spec.ts` | Freeze order, key uniqueness and version. |
| MODIFY | `src/modules/bussiness/agentos-provision/steps/reserve-capacity.step.ts` | Implement forward + reservation-only compensation. |
| MODIFY | `src/modules/bussiness/agentos-provision/steps/reserve-capacity.step.spec.ts` | Forward/duplicate/release/not-owner tests. |
| MODIFY | `src/modules/bussiness/agentos-provision/steps/mint-bootstrap.step.ts` | Journal whether this Saga created credential; compensate only owned artefacts. |
| MODIFY | `src/modules/bussiness/agentos-provision/steps/mint-bootstrap.step.spec.ts` | Pre-existing vs Saga-owned credential and revoke tests. |
| MODIFY | `src/modules/bussiness/agentos-provision/steps/install-chart.step.ts` | Forward Helm idempotency plus uninstall/PVC compensation port. |
| MODIFY | `src/modules/bussiness/agentos-provision/steps/install-chart.step.spec.ts` | Install, partial install, not-found uninstall and cleanup failure tests. |
| MODIFY | `src/modules/bussiness/agentos-provision/steps/record-outcome.step.ts` | Commit Ready/domain rows/outbox atomically; no direct emitter. |
| MODIFY | `src/modules/bussiness/agentos-provision/steps/record-outcome.step.spec.ts` | Ready, rollout failure and transaction rollback tests. |
| MODIFY | `src/modules/bussiness/agentos-provision/agentos-provision.module.ts` | Register definition/steps; no sideways capability imports. |
| MODIFY | `src/modules/bussiness/expert-provision/expert-provision.dispatcher.ts` | Create Job + TemplateApp Saga + journal atomically. |
| MODIFY | `src/modules/bussiness/expert-provision/expert-provision.dispatcher.spec.ts` | Atomic dispatch, app-definition selection and duplicate run tests. |
| MODIFY | `src/modules/bussiness/expert-provision/provision-expert-site.worker.ts` | Delegate to Saga runner; remove worker-local failure projection. |
| MODIFY | `src/modules/bussiness/expert-provision/provision-expert-site.worker.spec.ts` | Retry/exhaustion/compensation/fencing tests. |
| RENAME | `src/modules/bussiness/expert-provision/provision-step-map.service.ts` -> `src/modules/bussiness/expert-provision/template-app-provision-saga.definition.ts` | TemplateApp definition selected by provisionable app metadata; Expert and MMO share shape/config, not AgentOS. |
| ADD | `src/modules/bussiness/expert-provision/template-app-provision-saga.definition.spec.ts` | Freeze version/order and supported app keys. |
| MODIFY | `src/modules/bussiness/expert-provision/steps/mint-secrets.step.ts` | Forward ownership journal and model-key compensation. |
| MODIFY | `src/modules/bussiness/expert-provision/steps/mint-secrets.step.spec.ts` | Existing/new secrets, usage reconciliation, destroy failure and resume. |
| MODIFY | `src/modules/bussiness/expert-provision/steps/install-chart.step.ts` | Forward plus product-aware Helm cleanup compensation. |
| MODIFY | `src/modules/bussiness/expert-provision/steps/install-chart.step.spec.ts` | Partial install and reverse cleanup cases. |
| MODIFY | `src/modules/bussiness/expert-provision/steps/bootstrap-keycloak.step.ts` | Record dedicated-tenant bootstrap result; no shared-Keycloak compensation. |
| MODIFY | `src/modules/bussiness/expert-provision/steps/bootstrap-keycloak.step.spec.ts` | Existing realm/client/user and namespace-owned cleanup semantics. |
| MODIFY | `src/modules/bussiness/expert-provision/steps/record-outcome.step.ts` | Persist domain + Saga terminal + outbox atomically. |
| MODIFY | `src/modules/bussiness/expert-provision/steps/record-outcome.step.spec.ts` | Ready/AwaitingDNS/failed mapping and rollback tests. |
| MODIFY | `src/modules/bussiness/expert-provision/secrets/expert-provision-secret.service.ts` | Add delete-owned-secrets primitive requiring journal ownership. |
| MODIFY | `src/modules/bussiness/expert-provision/secrets/expert-provision-secret.service.spec.ts` | Refuse deleting pre-existing rows; idempotent absent delete. |
| MODIFY | `src/modules/bussiness/expert-provision/secrets/instance-model-key.service.ts` | Add reconcile-and-destroy owned key primitive with local cleanup after upstream success. |
| MODIFY | `src/modules/bussiness/expert-provision/secrets/instance-model-key.service.spec.ts` | External failure, crash after destroy and idempotent retry tests. |
| MODIFY | `src/modules/bussiness/pod-credential/pod-credential.service.ts` | Add owner-proofed delete primitive for Saga bootstrap credential. |
| MODIFY | `src/modules/bussiness/pod-credential/pod-credential.service.spec.ts` | Idempotent delete and pre-existing retention tests. |
| ADD | `src/modules/bussiness/provisioning-cleanup/provisioning-release-cleanup.port.ts` | Product-neutral uninstall/PVC/namespace contract consumed by Saga steps. |
| ADD | `src/modules/bussiness/provisioning-cleanup/provisioning-release-cleanup.service.ts` | Route exact AgentOS/TemplateApp release identity to existing Helm/K8s capabilities. |
| ADD | `src/modules/bussiness/provisioning-cleanup/provisioning-release-cleanup.service.spec.ts` | Product routing, not-found success and partial cleanup evidence. |
| ADD | `src/modules/bussiness/provisioning-cleanup/provisioning-cleanup.module.ts` | Capability export; composition root owns cross-capability wiring. |
| ADD | `src/modules/bussiness/provisioning-cleanup/provisioning-cleanup.module-definition.ts` | Configurable module pattern. |
| ADD | `src/features/core/api/core/graphql/queries/provisioning/my-provisioning-saga/my-provisioning-saga.query.ts` | CQRS query object mirroring `my-agent-workspace`. |
| ADD | `src/features/core/api/core/graphql/queries/provisioning/my-provisioning-saga/my-provisioning-saga.handler.ts` | Owner-scoped query handler. |
| ADD | `src/features/core/api/core/graphql/queries/provisioning/my-provisioning-saga/my-provisioning-saga.handler.spec.ts` | Owner/missing/step ordering tests. |
| ADD | `src/features/core/api/core/graphql/queries/provisioning/my-provisioning-saga/my-provisioning-saga.service.ts` | QueryBus adapter only. |
| ADD | `src/features/core/api/core/graphql/queries/provisioning/my-provisioning-saga/my-provisioning-saga.resolver.ts` | Authenticated GraphQL boundary. |
| ADD | `src/features/core/api/core/graphql/queries/provisioning/my-provisioning-saga/graphql-types/input.ts` | Saga id input. |
| ADD | `src/features/core/api/core/graphql/queries/provisioning/my-provisioning-saga/graphql-types/response.ts` | Sanitized run + ordered step projection. |
| ADD | `src/features/core/api/core/graphql/queries/provisioning/my-provisioning-saga/graphql-types/index.ts` | Operation type barrel. |
| ADD | `src/features/core/api/core/graphql/queries/provisioning/my-provisioning-saga/my-provisioning-saga.module.ts` | CQRS operation module. |
| ADD | `src/features/core/api/core/graphql/queries/provisioning/my-provisioning-saga/my-provisioning-saga.module-definition.ts` | Configurable module definition. |
| ADD | `src/features/core/api/core/graphql/queries/provisioning/my-provisioning-saga/index.ts` | Operation export. |
| ADD | `src/features/core/api/core/graphql/mutations/provisioning/retry-provisioning-saga/retry-provisioning-saga.command.ts` | CQRS command carrying authenticated execute params and Saga id. |
| ADD | `src/features/core/api/core/graphql/mutations/provisioning/retry-provisioning-saga/retry-provisioning-saga.handler.ts` | Owner-scoped retry handler delegating to Saga command capability. |
| ADD | `src/features/core/api/core/graphql/mutations/provisioning/retry-provisioning-saga/retry-provisioning-saga.handler.spec.ts` | Handler twin for ownership, state policy, duplicate retry and enqueue recovery. |
| ADD | `src/features/core/api/core/graphql/mutations/provisioning/retry-provisioning-saga/retry-provisioning-saga.service.ts` | CommandBus adapter only. |
| ADD | `src/features/core/api/core/graphql/mutations/provisioning/retry-provisioning-saga/retry-provisioning-saga.resolver.ts` | Authenticated GraphQL mutation boundary. |
| ADD | `src/features/core/api/core/graphql/mutations/provisioning/retry-provisioning-saga/graphql-types/input.ts` | Saga id input. |
| ADD | `src/features/core/api/core/graphql/mutations/provisioning/retry-provisioning-saga/graphql-types/response.ts` | Sanitized queued Saga snapshot response. |
| ADD | `src/features/core/api/core/graphql/mutations/provisioning/retry-provisioning-saga/graphql-types/index.ts` | Operation type barrel. |
| ADD | `src/features/core/api/core/graphql/mutations/provisioning/retry-provisioning-saga/retry-provisioning-saga.module.ts` | Register command handler/service/resolver. |
| ADD | `src/features/core/api/core/graphql/mutations/provisioning/retry-provisioning-saga/retry-provisioning-saga.module-definition.ts` | Configurable module definition. |
| ADD | `src/features/core/api/core/graphql/mutations/provisioning/retry-provisioning-saga/index.ts` | Operation export. |
| ADD | `src/features/core/api/core/graphql/mutations/provisioning/cancel-provisioning-saga/cancel-provisioning-saga.command.ts` | CQRS command carrying authenticated execute params and Saga id. |
| ADD | `src/features/core/api/core/graphql/mutations/provisioning/cancel-provisioning-saga/cancel-provisioning-saga.handler.ts` | Owner-scoped cancel handler, fence then enqueue compensation. |
| ADD | `src/features/core/api/core/graphql/mutations/provisioning/cancel-provisioning-saga/cancel-provisioning-saga.handler.spec.ts` | Handler twin for cancellable/terminal/racing states. |
| ADD | `src/features/core/api/core/graphql/mutations/provisioning/cancel-provisioning-saga/cancel-provisioning-saga.service.ts` | CommandBus adapter only. |
| ADD | `src/features/core/api/core/graphql/mutations/provisioning/cancel-provisioning-saga/cancel-provisioning-saga.resolver.ts` | Authenticated GraphQL mutation boundary. |
| ADD | `src/features/core/api/core/graphql/mutations/provisioning/cancel-provisioning-saga/graphql-types/input.ts` | Saga id input. |
| ADD | `src/features/core/api/core/graphql/mutations/provisioning/cancel-provisioning-saga/graphql-types/response.ts` | Sanitized compensating Saga snapshot response. |
| ADD | `src/features/core/api/core/graphql/mutations/provisioning/cancel-provisioning-saga/graphql-types/index.ts` | Operation type barrel. |
| ADD | `src/features/core/api/core/graphql/mutations/provisioning/cancel-provisioning-saga/cancel-provisioning-saga.module.ts` | Register command handler/service/resolver. |
| ADD | `src/features/core/api/core/graphql/mutations/provisioning/cancel-provisioning-saga/cancel-provisioning-saga.module-definition.ts` | Configurable module definition. |
| ADD | `src/features/core/api/core/graphql/mutations/provisioning/cancel-provisioning-saga/index.ts` | Operation export. |
| MODIFY | `apps/core/src/app.module.ts` | Register `JobsModule`, `BullMqModule`, Saga, outbox, cleanup and product modules once at composition root. |
| MODIFY | `apps/core/src/main.ts` | Start only after required Kafka producer/consumer readiness when feature is enabled; close cleanly on shutdown. |
| ADD | `src/modules/platform/exceptions/errors/provisioning-saga/saga-not-found.ts` | Missing and wrong-owner share one outward shape. |
| ADD | `src/modules/platform/exceptions/errors/provisioning-saga/saga-transition-refused.ts` | Illegal state transition metadata. |
| ADD | `src/modules/platform/exceptions/errors/provisioning-saga/saga-definition-version-unsupported.ts` | Refuse resuming an unavailable historical definition. |
| ADD | `src/modules/platform/exceptions/errors/provisioning-saga/saga-step-compensation-failed.ts` | Named reverse-step terminal failure. |
| ADD | `src/tests/e2e/nivo/provisioning-saga.e2e-spec.ts` | Real Postgres/Redis/BullMQ/GraphQL/Socket flow with deterministic external adapters. |
| ADD | `src/tests/e2e/nivo/provisioning-saga.live-spec.ts` | Opt-in real Tino k3s proof after image/registry/backend URL prerequisites are green. |
| ADD | `src/tests/helpers/provisioning-kafka-world.ts` | Testcontainers Kafka topic/bootstrap helper and deterministic message capture. |

### TEST MATRIX

| Layer | Cases frozen before implementation |
|---|---|
| Persistence | Create run + all steps atomically; duplicate job/run refused; duplicate `(saga, stepKey)` refused; invalid cursor/state refused; outbox id unique; rollback leaves no partial rows. |
| Fencing/concurrency | Two workers claim same job; stale worker cannot advance forward, start compensation, finish compensation or publish terminal state; cancel fences active worker. |
| Forward runner | Empty definition refused; every forward step runs once; crash before journal commit re-runs safely; crash after external side effect converges; unsupported definition version refuses rather than running new order. |
| Retry | Retryable first/middle/last-step failures at budget-1 remain forward; exact budget exhaustion enters compensation once; permanent failure compensates immediately; BullMQ duplicate delivery does not duplicate side effect. |
| Compensation | Only completed compensable steps, strict reverse order; non-compensable skipped; crash midway resumes exact cursor; idempotent not-found succeeds; failed compensation remains retryable from the same reverse step. |
| AgentOS | Capacity fit/scale wait/failure; Saga-owned vs pre-existing bootstrap credential; partial Helm install; K8s Ready; ImagePullBackOff; cancellation during capacity/install/start; reservation released but shared node retained. |
| TemplateApp | Expert and MMO definition selection; local secrets existing/new; OpenRouter key existing/new; final usage before destroy; partial chart; Keycloak not ready/half-bootstrapped; custom-domain AwaitingDNS success; never touches shared Keycloak. |
| Query | Owner gets ordered sanitized snapshot; wrong owner and missing id are indistinguishable; no raw secret/upstream stack trace; empty step set is represented explicitly. |
| Retry mutation | Compensated/compensation_failed policy both ways; completed refused; wrong owner/missing; concurrent second retry; enqueue failure leaves durable queued state recoverable. |
| Cancel mutation | queued/running/waiting accepted; completed/compensated refused; repeated cancel idempotent; wrong owner/missing; cancellation races terminal Ready. |
| Outbox/Kafka | DB rollback publishes nothing; process dies after commit before publish then recovers; broker ack succeeds but mark-published fails then duplicate event id is stable; partition ordering by Saga; consumer restart/redelivery; invalid envelope -> DLQ; unrelated owner receives nothing. |
| Flow E2E | Authenticate -> pay/create AgentOS and provision Expert/MMO -> Saga writes outbox -> Kafka -> Nivo consumer -> Socket journey -> inject terminal failure after Helm -> reverse cleanup -> query compensated Saga -> retry/new run according to approved policy -> Ready -> management query. |
| Live call | Real Tino k3s, versioned pullable images and cluster-reachable backend URL; capture UI, GraphQL, Socket.IO, backend terminal, namespace/PVC, reservation and OpenRouter/Keycloak evidence without secrets. |

### ASSUMPTIONS AND EXCLUSIONS

| Item | Boundary |
|---|---|
| Existing in-flight jobs | Default is drain or explicitly mark legacy before deployment; no silent reinterpretation of `currentStep` under a new definition. |
| Provisioning vs lifecycle | Saga ends at Ready/Active/AwaitingDNS. Upgrade, downgrade, backup, reset and wipe remain separate lifecycle/operation Sagas in later plans. |
| Tino scale-in | Capacity controller owns shared node lifecycle. Product compensation releases reservations only. |
| User data | Automatic destructive cleanup is considered only for a stack that has never reached Ready. Any run that was ever Ready routes to backup/lifecycle policy, not provisioning compensation. |
| Secrets | Workflow/tests store no plaintext credential, token, cookie, kubeconfig or OpenRouter key. |
| Frontend | Backend keeps existing Socket events compatible and adds canonical Saga event. FE journey/reducer/CTA changes require a linked FE Review/Apply boundary; full-flow verdict is not PASS until browser UI consumes Kafka-derived Socket events without reload. |

### OUTPUTS

| Concept | Result |
|---|---|
| Capability brief | Durable provisioning Saga cho AgentOS và TemplateApp, tái sử dụng Job/BullMQ fencing hiện tại và bổ sung forward/compensation journal. |
| Architecture concept | Orchestration tập trung bằng versioned definitions; PostgreSQL là source of truth; outbox -> Kafka -> deduping Nivo consumer -> Socket.IO là realtime path. |
| Product split | AgentOS là definition riêng; Expert/MMO là TemplateApp definitions/config, không dùng tab/product type AgentOS. |
| Failure model | Retry transient trước; permanent/exhausted mới compensation; compensation failure giữ reverse cursor để operator retry. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\provisioning-saga-orchestration.md` | `added` — evidence, Saga state machine, exact prospective tree, test matrix và owner decisions. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Cleanup dữ liệu của provision chưa từng Ready | **Mặc định đề xuất:** auto `helm uninstall` + xóa PVC/namespace chỉ khi Saga chứng minh resource chưa từng Ready; nếu từng Ready thì refuse và route backup/wipe lifecycle. Phương án khác: luôn giữ PVC để điều tra thủ công. |
| Retry sau compensation | **Mặc định đề xuất:** `compensation_failed` retry cùng Saga/cursor; `compensated` tạo Saga id mới, không rewind lịch sử cũ. Phương án khác: cho rewind cùng Saga, nhưng audit/idempotency khó tin cậy hơn. |
| OpenRouter key khi TemplateApp provision thất bại | **Mặc định đề xuất:** reconcile final usage rồi destroy key chỉ khi journal chứng minh Saga đã mint; giữ nguyên key có trước. Phương án khác: disable và giữ history, cần retention/cleanup policy riêng. |
| Existing in-flight legacy jobs khi rollout | **Mặc định đề xuất:** drain hai provisioning queues, deploy migration, sau đó bật Saga workers; không backfill current jobs. Phương án khác: viết migration adapter cho in-flight jobs, tăng đáng kể boundary/rủi ro. |
| Public operations | **Mặc định đề xuất:** thêm `myProvisioningSaga`, `retryProvisioningSaga`, `cancelProvisioningSaga`; retry/cancel owner-scoped và refuse terminal Ready. Phương án khác: chỉ operator API, FE không thể tự phục hồi. |
| Kafka runtime | **Mặc định đề xuất:** `kafkajs`, topic `nivo.provisioning.lifecycle.v1`, KRaft local broker và production SASL/TLS qua secret files. Phương án khác: Redpanda-compatible broker vẫn dùng cùng Kafka protocol, không đổi app contract. |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend worktree hiện rất bẩn và nhiều file Saga-adjacent là untracked/modified. | Review phải freeze exact baseline và ownership trước Apply; tuyệt đối không baseline-commit nhầm thay đổi chưa thuộc capability. |
| Existing `JobEntity.currentStep` pipeline là append-only theo index, trong khi Saga cần stable key + version. | Deploy definition mới trên job cũ có thể chạy sai act; drain/version gate là bắt buộc. |
| Direct in-process `ProvisioningTransitionEmitter` đã mất terminal event trong live test. | Chỉ sửa runner mà không thêm durable outbox vẫn để UI treo dù Saga DB đúng. |
| Repo hiện chưa có Kafka runtime dependency hay broker trong stack. | Apply phải thêm client, health/readiness, local KRaft và production secret contract; không thể gọi full E2E nếu Kafka bị mock. |
| OpenRouter mint có race tạo orphan key trước local unique insert. | Saga giảm hậu quả bằng ownership journal/compensation nhưng không loại bỏ hoàn toàn nếu upstream mint không nhận idempotency key; Review cần kiểm tra contract thật. |
| Real Tino Ready proof vẫn bị chặn bởi private/missing workload images và backend URL trước đây không cluster-reachable. | Live spec không được báo PASS cho đến khi registry pull và network prerequisites được sửa/prove riêng. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Dùng Nest CQRS `@Saga()` event choreography làm một engine mới | Mở rộng durable Job/BullMQ ledger bằng versioned Saga runner + PostgreSQL journal; Kafka chỉ là event transport sau commit | Hệ thống đã có queue, fencing và resume đúng; choreography event-only không giải quyết durable reverse cursor hay lost/dual-write event. |
| Saga publish Kafka trực tiếp trong DB transaction | Transactional outbox publish sau commit | PostgreSQL và Kafka không có shared transaction; direct dual-write có thể commit một bên và mất bên còn lại. |
| Để mỗi worker tự `catch` rồi cleanup | Generic runner quyết định retry/compensate; product definition chỉ khai báo forward/compensation | Hai catch hiện tại đã drift và không audit được partial cleanup. |
| Product Saga tự xóa VPS Tino khi fail | Chỉ release reservation; capacity reconciler quyết định drain/scale-in shared node | Một node có thể phục vụ nhiều tenant; xóa theo một Saga có thể làm chết workload khác. |
| Coi Expert/MMO là biến thể AgentOS | TemplateApp Saga definition riêng với app-keyed config | Đúng product model đã được người dùng chốt: AgentOS standalone, Expert/MMO thuộc TemplateApp. |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge file tree, wildcard operation folders, migration/drain policy và compensation safety | Chạy `$starci-be-feature-review` trên workflow này và tạo một revision được duyệt rõ ràng. |
| Backend implementation | Chỉ `$starci-be-feature-apply` sau approved Review revision và baseline sạch/đúng boundary. |
| Deterministic E2E | Apply chạy `provisioning-saga.e2e-spec.ts` với real Postgres/Redis/BullMQ/Kafka/consumer/Socket và chỉ fake external provider/Helm failures. |
| Live Tino Saga proof | Publish pullable versioned images, cấu hình registry secret + cluster-reachable backend URL, rồi chạy opt-in live spec và browser journey. |
| Frontend Saga journey/CTA | Linked FE Review/Apply sau khi GraphQL/Kafka/Socket contract được BE Review freeze; browser proof phải có UI, Network, Console, FE/BE/Kafka terminal và không reload. |

## review

Approved revision: `nivo-provisioning-saga-kafka-r1`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo — Nest application `core` |
| Database | primary PostgreSQL; Redis/BullMQ dispatcher; Kafka event transport |
| Repo / branch | D:\Repositories\nivo-backend @ main, HEAD e58eb909a1cfe9b30c031d7e074704111edaf969; dirty user worktree preserved into Apply baseline |
| Purpose | Challenge và freeze Saga/Kafka production boundary, compensation policy, transport contract và full-flow proof. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\provisioning-saga-orchestration.md |
| Language | vi |
| Phase | review |
| Touching | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\provisioning-saga-orchestration.md |

### REVIEW VERDICT

| Challenge | Verdict |
|---|---|
| Saga engine | APPROVE — mở rộng durable Job/fencing bằng Saga journal; Kafka không thay thế command orchestration. |
| DB/Kafka consistency | APPROVE — transactional outbox bắt buộc; cấm publish Kafka trực tiếp trong domain transaction. |
| Kafka delivery | APPROVE — at-least-once, key `sagaId`, inbox dedupe `eventId`, monotonic `sequence`, DLQ cho poison envelope. |
| UI transport | APPROVE — Kafka consumer là producer duy nhất của local provisioning transition; Gateway giữ owner rooms và compatibility events. |
| Product split | APPROVE — AgentOS definition riêng; Expert/MMO qua TemplateApp definition/config. |
| Retry | APPROVE — transient retry trước; permanent/exhausted mới compensate; compensated run không rewind. |
| Cleanup | APPROVE — chỉ auto uninstall/PVC/namespace khi chưa từng Ready; từng Ready route lifecycle/backup. |
| Capacity | APPROVE — product compensation chỉ release reservation, không xóa shared Tino node. |
| OpenRouter | APPROVE — reconcile usage rồi destroy chỉ key do Saga tạo; pre-existing key giữ nguyên. |
| Legacy deployment | APPROVE — drain provisioning queues trước migration/worker switch; không reinterpret current index. |
| Public API | APPROVE — owner-scoped query/retry/cancel; terminal Ready từ chối provisioning retry/cancel. |
| Owner approval | APPROVED — user explicitly said `ok làm hết đi` after requiring Saga -> Kafka -> consumer -> UX/UI and full pass. |

### APPROVED PRODUCTION BOUNDARY

Revision `nivo-provisioning-saga-kafka-r1` approves every exact ADD/MODIFY/RENAME path in Plan `EXACT PRODUCTION FILE TREE`, with these review corrections:

| Correction | Frozen result |
|---|---|
| `provisioning-cleanup` cross-capability module | REMOVE from Apply boundary: `provisioning-release-cleanup.port.ts`, `provisioning-release-cleanup.service.ts`, its spec, module and module-definition. AgentOS uses global generic `HelmReleaseService`; TemplateApp reuses its existing `InstanceReleaseDestroyerService`. No sideways business-module import is added. |
| `apps/core/src/main.ts` | REMOVE from Apply boundary. Kafka lifecycle/readiness belongs to `KafkaModule` and health surfaces, not app bootstrap special cases. |
| Existing transition emitter | KEEP but change ownership: only validated Kafka consumer invokes it; Saga/steps/outbox publisher may not. |
| Frontend files | EXCLUDED from this BE revision. After BE gates pass, route the frozen Socket contract into linked FE Apply and do not claim full product PASS before browser proof. |

No production path outside the corrected Plan tree is approved. A newly required path returns to Review.

### ACCEPTANCE GATES

| Gate | Exact proof |
|---|---|
| Static | `npm run lint:check`, `npm run build`, TypeScript tests compile with no suppression/new lint disable. |
| Twin specs | Every new/modified Saga, outbox, Kafka, product definition/step and GraphQL handler twin passes with enumerated branches. |
| Flow E2E | Real PostgreSQL + Redis/BullMQ + Kafka broker/consumer + Socket.IO; deterministic fake only for paid/external Helm/provider side effects. |
| Broker proof | Source transaction creates outbox; real broker delivery; consumer inbox row; duplicate/out-of-order proof; owner Socket event. |
| Live API | Authenticated GraphQL query/retry/cancel against running core API. |
| Live Tino | Real provision and compensation only after images, pull secret and backend cluster URL are healthy; otherwise record exact external blocker and do not report full PASS. |
| UI/UX | Browser journey receives Kafka-derived socket progression without refresh, maps failure/compensation correctly, and only enables Manage at Ready. |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved capability | `nivo-provisioning-saga-kafka-r1`: durable AgentOS/TemplateApp Saga with reverse compensation and Kafka-backed realtime. |
| Approved transport | PostgreSQL outbox -> Kafka -> inbox-deduping Nivo consumer -> owner Socket.IO -> FE. |
| Approved safety | Never delete shared nodes; never clean post-Ready data; never destroy pre-existing credentials/model keys. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\provisioning-saga-orchestration.md` | `modified` — appended approved Review revision and corrected production boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User approved the complete revision and default policies with `ok làm hết đi`. |

### WARNINGS

| Warning | Impact |
|---|---|
| Target backend has a very large dirty worktree. | Apply baseline commit must capture it before Saga edits and must not discard/rewrite unrelated work. |
| Full live Tino proof previously failed on unavailable/private images and unreachable backend URL. | Implementation can pass deterministic full E2E while live verdict remains blocked; full product PASS requires clearing those external runtime prerequisites. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Generic `provisioning-cleanup` business router | Product steps call approved global integration/existing lifecycle capability | Router would create a sideways business-capability dependency and duplicate product release identity logic. |
| Special Kafka boot logic in `apps/core/src/main.ts` | Kafka module owns lifecycle/readiness | Composition main must not carry one integration's recovery policy. |

### OWED

| Owed | Cleared by |
|---|---|
| Backend implementation and proof | `$starci-be-feature-apply` revision `nivo-provisioning-saga-kafka-r1`. |
| Browser UI implementation/proof | Linked FE Apply after backend Socket contract is running. |
| Real Tino terminal Ready/compensation | Pullable images, registry secret and cluster-reachable backend URL, then live spec + browser proof. |

## review amendment

Approved revision: `nivo-provisioning-saga-kafka-r2`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo core Nest application |
| App / Database | core Nest app / primary PostgreSQL, Redis-BullMQ, Kafka |
| Repo / branch | backend `main`, Apply baseline commit `0593df1` |
| Purpose | Approve discovered composition and stale test-fixture paths required to complete the reviewed Saga capability. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\provisioning-saga-orchestration.md |
| Language | vi |
| Phase | review |
| Touching | r1 boundary plus exact composition/test-gate additions below. |

### REVIEW VERDICT

Revision r2 retains every r1 architecture decision and approves only these discovered necessities:

| Path | Decision | Reason |
|---|---|---|
| `src/features/core/api/core/graphql/mutations/index.ts` | MODIFY | Register retry/cancel operation modules at the existing GraphQL aggregation root. |
| `src/features/core/api/core/graphql/queries/index.ts` | MODIFY | Register owner-scoped Saga query module. |
| `src/modules/bussiness/instance-lifecycle/instance-lifecycle.module.ts` | MODIFY | Export the existing destroyer capability used by TemplateApp compensation; no cleanup implementation is duplicated. |
| `src/features/core/api/core/http/brand/brand.controller.spec.ts` | MODIFY TEST ONLY | Align stale expected layout with the production default-section merge so full unit gate can pass. |
| `src/modules/core/api/apollo/server/interceptors/graphql-transform.interceptor.spec.ts` | MODIFY TEST ONLY | Give the stale Nest `ExecutionContext` mock the GraphQL methods now required by locale resolution. |
| `src/modules/platform/exceptions/errors/provisioning-saga/kafka-disabled.ts` | ADD | Stable named internal failure for an invalid publish attempt while Kafka is disabled; replaces an anonymous Error and leaves lint clean. |

Owner approval: the user's standing instruction `ok lam het di` explicitly requires full green gates and authorizes these bounded composition/test corrections.

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `nivo-provisioning-saga-kafka-r2` retains r1 and adds only two composition exports/indexes plus two test-fixture repairs. |

### CHANGES

| Tree | Details |
|---|---|
| this workflow | modified -- exact r2 boundary and approval recorded before the final Apply record. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Owner's explicit full-green instruction approves r2. |

### WARNINGS

| Warning | Impact |
|---|---|
| Two test-only files are not Saga-owned. | They change no production behavior and only align stale fixtures with existing production contracts. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Duplicating cleanup or GraphQL registration locally | Export/register through existing composition roots | Keeps one owner for each capability. |

### OWED

| Owed | Cleared by |
|---|---|
| r2 implementation and proof | The following Apply event. |

## apply

Applied revision: `nivo-provisioning-saga-kafka-r2`

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
| App | core Nest application |
| Database | primary PostgreSQL; Redis/BullMQ; local real Kafka KRaft broker |
| Repo / branch | `main`; clean Apply baseline commit `0593df1` |
| Purpose | Durable versioned provisioning Saga for AgentOS and TemplateApp with compensation and Kafka-backed realtime. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\provisioning-saga-orchestration.md |
| Language | vi |
| Phase | apply |
| Touching | Approved r1 tree plus r2 amendment; linked FE proof is recorded separately. |

### IMPLEMENTED FLOW

| Layer | Result |
|---|---|
| Durable state | Added Saga, ordered step journal, outbox and inbox entities plus migration and primary-module registration. |
| Orchestration | Versioned AgentOS and TemplateApp definitions use one fenced runner; transient retry respects BullMQ budget; permanent/exhausted failure compensates completed steps in reverse. |
| Product cleanup | AgentOS releases its reservation/bootstrap/chart; TemplateApp reconciles/destroys Saga-owned model key/secrets and destroys the pre-Ready release/PVC. Shared Tino nodes are never deleted by a product Saga. |
| Transport | Same-transaction outbox -> keyed Kafka topic -> schema validation/inbox dedupe -> owner-scoped Socket.IO canonical event plus compatibility events. |
| Public API | Added owner-scoped `myProvisioningSaga`, `retryProvisioningSaga`, `cancelProvisioningSaga`. |
| Runtime | Added local Kafka KRaft service and env/secret contract; topic discovery avoids repeated create-topic errors. |

### COMMANDS AND RESULTS

| Proof | Result |
|---|---|
| `npm run lint:check` | PASS: 0 errors; 2,496 pre-existing warnings remain repository-wide. Diff-focused Saga files have 0 errors. |
| `npm run build` | PASS. |
| `npm test -- --runInBand --silent` | PASS: 366/366 suites, 1,808/1,808 tests. |
| New atomic/command/outbox twins | PASS: 16 cases across action, command, outbox append and publisher; runner/schema/consumer twins also pass. |
| `provisioning-saga-kafka.e2e-spec.ts` | PASS against real Kafka broker; keyed event reached its consumer group. |
| Running core API | PASS on `http://localhost:3067`; PostgreSQL migration loaded; both workers and Kafka consumer subscribed. |
| Authenticated GraphQL live call | PASS: sign-in, `myProvisioningSaga` returned compensated Saga sequence 10 with four steps; retry/cancel correctly returned `PROVISIONING_SAGA_TRANSITION_REFUSED_EXCEPTION`. |

### LIVE FLOW PROOF

| Field | Evidence |
|---|---|
| Flow | Authenticated Template App request -> BullMQ worker -> durable Saga -> three Helm attempts -> reverse compensation -> outbox -> Kafka -> inbox -> Socket.IO -> mounted FE journey. |
| Persona | Local Nivo tester account; no credential/token/cookie stored in workflow. |
| Resource | Site `4d50e1a7-1b6c-41f1-9039-bd824d564f85`, deployment `51b9b0af-0433-46f5-84f9-9edc3a597c00`, Saga `2e17de18-1c8b-4899-b723-47b3b7996680`. |
| Database | Saga terminal `compensated`, sequence 10; 10/10 outbox rows published and 10/10 inbox rows relayed. |
| Compensation | OpenRouter key destroyed, provisioning secrets removed and release cleanup invoked after permanent Helm failure. |
| Socket | Authenticated probe received canonical `provisioning.saga.status` with terminal `compensated`; gateway retained compatibility events. |
| UI | Without reload, top horizontal Template App journey changed from Build infrastructure to `Provisioning needs attention` and rendered the exact Helm exit-1 reason. |
| Console / Network | No product console error; direct real Kafka and authenticated Socket probes pass. Only Next Fast Refresh warning occurred during source edit. |
| Terminal | API remained healthy; consumer subscribed. Known unrelated Qdrant version and missing self-hosted embedding/data-git warnings do not stop boot. |
| Verdict | PASS for durable failure/compensation/realtime path. Ready success remains dependent on pullable workload image/chart configuration, not Saga transport. |

### OUTPUTS

| Concept | Result |
|---|---|
| Backend capability | Durable AgentOS/TemplateApp provisioning Saga with reverse compensation, fencing, retry and public owner operations. |
| Event architecture | PostgreSQL outbox -> Kafka -> inbox dedupe -> owner Socket.IO. |
| Product proof | Real TemplateApp failure compensated and updated browser UX without reload. |
| Final commit | `1250a8a` (`feat: add durable provisioning saga kafka flow`), on top of Apply baseline `0593df1`. |

### CHANGES

| Tree | Details |
|---|---|
| `src/modules/bussiness/provisioning-saga/**` | added -- action journal, runner, definitions, query/command and exhaustive twins. |
| `src/modules/bussiness/provisioning-events/**` | modified/added -- durable outbox publisher, schema, consumer, inbox dedupe and twins. |
| `src/modules/integrations/kafka/**`, `.stacks/dev/infra/compose/compose.yaml`, env files | added/modified -- Kafka client lifecycle and local broker contract. |
| primary DB entities/enums/migration/module | added/modified -- four durable tables and indexes. |
| AgentOS and Expert provision modules/steps/workers | modified -- Saga definitions, compensation and removal of direct socket dual-write. |
| GraphQL provisioning operation folders and aggregation indexes | added/modified -- owner query/retry/cancel. |
| Socket provisioning gateway/types | modified -- canonical Saga event plus compatibility relay. |
| `package.json`, `package-lock.json`, `apps/core/src/app.module.ts` | modified -- Kafka dependencies and module composition. |
| two r2 test fixtures | modified -- restore full unit gate without production behavior change. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Approved revision r2 is implemented and proved. |

### WARNINGS

| Warning | Impact |
|---|---|
| Workload Helm chart exits 1 in the current live dev cluster. | Saga correctly retries and compensates; a terminal Ready proof needs a pullable/configured application chart. |
| Runtime emits existing Qdrant compatibility, data-git and self-hosted embedding warnings. | Core API, Saga, Kafka and UI proof remain available; these are separate capabilities. |
| Repository lint has 2,496 warnings but zero errors. | Existing warning debt is outside this approved feature; no lint suppression was added. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Direct DB + Kafka dual write | Transactional outbox | Prevents lost terminal events. |
| FE Kafka client | Server consumer and owner Socket.IO | Keeps transport credentials and validation server-side. |
| Product Saga deleting Tino VPS | Release only the product reservation | Shared nodes may host other tenants. |

### OWED

| Owed | Cleared by |
|---|---|
| Terminal Ready live proof | Publish/configure the actual AgentOS/TemplateApp workload images and chart values, then rerun the same live path. Saga/Kafka/compensation implementation itself has no owed source work. |

## apply live-ready amendment

Applied follow-up revision: `nivo-provisioning-saga-kafka-live-ready-r3`

### LIVE FLOW PROOF

| Field | Evidence |
|---|---|
| Flow | Authenticated Template App request -> BullMQ -> durable Saga -> Helm on Tino K3s -> tenant Keycloak bootstrap -> K8s readiness -> transactional outbox -> Kafka -> inbox consumer -> Socket.IO -> mounted FE journey. |
| Persona | Existing local Nivo test account. No password, token, cookie or generated tenant secret is recorded here. |
| Resource | Site `79541977-cd9c-4ad5-ab37-73b87166ba42`; deployment `273da8c6-0622-48ea-82dd-f4cf0a0a0d2f`; Saga `7955f6e3-ac4a-4956-ad74-ea2e55fbfdb7`. |
| Saga | Terminal `completed`, `ever_ready=true`, cursor 4, sequence 7; all four steps (`mint-secrets`, `install-chart`, `bootstrap-keycloak`, `record-outcome`) completed with no failure. |
| Kafka | 7/7 outbox records published on `nivo.provisioning.lifecycle.v1`; each used one broker attempt and has no `last_error`. |
| Consumer / Socket | 7/7 inbox records consumed and relayed. The already-mounted provisioning page changed from `Kubernetes is building` to `Ready to manage` without reload. |
| Kubernetes | `be`, `fe`, `keycloak`, `redis` Deployments and `db`, `minio`, `qdrant` StatefulSets are Ready; both app/auth certificates are Ready through `letsencrypt-prod`. |
| Public endpoints | Expert web returned HTTPS 200 with certificate verification result 0; Keycloak realm `nivo` OIDC discovery returned HTTPS 200 with certificate verification result 0. |
| UI | Journey shows Request Done, Create app Done, Build infrastructure Done, Manage Current. `Manage apps` routes to `/en/apps`, where the new app renders `Running`. |
| Console | No new browser console error occurred during the successful live flow. One older authentication-page React Aria hydration mismatch remains separately visible in the long-lived dev-tab history. |
| Terminal | Core logged Keycloak ready/bootstrap and `record-outcome ... is ready`; the successful run has no worker/Saga error. Earlier compensation runs and missing-bearer logs belong to failed/dev-HMR attempts. |
| Verdict | PASS for the complete live Ready path, including real Tino K8s, TLS, Keycloak, Kafka, Socket.IO and no-refresh UI. |

### FOLLOW-UP SOURCE AND GATES

| Item | Result |
|---|---|
| Backend worker composition | `VideoWorkerModule` contains only headless video providers; `WorkerModule` registers both required database connections without importing HTTP controllers/Keycloak guards. Live pod is 2/2 Ready. |
| Expert image | Next standalone runtime plus `.dockerignore`; transfer archive reduced from about 1.80 GB to 235.5 MB. |
| Helm chart | Added `EXPERT_INSTANCE_ID`, `IfNotPresent` default and `ndots:3` for generated public hostnames. `helm lint k8s/charts/expert` passed with only expected missing-value warnings. |
| Cluster prerequisite | Installed cert-manager v1.21.0 and a Ready `letsencrypt-prod` ClusterIssuer; CoreDNS forwards `academy.nivo.vn` to its authoritative Cloudflare nameservers. |
| Backend lint | `npm run lint:check`: PASS, 0 errors; 2,499 repository-wide warnings remain. No suppression added. |
| Backend builds | `npm run build`: PASS. `npm run build:academy`: PASS. |
| Backend unit | `npm run test:unit -- --runInBand`: PASS, 370/370 suites and 1,824/1,824 tests. |
| Commits | Backend `1250a8a` (Saga) and `6d4e683` (headless worker); chart/image repo `77a80fa`. |
| Cleanup | Removed temporary loader/server/host-key pods and service, remote/local image tar files, plaintext SSH credential copies and temporary patch files. Successful tenant namespace retained. |

### OWED

| Owed | Cleared by |
|---|---|
| Production image distribution | Push immutable API/web image digests to a registry reachable by every current/future Tino node and supply the pull secret. Live proof imported images directly into both current nodes. |
| Persist cluster bootstrap as IaC | Check cert-manager/ClusterIssuer/CoreDNS configuration into the owning Tino cluster bootstrap repository or automation before rebuilding the cluster. |

## apply live-agentos amendment

### CONTEXT

| Field | Value |
|---|---|
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| App | nivo |
| Runtime image tag | `0ecdf00` |
| Live cluster | Existing three-node Tino k3s only; retained worker `nivo-worker-357725`; no VPS purchase. |

### LIVE FLOW PROOF

| Field | Evidence |
|---|---|
| Flow | Authenticated AgentOS request -> local wallet payment -> BullMQ -> durable Saga -> Helm/Tino k3s -> PostgreSQL/Qdrant/MinIO/AgentOS Ready -> outbox -> Kafka -> inbox consumer -> owner Socket.IO -> mounted journey. |
| Persona | Existing local Nivo test account. No password, token, cookie or generated workspace secret is recorded. |
| First resource | Order `97ff54ba-efad-452e-883e-70903bce5694`; workspace `084b824e-f1f0-49f7-87c2-655af8fa847e`; Saga `81e3c9bc-195d-4423-b2f9-f656c4d55a5c`. |
| Runtime finding | First mounted AgentOS journey missed the terminal browser update although Saga/outbox/inbox were complete; reload recovered canonical `Ready`. |
| Recovery repair | AgentOS and Template App connected blocks now poll their owner-scoped canonical snapshot every four seconds only while `preparing`; Socket.IO stays the low-latency path and the timer stops at terminal state. |
| Verification resource | Order `1d967cdb-d2e9-4f1d-84d0-880206eb5478`; workspace `c3fa9911-f693-4132-8fdb-2ad2386278ed`; Saga `887ae6a4-2bf6-42b2-8725-a28892562c31`. |
| Saga | Terminal `completed`, cursor 4, sequence 7, no failure code/reason. |
| Kafka / consumer | 7/7 outbox rows published in one attempt; 7/7 inbox rows consumed and relayed. |
| Kubernetes | All four workload pods Ready. AgentOS uses `ghcr.io/starci-lab/nivo-agentos-controlplane:0ecdf00`; PostgreSQL and MinIO use `bitnamilegacy`; Qdrant uses its public upstream image. |
| UI | The already-mounted second journey advanced from `Kubernetes is building` to `Ready to manage` without navigation or reload. |
| Capacity | Zero new `cluster_capacity_action_items` during the verification run; no Tino VPS was created. |
| Wallet | Two approved live test invoices were paid, each exactly `₫490.000`; no external gateway charge. |
| Console / terminal | FE lint and production build PASS. Runtime emitted one expected early pod-token delivery warning before Deployment readiness; credentials were persisted and synced, and the terminal workload became Ready. |
| Verdict | PASS for request, payment, Saga, public image pull, K8s Ready, Kafka/inbox relay and no-refresh terminal UI recovery. |

### CHANGES

| Path | Change |
|---|---|
| `D:\Repositories\nivo-fe\apps\app\src\components\blocks\provisioning\AgentOSProvisioning\index.tsx` | Added terminal snapshot recovery while preparing. |
| `D:\Repositories\nivo-fe\apps\app\src\components\blocks\provisioning\TemplateAppProvisioning\index.tsx` | Added matching recovery for Template App. |

### NEED APPROVALS

| Item | State |
|---|---|
| Additional VPS | None requested or created. |

### WARNINGS

| Warning | Evidence / disposition |
|---|---|
| A Socket.IO terminal event can be missed by a reconnecting AgentOS tab. | Durable snapshot fallback now converges the mounted UI without reload; Kafka/inbox relayed all events. |
| `Manage AgentOS` currently returns to the AgentOS management list. | A dedicated workspace detail/operations route is not present in the current FE route tree and is not claimed by this provisioning amendment. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Treat one missed socket event as permanent stale UI | Socket fast path plus bounded canonical snapshot recovery | Realtime delivery is not a durable source of truth. |
| Create capacity for the verification flow | Schedule on existing cluster | Existing requests fit and the approved external boundary forbade another VPS. |

### OWED

| Owed | State |
|---|---|
| AgentOS Ready journey | Cleared with the second no-reload live flow. |
| Dedicated AgentOS workspace operations/detail UI | Separate approved design/apply capability; backend lifecycle operations exist, but no FE detail route is present. |
