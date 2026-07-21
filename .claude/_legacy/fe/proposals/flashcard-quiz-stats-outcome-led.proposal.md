# Proposal — Flashcard QUIZ "Hỏi nhanh" Thống kê: render LẠI dẫn bằng CHẨN ĐOÁN lỗ hổng

**Feature:** `FlashcardQuizStats` (tab "Thống kê" trong setup Hỏi nhanh, `QuizSession/FlashcardQuizStats`)
**Chốt:** 2026-07-13 · **Brainstorm:** `starci-fe-layout-brainstorm` (seed 28 phiên + deep-scan 2 repo)
**Prototype:** `show_widget` before/after (`quiz_stats_diagnosis_redesign`) — 1 surface, không dựng :8080.

## JOB (khác review)
Tab này = **chẩn ĐOÁN lỗ hổng kiến thức** (review = duy trì trí nhớ). → HERO phải là "topic nào yếu / câu
nào hay sai → học/ôn cái đó", KHÔNG nhân bản khuôn review (leech-thẻ-hay-quên). Hoạt động ≠ học được: hạ
vanity (avg coverage, XP) xuống, dẫn bằng việc-cần-sửa.

## Shell (giữ) + Zones (render lại)
Shell không đổi (tab trong setup, đọc-hẹp 1 cột). 5 zone, thứ tự OUTCOME-first:

| # | Zone | Block THẬT | Build |
|---|---|---|---|
| 1 | **HERO "Lỗ hổng cần lấp"** — `weakTagLinks` xếp hạng coverage ASC (MỌI tag, ko chỉ `[0]`), mỗi hàng tag + coverage-chip (danger<50 / warning<70) + onPress deep-link module/content; primary CTA "Học {topic yếu nhất}" | `SectionCard accent` + `SurfaceListCard`+`SurfaceListCardRow` (hover="underline") + `components/button` primary | **render-là-xong** (data đã fetch — chỉ thôi vứt `[1..n]`) |
| 2 | **"Câu hay sai"** — per-card coverage thấp nhất (leech-analogue quiz): question + "sai X/Y lần" chip + deep-link | `SurfaceListCard` rows | **aggregate-BE** (fold mới, mirror `leechCards` SQL `:769-790`) |
| 3 | **Bản đồ chủ đề** — mastery theo tag | `TopicMasteryGrid` (đã có) | **giữ** |
| 4 | **Độ phủ theo thời gian** — LineChart trục `completedAt` + tile `completedSessionCount` | recharts `LineChart` (như review retentionTrend) + metric tile | **render-là-xong** (+1 Field `completedSessionCount`) |
| 5 | **Theo bộ thẻ** — đổi div-viền-tay → list | `SurfaceListCard`+`SurfaceListCardRow` | **giữ, đổi block** |

## State matrix + lens
- **insufficientData** (server, <3 phiên completed) → `EmptyState` (giữ) = lời mời "Bắt đầu quiz" (onStartQuiz) — phễu khóa, không ngõ cụt.
- **≥3 phiên, có weak tag** → HERO danger + CTA học topic yếu nhất (Fogg trigger, số THẬT từ coverage).
- **≥3 phiên, mọi tag ≥70%** → HERO chuyển giọng tích cực "Không còn lỗ hổng lớn" + CTA "Thử level cao hơn" (HONEST — không fake lỗ hổng).
- **Câu hay sai rỗng** → ẩn zone 2 (không hiển thị khối trống).

## Data-ceiling map (đang render / persist-chưa-vẽ / compute)
**(A) Đang render:** `weakTagLinks[0]` (chỉ 1) · `byTag` mastery · avg-coverage headline (mean client) · trend bars-tay (KHÔNG trục) · `byDeck` div-viền-tay.

**(B) Persist-chưa-vẽ (khoảng trống):**
- `weakTagLinks[1..n]` — đã fetch, VỨT. → zone 1. **render-là-xong**.
- per-card `results[].correctBlanks/totalBlanks` — gộp vào tag/deck, chưa surface per-card. → zone 2 "câu hay sai". **aggregate-BE**.
- `trend[].completedAt` — fetch, chưa dùng làm trục. → zone 4 x-axis. **render-là-xong**.
- `completedSessionCount` — trong projection value, gộp thành bool `insufficientData`. → tile zone 4. **render-là-xong** (thêm Field).
- `mode`/`level` (quick·deep·junior·senior) — cột, chưa gộp. → NÂNG CAO (để sau, không trong scope này).

**(C) Compute:** `computeQuiz` trong `UserFlashcardCourseStatsProjectionService` (scan 50 phiên `completed`, CDC-triggered fold, KHÔNG inline). Zone 2 "câu hay sai" = fold mới per-card trong recompute (mirror `computeReviewOutcome` leech đã có) → thêm field vào `value` jsonb (KHÔNG đổi schema DB).

## Files to touch (thứ tự BE → FE)
**BE (`starci-academy-backend`):**
1. `projections/user-flashcard-course-stats/types/index.ts` — thêm `FlashcardQuizHardCardData` (cardId/question/wrongCount/attempts/deckId/deckTitle/moduleId/contentId) + `completedSessionCount` vào `MyFlashcardQuizStatsResult` (nếu chưa) + `hardCards` field.
2. `...user-flashcard-course-stats-projection.service.ts` — trong `computeQuiz`: fold mới `computeQuizHardCards` (per-card từ `results[]`, coverage ASC, min-attempt threshold, join card.question + deck) → `value.quizHardCards`; surface `completedSessionCount` ra result.
3. GraphQL `queries/flashcard/my-flashcard-quiz-stats/graphql-types/response.ts` — ObjectType `FlashcardQuizHardCard` + field `hardCards` + `completedSessionCount` trên `MyFlashcardQuizStatsData`.
4. service + resolver + types map through.

**FE (`starci-academy`):**
5. `queries/query-my-flashcard-quiz-stats.ts` + type — thêm `hardCards`, `completedSessionCount`.
6. `QuizSession/FlashcardQuizStats/index.tsx` — dựng lại 5 zone (đang là 5 block phẳng): zone 1 `SurfaceListCard` mọi weakTag + CTA; zone 2 hardCards; zone 3 giữ; zone 4 recharts LineChart + tile; zone 5 `SurfaceListCard`.
7. i18n `flashcard.quiz.*` vi/en parity — key mới: quizStatsGapLabel, quizStatsGapCta, quizStatsHardCardsLabel, quizStatsHardCardMeta, quizStatsNoGapTitle, quizStatsNoGapCta, quizStatsSessionCount, quizStatsTrendAxisLabel.

## Verify plan
- `npx tsc --noEmit` + `npm run lint` sạch 2 repo.
- BE boot LIVE + introspection field mới (`hardCards`, `completedSessionCount`).
- SQL fold "câu hay sai" chạy THẬT trên Postgres (docker psql) khớp 28 phiên seed.
- Click-through auth-gated — nếu không login được thì BE-runtime-verified + báo chưa test tay (tiền lệ file này).

## Đã seed (prereq xong)
28 phiên `flashcard_quiz_sessions` status=completed cho enrollment `bbefc149-7f5b-450b-9102-1f468b59933e` (coverage cải thiện, weak_tags [BullMQ, Scaling], per-card correctBlanks phân hoá) + xoá projection row cũ để recompute.
