# WF-03b · Bước scoring dùng chung (generate + upload → có điểm)

- **Status:** ✅ done (2026-07-04 — `CvScoringService` source-agnostic ở `processors/ai/shared/cv-scoring/` + score step (index 3) trong generate pipeline ghi `score`/`feedback` vào row thống nhất; `maxSteps` 4→5; tsc/eslint sạch. Team confirm: scoring chưa debit credit (mirror compose free); `templateLevel` default `mid`. `// TODO(WF-03c)` chỗ upload path trong score-step)
- **Repo:** backend (`mtp`)
- **Effort:** M
- **Phụ thuộc:** WF-03a
- **Owner:** (chưa gán)

## Mục tiêu
Mọi CV trong bảng thống nhất — dù generated hay uploaded — đều được chấm bằng **1 service scoring dùng chung** → điền `score` + `feedback`.

## Vì sao
Đây là mảnh hụt: pipeline generate hiện KHÔNG chấm; score chỉ có ở đường review cũ. Gộp scoring vào 1 chỗ = 1 rubric, 1 nguồn điểm.

## Phạm vi
1. **Scoring service dùng chung** — trích logic chấm từ processor review cũ (`src/features/api/processors/ai/review-cv-submission/` — rubric + `TemplateCVEntity` Junior/Mid/Senior + AI task) thành 1 service nhận `{ cvText | structuredData, templateLevel }` → trả `{ score 0–100, feedback }`. DRY, 2 nguồn cùng gọi.
2. **Generate:** thêm **bước SCORE** vào pipeline `src/features/api/processors/ai/generate-cv/steps/` (sau `render`, trước/trong `complete`) → chấm `structuredData` vừa sinh → ghi `score`/`feedback` vào row thống nhất.
3. **Upload:** sau khi extract text (từ 03a) → gọi cùng scoring service → ghi `score`/`feedback`.
4. **Revise:** chạy lại → chấm lại (điểm mới ghi đè trên chính row đó, hoặc tạo version — chốt với team, mặc định ghi đè row đó).

## Acceptance criteria
- [ ] CV generated kết thúc có `score` + `feedback`.
- [ ] CV uploaded kết thúc có `score` + `feedback`.
- [ ] Cả hai dùng CÙNG scoring service (không copy logic 2 nơi).
- [ ] `tsc --noEmit` NO NEW ERRORS; eslint 0. Không chạy server/DB thật khi verify.

## Rủi ro / lưu ý
- Scoring tốn AI credit — đi qua đúng lane/credit như các task AI khác (mirror `CVGenerating`/review task).
- `templateLevel` lấy từ đâu (user chọn / suy từ targetRole)? — chốt: mặc định 1 rubric, mở rộng sau.
- Đừng chấm đồng bộ trong request → giữ BullMQ async như pipeline hiện tại.
