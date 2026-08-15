# MiaMia FE — đồng bộ port theo offset

Session id: `miamia-fe-offset-port`

Session status: `open`

## start

### CONTEXT

| Field | Value |
|---|---|
| Source | `D:\Repositories\starci-academy-backend` |
| Workdir | `D:\Repositories\miamia-fe` |
| Project | `miamia` |
| App | `miamia` |
| Frontend | `D:\Repositories\miamia-fe` |
| Backend | `D:\Repositories\mia-mia-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Skills | `D:\Repositories\starci-academy-backend\.claude\skills` |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |
| Workflow | `D:\Repositories\starci-academy-backend\.workflows\fidel\miamia\miamia-fe-offset-port.md` |
| Repo / branch | FE `codex/miamia-thi-thu` @ `5cf9f72edd54b79492ad44e30ab6785820c0ef6a`; BE `main` @ `420b0599c57e8fe2eceb060f00e14c9e4ac45d07` |
| Purpose | Đưa MiaMia FE khỏi port StarCi `3000` và đồng bộ port local theo offset dự án MiaMia |
| Language | `vi` |
| Phase | `start` |
| Binding evidence | Chỉ dẫn của thầy: “miamia fe tăng port lên theo offset”; `mia-mia-backend/metadata.json` khóa `portOffset = 71`, API `3000 + 71 = 3071`; pattern `nivo-fe/scripts/sync-ports.mjs` đặt web ngay trước API trong cùng dải |
| Frozen state | `http://localhost:3070/vi`; desktop; locale `vi`; local development; anonymous và test-account auth; API `http://localhost:3071/graphql` |
| Baseline identity | FE có thay đổi Profile đang dở và phải giữ nguyên; BE có thay đổi OTP test-account đang dở và phải giữ nguyên |
| Touching | Workflow này; registry port MiaMia; cấu hình/lệnh runtime FE; local web/CORS defaults tối thiểu cần để origin `http://localhost:3070` hoạt động |

### OUTPUTS

| Hạng mục | Trạng thái |
|---|---|
| Correction | Đang chuyển origin chuẩn của MiaMia FE từ `http://localhost:3000` sang `http://localhost:3070` |
| Công thức | Web `2999 + 71 = 3070`; API `3000 + 71 = 3071` |
| Proof hiện tại | Port `3070` trống; API đang nghe `3071`; preflight từ `3097` không được allow trên instance hiện tại |

### CHANGES

| Tree / path | Chi tiết |
|---|---|
| `.workflows/fidel/miamia/miamia-fe-offset-port.md` | ADD — mở session fidelity và khóa context/proof |
| `D:\Repositories\mia-mia-backend\metadata.json` | Dự kiến khai báo web base/resolved port trong registry sở hữu offset |
| `D:\Repositories\miamia-fe\scripts\sync-ports.mjs` | Dự kiến ADD — đọc registry backend, sinh env local và kiểm tra drift |
| `D:\Repositories\miamia-fe\package.json` | Dự kiến đổi dev/start sang `localhost:3070` và thêm `sync:ports` |
| Backend local web/CORS owner | Chỉ sửa owner nhỏ nhất sau khi xác nhận; không đụng logic OTP đang dở |

### NEED APPROVALS

| Cần duyệt | Trạng thái |
|---|---|
| Production correction trong boundary đã nêu | Đã được thầy yêu cầu trực tiếp; tiếp tục ngay |
| Kết thúc session | Chưa; chỉ chạy `starci-fe-fidelity-end` khi thầy yêu cầu closing proof |

### WARNINGS

| Cảnh báo | Ảnh hưởng |
|---|---|
| FE đang có nhiều thay đổi Profile chưa commit | Tuyệt đối không ghi đè, stage hay format ngoài boundary |
| BE đang có thay đổi local OTP, gồm `env/config.ts` | Nếu cần cùng file phải patch đúng dòng CORS/web và giữ nguyên diff OTP |
| `3097` xuất hiện trong workflow cũ | Đây là runtime chạy tay; không phải giá trị suy ra từ offset |
| Hostname | Dùng đúng `localhost`, không đổi sang `127.0.0.1`, để giữ CORS/cookie/session |

### REJECTED

| Bác bỏ | Thay bằng | Lý do |
|---|---|---|
| Giữ `3000` | `3070` | Va vào StarCi FE và không mang offset MiaMia |
| Chốt `3097` vì từng chạy được | Registry `3070` | `3097` không có công thức từ offset `71` |
| Chỉ sửa script FE | Đồng bộ registry + origin runtime | Nếu không, CORS/auth tiếp tục lệch |

