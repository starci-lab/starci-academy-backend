# Flashcard History redesign — group Học thẻ theo deck, filter Hỏi nhanh theo mode/level

> Chốt 2026-07-13. Thầy: "lịch sử chỉ lưu những session làm xong rồi thôi" (đã xác nhận: BE cả 2 query đã
> `status: "completed"` filter cứng — không phải bug data) + "REDESIGN LẠI, có thể theo deck, có thể theo due".

## Deep-scan kết luận (grounded, xem widget đã duyệt)

- **`FlashcardReviewHistory`** (Học thẻ) — query `myFlashcardReviewHistory` đã trả `deckId` + join `deck.title`.
  Group theo deck = **render-là-xong**, KHÔNG cần đổi BE.
- **`FlashcardQuizHistory`** (Hỏi nhanh) — `FlashcardQuizSessionEntity` KHÔNG có deck field (session rút thẻ
  CẢ KHÓA qua `cardIds` jsonb phẳng, không FK deck). Group theo deck ở đây cần BE mới (N+1 hoặc join lại qua
  `FlashcardCardEntity.deckId`) — NGOÀI SCOPE lần này. Đã có sẵn `mode`/`level` (đã fetch, chưa dùng để lọc).
- **"Theo due"** — due/mastery sống ở `UserFlashcardReviewEntity` (per-card SM-2), KHÔNG entity nào của 2 query
  history này đụng tới; due là forward-looking, history là backward-looking → BỎ trục này (đã thầy đồng ý ngầm,
  không phản đối khi nêu ra).
- Bug "giật khi chuyển tab" (remount reset effect wipe `items`) — ĐÃ FIX cả 2 file trước khi proposal này (không
  thuộc phạm vi build ở đây).

## Spec

### 1. `FlashcardReviewHistory` — group theo deck
- Giữ nguyên `AsyncContent`/`SurfaceListCard` shell + empty-card fix đã có.
- Khi có data: gom `items` theo `deckId` (giữ thứ tự deck theo `updatedAt` mới nhất của item ĐẦU trong nhóm —
  KHÔNG re-sort lại toàn bộ, chỉ nhóm liền kề theo thứ tự API trả về đã `order: updatedAt DESC`).
- Render mỗi nhóm: 1 header row (`deckTitle` + "N lượt", `bg-surface-1`/tương đương nhẹ — không phải nút, không
  click) rồi tới các `SurfaceListCardItem` con (indent nhẹ) của đúng deck đó, vẫn trong CÙNG 1 `SurfaceListCard`
  container (không tách nhiều card riêng — giữ nguyên rule "1 SurfaceListCard cho list đơn giản").
- KHÔNG đổi BE, KHÔNG đổi GraphQL query.

### 2. `FlashcardQuizHistory` — filter chip mode/level
- Thêm 1 hàng filter phía trên list: chip "Tất cả" + chip theo `mode` (Nhanh/Sâu — giá trị thật trong data) +
  chip theo `level` (Junior/Middle/Senior/Staff, bỏ qua chip level nào không xuất hiện trong `items` hiện có).
- Filter là CLIENT-SIDE trên `items` đã fetch (không phải query param mới) — vì mode/level đã có trong response,
  không cần đổi BE. Local `useState<{ mode: string | null, level: string | null }>`.
- Giữ nguyên list phẳng theo thời gian bên dưới (không group).

## Files to touch
- `src/components/features/learn/Flashcards/FlashcardReviewHistory/index.tsx` (group theo deck)
- `src/components/features/learn/Flashcards/QuizSession/FlashcardQuizHistory/index.tsx` (filter chip)
- Canon: `.claude/fe/patterns/` hoặc `.claude/fe/components/card.md` nếu phát sinh ruling tái dùng (list-group-by-key).

## Verify plan
- `npx tsc --noEmit` + `npm run lint` cả 2 file.
- Browser: auth-gated, không có tài khoản trong môi trường build — giữ 🔨 nếu không click-through được thật,
  theo `[[feedback-dont-mark-done-without-real-verify]]`.
