<!-- starci-workflow: v2 -->

## plan — nivo-agentos-workspace-control-center-r1

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
| App | nivo — `apps/core` owns customer GraphQL and pod redeem; `apps/agentos-controlplane` owns browser callback, local session and app proxy |
| Repo / branch | D:\Repositories\nivo-backend / main |
| Database | PostgreSQL primary connection `POSTGRESQL_PRIMARY`; the per-instance database is not an authority for launch grants |
| Purpose | Freeze the backend capability that powers the approved AgentOS workspace control center, live K8s runtime stats and credential-free OpenClaw/n8n launch. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-workspace-control-center.md |
| Language | vi |
| Phase | plan |
| Touching | This phase may write only D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-workspace-control-center.md; no target source |

### OBJECTIVE

Một customer sở hữu nhiều AgentOS workspace có thể mở đúng workspace, xem identity/plan/allocation và runtime CPU/RAM/container health, rồi bấm OpenClaw hoặc n8n để dùng ngay mà không nhìn thấy password, token hay cookie. Mọi read và launch đều owner-scoped theo `workspaceId`; một launch code chỉ dùng được một lần, hết hạn nhanh và chỉ pod đích mới redeem được.

### EVIDENCE

| Evidence | Finding |
|---|---|
| Live GraphQL introspection at `http://localhost:3067/graphql` | Có `myAgentWorkspace`, `myInstances`, `myPodOpenclawStatus`, `myPodN8nWorkflows`, `issuePodAccessTokens`; chưa có exact-workspace control-center/runtime/launch contract. |
| `my-agent-workspace/` sibling | Query family dùng Query → Handler → Service → Resolver → configurable single-operation Module + handler spec; revision này mirror đủ family đó. |
| `issue-pod-access-tokens/` and agent-workspace mutation siblings | Mutation phải có folder riêng, `graphql-types`, module definition/module và được thêm vào `MUTATION_MODULES`; operation chỉ import mà không register sẽ biến mất khỏi schema. |
| `ViewerPodService` | Hiện chọn workspace mới nhất của viewer, không nhận `workspaceId`; không an toàn cho trang quản lý nhiều workspace. |
| `PodRegistrationController` + `PodClientAssertionGuard` | Pod đã có trust boundary RSA/EC/EdDSA, signed assertion, audience, expiry và replayed-`jti` lock. Redeem server-to-server phải reuse boundary này. |
| `PodRegistrationEntity` | `podId` chính là `agent_workspaces.id`; có live registration, public endpoints và revocation state để bind grant vào đúng pod. |
| `InstanceRuntimeProbeService` / `InstanceRuntimeSnapshotEntity` | Đã probe Deployments/PVC và giữ latest snapshot, nhưng chưa đọc Metrics API, container usage/restarts/OOM/throttle hoặc emit runtime update. |
| Provisioning Socket.IO gateway | Đã auth Keycloak, room theo owner và phát `workspace.status`, saga, operation; chưa có `workspace.runtime`. |
| `apps/agentos-controlplane/src/config.ts` | Controlplane có pod identity, backend URL, OpenClaw loopback token và `N8N_OWNER_PASSWORD`; chart đã truyền `N8N_URL` nhưng code chưa đọc. |
| AgentOS Helm chart | OpenClaw và n8n nằm cùng app pod; public Service/Ingress đi vào controlplane. Không cần mở thêm ingress hoặc đưa owner password ra FE. |
| `nivo-backend` worktree | Có unrelated untracked `apps/agentos-mcp/`; Apply phải giữ nguyên và không đưa nó vào baseline/change boundary. |

### ARCHITECTURE

1. `myAgentWorkspaceControlCenter(workspaceId)` trả về đúng workspace thuộc viewer: workspace/instance identity, lifecycle, plan/allocation, app capability (`openclaw`, `n8n`) và latest runtime snapshot.
2. `myAgentWorkspaceRuntime(workspaceId, refresh)` trả latest snapshot; `refresh=true` chỉ cho owner và chạy live K8s probe có timeout. Background monitor cập nhật snapshot theo cadence, chỉ phát Socket.IO khi fingerprint public-safe đổi.
3. `issueWorkspaceLaunch(input)` kiểm tra owner + workspace `active` + app khả dụng, validate relative `returnPath`, rồi ghi một grant có SHA-256 hash, TTL 60 giây, audience/pod/app/owner và idempotency key. GraphQL chỉ trả `launchId`, `redirectUrl`, `expiresAt`.
4. Browser mở `https://<workspace-host>/access/callback?code=...&app=...`. Controlplane ký pod assertion và POST code tới `/pods/self/workspace-launches/redeem`. Core atomically consume grant nếu hash, pod, app, audience và TTL đều hợp lệ.
5. Controlplane mint local session JWT bằng private key của pod, đặt cookie `Secure; HttpOnly; SameSite=Lax; Path=/apps/<app>` rồi `303` sang URL sạch không còn code.
6. `/apps/openclaw/*` bridge vào OpenClaw loopback; `/apps/n8n/*` là reverse proxy cùng origin. n8n adapter dùng owner password nội bộ để bootstrap session với n8n `1.64.3`, relay cookie nội bộ và rewrite HTTP/WebSocket/path; password và n8n cookie không ra GraphQL, Socket.IO hoặc log.
7. Runtime Socket.IO payload chỉ có workspace/instance id, public-safe metrics, fingerprint và `observedAt`; FE refetches authoritative query when sequence/fingerprint changes. Kafka/Saga remains provisioning authority, not a transport for high-frequency metrics.

### CONTRACT

