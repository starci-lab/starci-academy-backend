<!-- starci-workflow: v2 -->
# Nivo lifecycle operations — FE design plan

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\nivo-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo / @nivo/app |
| Repo / branch | D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary |
| Purpose | Chốt hierarchy, CTA, disclosure và guardrail cho downgrade, reset VPS, upgrade pod, backup/restore, reprovision/rebuild và fleet upgrade. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\lifecycle-operations.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này và `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\lifecycle-operations\r1\index.html`. |

### EVIDENCE

| Evidence | Finding | Classification |
|---|---|---|
| FE source | Đã có provisioning route/page và shared realtime provisioning, nhưng chưa có surface thao tác lifecycle cho resource. | REUSE realtime/status; ADD operation surface. |
| Backend source | Có `wipeInstance`, `reprovisionInstance`, `rebuildInstance`, backup verify/authorisation và fleet-upgrade contracts; các thao tác có mức nguy hiểm khác nhau. | Backend contract is source of truth; FE không tự hứa Ready. |
| Existing design evidence | `app-provisioning-dashboard` đã có resource detail, activity, danger zone và trạng thái running/suspended/failed. | REUSE visual language; EXTEND actions + operation timeline. |
| Product boundary | AgentOS là app riêng; academy/MMO là Template App catalogue, nhưng thao tác dùng chung theo `InstanceEntity`/resource lifecycle. | REUSE shell; branch labels/capabilities by app. |

### CONTRACT INVENTORY

| Surface/key | Classification | Plan |
|---|---|---|
| Resource detail shell | REUSE | Giữ route và shell resource hiện có. |
| Lifecycle status/realtime | REUSE + EXTEND | Dùng snapshot/socket hiện có; bổ sung operation identity, phase và honest failure. |
| Activity timeline | EXTEND | Dùng composite activity nếu contract hiện tại đáp ứng; nếu chưa có event projection thì backend feature plan riêng, không giả dữ liệu. |
| Danger Zone | REUSE + EXTEND | Chỉ hiện hành động mà resource/app capability cho phép; reset/rebuild yêu cầu verified backup. |
| Operation confirmation | NEW composite | Modal/wizard dùng cho downgrade, reset, upgrade và restore; không gọi trực tiếp shell. |
| Operations center | NEW optional page | Chỉ cần nếu chọn hướng B; phải có query/job contract trước Apply. |

### DIRECTIONS

| Direction | Quyết định chính | Phù hợp |
|---|---|---|
| A — Resource detail | Action-first ngay trên resource; activity và guardrail là secondary. | Người dùng quản lý một app/resource, thao tác thường xuyên. |
| B — Operations center | Queue-first, gom mọi operation nhiều resource vào một nơi. | Operator quản lý fleet; cần query operation list và filter. |
| C — Guided action | Wizard-first, mọi thao tác có bước impact → confirm → live progress. | Downgrade/reset/restore có rủi ro cao; an toàn nhất nhưng chậm hơn. |

### PREVIEW TRACKING

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| lifecycle-operations-r1 | `http://127.0.0.1:8098/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\lifecycle-operations\r1\index.html` | `C6F85433A165832684532585284DA91570379FBE336D7E03846BA0F5AEE89862` | đang chờ |

| Direction | Tab | Status |
|---|---|---|
| A-resource-detail | A · Resource detail | đang chờ |
| B-operations-center | B · Operations center | đang chờ |
| C-guided-action | C · Guided action | đang chờ |

### OUTPUTS