### OWED

| Còn nợ | Cách đóng |
|---|---|
| Materialize port registry và FE sync | Patch trong boundary rồi chạy check |
| Live runtime | FE nghe `localhost:3070`, API nghe `3071` |
| Auth/network proof | Preflight trả đúng allow-origin và đăng nhập test account không lỗi network |
| Static proof | Focused lint/typecheck/test phù hợp với file chạm |
| User acceptance | Thầy xác nhận correction đạt; session vẫn `open` cho tới lúc đó |

## feedback

Session id: `miamia-fe-offset-port`

Session status: `open`

### CONTEXT

| Field | Value |
|---|---|
| Source | `D:\Repositories\starci-academy-backend` |
| Workdir | `D:\Repositories\miamia-fe` |
| Project | `miamia` |
| App | `miamia` |
| Frontend | `D:\Repositories\miamia-fe` |
| Backend | `D:\Repositories\mia-mia-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Skills | `D:\Repositories\starci-academy-backend\.claude\skills` |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |
| Workflow | `D:\Repositories\starci-academy-backend\.workflows\fidel\miamia\miamia-fe-offset-port.md` |
| User feedback | “MiaMia có port offset bao nhiêu? Reset lại port mapping cho `.stack` mình đi tránh trùng.” |
| Classification | `within-boundary` — làm rõ offset, kiểm tra collision toàn registry, materialize mapping và runtime |
| Purpose | Đồng bộ toàn bộ port local MiaMia từ một registry và loại runtime ngoài mapping |
| Language | `vi` |
| Phase | `feedback` |
| Frozen state | `http://localhost:3070/vi/exam`; desktop; locale `vi`; local development; API `http://localhost:3071/graphql` |
| Baseline identity | FE `5cf9f72edd54b79492ad44e30ab6785820c0ef6a`; BE `420b0599c57e8fe2eceb060f00e14c9e4ac45d07`; giữ nguyên toàn bộ Profile/OTP changes đang dở |
| Touching | Chỉ các path port-sync nêu trong CHANGES và workflow này |

### OUTPUTS

| Hạng mục | Kết quả |
|---|---|
| Port offset | `71` |
| Collision audit | PASS — không có exact port collision giữa registry StarCi Academy, Nivo và MiaMia |
| Mapping chuẩn | Web `2999 + 71 = 3070`; API `3000 + 71 = 3071`; Colyseus `2638`; Postgres `5503`; Redis `6450`; NATS `4293/8293`; Qdrant `6404/6405`; MinIO `9071/9072`; Keycloak `8151` |
| Runtime | PASS — FE nghe `localhost:3070`, API nghe `3071`; port cũ `3000`, port preview `3097` và API test phụ `3072` đều đã trống |
| Network | PASS — preflight 204 và GraphQL 200 đều trả `Access-Control-Allow-Origin: http://localhost:3070` |
| Browser | PASS — `/vi/exam` mở đúng MiaMia/Thi thử tại port `3070`, không có console error |
| Static | PASS — FE typecheck; sync check; Node syntax; focused auth test `17/17`; focused ESLint; backend sync/compose config; metadata formula; diff check |

### CHANGES

| Tree / path | Chi tiết |
|---|---|
| `D:\Repositories\mia-mia-backend\metadata.json` | MODIFY — thêm registry `basePorts.web = 2999`, `ports.web = 3070` |
| `D:\Repositories\mia-mia-backend\scripts\sync.mjs` | MODIFY — sinh `WEB_BASE_URL` và `CORS_ORIGIN_1` từ `ports.web`; khóa hai key là metadata-owned |
| `D:\Repositories\miamia-fe\scripts\sync-ports.mjs` | ADD — đọc duy nhất backend registry, kiểm công thức, sinh `.env.development.local`, phát hiện drift script/API fallback |
| `D:\Repositories\miamia-fe\package.json` | MODIFY — `predev` chạy sync; `dev/start` khóa `localhost:3070`; thêm `sync:ports` |
| `D:\Repositories\miamia-fe\HANDOFF.md` | MODIFY — ghi origin và mapping local chuẩn của MiaMia |
| `D:\Repositories\miamia-fe\src\hooks\auth\useAuthPanel.test.ts` | MODIFY — fixture origin theo canonical web port `3070` |
| Local generated env | `.env.override` có web/CORS `3070`, core `3071`; `.env.development.local` có GraphQL `3071`; đều ignored, không chứa thêm secret vào git |
| Runtime process | Dừng đúng stale MiaMia API test PID `37072` trên `3072`; giữ API chính `3071` và FE `3070` |
| `.workflows/fidel/miamia/miamia-fe-offset-port.md` | APPEND — ghi mapping, proof và cảnh báo bằng tiếng Việt |

