# WF-02 · Bỏ composite → per-track card + global foundation

- **Status:** ✅ done (2026-07-04 — tsc/eslint sạch; CV tạm ở foundation `// TODO(WF-03)`, interview bọc try/catch `// TODO(WF-04)`)
- **Repo:** backend (`mtp`)
- **Effort:** M
- **Phụ thuộc:** WF-03 (CV pillar), WF-04 (interview pillar) — mềm; restructure chạy được trước, wire pillar khi deps xong
- **Owner:** (chưa gán)

## Mục tiêu
Refactor `JobReadinessService` từ "1 composite gộp" sang **N per-track card + 1 global foundation**. Bỏ hẳn breadthBonus + điểm blend.

## Vì sao
Composite gộp là NGUYÊN NHÂN đẻ ra breadthBonus (áp lực "3 khóa phải hơn 1 khóa ở 1 con số"). Bỏ số gộp = xoá bài toán tận gốc. Mỗi khóa = 1 card tự đứng; mua thêm = thêm card = rộng range tuyển dụng (không phải điểm cao hơn).

## Phạm vi
File: `src/features/api/core/graphql/queries/users/job-readiness/`

1. **`job-readiness.service.ts`:**
   - Bỏ `breadthBonus`, `bestTrackDepth`-blend, `compositeScore`.
   - Response mới: `{ foundation: { codingPercentile }, tracks: [ { courseId, courseTitle, courseSlug, capstoneScore, interviewScore, cvScore, depthScore, band } ] }`.
   - `depthScore` per track = weighted(capstone, interview, cv) — mỗi pillar 0–100, thiếu = null (không tính hoặc =0, chốt với team).
   - `band` per track (jobReady ≥70 / building ≥40 / needsWork) — dời từ global về **per-track**.
   - `foundation.codingPercentile` = `UserSolvedChallengesProjectionService.getChallengeStrength(userId).percentile` (giữ nguyên, global).
   - CV pillar per track = MAX(cv.score theo khóa) — xem WF-03; tạm để global bestCvScore nếu WF-03 chưa xong.
2. **`constants/`:** xoá `JOB_READINESS_BREADTH_BONUS_*`, `BASE_TRACK_WEIGHT`, `FOUNDATION_WEIGHT`. Thêm trọng số per-track pillar (`CAPSTONE`/`INTERVIEW`/`CV`).
3. **`graphql-types/`:** đổi `JobReadinessData` → `foundation` object + `tracks[]` (mỗi track thêm `cvScore`, `band`, `isQualified`). Bỏ `compositeScore`.
4. **`job-readiness.service.spec.ts`:** cập nhật cho khớp WF-01 invariant.

## Acceptance criteria
- [ ] Response không còn field `compositeScore`; có `foundation` + `tracks[].band`.
- [ ] Thêm 1 track không đổi các track khác + không đổi foundation (test WF-01 xanh).
- [ ] `tsc --noEmit` NO NEW ERRORS; eslint 0; test pass.

## Rủi ro / lưu ý
- Headline FE = track mạnh nhất ("Sẵn sàng · Fullstack 88") + foundation bên cạnh — KHÔNG dựng lại 1 số gộp.
- Nếu CV chưa per-track (WF-03 chưa xong): tạm dùng global `getBestCvScore` cho pillar CV, TODO chuyển per-track.
