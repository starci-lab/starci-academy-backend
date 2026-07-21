# Foundation — Elevation (shadow)

> 3 tầng shadow thật, bake trong `@heroui/styles` (KHÔNG phải token app tự định nghĩa) + 1 luật đảo-chiều
> app đã chốt cho `Card`.

- **3 tầng `*-shadow` (light mode có giá trị thật):** `--surface-shadow`/`shadow-surface` (card/surface nghỉ)
  ≈ `--field-shadow`/`shadow-field` (input/field nghỉ) — cùng độ nhẹ (blur ~4px) — nhẹ hơn
  **`--overlay-shadow`** (popover/dropdown/tooltip/modal-content — 3 layer, blur tới 28px + 1 lớp "hắt" âm)
  = tầng NỔI CAO NHẤT. Chọn theo VAI: đứng nghỉ trên trang → surface/field; nổi TRÊN mọi thứ khác (floating
  layer) → overlay.
- **DARK MODE: `--surface-shadow`/`--field-shadow` = `0 0 0 0 transparent inset`** (vô hình). Card/field lồng
  nhau ở dark KHÔNG thể phân tách bằng shadow → phải dùng **border**. Đây là gốc của luật "surface-in-surface
  → border, không double-fill" ([[card]] §0/§4, [[input]] §8b). `--overlay-shadow` (dark) đổi chiến lược: 1
  inset highlight trắng mờ thay drop-shadow — floating layer ở dark "sáng viền" thay vì "đổ bóng".
- **App override (2026-06-30, [[card]] §0):** `.card{border:none!important}` — top-level Card dùng
  `shadow-surface` làm elevation DUY NHẤT (bỏ border). Nested/surface-in-surface vẫn cần border (mục trên,
  vì shadow chết ở dark) → **quy tắc chọn: top-level = shadow · nested = border**, KHÔNG bao giờ 2 lớp fill
  chồng nhau.
- **KHÔNG tự chế `shadow-[...]` tuỳ ý** cho 1 block muốn "nổi" — dùng đúng 1 trong 3 utility trên theo vai
  (surface/field/overlay) để giữ shadow-language nhất quán toàn app.

> Nguồn: `@heroui/styles/dist/themes/default/variables.css` (`--surface-shadow`/`--field-shadow`/
> `--overlay-shadow`, light vs `.dark`) + `globals.css` `.card{border:none!important}` / `.card--transparent`.

## Liên quan
- [[card]] §0 (đảo chiều border→shadow) · [[input]] §8b (field lồng trong card = bỏ shadow) · [[radius]]
  (concentric, cùng họ "nested surface").