### NEED APPROVALS

| Cần duyệt | Trạng thái |
|---|---|
| Mapping `+71` vừa materialize | Chờ thầy xác nhận kết quả đạt |
| Git stage/commit | Chưa được yêu cầu trong fidelity; không stage thay đổi Profile/OTP đang dở |
| Kết thúc fidelity | Chưa; dùng `starci-fe-fidelity-end` khi thầy muốn closing proof |

### WARNINGS

| Cảnh báo | Ảnh hưởng |
|---|---|
| `npm run sync` báo 13 required key chưa có trong `.env.override` | Không chặn boot/CORS proof hiện tại, nhưng đây là debt cấu hình stack có sẵn; không tự chế secret trong task port |
| BE/FE đều có worktree changes của task Profile/OTP | Đã bảo toàn; diff/stat tổng repo chứa cả thay đổi không thuộc correction này |
| Backend `config.ts` vẫn có fallback `localhost:3000` | Local stack chuẩn luôn chạy sync để `.env.override` metadata-owned thắng fallback; production phải inject origin deployment |
| Title `/vi` còn hiển thị `StarCi Academy` | Ngoài boundary port; `/vi/exam` xác nhận đúng MiaMia app surface |

### REJECTED

| Bác bỏ | Thay bằng | Lý do |
|---|---|---|
| Đổi offset khỏi `71` dù không có collision | Giữ `71`, bổ sung web mapping bị thiếu | Audit registry chứng minh không trùng; đổi offset sẽ di chuyển toàn bộ datastore/VPS port vô ích |
| Dùng `3097` | `3070` | `3097` là lệnh chạy tay cũ, không suy ra từ registry |
| Để API test phụ `3072` chạy | Dừng đúng process test cũ | Tránh một origin/runtime ngầm ngoài `.stack` gây nhầm |
| Ghi API URL vào `.env.local` chứa test credential | Sinh `.env.development.local` riêng | Không ghi đè test-account secrets local |

### OWED

| Còn nợ | Cách đóng |
|---|---|
| User acceptance | Thầy xác nhận mapping `3070/3071` đúng mong muốn |
| Stack required-key warning | Tách audit/repair riêng nếu thầy muốn làm sạch 13 key; không trộn vào correction port |
| Session closure | Sau acceptance, chạy Fidelity End rồi Finality theo yêu cầu |

## feedback

Session id: `miamia-fe-offset-port`

Session status: `open`

### CONTEXT

| Field | Value |
|---|---|
| Source | `D:\Repositories\starci-academy-backend` |
| Workdir | `D:\Repositories\miamia-fe` |
| Project | `miamia` |
| App | `miamia` |
| Frontend | `D:\Repositories\miamia-fe` |
| Backend | `D:\Repositories\mia-mia-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Skills | `D:\Repositories\starci-academy-backend\.claude\skills` |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |
| Workflow | `D:\Repositories\starci-academy-backend\.workflows\fidel\miamia\miamia-fe-offset-port.md` |
| Repo / branch | FE `codex/miamia-thi-thu`; BE `main` |
| Purpose | Test UX/UI và runtime end-to-end trên các luồng người dùng MiaMia hiện có |
| Language | `vi` |
| Phase | `feedback` |
| User feedback | “Test hết trên user các luồng đi, UX/UI test xem work cả không.” |
| Classification | `within-boundary` cho proof và lỗi nhỏ đã rõ; `new-finding` nếu cần capability/file boundary mới |
| Frozen state | `http://localhost:3070`; API `http://localhost:3071/graphql`; locale `vi`; desktop + mobile; anonymous + local test account |
| Touching | Trước khi có defect: chỉ workflow; checkout/payment thật bị loại theo quyết định trước đó của thầy |

### OUTPUTS

| Hạng mục | Trạng thái |
|---|---|
| User-flow matrix | Đang inventory route/state thật trước khi chạy |
| UX/UI proof | Đang chờ desktop/mobile browser proof |
| Network/terminal | Đang chờ kiểm tra GraphQL, console và backend log |

### CHANGES

