# WF-03a · Gộp entity CV + cột customize + migration

- **Status:** ✅ done (2026-07-04 — entity + enum `CvSource` + migration `1721700000000-UnifyCvGenerations` + args generate/revise + payload; tsc/eslint sạch. Team confirm: `feedback` = jsonb `Record<string,unknown>`; course FK = `ON DELETE SET NULL`)
- **Repo:** backend (`mtp`)
- **Effort:** M
- **Phụ thuộc:** — (khởi đầu chuỗi WF-03)
- **Owner:** (chưa gán)

## Mục tiêu
Biến `UserCvGenerationEntity` (`cv_generations`) thành **entity CV thống nhất** cho cả 2 nguồn, thêm field customize + chỗ chứa điểm. Chưa chấm (đó là 03b).

## Vì sao
Chọn evolve `cv_generations` vì đã multi-per-user + có list query + `structuredData` + LaTeX. Chỉ thiếu: nguồn, điểm, gắn track, field customize.

## Phạm vi
1. **Entity** `UserCvGenerationEntity` (`src/modules/databases/postgresql/primary/entities/user-cv-generation.entity.ts`) + migration:
   - `source` enum **`generated | uploaded`** (default generated cho row cũ).
   - `score` int **nullable** + `feedback` jsonb **nullable** (điền ở 03b).
   - `courseId` uuid **nullable** + relation optional tới `CourseEntity` (gắn track — KHÔNG bắt buộc).
   - `label` varchar (user đặt; default "CV #n" khi trống) · `targetRole` varchar nullable · `language` varchar/locale nullable.
   - `uploadedCdnKey` varchar **nullable** (file CV gốc cho source=uploaded).
   - Giữ nguyên `structuredData`/`latexCdnKey`/`mode`/`status`/`sourceCvSubmissionId`.
2. **Mutation `generateCv`/`reviseCv`** (`src/features/api/core/graphql/mutations/cv-submissions/generate-cv/` + `revise-cv/`): thêm vào `GenerateCvRequest` các arg **optional** `courseId?`, `label?`, `targetRole?`, `language?`; lưu vào row. `extraPrompts`/`mode`/`selectedModel*` giữ nguyên.
3. **Nguồn upload:** thêm mutation `uploadCv` (hoặc mở rộng flow review cũ) tạo row `source=uploaded` với `uploadedCdnKey` — CHƯA chấm ở pha này (chỉ nhập + lưu). Có thể tái dùng phần extract/upload của processor `review-cv-submission`.
4. **List/read:** `myCvGenerations` (cân nhắc đổi tên → `myCvs`) + payload `cvGeneration` expose thêm `source`, `score`, `courseId`, `label`, `targetRole`, `language`.

## Acceptance criteria
- [ ] Entity thống nhất có đủ field; migration chạy sạch (row cũ → `source=generated`, `label` default).
- [ ] Cả generate lẫn upload tạo được row trong CÙNG bảng.
- [ ] List query trả field mới; user gắn được (optional) `courseId`.
- [ ] `tsc --noEmit` NO NEW ERRORS; eslint 0.

## Rủi ro / lưu ý
- Enum + cột mới → migration cẩn thận, default cho row cũ.
- CHƯA đụng scoring / consumers (03b/03c lo). Giữ legacy `cv_submissions` chạy song song tới 03c.
- `courseId`/`targetRole`/`language` đều optional (user customize tự do, không ép).