| Concept | Result |
|---|---|
| Lifecycle operations brief | Đã tách rõ resource context, fleet queue và guided guardrail thành 3 hướng có thể implement. |
| Direction preview | Một preview HTML có 3 tab, responsive mobile state và static states cho running, preparing, queued, warning. |
| Backend-aware boundary | Không hứa contract mới ngoài backend; Operations center chỉ là lựa chọn nếu API operation list được plan riêng. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\lifecycle-operations.md` | `added` — workflow plan r1. |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\lifecycle-operations\r1\index.html` | `added` — disposable tabbed preview; không phải production source. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Hướng UI lifecycle operations | **Chọn A — Resource detail** (khuyến nghị, giữ context và tận dụng shell hiện có); B — Operations center; C — Guided action. Chọn một tab sau khi xem `http://127.0.0.1:8098/`. |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend chưa có bằng chứng rằng mọi operation có chung operation-list GraphQL contract. | Không nên chọn B rồi tự tạo queue API trong FE Apply; nếu chọn B sẽ cần backend feature plan tương ứng. |
| Reset VPS/rebuild là thao tác phá huỷ. | UI chỉ được mở CTA sau verified backup và phải hiển thị impact/confirmation rõ ràng. |
| Preview là static design evidence. | Không đại diện cho GraphQL/Socket live behavior và không được đưa vào production. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Chưa có | Chưa có | Chờ lựa chọn direction. |

### OWED

| Owed | Cleared by |
|---|---|
| User chọn một direction A/B/C | Ghi selected direction, reason, acceptance states và rejections vào workflow; sau đó mời `$starci-fe-design-review`. |
| Exact operation capability matrix per app | Review đối chiếu từng action với `ProvisionableAppEntity`/`InstanceEntity` và GraphQL/HTTP contracts trước Apply. |

## plan revision 2

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\nivo-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo / @nivo/app |
| Repo / branch | D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary |
| Purpose | Cập nhật hướng A theo feedback: có ví dụ Update pod và render chi tiết Helm stack, ưu tiên database Bitnami legacy nhưng giữ đường scale. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\lifecycle-operations.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này và D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\lifecycle-operations\r1\index.html. |

### SELECTED DIRECTION

| Decision | Result |
|---|---|
| Selected | A — Resource detail |
| Reason | Giữ context của resource, action Update pod nằm ngay cạnh runtime snapshot; phù hợp thao tác thường xuyên nhưng vẫn có danger zone cho reset/rebuild. |
| Update pod | Hiển thị chart/version diff, rolling update, replicas và phase realtime; không gộp scale vào cùng mutation. |
| Helm stack | Render web/api/worker, database, cache và ingress với replicas, readiness, PVC, version và impact. |
| Database policy | Ưu tiên Bitnami legacy cho compatibility hiện tại; giữ PVC/release identity và đánh dấu `scale-ready` để mở đường scale sau. Đây là UI/product decision, chưa đổi chart/backend. |

### PREVIEW TRACKING

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| lifecycle-operations-r1 revised | http://127.0.0.1:8098/ | D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\lifecycle-operations\r1\index.html | 201E2F59E5AD8F52DA790E567E2C4744C0C901804D9FC64E274205D418EAF32F | đã chọn A |

| Direction | Tab | Status |
|---|---|---|
| A-resource-detail | A · Resource detail | đã chọn |
| B-operations-center | B · Operations center | đã từ chối cho revision này |
| C-guided-action | C · Guided action | đã từ chối cho revision này |

### ACCEPTANCE STATES

| State | Must show |
|---|---|
| Running resource | Helm release identity, chart version, component health và current replicas. |
| Update pod | Version/values diff, rolling impact, current phase và realtime progress. |
| Database | Bitnami legacy label, StatefulSet/PVC identity, data-preservation warning và scale-ready hint. |
| Reset/rebuild | Danger Zone, verified-backup gate, impact summary và confirmation riêng. |
| Failed | Honest failed state, reason hữu ích, retry/support; không expose shell/K8s internals như CTA copy. |

### OUTPUTS

| Concept | Result |
|---|---|
| Selected direction | A — Resource detail được user chốt. |
| Refined operation model | Update pod là operation riêng; scale không bị gộp vào update. |
| Helm visibility | Preview đã có stack detail đủ cho web/api/worker, Bitnami legacy database/cache, PVC, ingress, replicas và readiness. |

### CHANGES

| Tree | Details |
|---|---|
| D:\Repositories\starci-academy-backend\.workflows\designs\nivo\lifecycle-operations.md | modified — appended plan revision 2 và ghi lựa chọn A. |
| D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\lifecycle-operations\r1\index.html | modified — thêm Helm stack render và Update pod impact example; vẫn là disposable preview. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Direction A và các yêu cầu Update pod/Helm/Bitnami legacy đã được ghi nhận; chuyển sang `$starci-fe-design-review`. |

