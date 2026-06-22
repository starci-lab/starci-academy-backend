# Draft — Section `LabeledCard frameless`: empty/onboarding vẫn phải render trong CARD (khớp sibling) (2026-06-21)

- File/§ đích khi `/merge`: `starci-ui.rules` (LabeledCard / empty-state) + `main.md` §7 (AsyncContent/empty).
- Bối cảnh: dashboard overview, khối **"Tiếp tục học"** dùng `<LabeledCard frameless>` (vì khi có data, content là
  lưới ResumeCard tự-frame → tránh card-in-card). Nhưng **empty state** vẽ 1 hộp riêng `rounded-large border p-3`
  → nhìn KHÁC các section anh em (Nhiệm vụ/Đà học/Mục tiêu tuần dùng `<Card>` của LabeledCard). Thầy: *"cái tiếp tục
  học render hơi sai với layout hiện tại"*.

## Luật (STRICT)
- **`LabeledCard frameless` chỉ bỏ frame vì content LÀ card(s).** Khi content KHÔNG còn là card (empty / onboarding /
  1 thông điệp + CTA) → **phải tự bọc 1 `<Card><CardContent>` thật** để khớp khung của các section non-frameless
  cạnh nó. ĐỪNG vẽ hộp `border` một-lần (`rounded-large border p-3`) → khác bo góc/viền/nền/padding với sibling
  = "render sai layout".
- **Quy tắc tổng quát:** trong 1 cột nhiều section cùng cấp, MỌI section phải share đúng 1 "khung" (cùng `<Card>`
  hoặc cùng frameless+self-card). Empty/loading/error của 1 section frameless cũng phải mặc đúng khung đó, không
  được tụt xuống 1 style hộp ad-hoc nhạt hơn.
- **Feature dùng `Typography` cho text, KHÔNG `<span class="text-sm text-muted">`** (tiện thể sửa luôn khi đụng).