| Surface | Contract |
|---|---|
| `myAgentWorkspaceControlCenter(workspaceId: UUID!)` | Authenticated owner-only query. Returns `workspace`, `instance`, `plan`, `allocation`, `apps`, `runtime`; foreign and missing IDs share the same not-found exception. |
| `myAgentWorkspaceRuntime(workspaceId: UUID!, refresh: Boolean = false)` | Returns CPU millicores usage/request/limit, memory bytes usage/request/limit, pod/container readiness, restart count, last termination reason, OOM/throttle flags, storage, `observedAt`, `stale`, `probeStatus`. |
| `issueWorkspaceLaunch(input)` | Input: `workspaceId`, enum `app`, UUID `idempotencyKey`, optional relative `returnPath`. Output contains no credential: `launchId`, one-time `redirectUrl`, `expiresAt`. |
| `POST /pods/self/workspace-launches/redeem` | `PodClientAssertionGuard`; body has bounded opaque code and app enum. Atomic compare-and-consume returns owner/workspace/app/normalized path, never another reusable bearer. |
| `GET /access/callback` | Public browser entry on workspace host; exchanges code server-to-server, sets host-only session cookie, then 303 to `/apps/<app>/...`. All errors render a bounded page and set no cookie. |
| `workspace.runtime` | Owner room event with monotonic `sequence`, `workspaceId`, `instanceId`, metrics fingerprint and `observedAt`; no secret/code/cookie. |

### PRODUCT RULES

| Rule | Frozen default for Review |
|---|---|
| Launch code | Cryptorandom 256-bit, only SHA-256 hash persisted, TTL 60 seconds, one successful consume, no code in structured logs. |
| Idempotency | `(owner_id, workspace_id, app, idempotency_key)` unique. Same request returns the same still-live grant; expired/consumed request creates no replacement under that key. |
| Local session | Absolute TTL 8 hours, idle TTL 30 minutes, host-only `Secure` + `HttpOnly` + `SameSite=Lax`; app-scoped path and explicit logout/revoke. |
| Return path | Relative path only, normalized against an allowlist per app; schemes, hosts, `//`, encoded traversal and cross-app paths are rejected. |
| Runtime cadence | 30 seconds for active AgentOS instances, bounded concurrency 5, 5-second K8s timeout, snapshot stale after 90 seconds. |
| Runtime capacity semantics | Allocation is the sold namespace budget; usage is observed. UI warning at 80%, critical at 95%; no automatic plan mutation or VPS purchase in this capability. |
| n8n | Adapter is pinned and contract-tested against `1.64.3`; version/CSRF/login mismatch fails closed and marks launch unavailable. No raw owner password fallback. |
| OpenClaw | Access remains through controlplane loopback bridge; gateway token never reaches browser. |

### PROPOSED FILE TREE

#### Core GraphQL — control-center query

| Path | Responsibility / shape evidence |
|---|---|
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-control-center/index.ts` | Export operation module/resolver/service; mirrors `my-agent-workspace/index.ts`. |
| `.../my-agent-workspace-control-center.module-definition.ts` | Configurable single-query module definition. |
| `.../my-agent-workspace-control-center.module.ts` | Register `CqrsModule`, primary entities and all three local providers. |
| `.../my-agent-workspace-control-center.query.ts` | CQRS query carrying `workspaceId` and authenticated user. |
| `.../my-agent-workspace-control-center.handler.ts` | Owner-scoped aggregate read; never delegates ownership to FE. |
| `.../my-agent-workspace-control-center.service.ts` | Thin QueryBus boundary. |
| `.../my-agent-workspace-control-center.resolver.ts` | Guarded GraphQL door and UUID argument. |
| `.../my-agent-workspace-control-center.handler.spec.ts` | Twin handler specification. |
| `.../graphql-types/index.ts` | Export response types. |
| `.../graphql-types/response.ts` | Explicit workspace/instance/plan/app/runtime public response; no entity overexposure. |

#### Core GraphQL — runtime query

| Path | Responsibility / shape evidence |
|---|---|
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-runtime/index.ts` | Export single query family. |
| `.../my-agent-workspace-runtime.module-definition.ts` | Configurable module definition. |
| `.../my-agent-workspace-runtime.module.ts` | Register CQRS/providers and primary repository on `POSTGRESQL_PRIMARY`. |
| `.../my-agent-workspace-runtime.query.ts` | `workspaceId`, `refresh`, authenticated viewer. |
| `.../my-agent-workspace-runtime.handler.ts` | Exact ownership lookup, optional live probe, stale calculation. |
| `.../my-agent-workspace-runtime.service.ts` | QueryBus boundary. |
| `.../my-agent-workspace-runtime.resolver.ts` | Guarded GraphQL query. |
| `.../my-agent-workspace-runtime.handler.spec.ts` | Query/refresh/stale/ownership specs. |
| `.../graphql-types/index.ts` | Export runtime response types. |
| `.../graphql-types/response.ts` | Public-safe quantity fields and status enums. |
| `src/features/core/api/core/graphql/queries/index.ts` | Import and register both new query modules in `QUERY_MODULES`. |

#### Core GraphQL — issue launch mutation

| Path | Responsibility / shape evidence |
|---|---|
| `src/features/core/api/core/graphql/mutations/agent-workspace/issue-workspace-launch/index.ts` | Export mutation family. |
| `.../issue-workspace-launch.module-definition.ts` | Configurable module definition. |
| `.../issue-workspace-launch.module.ts` | Register `CqrsModule`, command handler/service/resolver. |
| `.../issue-workspace-launch.command.ts` | Typed command with authenticated owner and validated input. |
| `.../issue-workspace-launch.handler.ts` | Calls workspace-access capability after exact owner/status checks. |
| `.../issue-workspace-launch.service.ts` | Thin CommandBus boundary. |
| `.../issue-workspace-launch.resolver.ts` | Authenticated GraphQL mutation. |
| `.../issue-workspace-launch.handler.spec.ts` | Twin handler spec including concurrent/idempotent issue. |
| `.../graphql-types/index.ts` | Export input/response/app enum. |
| `.../graphql-types/request.ts` | Decorated validation for UUIDs, enum and bounded relative path. |
| `.../graphql-types/response.ts` | `launchId`, `redirectUrl`, `expiresAt` only. |
| `src/features/core/api/core/graphql/mutations/index.ts` | Import and register mutation in `MUTATION_MODULES`. |

#### Core workspace-access capability and pod redeem

