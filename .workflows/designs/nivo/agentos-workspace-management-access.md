<!-- starci-workflow: v2 -->
# Nivo AgentOS workspace management + passwordless app access

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
| Repo / branch | Frontend D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary; Backend D:\Repositories\nivo-backend @ main; Charts D:\Repositories\nivo-charts |
| Purpose | Chốt trang quản lý AgentOS workspace, disclosure CPU/RAM/stack và cơ chế click-to-use OpenClaw/n8n không phát credential cho khách. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-workspace-management-access.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này và D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-workspace-management-access\r1\index.html. |

### PRODUCT ANSWER

| Question | Decision |
|---|---|
| Click workspace đi đâu | Route ổn định `/[locale]/agentos/workspaces/[workspaceId]`, không quay về list và không nhồi detail vào sidebar. |
| Có trang CPU/RAM không | Có: hiển thị current usage, request, limit, restart/OOM/throttle và `observedAt`; ghi rõ usage khác namespace allocation và khác RAM vật lý dành riêng. |
| OpenClaw/n8n đã deploy chưa | Chart AgentOS đã chạy OpenClaw + n8n trong app Pod. Nhưng chỉ controlplane nằm sau Ingress; n8n chỉ có ClusterIP nội bộ và OpenClaw không có public Service. |
| Có đưa password lên UI không | Không. Credential bootstrap hiện tại là operator-only, TOTP-gated, shown-once; không được tái dùng làm customer login. |
| Click là dùng ngay được không | Được sau khi có access broker: Nivo mint opaque one-time code 30–60 giây, target exchange server-to-server, set cookie `Secure; HttpOnly`, rồi redirect sang URL sạch. |
| Cookie qua URL | Từ chối. Cookie/bearer/password không đi trong query, fragment, GraphQL response, Socket.IO payload hoặc logs. URL chỉ được mang code một lần, audience-bound, replay-proof và vô dụng sau exchange. |

### SOURCE EVIDENCE

| Evidence | Finding | Consequence |
|---|---|---|
| `AgentOSWorkspaceList` | Query được render thành `FleetRow` nhưng chưa có `on.open`; hiện click row không điều hướng. | EXTEND row contract và route owner; không vá click trong page JSX. |
| FE routes | Chỉ có `/agentos` và `/agentos/orders/[orderId]`. | ADD dedicated workspace detail route/page. |
| Existing lifecycle design | `nivo-lifecycle-operations-resource-detail-r1` đã approve journey → operations → Helm stack, BE là sole K8s probe owner. | REUSE quyết định lifecycle; workflow này chỉ chốt AgentOS route/access + customer hierarchy. |
| `RuntimeSnapshot` | Có release/chart/components/storage/readiness, chưa có CPU/RAM current usage, throttling, restart hoặc OOM. | CPU/RAM thật cần backend read model; FE không được giả hoặc gọi Metrics API trực tiếp. |
| `myInstances` | Có plan snapshot `ram`/`vcpu`. | Có thể render allocation/profile, nhưng không được gọi đó là live usage. |
| AgentOS chart | `controlplane + openclaw + n8n + mcp` cùng một Pod; app replica bị pin 1 vì OpenClaw sessions và n8n schedules. | Không quảng cáo horizontal pod scale cho app Pod hiện tại; scale capacity/node khác scale workload. |
| AgentOS Ingress | Chỉ controlplane Service là public door; command half đã dùng Keycloak JWT + owner check và Socket.IO bridge. | OpenClaw nên tiếp tục đi qua controlplane/access gateway, không expose raw port 18789/3100. |
| n8n Service | `ClusterIP`, dùng cho provision hook; không nằm sau Ingress. | Muốn mở editor cần auth adapter/front-door riêng hoặc licensed native SSO; không trỏ URL thẳng vào ClusterIP. |
| `issuePodAccessTokens` | Response duy nhất mang credential; TOTP step-up, shown once, dành cho Helm/bootstrap và rotation. | Không dùng mutation này làm magic login hoặc lưu token trong client. |

### ACCESS SEQUENCE

| Step | Owner | Contract |
|---|---|---|
| 1. Customer presses OpenClaw/n8n | Nivo FE | Gửi authenticated launch request theo exact `workspaceId`, `appKey`, `returnPath`; không nhận password. |
| 2. Authorize + mint | Nivo BE access broker | Verify owner/status/app capability; mint opaque one-time code với `jti`, audience, subject, workspace, expiry 30–60 giây; persist hash/usedAt và audit event. |
| 3. Front-channel handoff | Browser → workspace public door | Điều hướng tới callback bằng code một lần; không gửi cookie/token hiện hữu qua URL. |
| 4. Redeem | Workspace access gateway → Nivo BE | Server-to-server exchange, atomic consume, reject replay/expired/wrong audience. |
| 5. Establish session | Workspace access gateway | Set host-scoped `Secure; HttpOnly; SameSite=Lax` cookie; 302/303 sang URL sạch. |
| 6. Operate | Customer browser | OpenClaw qua controlplane bridge; n8n qua approved auth adapter/front-door. Logout/revoke/rotate có audit. |

### CONTRACT INVENTORY

