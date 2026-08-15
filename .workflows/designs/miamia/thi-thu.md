<!-- starci-workflow: v2 -->
# Thi thử MiaMia

## plan r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\mia-mia` |
| Source | D:\Repositories\starci-academy-backend |
| Project | `MiaMia` |
| Frontend | `D:\Repositories\mia-mia` |
| Backend | `D:\Repositories\mia-mia-backend` |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | `miamia` |
| Repo / branch | `D:\Repositories\mia-mia @ main` |
| Purpose | Lập brief và các phương án UX khả thi cho toàn bộ hành trình Thi thử MiaMia trước khi Review khóa cây component và props. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md |
| Language | vi |
| Phase | plan |
| Touching | `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md`; `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\thi-thu\r1\` |

Database phụ thuộc màn này là PostgreSQL, được phục vụ qua GraphQL backend MiaMia.
Frontend và Backend đều ở nhánh `main`; hai worktree đang có thay đổi không liên quan và Plan không chạm vào các thay đổi đó.

### BRIEF

**Mode:** creative. Không có legacy screen được người dùng chỉ định là parity authority. Source hiện tại là bằng chứng tái sử dụng và hướng A là phương án bảo thủ, không phải cam kết giữ nguyên drift hiện có.

**Page thesis:** Màn Thi thử giúp học sinh chọn được một đề họ thực sự có quyền mở, hoàn thành đề mà không bị áp lực đếm giờ, rồi đi thẳng từ kết quả sang các lỗi sai đáng ôn nhất.

**Core loop:** `chọn đề → làm/nộp → xem lỗi sai → ôn lại`.

**Primary action theo surface:**

| Surface | Primary action | Earned moment |
|---|---|---|
| Catalogue | Mở một đề có quyền truy cập | Sau khi người học hiểu chương trình, số câu và trạng thái Demo/Pro |
| Runner | Đi tiếp trong đề hoặc nộp bài | `Đi tiếp` khi chưa tới cuối; `Nộp bài` chỉ dẫn đầu ở điểm kết thúc |
| Result | Xem/ôn các câu sai cụ thể | Ngay sau khi điểm và số câu sai đã được hiểu |
| Locked paper | Xem quyền Pro | Sau khi người học đã thấy đề cụ thể nhưng server không cho mở nội dung |

**Anti-goals:** không dùng countdown; không auto-submit; không gửi answer key trước khi nộp; không gọi một đề là “được đề xuất” nếu chỉ lấy paper đầu tiên; không giả vờ có save/resume, review-session hay weak-point GraphQL khi contract chưa tồn tại; không đặt upsell Pro làm primary trên result surface.

### EVIDENCE

| Claim | Best-belief source | Quan sát | Hệ quả thiết kế |
|---|---|---|---|
| Thi không đếm giờ, cho phép tạm dừng/quay lại | `D:\Repositories\mia-mia-backend\biz.md` B2 | Đây là product decision đã chốt | Xóa countdown/auto-submit khỏi mọi hướng; pause/resume phải được backend hóa trước khi hứa trong production |
| Full paper library và phân tích điểm yếu là lý do mua Pro | `biz.md` A2/A3/B2 | Paywall thuộc nội dung và chẩn đoán, không phải toàn bộ feature | Catalogue vẫn public; card phải nói thật `isLocked`; API giữ gate server-side |
| Catalogue backend đã phân program và entitlement | Live GraphQL `examPrograms`, `papers` trên `127.0.0.1:3071` | `programSlug`, `isDemo`, `isLocked` đang phục vụ | FE phải tiêu thụ contract này thay vì tự suy lock/demo |
| Answer key không được lộ khi đang thi | `paperDetail` GraphQL type và `gradePaper` | `paperDetail.questions` không có answer; `gradePaper` mới trả `correct` + explanation | Runner chỉ render verdict sau mutation thành công |
| Highlight đã có RAG suggestion | `suggestStudy`; `StudySuggestPopover` | Free/Pro scope đã được backend quyết định | REUSE retrieval; không gọi nó là đã thêm vào review queue |
| Attempt events đã có batch mutation | `recordAttemptEvents` | Backend nhận highlight/dwell/skip/change khi có `attemptId` hợp lệ | Chưa dùng được trọn vẹn trong lúc làm vì chưa có attempt mở trước submit |
| Source FE hiện dùng catalogue phẳng | `PapersList`, `PaperDetailDrawer`, `PaperRunner`, `query-exam.ts` | FE bỏ `examPrograms`, `programSlug`, `isDemo`, `isLocked`; runner còn timer/auto-submit | Đây là contract drift cần Review khóa, không phải behavior để bảo toàn |
| Target FE chưa có executable contract registry StarCi | Tìm `ContractComponent`, `COMPONENTS`, `contract.why` trong `apps/app/src` | Không tìm thấy registry đang dùng | Plan phân loại component hiện hữu; Review phải quyết định delta theo architecture thật của MiaMia, không giả vờ registry đã tồn tại |

### LIVE CONTRACT SNAPSHOT

Chụp ngày 2026-08-15 từ GraphQL local:

| Fact | Value |
|---|---|
| Programs | `1` (`thptqg`) |
| `bankCount` của THPTQG | `30` |
| Published papers | `36` |
| Paper có `isDemo=true` | `5` |
| Demo đang unlocked cho caller Free/anonymous | `2` |
| Papers locked | `34` |
| `examPrograms[thptqg].nameVi` | rỗng |
| `paperDetail` | bắt buộc đăng nhập và entitlement |

### INVENTORY — CONTRACT VÀ DATA

| Candidate | Verdict | Lý do / boundary |
|---|---|---|
| Backend `examPrograms` | REUSE | Đã có program identity, thứ tự và bank count; FE chưa consumer |
| Backend `papers` | REUSE | Đã trả đủ catalogue và lock state |
| FE `papersQuery` / `PaperSummary` | EXTEND | Phải chọn thêm `isDemo`, `isLocked`, `programSlug`; không tự suy |
| FE query/hook `examPrograms` | NEW | Backend có thật nhưng FE chưa có consumer |
| `paperDetail` | REUSE | Dữ liệu runner hợp lệ, không có answer key; cần state đăng nhập/403 |
| `gradePaper` | REUSE | Trả score, correct answer và explanation sau submit |
| `myAttempts` | REUSE | Đủ cho lịch sử gần nhất và retake; không đủ cho attempt dở |
| `suggestStudy` | REUSE | Đủ cho RAG popover; `attemptId` chỉ ghi được khi có attempt thật |
| `recordAttemptEvents` | REUSE | Đủ nhận batch event nhưng owner attempt hiện chưa mở trước submit |
| Start/save/resume open attempt | NEW — backend feature riêng | Là durable transition và authorization boundary; FE Design không được tự phát minh |
| Add highlighted phrase to review queue | NEW — backend feature riêng | Hiện không có GraphQL mutation hoặc mastery transition tương ứng |
| Weak-point report GraphQL | NEW/EXTEND — backend review riêng | Có event/rollup nền nhưng chưa có query product-facing được tìm thấy |

### INVENTORY — SOURCE UI

| Candidate | Verdict | Lý do / boundary |
|---|---|---|
| `/[locale]/exam`, `/dashboard/exam`, `/[locale]/exam/[slug]` | REUSE | Route family đã đúng catalogue/runner |
| `PapersList` | EXTEND | Thêm program hierarchy, lock/demo truth, signed-out/error/empty states |
| `PaperDetailDrawer` | EXTEND | CTA phải tách open, login và Pro entitlement; bỏ duration như áp lực countdown |
| `PaperRunner` | EXTEND | Bỏ timer/auto-submit; tách ready/submitting/result; chọn runner composition theo direction |
| `StudySuggestPopover` | EXTEND | Giữ retrieval; cần nhận question identity và chỉ hứa tracking khi có attemptId |
| `PageHeader`, `PressableCard`, `DrawerShell`, `QuizCard`, `ErrorState`, `EmptyState`, `Skeleton` | REUSE | Ownership và state hiện tại phù hợp với các mảnh tương ứng |
| Question navigator | NEW composite/branch candidate | Không có owner hiện hữu; cần tái diễn ở desktop/mobile và có keyboard semantics |
| Program selector/shelf | NEW composite/branch candidate | `FlexWrapButtonRadio` có thể reuse control, nhưng relationship program→papers cần owner riêng nếu Review chọn A/C |
| Result summary + wrong-answer path | EXTEND/NEW candidate | Grade data có thật; exact owner tree phải được Design Review kiểm kê call sites trước approval |

### STATE MATRIX

| Owner | States bắt buộc |
|---|---|
| Catalogue | loading geometry; ready one/many programs; no papers; query failed/retry; signed-out; Free 2 unlocked/34 locked; Pro all unlocked; mobile 390; desktop 1440 |
| Paper drawer | unlocked; locked Pro; signed-out requiring login; missing descriptions; close/focus return; pending navigation |
| Runner | loading; 404; 403; ready unanswered; partial answers; highlight RAG loading/empty/free/pro; submit pending; submit failed; submitted; keyboard question navigation; mobile/desktop |
| Result | pass/fail is not invented; score 0/max; unanswered questions; explanation empty/present; path to wrong questions; retake as secondary |

### DIRECTIONS

| Direction | Product decision | CTA model | Main tradeoff | Preliminary critique |
|---|---|---|---|---|
| A — Kho đề rõ ràng | Catalogue + filters lead; long-scroll runner preserves overview | Each paper earns `Mở đề`; result leads to wrong answers | Lowest migration risk, best for intentional search; 36 cards impose choice load | KEEP as conservative baseline; must not show fake progress per paper |
| B — Bắt đầu nhanh | First actually-unlocked Demo leads; library recedes; runner focuses one question | `Bắt đầu đề này`, then `Câu tiếp`; submit only at end | Clearest activation/mobile flow; intentional users reach catalogue later | KEEP; strongest default for current Free economics, provided label avoids “recommendation” claim |
| C — Theo chương trình | Program is first decision; passage workspace leads runner | `Mở chương trình THPTQG`; skill path leads result | Scales to Cambridge/IELTS; currently one live program makes the extra step weak | KEEP for explicit choice, but Review must reject fake roadmap cards from production until data exists |

### PREVIEW

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\thi-thu\r1`

Server PID: `18120`

Selected port: `8097` (ports `8080` through `8096` were occupied)

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `miamia-thi-thu-r1` | `http://127.0.0.1:8097/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\thi-thu\r1\index.html` | `2eedf5bb0b97362a2e5a7a70b6b8c702d4ee97c07a1536eb3cde20fb30499990` | đang chờ |

| Direction | Tab | Status |
|---|---|---|
| `A` | `A · Kho đề rõ ràng` | đang chờ |
| `B` | `B · Bắt đầu nhanh` | đang chờ |
| `C` | `C · Theo chương trình` | đang chờ |

Browser proof:

| Proof | Result |
|---|---|
| HTTP | `200` |
| Direction/state switching | `3 × 3 = 9` combinations rendered without URL change |
| Mobile | `390×844`, body `scrollWidth=clientWidth=375`, không overflow ngang |
| Desktop | `1440×900`, catalogue A rendered |
| Keyboard | ArrowLeft/ArrowRight implemented for both tablists; focus-visible present |
| Runtime | Trang render sau khi sửa một syntax error trong preview; reload cuối đã có đầy đủ nội dung |
| Workflow validator | Record `designs/miamia/thi-thu.md` không còn lỗi; full-root validator vẫn báo lỗi lịch sử ở `learn-branch.md` và `publish-expert-site-durable-owner.md`, ngoài boundary task này |

### OUTPUTS

| Concept | Result |
|---|---|
| Brief Thi thử | Chốt core loop `chọn đề → làm/nộp → xem lỗi sai → ôn lại`, không timer và không lộ answer key |
| Direction A | Catalogue và entitlement truth dẫn đầu; runner dạng cuộn |
| Direction B | Một Demo thật sự mở được dẫn đầu; runner từng câu, tối ưu activation/mobile |
| Direction C | Program dẫn đầu; runner ưu tiên passage workspace, tối ưu kho nhiều chương trình |
| Preview chọn hướng | Một URL duy nhất, ba direction tab và ba state tab, responsive |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md` | added — workflow Plan r1 bằng tiếng Việt, evidence, inventory, direction và approval boundary |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\thi-thu\r1\index.html` | added — một preview HTML disposable có 3 direction tabs × 3 state tabs |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn product direction để chuyển sang `starci-fe-design-review` | `B — Bắt đầu nhanh` (đề xuất: phù hợp nhất với live state Free chỉ mở 2/36 đề); `A — Kho đề rõ ràng`; `C — Theo chương trình` |
| Chốt phạm vi Review kế tiếp | Review cả `catalogue + runner + result` như một route family (đề xuất); hoặc tách catalogue và runner/result thành hai workflow liên kết |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend không tạo attempt mở trước submit và `gradePaper` đặt `startedAt=submittedAt` trong cùng mutation | Pause/resume, event tracking lúc đang làm và `continueLearning.paper` không thể hoạt động đúng chỉ bằng FE Apply |
| Chưa có mutation “Thêm vào ôn tập” cho highlight | Preview chỉ đánh dấu contract gap; production không được render CTA hoạt động giả |
| Chưa tìm thấy GraphQL weak-point report | Result C dùng fixture có nhãn; không được ship số phân tích giả |
| `examPrograms[thptqg].nameVi/descriptionVi` đang rỗng | Direction C cần content fix hoặc fallback được Review phê duyệt |
| Live data có 5 paper gắn `isDemo` nhưng chỉ 2 paper thực sự unlocked theo config | UI phải tin `isLocked`, không suy `isDemo` đồng nghĩa mở được |
| FE runtime hiện tại ở `localhost:3050/vi/exam` báo `Network error: Failed to fetch` dù GraphQL `3071` gọi trực tiếp thành công | Source screen hiện tại chưa cung cấp visual baseline sống; lỗi runtime phải được xử lý/prove trước Apply acceptance |
| Target FE chưa dùng contract registry/layer grammar của shared canon | Design Review phải khóa exact architecture theo source thật; không được invent full canon migration trong task Thi thử |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | Chưa có feedback chọn hoặc bác direction |

### OWED