| Path | Responsibility / shape evidence |
|---|---|
| `src/modules/bussiness/workspace-access/workspace-access.module-definition.ts` | Configurable global-capability shape. |
| `src/modules/bussiness/workspace-access/workspace-access.module.ts` | Register primary entity/service; export service. |
| `src/modules/bussiness/workspace-access/workspace-access.service.ts` | Issue/hash/idempotency and atomic redeem transaction. |
| `src/modules/bussiness/workspace-access/workspace-access.types.ts` | Closed app enum, issue/redeem/session claims and constants. |
| `src/modules/bussiness/workspace-access/workspace-return-path.ts` | Pure app-specific path normalization/allowlist. |
| `src/modules/bussiness/workspace-access/workspace-access.service.spec.ts` | TTL/hash/atomic consume/pod binding/idempotency specs. |
| `src/modules/bussiness/pod-registration/dto/redeem-workspace-launch.dto.ts` | Bounded decorated REST body. |
| `src/modules/bussiness/pod-registration/pod-registration.types.ts` | Public-safe redeem answer type; no credential. |
| `src/features/core/api/core/http/pod-registration/pod-registration.controller.ts` | Add guarded `POST workspace-launches/redeem`; pod id comes only from assertion. |
| `src/modules/bussiness/pod-registration/pod-registration.module.ts` | Inject workspace-access capability explicitly; keep controllers/providers registered. |
| `apps/core/src/app.module.ts` | Register `WorkspaceAccessModule` exactly once before `PodRegistrationModule`. |

#### Primary persistence and exceptions

| Path | Responsibility / shape evidence |
|---|---|
| `src/modules/platform/databases/postgresql/primary/entities/workspace-access-grant.entity.ts` | Hash-only grant, owner/workspace/pod/app/audience/idempotency/expiry/consume/revoke timestamps and indexes. |
| `src/modules/platform/databases/postgresql/primary/entities/index.ts` | Export entity. |
| `src/modules/platform/databases/postgresql/primary/migrations/1788048000000-workspace-access-grants.ts` | Idempotent table, FKs, unique idempotency constraint and live-expiry lookup index. |
| `src/modules/platform/databases/postgresql/primary/primary.module.ts` | Register entity in both TypeORM arrays and migration in ordered list. |
| `src/modules/platform/exceptions/errors/workspace-access/workspace-not-found.ts` | Same public not-found for absent/foreign workspace. |
| `.../workspace-launch-unavailable.ts` | Inactive/unregistered/version-incompatible app. |
| `.../workspace-launch-code-invalid.ts` | One non-oracular invalid/wrong-pod/wrong-app response. |
| `.../workspace-launch-code-expired.ts` | Expired terminal state. |
| `.../workspace-launch-code-consumed.ts` | Already-consumed terminal state. |
| `.../workspace-return-path-invalid.ts` | Unsafe redirect target. |
| `src/modules/platform/exceptions/errors/workspace-access/index.ts` | Export exception family; every constructor receives one object per backend lint convention. |

#### K8s runtime projection and Socket.IO

| Path | Responsibility / shape evidence |
|---|---|
| `src/modules/bussiness/instance-operations/types/runtime-snapshot.ts` | Extend component and aggregate types with usage/request/limit/restart/OOM/throttle/fingerprint. |
| `src/modules/bussiness/instance-operations/instance-runtime-probe.service.ts` | Apps/Core/Metrics API reads, quantity parsing, timeout and public-safe errors. |
| `src/modules/bussiness/instance-operations/instance-runtime-snapshot.service.ts` | Persist/read extended JSON snapshot and exact owner lookup. |
| `src/modules/bussiness/instance-operations/instance-runtime-watch.service.ts` | Compare fingerprints, persist and emit only changed observations. |
| `src/modules/bussiness/instance-operations/instance-runtime-monitor.service.ts` | Scheduled active-instance scan, cadence and bounded concurrency. |
| `src/modules/bussiness/instance-operations/instance-operations.module.ts` | Register/export monitor and its dependencies; preserve global registration. |
| `src/modules/bussiness/instance-operations/instance-runtime-probe.service.spec.ts` | Quantity/container aggregation/metrics-unavailable specs. |
| `src/modules/bussiness/instance-operations/instance-runtime-watch.service.spec.ts` | Changed/unchanged fingerprint emission specs. |
| `src/modules/provisioning-events/types.ts` | Add closed runtime transition type/resource member. |
| `src/modules/platform/socketio/gateways/provisioning/enums.ts` | Add `workspace.runtime`. |
| `src/modules/platform/socketio/gateways/provisioning/types/message.ts` | Public-safe runtime message. |
| `src/modules/platform/socketio/gateways/provisioning/provisioning.gateway.ts` | Route runtime transition to owner room. |

#### AgentOS controlplane callback/session/proxies

| Path | Responsibility / shape evidence |
|---|---|
| `apps/agentos-controlplane/src/access/access.module.ts` | Register callback, session guard, OpenClaw bridge and n8n proxy. |
| `apps/agentos-controlplane/src/access/access.controller.ts` | Browser callback, clean 303 redirect and logout. |
| `apps/agentos-controlplane/src/access/access-session.service.ts` | Mint/verify local JWT with persisted pod key; enforce app/path/TTL. |
| `apps/agentos-controlplane/src/access/access-session.guard.ts` | Read only host-scoped HttpOnly cookie and bind app claim. |
| `apps/agentos-controlplane/src/access/openclaw-access.controller.ts` | Authorized HTTP/WS bridge to loopback relay without exposing gateway token. |
| `apps/agentos-controlplane/src/access/n8n-access.controller.ts` | Authorized HTTP/WS reverse proxy under `/apps/n8n`. |
| `apps/agentos-controlplane/src/access/n8n-session.service.ts` | Version-gated owner login, internal cookie jar and cookie/path/header rewriting. |
| `apps/agentos-controlplane/src/access/types.ts` | Callback/redeem/session/proxy closed types. |
| `apps/agentos-controlplane/src/access/access.controller.spec.ts` | Callback/cookie/redirect/error/logout specs. |
| `apps/agentos-controlplane/src/access/access-session.service.spec.ts` | Signature, expiry, app/path and tamper specs. |
| `apps/agentos-controlplane/src/access/n8n-session.service.spec.ts` | Pinned login/CSRF/cookie/version contract specs. |
| `apps/agentos-controlplane/src/backend/backend-client.service.ts` | Add signed `redeemWorkspaceLaunch`; unlike scheduled chores, propagate terminal errors to callback. |
| `apps/agentos-controlplane/src/backend/types/backend-client.ts` | Redeem request/answer transport types. |
| `apps/agentos-controlplane/src/config.ts` | Read existing `N8N_URL`, access TTL/cookie names; no secret default. |
| `apps/agentos-controlplane/src/app.module.ts` | Register `AccessModule` exactly once. |

