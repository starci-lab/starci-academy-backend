# SESSION BRIEF — 2026-07-19 · Mock-interview checklist grading

> Máy: `C:\Repositories\ac\starci-academy-backend` · Branch: `mtp` · Chủ đề: chuyển chấm câu OPEN sang **checklist grounded** + audit ngân hàng câu + **phát hiện sự cố DB↔.mount lệch**.

---

## 1. TL;DR (đọc trước)

Session này tiếp tục việc **chấm câu phỏng vấn OPEN bằng CHECKLIST** (5–8 checkpoint atomic, điểm = số phủ / tổng). Đã audit xong **660/660 câu nguồn DB** và **ghi checklist ngược vào `.mount`** cho range 450–659. Nhưng **giữa chừng phát lộ một sự cố dữ liệu nghiêm trọng**: nguồn `_all.json` (dump từ DB local) đã **lệch hoàn toàn so với `.mount` git** ở 2 khóa fullstack + system-design → checklist bị ghi nhầm folder. Chỉ **devops còn khớp 100%**.

➡️ Kết luận cuối session: **bỏ pipeline DB-driven, chuyển sang folder-driven đọc thẳng `.mount`**. Chi tiết + kế hoạch ở [`.news/mock-interview-audit-incident-and-plan.md`](.news/mock-interview-audit-incident-and-plan.md).

---

## 2. Việc đã làm trong session

1. **Audit range 450–659**: 210/210 xong (`results/batch_450-555.json`, `batch_555-660.json`). 7 idx lỗi (StructuredOutput/rate-limit) chưa chạy lại → ghi vào [`results/_failed_idx.json`](.artifacts/interview-audit/results/_failed_idx.json): `[452, 461, 474, 515, 530, 587, 649]`.
2. **Ghi checklist vào `.mount`** qua `_id2folder.json` (map id→folder, 985 entry, dùng id-factory chứ KHÔNG match theo prompt-text):
   - **173/210 ghi thành công** (346 file `en`+`vi`).
   - **30/210 SKIP vì drift** (folder `.mount` hiện tại đã đổi kind/schema so với lúc seed DB — vd idx451 DB ghi `kind=theory` nhưng file thật là `kind=debug`, không còn `# idealAnswer` để chèn). Danh sách: `scratch/_merge-450-659-report.json` (local, không git-track).
3. **Phân tích coverage `.mount` trực tiếp** (không qua DB): 539/985 câu chưa có checklist, trong đó **316 "actionable"** (có `# prompt` + `# idealAnswer`) — `scratch/_mount_todo.json`; 223 còn lại đã có `# rubric` 4-chiều sẵn, không cần chuyển — `scratch/_mount_todo_skipped.json`.
4. **Phát hiện + lập biên bản sự cố** DB↔.mount lệch (đã commit `f00b48672`).
5. **Sửa đường dẫn workflow** `.claude/workflows/interview-audit.js`: `FILE` từ `D:\...` → `C:\Repositories\ac\...` (máy hiện tại).
6. Cập nhật `STATUS.md` gộp lại theo tình trạng mới.

---

## 3. Bằng chứng sự cố (prompt match DB vs .mount cùng vị trí)

| Khóa | DB (`_all.json`) | `.mount` (SSOT) | Prompt khớp | Kết luận |
|---|---|---|---|---|
| **devops** | 280 | 280 | **280/280 (100%)** | ĐÚNG — giữ |
| **fullstack** | 188 | 345 | **1/188** | lệch hẳn |
| **system-design** | 192 | 360 | **0/192** | lệch hoàn toàn |
| Tổng | 660 | **985** | — | — |

**Nguyên nhân gốc:** id-factory sinh id theo **vị trí** `(courseIndex, bankIndex, questionIndex)`, không theo nội dung. FS + SD đã được author lại/mở rộng trong `.mount` (FS 188→345, SD 192→360) → cùng vị trí giờ là câu khác → checklist (sinh từ `idealAnswer` câu DB) ghi vào folder chứa câu khác. Devops không đổi nên tình cờ đúng.

**Mức nguy hiểm: THẤP** — parser prod **chưa đọc `# checklist`** nên dữ liệu sai đang nằm trơ trong `.md`, nhưng **phải dọn trước khi build parser**.

---

## 4. Đã push gì

| Nơi | Commit | Trạng thái |
|---|---|---|
| **data / main** | `077808e4 → 24c5319e4` | devops 280 folder checklist ĐÚNG (giữ). fullstack 166 folder checklist SAI (bỏ). `# rubric` giữ cả hai. |
| **backend / mtp** | `315990d5 → 42500e39 → f00b4867` | batch results + `_id2folder.json` + incident report. devops results dùng được; FS/SD results KHÔNG map được `.mount`. |

**CHƯA commit (working tree session này):** `STATUS.md`, `_failed_idx.json`, `interview-audit.js` (path), `settings.local.json` + các batch/artifact file mới.

---

## 5. Cần thầy quyết (blocking bước tiếp)

1. **Fix main fullstack**: revert ngay 166 folder về pristine `077808e44`, hay để bước ghi-đè folder-driven tự sửa?
2. **Chia 705 câu folder-driven** (FS 345 + SD 360): 1 session làm hết hay 2 session chia đôi?
3. **devops**: có spot-check thêm `idealAnswer` (ngoài prompt 280/280) trước khi tin tuyệt đối không?
4. **Range 0–449**: chưa xác nhận đã ghi vào `.mount` hay chưa → cần hỏi/kiểm session kia.

---

## 6. Kế hoạch đã chốt (folder-driven, `.mount` = SSOT)

- Nguồn câu **DUY NHẤT = `.mount` git folders (985)**. Bỏ `_all.json`/DB.
- Mỗi folder: đọc `# prompt` + `# idealAnswer` (en+vi) → audit (Sonnet gen+review · 5 mức trả lời · Sonnet+Haiku batch-grade · enhance ≤5) → ghi `# checklist` + `# exampleResults` **trở lại chính folder** (key = folder path, không thể ghi nhầm). Giữ `# rubric` (option A) đến khi parser đọc được checklist.
- **Tổng cần audit folder-driven: 705** (FS 345 + SD 360). Devops 280 đã đúng, không đụng.

---

## 7. Việc còn lại (từ STATUS.md)

1. Chốt en/vi checkpoint.
2. Ghi `.mount` interview `.md` (`# checklist` + `# exampleResults`, xóa `# rubric`).
3. Build parser + `MockInterviewCheckpointEntity` + cột `example_results` jsonb + processor.
4. Đổi grading prompt câu open → coverage-per-checkpoint.

Grader production: `gemini-3.1-flash-lite` (Economy) qua `AiInvokeService.run({task:Grading, floor:Economy})`.

---

## 8. Con trỏ file

- Incident + kế hoạch: [`.news/mock-interview-audit-incident-and-plan.md`](.news/mock-interview-audit-incident-and-plan.md)
- STATUS bàn giao: [`.artifacts/interview-audit/STATUS.md`](.artifacts/interview-audit/STATUS.md)
- Proposal: `.artifacts/proposals/mock-interview-checklist-grading.proposal.md`
- Pilot review: `.artifacts/interview-audit/pilot.md`
- Workflow: [`.claude/workflows/interview-audit.js`](.claude/workflows/interview-audit.js)
- Scripts kiểm chứng: `scratch/_verify_all660.py`, `scratch/_verify_prompt_match2.py`
- Nguồn (không dùng nữa): `.artifacts/interview-audit/_all.json` (660), `_id2folder.json` (985)