| Owed | Cleared by |
|---|---|
| Chọn A, B hoặc C và chốt một hay hai workflow | Feedback của người dùng trên preview `http://127.0.0.1:8097/` |
| Ghi direction đã chọn, lý do, acceptance states và các direction bị từ chối | Append `plan r2` sau feedback |
| Khóa COMPONENT DELTA, PROPS DELTA và production boundary | `starci-fe-design-review` sau khi direction được chọn |
| Thiết kế durable open/save/resume attempt | Một `starci-be-feature-plan` riêng trước khi FE Review hứa pause/resume |
| Thiết kế add-to-review và weak-point query nếu vẫn thuộc scope | Backend feature Plan/Review riêng với exact mutation/query |

## plan r2

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\mia-mia` |
| Source | D:\Repositories\starci-academy-backend |
| Project | `MiaMia` |
| Frontend | `D:\Repositories\mia-mia` |
| Backend | `D:\Repositories\mia-mia-backend` |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | `miamia` |
| Repo / branch | `D:\Repositories\mia-mia @ main` |
| Purpose | Sửa phương án Thi thử theo feedback: dùng sidebar chung, định nghĩa ngôn ngữ UI/UX và scale kho tương lai 100+ đề Premium với CTA rõ giá trị. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md |
| Language | vi |
| Phase | plan |
| Touching | `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md`; `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\thi-thu\r2\index.html` |

### FEEDBACK ĐÃ KHÓA

| Feedback | Quyết định r2 |
|---|---|
| “Cái này làm sidebar luôn… sidebar để chọn game” | Bỏ top app nav trong mock; mọi state dùng sidebar chung có Học tập, Thi thử, Chơi cùng nhau, Xếp hạng và Cộng đồng |
| Cần design bộ UI/UX cho surface, card, button và loại giao diện này | Thêm tab `Bộ UI`, mô tả token role, surface hierarchy, pressable card, button priority, chip, field, navigation, feedback và restraint rules |
| Tương lai có 100 đề MiaMia Premium | Không render 100 card; dùng search/filter + dense rows hoặc bộ sưu tập, với pagination/virtualization khi triển khai |
| CTA phải hút view | Đề xuất CTA theo giá trị: làm đề Free thật trước; sau đó `Mở khóa 100 đề + phân tích điểm yếu`, không dùng một paywall chung chung |

### INVENTORY BỔ SUNG — SHELL VÀ PRIMITIVES

| Candidate | Verdict | Boundary |
|---|---|---|
| `DashboardLayout`, `DashboardSidebar`, `CollapsibleSidebar`, `getDashboardGroups` | REUSE | Source đã có shell/sidebar và nhóm navigation chứa game; không tạo sidebar song song |
| Route `/[locale]/exam` ngoài dashboard shell | EXTEND | Design Review phải chốt route ownership: dùng cùng shell hoặc canonical dashboard route; không nhân đôi trang |
| `SectionCard`, `PressableCard`, `SurfaceListCard` | REUSE/EXTEND | Reuse semantics; chỉ thêm variant khi source không biểu đạt surface r2 đã duyệt |
| Button atom và token hiện hữu | REUSE/EXTEND | Giữ một primary trên mỗi surface; Review mới được khóa variant/prop migration cụ thể |
| Input atom và Chip atom | REUSE | Search/filter/status dùng primitives hiện có, không tạo component đồng nghĩa |
| Danh mục có search/filter/pagination | NEW/EXTEND contract | Live `papers` trả mảng đầy đủ, chưa thấy paging/search/filter server-side; scale 100 cần Backend Plan nếu không thể lọc an toàn ở client |
| Curated collections | NEW contract nếu chọn C | Live contract mới có program/paper; collection và ownership chưa tồn tại |

### QUY TẮC SCALE 100+

| Rule | Rationale |
|---|---|
| Không mount 100 paper cards | Choice load lớn, DOM nặng và CTA bị loãng |
| Người có chủ đích dùng search + filter + dense rows | Tỉnh, năm, cấu trúc và trạng thái là đường tìm ngắn nhất |
| Người mới thấy 1 đề Free trước | Cho trải nghiệm thật trước khi yêu cầu nâng cấp |
| Premium CTA nói cả inventory lẫn outcome | `100 đề + phân tích điểm yếu`, không chỉ `Nâng cấp Pro` |
| User đã là Pro bỏ qua upsell hero | Ưu tiên `Tiếp tục đề đang làm`, search và thư viện |
| Production dùng pagination hoặc virtualization | Giữ geometry ổn định khi kho vượt 100 đề |

### DIRECTIONS R2

| Direction | Cách render kho 100+ | CTA chính | Đánh đổi | Đề xuất |
|---|---|---|---|---|
| A — Tìm đúng đề | Search, filter sidebar và dense rows | Mở đúng đề trong row; Premium banner sau kết quả | Nhanh cho power user, cần contract filter/paging | Giữ làm phương án tra cứu mạnh |
| B — Free → Premium | Một đề Free thật dẫn đầu, Premium value banner và thư viện preview | `Làm đề miễn phí` trước; `Mở khóa 100 đề + phân tích điểm yếu` sau | Funnel rõ nhất; cần biến thể bỏ upsell cho user Pro | **Đề xuất chọn** |
| C — Theo bộ sưu tập | Nhóm Free, 2026, tỉnh/thành và điểm yếu | Mở collection phù hợp | Dễ hiểu ở quy mô lớn nhưng cần curated metadata chưa có | Chỉ chọn nếu chấp nhận Backend Plan collection |

### UI/UX LANGUAGE — STICKER STUDY UI

| Element | Rule r2 |
|---|---|
| Canvas | Warm neutral để giữ nhịp đọc; không bọc toàn trang trong card |
| Independent surface | Ink border 2px, radius 20–24px, hard shadow 3–4px |
| Nested surface | Nền tint, viền mảnh, không shadow; tuyệt đối không card lồng card |
| Pressable card | Cả vùng có semantics; hover nhấc nhẹ, press trượt vào shadow |
| Primary button | Pink/action; tối đa một primary trên một surface |
| Premium action | Yellow hoặc pink tùy hierarchy; luôn có text `Premium`, không dựa vào màu |
| Chips | Chỉ cho trạng thái/metadata: Free, Premium, active, số câu, level |
| Fields | Trắng trên canvas; secondary ground khi nằm trong surface, không tạo card mới |
| Feedback | Band/ground trong flow; modal chỉ khi cần chặn hoặc xác nhận |
| Navigation | Desktop sidebar 16rem có thể thu 4rem; mobile giữ icon rail 4rem |
| Icons | Một family/stroke/size; preview dùng ký hiệu thay thế, production không dùng emoji |

### PREVIEW R2

Preview r1 đã được thay thế bởi r2 sau feedback; r1 vẫn được giữ làm bằng chứng lịch sử.

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\thi-thu\r2`

Server PID: `10040`

Selected port: `8097`

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `miamia-thi-thu-r2` | `http://127.0.0.1:8097/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\thi-thu\r2\index.html` | `b1d9540affddfcbd955fa105e99c0b6236bbb9bee726a95560d3f971066ebec5` | đang chờ |

| Direction | Tab | Status |
|---|---|---|
| `A` | `A · Tìm đúng đề` | đang chờ |
| `B` | `B · Free → Premium` | đang chờ |
| `C` | `C · Theo bộ sưu tập` | đang chờ |

Browser proof:

| Proof | Result |
|---|---|
| Direction/state switching | `3 × 4 = 12` tổ hợp render trên cùng một URL |
| Sidebar | Có ở cả 12 tổ hợp; chứa `Chơi cùng nhau` và các nhóm navigation chung |
| Desktop | `1440×900`; viewport thực `1425`, `scrollWidth=1425`; sidebar `238px`; CTA `Mở khóa 100 đề` hiển thị |
| Mobile | `390×844`; viewport thực `375`, `scrollWidth=375`; không overflow ngang; sidebar thu thành rail `64px` |
| UI kit | Render đủ 3 surface samples, 6 button states và các rule còn lại trên mobile |
| Runtime | Không có console warning/error sau khi kiểm tra toàn bộ matrix |

### OUTPUTS

| Concept | Result |
|---|---|
| Catalogue 100+ | Ba mô hình có thể triển khai: tìm kiếm dày, Free-to-Premium và bộ sưu tập |
| CTA model | Trải nghiệm Free dẫn đầu; Premium bán `100 đề + phân tích điểm yếu` sau khi giá trị đã rõ |
| App shell | Sidebar chung giữ đường sang game và các khu vực học tập/cộng đồng |
| UI language | `Sticker Study UI` có hierarchy cho surface, card, button, chip, field, feedback và navigation |
| Preview | Một HTML, một URL, ba direction tabs và bốn state tabs |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md` | modified — append Plan r2 bằng tiếng Việt, feedback, scale decision, UI kit, preview proof và approval boundary |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\thi-thu\r2\index.html` | added — disposable tabbed preview 3 directions × 4 states, có sidebar, catalogue 100+ và UI kit |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn direction để chuyển sang `starci-fe-design-review` | `B — Free → Premium` (đề xuất); `A — Tìm đúng đề`; `C — Theo bộ sưu tập` |
| Chốt visual language | Duyệt `Sticker Study UI` như preview; hoặc nêu component/token cần sửa |
| Chốt responsive sidebar | Desktop 16rem/collapse 4rem + mobile icon rail 4rem (đề xuất hiện tại); hoặc mobile drawer |

### WARNINGS

| Warning | Impact |
|---|---|
| Live backend hiện có 36 paper; con số 100+ là giả định scale do người dùng cung cấp | Preview dùng fixture để chốt hierarchy; không được báo đây là live inventory |
| Query `papers` hiện chưa có paging/search/filter server-side được chứng minh | Chọn A hoặc scale B đầy đủ có thể cần Backend Feature Plan trước Apply |
| Curated collection chưa có owner/contract | Chọn C bắt buộc chốt rule derive hoặc làm Backend Feature Plan |
| Start/save/resume, add-to-review và weak-point query vẫn là contract gaps từ r1 | FE Apply không được render hành vi giả; phải route sang Backend Plan/Review |
| Route exam hiện không dùng cùng dashboard shell trong source được khảo sát | Review phải khóa một route owner trước khi sửa source |
| Target FE đang có thay đổi không liên quan | Mọi bước sau phải preserve; Apply chỉ commit baseline sau Review approval đúng quy trình |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| App top navbar của preview r1 | Sidebar chung có đường sang game | “Cái này làm sidebar luôn… sidebar để chọn game” |
| Grid card kiểu kho 36 đề nếu mở rộng nguyên trạng | Search/filter dense list, Free-first hoặc curated collection | Người dùng xác định tương lai có 100 đề Premium; wall of cards không scale và làm loãng CTA |
| CTA Premium chung chung | `Mở khóa 100 đề + phân tích điểm yếu` | CTA phải nói rõ inventory và outcome để hút view mà không đánh lừa |

### OWED

| Owed | Cleared by |
|---|---|
| Chọn A/B/C, chốt `Sticker Study UI` và responsive sidebar | Feedback của người dùng trên preview r2 |
| Khóa exact page/layout/overlay/block/composite/branch/leaf tree và mọi public-prop migration | `starci-fe-design-review` sau khi direction được chọn |
| Khóa route ownership để exam dùng sidebar chung mà không nhân đôi source | `starci-fe-design-review` |
| Thiết kế paging/search/filter hoặc collection contract nếu direction cần | `starci-be-feature-plan` và `starci-be-feature-review` riêng |

## plan r3

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-backend` |
| Source | D:\Repositories\starci-academy-backend |
| Project | `MiaMia` |
| Frontend | `D:\Repositories\miamia-fe` |
| Backend | `D:\Repositories\mia-mia-backend` |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | `miamia` |
| Repo / branch | `D:\Repositories\miamia-fe @ chưa tạo`; reference `D:\Repositories\starci-academy-fe @ main`, HEAD `6a3b07295a1b6ef2eb7b080b39cde034c5ea1be1` |
| Purpose | Khóa repo frontend MiaMia riêng và ranh giới tái sử dụng StarCi FE trước khi chọn direction và vào Review. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md |
| Language | vi |
| Phase | plan |
| Touching | `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md` |

### SOURCE ARCHITECTURE DECISION

| Concern | Decision |
|---|---|
| Target | Tạo repository mới `D:\Repositories\miamia-fe`; `D:\Repositories\mia-mia` trở thành legacy/domain reference, không còn là production target của task này |
| Pattern authority | Dùng kiến trúc đang được commit tại `starci-academy-fe` HEAD `6a3b07295a1b6ef2eb7b080b39cde034c5ea1be1` |
| Dirty reference worktree | Không copy 22 modified files và các untracked artifact/test đang dở trong `starci-academy-fe` |
| Shared vocabulary baseline | Materialize nguyên committed `contracts`, `leaves`, `composites`, `branches`, `shells` của StarCi FE: 95 tracked files (`2 + 54 + 30 + 5 + 4`) rồi commit làm baseline trước thay đổi MiaMia |
| Visual difference | Chỉ `src/app/globals.css` được đổi theme values và vendor-wide theme overrides cho MiaMia; component không nhận `className`, style slot hoặc per-call-site palette |
| Structural difference | Page/layout/block/overlay MiaMia phải dùng `Tree`, contract keys, typed leaves/branches/shells của StarCi FE; contract registry được phép thêm node mới khi shape mới thật sự không có owner |
| Domain difference | Query, hook, messages, route, page, block và overlay MiaMia là source riêng; “chỉ override global.css” không có nghĩa giả vờ nghiệp vụ Thi thử chỉ là CSS |
| Responsive navigation | Ưu tiên pattern StarCi: desktop spine/sidebar, mobile bottom navigation; không tự tạo icon rail CSS song song trước Review |

### REUSE BOUNDARY

| Layer | REUSE from StarCi FE | MiaMia ownership |
|---|---|---|
| Contract engine | `src/components/contracts/props.ts`, `Tree` và closed unions | Chỉ thêm exact contract entries cho shape Thi thử chưa tồn tại |
| Leaves | `Button`, `Badge`, `Text`, `Heading`, `SearchBox`, `Pagination`, `ChoiceTabs`, `NavLink`, `Icon` | Không fork thành `MiaButton`, `MiaCard`, `PremiumButton` |
| Branches | `SurfaceCard`, `SurfaceListCard`, `PressableSurface`, `Tree` | Block MiaMia chọn semantic variant và contract; không viết surface tay |
| Shells | `RouteShell`, `DrawerShell`, `ModalShell`, `DropdownShell` | Layout/overlay MiaMia chỉ cung cấp domain và outcome |
| Navigation shape | `learn-shell-frame`, `learn-spine-column`, `learn-nav-group`, `learn-nav-row`, `learn-mobile-tab-bar` nếu slot types đủ | `MiaMiaAppLayout` và `MiaMiaNavigation` giải quyết route/copy/active state |
| Theme | StarCi token names và HeroUI variable family | MiaMia đổi value trong `src/app/globals.css`, không đổi token names ở component |

### APPLY BASELINE MODEL

Target chưa tồn tại, vì vậy Apply phải materialize scaffold sạch từ đúng commit đã duyệt rồi commit ngay trước thay đổi MiaMia:

```text
StarCi FE committed scaffold @ approved SHA
  -> D:\Repositories\miamia-fe
  -> git init / initial baseline commit
  -> Baseline commit: <sha>
  -> chỉ sau đó mới đổi package identity, global.css và thêm domain source
  -> git diff <baseline> là toàn bộ MiaMia implementation