#### Flow proof and contracts

| Path | Responsibility / shape evidence |
|---|---|
| `src/tests/flow/agentos-workspace-control-center.flow-spec.ts` | Production GraphQL + REST issue/redeem/owner isolation/one-time flow. |
| `apps/agentos-controlplane/test/access-flow.e2e-spec.ts` | Real callback → cookie → clean redirect → protected app route against stubbed loopback targets. |
| `src/tests/helpers/pod-assertion.ts` | Reuse unchanged unless Review proves a missing audience helper; no production credential fixture. |

### TEST MATRIX

| Area | Cases fixed before implementation |
|---|---|
| Ownership | Own exact workspace; second owned workspace; absent; foreign indistinguishable from absent; legacy workspace with null instance; workspace app not `agentos`. |
| Lifecycle/apps | `provisioning`, `waiting_capacity`, `installing`, `starting`, `active`, `suspended`, `failed`; OpenClaw and n8n each registered/unregistered/reachable/unreachable/version mismatch. |
| Runtime | Empty namespace; Metrics API absent; timeout; stale at 89/90/91s; CPU/memory zero, exactly request, 80%, 95%, over limit; multi-container sum; restart; OOMKilled; throttle; PVC states; unchanged fingerprint emits nothing. |
| Issue | Both app enum members; blank/malformed UUID; missing/foreign workspace; inactive workspace; unsafe path variants; same idempotency key retry; two concurrent writers; no plaintext code in DB/log/event. |
| Redeem | Success; wrong hash; expired exactly at boundary; consumed; revoked; wrong pod; wrong app; wrong audience; revoked registration; two concurrent redeems with exactly one success. |
| Browser session | Secure/HttpOnly/SameSite/host/path attributes; tampered/expired/wrong-app cookie; clean 303; logout; callback failure sets no cookie; code absent from final URL and logs. |
| OpenClaw | Authorized HTTP and WS bridge; no session; wrong app session; loopback failure; gateway token never sent to browser. |
| n8n | Owner login success; bad password; CSRF required/changed; pinned version success; other version fail closed; internal cookie relay; Set-Cookie stripping; Location/path rewrite; HTTP and WS; logout/revoke. |
| Flow e2e | Keycloak owner A issues; signed pod A redeems; browser receives cookie and enters each app; owner B cannot issue; pod B cannot redeem; replay fails; GraphQL/schema includes both queries and mutation. |
| Runtime proof | Live K8s snapshot query plus one `workspace.runtime` Socket.IO event; UI can refetch and render without direct K8s or credential access. |

### ASSUMPTIONS AND EXCLUSIONS

| Item | Boundary |
|---|---|
| Public images | Already handled by the public-image delivery capability; this feature does not alter registry policy. |
| Autoscale/Tino | Reads allocation and usage only. It neither buys/deletes VPS nor changes namespace quotas/plans. |
| Saga/Kafka | Existing provisioning saga remains authoritative for create/ready/failure. Runtime metrics are snapshots, not saga steps or billing events. |
| Credential UI | Explicitly excluded. Password, gateway token, n8n cookie, private key and launch code never appear in GraphQL runtime objects or Socket.IO. |
| Raw service exposure | No new public n8n/OpenClaw Service/Ingress; same controlplane door owns access. |
| Frontend implementation | Deferred to approved FE Design Apply after this backend contract passes Review/Apply and live schema proof. |

### OUTPUTS

