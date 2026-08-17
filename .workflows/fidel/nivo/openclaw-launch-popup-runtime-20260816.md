<!-- starci-workflow: v2 -->

# OpenClaw launch popup và runtime truth

## start

Session id: `nivo-openclaw-launch-popup-runtime-20260816`

Session status: open

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-backend` |
| Source | `D:\Repositories\starci-academy-backend` |
| Project | `Explicit targets` |
| Frontend | `D:\Repositories\nivo-fe` |
| Backend | `D:\Repositories\nivo-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Skills | `D:\Repositories\starci-academy-backend\.claude\skills` |
| App | `nivo` |
| Repo / branch | FE `D:\Repositories\nivo-fe` / `main` tại `a4200c9`; BE `D:\Repositories\nivo-backend` / `main` tại `d1fc11c`; Charts `D:\Repositories\nivo-charts` / `main` tại `4a3aabb` với diff r2 đang mở |
| Purpose | Sửa OpenClaw launch bị popup blocker chặn và ngăn UI báo Available khi route runtime chưa sẵn sàng. |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |
| Workflow | `D:\Repositories\starci-academy-backend\.workflows\fidel\nivo\openclaw-launch-popup-runtime-20260816.md` |
| Language | `vi` |
| Phase | `start` |
| Touching | Workflow này; FE `apps/app/src/modules/window/workspace-app-launch.ts`, `apps/app/src/components/pages/AgentOSWorkspacePage/index.tsx` và focused tests trực tiếp; không ghi BE; Helm chỉ reconcile workspace live, không mở rộng diff Charts r2 đang dở. |

Binding evidence: yêu cầu hiện tại của user; render live route `http://localhost:3066/en/agentos/workspaces/c3fa9911-f693-4132-8fdb-2ad2386278ed`; source handler và runtime response hiện hành.

Frozen identity: desktop, locale `en`, authenticated Nivo owner, workspace `c3fa9911-f693-4132-8fdb-2ad2386278ed`, section `Applications`, FE origin `http://localhost:3066`.

Baseline defect:

- Click `Open OpenClaw` không tạo tab/window; UI chuyển sang thông báo blocked.
- Redis không xuất hiện `workspace-app-launch` grant sau click, xác nhận dừng trước mutation.
- `window.open(..., popup=yes, ...)` trả `null` trên in-app browser.
- Workspace API/render báo OpenClaw `Available` chỉ từ DB active trong khi runtime `chartVersion=unknown`, probe unavailable và public `/openclaw/` trả HTTP `404`.

### OWNER CHALLENGE

| Proposed owner | Layer | Purpose | Closest existing owners / contracts | REUSE verdict | ALTER verdict | Layer proof | Decision | Evidence |
|---|---|---|---|---|---|---|---|---|
| `openWorkspaceAppPopup` | shell/helper | Mở cửa sổ hoặc tab browser mà không giữ credential trong UI | helper hiện có cùng tên | Có, nhưng popup-only bị chặn | Cho phép fallback tab trong cùng helper | Đây là vendor/browser mechanics | ALTER | `workspace-app-launch.ts`; live click không tạo grant |
| `AgentWorkspaceAppCapability.available` | backend projection | Công bố khả năng app thật | query control-center hiện có | Projection hiện tại chỉ kiểm tra DB active nên không đủ | Cần backend runtime readiness, không nên FE tự bịa | Business truth thuộc BE | new-finding | handler control-center và live HTTP `404` |

### GROUPING / TREE

| Owner tier | Contract key | Host | Direct children | Semantic relationship | Inner seam | Outer seam | Verdict |
|---|---|---|---|---|---|---|---|
| `block` | `application-launch-grid` | `AgentOSWorkspaceApplications` | application cards | Các app peer trong workspace | hiện hữu, không đổi | hiện hữu, không đổi | REUSE |
| `composite` | `application-launch-card` | `ApplicationLaunchCard` | identity, state, detail, action | Trạng thái và hành động của một app | hiện hữu, không đổi | do grid sở hữu | REUSE |

### INTERACTION CONSEQUENCE

