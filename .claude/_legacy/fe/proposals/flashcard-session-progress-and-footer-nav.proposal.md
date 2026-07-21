# Proposal — WorkSessionHeader progress-segment màu current/done tách biệt + footer 3-nút "Trước · Xem đáp án · Tiếp"

> Chốt 2026-07-12 (prototype `scratchpad/flashcard-session-header-footer-flow/index.html`, :8080, 4 màn). Thầy: "cái màu xanh mà click vào là màu hồng trò hiểu không?" (ảnh "Ôn thẻ đến hạn") + "redesign lại Kết thúc, next, prev đặt ở nơi chính xác hơn" + "kiểu relayout í, research để render cho make sense, có next prev". Chọn màn 4 ("Footer v2 + Tiếp").

## Vấn đề gốc (đã trace, không phải bug code — là khoảng trống thiết kế)
- `WorkSessionHeader`'s progress-segment: `isDone(position) ? "bg-success" : position === current ? "bg-accent" : "bg-default"` — khi thẻ ĐANG XEM đã từng được CHẤM (`doneSet`), `success` (xanh) đè lên `accent` (hồng), nên "đang xem ô nào" biến mất khi nó trùng "đã chấm". Verify Postgres: session ảnh có `graded_indexes=[0]`, đúng lúc currentIndex=0 → ô 0 hiện xanh thay vì hồng.
- Footer (FlashcardReviewer + DueReview, pha chưa lật): `flex justify-between` đẩy "Trước" (secondary) và "Xem đáp án" (**outline**, không phải primary) ra 2 mép — không đọc thành 1 cụm điều hướng, và "Xem đáp án" (CTA chính của pha này) không có trọng lượng thị giác primary.

## Quyết định (research: Mochi/Anki/spaced-repetition UX — không có spec pixel-chính-xác, nhưng lặp lại 2 nguyên tắc: nav ← → đối xứng quanh 1 hành động chính; "Trước" không nên đứng lẻ)

### 1. Progress-segment — tách FILL khỏi RING
- **Fill** (màu nền thanh) = trạng thái đã-chấm-hay-chưa THUẦN TUÝ: `success` nếu `isDone(position)`, else `default`. KHÔNG còn phụ thuộc `current`.
- **Current** = 1 viền/ring `accent` (2px, `outline` hoặc `box-shadow` inset không đổi layout) ĐÈ LÊN bất kể fill — luôn thấy "đang xem ô nào" dù ô đó đã chấm hay chưa.
- `success` giữ nguyên nghĩa "đã chấm/đã thuộc" (khớp progress bar tổng "Đã thuộc" dùng success ở nơi khác — [[elements/color]]); `accent` giữ nguyên nghĩa "đang tương tác/đang chọn" ([[accent-system]]) — 2 nghĩa không đè lên nhau nữa.

### 2. Footer — 3 nút cân đối, "Xem đáp án" ở giữa làm primary
- Đổi `flex justify-between` (2 nút) → `grid grid-cols-[1fr_1.4fr_1fr] gap-3` (Sonnet chọn tỉ lệ đúng theo `size="sm"` hiện có, không cứng nhắc theo prototype nếu lệch rhythm thật):
  `[← Trước (secondary)]  [Xem đáp án (PRIMARY, giữa)]  [Tiếp → (secondary)]`.
- "Xem đáp án" đổi `variant="outline"` → `variant="primary"` (CTA chính của pha chưa lật, [[elements/button.md]] §2).
- **"Tiếp" MỚI** — bản tường minh của free-nav đã có (`goToIndex`/`onSegmentClick`): nhảy tới `currentIndex + 1`, KHÔNG chấm điểm, KHÔNG reveal. `isDisabled` khi `currentIndex >= total - 1` (mirror `isFirst`/"Trước"'s disable). i18n key **ĐÃ CÓ SẴN** cả 2 ngôn ngữ: `flashcard.next` = "Tiếp"/"Next" (chưa dùng ở đâu — verify trước khi build, không tự thêm trùng).
- Áp dụng ĐỒNG NHẤT cho cả `FlashcardReviewer` (deck-review) và `DueReview` (due-review) — 2 component có footer y hệt nhau hiện tại, giữ tiếp tục y hệt sau khi đổi.
- Pha ĐÃ lật (RatingBar 4-cột) — KHÔNG đổi, giữ nguyên.

## Files to touch
1. **`src/components/blocks/navigation/WorkSessionHeader/index.tsx`** — sửa vòng lặp render segment (dòng ~201-219): tách `fillClass = isDone(position) ? "bg-success" : "bg-default"` khỏi 1 lớp ring current riêng (thêm class/style khi `position === current`, không đổi `colorClass` gộp nữa). Cả 2 nhánh (`onSegmentClick` có/không) đều cần ring. KHÔNG đổi props/API (`current`/`doneSet` giữ nguyên ý nghĩa).
2. **`src/components/features/learn/Flashcards/FlashcardReviewer/index.tsx`** — footer chưa-lật (quanh dòng 614-628): thêm `goNext` (mirror `goPrev`, dùng lại `goToIndex`), đổi layout footer sang grid 3-cột, đổi "Xem đáp án" → `variant="primary"`, thêm nút "Tiếp" (`t("flashcard.next")`) giữa "Trước" và nút cuối — thứ tự ĐÚNG spec: Trước · Xem đáp án · Tiếp.
3. **`src/components/features/learn/Flashcards/DueReview/index.tsx`** — footer chưa-lật (quanh dòng 590-604): y hệt thay đổi #2 (thêm `goNext`, grid 3-cột, primary, nút Tiếp).
4. i18n: KHÔNG cần thêm — `flashcard.next` đã có sẵn cả `vi.json`/`en.json` (dòng ~1997/1988), chỉ cần DÙNG.

## Verify plan
- `npx tsc --noEmit` + `npm run lint` sạch.
- Browser (đăng nhập thật): vào 1 phiên "Học thẻ" bất kỳ (deck-review hoặc due-review) → xác nhận:
  - Ô progress đang xem LUÔN có viền hồng dù đã chấm (xanh) hay chưa (xám) — bấm 1 ô đã chấm để xem lại, xác nhận viền hồng vẫn hiện trên nền xanh.
  - Footer 3 nút cân xứng, "Xem đáp án" tô đặc hồng (primary), "Tiếp" nhảy thẻ kế không chấm điểm không lật, disable ở thẻ cuối; "Trước" disable ở thẻ đầu.
  - Cả `FlashcardReviewer` VÀ `DueReview` đều đổi giống nhau.

## Prototype
`scratchpad/flashcard-session-header-footer-flow/index.html` (:8080, 4 màn — màn 4 "Footer v2" là bản CHỐT).