| Concept | Result |
|---|---|
| Capability brief | `nivo-agentos-workspace-control-center-r1`: exact-workspace control center, K8s runtime projection and one-time passwordless launch through the pod controlplane. |
| Security model | One-time hash-only core grant + pod-signed redeem + local host-scoped HttpOnly session; no credentials in UI, URL after redirect, Kafka or Socket.IO. |
| n8n delivery | Same-origin, version-gated controlplane proxy using internal owner login; fails closed outside the pinned contract. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-workspace-control-center.md` | `added` — evidence-backed backend feature plan only. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Review revision | Approve `nivo-agentos-workspace-control-center-r1` for `starci-be-feature-review`; or revise TTL/cadence/proxy boundary before Review. |
| n8n adapter risk | Recommended: ship the pinned `1.64.3` proxy and fail closed on mismatch; alternative: launch only OpenClaw and keep n8n unavailable until a native SSO contract exists. |

### WARNINGS

| Warning | Impact |
|---|---|
| n8n owner-session bootstrap is coupled to an internal n8n login/CSRF/cookie contract. | Every n8n upgrade requires the adapter contract test before rollout; mismatch must disable launch rather than expose password. |
| Backend branch has unrelated untracked `apps/agentos-mcp/`. | Apply must preserve and exclude it from the feature baseline/diff. |
| Live Metrics API/RBAC has not yet been proved on the dev cluster in this Plan. | Runtime fields may be `probeStatus=unavailable` until Apply proves the metrics endpoint and service-account permissions. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Show OpenClaw/n8n credentials in Nivo UI | One-time launch + HttpOnly session | Credentials become copyable, leak through support/screenshots and cannot be safely rotated per click. |
| Put a reusable token/cookie in the launch URL | 60-second one-time code, immediate server-side redeem, 303 to clean URL | URLs leak into history, referrers, proxies and logs. |
| Expose n8n/OpenClaw directly with new public ingress | Same controlplane ingress and authenticated proxy | Raw services bypass workspace ownership and pod-local trust. |
| Reuse newest-workspace `ViewerPodService` behavior | Exact `workspaceId` plus owner predicate | An account may own multiple workspaces; newest-first can launch the wrong tenant. |
| Send runtime metrics through provisioning Kafka Saga | Snapshot + owner Socket.IO invalidation | Metrics are high-frequency observations, not durable provisioning transitions. |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge architecture, exact tree, product rules and n8n risk | Run `$starci-be-feature-review` on `nivo-agentos-workspace-control-center-r1`. |
| Production implementation | Explicit approval of one Review revision, then `$starci-be-feature-apply`. |
| Live schema, REST, K8s Metrics, Socket.IO and browser proof | Apply runs twin specs, flow e2e, live calls and records `LIVE FLOW PROOF`; no pass claim before then. |

## review — nivo-agentos-workspace-control-center-r2

Review status: NEEDS APPROVAL

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
| App | nivo — `apps/core` customer GraphQL, K8s runtime projection and owner Socket.IO |
| Repo / branch | D:\Repositories\nivo-backend / main |
| Database | PostgreSQL primary connection `POSTGRESQL_PRIMARY`; reuse existing `instance_runtime_snapshots` JSONB projection |
| Purpose | Challenge r1 against real runtime/security contracts and freeze one safe production boundary for Apply. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-workspace-control-center.md |
| Language | vi |
| Phase | review |
| Touching | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-workspace-control-center.md only; no product source |

### REVIEW FINDINGS

| Challenge | Verdict |
|---|---|
| Exact-workspace ownership | PASS with revision: add exact `workspaceId + owner.id` predicate. Existing newest-workspace `ViewerPodService` cannot back this page. |
| Query shape | REVISE: one `myAgentWorkspaceControlCenter(workspaceId)` response includes the latest runtime snapshot. Socket events trigger refetch of this one query; a second public runtime query duplicates auth and response types. |
| Runtime event transport | REVISE: dedicated `InstanceRuntimeTransitionEmitter`, not `ProvisioningTransitionEmitter`, Kafka or Saga. Runtime observations are ephemeral projection changes. |
| Runtime persistence | PASS: existing JSONB `components`/`storage` can hold additive public metrics without a migration. Allocation remains on `instances`; observed usage remains in snapshots. |
| K8s metrics client | FREEZE: use `CustomObjectsApi` from installed `@kubernetes/client-node@0.22.3` against `metrics.k8s.io/v1beta1`; no shelling out to `kubectl`. |
| OpenClaw direct launch | REJECT: chart/source prove OpenClaw is a loopback gateway consumed by controlplane and re-exported through Nivo Socket.IO, not a supported browser application. Card opens the Nivo Agent Console route; no launch grant or proxy. |
| n8n direct launch | BLOCKED/ROUTED: chart pins `1.64.3`. Official n8n advisory `GHSA-v98v-ff95-f3cp` affects `>=0.211.0` and is fixed at `1.122.0`; current npm stable observed during Review is `2.34.6`. Publishing authenticated editor access on `1.64.3` is not approvable. |
| Passwordless grant machinery | DEFER from r2: it has no safe target app until n8n is upgraded and its v2 auth/base-path contract is measured. Implementing dormant auth code now creates an unproved security surface. |
| Frontend app capability | FREEZE: backend returns `accessMode=NIVO_CONSOLE` for OpenClaw and `accessMode=UNAVAILABLE`, reason `SECURITY_UPGRADE_REQUIRED` for n8n. FE never receives credential material. |
| Dependency boundary | PASS: r2 needs no new npm dependency, chart edit, entity or migration. `nivo-charts` has overlapping uncommitted edits, so a major n8n upgrade must get its own Plan/Review/Apply baseline. |

### REVISED CONTRACT

| Surface | r2 contract |
|---|---|
| `myAgentWorkspaceControlCenter(workspaceId: UUID!)` | Owner-only aggregate with workspace identity/status, instance hostname/version, plan/allocation, app capabilities and latest public-safe runtime snapshot. Missing and foreign IDs both throw existing `AgentWorkspaceNotFoundException`. |
| `AgentWorkspaceAppCapability` | Closed `app` values `OPENCLAW`, `N8N`; closed `accessMode` values `NIVO_CONSOLE`, `EXTERNAL_LAUNCH`, `UNAVAILABLE`; `available`, nullable public `reason`, nullable `observedVersion`. r2 emits no `EXTERNAL_LAUNCH` instance until the n8n continuation is approved. |
| Runtime snapshot | Aggregate CPU millicores and memory bytes usage/request/limit; per-container readiness/restarts/last termination reason; pod OOM/throttle indicators; storage and `probeStatus`, `observedAt`, `stale`, `fingerprint`. |
| `workspace.runtime` | Owner-room event containing `workspaceId`, `instanceId`, monotonic in-process sequence, `fingerprint`, `probeStatus`, `observedAt`. Payload invalidates/refetches GraphQL and carries no detailed secret-bearing K8s object. |
| Monitor | Every 30 seconds, active AgentOS instances only, concurrency 5, per-probe timeout 5 seconds; emit only when fingerprint changes. Snapshot is stale at age `>= 90s`. |

### EXACT PRODUCTION TOUCHING — candidate r2

| Path | Action |
|---|---|
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-control-center/index.ts` | ADD exports. |
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-control-center/my-agent-workspace-control-center.module-definition.ts` | ADD configurable query module definition. |
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-control-center/my-agent-workspace-control-center.module.ts` | ADD `CqrsModule`, exact primary repositories and operation providers. |
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-control-center/my-agent-workspace-control-center.query.ts` | ADD query carrying `workspaceId` and authenticated user. |
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-control-center/my-agent-workspace-control-center.handler.ts` | ADD exact owner aggregate and capability projection. |
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-control-center/my-agent-workspace-control-center.service.ts` | ADD thin QueryBus boundary. |
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-control-center/my-agent-workspace-control-center.resolver.ts` | ADD guarded GraphQL query. |
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-control-center/my-agent-workspace-control-center.handler.spec.ts` | ADD twin handler spec. |
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-control-center/graphql-types/index.ts` | ADD GraphQL type exports. |
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-control-center/graphql-types/response.ts` | ADD explicit aggregate/capability/runtime response classes. |
| `src/features/core/api/core/graphql/queries/index.ts` | MODIFY import and register query module in `QUERY_MODULES`. |
| `src/modules/bussiness/instance-operations/types/runtime-snapshot.ts` | MODIFY additive aggregate/container usage and fingerprint types. |
| `src/modules/bussiness/instance-operations/instance-runtime-probe.service.ts` | MODIFY Apps/Core/CustomObjects APIs, quantity parser, timeout and aggregation. |
| `src/modules/bussiness/instance-operations/instance-runtime-snapshot.service.ts` | MODIFY map extended JSON and expose internal exact-instance read. |
| `src/modules/bussiness/instance-operations/instance-runtime-watch.service.ts` | MODIFY fingerprint compare, persist, and dedicated transition emission. |
| `src/modules/bussiness/instance-operations/instance-runtime-transition.emitter.ts` | ADD dedicated runtime transition type/emitter. |
| `src/modules/bussiness/instance-operations/instance-runtime-monitor.service.ts` | ADD scheduled active-AgentOS scan with timeout and bounded concurrency. |
| `src/modules/bussiness/instance-operations/instance-operations.module.ts` | MODIFY register/export complete provider graph. |
| `src/modules/bussiness/instance-operations/instance-runtime-probe.service.spec.ts` | ADD metrics quantity/aggregation/failure boundaries. |
| `src/modules/bussiness/instance-operations/instance-runtime-watch.service.spec.ts` | ADD changed/unchanged fingerprint specs. |
| `src/modules/bussiness/instance-operations/instance-runtime-monitor.service.spec.ts` | ADD app/status/concurrency/cadence specs. |
| `src/modules/platform/socketio/gateways/provisioning/enums.ts` | MODIFY add `workspace.runtime`. |
| `src/modules/platform/socketio/gateways/provisioning/types/message.ts` | MODIFY add public-safe runtime invalidation message. |
| `src/modules/platform/socketio/gateways/provisioning/types/index.ts` | MODIFY export runtime message type. |
| `src/modules/platform/socketio/gateways/provisioning/provisioning.gateway.ts` | MODIFY subscribe dedicated runtime emitter and send owner-room event. |
| `src/modules/platform/socketio/gateways/provisioning/provisioning.gateway.spec.ts` | MODIFY prove owner routing and no unchanged/secret payload. |
| `src/tests/e2e/nivo/agentos-workspace-control-center.e2e-spec.ts` | ADD production GraphQL ownership/schema/empty/stale flow. |

No other backend, frontend or chart path belongs to r2. Existing `apps/agentos-mcp/` remains excluded.

### ACCEPTANCE MATRIX

| Gate | Required evidence |
|---|---|
| Query registration | Unfiltered schema contains exactly `myAgentWorkspaceControlCenter`; live query succeeds for owner. |
| Tenant isolation | Owner A can query each owned workspace; owner B and random UUID receive identical not-found exception identity. |
| Product identity | Non-AgentOS instance and legacy null-instance workspace fail closed; no newest-workspace fallback. |
| Lifecycle | Every workspace state maps capability availability explicitly; only `active` may expose `NIVO_CONSOLE`. |
| Runtime math | Kubernetes `n`, `u`, `m`, Ki/Mi/Gi and decimal CPU quantities parse exactly; all app-pod containers aggregate without floating-point display drift. |
| Runtime failure | Missing Metrics API, RBAC 403, timeout, missing namespace and partial pod data return bounded `probeStatus`; no raw kubeconfig/path/body leaks. |
| Freshness | Ages 89s, 90s and 91s prove stale boundary; same fingerprint emits nothing; changed fingerprint emits once. |
| Socket | Authenticated owner room only; message contains ids/fingerprint/status/time, never image pull secret, env, token, code, cookie or raw K8s object. |
| Module graph | Query is in `QUERY_MODULES`; every monitor/emitter provider is registered; `ScheduleModule.forRoot()` remains exactly once at core root. |
| Gates | `npm run lint:check`, `npm run build`, controlplane build (regression), targeted unit specs, nivo e2e, live GraphQL, live K8s probe and Socket.IO observation. |

### NEXT CAPABILITY ROUTING

| Capability | Required sequence |
|---|---|
| n8n secure editor access | New `starci-be-feature-plan`/chart-aware plan: inventory v1→v2 migrations, backup instance DB, upgrade chart from `1.64.3` to a reviewed stable digest, run n8n migration/security/rollback proof, then plan one-time launch + same-origin proxy against the measured v2 contract. |
| OpenClaw customer use | FE routes the card to the existing Nivo-owned Agent Console/Socket.IO surface. A raw OpenClaw admin UI is not introduced. |

### OUTPUTS

| Concept | Result |
|---|---|
| Review candidate | `nivo-agentos-workspace-control-center-r2`: exact workspace aggregate, continuous K8s runtime projection and owner Socket.IO invalidation. |
| App access decision | OpenClaw is used through Nivo Agent Console; n8n editor remains unavailable until its vulnerable pinned version is upgraded under a separate reviewed capability. |
| Telemetry decision | Dedicated runtime emitter; provisioning Saga/Kafka remains untouched. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-workspace-control-center.md` | `modified` — appended security/architecture review r2 and exact candidate production boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve r2 boundary | Recommended: approve `nivo-agentos-workspace-control-center-r2` and implement safe management/runtime first; alternative: reject r2 and expand Review only after a separate n8n upgrade plan is approved. |
| n8n sequencing | Recommended: show `SECURITY_UPGRADE_REQUIRED` and immediately plan the chart upgrade after this Apply; alternative: remove n8n card entirely until upgrade completes. |

