# Flow · Học và nộp thử thách

> ID: `learn-and-submit-challenge` · Trigger: Học viên mở một khóa đã ghi danh.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `learner` | `course-today` | Mở bước học hôm nay. | Học viên đi tới module hoặc nội dung tiếp theo. |
| 2 | `learner` | `course-content-reader` | Đọc nội dung theo module. | Tiến tới nội dung hoặc challenge tiếp theo. |
| 3 | `learner` | `course-challenge` | Chọn deliverable và gửi bài. | Job chấm được tạo và route kết quả có thể theo dõi. |
| 4 | `learner` | `course-qa` | Mở Q&A và tìm hoặc đặt câu hỏi. | Câu hỏi liên quan được hiển thị hoặc gửi. |

## Outcomes

- Nội dung premium có thể bị rút gọn thành paywall
- Nộp challenge trả jobId để theo dõi chấm

Evidence: `EV-001`, `EV-002`, `EV-003`
