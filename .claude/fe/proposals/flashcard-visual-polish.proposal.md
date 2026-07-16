# Proposal — Flashcards visual polish (FlipCard + Quiz cloze): 1 Card đồng nhất, làm giàu visual skin

> Nguồn: thầy chỉ 3 ảnh thật ("Học thẻ" mặt câu hỏi/đáp án, "Hỏi nhanh" đang điền) + nhận xét "nhìn xấu quá, có
> cách nào sáng tạo lên... render UX UI hơn". Xác định đây là bài **block-visual-polish** (không đổi
> shell/route/mechanics) — brainstorm bằng prototype bấm-được (`scratchpad/flashcard-visual-polish/index.html`,
> host :8080), thầy duyệt qua 2 vòng phản biện trực tiếp trên prototype rồi chốt build thẳng cùng session.

## Quyết định chốt (qua 2 vòng phản biện thật trên prototype)
- **Vòng 1** ("ý đồng nhất kiểu card đi, tất cả đều xài Card bth"): bỏ hết trang trí RIÊNG mỗi màn (spine màu, góc
  gấp, xếp-chồng-thẻ ở FlipCard prototype ban đầu) → gộp về **1 shell Card duy nhất** dùng lại y hệt mọi nơi.
- **Vòng 2** (chỉ đúng ảnh "Hiện tại" — quiz cloze đang có `bg-accent/5 + border-l-accent` thật trong code):
  "bỏ cái kiểu bg hồng với border... render plain Card như bth thôi" → xác nhận luôn cả code THẬT (không chỉ
  prototype) cũng phải bỏ tint này, dùng lại đúng shell của FlipCard.

## Đã build (KHÔNG đổi shell/route/mechanics — chỉ visual skin)
- **`blocks/cards/FlipCard/index.tsx`**: pill affordance "bấm để lật" đổi từ `bg-default text-muted` (tĩnh) →
  `bg-accent/10 text-accent` + `motion-safe:animate-bounce` (mời bấm rõ hơn).
- **`blocks/buttons/RatingBar/index.tsx`**: thêm icon mỗi mức recall (Phosphor `SmileyXEyes→SmileySad→Smiley→SmileyWink`
  cho Quên→Khó→Được→Dễ) + `hover:-translate-y-0.5` (tile "nổi" khi hover).
- **`features/learn/Flashcards/QuizSession/index.tsx`**:
  - Cloze card: bỏ hẳn `border-l-[3px] border-l-accent bg-accent/5` → `rounded-2xl bg-surface shadow-surface`
    (CÙNG shell với FlipCard).
  - Ngân hàng từ: thêm `hover:-translate-y-0.5` (Button outline, không đổi variant/primitive).
  - Blank cloze: thêm animation `blankPop`/`blankShake` khi chấm đúng/sai (2 keyframe mới trong `globals.css`,
    tôn trọng `motion-safe:`).
  - Icon hint đổi từ `CursorClickIcon` (chung chung) → `ArrowsClockwiseIcon` (đúng nghĩa "lật").
- **`features/learn/Flashcards/FlashcardReviewer/index.tsx`**: cùng đổi icon hint sang `ArrowsClockwiseIcon`.
- **`src/app/globals.css`**: thêm keyframe `blankPop`/`blankShake` (mirror cách file đã làm với `wireFlow`).

## Files đã sửa
- `src/components/blocks/cards/FlipCard/index.tsx`
- `src/components/blocks/buttons/RatingBar/index.tsx`
- `src/components/features/learn/Flashcards/QuizSession/index.tsx`
- `src/components/features/learn/Flashcards/FlashcardReviewer/index.tsx`
- `src/app/globals.css`

## Verify
- `tsc --noEmit` + `eslint` sạch cả 4 file component (đã chạy, 0 lỗi — chỉ cảnh báo "React version not specified" có sẵn từ trước).
- Dev server compile lại không lỗi thật (`preview_logs` chỉ có full-reload HMR thường lệ, không có dòng "Error").
- **CHƯA test tay browser** — không có tài khoản đăng nhập để vào `/learn/flashcards/review/decks/[id]` và
  `/learn/flashcards/quiz/sessions/[id]` thật.

## Trạng thái
🔨 IN-PROGRESS (2026-07-09) — code xong + tsc/eslint sạch, **giữ 🔨 chờ thầy test tay browser** theo
[[feedback-dont-mark-done-without-real-verify]].
