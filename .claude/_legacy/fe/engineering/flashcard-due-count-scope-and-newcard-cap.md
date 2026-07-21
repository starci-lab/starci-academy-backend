# Concept — "Đến hạn hôm nay" (daily SRS queue) PHẢI có BIÊN: scope đúng phạm vi + cap thẻ-mới/ngày

> Heuristic biz/engineering (họ `concepts/*`, flashcard SRS). Rút từ vụ "449 thẻ đến hạn hôm nay" cho user mới.

## Luật (STRICT)
- **Meter/queue "đến hạn hôm nay" (daily SRS) KHÔNG được đổ toàn bộ never-reviewed backlog vào "hôm nay".** Phải có 2 biên:
  1. **Scope đúng phạm vi đang xem** — query đếm/duyệt due phải filter theo course đang mở (`deck.course_id`), KHÔNG đếm due của MỌI deck MỌI course toàn hệ thống. Trang 1 course → chỉ thẻ course đó. (Global chỉ cho dashboard, và vẫn cap.)
  2. **Cap thẻ-mới/ngày (Anki-style)** — tách "due" = (a) overdue reviews (`due_at <= now()`) + (b) thẻ mới (`review.id IS NULL`) GIỚI HẠN `min(new, DAILY_NEW_LIMIT)` (vd 20). Queue: overdue trước rồi fill new (capped).
- **Never-reviewed ≠ "đến hạn hôm nay"** — nó là "thẻ mới chờ học". Tách/cap, đừng gộp thành 1 con số "đến hạn" khổng lồ.
- **Tách "mới" vs "ôn lại đến hạn" ở count/UI:** trả riêng `dueReviewCount` (overdue) + `newCount` (chưa ôn, đã cap) → "X ôn lại · Y mới" (user mới: 0 ôn-lại + N mới = rõ nghĩa, không hoảng).
- **Sửa điều kiện due NHẤT QUÁN mọi nơi tính due** (top count/queue + per-deck dueCount) — cùng 1 định nghĩa biên, không lệch chỗ này chỗ kia.

## Bối cảnh liên quan
- Trầm trọng thêm khi enrollment-join đã gỡ cho trial ([[premium-gate-is-enrollment-not-vip]]) — hết ranh giới enrollment nên scope-by-course thay bằng đó phải làm rõ ràng.

## Liên quan
- [[meter-tracks-out-of-box-default-target]] (meter phải có mẫu số/biên có nghĩa) · [[fair-monetization-axiom]] (count-based signal phải bounded/công bằng).