```

Scaffold baseline không lấy file từ dirty worktree và không giữ local origin trỏ về StarCi FE.

### PREVIEW TRACKING

Không tạo HTML r3: preview r2 vẫn là bằng chứng product direction trên một URL; r3 chỉ thay production repository và implementation grammar.

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `miamia-thi-thu-r2` | `http://127.0.0.1:8097/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\thi-thu\r2\index.html` | `b1d9540affddfcbd955fa105e99c0b6236bbb9bee726a95560d3f971066ebec5` | đang chờ |

| Direction | Tab | Status |
|---|---|---|
| `A` | `A · Tìm đúng đề` | đang chờ |
| `B` | `B · Free → Premium` | đang chờ — đề xuất |
| `C` | `C · Theo bộ sưu tập` | đang chờ |

### OUTPUTS

| Concept | Result |
|---|---|
| Frontend boundary | MiaMia có repository `miamia-fe` riêng; source cũ chỉ còn là legacy/domain reference |
| Pattern inheritance | Vocab và component grammar lấy từ committed StarCi FE, không copy dirty worktree và không dựng UI library song song |
| Theme boundary | Khác biệt thị giác của MiaMia chỉ được sở hữu ở `global.css`; component tiếp tục nói bằng semantic tokens |
| Product direction | Preview r2 vẫn chờ chọn; B tiếp tục là hướng đề xuất cho kho 100+ Premium |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md` | modified — append Plan r3 bằng tiếng Việt, khóa repo mới, StarCi scaffold boundary và CSS-only theme rule |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn product direction để Review đóng cây component | `B — Free → Premium` (đề xuất); `A — Tìm đúng đề`; `C — Theo bộ sưu tập` |
| Chọn source snapshot cho scaffold | Dùng clean committed HEAD `6a3b07295a1b6ef2eb7b080b39cde034c5ea1be1` (đề xuất); hoặc chờ một commit StarCi FE mới chứa worktree hiện tại |
| Chốt phạm vi Apply đầu tiên | Tạo foundation + Thi thử trước, sidebar chỉ bật route đã có (đề xuất); hoặc mở thêm workflow migration Game trước khi bật mục `Chơi cùng nhau` |

### WARNINGS

| Warning | Impact |
|---|---|
| `starci-academy-fe` đang dirty: 22 tracked files modified và nhiều untracked artifacts/tests | Copy worktree sẽ trộn feature Course đang dở vào baseline MiaMia và làm mất ý nghĩa diff |
| `miamia-fe` chưa tồn tại | Apply phải tạo scaffold và baseline commit trước MiaMia source; không thể có baseline commit trước khi scaffold được materialize |
| “Chỉ override global.css” không thể bao gồm domain behavior | Routes, GraphQL, blocks, pages và overlays vẫn phải được thêm; rule chỉ cấm fork visual primitives/patterns |
| Game chưa có Plan/Review theo StarCi grammar trong repo mới | Không được bật link Game dẫn tới route rỗng hoặc copy nguyên legacy component có class/layout riêng |
| Membership checkout chưa được khóa trong workflow Thi thử | CTA Premium phải có outcome thật trước Apply; không được ship nút không hành động |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Copy toàn bộ dirty worktree `starci-academy-fe` sang repo mới | Materialize đúng committed SHA đã duyệt | Dirty changes thuộc Course và contract work đang dở, không phải baseline MiaMia |
| Fork `MiaButton`, `MiaCard`, `MiaSidebar` để đạt Sticker UI | Reuse StarCi leaves/branches/shells; đổi semantic token values trong `global.css` | Thầy yêu cầu MiaMia vẫn dùng patterns của StarCi FE |
| Coi toàn bộ migration MiaMia là một thay đổi CSS | Theme khác ở CSS; domain source vẫn có owner riêng | Thi thử có GraphQL, entitlement, route states và outcomes không thể được CSS tạo ra |

### OWED

| Owed | Cleared by |
|---|---|
| Chọn A/B/C, scaffold SHA và scope Apply đầu tiên | Một feedback approval của người dùng |
| Khóa exact COMPONENT DELTA và PROPS DELTA của repo mới | `starci-fe-design-review` sau approval Plan r3 |
| Khóa outcome thật của CTA Premium | Review Thi thử hoặc Backend Plan/Review cho membership checkout |
| Tạo repo, baseline commit, implementation và tracked diff | `starci-fe-design-apply` sau explicit Review approval |

## plan r4

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | MiaMia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | Target chưa tạo; nguồn scaffold `D:\Repositories\starci-academy-fe @ main`, HEAD `6a3b07295a1b6ef2eb7b080b39cde034c5ea1be1`, có thay đổi chưa commit |
| Purpose | Ghi nhận lựa chọn lấy worktree StarCi FE đang dở làm scaffold và đổi sidebar desktop thành footbar mobile. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md |
| Language | vi |
| Phase | plan |
| Touching | `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md`; `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\thi-thu\r2\index.html` |

### FEEDBACK ĐÃ CHỐT

| Decision | Kết quả |
|---|---|
| Nguồn scaffold | Lấy working tree hiện tại của `starci-academy-fe`, bao gồm thay đổi tracked và file source/test untracked; thay thế quyết định chỉ lấy clean HEAD ở Plan r3 |
| Ranh giới sao chép | Không sao chép `.git`, dependency/build cache, file ignored hoặc `.artifacts`; các file này không phải architecture/pattern production |
| Responsive navigation | Cùng một navigation model: sidebar ở desktop và footbar năm mục ở mobile; không tạo icon rail hoặc navigation component song song |
| Theme MiaMia | Vẫn chỉ override semantic token/theme values trong `src/app/globals.css`; không fork visual primitives của StarCi FE |

### WORKTREE SNAPSHOT IDENTITY

Đây là định danh để phát hiện worktree nguồn bị đổi trước Apply; nó không tạo commit và không đóng băng repository nguồn.

| Evidence | Value |
|---|---|
| HEAD | `6a3b07295a1b6ef2eb7b080b39cde034c5ea1be1` |
| Tracked changed paths | `37` |
| Tracked binary patch Git hash | `ba05937be04466647f9393ce11fe977802f5430d` |
| Untracked source/test paths | `10` |
| Untracked source manifest Git hash | `61dcff449371f341f3104bb6fe39f29680e2f2df` |
| Untracked `.artifacts` bị loại khỏi scaffold | `31` |

Apply chỉ được materialize snapshot nếu bốn định danh HEAD/count/hash còn khớp. Nếu worktree tiếp tục thay đổi, phải ghi snapshot identity mới vào workflow trước khi tạo baseline `miamia-fe`.

### RESPONSIVE NAVIGATION CONTRACT

| Viewport | Owner | Shape |
|---|---|---|
| Desktop | App layout dùng StarCi shell/navigation patterns | Sidebar `238px` trong preview; có group label, item label, active state và account footer |
| Mobile `<= 680px` | Cùng app layout và cùng navigation items | Footbar cố định đáy, một hàng năm mục: Trang chủ, Thi thử, Học & ôn tập, Chơi cùng nhau, Xếp hạng |
| Hidden on mobile | Responsive disclosure của cùng owner | Group label, collapse control, community sub-items và account footer không chiếm footbar; không dựng sidebar thứ hai |

### PREVIEW R2 — RESPONSIVE UPDATE

Giữ đúng một URL và một HTML. File r2 được cập nhật theo feedback mới; SHA cũ được giữ trong Plan r2/r3 như bằng chứng lịch sử.

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `miamia-thi-thu-r2-responsive` | `http://127.0.0.1:8097/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\thi-thu\r2\index.html` | `682b7b226679d2514c851d9e5e23b60aafc276fbd0bfd06acca271f590d19972` | đang chờ chọn direction |

| Direction | Tab | Status |
|---|---|---|
| `A` | `A · Tìm đúng đề` | đang chờ |
| `B` | `B · Free → Premium` | đang chờ — đề xuất |
| `C` | `C · Theo bộ sưu tập` | đang chờ |

| Proof | Result |
|---|---|
| Mobile | Viewport `390×844`, document `scrollWidth=375`, không overflow ngang; footbar `position: fixed`, cao `88px`, đúng `5` mục trên một hàng |
| Desktop | Viewport `1440×900`, document `scrollWidth=1425`; sidebar vẫn `238px`, `display:flex`, `position:static` |

### OUTPUTS

| Concept | Result |
|---|---|
| Scaffold authority | Repo MiaMia mới sẽ bắt đầu từ pattern StarCi FE đang phát triển trong worktree hiện tại, không còn giới hạn ở clean HEAD |
| Responsive shell | Một navigation model đổi hình từ sidebar desktop sang footbar mobile |
| Theme boundary | MiaMia chỉ đổi theme toàn cục; component vocabulary và semantic patterns tiếp tục thuộc StarCi FE |
| Product direction | A/B/C vẫn chưa được chọn; B tiếp tục là hướng đề xuất |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md` | modified — append Plan r4, worktree identity, responsive contract, proof và approval còn lại |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\thi-thu\r2\index.html` | modified — mobile sidebar rail chuyển thành footbar cố định năm mục; desktop sidebar giữ nguyên |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn product direction để chuyển sang `starci-fe-design-review` | `B — Free → Premium` (đề xuất); `A — Tìm đúng đề`; `C — Theo bộ sưu tập` |
| Chốt visual language | Duyệt `Sticker Study UI` đang render, triển khai bằng semantic tokens trong `globals.css` (đề xuất); hoặc nêu token/component cần sửa |
| Chốt scope Apply đầu tiên | Foundation + Thi thử, hiển thị Game trong footbar nhưng disabled/coming soon cho tới workflow Game riêng (đề xuất); hoặc mở workflow Game trước và chỉ bật link khi route thật đã được apply |

### WARNINGS

| Warning | Impact |
|---|---|
| Worktree StarCi FE là nguồn đang chuyển động và số tracked path đã thay đổi trong lúc khảo sát | Hash phải được kiểm tra lại ngay trước Review/Apply; không được tự nhận một trạng thái mới là trạng thái thầy vừa duyệt |
| Baseline mới sẽ chứa cả phần Course đang dở của StarCi FE | Repo MiaMia nhận toàn bộ trạng thái đó làm lịch sử ban đầu; diff MiaMia chỉ bắt đầu sau baseline commit trong repo mới |
| Footbar chỉ có năm vị trí ưu tiên | Bạn bè, Trò chuyện và Hồ sơ cần surface phụ hoặc màn tài khoản; không nhét thêm khiến footbar xuống hai hàng |
| Preview vẫn dùng ký hiệu thay icon production | Apply phải reuse `Icon` leaf/family của StarCi FE, không sao chép ký hiệu placeholder |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Clean committed HEAD làm nguồn scaffold | Lấy worktree StarCi FE đang dở, có định danh diff và manifest | “lấy worktree đang dở” |
| Mobile icon rail 4rem | Sidebar desktop chuyển thành footbar năm mục trên mobile | “mobile thì sidebar => footbar” |

### OWED

| Owed | Cleared by |
|---|---|
| Chọn A/B/C, visual language và scope Game trong phase đầu | Một feedback approval của người dùng |
| Khóa exact COMPONENT DELTA và PROPS DELTA, gồm shell/sidebar/footbar owner | `starci-fe-design-review` sau approval Plan r4 |
| Tạo `miamia-fe`, materialize worktree, commit baseline trước rồi mới sửa source | `starci-fe-design-apply` sau explicit Review approval |
| Kiểm tra runtime, login account test, flow, terminal/network và ghi kết quả | Acceptance evidence của Apply |

## plan r5

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | MiaMia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | Target chưa tạo; scaffold từ D:\Repositories\starci-academy-fe @ main và worktree hiện tại |
| Purpose | Đóng Plan bằng lựa chọn C và chuyển brief đã chọn sang Design Review. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md |

Selected direction: `C — Theo bộ sưu tập`

Selected preview SHA-256: `682b7b226679d2514c851d9e5e23b60aafc276fbd0bfd06acca271f590d19972`

Lý do được ghi nhận đúng theo feedback: người dùng chọn trực tiếp “ok theo C đi”; không suy diễn thêm lý do chưa được phát biểu.

### ACCEPTANCE STATES CHUYỂN SANG REVIEW

| State | Selected C meaning |
|---|---|
| Danh mục | Kho đề được đọc theo các bộ sưu tập có nghĩa thay vì wall 100 card; Free và Premium vẫn thể hiện entitlement thật |
| Đang làm | Passage và câu hỏi đi cạnh nhau ở desktop, xếp dọc trên mobile; không có countdown giả |
| Kết quả | Điểm số dẫn sang bức tranh kỹ năng; phần trăm kỹ năng chỉ được triển khai khi backend có contract thật |
| Bộ UI | Sticker Study UI chỉ đi qua semantic tokens trong `globals.css`; component dùng StarCi FE patterns |
| Navigation | Sidebar desktop chuyển thành footbar năm mục trên mobile |

### PREVIEW TRACKING

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `miamia-thi-thu-r2-responsive` | `http://127.0.0.1:8097/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\thi-thu\r2\index.html` | `682b7b226679d2514c851d9e5e23b60aafc276fbd0bfd06acca271f590d19972` | đã chốt |

| Direction | Tab | Status |
|---|---|---|
| `A` | `A · Tìm đúng đề` | đã từ chối |
| `B` | `B · Free → Premium` | đã từ chối |
| `C` | `C · Theo bộ sưu tập` | đã chọn |

### OUTPUTS

