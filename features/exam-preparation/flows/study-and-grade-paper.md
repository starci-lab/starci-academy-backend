# Flow · Ôn tập và làm đề

> ID: `study-and-grade-paper` · Trigger: Học viên mở Study hoặc Exam.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `learner` | `study-home` | Chọn điểm tiếp tục hoặc khám phá. | Topic, practice hoặc exam được mở. |
| 2 | `learner` | `study-topic` | Mở topic và bắt đầu practice. | Phrase practice được mở theo slug. |
| 3 | `learner` | `exam-catalog` | Chọn đề trong catalog. | Exam session được mở theo slug. |
| 4 | `learner` | `exam-session` | Chọn đáp án và nộp đề. | Attempt, score và giải thích được trả về. |

## Outcomes

- Attempt và answer rows được lưu
- Study session phản ánh thời gian làm bài
- Đáp án không lộ trước khi chấm

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`
