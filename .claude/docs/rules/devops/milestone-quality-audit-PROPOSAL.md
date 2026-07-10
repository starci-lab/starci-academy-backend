# PROPOSAL — Milestone quality audit (đào sâu sư phạm), DevOps Mastery

> **Trạng thái: HOÃN** — thầy cancel giữa chừng 2026-07-10, ghi lại để làm sau. Đây là việc CHƯA LÀM, không phải đã làm dở — nếu task cũ (`wdnenoswc`, cancel giữa chừng) có kết quả rơi rớt đâu đó thì BỎ QUA, không dùng, chạy lại từ đầu theo prompt dưới.
>
> **Runner đã có sẵn, chạy được ngay** (không cần copy-paste dựng lại): `.claude/docs/workflows/audit-devops-milestone-quality.js` — đã commit vào repo public `starci-academy-backend`, ai (hoặc Claude Code session nào, kể cả máy khác/người khác trong team) pull repo về đều gọi được thẳng, xem §"Cách chạy" bên dưới.

## Đã làm xong (KHÔNG cần lặp lại)
- Gate cấu trúc `check-task.mjs` trên toàn bộ 100 task (20 milestone): **100/100 PASS**.
- Review chuẩn hoá cơ học (`fix-personal-project.js`, stage=review — split per-lang / accordion / terminology-bold): **0 vấn đề**, không có gì cần apply. (DevOps milestone hầu hết KHÔNG cần split — nội dung bash/HCL/YAML không có "code theo ngôn ngữ" để tách, đây là kết luận ĐÚNG chứ không phải bug bỏ sót.)
- Brief bảng 20 milestone (title + nội dung chính + nhận xét tiến trình khó dần) — đã trình thầy, nhận xét sơ bộ: mạch độ khó hợp lý, không thấy milestone nào lệch quá cơ bản so với vị trí trong lộ trình.

## Việc CÒN THIẾU — đào sâu chất lượng sư phạm (chưa chạy xong lần nào)
Runner có sẵn (`fix-personal-project.js`) KHÔNG có mode phán chất lượng — chỉ làm cơ học (split/accordion/terminology). Phần "criteria có đo đúng kỹ năng thật không, brief có khả thi không" phải viết Workflow script riêng, 1 agent/task (100 agent), report-only.

### Cách chạy (runner đã có sẵn — bất kỳ Claude Code session nào pull repo về đều gọi được)

1. Enumerate `taskDirs` bằng Bash trước (bắt buộc — runner từ chối chạy nếu thiếu, tránh LLM tự `ls` dễ sót):
```bash
find .mount/data/courses/2-devops-mastery/milestones -mindepth 3 -maxdepth 3 -type d -path "*/tasks/*" | sort
```

2. Gọi runner với danh sách đó:
```js
Workflow({
  scriptPath: ".claude/docs/workflows/audit-devops-milestone-quality.js",
  args: { course: "2-devops-mastery", taskDirs: [ /* 100 path lấy từ bước 1 */ ] }
})
```

3. Sau khi có kết quả: tổng hợp `needsFixDetail` (chỉ những task `CAN_SUA`) thành bảng ngắn trình thầy — KHÔNG tự sửa file, mọi finding substantive (criteria mơ hồ, brief thiếu bước, lỗi kỹ thuật lạc hậu) đều cần thầy chốt trước khi apply.

Muốn chạy cho khóa khác (Fullstack/System Design) chỉ cần đổi `course` + path enumerate ở bước 1 — runner không hardcode riêng DevOps.

## Khi nào làm
Không gấp — milestone đã PASS gate + chuẩn hoá cơ học, việc này chỉ là lớp phán chất lượng bổ sung, không chặn gì khác. Làm khi thầy rảnh hoặc khi có agent-quota dư.
