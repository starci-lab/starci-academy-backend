# Feature — CourseDetail
> Trang bán 1 khóa học (hero + narrative + sticky buy-box). Nguồn: `features/course/CourseDetail`.

- **Job**: chuyển 1 khách xem thành người mua/học 1 khóa cụ thể → shell [[marketing-landing]] (comment code gọi đúng tên "marketing-first course landing").
- **CTA**: `CourseCtaButtons` là CỤM DUY NHẤT quyết định mua, dùng CHUNG ở cả hero-rail lẫn mobile bar (không lệch): chưa mua → primary "Đăng ký" + secondary `AddToCartButton` + secondary "Học thử"; đã mua → 1 primary "Tiếp tục học". Hero KHÔNG mang giá/CTA — buy-box CHỈ 1 nơi (`CoursePricingRail`). → [[call-to-action]]
- **Links (onward)**: `CourseMobileEnrollBar` sticky (mobile); narrative column dẫn Value Props→Curriculum→Prerequisites→FAQ; giá nhất quán qua 1 block `PriceTag` dùng chung toàn app. → [[content-linking]]
- **Psychology**: price-anchoring (giá gốc gạch + `PriceTag` breakdown tooltip tách rõ phase-discount vs loyalty-discount, không gộp mập mờ); scarcity thật (`slotAvailable` theo phase, KHÔNG giả); social proof (`CourseTrustStats`: enrollmentCount + module/lesson/giờ/challenge — chỉ hiện khi >0); urgency ladder (bảng giá các phase sau cao hơn = "mua sớm rẻ hơn" hiển thị thật, không đếm ngược giả). → [[persuasion-psychology]]
- **Ghi chú**: đúng tinh thần [[fair-monetization-axiom]] honesty — % giảm luôn tính từ CHÊNH LỆCH GIÁ THẬT (list→charge), không tính riêng loyalty rồi understate; 1 buy-box duy nhất tránh 2 nguồn giá lệch nhau.
