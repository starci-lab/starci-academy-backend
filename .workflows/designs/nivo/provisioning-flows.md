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
| App | nivo / @nivo/app |
| Repo / branch | Frontend D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary; Backend D:\Repositories\nivo-backend @ main |
| Purpose | Thiết kế hai luồng provisioning trong Nivo: tạo AgentOS và tạo Học viện chuyên gia, cùng đi từ request đến trang quản lý. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này và preview disposable tương ứng. |

### EVIDENCE

| Source | Finding |
|---|---|
| AgentOS design `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-provision-flow.md` | Đã chốt A+B: journey là flex row trên content; sidebar chỉ navigation; copy không lộ K8s/Socket.IO. |
| Nivo backend provisioning | Có boundary request/order, workspace status và deployment status; frontend cần rehydrate state và mở management CTA khi ready. |
| Expert academy direction | Luồng cần cùng grammar provisioning, không phải learner dashboard/classroom journey. |

### DIRECTION

| Decision | Result |
|---|---|
| Shared pattern | Một journey row ngang ở đầu content + sidebar navigation. |
| Flow 1 | Request → Tạo AgentOS → Nivo chuẩn bị workspace → Quản lý AgentOS. |
| Flow 2 | Request → Tạo Học viện chuyên gia → Nivo chuẩn bị học viện → Quản lý học viện. |
| Runtime copy | Dùng “Nivo đang chuẩn bị… / Tiến trình được cập nhật trực tiếp”, không nói K8s, Socket.IO hoặc event name. |
| Leaving/re-entry | Cho phép rời trang; khi quay lại đọc lại trạng thái server, không reset về loading giả. |

### PREVIEW

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\provisioning-flows\r1\`  
Port: `8092`

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| Provisioning flows r1 | http://127.0.0.1:8092/ | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\provisioning-flows\r1\index.html` | `5287547DD0D2AFBC80743AFC34648AC788B90B23DDA66336C91920F4B45DB2BD` | Added; two tabs share the same A+B hierarchy. |

| Direction | Tab | Status |
|---|---|---|
| A+B — AgentOS provisioning | `AgentOS` | selected |
| A+B — Expert academy provisioning | `Học viện chuyên gia` | selected |

### ACCEPTANCE STATES

| State | Must show |
|---|---|
| Request form | Product identity, selected option, one primary CTA. |
| Request accepted | Request identity and recorded state. |
| Provisioning | Current journey step, direct progress status, safe user-facing copy. |
| Re-entry | Server truth rehydrates current step. |
| Ready | Management CTA for the correct product. |
| Refused/failed | Reason useful to user, retry/back path, no internal mechanism leak. |

### OUTPUTS

| Concept | Result |
|---|---|
| Shared hierarchy | A+B pattern reused for both provisioning products. |
| AgentOS flow | Request → create → workspace provisioning → AgentOS management. |
| Expert academy flow | Request → create → academy provisioning → academy management. |
| Preview | One disposable tabbed preview with both flows. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md` | Added corrected plan scope. |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\provisioning-flows\r1\index.html` | Added disposable preview for both provisioning flows. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chốt scope đúng hai provisioning flow | **Duyệt preview này để chuyển Review**; hoặc chỉ rõ khác biệt giữa flow AgentOS và flow Học viện chuyên gia cần chỉnh. |

### WARNINGS

| Warning | Impact |
|---|---|
| Expert academy provisioning contract chưa được khóa trong FE target. | Review phải xác định exact backend operation/event/state trước Apply. |
| Preview là evidence hierarchy, không phải production source. | Không copy fixture status/price vào production. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Learner overview/classroom làm scope chính | Provisioning của sản phẩm Học viện chuyên gia | Đúng mục tiêu là tạo và chờ provision học viện, sau đó vào quản lý. |
| Journey trong sidebar | Journey flex row trên content | Giữ quyết định hierarchy đã chốt. |

### OWED

| Owed | Cleared by |
|---|---|
| Review exact owner, backend states và file boundary | `$starci-fe-design-review`. |

## review

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
| App | nivo / @nivo/app |
| Repo / branch | Frontend D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary; Backend D:\Repositories\nivo-backend @ main |
| Purpose | Review hai luồng provisioning AgentOS và Học viện chuyên gia theo cùng pattern A+B. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; không sửa production source. |

### COMPONENT DELTA

| Path | Role | Verdict | Change |
|---|---|---|---|
| `D:\Repositories\nivo-fe\apps\app\src\app\[locale]\(console)\provisioning\page.tsx` | Route | ADD | Mount provisioning flow. |
| `D:\Repositories\nivo-fe\apps\app\src\components\pages\ProvisioningPage\` | Page | ADD | Own request and lifecycle composition. |
| `D:\Repositories\nivo-fe\apps\app\src\components\blocks\provisioning\` | Blocks | ADD | Own journey and status. |
| `D:\Repositories\nivo-fe\apps\app\src\modules\realtime\provisioning.ts` | Transport | ADD | Own Socket.IO lifecycle. |

### PROPS DELTA

| API | Owner | Producers/consumers | Change |
|---|---|---|---|
| `ProvisioningPageProps` | Provisioning page | Route/connected owner | ADD product, identity, snapshot. |
| `ProvisioningJourneyProps` | Journey block | Provisioning page | ADD labels/current step/destination. |
| `ProvisioningStatusProps` | Status block | Provisioning page | ADD state/reason/retry. |

### REVIEW FINDINGS

| Check | Result | Consequence |
|---|---|---|
| Shared hierarchy | Pass | Journey row nằm trên content; sidebar chỉ là navigation và không sở hữu lifecycle state. |
| AgentOS read model | Exists | `nivo-fe/apps/app/src/modules/api/console.ts` đã có catalog, orders, expert sites và union `not_provisioned/provisioning/awaiting_dns/ready/failed`; có thể mở rộng theo pattern hiện tại. |
| AgentOS create/realtime | Missing in target | Cần khóa mutation tạo/order, Socket.IO `/provisioning`, owner-room subscription, dedupe/reconcile và management route trước Apply. |
| Expert academy provisioning contract | Unproven | Backend evidence hiện có classroom/academy capability nhưng chưa đủ chứng cứ về mutation/state/event riêng cho việc tạo và provision học viện; không được giả định dùng lại AgentOS contract. |
| User-facing copy | Pass | Không lộ K8s, Socket.IO hay event name; dùng trạng thái sản phẩm và tiến trình trực tiếp. |
| Re-entry/ordering | Required | Server snapshot là truth khi vào lại; event trùng hoặc đến muộn không được làm lùi lifecycle. |
| Ready gate | Required | Chỉ mở CTA quản lý khi có identity/endpoint/readiness proof thật. |

### DIRECTION VERDICT

| Surface | Verdict | Review decision |
|---|---|---|
| Shared provisioning journey | Keep | Một component/contract chung cho 4 bước; label và destination truyền theo product flow. |
| AgentOS request/create | Extend | Bám catalog/order read model hiện có, bổ sung write boundary và payment/readiness contract. |
| Expert academy request/create | New pending contract | Chỉ triển khai sau khi backend xác nhận operation, identity và lifecycle state. |
| Provisioning status panel | New | Có loading, accepted, preparing, ready, failed, disconnected/reconnected và re-entry. |
| Management handoff | New per product | URL/identity phải đến từ backend, không hardcode route giả. |

### PRODUCTION BOUNDARY CANDIDATE

| Tree | Ownership | Status |
|---|---|---|
| `D:\Repositories\nivo-fe\apps\app\src\app\[locale]\(console)\provisioning\page.tsx` | Shared provisioning route mount | NEW |
| `D:\Repositories\nivo-fe\apps\app\src\components\pages\ProvisioningPage\index.tsx` + `component.tsx` | Resolve/draw request + lifecycle states | NEW |
| `D:\Repositories\nivo-fe\apps\app\src\components\blocks\provisioning\ProvisioningJourney\` | Shared flex-row journey | NEW |
| `D:\Repositories\nivo-fe\apps\app\src\components\blocks\provisioning\ProvisioningStatus\` | Product-neutral status/reason/retry states | NEW |
| `D:\Repositories\nivo-fe\apps\app\src\modules\api\console.ts` | Extend AgentOS read/write operations only where backend contract exists | EXTEND |
| `D:\Repositories\nivo-fe\apps\app\src\modules\realtime\provisioning.ts` | Socket.IO owner-room transport and reconciliation | NEW |
| `D:\Repositories\nivo-fe\apps\app\src\messages\vi.json` + `en.json` | Product copy and lifecycle states | EXTEND |
| `D:\Repositories\nivo-backend\src\features\...` | Expert academy create/provision contract if absent | PENDING BACKEND REVIEW |

### ACCEPTANCE EVIDENCE

| Evidence | Command/state |
|---|---|
| AgentOS request | Signed-in user selects AgentOS, submits one request, sees recorded identity. |
| Expert academy request | Signed-in user selects Học viện chuyên gia, submits one request only after its backend mutation is confirmed. |
| Realtime | Owner receives workspace/deployment lifecycle update; reconnect reconciles from server snapshot. |
| Ready handoff | Correct management CTA appears only with backend readiness/identity. |
| Failure | User sees useful reason and retry/support path without internal implementation terms. |
| Visual | Preview r1 checked in both tabs and at narrow viewport; production states render with same journey/sidebar hierarchy. |

### OUTPUTS

| Concept | Result |
|---|---|
| Review verdict | Shared A+B hierarchy is approved as the interaction direction. |
| AgentOS boundary | Existing read model can be extended, but create/payment/realtime/readiness contracts remain Apply gates. |
| Expert academy boundary | Not yet safe to implement until the backend provisioning contract is identified and named. |
| Production tree | Candidate shared FE tree recorded; backend tree intentionally pending evidence. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md` | Appended Review with live FE/backend evidence, ownership, candidate boundary and gates. |
| `D:\Repositories\nivo-fe` | No production source changed; inspected existing console read model and provisioning status union. |
| `D:\Repositories\nivo-backend` | No backend source changed; inspected provisioning and expert capability evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chốt revision trước Apply | **Duyệt hướng + cho phép mình khóa backend contract cho Học viện chuyên gia ở bước tiếp theo**; hoặc cung cấp operation/identity/state backend đã có nếu muốn giữ nguyên boundary hiện tại. |

### WARNINGS

| Warning | Impact |
|---|---|
| Học viện chuyên gia chưa có evidence đủ rõ về create/provision lifecycle trong backend search hiện tại. | Không thể kết thúc Review bằng Approved revision cho cả hai flow; cần backend feature plan hoặc contract evidence. |
| Preview có option/price minh họa. | Apply phải đọc catalog/payment thật, không hardcode fixture. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Dùng learner dashboard/classroom làm flow Học viện chuyên gia | Dùng create → provision → management | Đúng yêu cầu là provisioning sản phẩm, không phải hành trình học của học viên. |
| Dùng polling thay Socket.IO cho lifecycle | Socket.IO + snapshot reconciliation | Backend đã có realtime boundary; polling làm lệch trạng thái và mất event semantics. |
| Mở management CTA ngay sau request | Chờ readiness proof | Request accepted chưa đồng nghĩa workspace/học viện đã sẵn sàng. |

### OWED

| Owed | Cleared by |
|---|---|
| Exact backend contract cho create/provision Học viện chuyên gia | Backend feature/schema evidence hoặc `$starci-be-feature-plan`. |
| Explicit user approval cho revision | User xác nhận sau khi boundary trên là đúng. |

## review r2

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
| App | nivo / @nivo/app |
| Repo / branch | Frontend D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary; Backend D:\Repositories\nivo-backend @ main |
| Purpose | Cập nhật Review sau khi dump live GraphQL schema và mở operation siblings cho hai provisioning flow. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; không sửa production source. |

### LIVE CONTRACT REVISION

| Product | Backend evidence | UI implication |
|---|---|---|
| AgentOS | Existing core mutation/query family and provisioning gateway evidence | Request/create, realtime owner room, reconciliation and management handoff are FE integration boundary. |
| Học viện chuyên gia | `createExpertSite`, `provisionExpertSite`, `deployExpertSite`, `myExpertSiteDeployment` are present in live schema and sibling folders. | Flow maps to expert site creation/provisioning; mutation success means job started, not ready. |
| Provision result | `jobId`, `expertDeploymentId`, `publicHost`; status lives on site/deployment rows | Journey must retain identity and show preparing until read model proves ready. |

### PRODUCTION BOUNDARY REVISION

