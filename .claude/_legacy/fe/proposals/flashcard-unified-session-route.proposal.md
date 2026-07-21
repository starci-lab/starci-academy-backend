# Proposal — Hợp nhất route/UI session flashcard (bỏ `decks/[deckId]` khỏi URL, 1 shell "session" chung)

> Chốt 2026-07-11 (prototype `scratchpad/flashcard-unified-session-flow/index.html`, :8090, 4 màn). Thầy: "bỏ deck đi, only session thôi" + "đồng bộ UI, đều render navbar" + "render ra which deck, session id, có đang due hay không" (kèm 2 ảnh so sánh due-review thiếu chrome vs deck-review đầy đủ). Nối tiếp `starci-fe-ui-feedback` phiên trước (thêm sessionId route cho due-review).

## Quyết định đã hỏi & chốt
- **BE giữ nguyên 2 bảng** (`FlashcardReviewSessionEntity` có `deckId` FK · `FlashcardDueReviewSessionEntity` không có) — CHỈ hợp nhất route/UI ở FE. Không migration BE trong scope này.
- **KHÔNG in UUID `sessionId` ra UI** — sessionId chỉ sống trong URL (đủ để share/resume/debug); không thêm dòng hiển thị nào trên `WorkSessionHeader`.

## Bối cảnh hiện có (đã đọc source thật)
- `FlashcardReviewer` (route `review/decks/[deckId]/sessions/[sessionId]`) và `DueReview` (route `review/sessions/[sessionId]`, vừa thêm) là 2 component RIÊNG, cùng idiom resolve-or-start-shim ([[resumable-session-shim-route]], vừa ghi canon) nhưng:
  - `FlashcardReviewer` render qua `WorkSessionHeader` (identity=deck title cố định + counter + level/tag chip + progress-segment) — đúng ảnh 2.
  - `DueReview` KHÔNG dùng `WorkSessionHeader` — chỉ `ProgressMeter` + `BackLink` + `Typography` tên deck rời rạc — thiếu chrome, đúng feedback ảnh 1.
- `WorkSessionHeader` (`src/components/blocks/navigation/WorkSessionHeader/index.tsx`) đã đủ prop cho việc hợp nhất: `identity.name` (tên deck, đổi được PER RENDER — do-review chỉ cần set theo `card.deckTitle` mỗi card), `meta` (slot chip tuỳ ý — thêm 1 chip "Đến hạn" khi due), `counter`/`current`/`total` (progress-segment). KHÔNG cần block mới.
- 2 BE query/mutation set riêng: `useMutateStartFlashcardReviewSessionSwr`/`useQueryMyInProgressFlashcardReviewSessionSwr` (deck-scoped) vs `useMutateStartFlashcardDueReviewSessionSwr`/`useQueryMyInProgressFlashcardDueReviewSessionSwr` (course-scoped, cross-deck) — GIỮ NGUYÊN theo quyết định trên.

## Flow (đã duyệt qua prototype)
1. **Overview** (`/review`, không đổi) — `DueReviewHero` (CTA bắt đầu due) + `FlashcardDeckList` (chọn 1 deck) — không đổi shape, chỉ đổi ĐÍCH điều hướng khi bấm (bước 2).
2. **Entry (shim, route mới)** — bỏ hẳn segment `decks/[deckId]`:
   - Bấm 1 deck → `/review?deck=<deckId>` (shim: resolve-or-start deck-session, dùng lại các mutation/query DECK hiện có).
   - Bấm "Bắt đầu" ở due hero → `/review?start=due` (giữ nguyên marker hiện tại, không đổi).
   - Cả 2 shim đều kết thúc bằng `router.push` vào **CÙNG 1 shape**: `/review/sessions/[sessionId]`.