| Tree / path | Chi tiết |
|---|---|
| `.workflows/fidel/miamia/miamia-fe-offset-port.md` | APPEND — mở vòng test toàn luồng người dùng |

### NEED APPROVALS

| Cần duyệt | Trạng thái |
|---|---|
| Test các mutation học tập/auth bằng test account local | Đã được thầy yêu cầu trực tiếp |
| Checkout/payment bên ngoài | Không chạy; thầy đã hoãn checkout |

### WARNINGS

| Cảnh báo | Ảnh hưởng |
|---|---|
| “Tất cả” chỉ áp dụng cho feature/route đã materialize trong source hiện tại | Không giả định vocabulary/grammar/checkout đã hoàn thiện nếu source chưa có |
| Test account credential là local secret | Chỉ đọc từ env, không in vào terminal/chat/workflow |
| Worktree Profile và OTP đang dở | Giữ nguyên; chỉ sửa defect nhỏ có bằng chứng và không ghi đè thay đổi của thầy |

### REJECTED

| Bác bỏ | Thay bằng | Lý do |
|---|---|---|
| Claim “all pass” từ một trang | Matrix theo từng route, state, viewport, network và console | Cần bằng chứng user-facing thật |
| Chạy Premium checkout | Chỉ kiểm CTA/overlay local nếu có, không tạo payment | Quyết định checkout đã hoãn |

### OWED

| Còn nợ | Cách đóng |
|---|---|
| Route/flow inventory | Đọc route và owner source hiện tại |
| Anonymous flows | Browser proof trên origin canonical |
| Authenticated flows | Đăng nhập UI bằng test account, OTP local, chạy feature chính |
| Responsive UX | Desktop sidebar và mobile footbar, overflow, controls |
| Runtime evidence | Console, GraphQL/CORS và backend terminal |
| Verdict | Ghi pass/fail/blocker và mọi correction vào section này |

## feedback — kết quả test toàn luồng user

Session id: `miamia-fe-offset-port`

Session status: `open`

### CONTEXT

| Field | Value |
|---|---|
| Source | `D:\Repositories\starci-academy-backend` |
| Workdir | `D:\Repositories\miamia-fe` |
| Project / App | `miamia` |
| Frontend | `D:\Repositories\miamia-fe` |
| Backend | `D:\Repositories\mia-mia-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Skills | `D:\Repositories\starci-academy-backend\.claude\skills` |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |
| Workflow | `D:\Repositories\starci-academy-backend\.workflows\fidel\miamia\miamia-fe-offset-port.md` |
| Runtime | FE `http://localhost:3070`; GraphQL `http://localhost:3071/graphql`; locale `vi` |
| Test identity | Test account local; credential và OTP không ghi vào workflow |
| Viewports | Desktop `1440×900`; mobile `390×844` |

### OUTPUTS

| Luồng / concept | Kết quả |
|---|---|
| Port, CORS, catalogue load | PASS — FE `3070`, API `3071`, preflight 204, GraphQL 200 |
| Anonymous catalogue | PASS — mở catalogue, đổi collection, CTA đề/Premium yêu cầu đăng nhập |
| Tìm kiếm đề | PASS sau correction — gõ `Bac Ninh` lọc từ 2 xuống 1 đề; clear trả lại toàn bộ |
| Responsive shell | PASS sau correction — desktop sidebar; mobile footbar 5 mục; không còn overflow ngang |
| Mục chưa phát hành | PASS — mở overlay “đang được hoàn thiện”, không điều hướng vào route chết |
| Anonymous Profile | PASS sau correction — `/vi/profile` chuyển sang `/vi/authentication`, không còn màn trắng |
| Đăng nhập local | PASS — email → password → OTP → trạng thái đăng nhập thành công |
| Session restore trong MiaMia | PASS sau correction — reload `/vi/exam` vẫn nhận phiên đăng nhập |
| Thi thử | PASS — mở đề An Giang, trả lời đủ 40/40, chuyển câu và nộp bài |
| Chấm điểm / kết quả | PASS — trả kết quả `8/40`, breakdown kỹ năng và lời giải từng câu |
| Premium | PASS trong scope — CTA mở checkout overlay; không chạy thanh toán thật theo quyết định hoãn checkout |
| Authenticated Profile | FAIL — bấm “Hồ sơ” khi đã đăng nhập vẫn chỉ hiện shell, phần nội dung trắng |
| Redirect sau standalone login | FAIL UX — đăng nhập tại route authentication chuyển sang dashboard StarCi legacy thay vì bối cảnh MiaMia |
| Terminal / network | Không có request failure trong luồng thi; backend không ghi exception. FE còn warning `next-intl` thiếu `timeZone` |

