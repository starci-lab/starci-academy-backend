# Proposal — Flashcard Quiz: interval-preview hint trên RatingBar

## Feedback gốc
Thầy (2026-07-11), soi `/learn/flashcards/review/sessions/...` (DueReview): *"bên này quên khó có 1 ngày gì ở dưới và có spacing ở dưới mà"* — chỉ ra `RatingBar` ở màn Ôn tập (DueReview) hiện dòng phụ "1 ngày"/"4 ngày"... dưới mỗi nút (dự báo khoảng cách SM-2 tiếp theo nếu chọn grade đó), muốn Quiz mode (`QuizSession`) cũng có y hệt — nối tiếp feedback trước đó *"đồng bộ ui ux với học của quiz"*.

## Đã xác nhận qua source thật (không phải cảm giác)
- `RatingBar`/`RatingOption` (`blocks/buttons/RatingBar/index.tsx`) đã có sẵn field optional `hint` (dòng phụ dưới label) — component KHÔNG cần đổi.
- **`DueReview`** (`src/components/features/learn/Flashcards/DueReview/index.tsx` dòng 249-268) tính `hint` từ `card.nextIntervals` (`{again,hard,good,easy}` số ngày) → `t("flashcard.review.intervalDays", {count: days})`. Data này đến từ query `myDueFlashcards` (`query-my-due-flashcards.ts`) — field `nextIntervals` nằm trên type card CỦA QUERY NÀY.
- **`QuizSession`** (Quiz mode) VÀ **`FlashcardReviewer`** (Học/study mode) đều build `ratingOptions` KHÔNG có `hint` — cả 2 đều CHƯA đồng bộ với DueReview, không chỉ riêng Quiz.
- `QuizSession` lấy card qua `queryFlashcardDeck` (`query-flashcard-deck.ts`) — type card của query này (`id, question, answer, explanation, level, tags, sortIndex, defaultLocale, isPremium`) **KHÔNG có `nextIntervals`** — đây là type/field-set KHÁC hẳn `myDueFlashcards`'s card type, không phải chỉ thiếu 1 dòng field trong FE query.
- **`nextIntervals` là dữ liệu SM-2 THEO USER HIỆN TẠI** (trạng thái ôn tập cá nhân của card đó) — về bản chất không thuộc "nội dung tĩnh của thẻ" mà `flashcardDeck` trả về (query duyệt deck, không gắn user progress). Thêm field này vào Quiz/Học cần **BE mở rộng** (thêm resolver/field trả `nextIntervals` cho card theo user hiện tại trên đúng query Quiz/Học đang dùng, hoặc 1 query preview riêng) — không phải chỉ thêm dòng vào FE query document.

## Việc cần làm (chưa build — CHỐT xong mới build)
1. **Xác nhận với BE** (`starci-academy-backend`): review/reuse logic tính `nextIntervals` hiện có cho `myDueFlashcards`, expose lại cho card type mà `flashcardDeck`/quiz-session dùng (khi user đã đăng nhập) — cần biết field SM-2 state (easeFactor/interval/repetitions) của user cho card đó đã có sẵn lưu ở đâu để tính lại 4 giá trị preview.
2. FE: thêm `nextIntervals` vào field selection của query mà `QuizSession` VÀ `FlashcardReviewer` dùng (nếu cùng 1 query) hoặc từng query riêng.
3. `QuizSession`/`FlashcardReviewer`: copy đúng logic `daysForGrade`/`hint` từ `DueReview` (dòng 249-268) vào `ratingOptions` — đúng nguyên bản, không viết lại khác.
4. Verify: cả 3 chế độ (Ôn tập/Học/Quiz) hiện "X ngày" nhất quán dưới mỗi nút rating.

## Ghi chú phạm vi
- KHÔNG tự sửa trong phiên feedback nhanh vì đụng BE + cần xác nhận field SM-2 sẵn có — route qua `starci-fe-block-apply` (hoặc build trực tiếp nếu thầy duyệt ngay) khi có quyết định.
- Route: `starci-fe-block-apply` (1 block `RatingBar` usage, không phải cả layout) — build cả 2 repo nếu cần mở BE.

## Build (2026-07-12) — thầy duyệt "làm cả 2" (sửa chữ + đồng bộ Quiz/Học)

**BE** (`starci-academy-backend`):
- `FlashcardNextIntervalsObject` (GraphQL `ObjectType`) dời từ `my-due-flashcards/graphql-types/response.ts` sang `@modules/databases` (khai trong `flashcard-card.entity.ts`) — tránh vi phạm layering (entity ở `@modules/databases` không được import ngược từ `features/api`) và tránh trùng tên type trong schema.
- `FlashcardCardEntity` thêm field runtime-only `nextIntervals?: FlashcardNextIntervalsObject` (không `@Column`, y hệt style `dueCount`/`masteredCount` trên `FlashcardDeckEntity`).
- `NEW_CARD_STATE` export từ `FlashcardReviewService` (trước là module-private) để `FlashcardDeckReadService` tái dùng đúng default SM-2 state.
- `FlashcardDeckReadService.getById(flashcardDeckId, locale, userId?)` — sau khi đọc ES, nếu có `userId` thì batch-load `UserFlashcardReviewEntity` (khoá theo `user_id`, mirror `annotateViewerStats`) rồi gọi `flashcardReviewService.previewIntervals()` (CHÍNH XÁC hàm `reviewFlashcard` dùng khi commit — không lệch số) stamp vào từng card.
- `FlashcardDeckResolver` (`flashcardDeck` query) thread `@KeycloakGraphQLUser()` → truyền `user.id` vào `getById`.

**FE** (`starci-academy`):
- `query-flashcard-deck.ts`: thêm `nextIntervals { again hard good easy }` vào card selection.
- `FlashcardCardEntity` (`modules/types/entities/flashcard-card.ts`): thêm `FlashcardNextIntervals` type + field optional `nextIntervals`.
- `FlashcardReviewer/index.tsx` + `QuizSession/index.tsx`: copy nguyên `daysForGrade`/`ratingOptions` logic từ `DueReview` (dòng 249-268) — di chuyển khai báo `card` lên trước `ratingOptions` (2 file) để `card.nextIntervals` khả dụng khi build hint. `QuizSession` chỉ có 1 `ratingOptions`/`card` dùng chung cho cả 2 RatingBar call-site (fallback + cloze) — không cần sửa riêng từng site.
- Copy rõ nghĩa hơn: `flashcard.review.intervalDays` vi "{count} ngày" → **"Gặp lại sau {count} ngày"**; en "{count}d" → **"Next review in {count}d"**.

**Verify**: `tsc --noEmit` + eslint sạch trên toàn bộ file đụng tới cả 2 repo (0 lỗi mới — các lỗi baseline có sẵn không liên quan đến flashcard). **CHƯA test tay browser**: port 3000 (D:\Repositories\starci-academy) đang bị 1 session khác giữ khoá `.next/dev/lock` (không start được server riêng); tab browser sẵn có trong session này chưa đăng nhập (không có tài khoản thật để vào màn ôn tập auth-gated) — giữ 🔨 theo [[feedback-dont-mark-done-without-real-verify]], thầy tự refresh tab đang mở (cùng filesystem, Fast Refresh sẽ tự áp) để soi lại 3 chế độ Ôn tập/Học/Quiz.
