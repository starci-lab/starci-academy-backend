# Pattern — Search + count + list + pager (anatomy TỐI THIỂU của mọi list surface duyệt-được)

> Shell/route: `CourseCatalog`, `JobList` (grounded đầy đủ ở [[catalog-grid]]) — cũng chính là hình dạng bên trong RAIL của `Practice`/`SettingsLayout` khi rail có search. File này là ANATOMY DÙNG CHUNG cho list KHÔNG cần tile/grid — [[catalog-grid]] là bản đầy-đủ (có grid/line toggle).

## Khi nào dùng
- Bất kỳ list CÓ THỂ DÀI cần lọc/duyệt — kể cả khi không có card/tile (row thuần đủ).

## 4 phần dọc (thứ tự cố định)
1. **Search** — input lọc, debounce ~300-350ms trước khi hit backend, LUÔN reset page về 1 khi query đổi.
2. **Count** — nằm PHẢI cùng hàng search, muted `body-sm shrink-0`, `"Tìm thấy {n}…"` (n = số ĐÃ LỌC, không phải tổng).
3. **List** — mỗi item qua `AsyncContent` (`error → loading → empty → content`); skeleton MIRROR layout thật (không "nhảy" khi resolve).
4. **Pager** — trái-align thẳng mép item. Ẩn khi `totalPages ≤ 1` (`JobList`) HOẶC luôn hiện để UI ổn định khi danh sách chắc chắn sẽ lớn dần (`CourseCatalog`) — quyết theo ngữ cảnh, không có mặc định chung.
- **Filter facet** (optional) — xem §Đính chính bên dưới (facet giờ nằm SAU 1 phễu, không còn riêng-dòng-inline).

## Đính chính (2026-07-17) — facet = FUNNEL POPOVER cạnh search, KHÔNG còn hàng chip inline

Rule cũ (facet mỗi cái 1 `FlexWrapButtonRadio` RIÊNG DÒNG giữa search-row và list) **RETIRED**. Thầy chỉ tay vào
"Lịch sử giải bài" (`/vi/profile/<user>/skills`) 2026-07-17: *"không kiểu này, chuyển thành funnel hết nhé … kiếm các
chỗ khác sửa luôn đi"*. Hàng chip inline làm toolbar phình cao theo số facet + số giá trị; **chuẩn mới = 1 phễu** giữ
toolbar đúng 1 dòng bất kể bao nhiêu facet.

**Anatomy toolbar chuẩn** (nguyên mẫu: `ProfileChallengeManage`):
- 1 hàng: `SearchInput` (`flex-1`) + `Button isIconOnly variant="ghost"` bọc `FunnelIcon` (phosphor) + count muted `shrink-0` bên phải.
- Funnel có **≥1 facet đang active** → bọc `Badge.Anchor` + `Badge size="sm" color="accent" placement="top-left"` = `activeFacetCount`.
- Bấm phễu mở `Popover.Content w-72` → mỗi facet 1 khối `flex flex-col gap-2`: heading `Typography body-xs muted` + `FlexWrapButtonRadio` (vẫn dùng — chỉ ĐỔI CHỖ ĐẶT, từ inline → trong popover). `all` = giá trị xoá facet.
- Cuối popover: `Button variant="danger-soft" size="sm"` "Xoá bộ lọc" chỉ hiện khi `activeFacetCount > 0` (clear CHỈ facet, không đụng search).
- Facet options chỉ gồm GIÁ TRỊ CÓ THẬT trong data (`difficultyOptions`/`languageOptions` derive từ list) — phễu rỗng thì không render.

**Đã áp:** `ProfileCoding` (solve history) · `JobList` (workMode/employmentType) — 2026-07-17. **Đã sẵn funnel:**
`FlashcardQuizHistory` · `MockInterviewHistory` · `ProfileChallengeManage`. **KHÔNG áp cho SETUP config**
(`QuizSession`/`MockInterviewSession` chọn độ khó/loại trước khi bắt đầu = lựa chọn tạo mới, không phải lọc-1-list) —
inline `FlexWrapButtonRadio` ở đó GIỮ NGUYÊN.

## Liên quan
[[catalog-grid]] (bản đầy-đủ, có grid⇆line) · [[layout-must-funnel-to-courses-and-cover-full-data-state-matrix]] (ma trận rỗng/1/N/overflow) · [[asynccontent-remove-debug-hold]] (AsyncContent priority) · list, input (component canon) · [[page-shell-selection]].
