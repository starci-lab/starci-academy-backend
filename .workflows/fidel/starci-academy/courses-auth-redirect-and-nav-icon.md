<!-- starci-workflow: v2 -->

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | `starci-academy` |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | `starci-academy` |
| Repo / branch | D:\Repositories\starci-academy-fe / `main` |
| Purpose | Đo và khoanh vùng lỗi đăng nhập Keycloak cùng sai lệch icon trên trạng thái catalog `/vi/courses`. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\courses-auth-redirect-and-nav-icon.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ file workflow này; không chạm production source. |

### Binding evidence

| Evidence | Result |
|---|---|
| Ảnh người dùng cung cấp | `/vi/courses`, signed-out, light theme, desktop; ảnh 1 hiển thị Keycloak `Invalid parameter: redirect_uri`, ảnh 2 hiển thị catalog lỗi và nhóm icon trên navbar. |
| `D:\Repositories\starci-academy-fe\HANDOFF.md` | Keycloak `academy-web` chỉ whitelist `http://localhost:3000/authentication`; port khác gây lỗi `Invalid parameter: redirect_uri`. |
| Frontend auth code | `src/hooks/auth/useAuthPanel.ts:270-274` lấy `window.location.href` và gửi nguyên URL hiện tại làm `redirect_uri`. |
| Runtime proof | `POST http://127.0.0.1:3001/graphql` với request catalog không sort trả `success: true`, `count: 5`; lỗi catalog trong ảnh chưa tái hiện ở runtime hiện tại. |

### Frozen comparison

| Field | Value |
|---|---|
| Route | `http://127.0.0.1:3000/vi/courses` |
| Viewport | 2048×1137 theo ảnh người dùng cung cấp |
| Locale | `vi` |
| Theme | `light` |
| Auth persona | signed-out guest |
| Fixture / seed | Runtime backend catalog response: 5 courses |
| Reference commit | FE `bc5a239`; BE `06d0649` theo `HANDOFF.md` |
| Expected auth callback | Keycloak client phải chấp nhận callback contract của local FE; hiện evidence ghi rõ whitelist chỉ là `http://localhost:3000/authentication`. |

### Measured difference

| Area | Difference | Boundary |
|---|---|---|
| OAuth | Browser origin là `http://127.0.0.1:3000`; FE gửi URL hiện tại làm `redirect_uri`, nhưng running Keycloak client chỉ chấp nhận `http://localhost:3000/authentication`. Hai chuỗi không cùng origin/path nên Keycloak từ chối trước khi login. | Runtime Keycloak client configuration; FE chỉ là nơi tạo giá trị đầu vào. |
| Courses | Ảnh hiển thị failure notice, nhưng cùng request tại BE hiện trả `success: true` và 5 courses. Chưa đủ bằng chứng để gọi đây là production defect của FE. | Chưa đề xuất source change. |
| Icon | Ảnh chỉ nói “icon lệch”, chưa xác định icon nào, cạnh chuẩn nào hoặc sai lệch bao nhiêu px. Nhóm navbar đang dùng `IconButton`, `ThemeSwitch`, `AccountMenu` trong `ShellNav`. | Chưa đủ measurement để đưa vào Apply. |

### Smallest correction boundary

| Path | Decision |
|---|---|
| `D:\Repositories\starci-academy-fe\src\hooks\auth\useAuthPanel.ts` | REUSE hiện tại nếu binding evidence chấp nhận callback hiện tại; chưa sửa trong Plan. |
| Running Keycloak `academy-web` client | EXTEND redirect URI allow-list với local callback cần thiết; đây là external runtime configuration, không phải FE source. |
| Navbar icon source files | NEW boundary chưa được phép vì icon mục tiêu và expected geometry chưa được định danh. |

### Acceptance evidence

| Claim | Proof |
|---|---|
| OAuth không còn bị Keycloak từ chối | Chạy từ đúng local origin, bấm sign-in, Keycloak không còn báo `Invalid parameter: redirect_uri`, callback quay về đúng route. |
| Catalog không báo lỗi khi BE sẵn sàng | Reload `/vi/courses`, GraphQL trả `success: true`, UI không vào `failed`. |
| Icon đúng vị trí | Cần ảnh/reference chỉ rõ icon mục tiêu; sau đó đo bounding box/baseline trong cùng viewport và render before/after. |

### OUTPUTS