| Interaction | Trigger | Product owner | Request / route | Visual states | Pending | Success | Failure | Persistence / shared effect | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| Mở OpenClaw | Click `Open OpenClaw` | `AgentOSWorkspacePage` + popup helper | `issueAgentWorkspaceAppLaunch` → callback host | idle, opening, connected, blocked, expired, disconnected | disable action trong lúc issue | cửa sổ/tab riêng vào OpenClaw | blocked hoặc runtime unavailable rõ ràng | Nivo renew/revoke lease theo cửa sổ | FE source, live DOM, Redis scan |

### VISUAL JOB

| Visual element | Owner / state | Recognition, grouping or interaction job | Existing reference | Verdict | Evidence |
|---|---|---|---|---|---|
| Không thêm visual mới | N/A | Giữ nguyên card/badge/action; chỉ sửa mechanics và truth | UI r2 đã duyệt | REUSE | Không có yêu cầu redesign |

### OUTPUTS

| Concept | Result |
|---|---|
| Correction đang mở | Popup blocker và runtime availability được tách thành hai nguyên nhân có bằng chứng. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/nivo/openclaw-launch-popup-runtime-20260816.md` | `added` — mở fidelity session và đóng băng bằng chứng/phạm vi. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| Runtime availability thật thuộc backend projection nhưng boundary Start hiện chưa cho ghi BE. | FE popup có thể sửa độc lập; trạng thái Available cần route sang BE boundary thay vì suy diễn trong FE. |
| Charts đang có diff r2 chưa commit. | Reconcile live không được ghi đè hoặc trộn mất thay đổi đang dở. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | None |

### OWED

| Owed | Cleared by |
|---|---|
| Fallback cửa sổ/tab và focused proof | Patch FE, typecheck/lint/test, browser click. |
| Runtime availability trung thực | Mở rộng boundary BE được duyệt hoặc backend feature follow-up. |
| Workspace hiện tại có OpenClaw route thật | Reconcile/upgrade release rồi kiểm tra Traefik HTTP/WS. |

## feedback r1

Session id: `nivo-openclaw-launch-popup-runtime-20260816`

Session status: open

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-backend` |
| Source | `D:\Repositories\starci-academy-backend` |
| Project | `Explicit targets` |
| Frontend | `D:\Repositories\nivo-fe` |
| Backend | `D:\Repositories\nivo-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Skills | `D:\Repositories\starci-academy-backend\.claude\skills` |
| App | `nivo` |
| Repo / branch | FE `D:\Repositories\nivo-fe` / `main`; BE `D:\Repositories\nivo-backend` / `main`; Charts `D:\Repositories\nivo-charts` / `main` |
| Purpose | Ghi nhận focused proof thất bại và xin đúng boundary cho cách sửa có hiệu lực. |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |
| Workflow | `D:\Repositories\starci-academy-backend\.workflows\fidel\nivo\openclaw-launch-popup-runtime-20260816.md` |
| Language | `vi` |
| Phase | `feedback` |
| Touching | Workflow; production patch thử nghiệm trong `workspace-app-launch.ts` đã hoàn tác hoàn toàn. Boundary đề nghị: FE native launch bridge + connected page/message lifecycle + focused tests; BE control-center readiness projection + twin specs; live Helm reconcile không mở rộng source Charts. |

Feedback classification:

| Item | Class | Result |
|---|---|---|
| Fallback `window.open("_blank")` | `blocked` | In-app browser vẫn chặn; không tạo tab và UI vẫn vào state blocked. Patch đã hoàn tác. |
| Native launch bridge | `new-finding` | Cần route/page trung gian mở bằng anchor `target=_blank`, issue grant trong tab mới và báo `launchId` về opener để main Nivo renew/revoke. |
| Runtime truth | `new-finding` | BE hiện trả `available: isActive`; cần kết hợp runtime snapshot/OpenClaw component readiness. |

### OUTPUTS

| Concept | Result |
|---|---|
| Focused proof | Chứng minh mọi biến thể JavaScript `window.open` đang bị browser host chặn; sửa nhỏ trong helper không đủ. |
| Correct architecture | Native launch bridge cho browser mechanics; backend projection làm owner của availability. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/nivo/openclaw-launch-popup-runtime-20260816.md` | `modified` — ghi focused failure và boundary mở rộng cần duyệt. |
| `apps/app/src/modules/window/workspace-app-launch.ts` | Không còn diff — patch fallback thất bại đã hoàn tác. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Cho phép mở rộng boundary để sửa dứt điểm? | Khuyến nghị: FE native launch bridge + BE runtime readiness + reconcile đúng workspace; hoặc chỉ FE bridge và vẫn chấp nhận badge Available có thể sai. |

