# Pattern — Centered form/setup (1 cột hẹp, không rail, review→action→CTA)

> Shell/route: `CartView` (`src/components/features/cart/CartView/index.tsx`, route `/cart`) — review đơn hàng + checkout CTA. `JobPostForm` (`src/components/features/careers/Jobs/JobPostForm/index.tsx`, route `/jobs/post`) — multi-section RHF form. `/checkout` cùng họ (review + payment).

## Khi nào dùng
- 1 tác vụ TẬP TRUNG (review đơn hàng, điền form, setup 1 phiên) — không cần nav phụ, không duyệt list dài song song. ≥2 cách nhập cho cùng field (dán/upload) vẫn giữ 1 cột — xem input component §6.

## Region map
1. **`PageHeader`** (title + description; KHÔNG breadcrumb-chain nếu là leaf tác-vụ — xem header component §3, back-link).
2. **Body** — `mx-auto max-w-2xl`/`max-w-3xl`, `gap-10` (header→content) rồi `gap-6`/`gap-3` nội bộ:
   - **Review/summary** (`CartView`: `SurfaceListCard` các dòng + tổng tiền `PriceTag`) HOẶC **section theo NGHĨA** (`JobPostForm`: `LabeledCard` mỗi nhóm field — company/position/apply-method — KHÔNG 1 card/field, ref card component §6).
   - **CTA cuối** — primary `size="lg" fullWidth` + secondary/tertiary phụ dưới (huỷ, xoá giỏ…).
3. **Success THAY layout** — khi form LÀ 1 trang (không phải modal), submit xong render `SubmitSuccess` thay hẳn form, KHÔNG toast (`JobPostForm`).
4. **Empty/gate thay body** — `CartView` giỏ rỗng → funnel "Duyệt khóa học"; `JobPostForm` chưa đăng nhập → thông báo tĩnh, ẨN form (không render form disabled).

## Liên quan
[[form-flow]] (validate/disable/autosave BÊN TRONG form) · [[layout-must-funnel-to-courses-and-cover-full-data-state-matrix]] (rỗng = funnel, không ngõ cụt) · card component §6 (gộp section theo nghĩa) · [[page-shell-selection]].