### WARNINGS

| Warning | Impact |
|---|---|
| Bitnami legacy là compatibility choice trong UI plan | Không được coi là approval để đổi chart hoặc deploy database; backend/Helm implementation cần feature review riêng. |
| Helm stack preview là read model | Apply chỉ render dữ liệu mà GraphQL/Socket contract cấp; thiếu field phải quay lại Review, không hardcode snapshot. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| B — Operations center | A — Resource detail | Giữ context và không cần invent operation-list contract trong FE. |
| C — Guided action làm shell chính | A + confirmation composite cho thao tác nguy hiểm | Wizard chỉ dùng ở reset/rebuild/downgrade cần guardrail, không bọc mọi thao tác thường xuyên. |

### OWED

| Owed | Cleared by |
|---|---|
| Component/props delta và contract challenge | Chạy `$starci-fe-design-review` trên direction A revision 2. |
| Xác nhận fields Helm stack có thật trong GraphQL/Socket | Review inventory backend contracts và freeze exact props trước Apply. |

Invite: `$starci-fe-design-review`

## review

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\nivo-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo / @nivo/app |
| Repo / branch | D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary |
| Purpose | Freeze Resource Detail operations, Helm stack read model, action guardrails và realtime ownership trước Apply. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\lifecycle-operations.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này và review evidence; không viết production source. |

### REVIEW VERDICT

