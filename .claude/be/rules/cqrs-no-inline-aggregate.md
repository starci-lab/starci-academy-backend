# Rule — Read nặng (aggregate/join/GROUP BY/COUNT) PHẢI qua CQRS projection + CDC, không SQL inline ở resolver

**Bất kỳ query cần aggregate/join nhiều bảng/GROUP BY/COUNT/SUM/DISTINCT PHẢI làm 1 projection (entity + service + CDC listener), KHÔNG viết SQL/logic thẳng trong resolver/handler — chấp nhận boilerplate đổi lấy nhất quán, kể cả scale nhỏ.**

- Recipe 1 projection (5 file + đăng ký 4 chỗ): `entities/<name>-projection.entity.ts` extends `AbstractProjectionEntity` (jsonb `value` + `updatedAt`) · `types/index.ts` · `<name>-projection.service.ts` (`recompute()` = 1 UPSERT heavy SQL + `getX()` đọc kèm stale-check) · `<name>-projection.listener.ts` extends `AbstractProjectionListener` (CDC topic → `deriveTargets` → `recomputeTarget`) · module 3-file.
- ⚠️ Đăng ký DataSource `entities:[...]` trong `primary.module.ts` liệt kê **TAY 3 CHỖ** — quên 1 chỗ → bảng không tạo, query trả `null` im lặng (không throw rõ).
- Ngoại lệ KHÔNG cần projection: list/filter đơn giản (find/order/limit), feed ledger append-only cursor-paginated, per-viewer single-row edge check, write-path/cron tính fresh.

> Đã áp: `src/modules/bussiness/projections/{content-engagement,contribution,course-stats,league-cohort-points}` (mẫu chuẩn 5-file); `codingLeaderboard`/`trendingContents`/`league.rankCohortMembers` đã chuyển hết sang đọc projection (2026-06-15).
> Nguồn: memory `feedback-cqrs-no-inline-aggregate.md` (HOUSE PATTERN, thầy chốt 2026-06-15).

## Đính chính / ca thật (2026-07-09) — flashcard review daily-activity
- Thầy bắt đúng rule này: *"sao phải compute mà k process với cdc?"* khi thấy `myFlashcardReviewStats` tính "số thẻ ôn mỗi ngày" bằng cách scan + GROUP-BY-day LIVE trong service. Sửa: fold `dailyReviewCounts` (per-VN-day map) vào **projection có sẵn** `user_flashcard_stats` — CDC listener trên `flashcard_review_events` ĐÃ chảy sẵn nên KHÔNG cần listener/bảng mới; read = point-read + window-slice tại read-time (không drift). Không tạo bảng mới khi 1 projection cùng grain (per-user) đã tồn tại — CHỈ thêm key vào `value` jsonb (không cần migration, đó là điểm mạnh của `AbstractProjectionEntity`).
- **Nợ trả hết (2026-07-09):** thầy chốt *"áp cdc cho tất cả gì related tới thống kê của interview và flashcard"* — đã projectionize CẢ 3 vi phạm còn lại trong 1 lượt:
  - `user_flashcard_course_stats_projections` (enrollment-keyed, MỚI) — gộp CHUNG cho `MyFlashcardQuizStatsService` (trend/byTag/byDeck) VÀ `MyFlashcardReviewStatsService.computeByDeck`, vì cùng grain enrollment_id. 1 listener subscribe CẢ 2 topic `flashcard_quiz_sessions`+`flashcard_review_sessions` (xác nhận `AbstractProjectionListener` support multi-topic sẵn, không cần hand-roll).
  - `user_mock_interview_course_stats_projections` (enrollment-keyed, MỚI) — `MyMockInterviewStatsService` (trend/modeSplit/byPhase/byKind/weakest), CDC trên `mock_interview_attempts`.
  - Cả 2 đều CÓ migration (tiền lệ `user_challenge_progress_projections` cho thấy dự án viết migration cho bảng projection, không chỉ dựa `synchronize`).
  - GraphQL response shape 2 query cũ (`myFlashcardQuizStats`/`myMockInterviewStats`) KHÔNG đổi sau khi rewire → verify bằng introspection y hệt trước/sau, FE không cần đổi gì.
  - Chi tiết ca: xem `fe/features/flashcards.md` "Tab Thống kê" lượt 3.

[[log-errors-typed-exception]]