| Concept | Result |
|---|---|
| Product direction | Chọn C — Theo bộ sưu tập cho kho đề MiaMia 100+ |
| Review handoff | Review phải chứng minh collection owner/contract, entitlement, skill result và responsive shell trước khi Apply |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md` | modified — append lựa chọn C, acceptance states và trạng thái ba direction |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Direction đã được chọn; các quyết định production còn lại chuyển sang Design Review |

### WARNINGS

| Warning | Impact |
|---|---|
| Collection và weak-point report chưa được chứng minh có live GraphQL contract | Review phải loại fixture khỏi production boundary hoặc route backend capability riêng |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `A — Tìm đúng đề` | `C — Theo bộ sưu tập` | “ok theo C đi” |
| `B — Free → Premium` | `C — Theo bộ sưu tập` | “ok theo C đi” |

### OWED

| Owed | Cleared by |
|---|---|
| Khóa exact COMPONENT DELTA, PROPS DELTA, supporting boundary và acceptance commands | `starci-fe-design-review` |
| Chốt cách triển khai collection khi backend chưa có collection owner | Review r1 và explicit approval của người dùng |

## review r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | MiaMia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | Target chưa tạo; scaffold từ D:\Repositories\starci-academy-fe @ main, HEAD 1bc591b73b0ad0fce8114d9d7f1c19e52bca6e9b và worktree hiện tại |
| Purpose | Review hướng C và khóa cây source, public API, contract, trạng thái cùng bằng chứng Apply cho Thi thử MiaMia. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md |
| Language | vi |
| Phase | review |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md |

Đề xuất revision: `C-contract-safe-r1`. Chưa phải revision được duyệt; Review chỉ được ghi dòng phê duyệt chuẩn sau phản hồi duyệt rõ ràng của người dùng.

### PHẢN BIỆN HƯỚNG C

| Preview C | Contract thật | Quyết định Review r1 |
|---|---|---|
| Các kệ `2026`, `Theo tỉnh/thành`, `Luyện điểm yếu` | Backend không có metadata sở hữu ba collection này | Không ship fixture; thay bằng `Free` và từng program thật từ `examPrograms` |
| Bức tranh kỹ năng | `paperDetail.questions[].skill` và `gradePaper.answers[].questionId/isCorrect` có thật | Chỉ tính kết quả kỹ năng của bài vừa nộp; không gọi đây là lịch sử điểm yếu |
| CTA `Ôn [kỹ năng]` | Chưa có route hoặc mutation ôn theo kỹ năng | Bỏ; dùng `Xem từng câu` và `Về kho đề` có outcome thật |
| Nút Premium | `purchaseMembership` có thật và yêu cầu đăng nhập | Mở sign-in khi cần, sau đó mở checkout PayOS thật; không ship nút không hành động |
| `Lưu & thoát` và tạm dừng | Chưa có attempt mở/save/resume contract | Không render; `Thoát bài` dùng xác nhận và nói rõ tiến độ chưa nộp sẽ mất |
| Countdown | Product đã chốt không đếm giờ | Không render và không auto-submit dù paper có `durationMinutes` |
| Sidebar/Game | Chỉ route Thi thử thuộc scope hiện tại | Vẫn hiện 5 mục; mục chưa có route mở thông báo `Sắp ra mắt`, không no-op và không 404 |

### SNAPSHOT SCAFFOLD ĐƯỢC REVIEW

| Evidence | Value |
|---|---|
| HEAD | `1bc591b73b0ad0fce8114d9d7f1c19e52bca6e9b` |
| Tracked changed paths | `16` |
| Tracked binary patch Git hash | `ba4bc049e1f65804febfb8f2a38e72d844ffb9bd` |
| Untracked source/test paths | `1` |
| Untracked content manifest Git hash | `78c1942fb1469cc75df3760128ba4eedc7bc2a26` |
| Untracked source/test file | `src/modules/api/graphql/queries/query-course.test.ts` |

Apply phải kiểm tra lại đủ năm giá trị trên. Nếu lệch, append snapshot mới và dừng để người dùng xác nhận trước khi materialize. Không sao chép `.git`, `.artifacts`, dependency/build cache, file ignored hay credential từ `.env.local`.

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | MiaMia app segment layout | ADD | — | D:\Repositories\miamia-fe\src\app\[lang]\(app)\layout.tsx | Next segment `[lang]/(app)` | RouteShell | Biến framework children thành surface component và giữ app shell qua route change |
| route | Exam catalogue route | ADD | — | D:\Repositories\miamia-fe\src\app\[lang]\(app)\exam\page.tsx | URL `/[lang]/exam` | ExamCatalogPage | Route chỉ mount page |
| route | Exam session route | ADD | — | D:\Repositories\miamia-fe\src\app\[lang]\(app)\exam\[slug]\page.tsx | URL `/[lang]/exam/[slug]` | ExamSessionPage | Route chỉ chuyển slug đã resolve vào page |
| layout | MiaMiaAppLayout / `_MiaMiaAppLayout` | ADD | — | D:\Repositories\miamia-fe\src\components\layouts\MiaMiaAppLayout\index.tsx; D:\Repositories\miamia-fe\src\components\layouts\MiaMiaAppLayout\component.tsx | App segment layout; ComingSoonOverlay | learn-shell-frame | Một app navigation model: sidebar desktop và footbar mobile tại breakpoint `md` của StarCi |
| overlay | SignInOverlay / `_SignInOverlay` | REUSE | Scaffold: D:\Repositories\starci-academy-fe\src\components\overlays\auth\SignInOverlay | D:\Repositories\miamia-fe\src\components\overlays\auth\SignInOverlay | ExamCatalogPage; ExamSessionPage | ModalShell | Auth đã có owner và session-token seam thật |
| overlay | ComingSoonOverlay / `_ComingSoonOverlay` | ADD | — | D:\Repositories\miamia-fe\src\components\overlays\app\ComingSoonOverlay\index.tsx; D:\Repositories\miamia-fe\src\components\overlays\app\ComingSoonOverlay\component.tsx | MiaMiaAppLayout | ModalShell + coming-soon-panel | Mục nav tương lai có outcome rõ, không no-op/404 |
| overlay | MembershipCheckoutOverlay / `_MembershipCheckoutOverlay` | ADD | — | D:\Repositories\miamia-fe\src\components\overlays\membership\MembershipCheckoutOverlay\index.tsx; D:\Repositories\miamia-fe\src\components\overlays\membership\MembershipCheckoutOverlay\component.tsx | ExamCatalogPage | ModalShell + MembershipCheckoutPanel | CTA Premium kết thúc ở mutation checkout thật |
| page | ExamCatalogPage / `_ExamCatalogPage` | ADD | — | D:\Repositories\miamia-fe\src\components\pages\ExamCatalogPage\index.tsx; D:\Repositories\miamia-fe\src\components\pages\ExamCatalogPage\component.tsx | Exam catalogue route; SignInOverlay; MembershipCheckoutOverlay | exam-catalog-page | Sở hữu screen state và chuỗi deferred intent `locked → sign-in → checkout` |
| page | ExamSessionPage / `_ExamSessionPage` | ADD | — | D:\Repositories\miamia-fe\src\components\pages\ExamSessionPage\index.tsx; D:\Repositories\miamia-fe\src\components\pages\ExamSessionPage\component.tsx | Exam session route; SignInOverlay; ExamSession | exam-session-page | Khóa auth gate và route slug ngoài block làm bài |
| block | ExamCatalog / `_ExamCatalog` | ADD | — | D:\Repositories\miamia-fe\src\components\blocks\exam\ExamCatalog\index.tsx; D:\Repositories\miamia-fe\src\components\blocks\exam\ExamCatalog\component.tsx | ExamCatalogPage | exam-catalog-page children | Sở hữu `examPrograms + papers`, collection, search và paging client-side |
| block | ExamSession / `_ExamSession` | ADD | — | D:\Repositories\miamia-fe\src\components\blocks\exam\ExamSession\index.tsx; D:\Repositories\miamia-fe\src\components\blocks\exam\ExamSession\component.tsx | ExamSessionPage | exam-session-page children | Sở hữu paper detail, answer state, grade mutation và kết quả bài hiện tại |
| block | MembershipCheckoutPanel / `_MembershipCheckoutPanel` | ADD | — | D:\Repositories\miamia-fe\src\components\blocks\membership\MembershipCheckoutPanel\index.tsx; D:\Repositories\miamia-fe\src\components\blocks\membership\MembershipCheckoutPanel\component.tsx | MembershipCheckoutOverlay | membership-checkout-panel | Sở hữu mutation PayOS, pending/error và chuyển sang checkout URL |
| block | LearnSpine projection | REUSE | Scaffold: D:\Repositories\starci-academy-fe\src\components\blocks\learn\LearnSpine\component.tsx | D:\Repositories\miamia-fe\src\components\blocks\learn\LearnSpine\component.tsx | `_MiaMiaAppLayout` | learn-spine-column; learn-nav-group; learn-nav-row | Tái sử dụng đúng StarCi sidebar pattern thay vì fork MiaSidebar |
| composite | ExamPaperCard | ADD | — | D:\Repositories\miamia-fe\src\components\composites\ExamPaperCard\index.tsx | `_ExamCatalog` | exam-paper-card | Một paper offer lặp lại cần API đóng và entitlement truth |
| composite | EmptyNotice | REUSE | Scaffold: D:\Repositories\starci-academy-fe\src\components\composites\EmptyNotice\index.tsx | D:\Repositories\miamia-fe\src\components\composites\EmptyNotice\index.tsx | Catalog/session/overlay failure and empty states | empty-notice | Không tạo empty/error component thứ hai |
| composite | LabelledProgressRow | REUSE | Scaffold: D:\Repositories\starci-academy-fe\src\components\composites\LabelledProgressRow\index.tsx | D:\Repositories\miamia-fe\src\components\composites\LabelledProgressRow\index.tsx | Kết quả kỹ năng bài vừa nộp | labelled-progress-row | Đã có đúng label + phần trăm + progress relationship |
| branch | Tree | REUSE | Scaffold: D:\Repositories\starci-academy-fe\src\components\branches\Tree | D:\Repositories\miamia-fe\src\components\branches\Tree | Mọi pure page/layout/block mới | Contract registry | Giữ executable component grammar |
| branch | SurfaceCard; SurfaceListCard; PressableSurface | REUSE | Scaffold: D:\Repositories\starci-academy-fe\src\components\branches | D:\Repositories\miamia-fe\src\components\branches | Paper cards, result, premium and navigation surfaces | Exact contract key từ parent | Không fork card/surface theo visual MiaMia |
| leaf | SingleChoice | ADD | — | D:\Repositories\miamia-fe\src\components\leaves\SingleChoice\index.tsx | `_ExamSession` | single-choice leaf wrapping HeroUI RadioGroup/Radio | StarCi scaffold chưa có primitive chọn một đáp án |
| leaf | Button; Badge; Heading; Text; SearchBox; Pagination; NavLink; Progress; Article; ConfirmButton | REUSE | Scaffold: D:\Repositories\starci-academy-fe\src\components\leaves | D:\Repositories\miamia-fe\src\components\leaves | Pure owners nêu trên | Existing leaf contracts | Giữ public vocabulary và keyboard/vendor semantics sẵn có |
| shell | RouteShell | REUSE | Scaffold: D:\Repositories\starci-academy-fe\src\components\shells\RouteShell\index.tsx | D:\Repositories\miamia-fe\src\components\shells\RouteShell\index.tsx | App segment layout | surface: ComponentType | Next children không chảy xuống layout dưới dạng ReactNode |
| shell | ModalShell | REUSE | Scaffold: D:\Repositories\starci-academy-fe\src\components\shells\ModalShell\index.tsx | D:\Repositories\miamia-fe\src\components\shells\ModalShell\index.tsx | Ba overlay | Vendor modal mechanics | Focus trap, Escape, backdrop và scroll lock có một owner |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| MiaMia app segment layout | Next layout props | ADD | — | `{ children: ReactNode }`; mount `RouteShell` với `frame=MiaMiaAppLayout`, `props={}` | Next `[lang]/(app)` | Typecheck và route render không truyền node xuống layout |
| Exam catalogue route | Route API | ADD | — | Không public prop; return `<ExamCatalogPage />` | Next `/[lang]/exam` | Route test chứng minh chỉ mount page |
| Exam session route | Route API | ADD | — | `{ params: Promise<{ lang: string; slug: string }> }`; await và truyền đúng `slug` | Next `/[lang]/exam/[slug]` | Route test với slug fixture |
| MiaMiaAppLayout twin | Connected/pure API | ADD | — | Connected `{ surface: ComponentType }`; pure `{ props: { spine: LearnSpineData; mobileTabs: ReadonlyArray<MiaMiaNavItem> }; on?: { openDestination(id: MiaMiaDestination): void }; surface: ComponentType }`; destination union `home|exam|study|game|ranking`; availability `ready|comingSoon` | RouteShell; LearnSpine; NavLink | Test desktop dùng spine, mobile dùng đúng 5 tab và item future mở overlay |
| ComingSoonOverlay twin | Overlay API | ADD | — | Connected `{ isOpen: boolean; featureLabel: string; onDismiss(): void }`; pure nhận copy đã resolve cùng ba field trên | MiaMiaAppLayout | Overlay test Escape/backdrop/button đều dismiss và feature label hiện đúng |
| MembershipCheckoutOverlay twin | Overlay API | ADD | — | Connected `{ isOpen: boolean; onDismiss(): void }`; pure `{ isOpen; panel: contract projection; onDismiss }` | ExamCatalogPage | Overlay test mount đúng một panel khi open và trả focus khi dismiss |
| ExamCatalogPage twin | Page API | ADD | — | Connected không prop; pure `{ props: { title: string; description: string }; on?: { requestSignIn(): void; requestCheckout(): void } }`; connected giữ deferred intent `none|openPaper(slug)|checkout` | Catalogue route; ExamCatalog callbacks | Page test khóa `locked → sign-in → checkout`, unlocked → route push |
| ExamSessionPage twin | Page API | ADD | — | Connected `{ slug: string }`; pure state `restoring|signedOut|ready`; action `requestSignIn()` | Session route; SignInOverlay; ExamSession | Page test không gọi `paperDetail` trước token và resume sau sign-in |
| ExamCatalog twin | Block API | ADD | — | Connected `{ onOpenPaper(slug: string): void; onRequestPremium(): void }`; pure state union `loading|failed|empty|ready`; ready chứa `collections`, `selectedCollectionId`, `query`, `page`, `pageSize=12`, `papers`; actions `retry|selectCollection|search|changePage|openPaper|requestPremium` | ExamCatalogPage | Tests dùng live-shape fixtures: Free từ `!isLocked`, program từ `programSlug`, 100 paper không render wall |
| ExamSession twin | Block API | ADD | — | Connected `{ slug: string; onExit(): void }`; pure state union `loading|failed|ready|submitting|graded`; answer map keyed `questionId`; actions `retry|selectAnswer|previous|next|submit|exit`; graded chứa `score`, `maxScore`, `skillSummary`, `answerReviews` | ExamSessionPage | Tests khóa no-timer, no-answer-before-grade, submit pending/error, current-attempt aggregation và confirmed exit |
| MembershipCheckoutPanel twin | Block API | ADD | — | Connected `{ onDismiss(): void }`; PayOS request dùng current URL làm return/cancel; pure state `idle|submitting|failed`; actions `checkout|retry|dismiss` | MembershipCheckoutOverlay | Mutation/helper tests chứng minh envelope failure không redirect; success redirect đúng `checkoutUrl` |
| ExamPaperCard | Composite API | ADD | — | `{ props: { id; title; description?; level?; questionCount; badgeLabel?; actionLabel; isLocked }; on?: { open(): void }; isLoading?: boolean }` | `_ExamCatalog` cho mọi paper visible | Component test cho unlocked, locked, demo, missing description và keyboard press |
| SingleChoice | Leaf API | ADD | — | `props={ label; name; options: ReadonlyArray<{ id; label; disabled?; verdict?: neutral|correct|incorrect }>; selectedKey?; disabled?; readOnly? }`; `on?.select(id)` | `_ExamSession` | Leaf test label/RadioGroup semantics, keyboard selection, readOnly verdict và disabled option |

### CONTRACT DELTA

| Contract | Action | Exact children | Lý do |
|---|---|---|---|
| learn-shell-frame; learn-spine-column; learn-nav-group; learn-nav-row; learn-mobile-tab-bar | REUSE | Giữ nguyên registry hiện tại | Sidebar → footbar đã có đúng pattern và breakpoint `md` |
| page-header-stack; title-with-baseline-fact; catalog-query-with-count; label-with-muted-fact-row; label-fact-over-progress | REUSE | Giữ nguyên registry hiện tại | Các quan hệ heading/search/fact/progress đã có owner |
| exam-catalog-page | ADD | `header: page-header-stack`; `premium: premium-value-band?`; `query: catalog-query-with-count`; `collections: choice-tabs`; `section: exam-program-section?`; `pagination: pagination?`; `notice: empty-notice?` | Khóa thứ tự hiểu kho → giá trị Premium → chọn collection → tìm/chọn đề |
| premium-value-band | ADD | `title: heading`; `body: text`; `fact: text?`; `action: button` | CTA Premium đi sau lời hứa giá trị và số đề bị khóa thật |
| exam-program-section | ADD | `heading: title-with-baseline-fact`; `papers: exam-paper-grid` | Collection identity và paper peers là một section |
| exam-paper-grid | ADD | `paper: exam-paper-card*` | Tối đa 12 paper peers trên một page, responsive 1/2/3 cột |
| exam-paper-card | ADD | `badge: badge?`; `title: heading`; `description: text?`; `fact: label-with-muted-fact-row*`; `action: button` | Một paper có entitlement, facts và một outcome duy nhất |
| exam-session-page | ADD | `header: exam-session-header`; `body: exam-passage-question|exam-result-summary|empty-notice`; `actions: exam-session-actions?` | Loading/error/runner/result giữ cùng route identity nhưng không trộn answer key vào runner |
| exam-session-header | ADD | `title: heading`; `fact: text?`; `exit: confirm-button?` | Tên đề, tiến độ và thoát có xác nhận nằm cùng vùng định hướng |
| exam-passage-question | ADD | `passage: article?`; `question: exam-question-card` | Desktop hai cột; mobile xếp passage trước question; question chiếm đủ cột khi không có passage |
| exam-question-card | ADD | `eyebrow: text`; `stem: heading`; `answer: single-choice` | Câu hỏi và một nhóm đáp án là một bounded task |
| exam-session-actions | ADD | `previous: button?`; `progress: text`; `forward: button` | Một forward action đổi từ `Tiếp` sang `Nộp bài` đúng câu cuối; previous là secondary |
| exam-result-summary | ADD | `title: heading`; `score: stat-row`; `skillsTitle: heading?`; `skill: labelled-progress-row*`; `answers: exam-answer-review-list`; `action: button*` | Kết quả bài hiện tại dẫn từ điểm sang kỹ năng rồi từng câu |
| exam-answer-review-list | ADD | `answer: exam-answer-review*` | Các câu đã chấm là một joined review list, không phải card wall |
| exam-answer-review | ADD | `title: title-with-baseline-fact`; `stem: text`; `selected: label-with-muted-fact-row`; `correct: label-with-muted-fact-row`; `explanation: article?` | Chỉ sau grade mới đặt selected/correct/explanation cạnh nhau |
| membership-checkout-panel | ADD | `title: heading`; `body: text`; `benefit: text*`; `notice: empty-notice?`; `action: button*` | Checkout giải thích giá trị nhưng không bịa giá chưa có read query |
| coming-soon-panel | ADD | `title: heading`; `body: text`; `action: button` | Future nav có feedback đóng được và không giả route |

### SUPPORTING PRODUCTION BOUNDARY

| Action | Exact path | Responsibility |
|---|---|---|
| MODIFY | D:\Repositories\miamia-fe\package.json | Đổi package identity thành `miamia-fe`; giữ verify/canon scripts của scaffold |
| MODIFY | D:\Repositories\miamia-fe\.env.example | Trỏ ví dụ GraphQL về MiaMia backend; không chứa secret/test credential |
| MODIFY | D:\Repositories\miamia-fe\src\modules\api\env.ts | Local default dùng MiaMia GraphQL port; giữ retry/timeout/session token behavior |
| MODIFY | D:\Repositories\miamia-fe\src\app\globals.css | Chỉ đổi semantic token values cho Sticker Study UI; không thêm component class owner |
| MODIFY | D:\Repositories\miamia-fe\src\components\contracts\index.ts | Thêm đúng các contract ADD ở bảng CONTRACT DELTA |
| MODIFY | D:\Repositories\miamia-fe\src\messages\vi.json | Copy tiếng Việt cho app shell, catalogue, runner, result, auth intent, checkout và coming soon |
| MODIFY | D:\Repositories\miamia-fe\src\messages\en.json | Copy tiếng Anh tương ứng, không fallback hard-code trong component |
| ADD | D:\Repositories\miamia-fe\src\modules\api\graphql\queries\types\exam.ts | Types `ExamProgram`, `PaperSummary`, `PaperDetail` đúng live schema |
| ADD | D:\Repositories\miamia-fe\src\modules\api\graphql\queries\query-exam-programs.ts | Query `examPrograms` |
| ADD | D:\Repositories\miamia-fe\src\modules\api\graphql\queries\query-papers.ts | Query public optional-auth `papers` gồm `isDemo/isLocked/programSlug` |
| ADD | D:\Repositories\miamia-fe\src\modules\api\graphql\queries\query-paper-detail.ts | Query auth `paperDetail(slug)` gồm passage, skill và không có answer key |
| ADD | D:\Repositories\miamia-fe\src\modules\api\graphql\mutations\types\grade-paper.ts | Grade request/response types |
| ADD | D:\Repositories\miamia-fe\src\modules\api\graphql\mutations\types\purchase-membership.ts | Membership request/checkout response types |
| ADD | D:\Repositories\miamia-fe\src\modules\api\graphql\mutations\mutation-grade-paper.ts | Mutation `gradePaper` |
| ADD | D:\Repositories\miamia-fe\src\modules\api\graphql\mutations\mutation-purchase-membership.ts | Mutation `purchaseMembership` dùng PayOS |
| ADD | D:\Repositories\miamia-fe\src\hooks\swr\useQueryExamProgramsSwr.ts | SWR owner cho programs |
| ADD | D:\Repositories\miamia-fe\src\hooks\swr\useQueryPapersSwr.ts | SWR owner cho catalogue entitlement |
| ADD | D:\Repositories\miamia-fe\src\hooks\swr\useQueryPaperDetailSwr.ts | SWR owner cho authenticated paper detail |
| ADD | D:\Repositories\miamia-fe\src\hooks\swr\useMutateGradePaperSwr.ts | Mutation state cho submit |
| ADD | D:\Repositories\miamia-fe\src\hooks\swr\useMutatePurchaseMembershipSwr.ts | Mutation state cho checkout |
| MODIFY | D:\Repositories\miamia-fe\src\hooks\index.ts | Export đúng năm hook mới |
| ADD | D:\Repositories\miamia-fe\src\modules\payment\submit-checkout.ts | Redirect PayOS hoặc POST signed fields nếu backend trả checkoutFields |
| ADD | D:\Repositories\miamia-fe\src\components\leaves\SingleChoice\index.test.tsx | Semantics/keyboard/readOnly verdict tests |
| ADD | D:\Repositories\miamia-fe\src\components\composites\ExamPaperCard\index.test.tsx | Entitlement/card action tests |
| ADD | D:\Repositories\miamia-fe\src\components\layouts\MiaMiaAppLayout\component.test.tsx | Sidebar/footbar tree tests |
| ADD | D:\Repositories\miamia-fe\src\components\pages\ExamCatalogPage\component.test.tsx | Deferred auth/checkout intent tests |
| ADD | D:\Repositories\miamia-fe\src\components\pages\ExamSessionPage\component.test.tsx | Auth gate/slug tests |
| ADD | D:\Repositories\miamia-fe\src\components\blocks\exam\ExamCatalog\component.test.tsx | Collection/search/paging/100-paper tests |
| ADD | D:\Repositories\miamia-fe\src\components\blocks\exam\ExamSession\component.test.tsx | Runner/grade/result/no-timer tests |
| ADD | D:\Repositories\miamia-fe\src\components\blocks\membership\MembershipCheckoutPanel\component.test.tsx | Checkout pending/failure/success tests |
| ADD | D:\Repositories\miamia-fe\src\modules\api\graphql\queries\exam-queries.test.ts | Exact operation names, variables và selected fields |
| ADD | D:\Repositories\miamia-fe\src\modules\api\graphql\mutations\exam-mutations.test.ts | Grade/membership envelope tests |
| ADD | D:\Repositories\miamia-fe\src\modules\payment\submit-checkout.test.ts | Redirect/form POST tests |

### OWNER STATES VÀ DATA RULES

| Owner | Frozen states / rules |
|---|---|
| App layout | Desktop `md+` dùng sidebar; dưới `md` dùng footbar đúng 5 mục; chỉ `exam` ready; bốn mục còn lại mở ComingSoonOverlay |
| Catalogue | `loading`, `failed+retry`, `empty`, `ready`; collection `free` đứng đầu rồi `examPrograms.sortIndex`; tên fallback `name[locale] → name[other locale] → slug.toUpperCase()` |
| Catalogue scaling | Selected collection duy nhất; search trong collection; page size cố định 12; không render 100 card một lúc; `Free` lấy paper `isLocked=false`, không suy từ `isDemo` |
| Entitlement | `isLocked` từ server là authority; unlocked mở session; locked mở sign-in nếu cần rồi membership checkout |
| Runner | `loading`, `failed+retry`, `ready`, `submitting`, `graded`; answer map local theo `questionId`; passage cạnh question desktop, xếp dọc mobile; không countdown/auto-submit/save-resume |
| Result | Score từ `gradePaper`; skill summary chỉ join question skill với answer verdict của attempt vừa nộp; review từng câu dùng đúng selected/correct/explanation sau grade |
| Checkout | Không hiển thị giá giả vì chưa có read query giá membership; request PayOS chỉ sau explicit press; envelope fail giữ modal và báo retry; success chuyển tới checkout URL |
| Exit | `ConfirmButton` hai bước; xác nhận mới về catalogue; copy nói rõ answer local chưa nộp sẽ mất |

### ACCEPTANCE EVIDENCE CHO APPLY

| Gate | Proof bắt buộc ghi lại trong workflow Apply |
|---|---|
| Baseline | Materialize đúng snapshot đã duyệt vào repo mới; `git init`; commit baseline trước mọi MiaMia edit; ghi `Baseline commit` và `Tracked diff: <baseline>..worktree` |
| Static | Từ D:\Repositories\miamia-fe chạy `npm ci` rồi `npm run verify`; typecheck, canon lint, unit/component tests và rules đều xanh |
| Runtime | Start MiaMia FE và MiaMia backend; ghi port/PID/command; kiểm tra desktop `1440×900` và mobile `390×844`, không overflow ngang |
| Test account | Dùng account test đã được provision/configure, không ghi credential vào workflow; đăng nhập thật rồi kiểm tra unlocked paper và locked Premium path |
| Core flow | Catalogue → collection → unlocked paper → chọn đáp án → nộp → score → skill của bài hiện tại → review từng câu → về kho đề |
| Premium flow | Locked paper → sign-in nếu cần → checkout overlay; chỉ gọi `purchaseMembership` live khi gateway local là sandbox/test, không tạo giao dịch tiền thật |
| Network | DevTools/network không có failed GraphQL ngoài failure case chủ động; xác nhận `examPrograms`, `papers`, `paperDetail`, `gradePaper`; checkout mutation theo gate sandbox ở trên |
| Terminal | FE và BE terminal không có runtime exception/unhandled rejection; ghi warning/error còn lại với owner, không kết luận chung chung |
| Responsive nav | Sidebar desktop và footbar mobile dùng cùng 5 destination identities; Game/ranking/etc mở Coming soon, không 404/no-op |
| Visual | Sticker Study UI đến từ semantic tokens trong `globals.css`; không có `MiaButton`, `MiaCard`, `MiaSidebar` hoặc visual primitive fork |

### OUTPUTS

| Concept | Result |
|---|---|
| Revision đề xuất | `C-contract-safe-r1`: kho theo collection thật, runner passage-first, kết quả kỹ năng của bài hiện tại và Premium checkout thật |
| Scale 100+ | Chọn một collection, search và phân trang 12; không tạo wall 100 đề |
| Navigation | StarCi sidebar pattern đổi thành footbar 5 mục dưới `md`; feature chưa migrate trả Coming soon |
| UI language | Sticker Study UI chỉ thay token trong `globals.css`; leaves/branches/shells vẫn là StarCi FE |

### CHANGES

| Tree | Details |
|---|---|
| D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md | modified — append Review r1 tiếng Việt, phản biện C, exact component/props/contract delta, production boundary và acceptance proof |

### NEED APPROVALS

| Question | Options |
|---|---|
| Duyệt revision production của hướng C | Duyệt `C-contract-safe-r1` (đề xuất): Free + `examPrograms` thật; skill chỉ của bài vừa nộp; checkout Premium PayOS thật; sidebar/footbar 5 mục với feature ngoài scope mở Coming soon; hoặc phản hồi đúng phần cần sửa |

### WARNINGS

| Warning | Impact |
|---|---|
| Target D:\Repositories\miamia-fe chưa tồn tại | Chỉ Apply sau approval mới được materialize và commit baseline |
| Scaffold StarCi FE tiếp tục chuyển động sau Plan r4 | Apply phải hash lại; lệch snapshot thì không được tự chọn trạng thái mới |
| Chỉ một `examProgram` đang live và tên/description localized có thể rỗng | UI dùng fallback đã khóa; chiều sâu Direction C tăng tự nhiên khi backend thêm programs |
| Không có membership-price read query | Checkout không được quảng cáo con số giá trước mutation; muốn show giá phải mở Backend Plan/Review riêng |
| Không có open/save/resume attempt | Rời runner làm mất local answer chưa nộp; không được dùng copy “tạm dừng” |
| Live checkout có thể tạo transaction hoặc đi tới gateway thật | Apply chỉ gọi mutation trong sandbox/test; production-money action cần approval riêng |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Kệ fixture `2026`, `Tỉnh/thành`, `Luyện điểm yếu` | `Free` + từng `examPrograms` thật | Backend chưa sở hữu metadata fixture |
| Weak-point lịch sử | Skill summary của attempt vừa nộp | Có thể tính trung thực từ `paperDetail + gradePaper` |
| CTA `Ôn kỹ năng` | `Xem từng câu`; `Về kho đề` | Chưa có route/mutation ôn theo skill |
| `Lưu & thoát`, countdown và auto-submit | Exit có xác nhận; người học tự nộp | Không có save/resume contract và product đã bác timer |
| Link nav tương lai no-op/404 | ComingSoonOverlay | Sidebar vẫn giới thiệu game nhưng không giả capability |

### OWED

| Owed | Cleared by |
|---|---|
| Duyệt hoặc sửa `C-contract-safe-r1` | Feedback rõ của người dùng |
| Ghi dòng phê duyệt chuẩn cho `C-contract-safe-r1` và đóng Review | Append review r2 sau approval |
| Tạo miamia-fe, commit baseline rồi implement/diff/test/login/network/terminal | `starci-fe-design-apply` sau Review approval |

## review r2

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | MiaMia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | Target chưa tạo; scaffold source D:\Repositories\starci-academy-fe @ main |
| Purpose | Ghi nhận approval hướng C và chặn Apply khi snapshot scaffold đã đổi sau Review r1. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md |
| Language | vi |
| Phase | review |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md |

Feedback nhận được: `duyet code id`, được hiểu là duyệt concept `C-contract-safe-r1` và cho phép chuyển sang code. Tuy nhiên baseline authority trong Review r1 không còn khớp tại thời điểm chuẩn bị Apply nên revision chưa được đóng approval.

### SNAPSHOT DRIFT

| Evidence | Review r1 | Hiện tại | Verdict |
|---|---|---|---|
| HEAD | `1bc591b73b0ad0fce8114d9d7f1c19e52bca6e9b` | `1bc591b73b0ad0fce8114d9d7f1c19e52bca6e9b` | khớp |
| Branch | `main` | `main` | khớp |
| Tracked changed paths | `16` | `16` | khớp |
| Tracked binary patch Git hash | `ba4bc049e1f65804febfb8f2a38e72d844ffb9bd` | `dd56fc986b54e39d5ce6e8a2366a987adac2b7ce` | lệch — phải duyệt lại |
| Untracked source/test paths | `1` | `1` | khớp |
| Untracked content manifest Git hash | `78c1942fb1469cc75df3760128ba4eedc7bc2a26` | `78c1942fb1469cc75df3760128ba4eedc7bc2a26` | khớp |
| Target D:\Repositories\miamia-fe | chưa tồn tại | chưa tồn tại | chưa có production write |

### OUTPUTS

| Concept | Result |
|---|---|
| Hướng C | Đã nhận approval về product direction và production concept |
| Apply gate | Chưa mở vì nội dung tracked của scaffold không còn đúng snapshot được Review r1 định danh |

### CHANGES

| Tree | Details |
|---|---|
| D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md | modified — append approval feedback, snapshot drift và gate cần xác nhận lại |

### NEED APPROVALS

| Question | Options |
|---|---|
| Có dùng snapshot StarCi FE hiện tại làm baseline source không? | Duyệt snapshot mới: `main`, HEAD `1bc591b73b0ad0fce8114d9d7f1c19e52bca6e9b`, 16 tracked paths, patch hash `dd56fc986b54e39d5ce6e8a2366a987adac2b7ce`, 1 untracked source/test, manifest `78c1942fb1469cc75df3760128ba4eedc7bc2a26`; hoặc dừng để ổn định worktree StarCi FE trước |

### WARNINGS

| Warning | Impact |
|---|---|
| Patch hash đổi trong khi HEAD và path count giữ nguyên | Ít nhất một nội dung tracked đã đổi; tự tiếp tục sẽ lấy source chưa được thầy duyệt |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Tự coi approval concept bao phủ snapshot scaffold mới | Yêu cầu xác nhận lại đúng hash | Apply skill cấm tự chọn source state khi baseline authority đã drift |

### OWED

| Owed | Cleared by |
|---|---|
| Đóng Review với snapshot mới và revision chính thức | Người dùng xác nhận hash `dd56fc986b54e39d5ce6e8a2366a987adac2b7ce` |
| Tạo repo, commit baseline trước code, implement và live-flow proof | `starci-fe-design-apply` sau khi snapshot được duyệt |

## review r3

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | MiaMia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | Target chưa tạo; scaffold source D:\Repositories\starci-academy-fe @ main |
| Purpose | Kiểm tra snapshot ngay sau approval và chặn baseline khi source tiếp tục drift. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md |
| Language | vi |
| Phase | review |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md |

Feedback `duyet di` xác nhận snapshot ở Review r2. Kiểm tra bắt buộc ngay trước materialize phát hiện source đã đổi lần nữa, nên chưa ghi dòng approval chuẩn và chưa có production write.

### SNAPSHOT DRIFT LẦN 2

| Evidence | Vừa được duyệt | Ngay trước baseline | Verdict |
|---|---|---|---|
| HEAD | `1bc591b73b0ad0fce8114d9d7f1c19e52bca6e9b` | `1bc591b73b0ad0fce8114d9d7f1c19e52bca6e9b` | khớp |
| Tracked changed paths | `16` | `17` | lệch |
| Tracked binary patch Git hash | `dd56fc986b54e39d5ce6e8a2366a987adac2b7ce` | `f72e2ff8664e6fea7c15b91d2413b0c906a08d3d` | lệch |
| Thay đổi mới quan sát | không có `ShellNav` trong status | `src/components/layouts/ShellNav/index.tsx` modified | source đang được ghi đồng thời |
| Untracked content manifest Git hash | `78c1942fb1469cc75df3760128ba4eedc7bc2a26` | `78c1942fb1469cc75df3760128ba4eedc7bc2a26` | khớp |
| Target D:\Repositories\miamia-fe | chưa tồn tại | chưa tồn tại | chưa có production write |

### OUTPUTS

| Concept | Result |
|---|---|
| Hướng C | Vẫn được duyệt về concept |
| Baseline authority | Chưa thể đóng vì scaffold source đổi tiếp sau approval |

### CHANGES

| Tree | Details |
|---|---|
| D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md | modified — append snapshot drift lần hai trước baseline |

### NEED APPROVALS

| Question | Options |
|---|---|
| Khi StarCi FE ngừng thay đổi, có dùng snapshot hiện tại không? | Dừng task đang ghi D:\Repositories\starci-academy-fe rồi duyệt snapshot ổn định (đề xuất); hoặc duyệt ngay `17` tracked paths, patch hash `f72e2ff8664e6fea7c15b91d2413b0c906a08d3d` nếu chắc chắn không còn writer khác |

### WARNINGS

| Warning | Impact |
|---|---|
| Source đổi hai lần giữa Review và Apply | Duyệt liên tiếp nhưng writer khác vẫn chạy sẽ không bao giờ tạo được baseline có authority |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Materialize snapshot `dd56fc...` sau khi source đã thành `f72e2f...` | Dừng trước production write | Baseline phải đúng source state được duyệt |

### OWED

| Owed | Cleared by |
|---|---|
| Một snapshot StarCi FE không đổi trong lần kiểm tra ngay trước copy | Dừng writer khác rồi xác nhận snapshot |
| Đóng Review và chạy Apply | Approval snapshot ổn định |

## review r4

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | MiaMia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | Target chưa tạo; snapshot source D:\Repositories\starci-academy-fe @ main |
| Purpose | Đóng Review theo lệnh làm MiaMia ngay từ một snapshot StarCi FE dùng duy nhất làm scaffold. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md |
| Language | vi |
| Phase | review |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md |

Approved revision: C-contract-safe-r1

Snapshot scaffold được duyệt theo feedback `rồi làm đi`: HEAD `1bc591b73b0ad0fce8114d9d7f1c19e52bca6e9b`, 17 tracked paths, patch hash `f72e2ff8664e6fea7c15b91d2413b0c906a08d3d`, 1 untracked source/test, manifest `78c1942fb1469cc75df3760128ba4eedc7bc2a26`. Snapshot này chỉ được copy một lần sang MiaMia; mọi thay đổi StarCi FE sau đó nằm ngoài task.

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | MiaMia app segment layout | ADD | Không có trong target mới | D:\Repositories\miamia-fe\src\app\[lang]\(app)\layout.tsx | Next `[lang]/(app)` | RouteShell | Mount app frame quanh routed surface |
| route | Exam catalogue route | ADD | Không có trong target mới | D:\Repositories\miamia-fe\src\app\[lang]\(app)\exam\page.tsx | `/[lang]/exam` | ExamCatalogPage | Route chỉ mount page |
| route | Exam session route | ADD | Không có trong target mới | D:\Repositories\miamia-fe\src\app\[lang]\(app)\exam\[slug]\page.tsx | `/[lang]/exam/[slug]` | ExamSessionPage | Route chỉ resolve slug và mount page |
| layout | MiaMiaAppLayout / `_MiaMiaAppLayout` | ADD | Không có trong target mới | D:\Repositories\miamia-fe\src\components\layouts\MiaMiaAppLayout\index.tsx; D:\Repositories\miamia-fe\src\components\layouts\MiaMiaAppLayout\component.tsx | App segment layout | learn-shell-frame | Sidebar desktop và footbar mobile cùng identity |
| overlay | SignInOverlay / `_SignInOverlay` | REUSE | D:\Repositories\miamia-fe\src\components\overlays\auth\SignInOverlay | Giữ nguyên | ExamCatalogPage; ExamSessionPage | ModalShell | Auth owner đã có trong scaffold |
| overlay | ComingSoonOverlay / `_ComingSoonOverlay` | ADD | Không có trong target mới | D:\Repositories\miamia-fe\src\components\overlays\app\ComingSoonOverlay\index.tsx; D:\Repositories\miamia-fe\src\components\overlays\app\ComingSoonOverlay\component.tsx | MiaMiaAppLayout | ModalShell + coming-soon-panel | Future nav không no-op hoặc 404 |
| overlay | MembershipCheckoutOverlay / `_MembershipCheckoutOverlay` | ADD | Không có trong target mới | D:\Repositories\miamia-fe\src\components\overlays\membership\MembershipCheckoutOverlay\index.tsx; D:\Repositories\miamia-fe\src\components\overlays\membership\MembershipCheckoutOverlay\component.tsx | ExamCatalogPage | ModalShell + membership-checkout-panel | Premium CTA có checkout thật |
| page | ExamCatalogPage / `_ExamCatalogPage` | ADD | Không có trong target mới | D:\Repositories\miamia-fe\src\components\pages\ExamCatalogPage\index.tsx; D:\Repositories\miamia-fe\src\components\pages\ExamCatalogPage\component.tsx | Catalogue route; auth; checkout | exam-catalog-page | Sở hữu deferred auth/checkout intent |
| page | ExamSessionPage / `_ExamSessionPage` | ADD | Không có trong target mới | D:\Repositories\miamia-fe\src\components\pages\ExamSessionPage\index.tsx; D:\Repositories\miamia-fe\src\components\pages\ExamSessionPage\component.tsx | Session route; auth; ExamSession | exam-session-page | Auth gate theo slug |
| block | ExamCatalog / `_ExamCatalog` | ADD | Không có trong target mới | D:\Repositories\miamia-fe\src\components\blocks\exam\ExamCatalog\index.tsx; D:\Repositories\miamia-fe\src\components\blocks\exam\ExamCatalog\component.tsx | ExamCatalogPage | exam-catalog-page children | Programs, papers, search và paging có một owner |
| block | ExamSession / `_ExamSession` | ADD | Không có trong target mới | D:\Repositories\miamia-fe\src\components\blocks\exam\ExamSession\index.tsx; D:\Repositories\miamia-fe\src\components\blocks\exam\ExamSession\component.tsx | ExamSessionPage | exam-session-page children | Paper detail, answer, grade và result có một owner |
| block | MembershipCheckoutPanel / `_MembershipCheckoutPanel` | ADD | Không có trong target mới | D:\Repositories\miamia-fe\src\components\blocks\membership\MembershipCheckoutPanel\index.tsx; D:\Repositories\miamia-fe\src\components\blocks\membership\MembershipCheckoutPanel\component.tsx | MembershipCheckoutOverlay | membership-checkout-panel | Mutation PayOS và redirect có owner |
| block | LearnSpine projection | REUSE | D:\Repositories\miamia-fe\src\components\blocks\learn\LearnSpine\component.tsx | Giữ nguyên | `_MiaMiaAppLayout` | learn-spine-column | Reuse StarCi sidebar pattern |
| composite | ExamPaperCard | ADD | Không có trong target mới | D:\Repositories\miamia-fe\src\components\composites\ExamPaperCard\index.tsx | `_ExamCatalog` | exam-paper-card | Public paper card API đóng |
| composite | EmptyNotice | REUSE | D:\Repositories\miamia-fe\src\components\composites\EmptyNotice\index.tsx | Giữ nguyên | Empty/error states | empty-notice | Không fork notice |
| composite | LabelledProgressRow | REUSE | D:\Repositories\miamia-fe\src\components\composites\LabelledProgressRow\index.tsx | Giữ nguyên | Skill summary | labelled-progress-row | Reuse progress relationship |
| branch | Tree | REUSE | D:\Repositories\miamia-fe\src\components\branches\Tree | Giữ nguyên | Pure owners mới | registry contracts | Executable grammar |
| branch | SurfaceCard; SurfaceListCard; PressableSurface | REUSE | D:\Repositories\miamia-fe\src\components\branches | Giữ nguyên | Cards, result, navigation | parent contract | Không fork surface |
| leaf | SingleChoice | ADD | Không có trong target mới | D:\Repositories\miamia-fe\src\components\leaves\SingleChoice\index.tsx | `_ExamSession` | HeroUI RadioGroup/Radio | Primitive chọn một đáp án còn thiếu |
| leaf | Button; Badge; Heading; Text; SearchBox; Pagination; NavLink; Progress; Article; ConfirmButton | REUSE | D:\Repositories\miamia-fe\src\components\leaves | Giữ nguyên | Pure owners mới | existing leaf contracts | Giữ StarCi vocabulary |
| shell | RouteShell | REUSE | D:\Repositories\miamia-fe\src\components\shells\RouteShell\index.tsx | Giữ nguyên | App segment layout | surface component | Framework bridge đã có |
| shell | ModalShell | REUSE | D:\Repositories\miamia-fe\src\components\shells\ModalShell\index.tsx | Giữ nguyên | Ba overlays | vendor mechanics | Focus/Escape/backdrop có một owner |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| MiaMia app segment layout | Next layout props | ADD | Không tồn tại | `{ children: ReactNode }`; RouteShell frame MiaMiaAppLayout | Next app segment | Route test |
| Exam catalogue route | Route API | ADD | Không tồn tại | Không public props; mount ExamCatalogPage | Next catalogue route | Route test |
| Exam session route | Route API | ADD | Không tồn tại | `{ params: Promise of { lang; slug } }`; truyền slug | Next session route | Route test fixture |
| MiaMiaAppLayout / `_MiaMiaAppLayout` | Connected/pure twin API | ADD | Không tồn tại | Connected `{ surface: ComponentType }`; pure `{ props: { spine; mobileTabs }; on.openDestination(id); surface }`; destination `home|exam|study|game|ranking` | RouteShell; LearnSpine; NavLink | Desktop/mobile and coming-soon tests |
| ComingSoonOverlay / `_ComingSoonOverlay` | Overlay API | ADD | Không tồn tại | `{ isOpen; featureLabel; onDismiss }`; pure nhận resolved copy | MiaMiaAppLayout | Dismiss/focus test |
| MembershipCheckoutOverlay / `_MembershipCheckoutOverlay` | Overlay API | ADD | Không tồn tại | `{ isOpen; onDismiss }`; pure nhận panel projection | ExamCatalogPage | Modal mount test |
| ExamCatalogPage / `_ExamCatalogPage` | Page API | ADD | Không tồn tại | Connected không props; pure copy + `requestSignIn` và `requestCheckout`; intent `none|openPaper|checkout` | Catalogue route; ExamCatalog | Deferred-intent tests |
| ExamSessionPage / `_ExamSessionPage` | Page API | ADD | Không tồn tại | Connected `{ slug }`; state `restoring|signedOut|ready`; `requestSignIn` | Session route | Auth gate tests |
| ExamCatalog / `_ExamCatalog` | Block API | ADD | Không tồn tại | Connected callbacks `onOpenPaper(slug)` và `onRequestPremium`; pure state `loading|failed|empty|ready`, collection/search/page actions; page size 12 | ExamCatalogPage | 100-paper fixture test |
| ExamSession / `_ExamSession` | Block API | ADD | Không tồn tại | Connected `{ slug; onExit }`; pure state `loading|failed|ready|submitting|graded`; answer/navigation/submit/exit actions | ExamSessionPage | Grade/no-timer tests |
| MembershipCheckoutPanel / `_MembershipCheckoutPanel` | Block API | ADD | Không tồn tại | Connected `{ onDismiss }`; pure `idle|submitting|failed`; `checkout|retry|dismiss` | MembershipCheckoutOverlay | Mutation/redirect tests |
| ExamPaperCard | Composite API | ADD | Không tồn tại | `{ props: { id; title; description?; level?; questionCount; badgeLabel?; actionLabel; isLocked }; on.open; isLoading? }` | `_ExamCatalog` | Entitlement/card tests |
| SingleChoice | Leaf API | ADD | Không tồn tại | `{ props: { label; name; options: readonly option array; selectedKey?; disabled?; readOnly? }; on.select(id) }`; option verdict `neutral|correct|incorrect` | `_ExamSession` | Keyboard/readOnly tests |

### SUPPORTING PRODUCTION BOUNDARY

| Action | Exact paths | Responsibility |
|---|---|---|
| MODIFY | D:\Repositories\miamia-fe\package.json; D:\Repositories\miamia-fe\.env.example; D:\Repositories\miamia-fe\src\modules\api\env.ts | MiaMia identity và local GraphQL endpoint |
| MODIFY | D:\Repositories\miamia-fe\src\app\globals.css | Chỉ semantic token values cho Sticker Study UI |
| MODIFY | D:\Repositories\miamia-fe\src\components\contracts\index.ts | Contract ADD đã khóa ở Review r1 |
| MODIFY | D:\Repositories\miamia-fe\src\messages\vi.json; D:\Repositories\miamia-fe\src\messages\en.json | Toàn bộ resolved UI copy |
| ADD | D:\Repositories\miamia-fe\src\modules\api\graphql\queries\types\exam.ts; D:\Repositories\miamia-fe\src\modules\api\graphql\queries\query-exam-programs.ts; D:\Repositories\miamia-fe\src\modules\api\graphql\queries\query-papers.ts; D:\Repositories\miamia-fe\src\modules\api\graphql\queries\query-paper-detail.ts | Live query types và operations |
| ADD | D:\Repositories\miamia-fe\src\modules\api\graphql\mutations\types\grade-paper.ts; D:\Repositories\miamia-fe\src\modules\api\graphql\mutations\types\purchase-membership.ts; D:\Repositories\miamia-fe\src\modules\api\graphql\mutations\mutation-grade-paper.ts; D:\Repositories\miamia-fe\src\modules\api\graphql\mutations\mutation-purchase-membership.ts | Grade và checkout operations |
| ADD | D:\Repositories\miamia-fe\src\hooks\swr\useQueryExamProgramsSwr.ts; D:\Repositories\miamia-fe\src\hooks\swr\useQueryPapersSwr.ts; D:\Repositories\miamia-fe\src\hooks\swr\useQueryPaperDetailSwr.ts; D:\Repositories\miamia-fe\src\hooks\swr\useMutateGradePaperSwr.ts; D:\Repositories\miamia-fe\src\hooks\swr\useMutatePurchaseMembershipSwr.ts | SWR query/mutation owners |
| MODIFY | D:\Repositories\miamia-fe\src\hooks\index.ts | Export hooks mới |
| ADD | D:\Repositories\miamia-fe\src\modules\payment\submit-checkout.ts | PayOS redirect / signed form POST |
| ADD | D:\Repositories\miamia-fe\src\components\leaves\SingleChoice\index.test.tsx; D:\Repositories\miamia-fe\src\components\composites\ExamPaperCard\index.test.tsx; D:\Repositories\miamia-fe\src\components\layouts\MiaMiaAppLayout\component.test.tsx; D:\Repositories\miamia-fe\src\components\pages\ExamCatalogPage\component.test.tsx; D:\Repositories\miamia-fe\src\components\pages\ExamSessionPage\component.test.tsx | Component boundary tests |
| ADD | D:\Repositories\miamia-fe\src\components\blocks\exam\ExamCatalog\component.test.tsx; D:\Repositories\miamia-fe\src\components\blocks\exam\ExamSession\component.test.tsx; D:\Repositories\miamia-fe\src\components\blocks\membership\MembershipCheckoutPanel\component.test.tsx | Block state tests |
| ADD | D:\Repositories\miamia-fe\src\modules\api\graphql\queries\exam-queries.test.ts; D:\Repositories\miamia-fe\src\modules\api\graphql\mutations\exam-mutations.test.ts; D:\Repositories\miamia-fe\src\modules\payment\submit-checkout.test.ts | Transport/helper tests |

Owner states, contract delta và acceptance evidence giữ nguyên chính xác các bảng `CONTRACT DELTA`, `OWNER STATES VÀ DATA RULES` và `ACCEPTANCE EVIDENCE CHO APPLY` của Review r1; không có product decision mới.

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `C-contract-safe-r1`: MiaMia kho theo collection thật, runner không timer và Premium checkout thật |
| Scaffold | Chụp StarCi FE hiện tại đúng một lần làm baseline source; không sửa repository StarCi |

### CHANGES

| Tree | Details |
|---|---|
| D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md | modified — append approved Review r4 với snapshot và exact Apply boundary |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Đã duyệt; chuyển sang Apply |

### WARNINGS

| Warning | Impact |
|---|---|
| Scaffold chứa 17 tracked thay đổi Course đang dở của StarCi FE | Chúng trở thành baseline history của MiaMia và không xuất hiện trong MiaMia implementation diff |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Tiếp tục coi StarCi FE là target | Chỉ copy một snapshot sang target MiaMia riêng | “ủa sao lại starci?? ở đây là miamia mà?” |

### OWED

| Owed | Cleared by |
|---|---|
| Materialize, baseline commit, implementation và live-flow proof | `starci-fe-design-apply` |

## apply r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | MiaMia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | D:\Repositories\miamia-fe @ codex/miamia-thi-thu |
| Purpose | Apply hướng C cho kho đề, runner, kết quả hiện tại và Premium checkout trong frontend MiaMia riêng. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md |
| Language | vi |
| Phase | apply |
| Touching | Chỉ D:\Repositories\miamia-fe và workflow record này |

Applied revision: C-contract-safe-r1

Baseline commit: `72c70f1c1a689b365fcf5c92891039afba4dc2db`

Tracked diff: `72c70f1c1a689b365fcf5c92891039afba4dc2db..worktree`

### OUTPUTS

| Concept | Result |
|---|---|
| App riêng | Đã materialize repository `miamia-fe`; StarCi FE chỉ là snapshot scaffold một lần, không bị sửa trong Apply |
| Kho đề hướng C | Collection thật `Free + examPrograms`, tìm kiếm client-side, phân trang 12 đề và CTA Premium |
| Thi thử | Paper detail có auth, chọn một đáp án, không timer/auto-submit/save-resume, nộp qua `gradePaper` |
| Kết quả | Điểm, kỹ năng của lần nộp hiện tại và review từng đáp án; không giả lịch sử điểm yếu |
| Navigation | Desktop sidebar; mobile footbar 5 mục; mục chưa có mở Coming Soon |
| Visual identity | Chỉ đổi semantic token values trong `src/app/globals.css`; component không chứa màu MiaMia riêng |

### CHANGES

| Tree | Details |
|---|---|
| `src/app/[lang]/(app)` | ADD — layout ứng dụng, route `/exam` và `/exam/[slug]` |
| `src/components/layouts/MiaMiaAppLayout` | ADD — reuse `LearnSpine`, sidebar desktop và footbar mobile cùng 5 destination |
| `src/components/pages/ExamCatalogPage`; `ExamSessionPage` | ADD — page owner giữ main landmark, auth/deferred intent và routed surface |
| `src/components/blocks/exam` | ADD — catalogue thật, runner, grade và result hiện tại |
| `src/components/blocks/membership`; `src/components/overlays/membership` | ADD — PayOS membership checkout thật, redirect hoặc signed POST |
| `src/components/overlays/app` | ADD — Coming Soon cho destination tương lai |
| `src/components/composites/ExamPaperCard`; `src/components/leaves/SingleChoice` | ADD — paper offer và RadioGroup primitive |
| `src/components/contracts/index.ts` | MODIFY — contract trees cho catalogue, card, runner, result, checkout và Coming Soon |
| `src/modules/api/graphql/queries`; `mutations`; `src/hooks/swr` | ADD — live `examPrograms`, `papers`, `paperDetail`, `gradePaper`, `purchaseMembership` contracts và SWR owners |
| `src/modules/payment/submit-checkout.ts` | ADD — redirect khi không có fields; POST hidden form khi provider trả signed fields |
| `src/messages/vi.json`; `src/messages/en.json` | MODIFY — copy MiaMia song ngữ, không hard-code nhãn card |
| `src/app/globals.css` | MODIFY — pink/warm-paper MiaMia semantic tokens; không thêm component CSS |
| `package.json`; `package-lock.json`; `.env.example`; `src/modules/api/env.ts` | MODIFY — identity `miamia-fe` và local GraphQL `3071` |
| `*.test.ts(x)` trong boundary mới | ADD — 9 focused twin tests cho leaf/card/page/checkout/GraphQL |

### LIVE FLOW PROOF

| Proof | Kết quả |
|---|---|
| Frontend runtime | PASS — Next 16.1.6 tại `http://127.0.0.1:3097/vi/exam` |
| Backend health trực tiếp | PASS — `http://localhost:3071/graphql` trả HTTP 200, collection `thptqg`, `bankCount: 30` |
| Desktop 1440x900 | PASS — sidebar hiện 5 mục, footbar ẩn, CTA/search/collection/paging đúng hierarchy |
| Mobile 390x844 | PASS — sidebar ẩn, footbar 5 mục hiện dưới màn hình, không overflow quan sát được |
| Premium auth gate | PASS — CTA mở SignInOverlay; đã gửi tài khoản test `learner@miamia.test` qua UI |
| Browser Network | READY — instance phụ `3072` khởi động sau khoảng 12 giây; preflight từ `http://127.0.0.1:3097` trả 204 với đúng `Access-Control-Allow-Origin`, GraphQL trả 200 |
| Console | Không có error ứng dụng; có warning kế thừa `PressResponder ... without a pressable child` từ `NavLink` scaffold |
| FE terminal | Route trả 200; có warning next-intl `ENVIRONMENT_FALLBACK` trong dev dù request config đã khai `Asia/Ho_Chi_Minh` |
| BE terminal/network | Instance hiện hữu nghe `3071`; instance kiểm thử chỉ dùng env runtime nghe `3072`, Nest start thành công; không ghi file backend dirty worktree |
| Catalogue live data | PASS qua network boundary — `thptqg`, `bankCount: 30`, 36 papers hiện tại, 2 paper mở và 34 paper locked |
| Grade và PayOS qua browser | Chưa chạy lại sau khi instance `3072` sẵn sàng; không ghi nhận pass giả |

