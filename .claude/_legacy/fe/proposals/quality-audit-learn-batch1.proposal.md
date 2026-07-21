# Proposal — quality-audit-learn batch 1

> Nguồn: `quality-audit-learn.audit.md` (33 finding). Batch này lấy 6 finding **❌ severity cao, đã xác nhận thật** (không phải loại 🔍 cần verify thêm), trải đều 3 trục + nhiều surface. Route đề xuất: tất cả **block-apply** (fix lẻ tại chỗ, không đụng shell/region).

## Finding

### 1. Emoji trong i18n key `courseContents.allDone`
- **Surface:** CourseContents (trang nội dung khoá học)
- **Trục:** i18n
- **Call-site:** `src/components/features/learn/CourseContents/index.tsx:275` — key `courseContents.allDone` trong `src/messages/en.json` + `vi.json`
- **Rule vi phạm:** `content-voice.md` — KHÔNG emoji trong bất kỳ i18n string
- **Fix đề xuất:** Bỏ "🎉" khỏi cả 2 string vi/en; nếu cần biểu tượng ăn mừng → dùng Phosphor icon cạnh text trong component, không nhét vào string.
- **Route:** block-apply
- **Verify:** tsc/lint + preview CourseContents ở trạng thái "hoàn thành 100%" (vi + en).

### 2. Tab bar `LearnMobileTabBar` thiếu focus-visible ring
- **Surface:** LearnShell (điều hướng mobile)
- **Trục:** a11y
- **Call-site:** `src/components/features/learn/LearnShell/LearnMobileTabBar/index.tsx:102-116`
- **Rule vi phạm:** `accessibility.md` — mọi interactive phải có `focus-visible:ring` rõ ràng, tách biệt hover.
- **Fix đề xuất:** Thêm `focus-visible:ring-2 focus-visible:ring-accent` vào className nút tab.
- **Route:** block-apply
- **Verify:** tab qua bàn phím trên mobile-tab-bar, xác nhận ring hiện rõ ở từng tab.

### 3. `MilestoneIndexStrip` dùng Typography+onClick thay vì button semantic
- **Surface:** MilestoneOutline
- **Trục:** a11y
- **Call-site:** `src/components/features/learn/MilestoneOutline/MilestoneIndexStrip/index.tsx:40-55`
- **Rule vi phạm:** `accessibility.md` — affordance phải dùng được bằng bàn phím; `Typography` với `onClick` không tab-focus được, không có role button.
- **Fix đề xuất:** Đổi sang `<button type="button">` bọc nội dung, thêm `focus-visible:ring`.
- **Route:** block-apply
- **Verify:** tab qua bàn phím tới milestone-index-strip, Enter/Space kích hoạt được.

### 4. `E2eBody` toàn bộ copy hardcode + ALL-CAPS PASS/FAIL
- **Surface:** LessonReader (tab E2E)
- **Trục:** i18n
- **Call-site:** `src/components/features/learn/LessonReader/E2eBody/index.tsx:46,54,55-56,66,88`
- **Rule vi phạm:** `content-voice.md` — copy phải qua i18n key (không hardcode); KHÔNG uppercase/ALL-CAPS.
- **Fix đề xuất:** Trích toàn bộ cụm copy (empty-state, title, đếm pass/total, aria-label, status pass/fail) sang key `e2e.*` (vi+en, dịch theo NGHĨA); đổi "PASS"/"FAIL" hoa cứng sang key `e2e.status.pass`/`e2e.status.fail` hiển thị qua CSS capitalize nếu cần, không hardcode text hoa.
- **Route:** block-apply
- **Verify:** preview tab E2E ở cả vi/en, xác nhận không còn chuỗi hardcode/ALL-CAPS.

### 5. Nút settings thiếu focus-visible ở `TaskSubmissionPanel` + `ChallengeView`
- **Surface:** PersonalProject + Challenge
- **Trục:** a11y
- **Call-site:** `src/components/features/learn/PersonalProject/TaskSubmissionPanel/index.tsx:73` và `src/components/features/learn/Challenge/ChallengeView/index.tsx:381`
- **Rule vi phạm:** `accessibility.md` — mọi interactive phải có `focus-visible:ring`.
- **Fix đề xuất:** Thêm `focus-visible:ring-2 focus-visible:ring-accent` vào cả 2 nút settings (cùng pattern, sửa riêng từng file).
- **Route:** block-apply
- **Verify:** tab qua bàn phím tới nút settings ở cả 2 surface (task submission + challenge view), ring hiện rõ.

### 6. `MindMap` node card `w-[300px]` cứng — tràn mobile <360px
- **Surface:** MindMap
- **Trục:** responsive
- **Call-site:** `src/components/features/learn/MindMap/ModuleNode/index.tsx:85` và `src/components/features/learn/MindMap/RootNode/index.tsx:85`
- **Rule vi phạm:** `breakpoints.md` — không magic-number width cứng phá breakpoint scale; `responsive-regions.md` — canvas node phải co giãn theo viewport.
- **Fix đề xuất:** Đổi `w-[300px]` sang `max-w-sm` + `flex-shrink` hoặc responsive width theo breakpoint (`w-64 sm:w-72 lg:w-[300px]`), sửa đồng bộ cả `ModuleNode` và `RootNode`.
- **Route:** block-apply
- **Verify:** `preview_resize` xuống mobile (375px và <360px nếu test được), xác nhận node card không tràn ngang canvas.

## Kết quả apply (2026-07-08)
- **Fix xong (5):** #1 emoji `courseContents.allDone` · #2 `LearnMobileTabBar` focus-visible · #3 `MilestoneIndexStrip` → semantic `<button>` · #4 `E2eBody` trích i18n cụm `content.e2e.*` + bỏ ALL-CAPS (kèm luôn `LessonReader/index.tsx:174` "Sandbox" → `content.tabs.sandbox`, cùng file/cùng lượt) · #5 focus-visible `TaskSubmissionPanel` + `ChallengeView`.
- **Dropped false-positive (1):** #6 MindMap `w-[300px]` — canvas React Flow có `fitView`+`minZoom=0.2` nên tự scale, không tràn thật; width còn khớp hằng số layout `MODULE_CARD_WIDTH` dùng để tính vị trí node khác — đổi CSS ở đây sẽ lệch layout-engine, thuộc phạm vi `ux-apply` nếu sau này cần responsive thật.
- **Verify:** `npx tsc --noEmit` sạch + `eslint` sạch trên toàn bộ file sửa. Browser click-through/resize **CHƯA verify** — port dev server bị 1 session khác giữ lock (`.next/dev/lock`), không khởi được server riêng.
- Đã đánh ✅/dropped tương ứng trong `quality-audit-learn.audit.md`.
