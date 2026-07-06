# Concept — Mở khóa nội dung gated = ENROLL khóa học, KHÔNG phải "VIP"/membership riêng

> Heuristic monetization (họ `concepts/*`). Bổ trợ [[fair-monetization-axiom]] (4 lớp công bằng) — luật này chốt CƠ CHẾ gate cụ thể cho nội dung học (không lẫn với engagement/entitlement khác).

## Nguyên tắc (STRICT)
- **Mọi nội dung premium của 1 khóa (quiz/challenge/personal-project/lesson premium) mở khóa bằng ĐĂNG KÝ/MUA CHÍNH KHÓA ĐÓ** (`EnrollmentEntity.isPurchased=true`), KHÔNG dựng SKU "VIP"/membership/subscription riêng để gate.
  - Free = login → free-enroll (`isPurchased=false`): đọc bài + challenges + phần nội dung free-tier (vd ~20% quiz).
  - Mở phần còn lại = enroll/checkout **khóa đó** — không phải 1 gói VIP tổng.
- **Copy & CTA**: dùng "Đăng ký khóa học" / "Học khóa này" (enroll), KHÔNG "Nạp VIP", KHÔNG vương miện VIP. Icon = khóa/đăng ký, không phải crown.
- **CTA route** → trang chi tiết khóa / checkout enroll của *khóa hiện tại*, KHÔNG `/profile/ai-subscription`, KHÔNG trang membership.
- **Phân biệt 3 trục tiền của StarCi (đừng trộn):**
  1. **Enroll khóa** = mở thực hành/nội dung khóa → dùng cho MỌI gate học (quiz/challenge/lesson/personal-project premium).
  2. **Membership cộng đồng** ($5/th) = blog premium + cộng đồng — KHÔNG liên quan gate nội dung khóa.
  3. **AI subscription** = credit/model chấm AI — KHÔNG liên quan gate nội dung khóa.
  - Gate nội dung học LUÔN bám trục (1). Nhầm route/copy sang (2)/(3) = lệch mental-model người dùng.
- **Upsell notification** cũng theo trục (1): *"Đăng ký khóa để mở N quiz còn lại"*, bắn 1 lần, dismissible (không nag lặp).

## Liên quan
- [[fair-monetization-axiom]] (4 lớp công bằng — entitlement theo tier/enroll, không theo count) · [[trial-preview-enrollment-optional]] (preview khi chưa enroll).