### CHANGES

| Tree / path | Chi tiết |
|---|---|
| `D:\Repositories\miamia-fe\scripts\run-dev.mjs` | ADD — đọc registry và ép dev child dùng đúng GraphQL `3071`, không kế thừa env stale |
| `D:\Repositories\miamia-fe\scripts\sync-ports.mjs` | ADD/MODIFY — kiểm tra mapping, dev wrapper và drift |
| `D:\Repositories\miamia-fe\package.json` | MODIFY — `dev` đi qua wrapper canonical |
| `D:\Repositories\miamia-fe\src\components\contracts\index.ts` | MODIFY — shell mobile stretch và catalogue có `min-w-0/max-w-full` để chặn overflow |
| `D:\Repositories\miamia-fe\src\components\leaves\SearchBox\index.tsx` | MODIFY — phát query ngay khi người dùng gõ; Enter và clear vẫn hoạt động |
| `D:\Repositories\miamia-fe\src\components\leaves\SearchBox\index.test.tsx` | ADD — khóa typing và clear behavior |
| `D:\Repositories\miamia-fe\src\components\pages\ProfileRedirectPage\index.tsx` | MODIFY — anonymous/session lỗi chuyển sang authentication thay vì treo trắng |
| `D:\Repositories\miamia-fe\src\components\pages\ProfileRedirectPage\index.test.tsx` | ADD — khóa authenticated, error và anonymous-restored branches |
| `D:\Repositories\miamia-fe\src\components\layouts\MiaMiaAppLayout\index.tsx` | MODIFY — khởi động `useSessionRefresh` cho toàn shell MiaMia |
| `D:\Repositories\miamia-fe\src\modules\api\env.test.ts` | MODIFY — kỳ vọng fallback API theo canonical `3071` |
| Local runtime only | Đồng bộ Keycloak client secret mount và `KEYCLOAK_CLIENT_ID=miamia-web`; không ghi secret vào git/workflow |

### NEED APPROVALS

| Cần duyệt | Trạng thái |
|---|---|
| Hướng xử lý Profile authenticated thiếu username/data | Cần workflow Profile hiện tại chốt state: onboarding username, fallback identity hay error surface; không tự đoán |
| Return target sau standalone MiaMia login | Cần chốt route đích MiaMia hoặc cơ chế `returnTo` |
| Checkout/payment thật | Không chạy; đã hoãn theo yêu cầu trước đó |
| Commit/stage | Chưa làm; worktree chứa Profile changes đang dở của task khác |

### WARNINGS

| Cảnh báo | Ảnh hưởng |
|---|---|
| Full Vitest: `138/151` files pass, `517/533` tests pass; 13 files / 16 tests fail | Các failure còn lại thuộc test debt/worktree có sẵn: next/navigation resolution, ResizeObserver, contract selectors, hooks barrel, Apollo chain và course query; focused correction tests `14/14` pass |
| Full typecheck vẫn đỏ | Contract registry/worktree Profile đang dở tạo nhiều lỗi `never`; các file runtime/test correction không có lỗi riêng, ngoại trừ `MiaMiaAppLayout/component.tsx` thuộc contract drift đang có |
| Thiếu `timeZone` trong next-intl | Dev terminal báo `ENVIRONMENT_FALLBACK`; chưa gây fail luồng nhưng có nguy cơ hydration mismatch |
| Copy catalogue chưa sạch locale | Collection còn tiếng Anh; tên đề thiếu dấu tiếng Việt; level hiển thị `b2` thường |
| Test account Profile chưa materialize đúng identity | Là nguyên nhân khả nghi của content trắng, nhưng chưa đủ bằng chứng để tự tạo username hoặc đổi contract |

### REJECTED

| Bác bỏ | Thay bằng | Lý do |
|---|---|---|
| Báo “all pass” | Ma trận PASS/FAIL theo luồng | Authenticated Profile và redirect hậu-login vẫn lỗi thật |
| Dùng API-direct thay bằng chứng UI | UI email/password/OTP và 40 câu thật | User yêu cầu proof theo hành vi người dùng |
| Tự sinh username cho test account | Ghi OWED và chờ owner Profile chốt | Có thể làm sai identity contract đang được phát triển |

### OWED

