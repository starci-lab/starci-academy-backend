# Mock-interview checklist grading

> Chấm phỏng vấn thử grounded bằng CHECKLIST (thay "AI tự brainstorm"). Trạng thái: **idx 0–449 audit XONG + đã ghi .mount + push main** (446 câu, giữ rubric). idx 450–660 = session khác. Build BE chưa bắt đầu.
>
> ⚠️ **PHÁT HIỆN (2026-07-19):** nguồn audit `_all.json` = **DB (660 câu)** nhưng .mount thật có **985 câu** mock-interview → DB stale ở fullstack (188 vs 345) + SD (192 vs 360); devops khớp (280=280). Kể cả xong 660 vẫn thiếu ~325 câu .mount. Cần chuyển audit sang **folder-driven từ .mount (985)**.

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
- ✅ **idx 0–449 XONG** (450/450 coherent, 187+377 re-run ok): batch_000-010 → batch_410-449 + batch_rerun.json trong `results/`. `_failed_idx.json` rỗng.
- ✅ **Đã ghi .mount + push main** (`starci-lab/data` 077808e4→24c5319e4): 446 câu (devops 280 + fullstack 166; 4 câu fullstack orphan không có folder). **GIỮ rubric** (option A an toàn) — chưa xóa vì parser đọc `# checklist` chưa build.
- 🔄 idx 450–660 (SD-DB 192 + FS-DB 18) = **session khác** đang chạy DB-driven → sẽ ghi SD + phần fullstack còn lại.
- ⬜ **325 câu .mount không có trong DB** (FS 157 + SD 168) → audit **folder-driven** (đọc prompt/ideal thẳng từ .mount, key theo folder — bỏ `_all.json`). Chờ session kia xong rồi quét folder thiếu `# checklist`.
- ⬜ Chốt **en/vi** checkpoint (hiện 1 ngôn ngữ ghi cả en.md+vi.md).
- ⬜ Build: parser đọc `# checklist`/`# exampleResults` · entity `MockInterviewCheckpointEntity` + cột `example_results jsonb` · processor · migration → rồi mới **xóa rubric** (1 flag).
- ⬜ Đổi grading prompt câu open → coverage-per-checkpoint; điểm tính code.

Ref: `.artifacts/proposals/mock-interview-checklist-grading.proposal.md` · `.artifacts/interview-audit/{STATUS.md,pilot.md}`.
