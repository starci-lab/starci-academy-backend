# Interview checklist-grading — STATUS (bàn giao 2026-07-18)

## Đã chốt
- Chấm câu OPEN grounded bằng CHECKLIST 5-8 checkpoint atomic; điểm = phủ/tổng (CODE).
- Workflow: scratch/_wf_audit.js (Sonnet gen+review · 5 answers · Sonnet+Haiku batch-grade · enhance<=5). Subagent Claude, 0d OpenRouter.
- Production grader: gemini-3.1-flash-lite (Economy) qua AiInvokeService.run({task:Grading,floor:Economy}).
- Schema: # checklist -> bang mock_interview_checkpoints (## N = row). # exampleResults -> cot example_results jsonb tren mock_interviews. Thay # rubric.

## In-flight
- Audit 660 cau, batch 100. Ket qua: .artifacts/interview-audit/results/batch_*.json
- SESSION NAY (68c2bc60) DA XONG range 0-449: 450/450, 0 thieu 0 loi (batch_000-010, 010-110, 110-210, 210-310, 310-409, 410-449, + batch_rerun.json cho 187+377). idx 392 borderline (giu). _failed_idx.json = rong.
- SESSION KHAC lam 450-660 qua .claude/workflows/interview-audit.js (args [450,105]+[555,105]) — FILE trong do tro .artifacts/_all.json (git-tracked, pull mtp la co).
- _all.json = 660 cau (id,kind,course,prompt,ideal). Workflow doc theo index. Thu tu: devops(0-279) · fullstack(280-...) · SD(...-659).

## Con lam
1. Chot en/vi checkpoint.
2. Ghi .mount interview .md (# checklist + # exampleResults, xoa # rubric).
3. Build parser + MockInterviewCheckpointEntity + cot example_results jsonb + processor.
4. Doi grading prompt cau open -> coverage-per-checkpoint.

## Proposal: .artifacts/proposals/mock-interview-checklist-grading.proposal.md
## Pilot review: .artifacts/interview-audit/pilot.md