### WARNINGS

| Warning | Impact |
|---|---|
| `npm run typecheck -w @nivo/app` đang fail tại `layout.tsx:82` do contract `home-services-account-nav`/`sidebar-nav-cluster`, không liên quan patch launch. | Full typecheck chưa thể làm proof sạch nếu lỗi nền này chưa được xử lý. |
| Workflow validator toàn root đang fail nhiều record lịch sử; record mới không được tách riêng bởi validator hiện tại. | Không thể tuyên bố workflow root clean; cần ghi exact baseline debt. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Hai lần gọi `window.open`, lần hai `_blank` | Native anchor/tab launch bridge | Browser host chặn cả hai và không tạo grant. |
| FE tự suy diễn `available` từ màn hình | BE projection dùng runtime snapshot | Business truth thuộc backend, tránh hai client cho kết quả khác nhau. |

### OWED

| Owed | Cleared by |
|---|---|
| User duyệt boundary FE+BE mở rộng | Xác nhận lựa chọn khuyến nghị trong NEED APPROVALS. |
| Native tab/popup browser proof | Implement bridge, click thật, kiểm tra tab mới, callback, Console/Network. |
| Runtime readiness proof | Twin spec BE và workspace c3fa trả unavailable trước reconcile/available sau reconcile. |

## feedback r2

Session id: `nivo-openclaw-launch-popup-runtime-20260816`

Session status: open

### CONTEXT

| Field | Value |
|---|---|
| Workdir / Source | `D:\Repositories\starci-academy-backend` |
| Project | `Explicit targets` |
| Frontend | `D:\Repositories\nivo-fe` / `main` |
| Backend | `D:\Repositories\nivo-backend` / `main` |
| Charts | `D:\Repositories\nivo-charts` / `main` |
| App | `nivo` |
| Workflow | `D:\Repositories\starci-academy-backend\.workflows\fidel\nivo\openclaw-launch-popup-runtime-20260816.md` |
| Phase | `feedback` |
| Approval | User: `Duyệt FE+BE bridge` |
| Touching | FE native ActionLink + bridge route + launch lifecycle; BE runtime-readiness projection + OpenClaw cookie/lease authority; live AgentOS Helm reconcile. |

### OWNER CHALLENGE

| Proposed owner | Layer | REUSE | ALTER | Decision | Evidence |
|---|---|---|---|---|---|
| `ActionLink` | leaf | Existing `Button` owns button semantics; text link does not match card CTA | `Button` cannot carry native `href/target` without falsifying its contract | ADD one atomic native anchor leaf, then use it through `ApplicationLaunchCard` | Browser host blocked JavaScript popup; rendered anchor proves `href`, `_blank`, `noopener` |
| `AgentOSOpenClawLaunchBridge` | connected page | Reuses SessionProvider and existing issue/revoke mutations | Adds a same-origin native-tab exchange route and BroadcastChannel handoff | ADD | JS popup produced no grant; bridge reaches callback without exposing reusable OpenClaw credentials |
| `isOpenClawRuntimeReady` | backend capability | Reuses runtime snapshots/components | Tightens `available` and issue mutation to fresh ready runtime only | ADD shared predicate | Live workspace moved from false 404/unknown to true only after 4/4 runtime |
| `OpenclawAccessSessionService` | controlplane capability | Reuses signed host-only cookie and Redis validate | Removes duplicated fixed expiry from cookie payload; Redis lease remains sole authority | ALTER | Cookie-local 45s expiry killed a valid renewed lease; Redis TTL was still live |