| Surface / contract | Classification | Plan |
|---|---|---|
| Console shell/sidebar | REUSE | AgentOS vẫn là sản phẩm riêng trong nav; workspace journey không vào sidebar. |
| Workspace row | EXTEND | Whole-row press affordance mở exact workspace detail; inner controls không bubble. |
| Workspace detail route/page | NEW | Page chỉ compose customer apps, runtime/operations và stack blocks. |
| Lifecycle operations + Helm stack | REUSE approved design | Dùng `nivo-lifecycle-operations-resource-detail-r1`; không mở lại Update pod/reset/backup decisions. |
| Live resource metrics | NEW backend contract | Current CPU/memory + requests/limits + restart/OOM/throttle + observedAt, scoped owner. |
| App launcher block | NEW | OpenClaw/n8n cards render reachability, access capability và launch result; không render raw secrets. |
| Access broker | NEW backend capability | Issue/redeem/revoke one-time code; auditable, owner-bound, replay-proof. |
| OpenClaw adapter | EXTEND controlplane | Reuse public command door and owner JWT boundary; establish customer session without exposing gateway token. |
| n8n adapter | NEW/decision-gated | Prefer native supported SSO when licensed; otherwise authenticated reverse-proxy/session adapter proven against pinned n8n version. |
| Realtime | REUSE + EXTEND | Health/operation/metrics deltas can update matching workspace; launch code/session never travels over Socket.IO. |

### DIRECTIONS

| Direction | Reading order | Primary action | Tradeoff |
|---|---|---|---|
| A — Control center | Apps → usage → stack → health/operations | `Mở OpenClaw` | Cân bằng customer task và self-diagnosis; khuyến nghị. |
| B — App launcher | Apps → recent activity → infrastructure tabs | `Tiếp tục với Nivo` | Dễ dùng nhất cho non-technical customer nhưng giấu sâu incident evidence. |
| C — Ops cockpit | CPU/RAM → Helm components → apps → danger zone | `Cập nhật pod` | Tốt cho operator, quá implementation-first cho khách phổ thông. |

### PREVIEW TRACKING

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| AgentOS workspace management r1 | `http://127.0.0.1:8080/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-workspace-management-access\r1\index.html` | `62DDA5C27A7149F7741ED5BA542D2F53854DAD8B878D9098A10E15DF065BA9B5` | Đã serve và browser-verify. |

| Direction | Tab | Status |
|---|---|---|
| A-control-center | A · Control center | Đã render; khuyến nghị, chờ chọn. |
| B-app-launcher | B · App launcher | Đã render; chờ chọn. |
| C-ops-cockpit | C · Ops cockpit | Đã render; chờ chọn. |

### PREVIEW PROOF

| Proof | Result |
|---|---|
| Tab switching | Browser click cả A/B/C; content riêng của cả ba đều visible đúng tab. |
| Passwordless copy | A render one-time exchange → Secure/HttpOnly cookie → clean URL; không hứa cookie trong URL. |
| Responsive | Viewport 390×844: `innerWidth=390`, `scrollWidth=375`, active panel A; không horizontal overflow. Viewport đã reset. |
| Product hierarchy | Apps và customer outcome đứng trước hạ tầng ở A/B; C cố ý minh họa operator-first tradeoff. |

### ACCEPTANCE STATES FOR REVIEW

| State | Must show |
|---|---|
| Loading | Stable page hierarchy; skeleton từng app/metric, không thay toàn trang bằng spinner. |
| Ready | Exact workspace identity, app reachability, current usage + request/limit + observedAt, stack status và one primary launch action. |
| Launching | Button pending once; no duplicate issue; URL/code not printed. |
| Launch success | Target app opens authenticated and callback URL is cleaned immediately. |
| Launch refused | Honest reason: workspace not ready, app unreachable, access unavailable or re-auth required; no fallback password leak. |
| Expired/replayed code | Broker refuses, records audit and returns user to Nivo with retry path. |
| Socket reconnect | Snapshot rehydrate by exact workspace; unrelated events ignored. |
| Metrics unavailable | Keep allocation/request/limit, mark live usage unavailable with observed time; never show stale usage as current. |
| Mobile | One column, top content tabs remain reachable, action cards do not overflow. |

### OUTPUTS

| Concept | Result |
|---|---|
| Workspace management model | Dedicated AgentOS workspace page with customer apps, live resource truth, lifecycle operations and Helm stack. |
| Passwordless access model | One-time code exchange sets host-scoped HttpOnly session; customer never receives infrastructure or owner credentials. |
| Recommended direction | A — Control center, because it preserves customer task priority without hiding runtime evidence. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-workspace-management-access.md` | `added` — evidence-backed FE Design Plan. |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-workspace-management-access\r1\index.html` | `added` — disposable three-tab preview. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Hướng trang workspace | **A — Control center** (khuyến nghị); B — App launcher; C — Ops cockpit. Sau khi chọn, chạy `$starci-fe-design-review`; backend access/metrics contract sẽ route qua `$starci-be-feature-plan`. |

### WARNINGS

