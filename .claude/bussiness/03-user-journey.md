# 03 — User Journey

## §03.1 Vai trò
- **Visitor** — chưa đăng ký, xem preview content.
- **Student** — đã đăng ký, enroll ít nhất 1 course.
- **Consultant** — mentor được admin cấp quyền (xem §08).
- **Admin** — quản trị nội dung & học viên.

## §03.2 Đăng ký tài khoản
- Email + password (auth do Keycloak xử lý — nghiệp vụ: 1 email = 1 account).
- Có **bloom filter email** để chống đăng ký trùng nhanh (UX, không phải security).
- Sau đăng ký, user trống — chưa có enrollment.

## §03.3 Enrollment
- **Enrollment** = liên kết user ↔ course có trả phí hoặc được tặng.
- 1 user enroll nhiều course song song được.
- Enrollment có state: `active` (đang học), `expired` (hết hạn truy cập), `refunded` (hoàn tiền).
- Sau enroll, user mới mở khoá toàn bộ lesson + challenge của course đó.

## §03.4 Preview / Trial
- Một số lesson đầu tiên trong course có **preview content** — visitor xem được không cần enroll.
- Preview thường gồm: intro lesson + 1 challenge easy đầu tiên.
- Mục đích: cho học viên thử trước khi mua.

## §03.5 Học một lesson
1. User chọn course → module → lesson.
2. Đọc content (markdown VI hoặc EN) + xem lesson video (nếu có).
3. Submit challenge của lesson (xem §02.6).
4. Đánh dấu lesson complete khi đạt criteria.

## §03.6 Q&A
- Mỗi lesson có khu **QnA** — học viên hỏi, consultant/admin/user khác trả lời.
- QnA gắn vào lesson cụ thể (không phải global forum).
- Có thể attach screenshot, code snippet.

## §03.7 Resource
- **Resource** = tài liệu bổ sung (PDF cheatsheet, link blog, sample repo).
- Resource có thể gắn vào course, module, hoặc lesson.
- Một số resource yêu cầu enrollment, một số public.

## §03.8 Mất quyền truy cập
- Enrollment expired (hết thời hạn theo pricing phase) → user xem được lịch sử progress nhưng không submit mới.
- Refund → enrollment chuyển `refunded`, mất quyền học, progress giữ lại để admin review.
- Account bị khoá (vi phạm) → toàn bộ enrollment treo, không học được.
