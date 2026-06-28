# Draft — `secondary` = nút phụ ĐỨNG CẠNH primary; nút phụ ĐỨNG MỘT MÌNH (không cạnh primary) = `tertiary` (foreground, quiet) (2026-06-28)

- File/§ đích khi `/merge`: `elements/button.md` (MỚI — chưa có) + liên quan [[primary-cta-icon-size-lg]] (CTA chính = icon+lg) · [[concepts/whitespace-over-dividers]] (design restraint, 1 accent/màn).
- Bối cảnh: panel Cuộc trò chuyện (ContentAiChat) — nút **`+`** (cuộc mới) đứng cạnh ô search, KHÔNG có nút primary nào gần. Thầy: *"nút này nút phụ mà không đứng cạnh primary ⇒ tertiary"* (đang để `secondary` → đổi `tertiary`, màu foreground).

## Luật (STRICT)
- **Chọn variant nút PHỤ theo việc nó CÓ đứng cạnh 1 nút PRIMARY hay không:**
  - **`secondary`** = hành động phụ **CẶP với 1 primary** trong cùng 1 cụm (vd `[Huỷ secondary] [Lưu primary]`, `[Xem lịch sử secondary] [Nộp primary]`). Secondary mượn "sức nặng" của primary cạnh nó để đọc ra "đây là lựa chọn thứ 2 của cùng 1 quyết định".
  - **`tertiary`** = hành động phụ **ĐỨNG MỘT MÌNH**, KHÔNG có primary cạnh bên (vd nút `+` thêm cạnh ô search · nút filter/sort lẻ · nút "Sửa" lẻ trên 1 card · icon-action phụ trong toolbar). Tertiary = quiet (foreground text / ghost-like), không đòi chú ý.
- **Vì sao:** `secondary` (fill xám đậm) đọc như "nửa kia của 1 cặp action" — đặt nó MỘT MÌNH (không primary cạnh) làm nó nặng/ồn vô cớ, hút mắt khỏi nội dung. Một control phụ lẻ nên là tone NHẸ NHẤT (tertiary/foreground). Theo design-restraint + "1 điểm nhấn/màn": chỉ cụm CÓ primary mới được dùng cặp primary+secondary; control lẻ → tertiary.
- **Quyết định nhanh:** nút phụ này có 1 nút **primary** ngay cạnh trong cùng cụm không? → CÓ: `secondary`. → KHÔNG (đứng lẻ / cạnh field / cạnh control trung tính): `tertiary`.
- **KHÔNG nhầm với:** CTA **chính** = `primary` (+ icon + `size="lg"`, [[primary-cta-icon-size-lg]]). `ghost` = trong suốt hoàn toàn (icon-only trong composer/toolbar đã có nền bao). `tertiary` ở đây = nút phụ lẻ trên nền surface, muốn foreground rõ mà vẫn quiet.

## Áp đầu (2026-06-28)
- `ContentAiChat` view Cuộc trò chuyện: nút `+` (cuộc mới) cạnh ô search → `variant="secondary"` → **`tertiary`** (đứng lẻ, không primary cạnh). Search field `flex-1` full-width, nút `+` `tertiary` foreground bên phải.