| Warning | Impact |
|---|---|
| Runtime snapshot hiện chưa có live CPU/RAM usage. | FE Apply không thể ship biểu đồ thật trước backend metrics projection. |
| n8n hiện internal-only và owner auth riêng. | “Click là vào” cho n8n cần auth adapter được proof trên version pin; không được public Service rồi bỏ auth. |
| App Pod pin 1 replica theo chart. | UI không được gọi pod horizontal scale là khả dụng; node/capacity autoscale là capability khác. |
| Preview dùng dữ liệu minh họa. | Các số CPU/RAM/version chỉ diễn tả hierarchy, không phải live contract. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Quăng OpenClaw/n8n password hoặc gateway token lên UI | One-time access-code exchange + HttpOnly cookie | Secret copyable bị lưu trong history, screenshot, support logs và không có revocation/session semantics tốt. |
| Đưa cookie/bearer thẳng vào URL | URL chỉ mang opaque single-use code, rồi redirect sang URL sạch | Cookie/token trong URL lọt access log, referrer và browser history. |
| Public thẳng OpenClaw/n8n ports | Giữ single public door + auth adapter | Chart cố ý bảo vệ OpenClaw locality scope và n8n hiện không có public auth boundary của Nivo. |
| FE gọi K8s Metrics API | Nivo BE project owner-scoped snapshot/events | Browser không được giữ cluster credential và không sở hữu authorization truth. |

### OWED

| Owed | Cleared by |
|---|---|
| User chọn A/B/C | Ghi selected direction và mời `$starci-fe-design-review`. |
| Exact FE component/props delta | `$starci-fe-design-review` sau lựa chọn. |
| Access broker + n8n adapter + metrics read model | `$starci-be-feature-plan` → Review → Apply; không nằm trong FE Design Apply. |
| Live launch/metrics proof | Authenticated UI + Network + Console + FE/BE terminal + target app session after backend capability exists. |

## plan revision 2

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
| Repo / branch | Frontend D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary; Backend D:\Repositories\nivo-backend @ main; Charts D:\Repositories\nivo-charts |
| Purpose | Ghi nhận lựa chọn dứt điểm cho hierarchy workspace management trước Review. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-workspace-management-access.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; preview r1 được giữ nguyên làm evidence. |

### SELECTED DIRECTION

| Decision | Result |
|---|---|
| Selected | A — Control center |
| User signal | `chốt dứt điểm` sau khi preview A/B/C đã mở và A được nêu là khuyến nghị. |
| Hierarchy | Applications trước; resource usage, stack, health/operations theo sau. |
| Access | Click-to-use bằng one-time exchange + target-host HttpOnly cookie; không credential reveal. |
| Navigation | Workspace row mở dedicated detail route; tabs nằm trong main content, không ở sidebar. |

### PREVIEW TRACKING

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| AgentOS workspace management r1 | `http://127.0.0.1:8080/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-workspace-management-access\r1\index.html` | `62DDA5C27A7149F7741ED5BA542D2F53854DAD8B878D9098A10E15DF065BA9B5` | Đã chọn A. |

| Direction | Tab | Status |
|---|---|---|
| A-control-center | A · Control center | Đã chọn dứt điểm. |
| B-app-launcher | B · App launcher | Từ chối. |
| C-ops-cockpit | C · Ops cockpit | Từ chối. |

### OUTPUTS

