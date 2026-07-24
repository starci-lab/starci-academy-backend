# STEP 3 (audit) — WORKFLOW Sonnet DỰNG thật theo plan reuse-first + GHI KINH NGHIỆM

Chỉ chạy **sau khi thầy duyệt diff step 2**. Đây là bước DUY NHẤT sửa code thật. Lane NẶNG (nhiều agent) → chỉ chạy khi thầy chủ động; ≤2 workflow nặng song song (memory `feedback-v2-workflow-cost-control`).

## A. Cắm Workflow — mỗi node build = 1 agent Sonnet
- **1 agent / node** trong danh sách việc step 2 (MODIFY · ADD-STORY · EXTRACT · NEW). Code chạy **Sonnet** (`model:'sonnet'`) — spec khó đã chốt ở step 1–2, Sonnet xúc.
- **parallel** cho các node đụng file RỜI (mỗi story 1 folder); node **assembly trang** (ghép block) chạy SAU (pipeline/sequential) vì phụ thuộc.
- Mỗi agent prompt PHẢI tự chứa:
  1. **Canon**: đọc `<BE>/.claude/fe/principles.md` §6c (4 tầng) · §11 (leaf/state) · §10 (spacing) · §9 (Typography). Tuân REUSE-first (§A2 s2-diff).
  2. **Quyết định reuse** từ step 2 (vd "LessonRow = ListRow config, ĐỪNG đẻ component").
  3. **Nguồn port**: đường dẫn src component (`$FE_SOURCE/src/...`) để lấy API/hành vi.
  4. **Đích**: `$FE_SOURCE/.storybook/stories/blocks/<path>/<Name>.stories.tsx` (+ `.tsx` nếu NEW/EXTRACT).
  5. **Convention**: ĐỌC 1 story anh-em trước (`meta`+`tags:["autodocs"]`, render trong khung div). Phủ ĐỦ states đã chốt. **Naming theo `.claude/fe/storybook-naming.md`** (thầy chốt 2026-07-24): `title` = `Tier/Family/Component[/Variant]`, **Family số NHIỀU** (Cards·Buttons·Chips·Lists·Forms·Stats·Texts), display `name:` **full English** (KHÔNG tiếng Việt). Dựng mới đừng đẻ thêm vi phạm.
  6. **Verify**: `cd $FE_SOURCE && npx tsc --noEmit` → report PASS/FAIL. ⚠️ **tsc CHƯA ĐỦ cho Storybook** (bài học 2026-07-24): `\"` escape là TS hợp lệ nên tsc lọt, nhưng **SWC của Storybook reject** → 1 file vỡ kéo sập CẢ preview bundle, mọi story mới không index. → tránh `\"` trong string (dùng nháy đơn/‹›); nếu nghi, kiểm `curl -s localhost:6006/index.json | grep <title>` hoặc grep `sb.log` có `ERROR in`. **Không tự đánh DONE khi tsc đỏ** (memory `feedback-dont-mark-done-without-real-verify`).
  7. **Gotcha store-coupled**: component đọc redux/SWR (vd `LearnBreadcrumb`) → story cần decorator store; nếu không render standalone được → report `BLOCKED` + lý do, ĐỪNG đẻ story vỡ.

## A2. ⭐ LUÔN có node ASSEMBLY tầng LAYOUT/OVERLAY (thầy chốt 2026-07-24)
Dựng xong các block con CHƯA đủ — **phải ghi cả story tầng đỉnh** để trang/overlay xuất hiện đúng category Storybook:
- Page → `title: "Layouts/<Name>"` · overlay → `title: "Overlays/<Name>"` (category top-level, cạnh Primitives/Design/Block).
- Là **leaf TĨNH presentational**: component port ghép các block ĐÃ port với **demo data**, KHÔNG mount bản feature store-coupled (giống `Overlays/ContentAiChatDrawer`). Không cần mock store.
- Dùng `BlockAnatomy` (name·tier·leaf·parts·reason) liệt kê block node của leaf. **Lưu ý `AnatomyTier` chỉ có `primitive|design|block`** (chưa có `layout/overlay`) → tầng đỉnh tạm `tier="block"` như overlay (gap canon, nêu ở lessons).
- 1 leaf + STATE: biến thể (trial/paid, empty) là story cùng leaf, KHÔNG đẻ leaf mới (§11f).

### ⭐ A2.2 — LAYOUT phải render ĐỦ MỌI MÀN (thầy chốt 2026-07-24)
Render responsive là **việc của layout** — story layout/overlay BẮT BUỘC có 1 story `Responsive` phủ mọi breakpoint.
- App này **container-query** (`@app-*`, KHÔNG viewport media) — breakpoint pin theo px: `@app-sm`=640 · `@app-md`=768 · `@app-lg`=1024 · `@app-xl`=1280; **dưới 640 = mobile/xs**. → **viewport addon vô dụng**; phải render trong `@container` width cố định để layout đo width ĐÓ.
- Pattern: mỗi màn = 1 `<div className="@container ..." style={{width: N, maxWidth:"100%"}}>` bọc layout, stack + label (xs 375 · sm 640 · md 768 · lg 1024). Layout tự re-lay-out theo `@app-*` variants của các block bên trong.
- KHÔNG bọc BlockAnatomy trong story Responsive (1 render/màn; badge để story anatomy lo — nhiều `data-anat-part` trùng = loạn badge).
- ❌ bài học 2026-07-24: workflow dựng đủ 6 block CourseContents nhưng QUÊN story `Layouts/CourseContents` → trang không hiện ở Storybook. Node assembly là bắt buộc, không phải "việc còn lại".

