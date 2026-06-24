# Draft — Meta/tiến độ của 1 item thuộc TRONG card của item đó (bounded object), đặt cạnh action (2026-06-21)

- File/§ đích khi `/merge`: `starci-ui.rules` (card/list patterns) + `main.md` §14 heuristics.
- Bối cảnh: redesign card danh sách "Thử thách" (lesson reader). Thầy lần lượt thử: card có separator chia 2 vùng →
  tách 2 card riêng → quay về **1 card**, rồi hỏi "đã thử nằm trong hay ngoài card tốt hơn".

## Luật (STRICT)
- **1 item = 1 card. Mọi thuộc tính của item (kể cả progress cá nhân: "đã thử N lần · điểm cao nhất") sống TRONG
  card đó**, không tách thành card thứ 2, không đẩy ra caption rời bên ngoài. Card là **bounded object** → để mọi
  thông tin của 1 item gọn trong 1 khối thì quét mắt + gom nhóm rõ; chữ rời ngoài card đọc thành "mồ côi", trôi nổi,
  thêm nhiễu dọc giữa các card.
- **Đặt progress cạnh action** ("đang ở đâu → làm gì tiếp"): hàng footer trong card `justify-between` — trái = dòng
  tiến độ muted, phải = 1 nút primary. Nhất quán với chip trạng thái vốn đã ở trong card (cùng họ progress → không
  tách ra). Chỉ cân nhắc để meta NGOÀI card khi cố tình giữ card siêu tối giản (chỉ brief) — mặc định để TRONG.
- **Đừng tách 1 item thành nhiều card** chỉ để "chia khối": tách 2 card phá mental model "1 card = 1 item" + tạo bài
  toán gom nhóm (phải gap-nhỏ trong-item / gap-lớn giữa-item). Muốn chia khối trong 1 item thì dùng vùng nội dung +
  separator TRONG 1 card, không phải 2 card.
- **Icon = motif của loại item, tách khỏi icon ngữ nghĩa khác:** challenge motif = `PuzzlePieceIcon` (puzzle);
  `FlameIcon` chỉ dành cho **độ khó** (cường độ). Đừng để 1 icon (flame) vừa làm motif "thử thách" vừa làm "độ khó".
- Ref: thẻ exercise Exercism / row LeetCode (status + stats cùng card). Liên quan [[one-progress-bar-at-a-time]]
  (progress dùng chip/dòng muted, không thanh per-card) + [[three-tier-page-layout]] (gap nội bộ).

## Gotcha render — HeroUI `<Card>` unlayered đè utility border/bg (2026-06-21)
- **Muốn list "ra nhiều card tách bạch" (mỗi item 1 card có viền) thì ĐỪNG dựa `<Card variant="default">`:** style component
  HeroUI v3 (`.card--default`) là **unlayered** → đè utility `border`/`bg-*` (nằm `@layer utilities`) ⇒ thêm `border border-default`
  / `bg-surface` qua className **KHÔNG ăn** (computed `border-width:0`, card chìm vào nền panel, nhìn như 1 khối liền).
- **Cách đúng:** hoặc dùng block **`PressableCard`** (real `<button>`/`<a>`, `bg-surface` + hover, block sở hữu style — nhưng
  KHÔNG nhét `<button>`/HeroUI Button vào trong vì nested-button invalid), hoặc tự dựng `<div role="button">` với utility
  surface (`rounded-3xl border border-default bg-surface p-4 hover:border-accent focus-visible:ring-2`) — div thường không
  có class `.card` nên utility áp sạch, không phải fight specificity. Đây là cùng họ lesson với
  [[lesson-accordion-contrast-and-size]] (unlayered HeroUI đè utility → chọn cách không đánh nhau specificity, KHÔNG dùng `!`).
- Nếu giữ `<div>` clickable + vẫn cần 1 HeroUI `<Button>` thật bên trong (CTA) → bọc Button bằng `<span onClick=stopPropagation>`
  để click nút không bubble ra onClick của card (tránh double-nav).

## CHỐT 2026-06-21 (thầy duyệt) — card challenge KHÔNG clickable cả khối
- **Card đã có 1 nút action rõ ("Làm") thì ĐỪNG làm cả card clickable.** Thầy: *"bỏ hover cursor cho cái card challenge đi"*.
  → card là **surface tĩnh** (chỉ `border + bg-surface + rounded`, KHÔNG `role=button`/`tabIndex`/`onClick`/`cursor-pointer`/
  `hover:border-accent`/`group-hover:underline`), **chỉ nút footer điều hướng**. Bỏ luôn wrapper `stopPropagation` (không còn
  card-onClick để chặn). Đính chính: [[interactive-needs-hover]] áp cho phần TỬ THỰC SỰ bấm được (cái nút) — KHÔNG bắt
  cả container phải hover khi container không phải target. Whole-card-clickable chỉ dùng khi card KHÔNG có nút action riêng
  (vd row nav thuần). Có nút → nút là affordance duy nhất, card đứng yên.

## ÁP TIẾP 2026-06-25 — flashcard deck list (cùng luật)
- `FlashcardDeckList` (trang Ôn tập `/learn/flashcards`): mỗi deck card trước là `<PressableCard onPress>` (cả card bấm được) + lại CÓ nút "Học" footer → **2 affordance trùng** (cả card lẫn nút cùng `onSelectDeck`). Thầy: *"bỏ pressable button, bắt user phải click vào Học, dùng card thuần"*.
- Sửa: `PressableCard` → HeroUI **`<Card>` thuần** (surface tĩnh: `bg-surface + border + rounded-3xl + no shadow` theo global `.card`), bỏ `onPress` cả-card; **chỉ nút "Học"** điều hướng. Skeleton mirror đúng da mới (`rounded-3xl border border-default bg-surface p-4`, bỏ `bg-surface px-4 py-3` không-viền cũ).
- Nhắc lại nguyên tắc: **card + CTA rõ ràng = card TĨNH, CTA là affordance duy nhất.** Whole-card press CHỈ cho card KHÔNG có nút (row nav thuần). Đừng nhân đôi (cả card + nút cùng action) → vừa thừa, vừa mơ hồ "bấm đâu".
