# Concept — MỌI interactive element PHẢI có hover state + `cursor-pointer`

> Heuristic (họ `concepts/*`). Rút từ hàng summary "Cài đặt chấm điểm" (mở drawer) không có affordance hover → trông tĩnh, user không biết bấm được. **KIỂU hover** (underline / opacity / fill) → xem [[hover-style-matches-clickable-nature]] (bản đầy đủ); luật này nói MỌI interactive PHẢI có hover.

## Luật (STRICT)
- **TẤT CẢ interactive element phải có hover state + `cursor-pointer`.** Bất cứ thứ bấm/mở/điều-hướng được (button, row mở drawer, link, chip bấm) phải có phản hồi hover VÀ con trỏ tay (`<button>` native KHÔNG tự có `cursor-pointer` → phải thêm). Không hover/cursor = trông tĩnh = lỗi UX.
- **Hover kích bằng CẢ element, không chỉ chữ.** Bọc `group`, hiệu ứng con đặt `group-hover:*` → rê chuột vào BẤT KỲ ĐÂU trong element đều trigger. CẤM `hover:*` trực tiếp lên mỗi text con (chỉ hover khi trúng text — sai).
- **Hàng/khối đóng vai LINK → hover = underline nhãn** (không đổi màu cả khối; ref [[hover-style-matches-clickable-nature]] mode go-there). Phần **read-only/preview cạnh** (vd "TypeScript · main" + caret) giữ `text-muted`, KHÔNG đổi màu khi hover (không phải cái user bấm).
- **Caret/meta của row** đặt phải (`justify-between`), tách nhãn bằng `≥gap-2`, KHÔNG dính sát.

## Liên quan
- [[hover-style-matches-clickable-nature]] (KIỂU hover theo bản chất) · [[elements/label]] §2 (summary-row + caret) · [[gap]].
