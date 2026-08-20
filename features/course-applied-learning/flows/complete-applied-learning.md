# Flow · Hoàn thành hoạt động ứng dụng

> ID: `complete-applied-learning` · Trigger: Học viên chọn mock interview, personal project hoặc playground.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `learner` | `mock-interview` | Chọn cấu hình và chạy phiên phỏng vấn. | Session và result được lưu theo sessionId. |
| 2 | `learner` | `personal-project` | Chọn task, nộp và mở result. | Feedback của attempt được hiển thị. |
| 3 | `learner` | `course-playground` | Chọn playground và khởi tạo session. | Live session nhận pairing code và ordered steps. |

## Outcomes

- Mỗi hoạt động có identity session/task riêng
- Kết quả được xem ở route riêng

Evidence: `EV-001`, `EV-002`, `EV-003`