### ⭐ A2.1 — LUẬT `data-anat-part` (badge số) — BẮT BUỘC mọi story dùng BlockAnatomy
BlockAnatomy vẽ badge số bằng `box.querySelectorAll("[data-anat-part]")` rồi map **giá trị attribute → tên part** (khớp CHÍNH XÁC `parts[].name`). Không gắn `data-anat-part` = **không có badge** (chỉ có legend text) → thầy soi thấy "sao không có badge như overlay".
- Mỗi `name` trong `parts` (kể cả `children` lồng) PHẢI có 1 element mang `data-anat-part="<đúng name>"` trong render.
- Block port CÓ prop `anatPart`/`showAnatomy` (vd ChatThread) → truyền thẳng. Block KHÔNG có (PageHeader/Callout/ContinueCard/SurfaceListCard…) → **bọc wrapper KHÍT** `<div data-anat-part="Name">…</div>` (box block-level trùng part, không xô layout — §BlockAnatomy "no wrapper shift" là lý tưởng, wrapper khít là chấp nhận được).
- ⚠️ **Wrapper phải BLOCK-level, KHÔNG `<span>` inline** (bài học 2026-07-24): badge highlight = `ring-2` (box-shadow) trên phần tử **inline** render VỠ (sliver rời) + bounding box lệch → badge sai chỗ. Dùng `<div data-anat-part className="w-fit">` (hoặc `inline-block`), không `<span>`.
- Part chỉ render ở 1 STATE (vd Callout/TrialStrip chỉ khi trial) → wrapper cũng conditional; story `paths` state paid FILTER bỏ part đó (`parts.filter(p => p.name !== …)`) để không có badge mồ côi.
- ❌ bài học 2026-07-24: `Layouts/CourseContents` render đúng nhưng QUÊN `data-anat-part` → 0 badge, khác hẳn `Overlays/*` (có `anatPart`). Đây là luật strict, không phải tuỳ chọn.
- **`storyId` cho từng part** (thầy chốt 2026-07-24): mỗi `AnatomyNode` nên kèm `storyId` (id story/docs của component ref đó — lấy `curl -s localhost:6006/index.json | grep -oiE "\"[a-z0-9-]*<name>[a-z0-9-]*--(overview|<story>)\""`) → BlockAnatomy render badge + tên part thành link `<a target="_top">` nhảy tới story ref để soi. Thiếu storyId → badge chỉ spotlight, không nhảy được.
- **BlockAnatomy render bằng HeroUI** (thầy chốt 2026-07-24): Tabs (`variant="primary"` + `className="w-fit"`) · Chip (badge/tier, label `text-xs`=12px) · Table (legend, cell `text-sm`) · icon Phosphor `size-5`. Panel KHÔNG border ngoài.

## B. Ghi KINH NGHIỆM (phase cuối — bắt buộc)
1 agent tổng hợp kết quả các agent build → viết `$FE_SOURCE/.artifacts/decompose/<ui>.step3-lessons.md`:
- Node nào dựng trơn / node nào BLOCKED (store-coupled, API thiếu…) + cách xử.
- **Pattern tái dùng phát hiện được** (vd "mọi row = ListRow", "biến-thể-chrome = prop") → **đề xuất bổ sung canon** (KHÔNG tự ghi `principles.md`; nêu để thầy chốt).
- Gotcha convention (decorator store, autodocs, framing div) để lần sau nhanh hơn.

## C. STOP → báo thầy soi mắt
- **RESTART Storybook trước khi báo** (bài học 2026-07-24): Storybook đang chạy **không re-scan file story MỚI** (chỉ HMR file cũ) → kill PID trên :6006 + `npm run storybook` lại, rồi `curl localhost:6006/index.json | grep <title mới>` xác nhận ĐÃ INDEX. Không restart = thầy mở ra "không thấy story đâu".
- Báo: node nào PASS/FAIL/BLOCKED, file đã tạo/sửa, link Storybook :6006, + file lessons. **Không đánh ✅ khi chưa verify index thật / chưa thầy soi.**

## Ràng
- Workflow KHÔNG git destructive (memory `feedback-workflow-no-destructive-git`); chỉ tạo/sửa file, không commit/push trừ khi thầy bảo.
- MODIFY component chia sẻ (vd ContinueCard thêm `variant="plain"`): agent phải giữ story cũ (Hero/Item) không vỡ — verify tsc + đọc story cũ trước.
- Node NEW chỉ khi step 2 đã chốt chức năng khác; mặc định REUSE.