### WARNINGS

| Warning | Impact |
|---|---|
| Chart pins n8n `1.64.3`, while official advisory `GHSA-v98v-ff95-f3cp` identifies a critical authenticated RCE fixed in `1.122.0`; npm stable observed 2026-08-15 is `2.34.6`. | Review refuses to expose the editor or owner session on the pinned image. Proxy authentication cannot repair vulnerable application code. |
| `D:\Repositories\nivo-charts` already has modified `deployment.yaml`, `values.yaml` and untracked quota templates. | A chart upgrade cannot safely join this backend Apply baseline without its own reviewed ownership/diff. |
| Metrics API/RBAC remains unproved live. | Apply may return bounded `unavailable`; it may not claim runtime PASS without a live dev-cluster observation. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| r1 OpenClaw HTTP/WS browser proxy | Nivo Agent Console over the existing controlplane relay/Socket.IO | Live chart/source shows OpenClaw is an internal gateway, not a supported customer web application. |
| r1 n8n launch/proxy against pinned `1.64.3` | `SECURITY_UPGRADE_REQUIRED`, then separate upgrade and measured launch continuation | Official critical RCE evidence makes public editor enablement unsafe. |
| Runtime events through `ProvisioningTransitionEmitter` | Dedicated `InstanceRuntimeTransitionEmitter` | Runtime observations are not provisioning/Saga transitions and must not pollute durable semantics. |
| Two public GraphQL runtime reads | One control-center aggregate refetched on runtime invalidation | Removes duplicate owner checks, response classes and FE waterfall. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of exact candidate revision and production boundary | User states `Duyệt nivo-agentos-workspace-control-center-r2`. |
| Backend source and proof | After approval, run `$starci-be-feature-apply` for r2. |
| Secure n8n editor launch | Complete a separate chart-aware n8n upgrade Plan → Review → Apply, then a measured passwordless-launch continuation. |

