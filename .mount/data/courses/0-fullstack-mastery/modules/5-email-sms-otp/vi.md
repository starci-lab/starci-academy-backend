# title
OTP, SMS & Email

# description
Gửi email giao dịch với Nodemailer, xây luồng OTP an toàn với Redis TTL, và tích hợp cổng SMS trong NestJS. Chuẩn hóa template, rate limit, và xác minh kênh thứ hai cho tài khoản.

# previewContents
## 0
### text
Cấu hình gửi email với Nodemailer (SMTP / Brevo) trong NestJS.
## 1
### text
Thiết kế template email và tách nội dung khỏi logic gửi.
## 2
### text
Xây luồng OTP lưu Redis với TTL, retry và hết hạn rõ ràng.
## 3
### text
Tích hợp cổng SMS (mock hoặc provider) và đồng bộ contract với OTP.
## 4
### text
Hiểu rủi ro spam, brute-force và cách giảm tải (throttle, cooldown).
## 5
### text
Kết hợp email + SMS làm kênh dự phòng hoặc bước xác minh bổ sung.
## 6
### text
Log và quan sát gửi OTP/email/SMS mà không lộ dữ liệu nhạy cảm.
## 7
### text
Chuẩn bị môi trường dev (Docker Redis, biến môi trường SMTP/API key).
## 8
### text
Triển khai luồng xác minh đa kênh ổn định, dễ kiểm thử và mở rộng.
