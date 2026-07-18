# Mock-interview checklist grading

> Chấm phỏng vấn thử grounded bằng CHECKLIST (thay "AI tự brainstorm"). Trạng thái: **audit data đang chạy (~209/660)**, build BE chưa bắt đầu.

## Vấn đề
Chấm câu OPEN (reasoning / scenario / design) hiện để model tự nghĩ ra chuẩn rồi chấm → **rộng tay ~+15đ, loạn ±10–33** dù temp 0. Câu theory thì đã chấm coverage theo `idealAnswer` authored (grounded OK).

## Giải pháp (đã verify ~7 vòng thực nghiệm)
Tách `idealAnswer` → **checklist 5–8 CHECKPOINT atomic** → model chỉ phán **từng ý phủ/không** (việc nó làm giỏi, ~95% khớp) → **điểm = số-ý-phủ ÷ tổng, tính bằng CODE** (không để model bịa số 0–100).

Bằng chứng: FULL idealAnswer → **100% deterministic**; partial chấm thấp đúng; **hết rộng tay**. Checklist quá gộp → over-credit; quá băm (20–32 ý) → loạn lại. **6–8 checkpoint atomic = sweet-spot.**

## Config chốt
- **Sinh checklist = Sonnet** (gen → self-review), **thầy duyệt** (bước người-trong-vòng).
- **Chấm production = `gemini-3.1-flash-lite`** (hạng **Economy**, ~$0.0003/câu) qua `AiInvokeService.run({ task: Grading, floor: Economy })`. Trong audit dùng **Sonnet + Haiku** để so — **Haiku ≈ Sonnet** (nới nhẹ mức giữa).
- **Enhance loop**: nếu gradient điểm không coherent (L1≥80, L5≤40, giảm dần) → Sonnet sửa checklist, chấm lại, **≤5 vòng**.
- **Model Claude gọi qua SUBAGENT/Workflow** (gói Claude Code), **KHÔNG curl OpenRouter** (chỉ flash-lite cần OpenRouter).

## Schema (`.md` → DB)
| Field `.md` | Format | Seed → |
|---|---|---|
| `# checklist` (thay `# rubric`) | list `## N` (text) | **bảng `mock_interview_checkpoints`** — mỗi `## N` = 1 row (`mock_interview_id` FK, `sort_index`, `content`) |
| `# exampleResults` | 1 JSON block (5 mức + sonnet/haiku score) | **cột `example_results jsonb`** trên `mock_interviews` |

*(Checkpoint tách bảng vì cần query lẻ từng ý; example là data audit đọc-nguyên-cụm → jsonb. `ideal_answer`/`rubric` ở PARENT `mock_interviews` — 656/660 câu agnostic, chỉ 4 câu debug có `mock_interview_langs`.)*

## Audit pipeline (Workflow)
`scratch/_wf_audit.js` — đọc `scratch/_all.json` (660 câu) theo index; per-câu: Sonnet gen→review · Sonnet sinh 5 mức trả lời (xuất sắc→kém) · **Sonnet+Haiku batch-chấm** (5 đáp án/1 agent) · enhance ≤5. **~5.5 agent/câu, ~260K token/câu** (phần lớn cache-read → cost thực ~/10). Batch 100 câu/workflow. Kết quả → `.artifacts/interview-audit/results/batch_*.json`.

## Trạng thái + còn làm
- ✅ ~209/660 câu audit xong (đều coherent), lưu `results/`. Đang chạy batch tiếp. Câu lỗi StructuredOutput → `results/_failed_idx.json`.
- ⬜ Chốt **en/vi** checkpoint (1 ngôn ngữ hay gen cả 2).
- ⬜ Ghi kết quả vào `.mount` interview `.md` (checklist + exampleResults, xóa rubric).
- ⬜ Build: parser đọc `# checklist`/`# exampleResults` · entity `MockInterviewCheckpointEntity` + cột `example_results jsonb` · processor · migration.
- ⬜ Đổi grading prompt câu open → coverage-per-checkpoint; điểm tính code.

Ref: `.artifacts/proposals/mock-interview-checklist-grading.proposal.md` · `.artifacts/interview-audit/{STATUS.md,pilot.md}`.