| Decision | Verdict |
|---|---|
| Product direction | APPROVED — A, Resource Detail operations. |
| Realtime owner | APPROVED — Nivo BE probes/watches K8s and publishes snapshot + Socket.IO deltas; FE never reads kubeconfig or calls K8s. |
| Update pod | APPROVED — one explicit operation with chart/version/values diff, rolling impact and live phase. Scale remains a separate operation. |
| Helm stack | APPROVED — backend read model exposes component health, replicas, PVC/storage and release/chart identity. FE renders the projection, not raw Helm internals. |
| Database policy | APPROVED — Bitnami legacy is the current compatibility label; preserve PVC/release identity and expose future scale capability without implementing scale in this Apply. |
| Apply readiness | BLOCKED until the exact backend read/action contract below exists and is proven. This is a routing finding, not permission to invent FE fallback data. |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | Template App resource route | REUSE | `apps/app/src/app/[locale]/(console)/apps/[siteId]/provisioning/page.tsx` | same | Next route mounts TemplateAppProvisioningPage | route identity only | Keep re-entry URL stable while expanding the resource screen. |
| page | TemplateAppProvisioningPage | MODIFY | `apps/app/src/components/pages/TemplateAppProvisioningPage/index.tsx` + `component.tsx` | same | resource route | page composes journey, operations and stack blocks; no fetch | Preserve page → block composition and independent block landing. |
| block | TemplateAppProvisioning | MODIFY | `apps/app/src/components/blocks/provisioning/TemplateAppProvisioning/index.tsx` + `component.tsx` | same | page journey slot | existing request/create/publish/provision states + exact deployment realtime | Keep the existing request journey as the first domain block. |
| block | TemplateAppOperations | ADD | none | `apps/app/src/components/blocks/operations/TemplateAppOperations/index.tsx` + `component.tsx` | page operations slot | resource snapshot, allowed actions, operation state, error/retry | Owns the domain meaning of Update pod, downgrade, backup, reset and rebuild. |
| block | HelmStackSnapshot | ADD | none | `apps/app/src/components/blocks/operations/HelmStackSnapshot/index.tsx` + `component.tsx` | page stack slot | backend-projected Helm release/components/PVC/readiness | Keeps detailed stack data independent from action controls. |
| composite | OperationActionRail | ADD | none | `packages/ui/src/composites/OperationActionRail/index.tsx` | TemplateAppOperations | closed action grouping; no domain fetch | Reusable arrangement for safe actions and Danger Zone entry. |
| composite | HelmComponentStatusTable | ADD | none | `packages/ui/src/composites/HelmComponentStatusTable/index.tsx` | HelmStackSnapshot | closed component rows with named slots | Reuses the same stack anatomy across Template App and AgentOS. |
| overlay | OperationConfirmDialog | ADD | none | `packages/ui/src/shells/OperationConfirmDialog/index.tsx` | action rail | confirmation, impact summary, required acknowledgement, submit/cancel | Destructive semantics belong to an interaction shell, not a card or leaf. |
| branch | resource-detail-operations layout | ADD | none | `packages/ui/src/contracts/index.ts` + existing Tree contract registry | TemplateAppProvisioningPage | journey over operations over stack; responsive collapse | The page topology must be named, not assembled with literal layout classes. |
| leaf | operation status / stack status | REUSE | existing `Badge`, `Text`, `Button`, `Field` leaves | same | composites/blocks | existing props/on/isLoading boundaries | No duplicate vendor wrappers for status or controls. |
| shell | Console shell/sidebar | REUSE | `apps/app/src/components/layouts/ConsoleNav/index.tsx` | same | console layout | navigation remains outside resource content | Operations journey stays in main content, not sidebar. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| TemplateAppProvisioningPage | page composition | KEEP | `mode: new | resume` | resource route | Existing request/re-entry tests remain green. |
| TemplateAppProvisioning | view state | KEEP | existing `TemplateFlow` states and `TemplateAppProvisioningViewProps.state` | same | existing provisioning route | Existing authenticated provisioning flow remains unchanged. |
| TemplateAppOperations | connected input | ADD | none | `{ siteId: string }` | TemplateAppProvisioningPage | Connected twin fetches by resource identity; pure twin receives settled state only. |
| TemplateAppOperations | state union | ADD | none | `loading | ready | action_pending | failed | unavailable` | connected block | Every action state is explicit; no boolean matrix. |
| TemplateAppOperations | pure props | ADD | none | `resource`, `actions`, `activeOperation`, `lastError`, `realtimeState` | `_TemplateAppOperations` only | Fixture matrix covers running, pending, failed, unavailable and no-permission. |
| TemplateAppOperations | actions API | ADD | none | `updatePod`, `changePlan`, `backup`, `resetVps`, `rebuild`, `retry` with capability guards | connected block → backend mutations | Each action maps to one backend operation and never shells from FE. |
| OperationActionRail | props/on | ADD | none | `{ actions, pendingOperation, onAction }` | TemplateAppOperations | Closed composite receives resolved action states; no fetch and no domain interpretation. |
| HelmStackSnapshot | connected input | ADD | none | `{ instanceId: string }` | page or operations block after instance identity resolves | Snapshot query keyed by instance; no K8s client in FE. |
| HelmStackSnapshot | pure props | ADD | none | `release`, `chart`, `components`, `storage`, `observedAt`, `state` | `_HelmStackSnapshot` | No displayed field exists unless present in backend projection. |
| HelmComponentStatusTable | slots/data | ADD | none | named `component` repeated slot with `key`, `kind`, `status`, `readyReplicas`, `desiredReplicas`, `image`, `storage` | HelmStackSnapshot | Contract registry and pure fixture prove repeated rows and empty/loading states. |
| OperationConfirmDialog | interaction API | ADD | none | `operation`, `impact`, `requiresVerifiedBackup`, `isOpen`, `isPending`; `confirm`, `dismiss` | OperationActionRail | Reset/rebuild cannot confirm without verified-backup evidence. |
| resource-detail-operations layout | layout contract | ADD | none | named contract for journey over operations over stack; responsive collapse state is owned by the contract | TemplateAppProvisioningPage | Contract registry proves page topology without literal structural classes. |
| console API | read/action contracts | ADD | existing coarse `myInstances` only | `myResourceOperations(instanceId)`, `myHelmStack(instanceId)` and operation mutations with typed result envelopes | connected blocks | Backend GraphQL schema introspection + twin HTTP flow before FE Apply. |
| realtime module | operation target/event | RETYPE | provisioning deployment/workspace target only | resource operation target with `operationId`, `instanceId`, `phase`, `observedAt`, `reason` | connected blocks | Socket event is applied only to matching resource/operation; reconnect reconciles GraphQL snapshot. |