### VERIFICATION

| Gate | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS; `/[lang]/exam` và `/[lang]/exam/[slug]` được build |
| Focused MiaMia tests | PASS — 9 files, 9 tests |
| Full inherited suite | FAIL — 120 files pass, 13 files fail; gồm test scaffold cũ về endpoint `3001`, hooks barrel, ResizeObserver/next-navigation và dashboard assertions |
| Canon mirror gate | PASS — mirror khớp trust tree |
| Full eslint | FAIL — trust mirror hiện tự có 45 lỗi và source MiaMia còn documentation/inline-type lint debt; không suppress |
| `git diff --check` | PASS |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Runtime phụ đã nhận đúng origin mà không sửa backend source; còn lại là verification và lint trong boundary đã duyệt. |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend `3072` cần khoảng 12 giây để sẵn sàng | Browser test chạy trước readiness từng nhận lỗi network; phải reload và chạy lại toàn flow trên instance đang nghe |
| Full eslint chưa xanh | Apply chưa đủ điều kiện đóng; còn documentation lint debt trong source mới và trust-generated lint drift ngoài target |
| Full suite kế thừa đỏ trước các assertion không thuộc feature | Không được dùng focused tests để tuyên bố toàn suite pass |
| npm audit báo 3 high | Chưa chạy force-fix vì có thể thay dependency graph ngoài boundary |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Dừng StarCi FE đang chiếm port 3000 | Chạy MiaMia ở 3097 và ghi CORS blocker | Giữ runtime/worktree không liên quan của thầy |
| Ghi giả 100 đề hoặc collection tỉnh/năm | Chỉ render Free và `examPrograms` thật | Backend hiện công bố một program và 30 đề |
| Ghi authenticated flow pass | Ghi rõ blocked tại CORS sau khi submit test login | Chưa có bằng chứng Network thành công |
| Sửa backend dirty worktree để tiện test | Chỉ đọc config và gọi API trực tiếp | Apply boundary chỉ là `miamia-fe` |

