# Concept — Judge0 coding execution

> `src/modules/judge0/` — chấm bài coding practice (`/practice` LeetCode-style) bằng cách submit code tới Judge0 engine và map verdict.

- `judge0.service.ts` — gọi Judge0 API submit code + input, poll/nhận kết quả.
- `enums/judge0-status.ts` — status code Judge0 trả về (Accepted, Wrong Answer, Time Limit Exceeded, Compilation Error…).
- `utils/map-verdict.ts` — map status Judge0 thô sang verdict nội bộ app dùng (enum riêng của domain coding-problem, không lộ raw Judge0 status ra GraphQL).
- Kết hợp với BullMQ + Socket.IO: submit code → enqueue job chấm → worker gọi `Judge0Service` → kết quả đẩy realtime qua socket (xem [[background-jobs-bullmq]], [[realtime-socketio]]) thay vì client poll.
- Gotcha vận hành: Judge0 cần sandbox cgroup — môi trường cgroup-v2-only (một số máy dev) cần cấu hình lại để chạy Judge0 self-host (cgroup-v1 compat).

> Nguồn: `src/modules/judge0/`