### LIVE FLOW PROOF

| Flow | Persona | Steps | UI | Network | Console | Terminal | Verdict | Evidence |
|---|---|---|---|---|---|---|---|---|
| Workspace readiness | authenticated Nivo owner | Open workspace → Applications | OpenClaw `Available`; native `Open OpenClaw` link | unauthenticated `/openclaw/` = `401`, not `404` | no product JS error in final tabs | Helm revision 8 deployed; AgentOS 4/4; TLS Ready | PASS | workspace `c3fa9911-f693-4132-8fdb-2ad2386278ed` |
| One-click launch | same owner | native bridge → issue grant → callback → proxy | Real OpenClaw Control UI, Gateway Online; no key prompt | callback redeems once and lands on `/openclaw/chat` | final browser logs contain no launch error | controlplane `registerKey: already registered`, app started | PASS | Browser title `OpenClaw Control`, Chat/Overview/Sessions/Settings rendered |
| Renew beyond TTL | same owner with Nivo open | wait >45s through two renew ticks → reload OpenClaw | Gateway remains Online | Redis PTTL observed reset to about 43s | no product JS error | renew path uses refreshed owner session | PASS | live reload after >45s remained authorized |
| Revoke/fail closed | same owner | revoke exact ephemeral lease → wait proxy validation cache → reload | OpenClaw no longer renders | response `401 APP_LAUNCH_SESSION_ENDED_EXCEPTION` | no credential printed | one exact Redis lease removed; workspace/data untouched | PASS | server-side lease is canonical authority |

### OUTPUTS

| Concept | Result |
|---|---|
| Browser mechanics | Native anchor opens the same-origin bridge; bridge issues once and navigates to the real routed OpenClaw UI. |
| Runtime truth | FE only renders launchable when BE sees a fresh ready OpenClaw component. |
| Session ownership | Signed browser cookie carries only launch/session identity; Redis lease owns expiry and revocation. |
| Helm/runtime | Traefik + TLS + `/openclaw` route live on Tino; revision 8 and AgentOS 4/4. |

### CHANGES

| Tree | Details |
|---|---|
| FE `packages/ui/src/leaves/ActionLink`, `ApplicationLaunchCard`, workspace page/bridge and API helper | Added native-link CTA, same-origin launch bridge, correct GraphQL enum `Openclaw`, BroadcastChannel lifecycle, refresh-before-renew and embedded-browser-safe native redirect. |
| BE workspace launch/query handlers + `workspace-app-readiness.ts` | Added fresh runtime readiness gate to projection and issue mutation with twin specs. |
| Controlplane OpenClaw access session | Removed cookie-local expiry duplication; signed IDs are validated against renewable Redis lease on HTTP/WS. |
| Live Helm release | Re-minted an expired never-consumed bootstrap token through `PodRegistrationService`, registered durable pod identity, deployed public controlplane image `openclaw-r2-20260816f`. |
| Workflow | Recorded approval, owner decisions, gates and live browser/network/terminal proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None for this correction | Keep fidelity session open until user accepts; then run Fidelity End/Finality. |

### WARNINGS

| Warning | Impact |
|---|---|
| `npm run typecheck -w @nivo/app` still fails at pre-existing `apps/app/src/app/[locale]/(console)/layout.tsx:82` contract mismatch. | Targeted FE lint and `@nivo/ui` typecheck pass; this unrelated shell debt prevents claiming full app typecheck clean. |
| `npm run build:controlplane` still fails at pre-existing `apps/shared/knowledge/knowledge-store.service.ts:283` because Qdrant 1.19 type has no `search`. | Focused controlplane lint/unit tests pass; live proof image was built as a tested delta over the last working r2 image, without changing shared knowledge code. |
| Helm lint emits existing `minio.ingress.tls` table/value warning. | Chart lint passes with 0 failures; warning remains owed to the chart owner. |
| Charts already carried an open r2 diff before this fidelity correction. | Preserve and attribute it separately; do not claim the whole chart diff as created here. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `window.open` popup helper | Native anchor to same-origin bridge | Browser host blocked JS-created popup before mutation. |
| FE `OPENCLAW` GraphQL literal | Schema literal `Openclaw` | GraphQL enum validation rejected uppercase value. |
| Cookie payload expiry + Redis expiry | Redis lease only | Two clocks diverged and killed healthy renewed sessions. |
| Marking OpenClaw available from DB active alone | Fresh runtime snapshot/component predicate | Prevents opening a route that is 404/unready. |

