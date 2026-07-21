# INDEX — Layouts (khung/vùng trang · lớp thứ 5 của DS)

> `layouts/` = **cách 1 TRANG được xếp trong KHÔNG GIAN**: shell nào, vùng ở đâu, co giãn ra sao. Nằm giữa
> `foundations` (token) và `components` (đồ đặt vào): foundations = atom · **layouts = KHÔNG GIAN** · components = đồ ·
> `patterns` = flow/recipe TRONG không gian đó · `principles` = luật xuyên suốt.
> Ranh với `patterns/`: **layouts = SHAPE trang** (shell, vùng); patterns = **FLOW/recipe** (form, search-list, data-state, IA-behavior).

## Bắt đầu 1 trang mới (đọc theo thứ tự)
1. **[[surface-job-drives-layout]]** ⭐ — hỏi "bề mặt này làm JOB gì?" → job chọn shell. Feature nhiều-pha ĐỔI shell theo pha.
2. **[[page-shell-selection]]** — cây quyết định chọn shell CỤ THỂ (rail / full-bleed / hub / centered / catalog / landing).
3. **[[region-model]]** — đặt component vào đúng VÙNG (navbar · rail · reading-col · CTA-anchor · workspace-pane…).
4. **[[responsive-regions]]** — vùng co giãn (rail→chips, 2-pane→stack) theo breakpoint.

## Archetype (shell cụ thể)
| Archetype | Job | Shell/route thật | Trạng thái |
|---|---|---|---|
| [[docs-three-pane-reader]] | đọc tài liệu phân cấp | `LearnShell` — `/learn/*` | STUB |
| [[master-detail-rail]] | 1 trục nav + list dài | `Practice` · `SettingsLayout` | STUB |
| [[dashboard-hub]] | nhiều khu cùng identity, đổi bằng tab | `Dashboard` · `PublicProfile` | STUB |
| [[catalog-grid]] | duyệt N item cùng loại | `CourseCatalog` · `JobList` | STUB |
| [[centered-form-setup]] | quyết/nhập 1 tác vụ | `CartView` · `JobPostForm` | STUB |
| [[marketing-landing]] | bán hàng/kể chuyện | `Landing` | STUB |
| **[[full-bleed-work-surface]]** | làm-việc-tập-trung + tool | Mock Interview · challenge solve | ✓ (mới) |
| [[fullbleed-canvas-no-chrome-and-orient-zoom]] | canvas trọn viewport | mind-map | ✓ |
| [[solving-surface-fullbleed-no-course-rails]] | giải-đề tập trung | challenge solve | ✓ |

## Nền (khi nào rail / drawer)
- [[when-rail]] ✓ — test "kiếm được rail" (< 5 item hoặc không có list con → KHÔNG rail).
- [[when-drawer]] (ở `patterns/`) — giấu nội dung phụ sau label → drawer; overlay swap mobile.

## Ghi chú
- 10 archetype/shell vừa dời từ `patterns/` sang đây (2026-07-07) — trước bị xếp nhầm ở patterns; layouts mới là nhà đúng.
- Cụm gộp `page-shell-selection` ⊇ `when-rail` + `solving-surface-fullbleed` + `fullbleed-canvas` (decision-doc đứng trên 3 file case) — xem `README.md`.
- STUB → dày thêm khi có case thật (Áp đầu + route anchor), như các file ✓.