| Concept | Result |
|---|---|
| Fidelity brief | Đã khoanh vùng OAuth redirect là mismatch runtime Keycloak; catalog failure chưa tái hiện; icon cần thêm binding evidence. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/courses-auth-redirect-and-nav-icon.md` | added — workflow plan; không sửa production source. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Cho phép dùng callback chuẩn `http://localhost:3000/authentication` và mở FE bằng `localhost:3000`, đồng thời icon nào cần sửa? | Dùng `localhost:3000/authentication` + gửi ảnh crop/đánh dấu icon (khuyến nghị); hoặc chỉ rõ callback/icon contract khác. |

### WARNINGS

| Warning | Impact |
|---|---|
| Keycloak redirect allow-list nằm trong running instance, không được seed từ repo theo `HANDOFF.md`. | Restart/reprovision Keycloak có thể làm lỗi quay lại. |
| Catalog failure trong ảnh không tái hiện khi gọi BE hiện tại. | Sửa FE lúc này có thể che mất lỗi dependency/runtime thật. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Tự đổi icon hoặc hardcode redirect URI trong FE | Chốt callback contract và icon reference trước | Chưa có expected geometry cho icon; redirect allow-list là runtime boundary. |

### OWED

| Owed | Cleared by |
|---|---|
| Xác định icon mục tiêu và sai lệch đo được | Ảnh crop có khoanh icon hoặc tên control + reference render/legacy source. |
| Xác nhận Keycloak callback allow-list | Cấu hình client `academy-web` cho `http://localhost:3000/authentication`, rồi kiểm tra lại OAuth flow. |

## start

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe / main |
| Purpose | Mở lại fidelity session cho lỗi OAuth redirect, catalog state và icon lệch trên `/vi/courses`. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\courses-auth-redirect-and-nav-icon.md |
| Language | vi |
| Phase | start |
| Touching | Chỉ workflow record và browser runtime trong Start hiện tại; chưa được phép ghi production source khi icon target chưa định danh. |

Session id: fidel-courses-auth-icon-20260814-01
Session status: open
Baseline commit: f001f9dbf1f489fc4e0c56596f664d0309a255d2
Tracked diff: f001f9dbf1f489fc4e0c56596f664d0309a255d2..worktree

### Binding request and evidence

| Evidence | Result |
|---|---|
| User request | Chạy lại Fidelity Start cho issue đã ghi nhận ở `/vi/courses`. |
| Screenshot Keycloak | `redirect_uri=http://127.0.0.1:3000/vi/courses` bị `academy-web` từ chối. |
| `HANDOFF.md` | Running Keycloak chỉ whitelist `http://localhost:3000/authentication`. |
| Screenshot catalog | Signed-out/light/desktop state từng hiển thị failure notice và một icon được user nhận xét là lệch. |

### Frozen comparison

| Field | Value |
|---|---|
| Route | `http://127.0.0.1:3000/vi/courses`; auth control route sẽ so với `http://localhost:3000/vi/courses` |
| Viewport | Current in-app browser viewport; ảnh gốc 2048×1137 là binding visual evidence |
| Locale | vi |
| Theme | light |
| Auth persona | signed-out guest |
| Fixture / seed | Backend catalog hiện có 5 courses |
| Owner state | Account menu open khi kiểm tra icon/auth |
| Reference commit | FE `f001f9dbf1f489fc4e0c56596f664d0309a255d2` |

### Boundary inventory

| Owner | Decision | Reason |
|---|---|---|
| Browser origin / Keycloak `academy-web` allow-list | REUSE runtime contract | Mismatch đã đo được; chưa cần FE source change. |
| `ShellNav`, `DropdownShell`, `IconButton`, `AccountMenu` | REUSE pending measurement | Chỉ mở production boundary sau khi browser evidence định danh đúng icon và seam lệch. |

### OUTPUTS

