# Feature — CartView
> Xem lại giỏ hàng nhiều khóa + chốt thanh toán. Nguồn: `features/cart/CartView` + `features/cart/AddToCartButton`.

- **Job**: quyết định 1 tác vụ duy nhất — "thanh toán N khóa đang chọn" → shell [[centered-form-setup]].
- **CTA**: primary "Thanh toán ({n})" mở payment modal; tertiary "Xoá giỏ" tách rõ (không ngang hàng primary). `AddToCartButton` (nơi khác gọi vào) tự ẩn khi khóa free/đã sở hữu — không mời mua thứ không bán được. → [[call-to-action]]
- **Links (onward)**: rỗng → empty-state CTA "Duyệt khóa học" (phễu về `/courses`, KHÔNG ngõ cụt); lỗi preview vẫn hiện tổng fallback (không block trang). → [[content-linking]]
- **Psychology**: loss-aversion qua dòng "savings" (số tiền tiết kiệm được nêu rõ) + chip "bundle bonus %"; goal-gradient nudge "`addMoreHint2/3`" khi giỏ có 1-2 khóa (mời thêm 1 khóa để lên tier tiếp) — nudge chỉ hiện ở đúng ngưỡng, không nag liên tục. → [[persuasion-psychology]]
- **Ghi chú**: tổng tiền LUÔN lấy từ `coursesCheckoutPreview` (1 nguồn) — bundle bonus + loyalty progressive là % THẬT do BE tính theo giỏ hiện tại, khớp [[fair-monetization-axiom]] (không phải số tuỳ tiện FE tự vẽ để tạo cảm giác hời).