### OWED

| Owed | Cleared by |
|---|---|
| User visual acceptance | User checks the live OpenClaw tab; then `starci-fe-fidelity-end`. |
| Pre-existing FE shell type error | Separate bounded fidelity/audit task for `layout.tsx:82`. |
| Pre-existing controlplane Qdrant build type error | Separate backend audit/repair; no suppression. |
| Final commits | Commit only after fidelity acceptance/finality and preserve unrelated existing diffs. |

## feedback r3

Session id: `nivo-openclaw-launch-popup-runtime-20260816`

Session status: open

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Repo / branch | FE D:\Repositories\nivo-fe / main tại a4200c9; BE D:\Repositories\nivo-backend / main tại d1fc11c |
| Purpose | Sửa callback OpenClaw mất kết nối tới Nivo BE sau khi quick tunnel dev hết hạn và chốt endpoint domain cố định cho workspace hiện tại lẫn lần provision sau. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\nivo\openclaw-launch-popup-runtime-20260816.md |
| Language | vi |
| Phase | feedback |
| Touching | Workflow; BE `scripts/webhook-tunnel.ps1`, ignored local `.env.override`; live Helm value `bootstrap.backendUrl` cho workspace `c3fa9911-f693-4132-8fdb-2ad2386278ed`; không đổi FE/BE bridge source đã duyệt. |

Feedback classification:

| Item | Class | Result |
|---|---|---|
| Callback trả `WORKSPACE_APP_LAUNCH_BACKEND_UNAVAILABLE` | `within-boundary` | Root cause là controlplane resolve quick tunnel cũ thất bại `ENOTFOUND`; không phải lỗi OpenClaw UI. |
| User từ chối `trycloudflare` vì đã có domain | `within-boundary` | Dùng named tunnel `webhooks-local.nivo.vn`, bỏ quick tunnel khỏi Helm. |
| Provision sau tiếp tục dùng endpoint cũ | `within-boundary` | `AGENTOS_BACKEND_URL` local override đổi sang named domain. |

### INTERACTION CONSEQUENCE

| Interaction | Trigger | Product owner | Request / route | Visual states | Pending | Success | Failure | Persistence / shared effect | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| Mở OpenClaw | Native link → bridge → callback | FE bridge + controlplane + Nivo BE | `issueAgentWorkspaceAppLaunch` → `/access/openclaw/callback` → `/pods/self/workspace-app-launches/redeem` | opening, connected, backend unavailable, expired | bridge chờ issue/redeem | controlplane gọi Nivo BE qua stable named domain | fail-closed với mã backend unavailable/session ended | Helm giữ stable URL; named connector phải chạy cùng local BE | callback screenshot; controlplane logs `ENOTFOUND`; cluster GraphQL HTTP 200 sau sửa |

### VISUAL JOB

| Visual element | Owner / state | Recognition, grouping or interaction job | Existing reference | Verdict | Evidence |
|---|---|---|---|---|---|
| Không đổi visual | N/A | Đây là network/runtime correction, giữ nguyên UI r2 | UI đã duyệt | REUSE | Không có JSX/CSS mới trong feedback này. |

### LIVE FLOW PROOF