| Tree | Ownership | Status |
|---|---|---|
| `D:\Repositories\nivo-fe\apps\app\src\app\[locale]\(console)\provisioning\page.tsx` | Shared provisioning route mount | NEW |
| `D:\Repositories\nivo-fe\apps\app\src\components\pages\ProvisioningPage\index.tsx` + `component.tsx` | Request and lifecycle composition | NEW |
| `D:\Repositories\nivo-fe\apps\app\src\components\blocks\provisioning\ProvisioningJourney\` | Shared four-step flex row | NEW |
| `D:\Repositories\nivo-fe\apps\app\src\components\blocks\provisioning\ProvisioningStatus\` | Accepted/preparing/ready/failed/disconnected states | NEW |
| `D:\Repositories\nivo-fe\apps\app\src\modules\api\console.ts` | AgentOS + expert-site GraphQL operations, typed from live responses | EXTEND |
| `D:\Repositories\nivo-fe\apps\app\src\modules\realtime\provisioning.ts` | `/provisioning` socket, owner room, dedupe and snapshot reconciliation | NEW |
| `D:\Repositories\nivo-fe\apps\app\src\messages\vi.json` + `en.json` | Product-specific copy and lifecycle labels | EXTEND |
| `D:\Repositories\nivo-fe\apps\app\src\components\layouts\ConsoleNav\index.tsx` | Navigation entry for Provisioning/AgentOS/Expert Academy | MODIFY only if current nav lacks the entry |

### ACCEPTANCE EVIDENCE REVISION

| Evidence | Command/state |
|---|---|
| Expert academy create | `createExpertSite(input: { slug })` returns the owned Draft site identity. |
| Expert academy provision | `provisionExpertSite(input: { siteId })` returns job/deployment/host handles; UI remains preparing. |
| Expert academy readiness | `myExpertSiteDeployment(siteId)` and site/deployment status provide the truth for management CTA. |
| AgentOS readiness | Existing workspace/site read model plus provisioning events provide the truth; no success inferred from request response. |
| Re-entry | Reload reads current snapshot, then socket updates the owner-scoped lifecycle without regression. |

### OUTPUTS

| Concept | Result |
|---|---|
| Contract correction | Both product flows have backend operation evidence; no new backend feature is required merely to name the flow. |
| Expert academy semantics | “Tạo Học viện chuyên gia” is the expert-site create/provision path; “đã bắt đầu khởi tạo” is not “đã sẵn sàng”. |
| Review state | Shared A+B direction and candidate FE boundary are ready for explicit user approval before Apply. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md` | Appended `review r2` with live schema, operation siblings, corrected expert academy mapping and acceptance evidence. |
| `D:\Repositories\nivo-backend` | No source changed; schema and operation files were read only. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Duyệt revision cho Apply | **Duyệt hai flow với Học viện chuyên gia = createExpertSite → provisionExpertSite → theo dõi deployment → quản lý**; hoặc chỉ rõ khác biệt business giữa “Học viện chuyên gia” và “expert site” trước khi Apply. |

### WARNINGS

| Warning | Impact |
|---|---|
| `provisionExpertSite` trả handle của job, không trả readiness. | Không mở management CTA ngay sau mutation thành công. |
| Exact Socket.IO payload cho expert-site deployment vẫn cần map cùng owner-room protocol khi Apply. | Realtime adapter phải có snapshot reconciliation, không đoán status từ UI action. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Kết luận “Học viện chuyên gia chưa có backend contract” | Dùng operation family expert-sites đã có | Live schema và sibling folders chứng minh capability tồn tại. |

### OWED

| Owed | Cleared by |
|---|---|
| User approval cho exact revision và product naming | User xác nhận rồi mới ghi `Approved revision` và chuyển Apply. |

### COMPONENT DELTA

| Path | Role | Verdict | Change |
|---|---|---|---|
| `D:\Repositories\nivo-fe\apps\app\src\app\[locale]\(console)\provisioning\page.tsx` | Route | ADD | Mount provisioning flow. |
| `D:\Repositories\nivo-fe\apps\app\src\components\pages\ProvisioningPage\` | Page | ADD | Own request and lifecycle composition. |
| `D:\Repositories\nivo-fe\apps\app\src\components\blocks\provisioning\` | Blocks | ADD | Own journey and status. |
| `D:\Repositories\nivo-fe\apps\app\src\modules\realtime\provisioning.ts` | Transport | ADD | Own Socket.IO lifecycle. |

### PROPS DELTA

| API | Owner | Producers/consumers | Change |
|---|---|---|---|
| `ProvisioningPageProps` | Provisioning page | Route/connected owner | ADD product, identity, snapshot. |
| `ProvisioningJourneyProps` | Journey block | Provisioning page | ADD labels/current step/destination. |
| `ProvisioningStatusProps` | Status block | Provisioning page | ADD state/reason/retry. |

## review r3

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
| App | nivo / @nivo/app |
| Repo / branch | Frontend D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary; Backend D:\Repositories\nivo-backend @ main |
| Purpose | Xác minh Socket.IO đủ ở cả backend và frontend trước khi duyệt Apply. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; không sửa production source. |

### COMPONENT DELTA

| Path | Role | Verdict | Change |
|---|---|---|---|
| `D:\Repositories\nivo-fe\apps\app\src\app\[locale]\(console)\provisioning\page.tsx` | Route mount | ADD | Mount shared provisioning page. |
| `D:\Repositories\nivo-fe\apps\app\src\components\pages\ProvisioningPage\` | Page owner | ADD | Resolve and draw both product flows. |
| `D:\Repositories\nivo-fe\apps\app\src\components\blocks\provisioning\` | Journey/status blocks | ADD | Own shared lifecycle presentation. |
| `D:\Repositories\nivo-fe\apps\app\src\modules\realtime\provisioning.ts` | Realtime adapter | ADD | Socket.IO owner subscription and reconciliation. |
| Existing console pages/nav | Existing surfaces | REUSE | No unrelated redesign. |

### PROPS DELTA

| API | Owner | Producers/consumers | Change |
|---|---|---|---|
| `ProvisioningPageProps` | Provisioning page | Route/data owner | ADD resolved product, identity and lifecycle snapshot. |
| `ProvisioningJourneyProps` | Journey block | Provisioning page | ADD labels, current step and destination. |
| `ProvisioningStatusProps` | Status block | Provisioning page | ADD state, reason, reconnecting and retry. |
| `useProvisioningRealtime` | Realtime adapter | Connected page | ADD owner-scoped socket lifecycle and reconciliation callback. |

### SOCKET.IO CHECK

| Boundary | Evidence | Verdict |
|---|---|---|
| Backend namespace | `ProvisioningGateway` owns `/provisioning`; Keycloak handshake middleware authenticates socket. | đủ |
| Owner isolation | Authenticated socket joins its own owner room through the subscribe event. | đủ |
| AgentOS event | Agent workspace transition relays as `workspace.status`. | đủ |
| Expert academy event | Expert deployment transition relays as `deployment.status`. | đủ |
| Payload | Event carries resource identity/status/reason/timestamp; provision mutation separately returns job/deployment/host handles. | đủ để FE map |
| Backend tests | Gateway specs and realtime probe cover owner room, event routing and deployment/workspace transitions. | đủ evidence |
| FE client dependency | `D:\Repositories\nivo-fe\apps\app\package.json` has no `socket.io-client`. | thiếu |
| FE adapter | `D:\Repositories\nivo-fe\apps\app\src` has no provisioning Socket.IO client/reconnect/reconciliation module. | thiếu |
| FE live proof | No browser socket connection or event-to-UI test exists in target app. | thiếu |

### VERDICT

| Question | Result |
|---|---|
| Socket.IO backend có đủ không? | Có. Namespace, auth, owner room, event routing và test evidence đã đủ. |
| Socket.IO cho toàn bộ FE flow có đủ không? | Chưa. Thiếu client dependency, adapter, reconnect/snapshot reconciliation và browser proof. |
| Có được duyệt Apply ngay không? | Chưa; approval phải chờ FE realtime boundary được đưa vào approved change tree hoặc user chấp nhận Apply bao gồm dependency/adapter đó. |

### OUTPUTS

| Concept | Result |
|---|---|
| Socket verdict | Backend đủ; FE chưa đủ để coi hai flow đã sẵn sàng end-to-end. |
| Approval state | Chưa ghi `Approved revision`; không duyệt khi còn thiếu client boundary mà UI phụ thuộc. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md` | Appended `review r3` với socket evidence và approval blocker. |
| `D:\Repositories\nivo-fe\apps\app\package.json` | Read only; xác nhận chưa có `socket.io-client`. |
| `D:\Repositories\nivo-backend\src\modules\platform\socketio\gateways\provisioning\` | Read only; xác nhận namespace/event/owner-room implementation. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chốt boundary Socket.IO để Apply | **Cho phép Apply bao gồm `socket.io-client` + provisioning adapter + reconnect/snapshot reconciliation + browser proof**; hoặc chỉ duyệt UI static/read-model trước và tách realtime thành feature sau. |

### WARNINGS

| Warning | Impact |
|---|---|
| Nếu Apply không bao gồm FE socket adapter, UI chỉ mô phỏng “cập nhật trực tiếp”. | Không đáp ứng yêu cầu K8s watch → Socket.IO → UI thật. |
| Backend event payload status còn là product boundary cần mapping typed ở FE. | Không được để free-form string đi thẳng vào journey state. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Duyệt ngay chỉ vì backend Socket.IO đã có | Xác nhận cả backend + FE client boundary | User-facing flow không hoàn chỉnh nếu browser chưa connect và reconcile được event. |

### OWED

| Owed | Cleared by |
|---|---|
| User chọn Apply realtime đầy đủ hay static/read-model trước | User chọn một trong hai boundary trên. |
| `Approved revision` | Chỉ ghi sau khi boundary Socket.IO được user duyệt rõ. |

Approved revision: `nivo-provisioning-flows-a+b-realtime-r3`

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | Provisioning route | ADD | absent | `apps/app/src/app/[locale]/(console)/provisioning/page.tsx` | console layout | Next route contract | Shared entry for both flows. |
| page | ProvisioningPage | ADD | absent | `apps/app/src/components/pages/ProvisioningPage/index.tsx` + `component.tsx` | provisioning route | page split | Resolve then draw. |
| block | ProvisioningJourney | ADD | absent | `apps/app/src/components/blocks/provisioning/ProvisioningJourney/index.tsx` | ProvisioningPage | named journey contract | Shared flex-row journey. |
| block | ProvisioningStatus | ADD | absent | `apps/app/src/components/blocks/provisioning/ProvisioningStatus/index.tsx` | ProvisioningPage | lifecycle state contract | Own status/reason/retry. |
| layout | ConsoleNav | MODIFY | `apps/app/src/components/layouts/ConsoleNav/index.tsx` | same | console layout producers | nav destination contract | Add entry only if absent. |
| shell | ProvisioningRealtime | ADD | absent | `apps/app/src/modules/realtime/provisioning.ts` | ProvisioningPage | Socket.IO owner stream | Connect/reconnect/reconcile. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| ProvisioningPage | `ProvisioningPageProps` | ADD | absent | product, identity, snapshot, realtime state | route connected owner | New page test fixture. |
| ProvisioningJourney | `ProvisioningJourneyProps` | ADD | absent | labels, current step, destination | ProvisioningPage | Journey state fixture. |
| ProvisioningStatus | `ProvisioningStatusProps` | ADD | absent | state, reason, reconnecting, retry | ProvisioningPage | Lifecycle matrix. |
| ProvisioningRealtime | `useProvisioningRealtime` | ADD | absent | owner socket lifecycle + reconciliation callback | ProvisioningPage | socket reconnect/event proof. |
| Provisioning route | route params | ADD | absent | locale + console route params | Next route | route render proof. |
| ConsoleNav | provisioning destination | KEEP | existing destinations only | AgentOS + Expert Academy provisioning entry | Console layout | nav render proof. |

## review r4

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
| App | nivo / @nivo/app |
| Repo / branch | Frontend D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary; Backend D:\Repositories\nivo-backend @ main |
| Purpose | Đóng băng component/props delta và xác nhận baseline trước Apply. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; không sửa production source. |

### COMPONENT DELTA

| Path | Role | Verdict | Change |
|---|---|---|---|
| `D:\Repositories\nivo-fe\apps\app\src\app\[locale]\(console)\provisioning\page.tsx` | Route mount | ADD | Mount shared provisioning page under console locale route. |
| `D:\Repositories\nivo-fe\apps\app\src\components\pages\ProvisioningPage\index.tsx` | Connected page | ADD | Resolve request snapshot and product flow before drawing. |
| `D:\Repositories\nivo-fe\apps\app\src\components\pages\ProvisioningPage\component.tsx` | Pure page | ADD | Draw product request, journey, status and ready handoff. |
| `D:\Repositories\nivo-fe\apps\app\src\components\blocks\provisioning\ProvisioningJourney\index.tsx` | Shared journey | ADD | Own four-step flex-row presentation. |
| `D:\Repositories\nivo-fe\apps\app\src\components\blocks\provisioning\ProvisioningStatus\index.tsx` | Lifecycle block | ADD | Own accepted/preparing/ready/failed/disconnected states. |
| `D:\Repositories\nivo-fe\apps\app\src\components\layouts\ConsoleNav\index.tsx` | Existing navigation | MODIFY | Add/route provisioning destinations only if absent. |
| `D:\Repositories\nivo-fe\apps\app\src\modules\api\console.ts` | Existing API transport | MODIFY | Add typed create/provision/read operations matching live schema. |
| `D:\Repositories\nivo-fe\apps\app\src\modules\realtime\provisioning.ts` | Realtime transport | ADD | Add authenticated Socket.IO client, owner subscription and snapshot reconciliation. |
| `D:\Repositories\nivo-fe\apps\app\src\messages\vi.json` | Vietnamese copy | MODIFY | Add product and lifecycle messages. |
| `D:\Repositories\nivo-fe\apps\app\src\messages\en.json` | English copy | MODIFY | Add product and lifecycle messages. |
| `D:\Repositories\nivo-fe\apps\app\package.json` | Runtime dependency manifest | MODIFY | Add `socket.io-client`. |
| Existing `FleetRow`, `OverviewPage`, `AppsPage`, `WalletPage` | Existing console surfaces | REUSE | No design edit predicted unless a named producer must route into provisioning. |

### PROPS DELTA

| API | Owner | Producers/consumers | Change |
|---|---|---|---|
| `ProvisioningPageProps` | `ProvisioningPage/component.tsx` | `ProvisioningPage/index.tsx` | ADD resolved product, request identity, snapshot and realtime state. |
| `ProvisioningJourneyProps` | `ProvisioningJourney` | `ProvisioningPage/component.tsx` | ADD product-specific labels, current step and terminal destination. |
| `ProvisioningStatusProps` | `ProvisioningStatus` | `ProvisioningPage/component.tsx` | ADD lifecycle state, reason, reconnecting flag and retry action. |
| `createExpertSite` / `provisionExpertSite` actions | `modules/api/console.ts` | Provisioning page CTA | ADD typed GraphQL actions; mutation success stores handles only. |
| `myExpertSiteDeployment` / AgentOS snapshot reads | `modules/api/console.ts` | Connected page/re-entry | ADD typed readiness reads. |
| `useProvisioningRealtime` | `modules/realtime/provisioning.ts` | Connected page | ADD owner-scoped socket lifecycle, event dedupe and reconciliation callback. |
| Console navigation destination | `ConsoleNav` | Existing console layout | MODIFY only when provisioning destination is not already represented. |

### APPLY GATE

| Check | Result |
|---|---|
| Delta completeness | Component and props boundary is now explicit. |
| Worktree baseline | Blocked: target FE has unrelated pre-existing modifications, deletions and untracked files. |
| Safe next action | User must allow a baseline commit containing all current target changes, or provide a clean worktree/staging boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Baseline commit for Apply | **Cho phép commit toàn bộ trạng thái hiện tại của `nivo-fe` làm baseline**; hoặc dọn/commit riêng thay đổi hiện tại rồi báo mình chạy Apply tiếp. |

### WARNINGS

| Warning | Impact |
|---|---|
| `nivo-fe` đang dirty rộng, gồm cả file deleted/untracked ngoài provisioning flow. | Commit baseline không được tự động coi là thay đổi của feature; nếu không chốt boundary, Apply có thể trộn lịch sử công việc khác. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Ghi `Approved revision` nhưng bỏ qua `COMPONENT DELTA`/`PROPS DELTA` | Đóng băng hai bảng trước Apply | Apply skill yêu cầu diff có thể đối chiếu từng owner/prop. |

### OWED

| Owed | Cleared by |
|---|---|
| Safe baseline commit | User chọn commit toàn bộ current state hoặc làm sạch worktree. |

### OUTPUTS

| Concept | Result |
|---|---|
| Delta boundary | Component và props delta đã được đóng băng cho Apply. |
| Apply status | Chưa bắt đầu vì baseline boundary còn vướng dirty worktree. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md` | Appended `review r4` context, deltas và baseline gate. |