### OWED

| Owed | Cleared by |
|---|---|
| Hoàn tất documentation/inline-type lint của source MiaMia | Targeted eslint 0 lỗi trên toàn bộ path mới |
| Sửa hoặc tách trust-generated eslint drift | Trust tree canon xanh độc lập, không sửa mirror bằng tay |
| Chạy lại login → paper detail → answer → grade → result và Premium checkout request | Reload browser trên backend `3072`, sau đó Network/Console và FE/BE terminal đều không fail |
| Đóng Apply | Tất cả gate trên pass và append live proof cuối vào record này |

## apply r2 — hoàn tất lint

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | MiaMia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | D:\Repositories\miamia-fe @ codex/miamia-thi-thu |
| Purpose | Hoàn tất lint cho source thi thử MiaMia và giữ mirror canon chỉ đọc/đồng bộ. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md |
| Language | vi |
| Phase | apply |
| Touching | Source D:\Repositories\miamia-fe và workflow record này |

Baseline commit: `72c70f1c1a689b365fcf5c92891039afba4dc2db`

Tracked diff: `72c70f1c1a689b365fcf5c92891039afba4dc2db..worktree`

### OUTPUTS

| Concept | Result |
|---|---|
| Lint source MiaMia | PASS — toàn bộ route, component, hook, GraphQL, payment và contract mới đạt 0 lỗi |
| Lint toàn repository | PASS — `npm run lint` đồng bộ canon thành công và ESLint thoát mã 0 |
| Bảo toàn canon | Không sửa file nào trong `plugins/eslint-canon`; mirror tiếp tục được sinh từ trust tree |
| Kiểm chứng phụ | Typecheck, production build và 3 GraphQL transport tests đều PASS sau sửa lint |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/blocks/exam/ExamSession`; `src/components/blocks/membership/MembershipCheckoutPanel` | MODIFY — thêm JSDoc cho public contracts/components/meta; tách connected props khỏi kiểu tham số inline |
| `src/components/composites/ExamPaperCard`; `src/components/layouts/MiaMiaAppLayout`; `src/components/leaves/SingleChoice` | MODIFY — mô tả public API, action/data contracts và architecture metadata |
| `src/components/overlays/app`; `src/components/overlays/membership`; `src/components/pages/ExamCatalogPage`; `ExamSessionPage` | MODIFY — thêm JSDoc và named connected props, không đổi hành vi runtime |
| `src/hooks/swr` và `src/modules/api/graphql` trong boundary thi thử | MODIFY — thêm JSDoc cho export; mutation options chuyển thành type có tên |
| `src/components/contracts/index.ts` | MODIFY — bỏ `bg-surface` khỏi hai entry `exam-question-card` và `exam-answer-review-list`; ground đã thuộc surface owner |
| `eslint.config.mjs` | MODIFY — code canon sinh tự động vẫn chạy trong Node nhưng không bị rule trình bày của app sửa quote fixture hoặc regex đã được kiểm thử tại trust tree |
| `plugins/eslint-canon` | UNCHANGED BY HAND — `gate:canon` chỉ đồng bộ mirror từ trust tree và xác nhận khớp |

### VERIFICATION

| Gate | Result |
|---|---|
| Targeted ESLint gồm `src/components/contracts/index.ts` và toàn boundary MiaMia mới | PASS — 0 lỗi |
| `npm run lint` | PASS — canon mirror gate PASS; ESLint exit 0 |
| `npm run typecheck` | PASS |
| `npm run build` | PASS — gồm `/[lang]/exam` và `/[lang]/exam/[slug]` |
| 3 GraphQL tests mới | PASS — 3 files, 3 tests |
| `git diff --check` | PASS |
| Workflow validator | Record MiaMia không có lỗi; validator toàn root vẫn FAIL do các record lịch sử StarCi/Nivo ngoài boundary đã được liệt kê từ trước |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Phần lint đã hoàn tất trong Apply đã duyệt; chưa đóng toàn bộ Apply vì live authenticated flow vẫn còn nợ. |

### WARNINGS

| Warning | Impact |
|---|---|
| ESLint còn cảnh báo React version chưa khai trong `eslint-plugin-react` settings | Chỉ là warning cấu hình, không tạo lint finding và không làm gate thất bại |
| Full inherited test suite chưa được sửa trong lượt lint này | Trạng thái 13 file test scaffold cũ fail của apply r1 không được tuyên bố là đã giải quyết |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Chạy `eslint --fix` trực tiếp trên `plugins/eslint-canon` | Cấu hình app không áp formatting rules lên fixture/mirror sinh tự động | Mirror sẽ bị ghi đè ở lần sync kế tiếp và không phải source sở hữu |
| Suppress hai contract finding | Bỏ ownership class `bg-surface` khỏi entry sai tầng | Giữ đúng surface ownership thay vì che lỗi kiến trúc |

### OWED

| Owed | Cleared by |
|---|---|
| Documentation/inline-type lint của source MiaMia | CLEARED — targeted ESLint 0 lỗi |
| Trust-generated ESLint drift trong target | CLEARED — `npm run lint` exit 0 mà không sửa mirror bằng tay |
| Login → paper detail → answer → grade → result và Premium checkout request | Chạy lại bằng tài khoản test trên backend 3072; ghi Network/Console và FE/BE terminal vào workflow |
| Đóng Apply | Hoàn tất live authenticated flow proof còn lại rồi append closure evidence |

## apply r3 — live authenticated flow

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | MiaMia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | D:\Repositories\miamia-fe @ codex/miamia-thi-thu |
| Purpose | Chứng minh login, paper detail, làm bài, grade, result và Premium checkout trên runtime thật. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\thi-thu.md |
| Language | vi |
| Phase | apply |
| Touching | Runtime test FE/BE, artifact proof và workflow record; không sửa backend source hoặc secret. |

Applied revision: C-contract-safe-r1

Baseline commit: `72c70f1c1a689b365fcf5c92891039afba4dc2db`

Tracked diff: `72c70f1c1a689b365fcf5c92891039afba4dc2db..worktree`

### LIVE FLOW PROOF

| Flow | Persona | Steps | UI | Network | Console | Terminal | Verdict | Evidence |
|---|---|---|---|---|---|---|---|---|
| Đăng nhập password + OTP | Tài khoản test local `learner@miamia.test` | Mở đề → SignInOverlay → password → OTP → deferred intent | UI hoàn tất OTP, đóng dialog và điều hướng vào đúng slug | `signInInit` và `signInVerifyOtp` trả success envelope; cookie chỉ hoạt động khi FE/API cùng host `localhost` | Không có uncaught error/hydration failure trong cửa sổ flow | Backend 3072 start sạch với runtime override; worker email ở stack hiện thiếu `templates/sign-in-otp.pug`, nên OTP không được gửi thật | failed | Test account được reset bằng Keycloak local 8151; OTP chỉ được lấy từ Redis local để tiếp tục proof, không ghi credential/mã vào record |
| Paper detail → 40 câu → grade → result | Tài khoản test local đã xác thực | Tải `de-so-an-giang-lan-2` → chọn đáp án ở 40 câu → Nộp bài | Runner hiển thị 40/40; result hiển thị `8/40`, skill `grammar 8/40` và review đủ từng đáp án | `paperDetail` và `gradePaper` hoàn tất không có GraphQL error hiển thị; result chỉ xuất hiện sau success envelope | Không có error mới; còn warning scaffold `PressResponder ... without a pressable child` | FE routes đều 200; backend instance không ghi exception/stack trace trong cửa sổ grade | passed | Route `http://localhost:3097/vi/exam/de-so-an-giang-lan-2`; cùng một session UI, không mint token ngoài luồng |
| Premium checkout request | Tài khoản test local đã xác thực | Về kho đề → Khám phá Premium → Tiếp tục thanh toán | Overlay hiển thị failure state “Chưa thể tạo phiên thanh toán. Vui lòng thử lại.” | `purchaseMembership` trả failure envelope; không có checkout URL để redirect | Không có uncaught error; failure được block render có chủ đích | Không có backend exception ở instance 3072; PayOS runtime config đang rỗng | blocked | `.stacks/dev/runtime/files/payos-api-key.key` dài 0; `.gitmounts/data/config/app.yaml` để trống `payos.clientId` và `payos.checksumKey`; screenshot `.workflows/.artifacts/designs/miamia/thi-thu/apply-r3/premium-checkout-blocked.png` |