### EXACT BACKEND CONTRACT REQUIRED BEFORE APPLY

| Contract | Required fields | Owner |
|---|---|---|
| Resource operation snapshot | `instanceId`, `appKey`, `status`, `capabilities`, `activeOperation`, `lastError`, `observedAt` | Nivo BE lifecycle/query feature |
| Helm stack projection | `releaseName`, `namespace` or public-safe identifier, `chartName`, `chartVersion`, `components[]`, `storage[]`, `observedAt` | Nivo BE K8s probe/watch projection |
| Component row | `key`, `kind`, `status`, `desiredReplicas`, `readyReplicas`, `image`, `pvcSize`, `storagePolicy` | Nivo BE |
| Action result | `operationId`, `instanceId`, `phase`, `acceptedAt`, `reason` | Nivo BE mutation boundary |
| Realtime delta | matching `operationId`/`instanceId`, `phase`, `componentKey?`, `observedAt`, `reason?` | Nivo BE Socket.IO gateway |

### ACCEPTANCE EVIDENCE

| Proof | Required result |
|---|---|
| Resource screen | Existing request/provision journey remains visible above operations; sidebar unchanged. |
| Update pod | User sees chart/version/values impact, submits once, sees operation pending → running → ready/failed from BE snapshot/event. |
| Helm stack | UI renders web/api/worker, Bitnami legacy databases/cache, ingress, replicas/readiness and PVC only from BE projection. |
| Reconnect | Socket disconnect/reconnect rehydrates from GraphQL and ignores unrelated operation IDs. |
| Backup gate | Reset/rebuild CTA is unavailable until BE says a verified backup authorises destroy. |
| Responsive | Resource detail collapses to one readable column without horizontal overflow; operation actions remain reachable. |
| Architecture | No FE K8s client, kubeconfig, Helm command or direct shell/execa. |

Approved revision: `nivo-lifecycle-operations-resource-detail-r1`

### OUTPUTS

| Concept | Result |
|---|---|
| Approved direction | Resource Detail operations with journey first, operations second, Helm stack third. |
| Realtime contract | Nivo BE is the sole probe/watch owner; FE consumes snapshot + matching Socket.IO deltas. |
| Safety model | Destructive actions require backend capability and verified-backup evidence; scale remains separate. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\lifecycle-operations.md` | `modified` — appended Review r1, no production source. |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\lifecycle-operations\r1\index.html` | `REUSE` — reviewed selected direction evidence, no new preview code. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Backend contract prerequisite | **Chạy `$starci-be-feature-plan` cho resource operation snapshot, Helm stack projection, action mutations và Socket.IO delta trước FE Apply** (khuyến nghị); hoặc cố định FE trên contract hiện có và bỏ Helm detail/continuous operation stats. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE hiện chỉ có `myInstances` coarse và provisioning deployment snapshot; chưa có Helm stack projection/action API đầy đủ. | Không được Apply FE bằng mock stats hoặc gọi K8s trực tiếp. |
| Bitnami legacy là compatibility decision, không phải chart implementation approval. | Backend/Helm phải xác nhận chart source, PVC và scale path trong feature plan riêng. |
| Existing backend workflow validator còn lỗi lịch sử ngoài scope. | Không dùng lỗi cũ đó làm bằng chứng FE review fail; workflow này phải giữ record đúng schema. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| FE probe K8s trực tiếp hoặc dùng kubeconfig | Nivo BE probe/watch rồi project stats | Browser không được có cluster credential; BE mới sở hữu lifecycle truth. |
| Render raw Helm command/output như UI contract | Render public-safe Helm stack projection | Helm internals không phải user-facing contract và dễ leak infrastructure. |
| Gộp Update pod và Scale | Hai operation riêng | Khác impact, approval và rollback semantics. |

### OWED

| Owed | Cleared by |
|---|---|
| Backend read/action/realtime contract | `$starci-be-feature-plan` + Review + Apply cho Nivo BE. |
| FE Apply | Sau khi backend contract tồn tại và user approve exact production boundary. |

Invite: `$starci-be-feature-plan` cho backend contract, sau đó `$starci-fe-design-apply`.