| Còn nợ | Cách đóng |
|---|---|
| Authenticated Profile trắng | Tiếp tục workflow Profile đã duyệt, xác định `me.username`/profile record và render state có chủ đích |
| Login rơi về dashboard StarCi | Thêm MiaMia return target hoặc `returnTo`, rồi retest standalone + overlay login |
| Full gates đỏ | Tách lint/typecheck/test audit cho worktree hiện tại; không trộn sửa diện rộng vào fidelity correction này |
| Fidelity closure | Session vẫn mở; chạy End/Finality sau khi hai UX defect trên được xử lý hoặc được thầy chấp nhận là owed |

## feedback — sửa toàn bộ defect còn lại

Session id: `miamia-fe-offset-port`

Session status: `open`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\miamia-fe` |
| Source | `D:\Repositories\starci-academy-backend` |
| Project | `miamia` |
| Frontend | `D:\Repositories\miamia-fe` |
| Backend | `D:\Repositories\mia-mia-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Skills | `D:\Repositories\starci-academy-backend\.claude\skills` |
| App | `miamia` |
| Repo / branch | FE `D:\Repositories\miamia-fe` @ `codex/miamia-thi-thu`; BE `D:\Repositories\mia-mia-backend` @ `main` |
| Purpose | Sửa Profile authenticated trắng, return target sai, copy catalogue chưa Việt hóa và warning `timeZone`, đồng thời retest các correction trước đó |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |
| Workflow | `D:\Repositories\starci-academy-backend\.workflows\fidel\miamia\miamia-fe-offset-port.md` |
| Language | `vi` |
| Phase | `feedback` |
| Touching | FE `src/components/pages/ProfileRedirectPage/{index.tsx,index.test.tsx}`, `src/components/pages/AuthenticationPage/index.tsx`, `src/app/[lang]/authentication/screen.test.tsx`, `src/i18n/request.ts`, `src/app/providers.tsx`, `src/app/providers.test.tsx`, `src/app/[lang]/layout.tsx`, `src/components/blocks/exam/ExamCatalog/index.tsx` và focused tests/messages nếu owner yêu cầu; BE `scripts/import-exams-md.ts` và focused importer tests; workflow này |

### OUTPUTS

| Concept | Result |
|---|---|
| Active correction | Bốn defect còn lại được coi là authorized `within-boundary`; các correction đã PASS sẽ được regression-test lại |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/miamia/miamia-fe-offset-port.md` | `modified` — mở feedback revision và khóa write boundary trước production write |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Yêu cầu “sửa hết” đã cấp quyền cho boundary defect hiện tại; không mở payment thật |

### WARNINGS

| Warning | Impact |
|---|---|
| FE Profile và BE OTP đang có thay đổi dở ngoài correction | Không stage, format hoặc ghi đè unrelated diff |
| Copy tiêu đề đến từ dataset ASCII | Phải sửa ở owner seed/import hoặc mapping có test; không hardcode hai card trong JSX |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Giữ các defect dưới dạng OWED | Sửa và retest toàn bộ | Thầy yêu cầu “sửa hết” |

### OWED

| Owed | Cleared by |
|---|---|
| Runtime diagnosis của Profile | Xác định response/state `me` thật rồi sửa owner nhỏ nhất |
| Bốn correction | Focused tests, UI desktop/mobile, login → Profile và terminal/network proof |

## feedback — mở rộng owner cho identity backfill

Session id: `miamia-fe-offset-port`

Session status: `open`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\mia-mia-backend` |
| Source | `D:\Repositories\starci-academy-backend` |
| Project | `miamia` |
| Frontend | `D:\Repositories\miamia-fe` |
| Backend | `D:\Repositories\mia-mia-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Skills | `D:\Repositories\starci-academy-backend\.claude\skills` |
| App | `miamia` |
| Repo / branch | `D:\Repositories\mia-mia-backend` @ `main` |
| Purpose | Backfill username/email cho user row cũ khi authenticated guard đã xác minh token |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |
| Workflow | `D:\Repositories\starci-academy-backend\.workflows\fidel\miamia\miamia-fe-offset-port.md` |
| Language | `vi` |
| Phase | `feedback` |
| Touching | BE `apps/api/src/modules/keycloak/guards/abstract.ts`, `apps/api/src/modules/keycloak/guards/keycloak-auth.guard.spec.ts`; workflow này |

### OUTPUTS

| Concept | Result |
|---|---|
| Root cause | Local test user tồn tại theo `keycloakId` nhưng legacy row có `username = null`, `email = null`; sign-in chỉ kiểm tra row tồn tại nên public profile không thể lookup |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/miamia/miamia-fe-offset-port.md` | `modified` — ghi bằng chứng DB và mở rộng exact backend owner |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Yêu cầu sửa hết bao gồm migration-on-read an toàn cho legacy identity row |

