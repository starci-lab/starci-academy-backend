# Flashcard "Lịch sử" relayout — search + grouping toggle + per-run outcome bar

> Chốt 2026-07-13 (prototype :8080 duyệt "ok xúc"). Nối tiếp `flashcard-history-redesign` (đã group Học thẻ theo
> deck accordion + filter chip Hỏi nhanh) — vòng này thầy: *"lịch sử render ntn có make sense không, không có
> thanh search gì hết à"* → RELAYOUT cả tab Lịch sử theo JOB "tìm + revisit 1 lượt", grounded web-research
> (Smashing search/sort/filter · list-with-search-and-grouping · activity-log time-bucket).

## JOB & shell
- Surface = tab "Lịch sử" trong `Flashcards` dashboard-hub (2 mode: Học thẻ `FlashcardReviewHistory` · Hỏi nhanh
  `FlashcardQuizHistory`). JOB = **tìm 1 lượt cụ thể + hiểu lượt đó làm tốt/tệ + revisit**. Shell không đổi
  (nằm trong tab hub) — chỉ relayout NỘI DUNG tab.

## Data ceiling (đã deep-scan — render-là-xong, KHÔNG đổi BE)
- Học thẻ item: `id·updatedAt·deckId·deckTitle·cardCount·reviewedCount·xpEarned`. → search theo `deckTitle`,
  bucket theo `updatedAt`, bar theo `reviewedCount/cardCount`. TẤT CẢ đã fetch.
- Hỏi nhanh item: `id·updatedAt·mode·level·cardCount·coverage·xpEarned·weakTags[]`. → bucket theo `updatedAt`,
  filter mode/level đã có; coverage đã có (giữ chip). Quiz KHÔNG có deck field → KHÔNG group theo deck.

## Spec

### Chung
- Helper mới `historyBuckets.ts` (`groupByTimeBucket<T>(items, getIso, now?)`) — trả bucket có thứ tự
  `today/week/month/older`, bỏ bucket rỗng, giữ item DESC trong bucket (data đã sort). i18n label
  `flashcard.timeBucket.<key>` (dùng chung 2 surface).

### `FlashcardReviewHistory` (Học thẻ)
- **Toolbar**: `TextField`+`Input type="search"` (tìm bộ thẻ, mirror `FlashcardDeckList`) · count "N lượt" ·
  `SegmentedControl` group `Theo bộ thẻ ↔ Theo thời gian` (default `deck`).
- **Search** filter client-side theo `deckTitle` (contains, không dấu-insensitive nhẹ = lowercase) TRƯỚC khi group.
- **Group=deck**: `Accordion variant="surface"` (đã có) — panel row giờ thêm `ProgressMeter` (no-label, color
  theo ratio: ≥0.8 success · else warning) = reviewed/cardCount.
- **Group=time**: mỗi bucket = time-header (`body-xs` uppercase muted) + `SurfaceListCard` các row; row title =
  `deckTitle` (vì không group theo deck), meta = date · X/Y thẻ, + bar.
- **Filter-empty** (search không khớp) → `<Card><CardContent>` message (khớp shape sibling, §2 canon).

### `FlashcardQuizHistory` (Hỏi nhanh)
- Giữ 2 hàng filter chip (mode/level) đã có.
- **Group=time** (thay flat list): mỗi bucket = time-header + `SurfaceListCard`; row GIỮ NGUYÊN (chip level +
  coverage + xp + expand weakTags) — coverage đã là chip rõ, row đã dense/expandable → KHÔNG thêm bar (khác Học
  thẻ vốn chưa có tín hiệu completion nào). expand vẫn keyed `expandedId` global.
- Filter-empty giữ nguyên (đã bọc Card).

## Files to touch
- `src/components/features/learn/Flashcards/historyBuckets.ts` (MỚI)
- `src/components/features/learn/Flashcards/FlashcardReviewHistory/index.tsx`
- `src/components/features/learn/Flashcards/QuizSession/FlashcardQuizHistory/index.tsx`
- `src/messages/{vi,en}.json` (timeBucket.* + review search/group keys)
- canon `components/card.md` (group-by-time-bucket + toolbar-on-history ruling nếu tái dùng)

## Prototype
`scratchpad/flashcard-history-relayout-flow/index.html` (:8080, 4 màn: before · Học thẻ sau · Hỏi nhanh sau ·
revisit — ephemeral).

## Verify plan
- `npx tsc --noEmit` + eslint 3 file. Browser auth-gated → giữ 🔨 nếu không click-through thật.
