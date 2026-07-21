# Concept — Nút "Tiếp tục/Resume" chỉ hiện khi ĐÃ RỜI vị trí đang dở

> Heuristic (họ `concepts/*`). Rút từ rail content-map: nút "Tiếp tục học" hiện MÃI kể cả khi đang đọc chính bài đó (2026-06-24).

## Quy tắc (STRICT)
- **CTA "Tiếp tục/Resume" (nhảy về task đang dở) chỉ hiện khi người dùng ĐANG KHÔNG ở task đó.** Khi đang xem đúng `currentTask` → ẩn (nút sẽ chỉ trỏ về chính trang hiện tại = vô nghĩa). Điều kiện: `continueHref && currentTask?.id !== activeContentId`.
- **Vì sao:** resume là "đưa tôi về chỗ bỏ dở". Nếu tôi đã ở đó thì không có gì để resume → nút thừa, gây nhiễu (đặc biệt khi nó là 1 CTA bự sticky đáy rail). Affordance chỉ xuất hiện khi CÓ tác dụng.
- **Tổng quát:** mọi CTA dạng "đưa tới X" nên **ẩn khi đang ở X**. Đừng render hành động no-op chỉ vì data (currentTask) tồn tại — gate theo "có khác vị trí hiện tại không".

## Áp đầu (2026-06-24)
- `ContentMap` (rail content-map lesson reader): `OutlineRail` header `continue` = undefined khi `currentTask?.id === activeContentId`. Trước đó hiện mãi (gate chỉ theo `continueHref`).