### WARNINGS

| Warning | Impact |
|---|---|
| Chỉ backfill field đang rỗng | Không ghi đè username/email người dùng đã có |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Hardcode test user trong Profile FE | Đồng bộ legacy row tại authenticated identity guard | Fix đúng owner cho mọi user cũ, không riêng test account |

### OWED

| Owed | Cleared by |
|---|---|
| Identity backfill | Guard unit test + live `/profile` render ready |

## feedback — kết quả sửa toàn bộ defect còn lại

Session id: `miamia-fe-offset-port`

Session status: `open`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\miamia-fe` |
| Source | `D:\Repositories\starci-academy-backend` |
| Project | `miamia` |
| Frontend | `D:\Repositories\miamia-fe` |
| Backend | `D:\Repositories\mia-mia-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Skills | `D:\Repositories\starci-academy-backend\.claude\skills` |
| App | `miamia` |
| Repo / branch | FE `D:\Repositories\miamia-fe` @ `codex/miamia-thi-thu`; BE `D:\Repositories\mia-mia-backend` @ `main` |
| Purpose | Sửa search, Profile anonymous/authenticated, session restore, return target sau đăng nhập, copy đề tiếng Việt, `timeZone` và hydration runtime |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |
| Workflow | `D:\Repositories\starci-academy-backend\.workflows\fidel\miamia\miamia-fe-offset-port.md` |
| Runtime | FE `http://localhost:3070`; GraphQL `http://localhost:3071/graphql`; Keycloak `http://localhost:8151` |
| Viewports | Desktop `1440×900`; mobile `390×844` |
| Language | `vi` |
| Phase | `feedback` |

### OUTPUTS

| Concept | Result |
|---|---|
| Tìm kiếm kho đề | PASS — lọc tức thời từ 2 xuống 1 đề với từ khóa `Bắc Ninh` |
| Profile anonymous | PASS — đi tới authentication có `returnTo=/profile`, không còn màn trắng |
| Profile authenticated | PASS — test account mở `/vi/profile/learner`, có hero và tiến độ học tập |
| Session restore | PASS — cold-load tab mới tự phục hồi phiên rồi mở đúng Profile |
| Standalone login | PASS — email → password → OTP trả về `/vi/exam`, không còn rơi vào dashboard StarCi |
| Catalogue tiếng Việt | PASS — collection và hai đề demo có dấu đầy đủ; level hiển thị `B2` |
| Locale runtime | PASS — có `Asia/Ho_Chi_Minh`; terminal không còn warning thiếu `timeZone` |
| Responsive | PASS — desktop có sidebar; mobile có footbar 5 mục; không overflow ngang |
| Thi thử smoke flow | PASS — mở đề An Giang, chọn đáp án câu 1 và đi tới câu 2/40 |
| Runtime console | PASS trên cold-load desktop và mobile — không có console error; hydration mismatch đã được sửa |
| Backend | PASS — identity backfill không ghi đè dữ liệu đã có; importer Việt hóa idempotent |

### CHANGES

