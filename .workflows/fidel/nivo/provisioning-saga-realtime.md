<!-- starci-workflow: v2 -->

## start

Session id: `nivo-provisioning-saga-realtime-20260815`

Session status: open

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\nivo-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | Nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Repo / branch | D:\Repositories\nivo-fe / session/surface-branch-and-dead-vocabulary @ 242b75ca7d962e63d463d18cd9a5c36359f579ab |
| Purpose | Nối event Saga chuẩn vào hành trình provisioning hiện hữu và chứng minh trên runtime thật. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\nivo\provisioning-saga-realtime.md |
| Language | vi |
| Phase | start |
| Touching | workflow; `apps/app/src/modules/realtime/provisioning.ts`; hai block provisioning và test liên quan nếu contract yêu cầu |

### BINDING EVIDENCE

| Identity | Frozen value |
|---|---|
| Request | Saga ghi DB/outbox, phát Kafka, consumer chuyển thành Socket.IO để UI/UX render tiến trình. |
| Backend contract | `provisioning.saga.status` gồm `eventId`, `sequence`, `sagaId`, `resourceKind`, `resourceId`, `status`, `direction`, `stepKey`, `reason`, `updatedAt`. |
| Existing owner | `apps/app/src/modules/realtime/provisioning.ts` và hai block `AgentOSProvisioning`, `TemplateAppProvisioning`. |
| Route | `/en/agentos/.../provisioning` và `/en/apps/.../provisioning` theo route hiện hữu. |
| Origin | `http://localhost:3066` |
| Viewport / locale / theme | Browser hiện tại, desktop, `en`, theme hiện tại. |
| Auth persona | Tài khoản test Nivo local đã đăng nhập. |
| Baseline identity | FE `242b75ca7d962e63d463d18cd9a5c36359f579ab`; giữ nguyên unrelated dirty worktree. |

### OUTPUTS

| Concept | Result |
|---|---|
| Active correction | Đang nối event Saga chuẩn vào reducer realtime hiện hữu với dedupe/order và fallback event cũ. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/nivo/provisioning-saga-realtime.md` | added — mở fidelity session và khóa bằng chứng. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Yêu cầu “làm hết” đã cho phép correction trong boundary. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE đang có nhiều thay đổi chưa commit từ luồng trước. | Chỉ chỉnh đúng owner realtime/blocks, không ghi đè phần ngoài scope. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | None |

### OWED

| Owed | Cleared by |
|---|---|
| Source correction, focused gates and live browser proof | Recorded in the following feedback event. |

## feedback

Feedback: Saga -> Kafka -> consumer -> Socket.IO phai render UX/UI dung ngay, khong doi reload; lam den khi full gate pass.

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\nivo-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | Nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Repo / branch | D:\Repositories\nivo-fe / session/surface-branch-and-dead-vocabulary @ 242b75ca7d962e63d463d18cd9a5c36359f579ab |
| Purpose | Correct canonical Saga realtime consumption and prove no-refresh UX. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\nivo\provisioning-saga-realtime.md |
| Language | vi |
| Phase | feedback |
| Touching | `apps/app/src/modules/realtime/provisioning.ts`; workflow nay. |

Session id: `nivo-provisioning-saga-realtime-20260815`

Session status: open

### EVIDENCE

| Surface | Proof |
|---|---|
| Root cause | Socket gateway wraps payload as `{ success: true, data }`; FE reducer previously read it as a flat event, so canonical Saga events were silently ignored. |
| Source correction | Added envelope unwrap for every provisioning event; canonical `provisioning.saga.status`; exact resource matching; monotonic `sequence` guard with timestamp fallback; retained legacy events. |
| Live flow | Created Template App `4d50e1a7-1b6c-41f1-9039-bd824d564f85`; Saga exhausted three Helm attempts, compensated secrets/model key/release, published ten outbox events and consumer persisted ten inbox events. |
| No-refresh UI | While the page showed Build infrastructure, a canonical Kafka compensation event reached Socket.IO and the same mounted page changed to `Provisioning needs attention` with the exact Helm failure. |
| Console | No product error. Only Next development Fast Refresh warning caused by editing an imported module during the session. |
| Terminal | BE consumer subscribed; authenticated socket probe received `compensated`; API stayed running. |

### COMMANDS

| Command / action | Result |
|---|---|
| `npm run lint -w @nivo/app` | PASS, zero findings. |
| `npm run typecheck -w @nivo/app` | PASS. |
| `npm run build -w @nivo/app` | PASS; compiled, typechecked and generated 14/14 pages. |
| Browser DOM + screenshot | PASS; top journey and exact terminal failure visibly rendered without reload. |
| Direct socket + Kafka probe | PASS; connected owner received canonical `compensated` event. |

### OUTPUTS

| Concept | Result |
|---|---|
| Realtime reducer | Canonical Saga events now drive both AgentOS and Template App journeys with ordering/dedupe. |
| Compatibility | Wrapped and flat payloads plus legacy event families remain accepted. |
| UX terminal | Compensated states map to needs-attention; completed maps to management-ready state. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\nivo-fe\apps\app\src\modules\realtime\provisioning.ts` | modified -- envelope unwrap, canonical Saga event, exact target matching and monotonic ordering. |
| this workflow | modified -- live UI, Console, terminal and gate proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Correction and proof are complete; session remains open until explicit fidelity finality. |

### WARNINGS

| Warning | Impact |
|---|---|
| Next reports existing `middleware` convention as deprecated. | Build passes; outside this correction. |
| FE contains previously approved provisioning page/component work. | Preserved; this correction touched only realtime owner. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| FE connecting directly to Kafka | Owner-scoped Socket.IO relay | Browser credentials and Kafka protocol remain server-side. |
| Refresh-only reconciliation | Canonical live event plus domain query fallback | Journey must move without reload. |