## apply

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
| App | nivo / @nivo/app |
| Repo / branch | Frontend D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary; Backend D:\Repositories\nivo-backend @ main |
| Purpose | Apply hai provisioning flow với Socket.IO client/reconciliation và hai product entry points. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md |
| Language | vi |
| Phase | apply |
| Touching | Approved FE boundary plus workflow; current apply stopped at contract gate. |

Applied revision: `not-completed; returned-to-plan-r2`
Baseline commit: `242b75c`
Tracked diff: `242b75c..worktree`

### OUTPUTS

| Concept | Result |
|---|---|
| Baseline | Current Nivo FE state committed before feature edits. |
| API/realtime foundation | GraphQL create/provision/order actions and authenticated Socket.IO adapter were added to the worktree. |
| Verification | Typecheck passed; lint rejected structural markup outside the shared contract registry. |
| Apply status | Blocked and routed back to Review; no completion claim. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\nivo-fe` | `242b75c` — committed current pre-feature Nivo state as baseline. |
| `D:\Repositories\nivo-fe\apps\app\package.json` | Modified — added `socket.io-client`. |
| `D:\Repositories\nivo-fe\package-lock.json` | Modified — dependency lock updated. |
| `D:\Repositories\nivo-fe\apps\app\src\modules\api\console.ts` | Modified — added AgentOS/expert-site provisioning operations and snapshots. |
| `D:\Repositories\nivo-fe\apps\app\src\modules\realtime\provisioning.ts` | Added — Socket.IO owner-room client, reconnect and timestamp dedupe. |
| `D:\Repositories\nivo-fe\apps\app\src\components\pages\ProvisioningPage\component.tsx` | Added — initial provisioning screen implementation; lint requires contract registry revision. |
| `D:\Repositories\nivo-fe\apps\app\src\components\pages\ProvisioningPage\index.tsx` | Added — connected request/realtime orchestration. |
| `D:\Repositories\nivo-fe\apps\app\src\app\[locale]\(console)\provisioning\page.tsx` | Added — route mount. |
| `D:\Repositories\nivo-fe\apps\app\src\components\layouts\ConsoleNav\index.tsx` | Modified — provisioning navigation entry. |
| `D:\Repositories\nivo-fe\apps\app\src\messages\vi.json` + `en.json` | Modified — provisioning nav copy. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Contract boundary discovered during Apply | **Cho phép quay lại Review để thêm exact `packages/ui/src/contracts/index.ts` contract keys và migrate ProvisioningPage khỏi structural div/classes**; hoặc dừng Apply tại API/realtime foundation. |

### WARNINGS

| Warning | Impact |
|---|---|
| Lint hiện fail 54 lỗi trong các file mới, chủ yếu do structural host/class và missing export docs; typecheck đã pass. | Production UI chưa đạt canon và chưa được coi là hoàn tất. |
| Apply phát hiện owner mới: shared UI contract registry. | Theo skill phải Review boundary này trước khi tiếp tục edit. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Tắt lint hoặc thêm suppression cho structural UI | Mở Review contract registry rồi migrate đúng contract | Giữ trust rule và tránh source chạy nhưng sai ownership. |

### OWED

| Owed | Cleared by |
|---|---|
| Exact contract keys/props cho provisioning journey, status và shell | FE design review revision tiếp theo. |
| Lint/build/browser proof | Sau khi contract boundary được duyệt và Apply tiếp tục. |

## plan r2

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
| App | nivo / @nivo/app |
| Repo / branch | Frontend D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary; Backend D:\Repositories\nivo-backend @ main |
| Purpose | Chạy lại design plan cho hai provisioning flow, khóa product composition và tier ownership trước khi viết lại production source. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md và D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\provisioning-flows\r2\ |

### EVIDENCE

| Source | Finding |
|---|---|
| User feedback | `ProvisioningPageView` phẳng bị từ chối vì page đang chứa form, journey, status và product copy; thiếu block/composite ownership. |
| Canon `page.md` | Page chỉ settle screen state và compose blocks; không fetch block data hoặc reach inside block. |
| Canon `block.md` | Block connected/pure twin sở hữu request, copy và state union của domain sentence. |
| Canon `composite.md` | Composite là closed domain-neutral shape; không fetch/translate và chỉ extract khi có consumer thứ hai. |
| Existing `@nivo/ui` | REUSE `Field`, `ChoiceTabs`, `Button`, `Text`, `Heading`, `SurfaceCard`; existing `numbered-step-stack` là vertical roadmap, không diễn đạt top horizontal lifecycle. |
| Backend/live schema | AgentOS dùng order/workspace lifecycle; Học viện dùng `createExpertSite` → `provisionExpertSite` → deployment lifecycle; `/provisioning` emits owner-scoped events. |
| Current worktree | Có partial Apply code typecheck-pass nhưng lint-fail; Plan r2 không tiếp tục chỉnh source này và không coi nó là baseline/reference. |

### OWNERSHIP INVENTORY

| Owner | Classification | Decision |
|---|---|---|
| `ProvisioningPage` | REUSE SHAPE / REWRITE CONTENT | Page folder vẫn `index.tsx` + `component.tsx`, chỉ compose top-level blocks. |
| `ProvisioningFlow` block | NEW | Connected half owns request + snapshot + Socket.IO; pure half owns state-driven product sentence. |
| `ProductPicker` block | NEW only Direction B | Owns the product-selection decision before entering one focused flow. |
| `ProvisioningQueue` block | NEW only Direction C | Owns multiple request rows, retry and ready handoff. |
| `StepIndicator` composite | NEW | Closed domain-neutral shape reused by AgentOS and Expert Academy labels/status. |
| `RequestSummary` composite | NEW | Closed label/detail/action arrangement reused by both products. |
| `Field` composite | REUSE | Owns label + input + hint; block supplies resolved product copy. |
| `ChoiceTabs` leaf | REUSE | Owns accessible product selection control. |
| `provisioning-journey-row` contract | NEW | Horizontal four-step row with connectors/overflow cannot be expressed by vertical `numbered-step-stack`. |
| `request-beside-live-status` contract | NEW | Two peer regions split request and live progress; existing page keys do not admit these slot identities. |
| Existing console layout/sidebar | REUSE | Sidebar remains navigation only; journey stays above content. |

### DIRECTIONS

| Direction | Product decision | Tier shape | Trade-off |
|---|---|---|---|
| A — Một flow dùng chung | Product tabs remain visible before request; one continuous request → prepare → manage journey. | Page → one `ProvisioningFlow` block → shared composites. | Least navigation and matches the already-selected preview; block state union is denser. |
| B — Chọn sản phẩm trước | Two product cards first; entering a product creates a focused flow and changing product means going back. | Page → `ProductPicker` block + `ProvisioningFlow` block. | Clearer product identity; adds one decision step and second block. |
| C — Provisioning center | Existing/in-flight requests are primary; create is secondary and queue/detail are the main disclosure. | Page → `ProvisioningQueue` block + create block/overlay. | Best for repeat operators; heavier for first-time creation. |

### ACCEPTANCE STATES

| State | Must show |
|---|---|
| Before request | Product decision, truthful input, one primary CTA. |
| Request accepted | Durable order/site/job identity without claiming readiness. |
| Provisioning | Horizontal journey on content, live status block, safe user-facing copy. |
| Reconnect/re-entry | Snapshot first, Socket.IO updates second; duplicate/late event cannot regress status. |
| Ready | Product-specific management CTA only after backend readiness proof. |
| Failed/refused | Useful reason + retry/support path, no K8s/Socket.IO terms. |

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\provisioning-flows\r2\`  
PID: `64124`  
Port: `8094`

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| Nivo provisioning design plan r2 | http://127.0.0.1:8094/ | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\provisioning-flows\r2\index.html` | `29D5764A97799553D5E69C667D2D333B8827246565D7FCAE02D9AD6528FC4229` | `đang chờ` |

| Direction | Tab | Status |
|---|---|---|
| A | `A · Một flow dùng chung` | `đang chờ` |
| B | `B · Chọn sản phẩm trước` | `đang chờ` |
| C | `C · Provisioning center` | `đang chờ` |

### OUTPUTS

| Concept | Result |
|---|---|
| Revised design brief | Ba direction phân biệt bằng reading order, CTA priority và disclosure; không còn coi flat page JSX là architecture. |
| Tier ownership | Page compose; block owns domain/request/realtime; composites own closed shared shapes; contracts own all arrangement. |
| Recommended direction | A giữ hành trình liên tục đã chốt trước đó và có boundary nhỏ nhất, nhưng chưa tự ghi selected trước khi user chọn. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md` | `modified` — appended `plan r2` with evidence, ownership inventory, three directions and acceptance states. |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\provisioning-flows\r2\index.html` | `added` — one tabbed disposable preview with directions A/B/C and implementation anatomy. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn direction để chuyển Review | **A — Một flow dùng chung (recommended)**; B — chọn sản phẩm trước; C — provisioning center. |

### WARNINGS

| Warning | Impact |
|---|---|
| Partial Apply source remains in `nivo-fe` after baseline `242b75c`. | Review must decide exact rewrite/remove delta; Plan does not silently treat it as approved source. |
| `StepIndicator` and two new contracts do not exist yet. | They are candidates only; Review must freeze exact slots/props/call sites before Apply. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Flat `ProvisioningPageView` owning form, journey, live status and copy | Page composes domain blocks; blocks use composites/contracts | User: “sao lại viết như thế, sao không có blocks, composites”. |
| Structural `<div>` and inline class composition in page | Named contract nodes rendered through `Tree` | Canon lint correctly rejected the implementation. |

### OWED

| Owed | Cleared by |
|---|---|
| User selects A, B or C | Open http://127.0.0.1:8094/ and choose one tab. |
| Exact component/props delta including partial source rewrite | `$starci-fe-design-review` after direction selection. |

## plan r3

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
| App | nivo / @nivo/app |
| Repo / branch | Frontend D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary; Backend D:\Repositories\nivo-backend @ main |
| Purpose | Ghi nhận lựa chọn hướng A và chuyển brief architecture-correct sang Review. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; không sửa production source. |

### SELECTED DIRECTION