| Tree / path | Details |
|---|---|
| `D:\Repositories\miamia-fe\src\components\leaves\SearchBox\index.tsx` | MODIFY — phát query ngay khi gõ và giữ hành vi clear |
| `D:\Repositories\miamia-fe\src\components\leaves\SearchBox\index.test.tsx` | ADD — khóa typing/clear behavior |
| `D:\Repositories\miamia-fe\src\components\pages\ProfileRedirectPage\index.tsx` | MODIFY — chờ restore; anonymous về authentication; authenticated gọi `me`, lấy username/email/JWT fallback rồi replace route |
| `D:\Repositories\miamia-fe\src\components\pages\ProfileRedirectPage\index.test.tsx` | ADD — khóa username, email fallback, anonymous và query failure |
| `D:\Repositories\miamia-fe\src\components\pages\AuthenticationPage\index.tsx` | MODIFY — hỗ trợ safe `returnTo`; mặc định `/exam` |
| `D:\Repositories\miamia-fe\src\app\[lang]\authentication\screen.test.tsx` | MODIFY — khóa MiaMia default và safe return target |
| `D:\Repositories\miamia-fe\src\components\layouts\MiaMiaAppLayout\index.tsx` | MODIFY — chạy session refresh ở shell MiaMia |
| `D:\Repositories\miamia-fe\src\i18n\config.ts` | MODIFY — khai báo canonical `TIME_ZONE` |
| `D:\Repositories\miamia-fe\src\i18n\request.ts` | MODIFY — dùng timezone chung ở server request config |
| `D:\Repositories\miamia-fe\src\app\providers.tsx` | MODIFY — truyền timezone cho `NextIntlClientProvider` |
| `D:\Repositories\miamia-fe\src\app\[lang]\layout.tsx` | MODIFY — cấp timezone cho provider |
| `D:\Repositories\miamia-fe\src\app\providers.test.tsx` | MODIFY — khóa provider contract mới |
| `D:\Repositories\miamia-fe\src\components\blocks\exam\ExamCatalog\index.tsx` | MODIFY — dùng copy collection tiếng Việt, uppercase level và giữ SWR cache sau mount để server/client hydrate cùng cây |
| `D:\Repositories\miamia-fe\src\messages\vi.json` | MODIFY — thêm tên chương trình thi tiếng Việt |
| `D:\Repositories\miamia-fe\src\messages\en.json` | MODIFY — giữ catalogue đối xứng locale |
| `D:\Repositories\mia-mia-backend\scripts\import-exams-md.ts` | MODIFY — Việt hóa program, tỉnh/thành và tiêu đề đề khi import |
| `D:\Repositories\mia-mia-backend\scripts\import-exams-md.spec.ts` | ADD — khóa mapping dấu tiếng Việt |
| `D:\Repositories\mia-mia-backend\apps\api\src\modules\keycloak\guards\abstract.ts` | MODIFY — backfill username/email/avatar còn thiếu từ token đã verify; không ghi đè field đã có |
| `D:\Repositories\mia-mia-backend\apps\api\src\modules\keycloak\guards\keycloak-auth.guard.spec.ts` | MODIFY — khóa legacy identity backfill và no-overwrite path |
| `D:\Repositories\starci-academy-backend\.workflows\fidel\miamia\miamia-fe-offset-port.md` | MODIFY — ghi correction, proof và residual gate debt |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Các defect được yêu cầu đã sửa và chứng minh trên runtime; session fidelity vẫn để mở để nhận feedback tiếp theo |

### WARNINGS

| Warning | Impact |
|---|---|
| Full FE Vitest vẫn đỏ: `140/151` files pass, `522/537` tests pass | 11 file / 15 test còn lỗi ở dashboard contract selectors, test environment `ResizeObserver`/`next/navigation`, hooks barrel, Apollo chain và course query; không thuộc correction này |
| Full FE typecheck vẫn đỏ ở contract registry/worktree Profile đang dở | Correction-owned connected files không phát sinh lỗi lint; một lỗi `useRef` của ProfileRedirect đã được phát hiện và sửa trước handoff |
| Focused ESLint chỉ còn warning cấu hình `eslint-plugin-react` chưa khai báo version | Không có lint error trong correction boundary |
| Validator riêng record này: `legacy: true`, `errors: []`; validator toàn workflow root vẫn đỏ | Lỗi toàn root nằm ở các record StarCi/Nivo khác đã tồn tại, không phát sinh từ record MiaMia này |
| Full checkout | Chưa chạy theo quyết định hoãn checkout; CTA/overlay vẫn nằm ngoài payment thật |
| Worktree FE/BE có thay đổi đang dở từ trước | Không stage, commit hay ghi đè unrelated diff |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Hardcode test account trong Profile FE | Migration-on-read tại authenticated guard | Đúng owner và áp dụng an toàn cho mọi legacy user |
| Hardcode hai title đã Việt hóa trong JSX | Việt hóa tại importer/data owner | Reload/import lại vẫn giữ kết quả |
| Bỏ qua hydration warning vì UI vẫn nhìn được | Giữ loading tree giống nhau đến sau mount | Console sạch là một runtime gate đã được yêu cầu |
| Claim toàn bộ repository xanh | Tách focused proof và residual full-gate debt | Không che lỗi ngoài boundary |

### OWED

| Owed | Cleared by |
|---|---|
| Full FE gate debt ngoài correction | Workflow audit/repair riêng cho contract registry và test environment |
| Premium payment thật | Workflow checkout riêng khi thầy mở lại phạm vi |
| Fidelity closure | Nhận feedback của thầy; sau đó chạy Fidelity End rồi Finality nếu được yêu cầu |
