# Principle — Accessibility (A11y)

> Nguyên tắc xuyên-suốt (họ `principles/*`). Gom lại các mảnh a11y đang rải ở `color.md` §5, `icon.md`, `status-icon-overrides-base.md` thành 1 nguyên tắc nền — mọi component MỚI phải tự kiểm qua đây, không chỉ chỗ đã có mảnh sẵn.

## Rule of thumb
**Mọi affordance phải dùng được không cần NHÌN MÀU, dùng được bằng BÀN PHÍM, và không im lặng với SCREEN READER.**

## Nguyên tắc
- **Contrast:** text ≥4.5:1, icon/phụ ≥3:1. Chữ màu trên tint nhạt (`text-accent` trên `bg-accent/10`) phải VERIFY thật, không giả định "đậm là đủ" — accent StarCi sáng (~70%L) dễ hụt AA.
- **Focus:** mọi interactive phải có `focus-visible:ring` rõ ràng, tách biệt hover — bàn phím phải thấy đang ở đâu mà không cần hover chuột.
- **Icon-only (không kèm label) → BẮT BUỘC `aria-label`.** Khi icon ĐỔI NGHĨA theo trạng thái (lock thay puzzle khi khoá) → label cũng phải đổi theo, không giữ label cũ.
- **Màu KHÔNG BAO GIỜ là kênh thông tin DUY NHẤT** — mọi status/phân loại phủ màu phải kèm icon hoặc text (done = `text-success` + `CheckCircleIcon`, không chỉ tô xanh).

> Đã áp: [[color]] §5 (contrast + màu không là kênh duy nhất) · [[status-icon-overrides-base]] (icon đổi nghĩa kèm aria-label đổi theo) · [[interactive-needs-hover]] (focus ring bắt buộc cho mọi interactive).

## Liên quan
- [[color]] · [[icon]] · [[interactive-needs-hover]] · [[status-icon-overrides-base]] · [[disable-vs-lock-and-perrow-autosave]] (2 icon riêng cho 2 lý do khoá — cũng là tín hiệu không chỉ-màu).