| Decision | Result |
|---|---|
| Direction | **A — Một flow dùng chung** |
| Reason | Khớp quyết định journey liên tục + sidebar navigation trước đó; giữ product switch trước request và dùng chung lifecycle grammar cho AgentOS/Học viện. |
| Architecture correction | Page không còn sở hữu form/status/realtime; một block domain sở hữu flow và dùng shared closed composites. |

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| Nivo provisioning design plan r2 | http://127.0.0.1:8094/ | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\provisioning-flows\r2\index.html` | `29D5764A97799553D5E69C667D2D333B8827246565D7FCAE02D9AD6528FC4229` | `đã chốt` |

| Direction | Tab | Status |
|---|---|---|
| A | `A · Một flow dùng chung` | `đã chọn` |
| B | `B · Chọn sản phẩm trước` | `đã từ chối` |
| C | `C · Provisioning center` | `đã từ chối` |

### OUTPUTS

| Concept | Result |
|---|---|
| Selected direction | A — one shared flow with product tabs and continuous lifecycle. |
| Review input | Tier ownership and partial-source rewrite are explicit review concerns. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md` | `modified` — appended selected direction A. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Direction A inferred from “chạy tiếp”, recommendation and prior flow decision. |

### WARNINGS

| Warning | Impact |
|---|---|
| If “chạy tiếp” did not mean choose A, user can still replace the selection before Review approval. | No production write occurs in this phase. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| B — choose product first | A — persistent product tabs | Extra navigation step is unnecessary for two products. |
| C — provisioning center | A — creation-first flow | Operator density is not the primary first-run need. |

### OWED

| Owed | Cleared by |
|---|---|
| Freeze exact component/props/contracts boundary | `$starci-fe-design-review`. |

## review r5

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
| App | nivo / @nivo/app |
| Repo / branch | Frontend D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary; Backend D:\Repositories\nivo-backend @ main |
| Purpose | Freeze exact page → block → composite → leaf/contract tree for direction A and replace the rejected flat page implementation. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này và read-only inspection of current target source. |

### REVIEW VERDICT

| Concern | Verdict |
|---|---|
| Page ownership | `ProvisioningPage` owns only product tab/screen state and composes one domain block. |
| Block ownership | `ProvisioningFlow` connected half owns GraphQL request, snapshot reconciliation, Socket.IO and translations; pure half owns the state-selected tree. |
| Composite ownership | `LifecycleStep` and `RequestSummary` are closed, domain-neutral shapes reused across AgentOS and Expert Academy variants. Existing `Field` remains the input composite. |
| Contract ownership | New keys own page stack, horizontal lifecycle run, step shape and request/status split; no structural host/class remains in page/block/composite source. |
| Realtime truth | Snapshot initializes/re-enters; events advance matching identity only; timestamp/status rank prevents regression. |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | ProvisioningRoute | MODIFY | `apps/app/src/app/[locale]/(console)/provisioning/page.tsx` partial mount | same | Next console route | route mount only | Convert hoisted undocumented function to documented const mount. |
| page | ProvisioningPage | MODIFY | `apps/app/src/components/pages/ProvisioningPage/index.tsx` partial domain owner | same | ProvisioningRoute | `provisioning-page-stack` | Own only product/screen state and compose block. |
| page | _ProvisioningPage | MODIFY | `apps/app/src/components/pages/ProvisioningPage/component.tsx` rejected flat JSX | same | ProvisioningPage | `provisioning-page-stack` | Remove form/journey/status/copy from page. |
| block | ProvisioningFlow | ADD | absent | `apps/app/src/components/blocks/provisioning/ProvisioningFlow/index.tsx` | _ProvisioningPage | connected block twin | Own API, translations, snapshots and Socket.IO. |
| block | _ProvisioningFlow | ADD | absent | `apps/app/src/components/blocks/provisioning/ProvisioningFlow/component.tsx` | ProvisioningFlow | `request-beside-live-status` + lifecycle contracts | Draw settled request/preparing/ready/failed states. |
| composite | LifecycleStep | ADD | absent | `packages/ui/src/composites/LifecycleStep/index.tsx` | _ProvisioningFlow for four repeated steps in both products | `ordinal-over-label-and-state` | Closed generic step shape shared by both product variants. |
| composite | RequestSummary | ADD | absent | `packages/ui/src/composites/RequestSummary/index.tsx` | _ProvisioningFlow request and accepted states | `subject-over-muted-caption-with-action` | Closed generic identity/detail/action shape reused by both products. |
| composite | Field | REUSE | `packages/ui/src/composites/Field/index.tsx` | same | _ProvisioningFlow request form | `field` | Existing owner already closes label/input/hint. |
| leaf | ChoiceTabs | REUSE | `packages/ui/src/leaves/ChoiceTabs/index.tsx` | same | _ProvisioningPage | `choice-tab-strip` | Existing accessible product selector. |
| layout | ConsoleNav | MODIFY | `apps/app/src/components/layouts/ConsoleNav/index.tsx` partial duplicate-route entry | same | console layout | `home-services-account-nav` | Keep one Provisioning destination and remove misleading duplicate AgentOS route ownership. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| ProvisioningRoute | route mount | KEEP | mounts partial ProvisioningPage | mounts corrected ProvisioningPage only | Next router | Route file search shows no drawing/fetching. |
| ProvisioningPage | product screen state | RETYPE | owns slug, busy, message, error and realtime | owns only `product` tab state/query selection | ProvisioningRoute / _ProvisioningPage | No API/realtime import remains in page folder. |
| _ProvisioningPage | `ProvisioningPageProps` | RETYPE | flat request/realtime event handlers and strings | `{ product, onProductChange }` only | ProvisioningPage | Typecheck plus source search for removed props. |
| ProvisioningFlow | `ProvisioningFlowProps` | ADD | absent | `{ product: "agentos" | "academy" }` | _ProvisioningPage | Exact call-site search. |
| _ProvisioningFlow | `ProvisioningFlowViewProps` | ADD | absent | discriminated union `request | accepted | preparing | ready | failed` with resolved labels/actions | ProvisioningFlow | Fixture/unit render for every state. |
| LifecycleStep | `LifecycleStepProps` | ADD | absent | ordinal, label, state `done | current | upcoming` | _ProvisioningFlow repeated step map | Both product fixtures render four rows. |
| RequestSummary | `RequestSummaryProps` | ADD | absent | subject, detail, optional actionLabel; `press` action | _ProvisioningFlow request/accepted states | Both product fixtures render the same shape. |
| ConsoleNav | provisioning destination | RETYPE | partial AgentOS + Provisioning entries share `/provisioning` | one Provisioning entry owns `/provisioning`; AgentOS stays product label inside flow | ConsoleNav destination table | Nav render/source search. |

### SUPPORTING PRODUCTION BOUNDARY

| Path | Action | Exact responsibility |
|---|---|---|
| `packages/ui/src/contracts/index.ts` | MODIFY | Add `provisioning-page-stack`, `horizontal-lifecycle-run`, `ordinal-over-label-and-state`, `request-beside-live-status`, `subject-over-muted-caption-with-action`; exact typed slots and reasons. |
| `packages/ui/src/index.ts` | MODIFY | Export `LifecycleStep`, `RequestSummary` and prop types. |
| `apps/app/src/modules/api/console.ts` | MODIFY | Keep typed order/create/provision/snapshot operations; correct any live-schema mismatch found by build/live call. |
| `apps/app/src/modules/realtime/provisioning.ts` | MODIFY | Export typed client hook; auth, owner subscribe, reconnect, identity filter and timestamp dedupe. |
| `apps/app/src/messages/vi.json` + `en.json` | MODIFY | Move every product sentence out of source into `console.provisioning`. |
| `apps/app/package.json` + `package-lock.json` | MODIFY | Keep `socket.io-client` dependency added after baseline. |

### ACCEPTANCE EVIDENCE

| Proof | Command/state |
|---|---|
| Architecture | `rg` proves page folder has no API/realtime imports and no structural hosts/classes; block folder is exact connected/pure twin. |
| Contract | Lint passes with no suppression; every new contract key has live call sites. |
| Types | `npm run typecheck --workspace=@nivo/app`. |
| Lint | `npm run lint --workspace=@nivo/app`. |
| Build | `npm run build --workspace=@nivo/app`. |
| Browser | Open production `/provisioning`, switch both products, verify request/preparing/reconnect/ready/failed at desktop and narrow viewport. |
| Realtime | Backend live/probe evidence plus browser client connect; matching `workspace.status` and `deployment.status` advance only their product/resource. |

### OUTPUTS

| Concept | Result |
|---|---|
| Review revision | Direction A now has an exact architecture-correct page/block/composite/contract boundary. |
| Partial source verdict | Rewrite the flat page; retain only verified transport work after it passes exact schema and lint/build proof. |
| Approval state | Waiting for explicit approval of revision `nivo-provisioning-a-tiered-r5`. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md` | `modified` — appended selected plan and Review r5 component/props/supporting boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve exact tiered revision | **Duyệt `nivo-provisioning-a-tiered-r5`**; hoặc chỉ rõ owner/contract nào cần đổi trước Apply. |

### WARNINGS

| Warning | Impact |
|---|---|
| Current worktree contains partial source from the rejected Apply. | Apply must reconcile from baseline `242b75c`, replacing—not layering over—the flat page. |
| Shared contract/composite paths expand beyond the first approved app-only boundary. | This revision makes that expansion explicit and reviewable. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Flat page component with structural JSX | Page → block → composites → leaves/contracts | User explicitly rejected missing blocks/composites. |
| Product copy literals in TSX | `vi.json` / `en.json` resolved in connected block | Canon and lint require multilingual catalogue ownership. |
| Duplicate AgentOS and Provisioning nav entries owning one route | One Provisioning destination; product tabs inside page | Avoid two navigation owners for one address. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval for r5 | User says “duyệt”. |
| Corrected Apply from baseline | `$starci-fe-design-apply` after approval. |

## plan r4

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
| App | nivo / @nivo/app |
| Repo / branch | Frontend D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary; Backend D:\Repositories\nivo-backend @ main |
| Purpose | Correct the product hierarchy: AgentOS is independent; Học viện chuyên gia and MMO are Template App products. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md |
| Language | vi |
| Phase | plan |
| Touching | Workflow record and r3 preview only; no production source. |

### BINDING PRODUCT HIERARCHY

| Surface | Product level | Children / offer | Provisioning identity |
|---|---|---|---|
| `Ứng dụng` | Template App catalogue | `ai_academy`, `mmo`, future template keys | Selected `templateKey` plus app/site identity; realtime follows `deployment.status`. |
| `AgentOS` | Independent product | AgentOS catalogue tiers/workspaces | Order/workspace identity; realtime follows `workspace.status`. |
| Shared UI | Presentation primitives only | lifecycle step, request summary, live connection state | No shared product switch and no shared domain request handler. |

Evidence in current source:

| Evidence | Finding |
|---|---|
| `AppsPage/index.tsx` | Queries `catalogItems("site_from_template")`; owned apps resolve their `templateKey` from the same catalogue. |
| `AppsPage/component.tsx` | Explicitly models the catalogue as open to template #2 without a new screen or rail item. |
| Backend subscription-plan catalogue | Contains separate app keys `ai_academy` and `mmo`. |
| `OverviewPage` and messages | AgentOS already has its own section, vocabulary and workspace lifecycle. |

### IMPLEMENTATION-FEASIBLE DIRECTION

| Decision | Result |
|---|---|
| Navigation | Sidebar owns exactly `Ứng dụng` and `AgentOS`; remove the generic `Cấp phát` destination. |
| Template entry | User chooses Học viện chuyên gia or MMO from the Template App catalogue under `Ứng dụng`, then sees that selected template's continuous provisioning journey. |
| AgentOS entry | User enters AgentOS directly, chooses a tier and sees the independent workspace provisioning journey. |
| Shared boundary | The two domain blocks share closed lifecycle/status composites and contracts, not product state, API operations or product tabs. |
| Re-entry | Template deployments return through the owned Apps list; AgentOS workspaces return through AgentOS. Snapshot restores truth before Socket.IO advances it. |

### PREVIEW TRACKING

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| Nivo provisioning hierarchy r3 | http://127.0.0.1:8095/ | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\provisioning-flows\r3\index.html` | `8100BD073D8D712CA5B9E49ABC17203AAF03621D61CE684ADA60F876B939CF92` | ready for product-hierarchy confirmation |

| Direction | Tab | Status |
|---|---|---|
| A | `A · Journey riêng trong từng sản phẩm` | recommended — preserves the complete top-row journey after request |
| B | `B · Theo dõi ngay trong danh sách` | feasible — makes re-entry compact but hides lifecycle detail until requested |

### OUTPUTS

| Concept | Result |
|---|---|
| Product model | One independent AgentOS flow plus one catalogue-driven Template App flow. |
| Render model | Top lifecycle remains a horizontal row inside each selected product context; it is never placed in the sidebar. |
| Architecture model | Separate domain blocks; shared closed composites/contracts only. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md` | `modified` — appended Plan r4 hierarchy correction. |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\provisioning-flows\r3\index.html` | `added` — renders Apps catalogue and AgentOS as separate entry surfaces. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Confirm hierarchy render | Review the two sidebar entries at http://127.0.0.1:8095/; approval advances this exact hierarchy to a new Review revision. |

### WARNINGS

