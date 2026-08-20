# Flow · Giải bài coding

> ID: `solve-coding-problem` · Trigger: Học viên mở /[lang]/practice.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `learner` | `coding-practice-hub` | Chọn domain. | Danh sách bài của domain được mở. |
| 2 | `learner` | `coding-domain` | Lọc rồi chọn bài. | Problem reader được mở theo slug. |
| 3 | `learner` | `coding-problem` | Viết và gửi lời giải. | submissionId/jobId được theo dõi tới verdict. |

## Outcomes

- Submission và job identity được tạo
- Verdict không được giả lập từ response mutation

Evidence: `EV-001`, `EV-002`, `EV-003`
