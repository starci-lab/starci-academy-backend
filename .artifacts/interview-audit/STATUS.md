# Interview checklist-grading — STATUS (bàn giao 2026-07-18)

## Đã chốt
- Chấm câu OPEN grounded bằng CHECKLIST 5-8 checkpoint atomic; điểm = phủ/tổng (CODE).
- Workflow: scratch/_wf_audit.js (Sonnet gen+review · 5 answers · Sonnet+Haiku batch-grade · enhance<=5). Subagent Claude, 0d OpenRouter.
- Production grader: gemini-3.1-flash-lite (Economy) qua AiInvokeService.run({task:Grading,floor:Economy}).
- Schema: # checklist -> bang mock_interview_checkpoints (## N = row). # exampleResults -> cot example_results jsonb tren mock_interviews. Thay # rubric.

## In-flight
- Audit 660 cau, batch 100. Ket qua: .artifacts/interview-audit/results/batch_*.json
- Range 0-449: 450/450 audit xong (batch_000-010, 010-110, 110-210, 210-310, 310-409, 410-449, + batch_rerun.json cho 187+377). idx 392 borderline (giu).
- Range 450-659: 210/210 audit xong (batch_450-555, batch_555-660). Failed idx (StructuredOutput loi/rate-limit, chua chay lai): [452, 461, 474, 515, 530, 587, 649].
- _all.json = 660 cau (id,kind,course,prompt,ideal), GIT-TRACKED tai .artifacts/interview-audit/_all.json. Thu tu: devops(0-279) · fullstack(280-...) · SD(...-659).
- **2026-07-19: DA GHI vao .mount qua _id2folder.json (id->folder, 985 entry, KHONG dung prompt-text match vi content da drift giua DB-seed-time va .mount hien tai).** Ket qua ghi 450-659: **173/210 ghi thanh cong** (346 file en+vi), **30/210 SKIP vi drift** (file .mount hien tai da doi kind/schema so voi luc seed DB — vd idx451 DB ghi kind=theory nhung file that su la kind=debug, khong con # idealAnswer de chen vao). Danh sach 30 idx skip: xem scratch/_merge-450-659-report.json (khong git-track, local C:\Repositories\ac\starci-academy-backend). Range 0-449 CHUA kiem tra co ghi vao .mount hay chua — can hoi/xac nhan session kia.
- **.mount coverage rieng (khong qua DB):** quet truc tiep .mount thay 539/985 cau chua co checklist, nhung chi 316/539 la "actionable" (co # prompt + # idealAnswer — kind theory/reasoning/scenario/design-lite + vai cau review/optimize/debug hiem hoi co prompt). 223/539 con lai (kind coding/debug/review/optimize da co # rubric gan nhan 4-chieu [technical]/[problemSolving]/[technical]/[testing] san, KHONG can chuyen checklist). Danh sach: scratch/_mount_todo.json (316 actionable) + scratch/_mount_todo_skipped.json (223 loai ra) — local, khong git-track. Dang audit dan (workflow batch [0,158] idx cua todo list nay).

## Con lam
1. Chot en/vi checkpoint.
2. Ghi .mount interview .md (# checklist + # exampleResults, xoa # rubric).
3. Build parser + MockInterviewCheckpointEntity + cot example_results jsonb + processor.
4. Doi grading prompt cau open -> coverage-per-checkpoint.

## Proposal: .artifacts/proposals/mock-interview-checklist-grading.proposal.md
## Pilot review: .artifacts/interview-audit/pilot.md