| Concept | Result |
|---|---|
| Active fidelity session | `fidel-courses-auth-icon-20260814-01` đã mở và giữ context cũ. |
| Current correction state | OAuth có runtime workaround rõ ràng; icon đang chờ browser measurement trong cùng Start. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/courses-auth-redirect-and-nav-icon.md` | modified — appended Start session. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Start hiện chỉ đo runtime; production source chưa bị sửa. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE worktree có nhiều untracked file của các learn-route session khác. | Không được đưa chúng vào fidelity diff hoặc baseline. |
| Icon mục tiêu chưa được định danh bằng DOM/browser evidence. | Chưa được mở boundary sửa component. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | Start mới chưa nhận feedback correction. |

### OWED

| Owed | Cleared by |
|---|---|
| Đo current browser state ở `127.0.0.1` và control state ở `localhost` | Browser DOM/screenshot trong cùng viewport/persona. |
| Định danh icon lệch | DOM bounding boxes hoặc feedback chỉ rõ icon trong session mở. |

## feedback

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe / main |
| Purpose | Ghi measurement runtime và mở boundary một file cho account icon correction. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\courses-auth-redirect-and-nav-icon.md |
| Language | vi |
| Phase | feedback |
| Touching | D:\Repositories\starci-academy-fe\src\components\shells\DropdownShell\index.tsx và workflow record. |

Session id: fidel-courses-auth-icon-20260814-01
Session status: open
Feedback classification: within-boundary

### Measured feedback

| Difference | Evidence | Correction |
|---|---|---|
| Account glyph lệch trái | Account button x=373 width=40; SVG x=371 width=20; computed trigger `display:block`. Cart control x=325 width=40; SVG x=335 width=20; computed `display:flex`. | Buộc Dropdown trigger dùng flex centering giống IconButton bằng classes `flex items-center justify-center`. |
| Catalog fail ở `127.0.0.1` | Cùng runtime ở `localhost:3000/vi/courses` render 5 courses; `127.0.0.1` vào failed state. | Không sửa FE source trong feedback này; dùng canonical local origin `localhost` theo Keycloak/CORS runtime contract. |

### OUTPUTS

| Concept | Result |
|---|---|
| Account icon correction | Đã định danh owner, cơ chế lỗi và smallest source boundary. |
| Host mismatch | Đã chứng minh là runtime origin mismatch, không phải catalog component defect. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/courses-auth-redirect-and-nav-icon.md` | modified — appended measured feedback and write boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User requested Fidelity Start for the reported icon/runtime issue; correction is one-file and reversible. |

### WARNINGS

| Warning | Impact |
|---|---|
| `localhost` and `127.0.0.1` have separate browser storage/theme state. | Visual comparison must keep one hostname after runtime control is chosen. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Sửa CoursesCatalogPage để che failed state | Dùng đúng canonical local origin | API trả 5 courses ở `localhost`; component failure message is honest for the failed request. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply icon centering and capture same-state after measurement | One-file patch, HMR/reload, DOM bounding-box proof. |

## feedback

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe / main |
| Purpose | Replace the lint-rejected component utility correction with the owning vendor cascade override and prove the same frozen icon state. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\courses-auth-redirect-and-nav-icon.md |
| Language | vi |
| Phase | feedback |
| Touching | D:\Repositories\starci-academy-fe\src\app\globals.css and this workflow record. |

Session id: fidel-courses-auth-icon-20260814-01
Session status: open
Feedback classification: within-boundary

### Measured feedback

| Difference | Evidence | Correction |
|---|---|---|
| The first correction rendered correctly but violated the structural-class rule. | Focused ESLint rejected literal `flex` on `DropdownShell`; this shell must not restate layout mechanics as utility classes. | Restore `DropdownShell` unchanged and place the vendor-specific trigger correction in the existing `VENDOR OVERRIDES` section of `globals.css`. |
| Account glyph is now centred in the frozen localhost state. | Account button x=373 width=40; SVG x=383 width=20; computed `display:flex`, `align-items:center`, `justify-content:center`; centre delta=0px. | Keep `[data-slot="dropdown-trigger"].button--icon-only` as the smallest owner-aware cascade override. |

### OUTPUTS

| Concept | Result |
|---|---|
| Production correction | `src/app/globals.css` now normalizes HeroUI dropdown icon-only triggers to the established button centring contract. |
| Component boundary | `DropdownShell/index.tsx` has no retained diff. |
| Runtime proof | Same-state DOM measurement moved the account icon from 12px left of centre to 0px centre delta. |
| Source proof | Canon sync passed; focused ESLint passed; `tsc --noEmit` passed; `git diff --check` passed. |

### CHANGES

| Tree | Details |
|---|---|
| `src/app/globals.css` | modified — added one HeroUI dropdown-trigger icon centring override. |
| `.workflows/fidel/starci-academy/courses-auth-redirect-and-nav-icon.md` | modified — recorded rejected attempt, replacement boundary and proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Fidelity session remains open for continuous feedback until End is requested. |

### WARNINGS