| Concept | Result |
|---|---|
| Selected direction | A — Control center được chốt. |
| Passwordless decision | One-time exchange là customer access contract; credential reveal bị loại. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-workspace-management-access.md` | `modified` — ghi selected direction. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Product direction đã chọn; chuyển sang `$starci-fe-design-review`. |

### WARNINGS

| Warning | Impact |
|---|---|
| Direction approval không tự tạo backend access/metrics contract. | Review phải freeze dependency và không cho FE Apply dùng mock. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| B — App launcher | A — Control center | Không giấu sâu runtime evidence khi khách cần tự kiểm tra. |
| C — Ops cockpit | A — Control center | Không đặt Helm/CPU trước công việc khách muốn làm. |

### OWED

| Owed | Cleared by |
|---|---|
| Exact component/props and production boundary | `$starci-fe-design-review`. |

## review

Review status: `APPROVED`

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
| Repo / branch | Frontend D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary; Backend D:\Repositories\nivo-backend @ main; Charts D:\Repositories\nivo-charts |
| Purpose | Challenge và freeze exact FE tree/API migrations cho A — Control center, không viết production source. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-workspace-management-access.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này và read-only source/contract evidence; không sửa FE/BE/chart source. |

### REVIEW VERDICT

Approved revision: `nivo-agentos-workspace-control-center-r1`

| Approval signal | Interpretation |
|---|---|
| User said `tiếp tục` immediately after the exact revision approval request | Approves the only pending Review revision and authorizes routing to backend prerequisites. |

| Decision | Verdict |
|---|---|
| Direction A | ACCEPT — đúng hierarchy customer-first nhưng vẫn giữ self-diagnosis. |
| Route identity | ACCEPT — `/[locale]/agentos/workspaces/[workspaceId]`; workspace id là product-detail id, instance id lấy từ owner-scoped join/read model. |
| Passwordless launch | ACCEPT — one-time code exchange; target host set HttpOnly cookie; callback dọn URL ngay. |
| Credential reveal | REJECT — `issuePodAccessTokens` giữ operator/TOTP/bootstrap scope, không xuất hiện ở customer workspace page. |
| Live metrics | ACCEPT WITH PREREQUISITE — current usage phải từ Nivo BE K8s Metrics projection; `myInstances.ram/vcpu` chỉ là allocation. |
| OpenClaw | ACCEPT — đi qua controlplane/access adapter, không public raw gateway port. |
| n8n | ACCEPT WITH PREREQUISITE — phải có workspace auth adapter/front-door hoặc native supported SSO; không expose internal ClusterIP. |
| Existing lifecycle design | REUSE — `nivo-lifecycle-operations-resource-detail-r1`; không đổi Update pod/reset/backup/Helm decisions. |
| Apply readiness | BLOCKED — backend access broker, workspace-scoped app status và live metrics contracts chưa tồn tại. FE source không được viết trước các prerequisites này. |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | AgentOS workspace detail route | ADD | none | `apps/app/src/app/[locale]/(console)/agentos/workspaces/[workspaceId]/page.tsx` | Next console router → `AgentOSWorkspacePage` | async route params resolve `workspaceId: string` to the page prop | Stable customer-manage destination separate from order/provision route. |
| page | AgentOSWorkspacePage | ADD | none | `apps/app/src/components/pages/AgentOSWorkspacePage/index.tsx` + `component.tsx` | workspace detail route | compose summary, tabs, applications, runtime, operations and stack; no domain fetch in pure twin | Preserves page → block ownership and selected main-content journey. |
| branch | agentos-workspace-control-center | ADD | none | `packages/ui/src/contracts/index.ts` | `_AgentOSWorkspacePage`, `SurfaceCard` projections | heading → peer tabs → active section; apps-before-infrastructure resting order; one-column collapse | Topology must be named and reusable, not literal classes in the page. |
| block | AgentOSWorkspaceList | MODIFY | `apps/app/src/components/blocks/agentos/AgentOSWorkspaceList/index.tsx` + `component.tsx` | same | `AgentOSPage`; `FleetRow` children | answered rows emit exact workspace id to connected navigation action | Closes the current inert `FleetRow.on.open` seam. |
| block | AgentOSWorkspaceSummary | ADD | none | `apps/app/src/components/blocks/agentos/AgentOSWorkspaceSummary/index.tsx` + `component.tsx` | `AgentOSWorkspacePage` summary slot | owner-scoped identity/status/plan/allocation and observed state | Keeps route identity and allocation truth out of page JSX. |
| block | AgentOSWorkspaceApplications | ADD | none | `apps/app/src/components/blocks/agentos/AgentOSWorkspaceApplications/index.tsx` + `component.tsx` | Applications tab | workspace-scoped OpenClaw/n8n reachability, launch capability, pending/refused state | Owns customer meaning of application access; never handles raw credential. |
| composite | ApplicationLaunchCard | ADD | none | `packages/ui/src/composites/ApplicationLaunchCard/index.tsx` | `_AgentOSWorkspaceApplications` repeated app slots | identity, description, status, one primary action, optional quiet detail | Two app cards share one closed arrangement without importing AgentOS domain into UI package. |
| block | AgentOSWorkspaceRuntime | ADD | none | `apps/app/src/components/blocks/agentos/AgentOSWorkspaceRuntime/index.tsx` + `component.tsx` | Overview and Infrastructure tabs | allocation + current CPU/memory + request/limit + restart/OOM/throttle + observedAt | Distinguishes plan allocation from measured usage and owns unavailable/stale states. |
| composite | LabelledProgressRow | REUSE | `packages/ui/src/composites/LabelledProgressRow/index.tsx` | same | `_AgentOSWorkspaceRuntime` CPU and memory rows | existing `{ id, title, percent, percentText }` | Existing generic label/figure/bar shape is sufficient; request/limit support copy stays in parent block. |
| leaf | ChoiceTabs | REUSE | `packages/ui/src/leaves/ChoiceTabs/index.tsx` | same | `_AgentOSWorkspacePage` | existing selected key + text-only tabs + select action | Existing peer-choice leaf matches Overview/Applications/Infrastructure/Operations/Access. |
| block | AgentOSWorkspaceOperations | ADD | none | `apps/app/src/components/blocks/operations/AgentOSWorkspaceOperations/index.tsx` + `component.tsx` | Operations tab | instance capability, active operation, backup gate, exact Socket delta | AgentOS-specific capability/copy over the already-approved lifecycle operation model. |
| block | HelmStackSnapshot | ADD | none | `apps/app/src/components/blocks/operations/HelmStackSnapshot/index.tsx` + `component.tsx` | Infrastructure tab; Template App resource page named by `nivo-lifecycle-operations-resource-detail-r1` | approved release/components/storage public-safe projection | Same generic stack block already frozen by `nivo-lifecycle-operations-resource-detail-r1`; no duplicate AgentOS stack. |
| composite | OperationActionRail | ADD | none | `packages/ui/src/composites/OperationActionRail/index.tsx` | `_AgentOSWorkspaceOperations`; `TemplateAppOperations` named by `nivo-lifecycle-operations-resource-detail-r1` | approved actions/pending/onAction contract | Reuses exact approved lifecycle action grouping. |
| composite | HelmComponentStatusTable | ADD | none | `packages/ui/src/composites/HelmComponentStatusTable/index.tsx` | `_HelmStackSnapshot` | approved component repeated slots | Reuses exact approved stack anatomy. |
| overlay | OperationConfirmDialog | ADD | none | `packages/ui/src/shells/OperationConfirmDialog/index.tsx` | `AgentOSWorkspaceOperations` destructive actions | approved impact/backup/acknowledgement/confirm/dismiss contract | Reset/rebuild confirmation remains an interaction shell. |
| leaf | status/actions/text/progress primitives | REUSE | existing `Badge`, `Button`, `Text`, `TextLink`, `Progress` | same | new composites/blocks | existing strict leaf props | No new vendor wrappers or local button/progress implementation. |
| shell | Console shell/sidebar | REUSE | `apps/app/src/components/layouts/ConsoleNav/index.tsx` | same | console layout | AgentOS nav remains selected by route | Workspace tabs/journey stay in main content, never sidebar. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| AgentOS workspace detail route | page invocation | ADD | none | Invoke `AgentOSWorkspacePage` with the resolved `workspaceId` | Next route only | Route test resolves async params and mounts exact id. |
| AgentOSWorkspacePage | page props | ADD | none | `{ workspaceId: string }` | detail route → connected/pure page twins | Typecheck plus pure fixture proves exact identity passed to every domain block. |
| AgentOSWorkspacePage | active section | ADD | none | `section: "overview" | "applications" | "infrastructure" | "operations" | "access"`; `selectSection(key)` | connected page local UI state → `ChoiceTabs` | Fixture/click test proves one active block group and mobile access to all tabs. |
| agentos-workspace-control-center | contract slots | ADD | none | `heading`, `tabs`, `summary?`, `applications?`, `runtime?`, `operations?`, `stack?`, `refusal?` with active-section exclusivity | `_AgentOSWorkspacePage` | Contract registry tests reject unnamed/wrong slots. |
| AgentOSWorkspaceList | connected navigation | ADD | no router action | `openWorkspace(workspaceId)` → locale-safe `/agentos/workspaces/[workspaceId]` | list connected twin | Source probe shows every answered row receives `on.open`; resting/empty/refused receive none. |
| AgentOSWorkspaceListViewProps | pure actions | ADD | no `on` surface | `on: { openWorkspace(id: string): void }` for answered state | connected list → pure list → `FleetRow.on.open` | Component test presses row name and observes exact id once. |
| FleetRow | public interface | KEEP | `FleetRowActions.open?: () => void` | same | AgentOSWorkspaceList, OverviewPage, AppsPage | No FleetRow edit; existing call sites remain valid. |
| AgentOSWorkspaceSummary | connected input/state | ADD | none | `{ workspaceId: string }`; `loading | ready | refused | not_found` | page → connected block | Existing allocation join or new detail query must be owner-scoped and exact-id. |
| AgentOSWorkspaceSummary | pure props | ADD | none | `workspace`, `instance`, `allocation`, `observedAt`, `message?` | connected → pure twin | Fixtures cover ready/orphan/refused/not-found without invented allocation. |
| AgentOSWorkspaceApplications | connected input/state | ADD | none | `{ workspaceId: string }`; `loading | ready | launching | refused | unavailable` | page → connected block | Workspace-scoped backend query; no reuse of viewer-global `myPodOpenclawStatus` when multiple workspaces exist. |
| AgentOSWorkspaceApplications | pure props/actions | ADD | none | `apps[]` with `key`, `title`, `description`, `reachable`, `statusLabel`, `canLaunch`, `pending`; `launch(appKey)` and `retry(appKey)` | connected → pure → ApplicationLaunchCard | Fixtures cover both ready, one unavailable, launch pending/refused; no secret-shaped prop. |
| ApplicationLaunchCard | props/on | ADD | none | `{ id, title, description, statusLabel, statusTone, actionLabel, disabled?, isPending?, detail? }`; `press()` | AgentOSWorkspaceApplications | Shared package type fence and render fixtures; exactly one primary per card. |
| AgentOSWorkspaceRuntime | connected input/state | ADD | none | `{ workspaceId: string }`; `loading | ready | stale | unavailable | refused` | page → connected block | Owner-scoped metrics query keyed by workspace/instance; snapshot wins after reconnect. |
| AgentOSWorkspaceRuntime | pure props | ADD | none | `allocation`, `cpu`, `memory`, `health`, `observedAt`, `message?`; each metric carries usage/request/limit/percent/unit | connected → pure twin | Fixtures prove allocation-only fallback and no stale value labelled current. |
| LabelledProgressRow | public interface | KEEP | `{ id, title?, percent?, percentText? }` | same | Runtime block plus existing consumers | No shared composite edit. |
| ChoiceTabs | public interface | KEEP | selected key/tabs/select | same | Workspace page plus existing consumers | No leaf edit. |
| AgentOSWorkspaceOperations | input/state/actions | ADD | none | `{ instanceId: string }`; `loading | ready | action_pending | failed | unavailable`; actions `updatePod`, `changePlan`, `backup`, `resetVps`, `rebuild`, `retry` | page → connected block → backend mutations | Same capability/verified-backup gates as approved lifecycle review. |
| HelmStackSnapshot | input/pure props | ADD | none | `{ instanceId: string }`; `release`, `chart`, `components`, `storage`, `observedAt`, `state` | page/operations → connected/pure twins | Exact backend projection only; no raw Helm output. |
| OperationActionRail | props/on | ADD | none | approved `{ actions, pendingOperation, onAction }` | AgentOSWorkspaceOperations | Lifecycle fixtures cover safe/danger actions. |
| HelmComponentStatusTable | slots/data | ADD | none | approved repeated component rows with `key`, `kind`, `status`, replicas, image, storage | HelmStackSnapshot | Stack fixtures cover empty/loading/ready/failed. |
| OperationConfirmDialog | interaction API | ADD | none | approved `operation`, `impact`, `requiresVerifiedBackup`, `isOpen`, `isPending`; `confirm`, `dismiss` | operations block | Destructive confirm unavailable without verified backup. |
| console API | workspace detail/status/metrics/access | ADD | list-level workspace + viewer-global pod status + allocation only | owner-scoped workspace detail, application status, runtime metrics, `issueWorkspaceLaunch`, launch refusal envelope | connected summary/app/runtime blocks | Backend schema introspection + typed HTTP flow before FE Apply. |
| realtime module | workspace metrics/operation delta | RETYPE | provisioning workspace/order status only | exact `workspaceId`, optional `instanceId`/`operationId`, event kind, observedAt, public-safe delta; no launch code | runtime/operations connected blocks | Socket test ignores unrelated ids and rehydrates GraphQL after reconnect. |

### EXACT BACKEND PREREQUISITES

| Contract | Required public-safe shape | Rule |
|---|---|---|
| Workspace detail | `workspaceId`, `instanceId?`, `name`, `status`, `plan?`, allocation, `observedAt` | Owner-scoped exact id; null instance is honest orphan state. |
| Workspace app status | per OpenClaw/n8n: `key`, `reachable`, `status`, `checkedAt`, `canLaunch`, `reason?` | No gateway token, owner password, registration token or secret hint beyond existing recogniser policy. |
| Runtime metrics | CPU/memory usage/request/limit, restart/OOM/throttle indicators, `observedAt` | Nivo BE reads Metrics API/K8s; stale threshold explicit. |
| Launch issue | `launchId`, `redirectUrl`, `expiresAt` | URL contains only opaque one-time code; owner/audience/workspace bound; hash persisted. |
| Launch redeem | server-to-server consume result | Atomic one-use, replay/expiry/audience refusal, audit; target sets Secure/HttpOnly cookie and redirects clean. |
| n8n adapter | authenticated target front-door | Internal ClusterIP remains non-public; adapter proven against pinned n8n version and logout/revoke. |
| Realtime | matching metrics/operation events | No access code, cookie or credential in Socket.IO. |

### OWNER STATES AND TRANSITIONS

| Owner | State order | Recovery rule |
|---|---|---|
| Workspace page | route → loading summary → ready/refused/not-found | Exact workspace snapshot is authoritative. |
| Applications | loading → ready → launching → launched/refused | Duplicate press disabled; retry mints a new one-time code, never reuses old. |
| Launch callback | code received → redeeming → session set → clean redirect | Expired/replayed code returns to Nivo with typed refusal. |
| Runtime | loading → ready/stale/unavailable | Socket delta only for exact workspace; reconnect refetches GraphQL snapshot. |
| Operations | loading → ready → pending/running → ready/failed | Exact operation id; verified backup gates destructive transitions. |

### ACCEPTANCE EVIDENCE

| Proof | Required result |
|---|---|
| Row navigation | Authenticated click on a workspace opens exact locale-safe detail URL; other list consumers unchanged. |
| Composition | Route → page → blocks → composites/leaves; no flat operational JSX in page. |
| Access security | No password/token/cookie/Helm hint in DOM, GraphQL logs, Network URL after callback, Socket.IO or workflow evidence. |
| Passwordless live flow | Nivo click → one-time code → server redemption → HttpOnly cookie → clean target URL → usable OpenClaw/n8n; replay refused. |
| Metrics truth | UI separates allocation, request, limit and current usage; stale/unavailable states are honest and timestamped. |
| Realtime isolation | Matching workspace updates; unrelated workspace/operation events do not move UI; reconnect snapshots converge. |
| Lifecycle | Update/backup/reset/rebuild obey backend capabilities and verified-backup gate. |
| Responsive | 390×844 no horizontal overflow; tabs/actions remain reachable; source and visual order match. |
| Gates | `npm run lint --workspace=@nivo/app`; `npm run typecheck --workspace=@nivo/app`; `npm run build --workspace=@nivo/app`; relevant component tests; authenticated UI/Network/Console + FE/BE/target terminal proof. |

### SUPPORTING PRODUCTION BOUNDARY

| Tree | Planned action |
|---|---|
| `apps/app/src/app/[locale]/(console)/agentos/workspaces/[workspaceId]/page.tsx` | ADD route. |
| `apps/app/src/components/pages/AgentOSWorkspacePage/` | ADD connected/pure page twins. |
| `apps/app/src/components/blocks/agentos/AgentOSWorkspaceList/` | MODIFY navigation wiring only. |
| `apps/app/src/components/blocks/agentos/AgentOSWorkspaceSummary/` | ADD block twins. |
| `apps/app/src/components/blocks/agentos/AgentOSWorkspaceApplications/` | ADD block twins. |
| `apps/app/src/components/blocks/agentos/AgentOSWorkspaceRuntime/` | ADD block twins. |
| `apps/app/src/components/blocks/operations/AgentOSWorkspaceOperations/` | ADD block twins. |
| `apps/app/src/components/blocks/operations/HelmStackSnapshot/` | ADD approved shared stack block twins. |
| `apps/app/src/modules/api/console.ts` | ADD typed owner-scoped detail/status/metrics/launch calls after backend schema exists. |
| `apps/app/src/modules/realtime/` | MODIFY exact metrics/operation event projection; explicitly exclude access code/session. |
| `apps/app/src/messages/en.json`, `apps/app/src/messages/vi.json` | ADD mirrored workspace/app/runtime/access/operation copy. |
| `packages/ui/src/contracts/index.ts` | ADD named control-center layout/contracts. |
| `packages/ui/src/composites/ApplicationLaunchCard/index.tsx` | ADD generic launch card. |
| `packages/ui/src/composites/OperationActionRail/index.tsx` | ADD prior-approved lifecycle composite. |
| `packages/ui/src/composites/HelmComponentStatusTable/index.tsx` | ADD prior-approved stack composite. |
| `packages/ui/src/shells/OperationConfirmDialog/index.tsx` | ADD prior-approved destructive confirmation shell. |
| `packages/ui/src/index.ts` | MODIFY exports for `OperationConfirmDialog`; composites use existing wildcard subpath exports. |

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate revision | `nivo-agentos-workspace-control-center-r1` freezes A, route ownership, composition, access security, metrics truth and lifecycle reuse. |
| Apply readiness | Deliberately blocked until backend prerequisites exist; no mock or direct K8s fallback is permitted. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-workspace-management-access.md` | `modified` — appended selected Plan revision and Review candidate. |
| Production source | None — Review is read-only. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | `nivo-agentos-workspace-control-center-r1` đã được duyệt; route backend Feature Plan trước FE Apply. |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend prerequisites were not present when Review froze the FE boundary. | FE Apply remained blocked until the separately approved backend r2 was implemented and proved. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Credential reveal or raw gateway URL | Owner-scoped capability plus safe Nivo-managed access | Credentials, cookies and launch codes must never enter customer props or workflow evidence. |