## review — nivo-agentos-workspace-control-center-r2-approved

Approved revision: nivo-agentos-workspace-control-center-r2

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
| App | nivo — `apps/core` customer GraphQL, K8s runtime projection and owner Socket.IO |
| Repo / branch | D:\Repositories\nivo-backend / main |
| Purpose | Record explicit owner approval of r2 and freeze its production write boundary for Apply. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-workspace-control-center.md |
| Language | vi |
| Phase | review |
| Touching | Workflow only in Review; Apply production boundary is exactly the 27 backend paths in `EXACT PRODUCTION TOUCHING — candidate r2` above. |

### APPROVAL

| Item | Decision |
|---|---|
| Revision | User explicitly approved `nivo-agentos-workspace-control-center-r2`. |
| Production boundary | Frozen to the 27 exact `D:\Repositories\nivo-backend` paths listed in r2; no frontend, chart, migration, entity, dependency or `apps/agentos-mcp/` path. |
| n8n | Keep capability unavailable with `SECURITY_UPGRADE_REQUIRED`; upgrade and passwordless launch remain a separate workflow. |
| OpenClaw | Customer action routes to the existing Nivo Agent Console; no raw OpenClaw browser proxy. |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved capability | `nivo-agentos-workspace-control-center-r2` is approved for Backend Feature Apply. |
| Approved architecture | Exact-workspace aggregate, K8s runtime snapshot, dedicated runtime emitter and owner Socket.IO invalidation. |
| Approved access state | OpenClaw through Nivo Agent Console; n8n fail-closed pending its security upgrade workflow. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-workspace-control-center.md` | `modified` — appended explicit r2 approval; no product source changed. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Revision and boundary are approved. Apply still performs its required pre-write branch/boundary confirmation. |

### WARNINGS

| Warning | Impact |
|---|---|
| Live K8s Metrics/RBAC remains unproved until Apply. | Apply cannot report runtime PASS without a real dev-cluster observation. |
| Backend worktree contains unrelated untracked `apps/agentos-mcp/`. | Apply must preserve and exclude it from baseline scope and tracked feature diff. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | r2 approved as presented | No further Review rejection was submitted. |

### OWED

| Owed | Cleared by |
|---|---|
| Implement approved backend boundary | Run `$starci-be-feature-apply` for `nivo-agentos-workspace-control-center-r2`. |
| Prove unit/e2e/schema/K8s/Socket runtime | Apply executes and records every approved acceptance gate. |

## apply — nivo-agentos-workspace-control-center-r2

Applied revision: nivo-agentos-workspace-control-center-r2

Baseline commit: 9e83ec4e264e7556166421ecd39d1b7a126c1cdb

Tracked diff: 9e83ec4e264e7556166421ecd39d1b7a126c1cdb..worktree

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
| App | nivo — `apps/core` customer GraphQL, K8s runtime projection and owner Socket.IO |
| Repo / branch | D:\Repositories\nivo-backend / main |
| Database | PostgreSQL primary connection `POSTGRESQL_PRIMARY`; reuse existing `instance_runtime_snapshots` JSONB projection |
| Purpose | Implement and prove the approved exact-workspace control center and runtime projection. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-workspace-control-center.md |
| Language | vi |
| Phase | apply |
| Touching | Exactly the 27 backend paths frozen in Review r2; workflow evidence may also be appended here. |

### BASELINE

| Evidence | Result |
|---|---|
| `git status --short` before baseline | Only unrelated untracked `apps/agentos-mcp/`; no tracked changes. |
| Baseline | Empty commit `9e83ec4e264e7556166421ecd39d1b7a126c1cdb`; unrelated untracked directory was not staged. |

### PROOF

| Gate | Command / observation | Result |
|---|---|---|
| Scope | `git diff --name-only 9e83ec4e...` plus non-ignored untracked files, excluding pre-existing `apps/agentos-mcp/` | PASS — exactly 27 approved paths. |
| Lint | `npx eslint "{src,apps}/**/*.ts" --quiet` | PASS — exit 0, zero errors. Feature-path lint also ran unfiltered with zero warnings. |
| Core build | `npm run build` | PASS. |
| Control-plane regression | `npm run build:controlplane` | PASS. |
| Twin unit specs | Targeted Jest for handler, K8s probe/watch/monitor and provisioning gateway | PASS — 5 suites, 38 tests. |
| Flow e2e | `npx jest --config src/tests/e2e/jest-e2e.js --runInBand --runTestsByPath src/tests/e2e/nivo/agentos-workspace-control-center.e2e-spec.ts` | PASS — 1 suite, 3 tests: owner payload, empty runtime, foreign/missing indistinguishability. |
| Live schema | Unauthenticated introspection against `http://localhost:3067/graphql` | PASS — schema contains exactly one `myAgentWorkspaceControlCenter` query field. |
| Tino cluster | `kubectl ... get nodes`, `get apiservice v1beta1.metrics.k8s.io`, `top nodes` | PASS — 3/3 nodes Ready; Metrics API Available; node CPU/RAM returned. |
| Live cleanup | Temporary live user/rows/namespace removed after proof | PASS — zero `r2-live-*` instance rows; no temporary namespace remains. |