3. **Session (live, route DUY NHẤT `/review/sessions/[sessionId]`)** — dùng chung 1 component (đổi tên `DueReview` → `FlashcardSession`, hoặc giữ 2 component nhưng CÙNG render qua `WorkSessionHeader` với cùng prop shape — xem "Files to touch"):
   - `identity.name` = **`card.deckTitle`** (đọc từ card hiện tại, KHÔNG từ session) — hoạt động đúng cho CẢ 2 nguồn: deck-session mọi card cùng 1 tên; due-session tên đổi theo từng card (ảnh due-review trộn nhiều deck).
   - `meta` = level chip + tag chip (như cũ) **+ chip "Đến hạn"** khi phiên là due (biết qua: component nào đang render — `DueReview` luôn gắn chip; `FlashcardReviewer` không gắn).
   - `counter`/progress-segment: không đổi, đã đúng.
   - `BackLink`/nút "Trước": due-review hiện thiếu nút "Trước" (Sửa: bổ sung nút Prev giống deck-review — do-review vốn không có state "quay lại re-grade" nhưng ít nhất cho phép xem lại card trước, không grade lại nếu logic đó phức tạp hơn — xem ghi chú Verify).
4. **Summary/done** — không đổi shape (đã dùng chung `WorkSessionHeader` current=total).

## Zones / block briefs (element-aware)
- `WorkSessionHeader` (đã có) — identity/meta/counter/progress-segment, dùng chung cho cả 2 nguồn.
- `BackLink` (đã có, trong `WorkSessionHeader`).
- `FlipCard`/`RatingBar`/`Chip` (đã có) — không đổi.
- KHÔNG cần block mới.

## Files to touch
1. **`useFlashcardNav.ts`** — bỏ phân biệt `decks/<id>` route path; thêm đọc `?deck=<id>` (shim marker cho deck, mirror `?start=due` hoặc giữ tên `?session=due` hiện tại) thay cho path segment `decks/[deckId]`.
2. **XOÁ** `src/app/[locale]/courses/[courseId]/learn/flashcards/review/decks/[deckId]/page.tsx` và `.../decks/[deckId]/sessions/[sessionId]/page.tsx` (2 route cũ) sau khi xác nhận không còn deep-link nào trỏ vào (kiểm `pathConfig().flashcards().review(deckId)` — cần đổi builder này thành shim query-param).
3. **`resources/path/index.ts`** — đổi `flashcards().review(deckId)` từ path segment sang query-param builder (mirror cách `due()` đã làm ở phiên trước); GIỮ `flashcards().due(sessionId)`/`.quiz(sessionId)` không đổi (đã là route sessionId chuẩn).
4. **`FlashcardReviewer/index.tsx`** — bỏ đọc `deckId` từ route param cố định; nhận `deckId` ban đầu từ shim (`?deck=`) chỉ để GỌI start mutation, nhưng SAU KHI vào session, đọc `deckTitle` từ CARD (giữ tương thích ngược, ít thay đổi vì mọi card vốn đã cùng 1 deck).
5. **`DueReview/index.tsx`** — đổi render từ `ProgressMeter`+`BackLink` rời rạc sang `WorkSessionHeader` (mirror `FlashcardReviewer`'s render block dòng 355-410), thêm chip "Đến hạn" vào `meta`, thêm nút "Trước" (goPrev qua `currentIndex`, không re-grade).
6. **`Flashcards/index.tsx`** — điều hướng `goDeck`/`goDue` trỏ vào shim query-param mới thay vì path `decks/[deckId]`.
7. Có thể cân nhắc gộp `FlashcardReviewer` + `DueReview` thành 1 component `FlashcardSession` nhận `deckId?: string` (session-level, chỉ dùng để filter draw ban đầu) — nếu 2 file logic đủ giống sau khi đồng bộ header, cân nhắc ở bước apply (KHÔNG bắt buộc, tránh đổi quá nhiều nếu rủi ro cao).

## Verify plan
- tsc/eslint sạch.
- Browser: bấm 1 deck → xác nhận URL không còn `decks/<id>`, chrome đủ (identity/counter/chip/progress); bấm "Đến hạn hôm nay" → xác nhận chip "Đến hạn" hiện, identity đổi theo card khi qua deck khác, có nút "Trước" hoạt động; refresh giữa phiên → resume đúng qua `/review/sessions/<id>` (không cần biết route cũ).
- Xác nhận KHÔNG còn dead code/dead route cũ (`decks/[deckId]` folder xoá sạch, không còn import thừa).

## Prototype
`scratchpad/flashcard-unified-session-flow/index.html` (:8090, 4 màn, ephemeral — chưa lưu vào `fe/prototypes/`).