### OWED

| Owed | Cleared by |
|---|---|
| Backend aggregate/runtime prerequisites | Backend feature revision `nivo-agentos-workspace-control-center-r2`. |
| FE production implementation and live proof | This workflow's Apply r2. |

## apply r2

Apply status: `COMPLETE`

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
| Purpose | Consume the owner-scoped AgentOS workspace control-center aggregate and runtime invalidation in the approved customer control center. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-workspace-management-access.md |
| Language | vi |
| Phase | apply |
| Touching | Approved workspace route/page/blocks/composites, AgentOS list navigation, console API, provisioning realtime, bilingual copy, UI contracts/exports, canonical lint mirror and this workflow. |

Applied revision: `nivo-agentos-workspace-control-center-r1`
Backend prerequisite revision: `nivo-agentos-workspace-control-center-r2` at `a367f25`
Baseline commit: `ae94cf0d72167bc7d0e8a50fc844810d1597f7b7`
Tracked diff: `ae94cf0d72167bc7d0e8a50fc844810d1597f7b7..worktree`
Final implementation commit: `51dead3`

### ROW-TO-DIFF PROOF

| Approved row | Diff proof |
|---|---|
| Workspace detail route | Added `/[locale]/agentos/workspaces/[workspaceId]`; production build route manifest contains the dynamic route. |
| Workspace list navigation | Every answered AgentOS row now routes with its exact workspace id and locale prefix. |
| AgentOSWorkspacePage | Added connected/pure twins; connected half owns aggregate/refetch, pure half composes blocks only. |
| Summary | Added owner workspace, plan, namespace allocation, hostname and chart facts. |
| Applications | Added OpenClaw/n8n capability cards; no credential/code/cookie prop exists; n8n honestly renders `SECURITY_UPGRADE_REQUIRED`. |
| Runtime | Added current CPU/memory separated from request, limit and commercial allocation, plus restart/probe/freshness evidence. |
| Helm stack | Added public-safe component/image/replica/restart and PVC projection; live data shows Bitnami Legacy PostgreSQL and MinIO images. |
| Operations | Added approved action rail vocabulary in a disabled state because Core GraphQL exposes no instance-operation mutations; no fake runnable action. |
| API | Added typed `myAgentWorkspaceControlCenter(workspaceId)` query matching backend r2 exactly. |
| Realtime | Added exact-id `workspace.runtime` handling with sequence/fingerprint dedupe; matching event refetches the aggregate, unrelated ids remain rejected. |
| UI contracts | Added named control-center, app-card, runtime and Helm table contracts plus closed generic composites. |

