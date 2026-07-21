# Proposal — Mock Interview: Hồ sơ năng lực (byAttribute) + Verdict sẵn sàng làm HERO

> Nguồn: deep-scan "3 trang thống kê nên render gì" (2026-07-09). Job của Phỏng vấn thử = **đo độ sẵn sàng**. Khung hiện
> tại (trend + byPhase/byKind + weakest→CTA) là mẫu tốt nhất trong 3 trang — giữ nguyên, CHỈ thêm 2 hero còn thiếu:
> hồ sơ năng lực (`attributeScores`, vocabulary CỐ ĐỊNH 3 key: `communication`/`structuredThinking`/`tradeoffAwareness`
> — xác nhận trong `grade-mock-interview-session-prompt.service.ts`, an toàn để gộp trend) và phân bố `verdict`
> (pass/borderline/fail). Cả 2 field đã persist trên `mock_interview_attempts` mỗi phiên, chưa hề aggregate. Qua
> `UserMockInterviewCourseStatsProjectionService` (đã tồn tại, CQRS) — CHỈ thêm field vào `value` jsonb.

## Phạm vi (Hero + Bổ trợ, KHÔNG đổi schema)
- Hero 1: **Hồ sơ năng lực** — `byAttribute` breakdown (mirror `byPhase`/`byKind`, avgMax cố định 100 vì `attributeScores`
  không có `max` riêng), áp DÙ mode qna hay design (attribute chấm across cả 2).
- Hero 2: **Phân bố verdict** (pass/borderline/fail counts trên attempts đã scan) — "3/5 phiên gần nhất: Đạt".
- Bổ trợ 1: **Trend có trục ngày** (`completedAt` đã fetch, chưa format hiển thị) + tô theo `verdict` (cần thêm `verdict`
  vào từng trend point).
- Bổ trợ 2: **Render `weakCount`/`attemptCount`** đã fetch trên mỗi row `byPhase`/`byKind`/`byAttribute` (caption nhỏ
  "3/8 phiên yếu").

## Files cần sửa

**BE — `UserMockInterviewCourseStatsProjectionService`** (`user-mock-interview-course-stats-projection.service.ts`):
- Thêm `attributeAcc = new Map<string, BreakdownAccumulator>()` trong `computeAggregate()`; loop over MỌI attempt (cả qna
  lẫn design, không chỉ theo mode) gọi `accumulateAttributeScores(attempt.attributeScores, attempt.createdAt, attributeAcc)`
  — method mới, mirror `accumulatePhaseScores` nhưng `max` CỐ ĐỊNH = 100 (không đọc field `max` vì không tồn tại), vẫn
  cần 1 nguồn `matchedContentId` cho weak-resolve — DÙNG `attempt.matchedContentIds[0] ?? null` (giống phase).
- `byAttribute = this.finalizeBreakdown(attributeAcc)`; đưa vào `resolveWeakest` cùng byPhase/byKind (mở rộng tham số
  thành 3 axis thay vì 2 — `axis: "phase"|"kind"|"attribute"`).
- Thêm `verdictCounts` — tally trong CHÍNH loop hiện có (`for (const attempt of attempts)` đã chạy sẵn), KHÔNG query thêm:
  `pass/borderline/fail` counters +1 theo `attempt.verdict`.
- `types/index.ts`: thêm `byAttribute: Array<MockInterviewCourseStatsBreakdownItemData>`, `verdictCounts: {pass,borderline,fail}` vào `UserMockInterviewCourseStatsResult`; mở `MockInterviewCourseStatsWeakestData.axis` thêm `"attribute"`; thêm `verdict` vào `MockInterviewCourseStatsTrendPointData`.
- `EMPTY_RESULT` cập nhật field mới (mảng/0 rỗng).

**BE — `my-mock-interview-stats`** (`src/features/api/core/graphql/queries/flashcard-decks/my-mock-interview-stats/`):
- `graphql-types/response.ts`: thêm `MockInterviewStatsVerdictCounts {pass,borderline,fail: Int}`; field `byAttribute: [MockInterviewStatsBreakdownItem!]!`, `verdictCounts: MockInterviewStatsVerdictCounts!` vào `MyMockInterviewStatsData`; mở rộng enum-ish `axis` string field trên `MockInterviewStatsWeakest` (đã là String, không cần đổi type, chỉ tài liệu hoá giá trị mới); thêm `verdict: String` vào `MockInterviewStatsTrendPoint`.
- `my-mock-interview-stats.service.ts` (pass-through, không đổi logic — chỉ map field mới từ projection result).
- `types/my-mock-interview-stats.ts` (domain type mirror).

**FE:**
- `src/modules/api/graphql/queries/query-my-mock-interview-stats.ts` + `types/`: select `byAttribute{key,avgScore,avgMax,weakCount,attemptCount}`, `verdictCounts{pass,borderline,fail}`, `trend{...,verdict}`.
- `src/components/features/learn/MockInterview/MockInterviewStats/index.tsx`:
  - Hero card mới NGAY SAU headline avgScore: **Hồ sơ năng lực** — 3 hàng (communication/structuredThinking/tradeoffAwareness) dùng CÙNG row-shape với byPhase/byKind (label + `ProgressMeter` avgScore/avgMax + caption weakCount/attemptCount), label qua i18n MỚI `mockInterview.attribute.<key>`.
  - Hero card mới: **Verdict sẵn sàng** — 3 chip/segment pass=success, borderline=warning, fail=danger, số đếm + tổng (vd "3/5 Đạt · 1 Cần cải thiện · 1 Chưa đạt").
  - Trend chart: thêm label ngày dưới mỗi bar (format `completedAt`, dùng date-format util có sẵn) + màu bar theo `verdict` thay vì chỉ theo băng điểm số (giữ băng điểm cho ProgressMeter, đổi CHỈ bar trend sang verdict-tint nếu 2 tín hiệu không xung đột nhau về mặt đọc — nếu dễ rối thì giữ màu theo điểm, chỉ thêm border/dot nhỏ theo verdict).
  - byPhase/byKind/byAttribute rows: thêm caption nhỏ dưới mỗi label `mockInterview.statsWeakRatioCaption` `{weak: weakCount, total: attemptCount}`.
  - `weakest.axis === "attribute"` → label qua `mockInterview.attribute.<key>` (mở nhánh label hiện tại đang chỉ check `phase`/`kind`).
- i18n `mockInterview.*`: thêm `attribute.communication`, `attribute.structuredThinking`, `attribute.tradeoffAwareness`, `statsAttributeTitle`, `statsVerdictTitle`, `statsVerdictPass/Borderline/Fail`, `statsWeakRatioCaption` — vi.json/en.json.

## Verify
- `tsc --noEmit` + `eslint` sạch cả 2 repo.
- Đụng BE → verify runtime thật: gọi lại `myMockInterviewStats` trên backend đang chạy (:3001), xác nhận `byAttribute`/`verdictCounts` khớp `docker exec starci-postgres psql` đếm tay trên `mock_interview_attempts` của 1 user thật đủ ≥3 attempt.
- Browser: refresh tab Thống kê Phỏng vấn thử, xác nhận 2 hero mới hiện đúng, weakest callout vẫn hoạt động khi trúng axis "attribute".

## Trạng thái
⏳ PENDING (2026-07-09) — brainstorm/deep-scan xong, chưa build.
