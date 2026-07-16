# Element — Rating bar (block `RatingBar`)

> Element doc cho thang chấm SM-2 (Again→Easy). Đây là 1 trường hợp CỤ THỂ của quy tắc "hàng nút THANG"
> đã chốt ở [[button]] §7 — file này tả riêng component thật render nó.

## Khi nào dùng
- Người học chấm ĐỘ NHỚ LẠI 1 flashcard sau khi lật đáp án (spaced-repetition, SM-2 grade 0-3) → `RatingBar`,
  KHÔNG tự dựng 4 `Button` variant khác nhau ở feature.

## Quy tắc
- **Tile PHẲNG trung tính + CHẤM semantic, KHÔNG fill pastel cả ô.** Mỗi ô = `bg-surface border rounded-xl`
  (KHÔNG `rounded-3xl` blob); thang nghĩa yếu→mạnh (Quên=`danger` · Khó=`warning` · Được=`success` · Dễ=`accent`)
  sống ở 1 **chấm nhỏ** `size-2 rounded-full bg-token` cạnh label — GIỮ quét-4-bậc mà không rainbow đồ chơi. Ô
  mạnh nhất (`Dễ`/accent) có thể `border-accent/40` nhẹ; còn lại `border-default`.
- **KHÔNG icon mặt-cười / không gamify hời hợt** — grader spaced-repetition là CÔNG CỤ, không phải sticker
  ([[learning-surface-grounded-in-pedagogy-not-superficial-gamify]]). Reinforce bằng chấm màu + phím tắt, không
  emoji.
- **Phím tắt 1–4** (badge `kbd` góc phải, `border-default text-muted`) + `window` keydown → chấm nhanh không cần
  chuột (Anki/RemNote affordance). Bỏ qua khi `isPending` hoặc focus trong input.
- **Plain `<button>`, KHÔNG HeroUI `Button`** — Button bake variant nền unlayered sẽ ĐÈ surface/border tự set
  qua className (cùng gotcha unlayered ở [[card]] §3e/§3f).
- Equal-width lấp ô: `grid grid-cols-2 sm:grid-cols-4` (mobile 2×2, desktop 1 hàng 4). Hover lift
  `-translate-y-0.5 hover:shadow-surface`, focus-ring accent (KHÔNG `border-strong` — token đó không có trong
  app HeroUI; border neutral giữ nguyên, lift+shadow gánh hover).
- `{ options: {grade, label, hint?}[], onRate, isPending? }` — `hint` (preview khoảng ôn tiếp theo, vd
  "< 10 phút / 1 ngày") render dưới label, `text-muted`. `isPending` disable CẢ 4 ô (tránh double-submit).
- Labels/hint tới từ CALLER đã dịch (`t(...)`) — block không tự `useTranslations`.

## Đính chính (2026-07-11 — "phèn" polish)
Bản 2026-07-09 chốt **fill pastel cả ô** (`bg-token/10 text-token`) + **icon mặt-cười** (`Smiley*`) "để quét nhanh
hơn màu". Khi so trên màn thật, thầy: *"phèn quá"* — 4 blob cầu vồng + mặt cười đọc như app trẻ con, nghịch
principle "không gamify hời hợt". → đổi sang tile trung tính + chấm màu + phím tắt (bản trên). Giữ nguyên: thang
nghĩa yếu→mạnh, plain-button, grid, isPending, hint-slot.

> Block: `blocks/buttons/RatingBar`

## Liên quan
- [[button]] §7 (nguyên tắc chung "hàng nút thang") · [[card]] §3e/§3f (cùng gotcha unlayered-vs-tint) ·
  [[learning-surface-grounded-in-pedagogy-not-superficial-gamify]] (vì-sao SM-2 chấm bằng grade rời, không
  điểm liên tục).
