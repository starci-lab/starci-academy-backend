# Proposal — Flashcard Review ("Ôn tập"): Thẻ đến hạn + Tỷ lệ nhớ làm HERO

> Nguồn: deep-scan phân tích "3 trang thống kê nên render gì" (2026-07-09, artifact). Job của Ôn tập = **duy trì trí nhớ**,
> không phải đếm lượt. Hero hiện tại (bar-chart "số thẻ đã ôn 14 ngày") đo CÔNG SỨC — nâng thành đo KẾT QUẢ: thẻ đến hạn
> (còn bao việc) + tỷ lệ nhớ (có work không). Cả 2 projection liên quan (`UserFlashcardStatsProjectionService` global-per-user,
> `UserFlashcardCourseStatsProjectionService` per-enrollment) đã tồn tại (CQRS, CDC) — CHỈ thêm key vào `value` jsonb, KHÔNG
> migration/listener mới (theo đúng tiền lệ đính chính trong `.claude/be/rules/cqrs-no-inline-aggregate.md`).

## Phạm vi (Hero + Bổ trợ, KHÔNG đổi schema)
- Hero 1: **Thẻ đến hạn hôm nay + dự báo 7 ngày** — từ `user_flashcard_reviews.due_at`, scope `enrollment_id`.
- Hero 2: **Tỷ lệ nhớ (retentionRate) làm headline** + **phân bố grade** (Again/Hard/Good/Easy) — retentionRate đã tính sẵn
  (global projection), grade distribution mới, từ `flashcard_review_events.grade` (đã scan trong `recompute`, chỉ tally thêm).
- Bổ trợ 1: **Phân bố độ chín thẻ** (mastered/learning/new, scope course) — từ `repetitions` trên `user_flashcard_reviews`.
- Bổ trợ 2: **Heatmap 90 ngày** thay bar-chart 14 ngày — `dailyReviewCounts` ĐÃ retain 90 ngày, chỉ cần đổi
  `DAILY_ACTIVITY_DAYS` 14→90 trong `MyFlashcardReviewStatsService` + FE giữ 14 ngày gần nhất cho bar-chart hiện có + thêm
  heatmap dùng cả 90.
- Bổ trợ 3: **Render `longestStreak`/`lastReviewedAt`** — đã fetch qua `queryMyFlashcardStats`, chỉ cần hiển thị (0 BE).

## Files cần sửa

**BE — `UserFlashcardStatsProjectionService`** (`src/modules/bussiness/projections/user-flashcard-stats/`):
- `foldStats()`: thêm `gradeDistribution: {again,hard,good,easy}` — tally trực tiếp trên `history` đã scan (không query thêm).
- `types/index.ts`: thêm `gradeDistribution` vào `PersistedUserFlashcardStatsValue` + `UserFlashcardStatsResult`.

**BE — `my-flashcard-stats` query** (`src/features/api/core/graphql/queries/flashcard/my-flashcard-stats/`):
- `graphql-types/response.ts`: thêm `FlashcardGradeDistribution {again,hard,good,easy: Int}` + field `gradeDistribution` vào `MyFlashcardStatsData`.
- resolver/service: pass-through field mới từ projection.

**BE — `UserFlashcardCourseStatsProjectionService`** (`src/modules/bussiness/projections/user-flashcard-course-stats/`):
- Thêm method mới `computeDueAndMastery(manager, enrollmentId)`: 2 raw query scoped `enrollment_id`:
  1. `dueToday` = COUNT `user_flashcard_reviews` WHERE `enrollment_id=$1 AND due_at <= now()`.
  2. `dueForecast` = GROUP BY VN-day COUNT WHERE `due_at > now() AND due_at <= now() + interval '7 days'` (zero-fill 7 ngày, mirror cách `foldDailyCounts` zero-fill).
  3. `masteryBreakdown`: `reviewed_total`/`mastered` = COUNT/`COUNT FILTER (WHERE repetitions>=2)` trên `user_flashcard_reviews WHERE enrollment_id=$1`; `totalCards` = COUNT `flashcard_cards` JOIN `flashcard_decks` JOIN `enrollments` WHERE `enrollments.id=$1`; `learning = reviewed_total - mastered`, `new = max(0, totalCards - reviewed_total)`.