| Warning | Impact |
|---|---|
| Review r5 assumed AgentOS and academy were peer products in one flow. | r5 is invalidated and cannot be approved or applied. |
| Existing partial production source implements that invalid peer-product switch. | A future Apply must remove/rewrite it from baseline `242b75c`. |
| MMO has catalogue evidence but no dedicated frontend provisioning operation in the current partial source. | Review must keep the Template App block keyed by catalogue data and freeze the backend operation boundary without inventing an academy-only UI API. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| AgentOS / Học viện tabs as peers | `Ứng dụng → Template App → Học viện/MMO`; separate `AgentOS` surface | User corrected the product hierarchy and source confirms it. |
| Generic `Cấp phát` sidebar destination | Provisioning stays inside the owning product surface | Provisioning is a lifecycle, not a product. |
| One shared domain `ProvisioningFlow` | `TemplateAppProvisioning` and `AgentOSProvisioning` blocks sharing only closed UI composites | Requests, identities, snapshots and Socket.IO event names differ. |

### OWED

| Owed | Cleared by |
|---|---|
| Confirm r3 hierarchy preview | User confirms the render or identifies the remaining hierarchy error. |
| Freeze corrected component/props/routes boundary | `$starci-fe-design-review` after confirmation. |

## review r6

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
| App | nivo / @nivo/app |
| Repo / branch | Frontend D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary; Backend D:\Repositories\nivo-backend @ main |
| Purpose | Khóa chính xác source tree cho Direction A với AgentOS độc lập và Học viện chuyên gia thuộc Template App. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này và read-only inspection trong Frontend/Backend; không sửa production source. |

Candidate revision: `nivo-provisioning-owner-flows-r6`

### REVIEW VERDICT

| Concern | Verdict |
|---|---|
| Product hierarchy | `Ứng dụng` owns the Template App catalogue; `ai_academy` and `mmo` are template keys. AgentOS owns a separate product surface and workspace lifecycle. |
| Entry surfaces | Sidebar has `Ứng dụng` and `AgentOS`; generic `Cấp phát` is removed. Apps catalogue CTA enters `/apps/new/[templateKey]`; AgentOS enters `/agentos`. |
| Continuous journey | Each selected subject renders its horizontal lifecycle at the top of its own flow. After identity creation the URL is replaced with a resource-specific resume URL. |
| Page ownership | Pages settle route/screen identity and compose blocks only. They do not fetch provisioning data, translate block copy or draw structural hosts. |
| Block ownership | `TemplateAppProvisioning` and `AgentOSProvisioning` separately own API, copy, snapshots, navigation and event reconciliation. They never import each other. |
| Shared shape | `LifecycleStep` and `RequestSummary` are promoted because both domain blocks consume the same closed, domain-neutral shapes. Existing `Field` is reused. |
| Realtime identity | Academy filters `deployment.status` by `expertDeploymentId`. AgentOS follows `order.fulfilling` by `orderId`, then resolves `myAgentWorkspace.catalogOrder.id` and filters `workspace.status` by the resulting workspace id. |
| Re-entry | Academy resumes from `siteId` and `myExpertSiteDeployment(siteId)`. AgentOS resumes from `orderId`, `myCatalogOrders`, `myInvoices` and `myAgentWorkspace { catalogOrder { id } }`; Socket.IO never replaces the snapshot. |
| AgentOS payment | `orderCatalogItem` returns `pending_payment`; UI renders an honest `awaiting_payment` state and links to `/wallet`. Provisioning starts only after payment moves the order to fulfillment. |
| Template availability | Current production flow supports `ai_academy`. `mmo` remains a Template App catalogue sibling but renders unavailable/no provisioning CTA until backend marks and wires it provisionable. |
| Management destination | Academy ready action returns to `/apps`; AgentOS ready state remains on `/agentos`, whose independent workspace-list block is the management surface. |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | AppsRoute | REUSE | `apps/app/src/app/[locale]/(console)/apps/page.tsx` | same | Next console router → `AppsPage` | mount only | Existing route already mounts one page and draws nothing. |
| route | TemplateAppNewRoute | ADD | absent | `apps/app/src/app/[locale]/(console)/apps/new/[templateKey]/page.tsx` | Apps catalogue CTA → `TemplateAppProvisioningPage` new context | mount only | Preserves selected template identity in the address before creation. |
| route | TemplateAppResumeRoute | ADD | absent | `apps/app/src/app/[locale]/(console)/apps/[siteId]/provisioning/page.tsx` | post-create replace/re-entry → `TemplateAppProvisioningPage` resume context | mount only | A reload can recover the exact site and deployment snapshot. |
| route | AgentOSRoute | ADD | absent | `apps/app/src/app/[locale]/(console)/agentos/page.tsx` | ConsoleNav/Overview → `AgentOSPage` new context | mount only | AgentOS is an independent product surface. |
| route | AgentOSOrderRoute | ADD | absent | `apps/app/src/app/[locale]/(console)/agentos/orders/[orderId]/page.tsx` | post-order replace/re-entry → `AgentOSPage` resume context | mount only | Order identity survives payment, fulfillment and reload. |
| route | ProvisioningRoute | REMOVE | `apps/app/src/app/[locale]/(console)/provisioning/page.tsx` partial source | absent | ConsoleNav duplicate entries and partial `ProvisioningPage` | none | Generic provisioning is a lifecycle, not a product destination. |
| page | AppsPage | MODIFY | `apps/app/src/components/pages/AppsPage/index.tsx` + `component.tsx` | same | AppsRoute; template offer CTA | `titled-section-stack-page`, `template-offer-row` | Preserve current catalogue/owned-app screen and add one route action keyed by `templateKey`. |
| page | OverviewPage | MODIFY | `apps/app/src/components/pages/OverviewPage/index.tsx` + `component.tsx` | same | OverviewRoute; AgentOS section CTA | existing overview contracts | Wire existing empty/open AgentOS action to the independent `/agentos` surface. |
| page | TemplateAppProvisioningPage | ADD | absent | `apps/app/src/components/pages/TemplateAppProvisioningPage/index.tsx` + `component.tsx` | TemplateAppNewRoute, TemplateAppResumeRoute | `titled-section-stack-page` | Own only new/resume screen identity and compose one template provisioning block. |
| page | AgentOSPage | ADD | absent | `apps/app/src/components/pages/AgentOSPage/index.tsx` + `component.tsx` | AgentOSRoute, AgentOSOrderRoute | `titled-section-stack-page` | Compose workspace management first, then independent AgentOS provisioning. |
| page | ProvisioningPage | REMOVE | `apps/app/src/components/pages/ProvisioningPage/index.tsx` + `component.tsx` partial source | absent | ProvisioningRoute only | rejected flat tree | Removes peer-product state, inline structure and untranslated copy. |
| layout | ConsoleNav | MODIFY | `apps/app/src/components/layouts/ConsoleNav/index.tsx` partial source | same | console layout destinations | `home-services-account-nav` | Route AgentOS to `/agentos`; retain Apps; remove `provisioning` key and destination. |
| block | TemplateAppProvisioning | ADD | absent | `apps/app/src/components/blocks/provisioning/TemplateAppProvisioning/index.tsx` + `component.tsx` | TemplateAppProvisioningPage | `horizontal-lifecycle-run`, `request-beside-live-status` | Own academy create/provision/snapshot/realtime and unsupported-template state. |
| block | AgentOSWorkspaceList | ADD | absent | `apps/app/src/components/blocks/agentos/AgentOSWorkspaceList/index.tsx` + `component.tsx` | AgentOSPage before creation flow | `fleet-resource-list` | Own the independent AgentOS management list and let it land separately. |
| block | AgentOSProvisioning | ADD | absent | `apps/app/src/components/blocks/provisioning/AgentOSProvisioning/index.tsx` + `component.tsx` | AgentOSPage | `horizontal-lifecycle-run`, `request-beside-live-status` | Own catalogue tier/order/payment/snapshot/realtime without template-app branches. |
| block | FleetRow | REUSE | `apps/app/src/components/blocks/provisioning/FleetRow/index.tsx` | same | AppsPage, OverviewPage, AgentOSWorkspaceList | `identity-kind-status-action-row` | Existing resource row already owns lifecycle tone/action shape. |
| composite | LifecycleStep | ADD | absent | `packages/ui/src/composites/LifecycleStep/index.tsx` | TemplateAppProvisioning and AgentOSProvisioning pure halves | `ordinal-over-label-and-state` | Second real consumer justifies one closed step shape. |
| composite | RequestSummary | ADD | absent | `packages/ui/src/composites/RequestSummary/index.tsx` | both provisioning pure halves | `subject-over-muted-caption-with-action` | Both flows render one identity/detail/action summary without domain vocabulary. |
| composite | Field | REUSE | `packages/ui/src/composites/Field/index.tsx` | same | TemplateAppProvisioning slug form | `label-field-hint` | Existing accessible labelled-input composite already closes the required shape. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| TemplateAppNewRoute | route params / mount | ADD | absent | reads `templateKey` and mounts `TemplateAppProvisioningPage` with `{ mode: "new", templateKey }` | Next router → TemplateAppProvisioningPage | Build proves exact dynamic param and one page mount. |
| TemplateAppResumeRoute | route params / mount | ADD | absent | reads `siteId` and mounts `TemplateAppProvisioningPage` with `{ mode: "resume", siteId }` | Next router → TemplateAppProvisioningPage | Build proves exact dynamic param and one page mount. |
| AgentOSRoute | route mount | ADD | absent | mounts `AgentOSPage` with `{ mode: "new" }` | Next router → AgentOSPage | Build proves route draws nothing beyond the page mount. |
| AgentOSOrderRoute | route params / mount | ADD | absent | reads `orderId` and mounts `AgentOSPage` with `{ mode: "resume", orderId }` | Next router → AgentOSPage | Build proves exact dynamic param and one page mount. |
| ProvisioningRoute | route mount | REMOVE | mounts rejected `ProvisioningPage` | absent | removed route and page | `rg` proves no `/provisioning` route owner or import remains. |
| AppsPage | `TemplateOfferRowView` | RETYPE | id/name/tagline/kind/price/action label | add required `templateKey` and `actionDisabled`; unsupported templates remain visible without an executable create action | `AppsPage.catalogueView` → `_AppsPage.offerRow` | Typecheck, exact `templateKey` call-site search and disabled MMO browser state. |
| AppsPage | `AppsPageViewProps.onBuildTemplate` | ADD | absent; offer button has no press | required `(templateKey: string) => void` | connected `AppsPage` router → `_AppsPage` | Browser click reaches `/apps/new/ai_academy`; no undefined press remains. |
| OverviewPage | `OverviewPageActions.openAgentOs` | ADD | AgentOS see-more actions are undefined | optional action supplied by connected page for both empty and answered states | `OverviewPage` → `_OverviewPage.agentOsSection` | Source search and browser CTA reach `/agentos`. |
| TemplateAppProvisioningPage | `TemplateAppProvisioningPageProps` | ADD | absent | discriminated `{ mode: "new"; templateKey: string } \| { mode: "resume"; siteId: string }` | two template routes → page → block | Both route builds typecheck and reload their exact identity. |
| `_TemplateAppProvisioningPage` | view props | ADD | absent | same screen context only; no fetched data/copy | connected page → pure page | Page-folder search has no API/realtime imports or structural classes. |
| AgentOSPage | `AgentOSPageProps` | ADD | absent | `{ mode: "new" } \| { mode: "resume"; orderId: string }` | two AgentOS routes → page → block | Both route builds typecheck and resume exact order. |
| `_AgentOSPage` | view props | ADD | absent | same screen context only | connected page → pure page | Page composes `AgentOSWorkspaceList` then `AgentOSProvisioning`; no data threading. |
| ProvisioningPage | `ProvisioningPageProps` and `ProvisioningProduct` | REMOVE | peer `agentos \| academy`, slug, busy, message, error, realtime and handlers | absent | removed route/page only | `rg` finds no `ProvisioningPage`, `ProvisioningProduct` or `/provisioning` import/route. |
| TemplateAppProvisioning | public props | ADD | absent | `{ context: { mode: "new"; templateKey: string } \| { mode: "resume"; siteId: string } }` | TemplateAppProvisioningPage | Exact two page call sites; block owns all API/copy. |
| `_TemplateAppProvisioning` | state union | ADD | absent | `catalog_loading \| unsupported \| request \| submitting \| accepted \| preparing \| ready \| failed`, each with resolved labels/actions and exact ids | connected block → pure twin | Build plus browser fixtures for every branch; impossible mixed states do not typecheck. |
| AgentOSWorkspaceList | public props | KEEP | absent owner | no public business props | AgentOSPage only | Connected block owns request/copy and renders exact pure twin on every path. |
| `_AgentOSWorkspaceList` | state union | ADD | absent | `resting \| empty \| answered \| refused` with resolved workspace rows | connected block → pure twin | Browser states and source-level discriminated union. |
| AgentOSProvisioning | public props | ADD | absent | `{ context: { mode: "new" } \| { mode: "resume"; orderId: string } }` | AgentOSPage | Exact call-site search. |
| `_AgentOSProvisioning` | state union | ADD | absent | `catalog_loading \| request \| submitting \| awaiting_payment \| accepted \| preparing \| ready \| failed` with exact order/workspace ids | connected block → pure twin | Browser fixtures cover payment and provisioning separately. |
| LifecycleStep | `LifecycleStepProps` | ADD | absent | `props: { ordinal: string; label: string; state: "done" \| "current" \| "upcoming" }` | both pure provisioning blocks | Two domain consumers render the same closed shape. |
| RequestSummary | `RequestSummaryProps` | ADD | absent | `props: { subject: string; detail: string; actionLabel?: string }`, `on.press?` | both pure provisioning blocks | Two domain consumers render the same closed shape and action semantics. |
| ConsoleNav | `ConsoleDestinationKey` / `DESTINATIONS` | RETYPE | includes `provisioning`; AgentOS and Provisioning both route `/provisioning` | remove `provisioning`; AgentOS routes `/agentos` | ConsoleNav renderer and translation catalogue | Source search proves one owner per address. |
| Realtime module | `useProvisioningRealtime` | RETYPE | `(accessToken)`, emits any owner event as one global state | `({ accessToken, target })`, where target is `order`, `deployment` or `workspace` with exact id; connection state and matching event stay discriminated | two connected provisioning blocks | Unitless source probe plus browser proves unrelated owner events do not advance the flow. |

