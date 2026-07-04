# WF-03c · Switch consumers + migrate/retire legacy

- **Status:** ✅ done (2026-07-04 — CV per-track pillar (3 pillar renormalize) + `foundation.cvScore` giữ global; gate `GREATEST(unified, legacy)` union-safe; backfill migration `1721800000000-BackfillLegacyCvIntoUnified`; invariant giữ xanh; tsc/eslint sạch. **Retire legacy = DEFER** (`// TODO(retire-legacy-cv)` — gỡ sau khi verify backfill trên prod))
- **Repo:** backend (`mtp`)
- **Effort:** M
- **Phụ thuộc:** WF-03a, WF-03b, WF-02 (done)
- **Owner:** (chưa gán)

## Mục tiêu
Cho job-board gate + job-readiness đọc **bảng CV thống nhất**, wire CV thành **pillar per-track**, rồi migrate data legacy sang và retire hệ review cũ.

## Vì sao
Hoàn tất "1 nguồn sự thật": mọi nơi cần điểm CV đọc 1 bảng. Xoá TODO(WF-03) mà WF-02 để lại.

## Phạm vi
1. **Job-readiness** (`src/features/api/core/graphql/queries/users/job-readiness/job-readiness.service.ts`):
   - Xoá `// TODO(WF-03)`. CV thành **pillar per-track**: mỗi track `cvScore = MAX(score WHERE cv.courseId = track.courseId)` từ bảng thống nhất.
   - Đưa CV vào `depthOf` (renormalize 3 pillar: capstone + interview + cv).
   - `foundation` giữ `codingPercentile`; bỏ `cvScore` khỏi foundation (đã về per-track) — HOẶC giữ 1 global best CV như tín hiệu phụ (chốt với team).
   - Cập nhật graphql-types + spec (invariant test vẫn phải xanh).
2. **Job-board gate** (`src/modules/bussiness/headhuntings/consultant-contact-gate.service.ts`): `getBestCvScore` → `MAX(score)` từ bảng thống nhất (global, mọi source/track).
3. **Migrate legacy:** chuyển `cv_submissions`/`cv_submission_attempts` (có `score`) sang bảng thống nhất (`source=uploaded`, mang `score`/`feedback`/`cdnKey`→`uploadedCdnKey`). Migration + script.
4. **Retire:** sau migrate, deprecate processor `review-cv-submission` + entity legacy (giữ đọc tạm nếu cần, rồi gỡ).

## Chuyển tiếp AN TOÀN (bắt buộc)
- Trong lúc migrate: `getBestCvScore` đọc **UNION MAX(legacy, unified)** để job-board KHÔNG rớt điểm ai. Chỉ gỡ nhánh legacy sau khi migrate xong + verify count khớp.

## Acceptance criteria
- [ ] Job-readiness CV = per-track (MAX theo courseId); invariant test WF-01 vẫn xanh (thêm track không đổi track khác).
- [ ] Job-board gate đọc bảng thống nhất; không user nào tụt điểm sau migrate (verify count).
- [ ] Legacy review retire (hoặc gate tắt) sau khi data đã sang.
- [ ] `tsc` NO NEW ERRORS; eslint 0.

## Rủi ro / lưu ý
- Đây là chỗ dễ rớt điểm CV của user thật → UNION-đọc trong lúc chuyển, gỡ legacy sau cùng.
- Đổi shape job-readiness lần nữa (thêm cv per-track) → cập nhật FE types (WF-05) nếu FE đã bắt đầu.