- Gọi method này trong `recompute()`, gộp vào `value` cùng `reviewByDeck`.
- `types/index.ts`: thêm `dueToday: number`, `dueForecast: Array<{date,count}>`, `masteryBreakdown: {mastered,learning,new}` vào `UserFlashcardCourseStatsResult`.

**BE — `my-flashcard-review-stats`** (`src/features/api/core/graphql/queries/flashcard/my-flashcard-review-stats/`):
- `my-flashcard-review-stats.service.ts`: `DAILY_ACTIVITY_DAYS` 14 → 90; `compute()` map thêm `dueToday`/`dueForecast`/`masteryBreakdown` từ `userFlashcardCourseStatsProjectionService.getStats(...)` (field mới ở trên).
- `graphql-types/response.ts`: thêm `FlashcardDueForecastPoint {date:String, count:Int}`, `FlashcardMasteryBreakdown {mastered,learning,new: Int}`, field `dueToday: Int`, `dueForecast: [FlashcardDueForecastPoint!]`, `masteryBreakdown: FlashcardMasteryBreakdown` vào `MyFlashcardReviewStatsData`.
- `types/index.ts` (domain type mirror).

**FE:**
- `src/modules/api/graphql/queries/query-my-flashcard-review-stats.ts` + `types/`: select field mới.
- `src/modules/api/graphql/queries/query-my-flashcard-stats.ts` + `types/`: select `gradeDistribution`.
- `src/components/features/learn/Flashcards/FlashcardReviewStats/index.tsx`:
  - Hero card mới ĐẦU trang: số lớn `dueToday` (label "Thẻ đến hạn hôm nay") + mini bar 7 ngày `dueForecast` bên cạnh/dưới.
  - Hero card: `retentionRate` (đã fetch, hiện đang chỉ 1 caption nhỏ ở `FlashcardStatsStrip`) nâng thành headline số lớn trong trang Thống kê + `ProgressMeter`; thêm stacked-bar phân bố grade (Again/Hard/Good/Easy, màu theo `foundations/color`: Again=danger, Hard=warning, Good/Easy=success 2 sắc độ).
  - Bổ trợ: `SegmentBar` mastered/learning/new (mirror pattern `FlashcardStatsStrip` đã dùng cho mastery, scope course).
  - Bổ trợ: đổi bar-chart 14-ngày hiện có → giữ nguyên (dùng `dailyActivity.slice(-14)`), thêm heatmap-style hiển thị 90 ngày bên dưới (component MỚI nhẹ, hoặc tái dùng `LabeledCard` + CSS grid 7-cột × 13-hàng, màu theo cường độ — không có block canonical heatmap sẵn, KHÔNG bịa primitive lạ, dùng div grid + `foundations/color` scale).
  - Render `longestStreak` (chip cạnh streak hiện có) + `lastReviewedAt` (caption "lần cuối ôn: ...", dùng date util có sẵn trong repo).
- i18n `flashcard.review.*`: thêm key mới (dueTodayLabel, dueForecastLabel, retentionHeroLabel, gradeDistributionLabel, gradeAgain/Hard/Good/Easy, masteryBreakdownLabel, heatmapLabel, longestStreakChip, lastReviewedCaption) — cả vi.json/en.json.

## Verify
- `tsc --noEmit` + `eslint` sạch cả 2 repo.
- Đụng BE (projection mới field) → verify runtime thật: backend đang chạy sẵn (:3001), gọi lại `myFlashcardReviewStats`/`myFlashcardStats` qua GraphQL, xác nhận field mới trả về đúng (không null/lỗi), so khớp `docker exec starci-postgres psql` đếm tay 1 case thật.
- Browser: refresh tab Thống kê Ôn tập, xác nhận hero/bổ trợ mới hiện đúng, không vỡ layout mobile.

## Trạng thái
⏳ PENDING (2026-07-09) — brainstorm/deep-scan xong, chưa build.