### LIVE FLOW PROOF

| Flow | Persona | Steps | UI | Network | Console | Terminal | Verdict | Evidence |
|---|---|---|---|---|---|---|---|---|
| Workspace list → detail | Authenticated Nivo local tester | Open `/en/agentos` → click `Agent workspace 1d967c` | Route changed to exact workspace id; Overview rendered stable identity and namespace allocation. | Owner-scoped aggregate returned workspace `c3fa9911-f693-4132-8fdb-2ad2386278ed`. | No warning/error. | FE 3066 and Core 3067 remained live. | PASS | In-app browser DOM and route inspection on 2026-08-15. |
| Applications | Same owner | Select Applications | OpenClaw available with Nivo-managed action; n8n unavailable with security reason; no secret shown. | Data came from `apps` in the aggregate. | No warning/error. | Core process remained healthy. | PASS | Authenticated DOM snapshot. |
| Runtime + Helm | Same owner | Select Infrastructure and observe successive runtime snapshots | CPU changed 42m → 34m while memory/request/limit remained coherent; Helm component images and four PVCs rendered; snapshot marked fresh. | `workspace.runtime` invalidation caused aggregate reconciliation for the exact workspace. | No connect/runtime error. | Backend runtime watcher continued publishing persisted snapshots. | PASS | Authenticated DOM snapshot and observed live metric change. |
| Operations honesty | Same owner | Select Operations | Update pod/change plan/backup/reset/rebuild remain visible but disabled with an exact public-API prerequisite note. | No mutation fired. | No warning/error. | No operation command dispatched. | PASS | Authenticated DOM snapshot. |
| Narrow responsive | Same owner | Inspect detail route at browser width 330 | Tabs remain reachable and page has no horizontal overflow. | Existing aggregate retained. | No warning/error. | Runtime unchanged. | PASS | `innerWidth=330`, `scrollWidth=315`. |

