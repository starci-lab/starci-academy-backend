# WF-07 · Đường upload CV → bảng thống nhất (source=uploaded, có chấm)

- **Status:** ✅ done (2026-07-04 — core `ScoreUploadedCvService` + transport `uploadCv` mutation + `score-uploaded-cv` worker + presign `cdnKey`; 16 test; tsc/eslint sạch. Còn: FE upload UI (surface mới) + retire legacy sau backfill)
- **Repo:** backend (`mtp`)
- **Effort:** M
- **Phụ thuộc:** WF-03a (schema), WF-03b (scoring service) — đều done
- **Owner:** (chưa gán)

## Vì sao có WF này (gap thật)
WF-03a chỉ thêm SCHEMA cho `source=uploaded` (`uploadedCdnKey` + enum). WF-03b/03c KHÔNG build đường nhập upload vào bảng thống nhất — hiện upload vẫn đi qua hệ **legacy** (`cv_submissions`). Nên `source=uploaded` trong `cv_generations` mới chỉ có từ **backfill migration** (dữ liệu cũ), CHƯA có đường tạo mới. `// TODO(WF-07)` ở `generate-cv-score-step.service.ts` là chỗ móc.

## Mục tiêu
User upload CV → lưu vào `cv_generations` (`source=uploaded`, `uploadedCdnKey`) → extract text → **chấm bằng `CvScoringService` dùng chung** (giống generate) → có `score`/`feedback`. Thống nhất hoàn toàn: mọi CV mới (generate hoặc upload) đều nằm 1 bảng, đều có điểm.

## Phạm vi
1. **Mutation `uploadCv`** (hoặc mở rộng flow presign hiện có `generate-submit-cv-presign-url`/`verify-submit-cv-presign-url`): nhận file → `uploadedCdnKey`, tạo row `cv_generations` `source=uploaded` + `label`/`courseId?` optional.
2. **Extract text** từ file upload (tái dùng logic extract của legacy `review-cv-submission` / buffer từ MinIO).
3. **Chấm:** gọi `CvScoringService.score({ userId, cvText, templateLevel, courseId })` (đường `cvText`, không phải `structuredData`) → persist `score`/`feedback` vào chính row đó. Async BullMQ như generate.
4. Gỡ `// TODO(WF-07)` ở `generate-cv-score-step.service.ts` (hoặc tạo step/processor upload riêng dùng chung `CvScoringService`).
5. **Spec (§10):** spec cho service/handler mới (`Test.createTestingModule`, mock EntityManager + CvScoringService).

## Acceptance criteria
- [ ] Upload CV mới → row `cv_generations` `source=uploaded` có `score`/`feedback`.
- [ ] Dùng CÙNG `CvScoringService` với generate (không copy logic).
- [ ] Sau WF này + backfill: legacy `cv_submissions` chỉ còn để đọc → mở đường retire (`TODO(retire-legacy-cv)`).
- [ ] tsc/eslint sạch; spec pass.

## Rủi ro / lưu ý
- Đây là mảnh cuối để **retire legacy** an toàn: khi upload mới đã vào unified + backfill xong → gỡ 3 `TODO(retire-legacy-cv)` + hệ review cũ.
- Quyết định kèm: upload có debit credit khi chấm không (đồng bộ với quyết định scoring-credit của WF-03b).
