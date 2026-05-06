# title
Workers & Cron Jobs

# description
Lên lịch tác vụ định kỳ với Cron trong NestJS, xếp hàng xử lý nền với BullMQ và Redis, và vận hành worker ổn định: retry, idempotency, quan sát hàng đợi và tránh trùng lặp job.

# previewContents
## 0
### text
Cấu hình Cron và @nestjs/schedule cho tác vụ chạy theo chu kỳ rõ ràng.
## 1
### text
Phân biệt Cron phù hợp cho việc gì và khi nào nên chuyển sang hàng đợi.
## 2
### text
Thiết lập BullMQ với Redis làm backend lưu job và trạng thái.
## 3
### text
Định nghĩa producer, worker và xử lý job async an toàn khi restart.
## 4
### text
Retry, backoff và idempotency để job không làm hỏng dữ liệu khi chạy lại.
## 5
### text
Giới hạn đồng thời, timeout và stalled job để hệ thống không nghẽn.
## 6
### text
Quan sát queue (log, metrics) và debug luồng worker thực tế.
## 7
### text
Chuẩn bị môi trường dev (Docker Redis, biến môi trường BullMQ).
## 8
### text
Triển khai pipeline nền có cấu trúc, sẵn sàng mở rộng khi tải tăng.
