# Interview checklist-grading — STATUS (bàn giao 2026-07-18)

## Đã chốt
- Chấm câu OPEN grounded bằng CHECKLIST 5-8 checkpoint atomic; điểm = phủ/tổng (CODE).
- Workflow: scratch/_wf_audit.js (Sonnet gen+review · 5 answers · Sonnet+Haiku batch-grade · enhance<=5). Subagent Claude, 0d OpenRouter.
- Production grader: gemini-3.1-flash-lite (Economy) qua AiInvokeService.run({task:Grading,floor:Economy}).
- Schema: # checklist -> bang mock_interview_checkpoints (## N = row). # exampleResults -> cot example_results jsonb tren mock_interviews. Thay # rubric.

## In-flight
- Audit 660 cau, batch 100. Ket qua: .artifacts/interview-audit/results/batch_*.json
- ~209/660 xong (coherent). Batch 4 (idx 210-309) chay. Con: 310-409, 410-509, 510-609, 610-659. Failed idx: xem results/_failed_idx.json (idx 187).
- _all.json = 660 cau (id,kind,course,prompt,ideal). Workflow doc theo index.

## Con lam
1. Chot en/vi checkpoint.
2. Ghi .mount interview .md (# checklist + # exampleResults, xoa # rubric).
3. Build parser + MockInterviewCheckpointEntity + cot example_results jsonb + processor.
4. Doi grading prompt cau open -> coverage-per-checkpoint.

## Proposal: .artifacts/proposals/mock-interview-checklist-grading.proposal.md
## Pilot review: .artifacts/interview-audit/pilot.md
