# Layout — Scrollbar gutter / chống "giật giật" (CHỐT 2026-06-25)

> Chống jitter do thanh scroll dọc hiện/ẩn (flicker) + đẩy nội dung căn giữa lệch ngang.

## Quy tắc (STRICT)
- **`html { overflow-y: scroll; scrollbar-gutter: stable; }` đặt 1 lần ở `globals.css`** (ngay sau `@import`).
  - `overflow-y: scroll` = document LUÔN có thanh scroll dọc (không bao giờ hiện/ẩn) → hết **flicker**. Đồng thời ghim `html` làm scroll container (hết mơ hồ html vs body scroller).
  - `scrollbar-gutter: stable` = chừa SẴN chỗ scrollbar → hết **dịch ngang** `mx-auto` (+ ổn trên OS overlay-scrollbar + lúc modal khoá scroll).
- **Vì sao (root cause):** trang learn có **left rail `h-[calc(100dvh-4rem)]`** → document cao **ĐÚNG ~100dvh** (navbar 4rem + rail = 100dvh). Sub-pixel reflow → scrollbar lúc hiện lúc ẩn → mỗi lần toggle vừa **flicker** vừa **đẩy nội dung căn giữa lệch ~15px** = "giật giật". Trang ngắn (leaderboard, flashcards overview) dính rõ nhất.
- **`scrollbar-gutter: stable` MỘT MÌNH KHÔNG đủ** nếu triệu chứng là scrollbar **flicker hiện/ẩn** (nó chỉ chống dịch ngang). Phải kèm **`overflow-y: scroll`** để bar luôn hiện. Thầy thử mỗi `scrollbar-gutter` → *"vẫn vậy"*; thêm `overflow-y: scroll` mới dứt.
- **Đây là bug LAYOUT (vài dòng CSS), KHÔNG phải re-render/skeleton/animation.** Đã verify 2 component overview (DueReviewHero, FlashcardStatsStrip) + meter blocks (ProgressMeter/SegmentBar) TĨNH (không effect/measure/transition loop) → loại trừ re-render trước khi đụng CSS. Ref [[heatmap-trong-la-bug-token-khong-redesign]] (nghi bug trước khi redesign).
- **Đừng tự chế** `padding-right: <scrollbar>` hack. `overflow-y: scroll` + `scrollbar-gutter: stable` là cách chuẩn.

## Áp đầu (2026-06-25)
- `globals.css`: `html { overflow-y: scroll; scrollbar-gutter: stable; }`. Thầy chỉ leaderboard + flashcards review "cứ giật giật" → gốc = rail 100dvh làm scrollbar flicker, không phải re-render.
- ⚠️ CSS global đổi `html` → cần **HARD refresh** (Ctrl+Shift+R) để ăn (HMR hay sót rule cấp `html`).