### LIVE FLOW PROOF

| Surface | Persona / steps | Evidence | Verdict |
|---|---|---|---|
| GraphQL owner query | Ephemeral local Keycloak test owner -> exact active AgentOS workspace -> `myAgentWorkspaceControlCenter(workspaceId)` | Owner query true; OpenClaw `NIVO_CONSOLE`; n8n `SECURITY_UPGRADE_REQUIRED`; runtime `probeStatus=available`, `stale=false`, no error. | PASS |
| K8s monitor | Backend restarted from r2 build with explicit Tino kubeconfig -> 30-second monitor -> Metrics API snapshots | Three real active workspaces persisted `ready/available`; each had 7 components and 4 storage records; CPU/RAM/restarts were non-synthetic live values. | PASS |
| Socket.IO | Authenticated owner socket subscribed before monitor tick -> dedicated runtime emitter -> owner room | Received `workspace.runtime`; workspace/instance matched; monotonic integer sequence present; event fingerprint matched authoritative GraphQL query. Exact keys: `fingerprint`, `instanceId`, `observedAt`, `probeStatus`, `sequence`, `workspaceId`; no secret-bearing fields. | PASS |
| Browser regression | Existing Nivo Google test session -> `/en/agentos` after backend restart | Workspace list and request journey rendered; browser Console had zero warning/error entries. The backend-only r2 aggregate is not yet consumed by FE. | PASS |
| Terminal | Backend startup, Kafka subscription, GraphQL route and WebSocket namespace observed | App started successfully on 3067; no r2 runtime exception. | PASS |

### OUTPUTS

| Concept | Result |
|---|---|
| Implemented capability | `nivo-agentos-workspace-control-center-r2` — owner-only exact workspace aggregate, continuous public-safe K8s runtime projection and owner Socket.IO invalidation. |
| App access contract | OpenClaw routes through Nivo Console; n8n remains fail-closed until its separately reviewed security upgrade. |
| Runtime contract | 30-second cadence, concurrency 5, 5-second timeout, stale at `>=90s`, stable fingerprint dedupe and bounded error text. |

### CHANGES

| Tree | Details |
|---|---|
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-control-center/index.ts`; `my-agent-workspace-control-center.module-definition.ts`; `my-agent-workspace-control-center.module.ts`; `my-agent-workspace-control-center.query.ts`; `my-agent-workspace-control-center.handler.ts`; `my-agent-workspace-control-center.service.ts`; `my-agent-workspace-control-center.resolver.ts` | Added the complete guarded CQRS query vertical. |
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-control-center/graphql-types/index.ts`; `graphql-types/response.ts` | Added explicit workspace, instance, app-capability and runtime GraphQL types. |
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-control-center/my-agent-workspace-control-center.handler.spec.ts` | Added exhaustive identity, lifecycle, product and 89/90/91-second freshness twin cases. |
| `src/features/core/api/core/graphql/queries/index.ts` | Registered the query module in `QUERY_MODULES`. |
| `src/modules/bussiness/instance-operations/types/runtime-snapshot.ts` | Extended public runtime types and stable fingerprinting. |
| `src/modules/bussiness/instance-operations/instance-runtime-probe.service.ts`; `instance-runtime-snapshot.service.ts`; `instance-runtime-watch.service.ts` | Added live Apps/Core/Metrics aggregation, historical JSONB normalization, bounded failures, dedupe persistence and changed-only emission. |
| `src/modules/bussiness/instance-operations/instance-runtime-transition.emitter.ts`; `instance-runtime-monitor.service.ts`; `instance-operations.module.ts` | Added dedicated emitter, bounded scheduled monitor and complete provider registration/export graph. |
| `src/modules/bussiness/instance-operations/instance-runtime-probe.service.spec.ts`; `instance-runtime-watch.service.spec.ts`; `instance-runtime-monitor.service.spec.ts` | Added quantity, aggregation, OOM, partial/unavailable/timeout, no-leak, fingerprint, cadence and concurrency proof. |
| `src/modules/platform/socketio/gateways/provisioning/enums.ts`; `types/message.ts`; `types/index.ts`; `provisioning.gateway.ts`; `provisioning.gateway.spec.ts` | Added typed `workspace.runtime` owner-room relay and exact public-safe payload proof. |
| `src/tests/e2e/nivo/agentos-workspace-control-center.e2e-spec.ts` | Added production GraphQL success, empty-runtime and tenant-isolation flow. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Approved r2 is implemented and proved. |

### WARNINGS

| Warning | Impact |
|---|---|
| `.env.local` still names the retired Kind kubeconfig while `.env.override` names Tino. The live backend was started with explicit `EXPERT_KUBECONFIG=.../tino.kubeconfig`. | Starting the backend without the override may return bounded `probeStatus=unavailable`; consolidate env precedence in a separate configuration change. |
| E2E boot prints pre-existing Qdrant client/server compatibility, negative timer and unavailable data-git/self-hosted-embedding warnings. | No r2 gate failed; these are outside the approved 27-path boundary and remain visible rather than suppressed. |
| Existing untracked `apps/agentos-mcp/` remains untouched. | Preserved user work; excluded from baseline and feature diff. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Raw K8s error bodies/paths in GraphQL | Stable `k8s probe unavailable`, `k8s probe timed out`, `k8s metrics unavailable` reasons | Prevents cluster detail leakage. |
| n8n direct editor launch on pinned `1.64.3` | `UNAVAILABLE / SECURITY_UPGRADE_REQUIRED` | Matches approved r2 security decision. |
| Runtime events through Saga/Kafka emitter | Dedicated in-process runtime emitter | Runtime snapshots are projections, not durable provisioning transitions. |

### OWED

| Owed | Cleared by |
|---|---|
| Backend r2 implementation and proof | Cleared. |
| Frontend consumption of the aggregate and `workspace.runtime` refetch | Separate FE Design Review/Apply capability; not part of this backend r2 boundary. |
| n8n stable upgrade and passwordless launch | Separate chart-aware backend/security workflow; deliberately not part of r2. |