### VERIFICATION

| Gate | Result |
|---|---|
| App typecheck | `npm run typecheck --workspace=@nivo/app` passed. |
| UI typecheck | `npm run typecheck --workspace=@nivo/ui` passed. |
| App/UI lint | Both workspace lint commands passed. |
| Root lint | Canon mirror synchronized from Trust with the repository script; all four workspace lint tasks passed. |
| Production build | `npm run build --workspace=@nivo/app` passed and emitted the workspace detail route. |
| Browser | Authenticated route, five tabs, live metrics, Helm stack, safe app capability and disabled operation states passed; Console contained no warning/error. |

### OUTPUTS

| Concept | Result |
|---|---|
| Customer control center | One owner-scoped route now exposes workspace identity, applications, live resource truth, Helm stack and honest lifecycle availability. |
| Realtime convergence | Exact `workspace.runtime` invalidations refetch the aggregate; the browser visibly converged to newer CPU data without leaking event payloads into UI state. |
| Final source | Backend commit `a367f25`; frontend commit `51dead3`. |

### CHANGES

| Tree | Details |
|---|---|
| `apps/app/src/app/[locale]/(console)/agentos/workspaces/[workspaceId]/page.tsx` | Added exact workspace route. |
| `apps/app/src/components/pages/AgentOSWorkspacePage/` | Added connected/pure page twins. |
| `apps/app/src/components/blocks/agentos/AgentOSWorkspaceList/` | Added exact workspace navigation. |
| `apps/app/src/components/blocks/agentos/AgentOSWorkspaceSummary/` | Added allocation and identity block. |
| `apps/app/src/components/blocks/agentos/AgentOSWorkspaceApplications/` | Added safe OpenClaw/n8n capability block. |
| `apps/app/src/components/blocks/agentos/AgentOSWorkspaceRuntime/` | Added measured runtime block. |
| `apps/app/src/components/blocks/operations/AgentOSWorkspaceOperations/` | Added lifecycle action vocabulary with honest disabled state. |
| `apps/app/src/components/blocks/operations/HelmStackSnapshot/` | Added Helm components/storage block. |
| `apps/app/src/modules/api/console.ts` | Added exact aggregate types/query. |
| `apps/app/src/modules/realtime/provisioning.ts` | Added `workspace.runtime` invalidation handling. |
| `apps/app/src/messages/en.json`, `apps/app/src/messages/vi.json` | Added mirrored workspace management copy. |
| `packages/ui/src/contracts/index.ts`, `packages/ui/src/index.ts`, `packages/ui/src/composites/` | Added the approved named contracts, composites and exports. |