### SUPPORTING PRODUCTION BOUNDARY

| Path | Action | Exact responsibility |
|---|---|---|
| `packages/ui/src/contracts/index.ts` | MODIFY | Add live keys `horizontal-lifecycle-run`, `ordinal-over-label-and-state`, `request-beside-live-status`, `subject-over-muted-caption-with-action` with exact named slots/hosts/reasons. |
| `packages/ui/src/index.ts` | MODIFY | Export `LifecycleStep`, `RequestSummary` and their public types. |
| `apps/app/src/modules/api/console.ts` | MODIFY | Add `catalogOrder { id }` to `AgentWorkspaceRow`/query; retain typed academy create/provision/deployment snapshot and AgentOS order/invoice/order snapshots. |
| `apps/app/src/modules/realtime/provisioning.ts` | MODIFY | Authenticate, owner-subscribe, reconnect and filter by exact target id; timestamp-dedupe deployment/workspace events; order events reconcile through snapshots. |
| `apps/app/src/messages/vi.json` | MODIFY | Add all Apps/AgentOS/template provisioning, payment, reconnect, ready, failed and unsupported copy; remove generic peer-product provisioning copy. |
| `apps/app/src/messages/en.json` | MODIFY | Mirror the exact message-key tree in English. |
| `apps/app/package.json` | MODIFY | Keep `socket.io-client` required by the approved realtime module. |
| `package-lock.json` | MODIFY | Keep the matching locked dependency graph. |

### OWNER STATES AND TRANSITIONS

| Flow | State order | Snapshot / event rule | Ready action |
|---|---|---|---|
| Học viện chuyên gia (`ai_academy`) | catalog loading → request → submitting → accepted → preparing → ready/failed | `createExpertSite` yields site; `provisionExpertSite` yields deployment id; `myExpertSiteDeployment(siteId)` is truth; matching `deployment.status` may advance it | `/apps` |
| Unsupported template (`mmo` today) | catalog loading → unsupported | No mutation and no fake progress; backend registry currently says MMO is not provisionable | Back to `/apps` |
| AgentOS | catalog loading → request → submitting → awaiting payment → accepted/fulfilling → preparing → ready/failed | order and invoice snapshots own payment; `order.fulfilling` matches order; `myAgentWorkspace.catalogOrder.id` resolves workspace; matching `workspace.status` advances it | remain `/agentos`, workspace list refreshes |
| Socket reconnect | any waiting state → connecting → snapshot reconcile → connected | Snapshot wins; stale event timestamps and unrelated ids are ignored | unchanged |

### ACCEPTANCE EVIDENCE

| Proof | Command / state |
|---|---|
| Architecture | `rg` proves page folders contain no API/realtime imports, block folders are exact connected/pure twins, and removed flat source has no consumers. |
| Contracts | Every new key has live call sites; no literal structural host/class or runtime class composition appears outside owners. |
| Types | `npm run typecheck --workspace=@nivo/app`. |
| Lint | `npm run lint --workspace=@nivo/app`. |
| Build | `npm run build --workspace=@nivo/app`. |
| Browser desktop/narrow | Apps → Học viện request → resource URL → deployment progress → Apps; AgentOS → order → waiting payment → fulfillment → workspace progress → AgentOS management. |
| Re-entry | Reload both resource URLs during preparing; snapshots restore the same step before Socket.IO reconnects. |
| Isolation | Emit or simulate another owned deployment/workspace id; neither visible flow advances. |
| Unsupported template | Direct `/apps/new/mmo` renders unavailable and performs no mutation. |

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate revision | `nivo-provisioning-owner-flows-r6` implements Direction A as two owner-specific flows with shared presentation shapes only. |
| Runtime correction | AgentOS exposes its real payment seam; MMO is categorized correctly without claiming current provisioning support. |
| Approval state | Waiting for explicit approval of r6 before Design Apply. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md` | `modified` — appended Review r6 with exact component, props, state and production boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve exact revision | **Duyệt `nivo-provisioning-owner-flows-r6`**; or identify a route, owner, payment state or unsupported-MMO verdict to revise. |

### WARNINGS

| Warning | Impact |
|---|---|
| Preview r3 visually demonstrates hierarchy but omits AgentOS `awaiting_payment`. | Production must follow the live order contract recorded in r6, not pretend provisioning starts from an unpaid order. |
| Backend registry documents MMO as not provisionable today. | Shipping an active MMO create CTA would be false; MMO needs its own backend Feature Plan/Review/Apply before this frontend flow can enable it. |
| Current FE worktree still contains rejected partial Apply source after baseline `242b75c`. | Approved Apply must rewrite/remove it; it is not implementation evidence. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Review r5 peer-product flow | Owner-specific Apps/Template App and AgentOS flows | User: AgentOS is separate; Học viện/MMO belong to Template App. |
| Immediate AgentOS “preparing” after `orderCatalogItem` | `awaiting_payment`, then fulfillment/provisioning | Backend creates an unpaid invoice and performs no provisioning at order time. |
| Enabled MMO provisioning CTA | Unsupported state with no mutation | Backend explicitly records MMO as not currently provisionable. |
| Global unfiltered realtime state | Target-id filtered hook plus snapshot reconciliation | Owner rooms may emit updates for multiple concurrent resources. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of r6 | User says `duyệt`. |
| Production rewrite and proof | `$starci-fe-design-apply` after approval. |
| MMO provisioning | Separate backend feature lifecycle followed by a bounded frontend revision. |

Approved revision: `nivo-provisioning-owner-flows-r6`

## apply r7

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
| App | nivo / @nivo/app |
| Repo / branch | Frontend D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary; Backend D:\Repositories\nivo-backend @ main |
| Purpose | Áp dụng revision r6 thành hai luồng owner-specific: Template App provisioning và AgentOS provisioning/management. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md |
| Language | vi |
| Phase | apply |
| Touching | Workflow này; các route AgentOS/Template App đã duyệt; ConsoleNav, AppsPage, OverviewPage; TemplateAppProvisioningPage, AgentOSPage; TemplateAppProvisioning, AgentOSProvisioning, AgentOSWorkspaceList; realtime/API/copy/dependency; UI contracts, LifecycleStep, RequestSummary và exports đúng boundary r6. |

Applied revision: `nivo-provisioning-owner-flows-r6`
Baseline commit: `242b75ca7d962e63d463d18cd9a5c36359f579ab`
Tracked diff: `242b75ca7d962e63d463d18cd9a5c36359f579ab..worktree`

### ROW-TO-DIFF PROOF

| Approved row | Diff proof |
|---|---|
| TemplateAppNewRoute / TemplateAppResumeRoute | Added exact dynamic routes under `/apps/new/[templateKey]` and `/apps/[siteId]/provisioning`; each mounts only `TemplateAppProvisioningPage`. |
| AgentOSRoute / AgentOSOrderRoute | Added `/agentos` and `/agentos/orders/[orderId]`; each mounts only `AgentOSPage`. |
| ProvisioningRoute / ProvisioningPage | Rejected partial files were absent from the baseline and remain absent; `rg` reports `NO_STALE_GENERIC_PROVISIONING_OWNER`. |
| AppsPage | Added template-key routing and required disabled action; `ai_academy` creates, `mmo` remains visible and unavailable. |
| OverviewPage | Both AgentOS entry states route to `/agentos`. |
| TemplateAppProvisioningPage / AgentOSPage | Added connected/pure page twins that compose blocks only; probe reports `NO_PAGE_API_REALTIME_OR_STRUCTURAL_CLASS`. |
| ConsoleNav | AgentOS now owns `/agentos`; no generic provisioning destination exists. |
| TemplateAppProvisioning | Added academy-only create, provision, deployment snapshot, reconnect and exact deployment-event reconciliation. |
| AgentOSWorkspaceList | Added independent AgentOS workspace management list. |
| AgentOSProvisioning | Added catalogue selection, order, payment, fulfillment, workspace discovery, reconnect and exact workspace-event reconciliation. |
| FleetRow / Field | Reused unchanged as approved. |
| LifecycleStep / RequestSummary | Added both closed, domain-neutral composites and exported their types. |
| Contracts | Added the four approved live keys and responsive journey/request/status arrangement. |
| API / realtime / copy / dependency | Added catalog-order workspace identity, typed operations, exact target filtering, bilingual copy and locked Socket.IO client. |

### VERIFICATION

| Proof | Result |
|---|---|
| Production build | `npm run build --workspace=@nivo/app` passed; route manifest contains `/[locale]/agentos`, `/[locale]/agentos/orders/[orderId]`, `/[locale]/apps/new/[templateKey]`, `/[locale]/apps/[siteId]/provisioning`. |
| Types | `npm run typecheck` passed all four workspaces. |
| Lint | `npm run lint --workspace=@nivo/app` and `npm run lint --workspace=@nivo/ui` passed. |
| Diff hygiene | `git diff --check 242b75ca7d962e63d463d18cd9a5c36359f579ab` passed. |
| Architecture | Page folders have no API/realtime imports or structural classes; no stale generic provisioning owner remains. |
| Browser unauthenticated | Real `/en/agentos` route rendered the new AgentOS shell and lifecycle before session resolution, then correctly redirected to `/en/authentication`; browser console had no runtime error. |
| Browser authenticated | Owed because the retained in-app browser session is currently signed out. |

### OUTPUTS

| Concept | Result |
|---|---|
| Owner-specific provisioning | AgentOS is an independent product with payment and workspace management; Học viện chuyên gia is the supported `ai_academy` Template App flow under Ứng dụng. |
| Realtime truth | Both flows reconcile snapshots first and accept only exact target-id Socket.IO events; reconnect cannot advance another resource. |
| Unsupported MMO | MMO remains correctly categorized in the Template App catalogue with a disabled create action until backend provisioning exists. |

### CHANGES

| Tree | Details |
|---|---|
| `apps/app/src/app/[locale]/(console)/agentos/page.tsx` | `added` — AgentOS new-flow route. |
| `apps/app/src/app/[locale]/(console)/agentos/orders/[orderId]/page.tsx` | `added` — resumable AgentOS order route. |
| `apps/app/src/app/[locale]/(console)/apps/new/[templateKey]/page.tsx` | `added` — selected Template App create route. |
| `apps/app/src/app/[locale]/(console)/apps/[siteId]/provisioning/page.tsx` | `added` — resumable Template App deployment route. |
| `apps/app/src/components/layouts/ConsoleNav/index.tsx` | `modified` — route AgentOS independently and remove generic provisioning ownership. |
| `apps/app/src/components/pages/AppsPage/index.tsx` | `modified` — route enabled template offers by template key. |
| `apps/app/src/components/pages/AppsPage/component.tsx` | `modified` — render required template key and disabled unavailable action. |
| `apps/app/src/components/pages/OverviewPage/index.tsx` | `modified` — provide AgentOS navigation action. |
| `apps/app/src/components/pages/OverviewPage/component.tsx` | `modified` — wire AgentOS action in empty and answered states. |
| `apps/app/src/components/pages/TemplateAppProvisioningPage/index.tsx` | `added` — connected Template App page twin. |
| `apps/app/src/components/pages/TemplateAppProvisioningPage/component.tsx` | `added` — pure page composition. |
| `apps/app/src/components/pages/AgentOSPage/index.tsx` | `added` — connected AgentOS page twin. |
| `apps/app/src/components/pages/AgentOSPage/component.tsx` | `added` — pure management/provisioning composition. |
| `apps/app/src/components/blocks/provisioning/TemplateAppProvisioning/index.tsx` | `added` — academy API, snapshot, navigation and realtime owner. |
| `apps/app/src/components/blocks/provisioning/TemplateAppProvisioning/component.tsx` | `added` — academy provisioning state renderer. |
| `apps/app/src/components/blocks/provisioning/AgentOSProvisioning/index.tsx` | `added` — AgentOS catalogue/order/payment/snapshot/realtime owner. |
| `apps/app/src/components/blocks/provisioning/AgentOSProvisioning/component.tsx` | `added` — AgentOS provisioning state renderer. |
| `apps/app/src/components/blocks/agentos/AgentOSWorkspaceList/index.tsx` | `added` — independent workspace query owner. |
| `apps/app/src/components/blocks/agentos/AgentOSWorkspaceList/component.tsx` | `added` — workspace management state renderer. |
| `apps/app/src/modules/api/console.ts` | `modified` — typed provisioning operations and catalog-order workspace identity. |
| `apps/app/src/modules/realtime/provisioning.ts` | `added` — authenticated, target-filtered Socket.IO hook with reconnect/dedupe. |
| `apps/app/src/messages/vi.json` | `modified` — Vietnamese owner-flow states and actions. |
| `apps/app/src/messages/en.json` | `modified` — mirrored English owner-flow states and actions. |
| `apps/app/package.json` | `modified` — Socket.IO client dependency. |
| `package-lock.json` | `modified` — matching locked dependency graph. |
| `packages/ui/src/contracts/index.ts` | `modified` — four approved layout/content contracts. |
| `packages/ui/src/composites/LifecycleStep/index.tsx` | `added` — shared lifecycle-step composite. |
| `packages/ui/src/composites/RequestSummary/index.tsx` | `added` — shared request-summary composite. |
| `packages/ui/src/index.ts` | `modified` — export new composites and types. |
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md` | `modified` — recorded approval, Apply boundary, row reconciliation and proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None. |

