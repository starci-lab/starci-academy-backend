# Proposal — Flashcard Quiz ("Hỏi nhanh"): weakTags→CTA làm HERO + sửa gate sai

> Nguồn: deep-scan "3 trang thống kê nên render gì" (2026-07-09). Job của Hỏi nhanh = **chẩn đoán lỗ hổng**. Mỏ vàng bị bỏ
> phí: entity `flashcard_quiz_sessions.weakTags` đã snapshot `{tag,coverage,moduleId,contentId}` mỗi phiên — service hiện
> tính lại byTag từ raw `results[]` và VỨT link đi. Đồng thời cổng "chưa đủ dữ liệu" đang gate sai (theo lượt-ôn-cả-đời qua
> `myFlashcardStats.totalReviewed`, không theo phiên quiz). Cả 2 fix qua `UserFlashcardCourseStatsProjectionService`
> (đã tồn tại, CQRS) — CHỈ thêm field vào `value` jsonb.

## Phạm vi (Hero + Bổ trợ, KHÔNG đổi schema)
- Hero 1: **weakTags → CTA "Học lại bài X"** — derive từ `sessions[].weakTags` (đã load trong `computeQuiz`, KHÔNG query thêm), giữ occurrence GẦN NHẤT mỗi tag (sessions đã sort DESC).
- Hero 2: **Mastery theo tag (`byTag`) lên ĐẦU trang** — thuần re-order FE, 0 BE.
- Bổ trợ 1: **Sửa cổng insufficient-data** — gate theo số phiên quiz `completed` đã scan, không theo lượt ôn cả đời.
- Bổ trợ 2: **Headline độ phủ trung bình** (client-compute mean `trend[].coverage`, mirror cách Mock Interview tính `avgScore`) + render `xpEarned` trend (đã fetch, chưa hiện).

## Files cần sửa

**BE — `UserFlashcardCourseStatsProjectionService`** (`user-flashcard-course-stats-projection.service.ts`):
- `computeQuiz()`: sau khi có `sessions` (đã DESC theo `updatedAt`), thêm `computeWeakTagLinks(sessions)`:
  - Duyệt `sessions` theo thứ tự đã có (mới nhất trước), với mỗi session lặp `session.weakTags ?? []`, ghi vào `Map<tag, {tag,coverage,moduleId,contentId}>` CHỈ KHI tag chưa có trong map (giữ occurrence MỚI NHẤT, bỏ qua các lần cũ hơn).
  - Trả mảng đã sort theo `coverage` TĂNG DẦN (yếu nhất trước), cap `STATS_MAX_TAGS` (dùng lại const có sẵn).
- Thêm `completedSessionCount = sessions.length` (đã có sẵn biến, chỉ export ra `value`).
- `types/index.ts`: thêm `weakTagLinks: Array<{tag,coverage,moduleId:string|null,contentId:string|null}>`, `completedSessionCount: number` vào `UserFlashcardCourseStatsResult`.

**BE — `my-flashcard-quiz-stats`** (`src/features/api/core/graphql/queries/flashcard/my-flashcard-quiz-stats/`):
- `my-flashcard-quiz-stats.service.ts`: thêm hằng `MIN_SESSIONS_FOR_STATS = 3` (mirror `MIN_ATTEMPTS_FOR_STATS` bên Mock Interview); `compute()` trả thêm `insufficientData: completedSessionCount < MIN_SESSIONS_FOR_STATS`, `weakTagLinks`.
- `graphql-types/response.ts`: thêm `FlashcardQuizWeakTagLink {tag:String, coverage:Float, moduleId:ID nullable, contentId:ID nullable}`, field `insufficientData: Boolean!`, `weakTagLinks: [FlashcardQuizWeakTagLink!]!` vào `MyFlashcardQuizStatsData`.
- `types/index.ts` (domain type mirror).

**FE:**
- `src/modules/api/graphql/queries/query-my-flashcard-quiz-stats.ts` + `types/`: select `insufficientData`, `weakTagLinks{tag,coverage,moduleId,contentId}`.
- `src/components/features/learn/Flashcards/QuizSession/FlashcardQuizStats/index.tsx`:
  - Đổi gate: dùng `stats.insufficientData` (từ chính query này) thay `queryMyFlashcardStats().totalReviewed < RETENTION_MIN_REVIEWS` — bỏ hẳn dependency sang query kia cho gate (giữ nếu còn dùng chỗ khác).
  - Section thứ tự MỚI: (1) Hero weakest-tag callout (mirror `Alert status="warning"` + CTA của `MockInterviewStats`'s weakest — dùng `weakTagLinks[0]`, deep-link qua `matchedContent`/course-content path nếu có `moduleId`/`contentId`, fallback course home nếu null) → (2) `TopicMasteryGrid` (byTag, ĐẨY LÊN đầu, trước sparkline) → (3) headline độ phủ TB (client mean `trend[].coverage`, format %) → (4) trend sparkline (thêm label `xpEarned` cạnh mỗi bar, giống cách Mock Interview show overallScore trên mỗi bar) → (5) byDeck list (giữ nguyên).
- i18n `flashcard.quiz.*`: thêm key (quizStatsWeakestCallout, quizStatsWeakCta, quizStatsAvgCoverageLabel) — vi.json/en.json. Tái dùng string pattern của `mockInterview.statsWeakestCallout`/`statsWeakCta` cho nhất quán giọng.

## Verify
- `tsc --noEmit` + `eslint` sạch cả 2 repo.
- Đụng BE → verify runtime thật: gọi lại `myFlashcardQuizStats` qua GraphQL trên backend đang chạy, xác nhận `weakTagLinks`/`insufficientData` đúng với 1 case thật (so khớp DB `flashcard_quiz_sessions.weak_tags` bằng psql).
- Browser: refresh tab Thống kê Hỏi nhanh, xác nhận thứ tự section mới + CTA weakest bấm được (deep-link đúng module khi có).

## Trạng thái
⏳ PENDING (2026-07-09) — brainstorm/deep-scan xong, chưa build.