### WARNINGS

| Warning | Impact |
|---|---|
| Core GraphQL does not yet expose update pod/change plan/backup/reset/rebuild mutations. | Operations are deliberately disabled. A backend Feature lifecycle is required before buttons may dispatch. |
| Backend r2 exposes `NIVO_CONSOLE` capability but no one-time external launch mutation. | OpenClaw remains managed inside Nivo; no credential or URL token is invented. |
| Core terminal recorded two Kafka heartbeat rebalance/rejoin messages at 2026-08-15 15:58. | The consumer rejoined; later authenticated Socket/runtime reconciliation passed and Core remained listening on 3067. Treat recurrence outside a rebalance window as an operations alert. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Apply completed inside the approved FE boundary; operation mutations remain a separately named backend prerequisite. |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend prerequisites chưa có GraphQL/HTTP contracts. | Review có thể freeze FE consumer shape nhưng FE Apply phải chờ backend Feature lifecycle pass. |
| Existing FE worktree đang có nhiều thay đổi provisioning chưa commit. | Design Apply sau này phải baseline đúng approved boundary và bảo toàn unrelated work. |
| n8n access adapter là security-sensitive và version-coupled. | Backend proof phải gồm logout/revoke/replay và không dựa vào undocumented owner-password injection. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Dùng viewer-global `myPodOpenclawStatus` cho arbitrary workspace detail | Workspace-scoped status query | Workspace list là plural; viewer-global query không chứng minh exact target khi một khách có nhiều workspace. |
| Sửa `FleetRow` để hardcode AgentOS route | Giữ `FleetRow.on.open`, wire route trong AgentOS connected block | FleetRow được Apps/Overview dùng chung và đã có đúng action seam. |
| Tạo AgentOS-only Helm table | Dùng shared `HelmStackSnapshot` + `HelmComponentStatusTable` đã approved | Tránh duplicate shape với Template App operations. |
| Đưa one-time code vào Socket.IO | Launch response + browser callback only | Socket rooms/logs không phải credential delivery channel. |

### OWED

| Owed | Cleared by |
|---|---|
| Backend capability | `$starci-be-feature-plan` → Review → Apply for detail/status/metrics/access broker/n8n adapter/realtime. |
| FE Apply | `$starci-fe-design-apply` only after backend contract exists and this Review is approved. |