### WARNINGS

| Warning | Impact |
|---|---|
| Root `npm run lint` remains blocked by pre-existing `plugins/eslint-canon/` trust-tree drift before product lint runs. | Approved app/UI workspace lint gates pass; repairing the canonical plugin is outside r6 and needs its own lint-sync lifecycle. |
| Authenticated browser fixtures are unavailable in the current signed-out session. | End-to-end visual/state proof remains open; code/build/type/architecture proof is complete. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Generic page switching between AgentOS and academy | Separate AgentOS surface and Template App-owned academy flow | User: AgentOS là sản phẩm riêng; Học viện chuyên gia/MMO là sản phẩm của Template App. |
| Journey inside sidebar | Horizontal journey above request/status content | User required the journey as the flex row on top. |
| Page-owned inline structure | Page twins compose connected domain blocks and shared composites | User rejected the flat page without blocks/composites. |

### OWED

| Owed | Cleared by |
|---|---|
| Authenticated desktop and narrow browser proof for Apps → academy, AgentOS payment/provisioning, re-entry, exact-id isolation and direct MMO unsupported route. | Sign in once in the retained Nivo in-app browser tab, then rerun Design Apply verification against the live routes. |
| Final Apply closure | Append a final Apply revision after the authenticated browser matrix passes. |

## apply r8

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
| App | nivo / @nivo/app |
| Repo / branch | Frontend D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary; Backend D:\Repositories\nivo-backend @ main |
| Purpose | Chạy authenticated browser proof, sửa lỗi snapshot re-entry trong boundary và ghi contract gap academy. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md |
| Language | vi |
| Phase | apply |
| Touching | Workflow này và hai connected provisioning blocks đã duyệt trong r6; backend chỉ đọc và chạy local. |

Applied revision: `nivo-provisioning-owner-flows-r6`
Baseline commit: `242b75ca7d962e63d463d18cd9a5c36359f579ab`
Tracked diff: `242b75ca7d962e63d463d18cd9a5c36359f579ab..worktree`

### AUTHENTICATED BROWSER EVIDENCE

| State | Result |
|---|---|
| Sign in | Tài khoản tester local đăng nhập tại canonical origin `http://localhost:3066`; Overview render Apps và AgentOS độc lập. |
| Apps catalogue | `/en/apps` render owned apps và Template App catalogue; `ai_academy` có Build. Backend hiện chỉ trả một template nên MMO được chứng minh bằng direct route. |
| MMO unsupported | `/en/apps/new/mmo` render horizontal journey, “Template not available yet”, Back to Apps; không có create mutation. |
| Academy request | `/en/apps/new/ai_academy` render horizontal journey phía trên và slug request/status phía dưới. |
| Academy live submit | Tạo `codex-academy-7683096` trả site `45ffa233-1902-494d-9daa-2874693c691c`, sau đó backend từ chối provision vì site còn `draft`. |
| AgentOS request/payment | `/en/agentos` render workspace management trước flow; request tạo order `997a6021-d228-44a9-9963-e9cff38dac86`, replace sang resource URL và render Waiting for payment. |
| AgentOS re-entry | Reload ban đầu chạy snapshot trước session restore và rơi vào failed; thêm `accessToken` gate trong hai connected blocks. Reload lại giữ nguyên resource URL và phục hồi Waiting for payment. |
| AgentOS ready/manage | Resume existing paid order `486a1803-1c23-4d62-bc8b-b0c9c8e23963` map đúng workspace active, render Ready to manage; Manage AgentOS quay về `/en/agentos` và workspace list vẫn hiện. |
| Responsive safety | Desktop viewport `1280x720` có `scrollWidth=1280`, không horizontal overflow. Browser runtime không cung cấp viewport resize API cho narrow proof. |

### OUTPUTS

| Concept | Result |
|---|---|
| AgentOS flow | Authenticated request, payment, snapshot re-entry, ready mapping và management destination đều đã được chứng minh trên dữ liệu local thật. |
| Session-safe snapshots | Cả hai resume blocks chỉ hỏi snapshot sau khi access token được restore; không còn false failed khi reload. |
| Academy contract verdict | r6 không thể hoàn tất: `createExpertSite` tạo Draft nhưng `provisionExpertSite` chỉ nhận Live. Đây là API-action gap, không phải lỗi K8s hay Socket.IO. |

### CHANGES

| Tree | Details |
|---|---|
| `apps/app/src/components/blocks/provisioning/AgentOSProvisioning/index.tsx` | `modified` — gate resume reconciliation bằng restored access token. |
| `apps/app/src/components/blocks/provisioning/TemplateAppProvisioning/index.tsx` | `modified` — gate resume snapshot bằng restored access token. |
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md` | `modified` — ghi authenticated browser evidence và academy contract gap. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Academy correction | Chuyển sang Review r9 để thay create → provision bằng create → publish → accepted/poll deployment (recommended); hoặc mở backend Feature lifecycle để thay đổi publication/provision contract. |

### WARNINGS

| Warning | Impact |
|---|---|
| `publishExpertSite` hiện vừa chuyển site Live vừa dispatch academy deployment; gọi tiếp `provisionExpertSite` sẽ khởi động hai pipeline khác nhau. | Không được thêm publish trước provision như một workaround. |
| MMO chưa có row trong live catalogue response. | Disabled catalogue CTA chỉ có source proof; direct unsupported route đã pass. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Retry `provisionExpertSite` trên Draft | Return to Review for the real publication contract | Backend deliberately rejects every non-Live site. |
| Call `publishExpertSite` then `provisionExpertSite` | Use exactly one deployment owner | Publish already dispatches legacy expert deployment; the second call would duplicate deployment. |

### OWED

| Owed | Cleared by |
|---|---|
| Academy accepted/preparing/ready/re-entry/Socket.IO browser proof | Approve and Apply Review r9, then submit a fresh academy test slug. |
| Narrow viewport visual proof | Run the production route in a controllable 390px browser viewport; current in-app runtime exposes fixed 1280px only. |

## review r9

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
| App | nivo / @nivo/app |
| Repo / branch | Frontend D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary; Backend D:\Repositories\nivo-backend @ main |
| Purpose | Khóa correction cho academy theo live publication contract mà không tạo hai deployment pipeline. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này và read-only source/browser evidence; không sửa production source trong Review. |

Candidate revision: `nivo-provisioning-owner-flows-r9-publish-contract`

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | TemplateAppNewRoute | REUSE | `apps/app/src/app/[locale]/(console)/apps/new/[templateKey]/page.tsx` | same | Next router → TemplateAppProvisioningPage | mount only | Route identity remains correct. |
| route | TemplateAppResumeRoute | REUSE | `apps/app/src/app/[locale]/(console)/apps/[siteId]/provisioning/page.tsx` | same | resource URL → TemplateAppProvisioningPage | mount only | Site identity remains the resume key. |
| page | TemplateAppProvisioningPage | REUSE | `apps/app/src/components/pages/TemplateAppProvisioningPage/index.tsx` + `component.tsx` | same | two template routes → block | `titled-section-stack-page` | Page composition does not change. |
| block | TemplateAppProvisioning | MODIFY | `apps/app/src/components/blocks/provisioning/TemplateAppProvisioning/index.tsx` + `component.tsx` | same | TemplateAppProvisioningPage | `horizontal-lifecycle-run`, `request-beside-live-status` | Use the backend's actual publication/deployment contract and implement already-approved `accepted`. |
| composite | LifecycleStep | REUSE | `packages/ui/src/composites/LifecycleStep/index.tsx` | same | both provisioning blocks | `ordinal-over-label-and-state` | Presentation shape is already correct. |
| composite | RequestSummary | REUSE | `packages/ui/src/composites/RequestSummary/index.tsx` | same | both provisioning blocks | `subject-over-muted-caption-with-action` | Presentation shape is already correct. |
| block | AgentOSProvisioning | REUSE | `apps/app/src/components/blocks/provisioning/AgentOSProvisioning/index.tsx` + `component.tsx` | same | AgentOSPage | approved AgentOS contracts | Browser matrix passed after in-boundary session gate. |
| page | Remaining r6 owners | REUSE | paths frozen in Review r6 | same | existing r6 call sites | existing r6 contracts | Academy API correction does not change hierarchy, routes, nav, AgentOS or shared presentation. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| TemplateAppProvisioning | public props | KEEP | discriminated new/resume context | same | TemplateAppProvisioningPage | Exact two route call sites remain unchanged. |
| `_TemplateAppProvisioning` | state union | KEEP | includes `accepted` but connected owner never emits it | same union; connected owner emits `accepted` after publish while waiting for first deployment snapshot | connected block → pure twin | Typecheck plus accepted browser state. |
| console API | `publishExpertSite(siteId)` | ADD | absent | typed mutation `{ siteId, published: true }`, returns `{ id, slug, status }` | TemplateAppProvisioning submit only | Live mutation plus typecheck; no second deployment mutation follows it. |
| console API | `provisionExpertSite(siteId)` consumer | REMOVE | TemplateAppProvisioning calls immediately after create | no academy page consumer in this flow; export may remain for its separate durable-operation owner | TemplateAppProvisioning only | `rg` proves flow has no publish+provision double dispatch. |
| TemplateAppProvisioning | submit transition | RETYPE | create Draft → provision (always refused) | create Draft → publish Live/dispatch → replace resource URL → accepted → poll `myExpertSiteDeployment(siteId)` → preparing/ready/failed | slug form, resume route, realtime target | Browser proves resource URL before deployment row and snapshot/event convergence after row exists. |
| TemplateAppProvisioning | resume snapshot | RETYPE | null deployment means failed | null deployment means accepted and polling; failed only from mutation/refused snapshot/status | resume route | Reload immediately after publish remains accepted instead of false failed. |
| Remaining r6 interfaces | public props/APIs | KEEP | Review r6 | unchanged | Review r6 producers/call sites | Existing typecheck/build/browser evidence remains binding. |

### SUPPORTING PRODUCTION BOUNDARY

| Path | Action | Exact responsibility |
|---|---|---|
| `apps/app/src/modules/api/console.ts` | MODIFY | Add typed `publishExpertSite`; stop using `provisionExpertSite` from the academy creation block. |
| `apps/app/src/components/blocks/provisioning/TemplateAppProvisioning/index.tsx` | MODIFY | Emit accepted, poll deployment snapshot, then attach exact deployment target. |
| `apps/app/src/messages/en.json` | MODIFY | Add accepted/publication copy only if existing AgentOS accepted copy cannot truthfully serve academy. |
| `apps/app/src/messages/vi.json` | MODIFY | Mirror the exact message-key tree. |

### OWNER STATES AND TRANSITIONS

| Flow | State order | Snapshot / event rule | Ready action |
|---|---|---|---|
| Academy new | catalog loading → request → submitting → accepted → preparing → ready/failed | `createExpertSite` creates Draft; `publishExpertSite(true)` owns Live + deployment dispatch; null deployment polls; exact `deployment.status` advances after snapshot identity exists | `/apps` |
| Academy resume | restoring session → accepted while snapshot is null → preparing/ready/failed when snapshot exists | Access token gates first query; snapshot wins over Socket.IO | `/apps` |
| AgentOS | unchanged from r6 plus proven session gate | exact order/workspace ids and snapshots | `/agentos` |

### ACCEPTANCE EVIDENCE

| Proof | Command / state |
|---|---|
| No double dispatch | `rg` shows TemplateAppProvisioning calls `publishExpertSite` and not `provisionExpertSite`. |
| Types/lint/build | `npm run typecheck --workspace=@nivo/app`; `npm run lint --workspace=@nivo/app`; `npm run build --workspace=@nivo/app`. |
| Browser academy | New slug reaches resource URL, accepted while no deployment row, then preparing/ready or honest failed from matching snapshot/event. |
| Re-entry | Reload resource URL during accepted/preparing and recover from snapshot without false authentication failure. |
| Isolation | Unrelated deployment id cannot advance the visible journey; source exact-id probe remains green. |

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate correction | Use current `publishExpertSite` as the single academy deployment door; expose accepted while its asynchronous deployment row appears. |
| Preserved design | Product hierarchy, top horizontal journey, page/block/composite ownership, AgentOS flow and management destinations remain unchanged. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md` | `modified` — appended evidence-backed Review r9 candidate. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve exact revision | **Duyệt `nivo-provisioning-owner-flows-r9-publish-contract`** (recommended); hoặc yêu cầu backend Feature lifecycle để thay publication/provision contract thay vì dùng live publish flow. |