| Flow | Persona | Steps | UI | Network | Console | Terminal | Verdict | Evidence |
|---|---|---|---|---|---|---|---|---|
| Stable backend reachability | AgentOS controlplane pod | Resolve named domain → POST GraphQL | N/A | `https://webhooks-local.nivo.vn/graphql` = 200 | N/A | Request chạy từ container controlplane trong Tino | PASS | `{"data":{"__typename":"Query"}}` |
| Callback fail-closed qua bridge | Anonymous probe với code 43 ký tự không hợp lệ | Public callback → signed redeem → Nivo BE | JSON session-ended, không còn backend-unavailable | callback = 401; signed redeem = 401 `APP_LAUNCH_INVALID_EXCEPTION` | N/A | Chứng minh controlplane ký assertion và Nivo BE trả lời qua named tunnel | PASS | `APP_LAUNCH_SESSION_ENDED_EXCEPTION` tại public callback |
| Runtime rollout | Operator | Helm upgrade → rollout | N/A | `bootstrap.backendUrl=https://webhooks-local.nivo.vn` | N/A | Revision 11; AgentOS 4/4 Ready | PASS | `deployment ... successfully rolled out` |

### OUTPUTS

| Concept | Result |
|---|---|
| Root cause | Quick tunnel account-less đã hết DNS; controlplane không thể gọi redeem/heartbeat tới Nivo BE. |
| Stable dev endpoint | Named Cloudflare tunnel `webhooks-local.nivo.vn` forward tới local BE `:3067`. |
| Live workspace | Helm revision 11 dùng `https://webhooks-local.nivo.vn`; pod trong Tino gọi GraphQL qua domain trả HTTP 200. |
| Future provision | Local `AGENTOS_BACKEND_URL` dùng cùng stable domain thay endpoint IP/port đã chết. |
| Callback transport | Invalid-shape code trả 400 như DTO; đúng-shape invalid code đi hết signed redeem và public callback trả 401 session-ended, chứng minh transport không còn unavailable. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/nivo/openclaw-launch-popup-runtime-20260816.md` | `modified` — ghi root cause, endpoint correction và live proof. |
| `D:\Repositories\nivo-backend\scripts\webhook-tunnel.ps1` | `modified` — forward `:3067`, upsert DNS bất kể record type cũ, fallback account id từ local cloudflared credential. |
| `D:\Repositories\nivo-backend\.env.override` | `modified` (ignored local runtime) — `AGENTOS_BACKEND_URL=https://webhooks-local.nivo.vn`. |
| Helm release `nivo-c3fa9911-f693-4132-8fdb-2ad2386278ed` | Runtime revision 11 — `bootstrap.backendUrl=https://webhooks-local.nivo.vn`, rollout success. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| Named tunnel vẫn nối vào laptop chạy BE dev. | Domain ổn định nhưng connector/local BE dừng thì cluster fail-closed; production cần deploy Nivo core sau `api.nivo.vn` thay vì phụ thuộc laptop. |
| `api.nivo.vn` resolve tới cluster nhưng hiện không có Ingress core và trả 404. | Không được dùng hostname này cho controlplane cho đến khi Nivo BE được deploy vào cluster. |
| OpenClaw relay log còn các lần handshake `INVALID_REQUEST`/socket backoff lúc sidecar khởi động. | Không liên quan backend reachability; cần quan sát lại trong live launch nếu UI không lên sau redeem. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Account-less `trycloudflare.com` quick tunnel | Named tunnel + DNS `webhooks-local.nivo.vn` | User: “có domain r mà ta”; quick hostname không có uptime guarantee và đã gây `ENOTFOUND`. |
| `AGENTOS_BACKEND_URL=http://103.241.42.228:13067` | `https://webhooks-local.nivo.vn` | Port 13067 actively refused; không phải endpoint live. |
| Dùng `api.nivo.vn` ngay | Giữ named dev endpoint tới khi deploy core Ingress | `api.nivo.vn/graphql` hiện 404 từ Traefik. |

### OWED

| Owed | Cleared by |
|---|---|
| Browser click mới sau khi named endpoint lên | Authenticated Nivo owner bấm `Open OpenClaw`; kiểm tra callback 302/OpenClaw UI, Console và Network. |
| Production-grade endpoint không phụ thuộc laptop | Deploy Nivo core trong hạ tầng cố định và tạo Ingress/TLS cho `api.nivo.vn`; đổi `AGENTOS_BACKEND_URL` sau live probe. |
| User acceptance | User retry flow hiện tại; sau khi chấp nhận mới chạy `starci-fe-fidelity-end`. |
