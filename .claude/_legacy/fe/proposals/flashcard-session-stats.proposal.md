# Proposal — Flashcard review-session STATS (nhớ 4-mức + phần yếu + học lại RAG) + revisit-by-URL + XP first-review

> Chốt qua `/starci-fe-layout-brainstorm` 2026-07-12. Prototype: `scratchpad/flashcard-session-stats-flow/index.html` (:8087, 4 màn). Đây là surface DATA (đọc BE) → kèm data-ceiling map + build matrix. **Touches BOTH repos** (BE `starci-academy-backend` + FE `starci-academy`).

## JOB & flow
Kết thúc phiên ôn flashcard (due-review + deck-review) → **màn hoàn thành = trang STATS** (bỏ hẳn màn "done" phẳng cũ). Quay lại URL session đã xong → skeleton → render lại stats (KHÔNG tạo phiên mới).

Luồng: thẻ cuối → **hiệu ứng "đang lưu"** (complete mutation) → **stats**. Trực tiếp URL/refresh → skeleton → stats.

## Shell per surface
- Stats = centered `max-w-3xl`, mirror `MockInterviewScorecard` shell (`src/components/features/learn/MockInterview/MockInterviewScorecard/index.tsx`): Alert/hero + `LabeledCard` + bars. KHÔNG rail.
- Degraded fallback (phiên cũ / chưa có breakdown) = cùng component, chỉ render `reviewedCount` + nút thoát (reviewedCount luôn có sẵn trên session entity).

## Zones (màn stats, trên→dưới) — outcome → chi tiết → hành động
1. **HERO = phân bố 4 mức SM-2** (Again/Hard/Good/Easy, mỗi mức count + %) — KHÔNG ép nhị phân nhớ/quên (thầy: có 4 trạng thái). Dòng rollup PHỤ: "N vững (Good+Easy) · N cần củng cố (Again+Hard)".
2. **Chỉ số phiên** (`LabeledCard` + metric tiles): Tổng thẻ · Thời gian (từ reviewedAt min/max) · Thẻ đến hạn kế (min dueAt) · **XP phiên = +0 cho due-review** (đúng: toàn thẻ đã học trước).
3. **Bạn quên nhiều nhất ở** — nhóm thẻ Again theo `card.tags` (mirror weakTags của Quiz), top tag + count.
4. **Học lại phần này** = `RelatedContentList` (`src/components/blocks/learn/RelatedContentList`, RAG `searchCourseContent`), `query` auto = tag/nội dung thẻ quên → deep-link đúng bài học. **Primary CTA duy nhất** = "Học lại phần yếu nhất →". Bỏ CTA "Phỏng vấn thử" (thầy: chả liên quan).

## CTA/lens (HONEST)
1 primary/màn (Học lại phần yếu). Không ngõ cụt: cả empty-state (không thẻ yếu) vẫn có "Về trang ôn tập". Số liệu 100% từ event thật, không bịa. XP hiển thị đúng quy tắc (không phóng đại +40 như bản nháp).

## Data-ceiling map
| Chỉ số | Trạng thái |
|---|---|
| `reviewedCount`, session status | ✅ có sẵn (session entity, `findById` resolve mọi status) |
| Per-grade (Again/Hard/Good/Easy) count, thời gian, weak-tags, xp phiên | ❌ cần aggregate BE — **`flashcard_review_events` CHƯA có cột `sessionId`** (log chấm điểm không gắn phiên) |
| Study-links | ✅ `RelatedContentList`/`searchCourseContent` block sẵn — chỉ feed query |
| XP first-review +2 | ❌ chưa có — `reviewFlashcard` hiện KHÔNG cấp XP nào (doc code xác nhận) |
| Revisit-by-URL → stats | ❌ bug: resume-check FE chỉ nhận `in_progress` → completed session bị `startSessionAndRedirect` tạo phiên mới |

## Build matrix
### BE (`starci-academy-backend`) — LÀM TRƯỚC
1. **Cột `sessionId` (nullable, indexed) trên `FlashcardReviewEventEntity`** (`src/modules/databases/postgresql/primary/entities/flashcard-review-event.entity.ts`). Nullable → an toàn synchronize, event cũ = null → phiên cũ hiện fallback (đúng thiết kế).
2. **Thread sessionId qua `reviewFlashcard`**: thêm `sessionId?` optional vào `ReviewFlashcardRequest` → `FlashcardReviewService.review()` params → set lên event khi tạo (`flashcard-review.service.ts` ~L563). FE truyền session id hiện tại mỗi lần chấm.
3. **XP +2 lần-đầu**: trong `review()`, nhánh `!existing` (KHÔNG có `UserFlashcardReviewEntity` cũ = lần đầu tuyệt đối, ~L539) → `writeXpHistory({ source: XpSource.FlashcardFirstReview (enum value MỚI), amount: 2, enrollment })` (mirror `mark-as-readed.handler.ts` `LESSON_READ_XP`). Thêm `xpEarned` vào `ReviewFlashcardData` response. ⚠️ Kiểm tra `XpSource` có phải PG enum dùng chung ≥2 cột không (bẫy synchronize ADD VALUE) — nếu có, ALTER TYPE ADD VALUE tay trước.
4. **Query mới `myFlashcardReviewSessionStatsBySessionId(sessionId)`** mirror `myMockInterviewAttemptBySessionId`: resolve session (mọi status, owner-scoped) → aggregate events where `sessionId=X`: per-grade counts, total, time span, xp sum, + join `card.tags` cho weak-tags (top tags của thẻ grade=0). Trả cả `reviewedCount` để fallback.

### FE (`starci-academy`) — SAU BE
5. **Fix resume-check**: `Flashcards/index.tsx` + `DueReview`/`FlashcardReviewer` — session `completed` → route sang stats view thay vì `startSessionAndRedirect`.
6. **Thread sessionId** vào mỗi call `reviewFlashcard` (mutation chấm điểm) để event gắn phiên.
7. **Component stats mới** (mirror MockInterviewScorecard): hero 4-mức + tiles + weak-tags + `RelatedContentList` + degraded fallback + hiệu ứng "đang lưu" + skeleton mirror layout. Bỏ interview CTA.
8. **i18n** vi/en keys mới (`flashcard.review.stats.*`).

## Files to touch (chính)
- BE: `entities/flashcard-review-event.entity.ts`, `flashcard-review.service.ts`, `mutations/flashcard/review-flashcard/graphql-types/request.ts` + `response.ts`, `XpSource` enum, mới: `queries/flashcard/my-flashcard-review-session-stats-by-session-id/*`.
- FE: `Flashcards/index.tsx`, `Flashcards/DueReview/index.tsx`, `Flashcards/FlashcardReviewer/index.tsx`, mới: `Flashcards/FlashcardSessionStats/index.tsx`, query hook + gql, `messages/{vi,en}.json`.

## Verify plan
BE: `tsc` sạch + boot thật (schema sync cột mới + enum) + GraphQL introspection xác nhận query mới + chấm 1 thẻ lần-đầu → xp_histories +2. FE: `tsc`/`eslint` + click-through: hoàn thành phiên → saving → stats 4-mức; refresh URL → skeleton → stats; phiên cũ → fallback. ⚠️ shared repo — commit sớm (đã có sự cố git-checkout mất việc).

## Chốt (thầy 2026-07-12)
- XP = **+2/thẻ học lần đầu**, ôn lại +0. Không deck-bonus.
- 4 mức là chính; rollup vững/cần-củng-cố = phụ (Good+Easy vs Again+Hard).
- Weak grouping theo `card.tags`.
- "xúc đi" → apply NGAY session này.