| Warning | Impact |
|---|---|
| OAuth and catalog still require the canonical `localhost` origin. | Opening the FE as `127.0.0.1` can still fail Keycloak redirect validation and API loading; no component source change can expand the runtime allow-list. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Literal `flex items-center justify-center` classes on `DropdownShell` | Vendor cascade override in `globals.css` | The first version rendered correctly but failed `starci-fe/no-literal-structural-class`. |
| Catalog-page fallback masking the failed request | Keep its honest error state and use `localhost` | The backend catalog returns five courses on the canonical origin. |

### OWED

| Owed | Cleared by |
|---|---|
| End review and related-bug scan | Run `starci-fe-fidelity-end` when the user wants to close correction work. |
| Session finalization | Run `starci-fe-fidelity-finality` after End is complete. |

## end

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree |
| Purpose | Đóng localhost auth redirect và nav icon alignment fidelity. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\courses-auth-redirect-and-nav-icon.md |
| Language | vi |
| Phase | end |
| Touching | Workflow record, recorded session source boundary và final evidence only. |

Session id: fidel-courses-auth-icon-20260814-01
Session status: open

### RELATED BUGS

| Finding | Evidence | Classification | Route |
|---|---|---|---|
| 127.0.0.1 vẫn cố ý không phải canonical OAuth origin, không phải component bug. | Source scan, focused tests và localhost closure proof | not-a-bug | None |
| Owed ngoài production boundary | None — End/Finality được user chốt. | new-boundary | None |

### OUTPUTS

| Concept | Result |
|---|---|
| End identity | fidel-courses-auth-icon-20260814-01 tại FE baseline 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree. |
| Current proof | Authentication focused test đạt; FE localhost 3000, GraphQL 3001 và Keycloak 8081 đều phục vụ; canonical origin là localhost. |
| Shared gates | TypeScript pass; 14 focused files / 50 tests pass; Next production build pass. |
| Whole-suite audit | 630/645 tests pass; 15 failures được phân loại là concurrent stale tests/environment ngoài session boundary. |

### CHANGES

| Tree | Details |
|---|---|
| Session production boundary | Giữ nguyên correction đã được feedback chấp nhận; End không mở rộng source. |
| Workflow | Append proof, related-bug classification và closure readiness. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã chốt closure run cho toàn bộ fidelity sessions. |

### WARNINGS

| Warning | Impact |
|---|---|
| Whole-repo ESLint quét cả artifacts và mirror đang có 104 lỗi ngoài boundary | Focused lint/proofs đã đạt; không sửa artifacts hoặc concurrent lint source trong Finality. |
| Workflow validator có legacy schema errors | Closure record mới vẫn giữ đủ canonical tables; trust-tree cleanup thuộc Upgrade boundary. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Mở rộng End sang lỗi concurrent | Route theo owning capability | End chỉ sửa same-boundary regression và không chiếm work của session khác. |

### OWED

| Owed | Cleared by |
|---|---|
| None — End/Finality được user chốt. | None |
| Session closure | Fidelity Finality ngay sau End theo yêu cầu đã chốt. |

## finality

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | FE main @ 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree; BE mtp @ 7acd312a858be7ed58dc847c25ec86d801be17f8..worktree |
| Purpose | Finalize fidel-courses-auth-icon-20260814-01 sau End proof đã được user chốt. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\courses-auth-redirect-and-nav-icon.md |
| Language | vi |
| Phase | finality |
| Touching | Workflow record và final evidence only; không production correction. |

Session id: fidel-courses-auth-icon-20260814-01
Session status: finalized
Session finalized: fidel-courses-auth-icon-20260814-01
Final diff identity: FE 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree; BE 7acd312a858be7ed58dc847c25ec86d801be17f8..worktree.

### OUTPUTS

| Concept | Result |
|---|---|
| Closure | Session finalized sau current End evidence. |
| Accepted | Toàn bộ feedback cuối cùng và superseding corrections trong record. |
| Routed | None — End/Finality được user chốt. |
| Continuation | Feedback mới phải mở Fidelity Start mới với Continuation of: fidel-courses-auth-icon-20260814-01. |

### CHANGES

| Tree | Details |
|---|---|
| Workflow | Added immutable Finality closure identity. |
| Production | None — Finality không sửa source. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã nói “ok chốt đi”. |

### WARNINGS

| Warning | Impact |
|---|---|
| Linked owed không bị tuyên bố hoàn thành | None |
| Concurrent whole-repo failures vẫn được giữ nguyên | Không làm sai lệch focused proof của session này. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Append feedback vào session đã finalized | Mở linked continuation session | Finality đóng vĩnh viễn session id này. |

### OWED

| Owed | Cleared by |
|---|---|
| None — End/Finality được user chốt. | None |
