# Pattern — Chọn SHELL trang: rail vs full-bleed vs hub vs centered (quyết định TRƯỚC khi chọn archetype cụ thể)

> Decision doc tầng 1 — hỏi theo thứ tự dưới TRƯỚC khi mở 1 route mới, rồi rẽ vào archetype cụ thể ([[docs-three-pane-reader]] · [[master-detail-rail]] · [[dashboard-hub]] · [[catalog-grid]] · [[centered-form-setup]] · [[marketing-landing]]). Gom 3 luật rời [[when-rail]] · [[solving-surface-fullbleed-no-course-rails]] · [[fullbleed-canvas-no-chrome-and-orient-zoom]] thành 1 cây quyết định — 3 file đó GIỮ NGUYÊN làm chi tiết/case-by-case, KHÔNG bị thay thế (candidate gộp khi `/merge`, xem `patterns/INDEX.md`).

## Cây quyết định (hỏi tuần tự, dừng ở câu ĐẦU khớp)
1. **Canvas/tool chiếm TRỌN viewport, cần tập trung 1 việc** (mind-map, giải 1 challenge)? → **full-bleed**, bỏ mọi rail/chrome/breadcrumb. Ref [[fullbleed-canvas-no-chrome-and-orient-zoom]] (canvas) · [[solving-surface-fullbleed-no-course-rails]] (giải-đề, giữ 1 back-link).
2. **Có 1 TRỤC NAV + list ĐỦ DÀI (≥~5 item) cần duyệt song song với nội dung?** → 2-pane rail. Rẽ tiếp: có thêm 1 pane TOC/outline thứ 3 bên phải (đọc tài liệu nhiều tầng, trong `LearnShell`) → [[docs-three-pane-reader]]; chỉ 2 pane (rail + work pane, route standalone) → [[master-detail-rail]]. Ref [[when-rail]] (test "kiếm được rail" — < 5 item hoặc không có list con thật thì KHÔNG rail).
3. **Nhiều KHU nội dung ngang hàng cùng 1 identity/scope, đổi bằng TAB (không phải nav phân cấp)?** → [[dashboard-hub]] (tab strip navbar bottom-layer + 2 cột bare-identity/panel).
4. **Duyệt/browse N item CÙNG LOẠI (course, job, deck)?** → [[catalog-grid]] (search + count + grid/line toggle + pager); item không cần tile hoá → xem anatomy tối thiểu [[search-filter-list-surface]].
5. **1 tác vụ/form tập trung, không cần nav phụ** (checkout, cart, post-form, setup phiên)? → [[centered-form-setup]] (1 cột, không rail).
6. **Bán hàng/kể chuyện công khai, không đăng nhập?** → [[marketing-landing]].
- Không khớp câu nào → mặc định **centered 1 cột `max-w-3xl mx-auto`** (an toàn nhất — [[when-rail]] §"DEFAULT = KHÔNG rail").

## Anti-pattern (đã bắt được trong app thật)
- Rail RỖNG vì mode chỉ 2-3 lựa chọn (không phải list) → bỏ rail, xem [[when-rail]] §Bẫy.
- Full-bleed còn sót breadcrumb/page-chrome → mất định nghĩa "full-bleed".
- Dashboard-hub tự dựng lại rail nav thay vì tab strip cho việc "đổi khu nội dung" (đó là câu hỏi 3, không phải câu hỏi 2).

## Liên quan
[[when-rail]] · [[when-drawer]] · [[solving-surface-fullbleed-no-course-rails]] · [[fullbleed-canvas-no-chrome-and-orient-zoom]] · [[docs-three-pane-reader]] · [[master-detail-rail]] · [[dashboard-hub]] · [[catalog-grid]] · [[centered-form-setup]] · [[marketing-landing]] · [[search-filter-list-surface]].
