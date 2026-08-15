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

