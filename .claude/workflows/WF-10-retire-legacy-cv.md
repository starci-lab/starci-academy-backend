# WF-10 · Retire legacy CV pipeline (sau khi verify prod)

- **Status:** undone
- **Repo:** backend (`mtp`)
- **Effort:** M
- **Phụ thuộc:** WF-03c (done, retire deferred) + WF-07 (done) + backfill migration đã CHẠY trên prod

## Mục tiêu
Gỡ hoàn toàn hệ CV cũ (`cv_submissions` / `cv_submission_attempts` + processor `review-cv-submission`) sau khi hệ CV thống nhất (`cv_generations`, WF-03/WF-07) đã được verify chạy đúng trên production — đóng nốt 3 điểm `// TODO(retire-legacy-cv)` còn để lại trong code.

## Vì sao
WF-03c đã chuyển job-readiness + job-board gate sang đọc "UNION-safe" (`GREATEST(unified, legacy)`) để KHÔNG ai bị tụt điểm trong lúc chuyển đổi, và đã backfill migration (`1721800000000-BackfillLegacyCvIntoUnified`) đưa data legacy có `score` sang bảng thống nhất. Đây là bước dọn dẹp cuối: một khi backfill đã chạy + verify đúng trên prod, giữ lại 2 đường đọc (union) mãi mãi là nợ kỹ thuật vô ích — mỗi lần đọc điểm CV phải join/so sánh 2 nguồn thay vì 1.

## Phạm vi (CHỈ làm sau khi safety gate ở dưới ĐÃ PASS)
1. **Ground — 3 vị trí có `// TODO(retire-legacy-cv)`:**
   - `job-readiness.service.ts` → `computeCvScore` (đọc unified, có thể còn fallback/union legacy).
   - `consultant-contact-gate.service.ts` → `getBestCvScore` (hiện `GREATEST(unified, legacy)` — union-read).
   - Migration `1721800000000-BackfillLegacyCvIntoUnified` (comment đánh dấu chỗ này là bước tạm, chờ retire).
2. Sau khi safety gate pass:
   - `getBestCvScore` bỏ nhánh legacy → chỉ còn `MAX(score)` từ bảng thống nhất.
   - `job-readiness.service.ts` bỏ mọi đường đọc legacy còn sót (nếu có).
   - Deprecate/xoá processor `review-cv-submission` (chấm CV kiểu cũ) — kiểm không còn nơi nào enqueue job này trước khi xoá.
   - Cân nhắc xoá hẳn hay chỉ archive entity `CvSubmissionEntity`/`CvSubmissionAttemptEntity` (migration DROP TABLE là bước riêng, cần thêm 1 migration + xác nhận không còn FK tham chiếu).
3. Cập nhật `00-INDEX.md` (bỏ dòng "Retire legacy CV" khỏi mục "Quyết định defer").

## Acceptance criteria
- [ ] **Safety gate (BẮT BUỘC trước khi đụng code xoá):** chạy count-check trên prod — mọi `cv_submission_attempts` đã chấm (`score IS NOT NULL`) có ĐÚNG 1 dòng tương ứng trong bảng thống nhất (`source=uploaded`, cùng `score`). Không khớp = KHÔNG retire, quay lại backfill.
- [ ] Sau gate pass: gỡ union-read (`GREATEST`) ở `getBestCvScore`, chỉ còn đọc bảng thống nhất.
- [ ] Gỡ 3 `// TODO(retire-legacy-cv)` khỏi codebase.
- [ ] Processor `review-cv-submission` bị xoá hoặc deprecate (xác nhận không còn nơi enqueue).
- [ ] Test hiện có (`consultant-contact-gate.service.spec.ts`, `job-readiness.service.spec.ts`) cập nhật để phản ánh việc bỏ union-read; vẫn xanh.
- [ ] `tsc` NO NEW ERRORS, eslint 0.
- [ ] `00-INDEX.md` cập nhật, bỏ mục defer.

## Rủi ro / lưu ý
- **KHÔNG được bắt đầu phần "xoá code" nếu safety gate (count-check) chưa chạy và pass trên PROD** — đây là brief duy nhất trong index có một gate cứng chặn trước khi code, vì rủi ro là **user thật bị tụt điểm CV** nếu backfill thiếu sót mà đã vội gỡ đường đọc legacy.
- Nếu count-check lệch (thiếu 1 vài attempt), việc đúng là chạy lại/patch migration backfill, KHÔNG hạ tiêu chuẩn gate để "cho qua".
- Xoá bảng (DROP TABLE) là bước không thể hoàn tác — cân nhắc chỉ deprecate/archive (giữ bảng, ngừng ghi/đọc) ở vòng đầu, xoá bảng thật ở 1 migration riêng sau khi đã ổn định thêm 1 khoảng thời gian.
- Cần xác nhận không còn nơi nào khác (script, cronjob, admin tool) tham chiếu 2 entity legacy trước khi xoá processor.