### OUTPUTS

| Concept | Result |
|---|---|
| Thi thử xác thực | Đã chứng minh cùng-origin login, tải đề 40 câu, nộp bài và kết quả chi tiết hoạt động trên runtime thật |
| Premium checkout | UI gửi request và biểu diễn failure đúng, nhưng provider checkout chưa hoạt động do stack chưa có PayOS credentials |
| Stack runtime | `.stacks` đã tồn tại nhưng env generation còn drift; chưa phải một nguồn runtime canonical |
| Apply closure | Chưa đóng vì login email delivery failed và Premium checkout blocked |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/.artifacts/designs/miamia/thi-thu/apply-r3/premium-checkout-blocked.png` | added — ảnh bằng chứng failure state của Premium checkout |
| `.workflows/designs/miamia/thi-thu.md` | modified — append live-flow matrix, stack drift và exact blockers |
| `D:\Repositories\miamia-fe` | unchanged trong r3 — chỉ chạy runtime/browser proof |
| `D:\Repositories\mia-mia-backend` | unchanged trong r3 — chỉ dùng runtime override trên port 3072 |

### NEED APPROVALS

| Question | Options |
|---|---|
| Thầy set PayOS test credentials qua stack rồi báo `done` | Cần đủ `payos API key`, `payos clientId`, `payos checksumKey`; không gửi giá trị trong chat. Trò sẽ restart backend 3072 và chạy lại checkout đến khi nhận URL provider. |

### WARNINGS

| Warning | Impact |
|---|---|
| `.env.override` ghi `KEYCLOAK_CLIENT_ID=academy-web` nhưng Keycloak MiaMia local chỉ provision `miamia-web` | Backend mặc định trả 401 cho login; proof phải override runtime `KEYCLOAK_CLIENT_ID=miamia-web` và đúng secret file |
| `.stacks/dev/runtime/files/keycloak-client-secret.key` không khớp `.gitmounts/data/terraform/keycloak-client-secret.key` | Stack-generated secret hiện không mở được client thật; env generation chưa canonical |
| `prestart` báo thiếu 13 key bắt buộc trong `.env.override` | Stack contract và env consumer đang drift dù nhiều file-secret tồn tại |
| Worker mail thiếu `templates/sign-in-otp.pug` | Người dùng thật không nhận OTP; login proof không thể pass hoàn toàn |
| FE terminal còn `ENVIRONMENT_FALLBACK` và Console còn `PressResponder` warning | Apply chưa có cửa sổ Console/Terminal hoàn toàn sạch |
| Host `127.0.0.1` và API `localhost` làm mất managed-session cookie | Authenticated proof chỉ hợp lệ trên một hostname thống nhất; route test đã chuyển sang `http://localhost:3097` |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Ghi login PASS chỉ vì dialog đóng | Verdict failed cho email delivery và ghi rõ OTP test-local bypass | Live-flow proof yêu cầu UI, Network, Console và Terminal cùng xanh |
| Ghi checkout PASS chỉ vì mutation đã được gọi | Verdict blocked cho đến khi có checkout URL thật | Failure envelope không chứng minh provider session được tạo |
| Vá tay backend `.env.override` hoặc ghi secret vào workflow | Runtime override không secret; chờ stack credentials do thầy set | Backend source/secret nằm ngoài approved FE Apply boundary |

### OWED

| Owed | Cleared by |
|---|---|
| PayOS provider checkout | Set đủ ba PayOS credentials qua stack, restart backend 3072, UI mutation trả checkout URL hợp lệ |
| OTP email delivery | Bổ sung/đóng gói `templates/sign-in-otp.pug` qua backend Plan → Review → Apply và nhận email test thật |
| Canonical `.stacks` env generation | Backend stack workflow sửa client ID, secret ownership và 13 missing-key warnings; chạy `prestart` không drift |
| FE Console/Terminal warnings | Bounded FE fidelity session sửa `ENVIRONMENT_FALLBACK` và `PressResponder`, rồi re-run live flow |
| Đóng Apply | Mọi row LIVE FLOW PROOF đạt `passed` hoặc `not-applicable` có bằng chứng |