### OWED

| Owed | Cleared by |
|---|---|
| Fidelity closure | Owner acceptance followed by fidelity End/Finality; no source correction remains owed. |

## feedback live-ready

Feedback: Prove the successful Template App journey all the way to management on the real Tino cluster.

Session id: `nivo-provisioning-saga-realtime-20260815`

Session status: open

### LIVE FLOW PROOF

| Surface | Proof |
|---|---|
| Resource | Site `79541977-cd9c-4ad5-ab37-73b87166ba42`, deployment `273da8c6-0622-48ea-82dd-f4cf0a0a0d2f`, Saga `7955f6e3-ac4a-4956-ad74-ea2e55fbfdb7`. |
| Initial UI | Mounted route `/en/apps/79541977-cd9c-4ad5-ab37-73b87166ba42/provisioning` rendered `Kubernetes is building`. |
| Realtime | 7 outbox events were published and 7 inbox events were consumed/relayed; the same mounted page moved to `Ready to manage` without reload. |
| Journey | Request Done -> Create app Done -> Build infrastructure Done -> Manage Current. |
| Management | Pressing `Manage apps` reached `/en/apps`; `live-saga-green-1786758256346` rendered as `Running`. |
| Kubernetes | Every Deployment/StatefulSet is Ready and both Let's Encrypt certificates are Ready. |
| Public runtime | Expert web HTTPS 200; tenant Keycloak `nivo` OIDC discovery HTTPS 200; both validate TLS. |
| Console | No new console error during this successful flow. The tab retains one older authentication-page hydration mismatch from before this run; it is not attributed to provisioning realtime. |
| Terminal | Successful run logged Keycloak convergence and Ready outcome. Previous failed attempts demonstrated compensation but are not counted as the happy-path verdict. |
| Verdict | PASS: Saga -> Kafka -> consumer -> Socket.IO renders the successful UX and reaches management without reload. |

### OWED

| Owed | Cleared by |
|---|---|
| Fidelity closure | Owner acceptance followed by Fidelity End and Finality. The session intentionally remains open. |

### OWED

| Owed | Cleared by |
|---|---|
| Source correction, focused gates và live browser proof | Typecheck/lint/test/build, browser UI/Network/Console và BE terminal. |

## feedback live-agentos

Feedback: Prove the paid AgentOS journey with public images and keep the mounted page convergent when a terminal socket event is missed.

Session id: `nivo-provisioning-saga-realtime-20260815`

Session status: open

### LIVE FLOW PROOF

| Surface | Proof |
|---|---|
| First observation | Order `97ff54ba-efad-452e-883e-70903bce5694` reached Saga `completed` and K8s Ready, but the mounted page remained on `Kubernetes is building` until reload. |
| Root gap | The connected blocks had a one-time reconnect snapshot and realtime fast path, but no durable snapshot recovery while already in `preparing`. A reconnect/missed terminal event could therefore leave the tab stale. |
| Correction | Added four-second owner-scoped snapshot recovery only while `preparing` in both AgentOS and Template App blocks; timers stop at ready/failed. |
| Verification resource | Order `1d967cdb-d2e9-4f1d-84d0-880206eb5478`; workspace `c3fa9911-f693-4132-8fdb-2ad2386278ed`; Saga `887ae6a4-2bf6-42b2-8725-a28892562c31`. |
| Realtime pipeline | 7/7 transactional outbox rows published in one attempt and 7/7 inbox rows consumed/relayed through the owner Socket.IO gateway. |
| No-refresh UI | The same mounted order page advanced from `Kubernetes is building` to `Ready to manage` after Saga completion, without navigation or reload. |
| Kubernetes | AgentOS 4/4, PostgreSQL 1/1, Qdrant 1/1 and MinIO 1/1 Ready. Controlplane pulled `ghcr.io/starci-lab/nivo-agentos-controlplane:0ecdf00`; database/object storage used `bitnamilegacy`. |
| Capacity | No `cluster_capacity_action_items` row was created during verification; no Tino VPS was purchased. |
| Wallet | Each approved test flow charged exactly `₫490.000` from local Nivo test credit. |
| Gates | Targeted ESLint PASS; app lint PASS; production build/typecheck PASS with 14/14 pages; diff check clean apart from line-ending notices. |
| Runtime warning | Early pod token delivery attempts before Deployment readiness log a non-terminal HTTP warning; credentials remain stored/synced and final workloads are Ready. |
| Verdict | PASS for paid AgentOS request -> Saga -> public-image K8s Ready -> Kafka/inbox relay -> no-refresh terminal UI convergence. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\nivo-fe\apps\app\src\components\blocks\provisioning\AgentOSProvisioning\index.tsx` | modified -- preparing-state canonical snapshot recovery. |
| `D:\Repositories\nivo-fe\apps\app\src\components\blocks\provisioning\TemplateAppProvisioning\index.tsx` | modified -- matching recovery. |
| this workflow | modified -- recorded the failed first observation and successful second no-refresh proof. |

### WARNINGS

| Warning | Impact |
|---|---|
| AgentOS has no dedicated workspace detail/operations route in the current FE route tree. | `Manage AgentOS` reaches the management list; detailed reset/upgrade/backup controls remain a separate approved design/apply capability. |

### OWED

| Owed | Cleared by |
|---|---|
| Fidelity closure | Owner acceptance followed by Fidelity End and Finality; session remains open. |