### WARNINGS

| Warning | Impact |
|---|---|
| `publishExpertSite` dispatches the legacy academy deploy path; `provisionExpertSite` dispatches a different durable path. | r9 deliberately selects one live owner; it does not claim the durable pipeline is now the academy creation path. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| r6 create → provision transition | r9 create → publish → accepted/poll | Live browser and backend guard prove Draft can never enter `provisionExpertSite`. |
| publish then provision | publish only | Two calls dispatch two different charts/pipelines. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of r9 | User says `duyệt`. |
| Academy production correction and final browser proof | Resume Design Apply after approval. |

Approved revision: `nivo-provisioning-owner-flows-r9-publish-contract`

## apply r10

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
| App | nivo / @nivo/app |
| Repo / branch | Frontend D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary; Backend D:\Repositories\nivo-backend @ main |
| Purpose | Áp dụng publication contract đã duyệt cho Template App academy và đóng browser/gate evidence trung thực. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md |
| Language | vi |
| Phase | apply |
| Touching | Production boundary của Review r9, một journey-state correction trong cùng connected block, và workflow này. Backend chỉ đọc/chạy local. |

Applied revision: `nivo-provisioning-owner-flows-r9-publish-contract`
Baseline commit: `242b75ca7d962e63d463d18cd9a5c36359f579ab`
Tracked diff: `242b75ca7d962e63d463d18cd9a5c36359f579ab..worktree`

### ACCEPTANCE EVIDENCE

| Proof | Result |
|---|---|
| Single deployment owner | `TemplateAppProvisioning` gọi `createExpertSite` rồi `publishExpertSite`; không gọi `provisionExpertSite`, nên không double-dispatch. |
| Accepted before identity | Authenticated tester tạo slug `codex-r9-8733780`; UI hiện `App accepted`, resource id `e1ce86ee-7373-404d-b2e2-8cd7abcf16a9`, rồi replace sang `/en/apps/e1ce86ee-7373-404d-b2e2-8cd7abcf16a9/provisioning`. |
| Snapshot convergence | Poll tìm thấy deployment `2551015a-532f-4a6c-b40f-add93a06f502`; live local deployment chuyển honest failed với backend `lastError=tools/provision.mjs failed: unknown`. |
| Re-entry | Reload resource URL sau session restore giữ nguyên URL và phục hồi failed snapshot; không còn false auth failure. |
| Failed journey | Sau correction, Request/Create app là Done, Build infrastructure là Current, Manage là Upcoming. |
| Narrow layout | Viewport `390x844`: `scrollWidth=390`, không horizontal overflow; ancestor của Request là `display:flex`, `flex-direction:row`, nằm trong main content phía trên request/status. Viewport đã reset sau test. |
| Gates | `npm run lint --workspace=@nivo/app`; `npm run typecheck --workspace=@nivo/app`; `npm run build --workspace=@nivo/app`; `git diff --check 242b75ca7d962e63d463d18cd9a5c36359f579ab` đều exit 0. |

### OUTPUTS

| Concept | Result |
|---|---|
| AgentOS owner flow | Giữ surface riêng, order/payment/provisioning/re-entry/manage đã được authenticated browser proof ở Apply r8. |
| Template App academy flow | Tạo Draft rồi publish bằng một deployment door, hiện accepted khi deployment identity chưa có, poll snapshot rồi gắn exact deployment Socket.IO target. |
| Product hierarchy | AgentOS là sản phẩm riêng; academy/MMO thuộc Template App catalogue và routes `/apps/new/[templateKey]`. |
| Composition | Page twins chỉ compose connected blocks; journey/request dùng shared composites, không quay lại page JSX phẳng. |

### CHANGES

| Tree | Details |
|---|---|
| `apps/app/src/modules/api/console.ts` | `modified` — thêm typed `publishExpertSite(siteId)` contract. |
| `apps/app/src/components/blocks/provisioning/TemplateAppProvisioning/index.tsx` | `modified` — create → publish → accepted → poll snapshot → exact realtime target; failed ở infrastructure step. |
| `apps/app/src/messages/en.json` | `modified` — accepted publication copy. |
| `apps/app/src/messages/vi.json` | `modified` — mirror accepted publication copy. |
| Remaining tracked frontend diff | Giữ nguyên production tree đã áp dụng từ Review r6/r9: owner routes/pages/blocks, shared composites, navigation, catalogue and AgentOS realtime flow. |
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md` | `modified` — ghi final Apply evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Revision đã được duyệt và production frontend boundary đã áp dụng. |

### WARNINGS

| Warning | Impact |
|---|---|
| Local config dùng legacy `EXPERT_DEPLOY_DRIVER=k8s`, nhưng template hiện có ở `D:/Repositories/nivo/tools/provision-expert.mjs` + `k8s/charts/expert`; legacy `ExpertDeployService` vẫn gọi `D:/Repositories/nivo-expert-app/tools/provision.mjs`. | Publish/request/frontend snapshot path đã được chứng minh; K8s apply legacy fail vì tool owner/contract mismatch. Đây là backend deployment-owner drift, không phải thiếu template hay frontend realtime isolation. |
| Next build cảnh báo convention `middleware` đã deprecated. | Build vẫn exit 0; migration sang `proxy` ngoài provisioning boundary. |
| Workflow validator còn bốn lỗi trong `designs/starci-academy/learn-branch.md` cũ; workflow provisioning hiện không còn lỗi. | Không sửa record ngoài scope; validator đã chứng minh r9/r10 dùng đúng schema. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Claim academy ready khi local provision tool không tồn tại | Ghi honest failed + exact missing prerequisite | Browser/backend evidence không có ready transition. |
| Publish rồi gọi thêm `provisionExpertSite` | Publish là deployment owner duy nhất | Tránh hai deployment pipelines. |
| Đưa journey vào sidebar hoặc page JSX phẳng | Horizontal journey trên main content, page → block → composites | Giữ đúng lựa chọn sản phẩm đã chốt. |

### OWED

| Owed | Cleared by |
|---|---|
| Academy K8s ready + Socket.IO live transition proof | Backend cần route publish sang durable `ExpertProvisionDispatcher`/`provision-expert.mjs` owner, hoặc explicitly restore the legacy `provision.mjs` contract; sau đó chạy lại một academy slug trên cluster khả dụng. |
| Root lint trust-tree drift | Lifecycle `starci-fe-lint-sync-*`; app/UI workspace gates của revision này đã xanh. |

## apply r11

Apply status: `OPEN / OWED`

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
| App | nivo / @nivo/app |
| Repo / branch | Frontend D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary; Backend D:\Repositories\nivo-backend @ main |
| Persona | Local Nivo tester account; credential values are deliberately omitted. |
| Runtime | FE `http://localhost:3066`; core API `http://localhost:3067`; academy API `http://localhost:3069`. |
| Purpose | Bổ sung bắt buộc authenticated UI, Network, Console và terminal proof cho Apply. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md |
| Language | vi |
| Phase | apply |
| Touching | Workflow evidence only; browser/API/Socket/terminal checks are read-only except creating local test resources through the approved product flows. |

### LIVE FLOW PROOF

| Flow | Persona | Steps | UI | Network | Console | Terminal | Verdict | Evidence |
|---|---|---|---|---|---|---|---|---|
| Authentication / Overview | Nivo local tester | Sign in bằng form canonical → `/en/overview` | Overview render Apps, AgentOS workspace, Servers, Domains và Wallet. | Sign-in GraphQL HTTP `200`, envelope `success=true`; không ghi token/cookie. | Không có warning/error. | FE PID nghe `3066`; core PID nghe `3067`; academy PID nghe `3069`. | PASS | Authenticated DOM snapshot và port/process inspection ngày 2026-08-15. |
| AgentOS request → payment boundary | Nivo local tester / AgentOS owner | `/en/agentos` → Request AgentOS → resource URL → reload | Order `42d1a816-aa87-425b-a242-e7290b5091d1`; Request Done, Payment Current; reload giữ `Waiting for payment`. | Authenticated GraphQL HTTP `200`; `myCatalogOrders` trả exact order status `pending_payment`; không GraphQL errors. | Không có warning/error trước và sau reload. | Core API vẫn healthy; không có matched error cho exact order trong captured backend logs. | PASS tới payment boundary | Resource URL `/en/agentos/orders/42d1a816-aa87-425b-a242-e7290b5091d1`. Không tự thanh toán/purchase trong Apply. |
| AgentOS paid snapshot → manage | Nivo local tester / AgentOS owner | Mở existing active order → snapshot reconcile → Manage AgentOS | Order `486a1803-1c23-4d62-bc8b-b0c9c8e23963` render toàn bộ bước Done, Manage Current, `Ready to manage`; CTA về `/en/agentos`, workspace vẫn hiện. | Authenticated GraphQL HTTP `200`; exact order status `active`. | Không có warning/error. | Core + FE processes vẫn listening trong suốt flow. | PASS | DOM snapshot của ready route và destination workspace list. |
| Template App academy create/publish/re-entry | Nivo local tester / Template App owner | `/en/apps/new/ai_academy` → slug → Create app → resource URL → snapshot → reload | Tạo `codex-live-9816789`, site `39c74aa5-95b7-496d-9864-b250ab9282d2`; Request/Create Done, Infrastructure Current, Manage Upcoming; honest `Provisioning needs attention`; reload phục hồi cùng state. | Authenticated GraphQL HTTP `200`; exact deployment `cb5824fc-d4b2-483c-997d-1952f081c595` status `failed`, `lastError=tools/provision.mjs failed: unknown`; không GraphQL errors. | Không có warning/error. | Backend stderr có exact line `Cluster deploy failed for 39c74aa5-95b7-496d-9864-b250ab9282d2: tools/provision.mjs failed: unknown`. Default `D:\Repositories\nivo-expert-app\tools\provision.mjs` không tồn tại. | OWED / NOT PASS | Frontend create → publish → snapshot/re-entry hoạt động; K8s apply chưa bắt đầu nên không có ready proof. |
| Provisioning Socket.IO transport | Nivo local tester bearer session | Kết nối `/provisioning` bằng WebSocket → emit `provisioning.subscribe` | UI không nhận event academy vì deployment đã failed trước watcher. | Authenticated Socket.IO/WebSocket connect thành công và subscription emit thành công; không ghi bearer token. | Không có connect error trong browser Console. | Core startup log xác nhận `ProvisioningGateway subscribed to provisioning.subscribe`. | PARTIAL / OWED | Transport/auth/room subscription pass; chưa chứng kiến `deployment.status`/`workspace.status` live transition của academy test resource. |

### OUTPUTS

| Concept | Result |
|---|---|
| Mandatory Apply evidence | Đã có account/persona, live steps, UI, Network, Console, terminal, verdict và resource evidence trong cùng workflow. |
| Honest completion state | AgentOS flows pass; academy frontend contract pass tới snapshot failure; toàn Apply vẫn OPEN vì academy K8s ready/Socket event chưa pass. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\provisioning-flows.md` | `modified` — thêm Apply r11 và `LIVE FLOW PROOF`; không ghi password/token/cookie. |
| Production source | No new source changes trong live-proof continuation này. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Academy infrastructure prerequisite | Cung cấp/checkout repo template thật tại `D:\Repositories\nivo-expert-app`, hoặc chỉ định `EXPERT_TEMPLATE_PATH` hợp lệ; sau đó chạy lại live academy flow. |

### WARNINGS

| Warning | Impact |
|---|---|
| Browser-control API hiện không expose DevTools Network panel entries. | Network evidence được lấy bằng authenticated HTTP/GraphQL probe đối chiếu exact resource IDs và bằng Socket.IO client thật; browser Console vẫn được đọc trực tiếp. |
| FE dev process là process đã chạy sẵn, không có terminal session gắn với task. | Port/process health, browser Console và production build pass đã được ghi; backend terminal stdout/stderr được capture trực tiếp. Apply vẫn OPEN nên không che lấp hạn chế này. |
| Template có thật nhưng tên/contract khác: `D:\Repositories\nivo\tools\provision-expert.mjs` nhận values qua stdin, còn legacy service gọi `provision.mjs apply --id --config --registry`. | Blocker đã được thu hẹp thành backend deployment-owner/contract mismatch; không tự rename/copy tool hoặc chạy hai pipeline. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Đóng Apply chỉ vì UI render failed đúng | Giữ `OPEN / OWED` tới khi K8s ready và Socket event được chứng kiến | Apply yêu cầu live flow hoạt động, không chỉ xử lý lỗi đẹp. |
| Ghi credential hoặc bearer token làm evidence | Chỉ ghi persona, status và resource IDs | Secrets không thuộc workflow record. |

### OWED

| Owed | Cleared by |
|---|---|
| Academy K8s reaches ready | Restore a valid `EXPERT_TEMPLATE_PATH` with `tools/provision.mjs`, run a fresh academy slug, and observe the matching deployment become ready. |
| Academy live Socket.IO event | While that deployment is preparing, capture exact matching `deployment.status` through the authenticated provisioning namespace and prove unrelated IDs do not advance UI. |
| Attached FE terminal proof | Restart/attach the FE dev process with captured stdout/stderr during the next full live run, then record warnings/errors for the same resource IDs. |
