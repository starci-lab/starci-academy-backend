# Concept — "Element trơn/nhạt/mất màu" = BUG token CSS chưa định nghĩa, KHÔNG phải vấn đề UX → fix token, đừng redesign

> Heuristic debug-first (họ `concepts/*`). Rút từ heatmap contribution "hồng trắng trơn" (2026-06-22) — gốc chỉ là token `--heat-*` chưa khai. Bổ trợ [[scrollbar-gutter]] (bug layout ≠ re-render).

## Quy tắc (STRICT)
- **Khi 1 element render "nhạt/trơn/mất màu", NGHI BUG TRƯỚC khi nghĩ redesign.** Soi computed style / token thật: rất hay gặp `bg-[var(--xxx)]` mà `--xxx` **chưa được định nghĩa** trong `globals.css` → CSS var vô hiệu → nền trong suốt → "trơn". Đây là lỗi 1 dòng, KHÔNG phải lỗi UX. Sửa token là xong; đừng đập đi xây lại layout.
  - Vd `ContributionCalendarView` tô ô bằng `--heat-0..4` nhưng globals chưa khai → fix = thêm thang `--heat-*` (ramp, `--heat-0 = var(--default)` track rỗng, light+dark). Heatmap full-year + drag + year-switcher GIỮ NGUYÊN.
- **Đừng nhiễu "than phiền hiển thị" thành "yêu cầu redesign".** Thầy nói "trơn" = "sao nó mất màu", KHÔNG phải "đổi bố cục". Chẩn đoán nguyên nhân hiển thị trước; chỉ redesign khi vấn đề thật sự là IA/luồng, không phải style bug.
- **Element rỗng (0 data) VẪN render khung** (không thay bằng message) — một khi token track có màu thật thì lưới rỗng tự nó là empty-state hợp lệ (giống GitHub khi chưa commit). Rỗng ≠ ẩn; render có nghĩa.
- **Token bug sửa ở globals.css là fix HỆ THỐNG:** 1 component dùng token đó ở nhiều nơi → định nghĩa token 1 chỗ chữa cho mọi nơi. Đừng vá màu lẻ ở feature.
- **Token hay bị mất khi globals bị rewrite/parallel-edit** → khi đụng, kiểm bằng grep (vd `--heat` phải xuất hiện đủ số light+dark). Tailwind v4: `bg-[var(--heat-N)]` arbitrary chỉ cần var định nghĩa ở `:root`/`.dark`, KHÔNG cần khai trong `@theme`.

## Liên quan
- [[scrollbar-gutter]] (giật giật = bug layout CSS, không phải re-render — cùng họ "nghi bug đơn giản trước khi đổi lớn") · [[progress-block-growing-quantity-headline-not-vanity-strip]] (meter rỗng vẫn render có nghĩa).
