# Draft — Flip/2-face card: CHIỀU CAO CỐ ĐỊNH (đừng size theo max-of-both) + front căn giữa · back cuộn (2026-06-25)

- File/§ đích khi `/merge`: `elements/card.md` (§ flip card) + liên quan [[reading-markdown-in-paper-card]] · [[item-card-meta-inside-bounded-object]] · card global border+no-shadow.
- Bối cảnh: màn ôn thẻ `/learn/flashcards` (`FlashcardReviewer` + `DueReview` dùng block `FlipCard`). Thầy: *"render lại cho đẹp"* → `/starci-fe-ux-brainstorm` → chốt hướng A (centered study card).

## Root cause (vì sao card bự trống)
`FlipCard` xếp **CẢ 2 face vào CÙNG 1 grid cell** (`gridArea:1/1`, để flip 3D) → card cao = **max(front, back)**. Front "Câu hỏi" NGẮN, back "Đáp án" markdown DÀI + code → câu hỏi ngắn bị nhét vào card cao bằng đáp án → **trống hoác**; `min-h-64` + `mt-auto` hint đẩy xuống đáy → khoảng trắng khổng lồ. Da `bg-default/40` nhạt, nội dung căn trái-trên → trôi nổi.

## Luật (STRICT)
- **Card 2-face (flip/lật) phải có CHIỀU CAO CỐ ĐỊNH, KHÔNG để size theo max-of-both.** 2 face chung 1 cell → card luôn cao bằng face DÀI nhất → face ngắn trống. Fix: đặt height cố định (vd `h-80 sm:h-[22rem]`) lên container → 2 face cùng cao → flip không jump, không trống. Đây là pattern chung cho MỌI khối "2 mặt chồng 1 ô" (flip, before/after, toggle-reveal).
- **Front (prompt NGẮN) = CĂN GIỮA** (dọc+ngang, `items-center justify-center text-center`) → ngắn cũng cân, đọc như thẻ thật (Quizlet/Anki). **Back (answer DÀI/code) = TOP-ALIGN + CUỘN** (`flex-1 min-h-0 overflow-y-auto`) → nội dung dài cuộn trong card cố định, không phình. Hai face XỬ LÝ KHÁC NHAU (block tự lo, feature không style).
- **Affordance lật = PILL rõ, KHÔNG text mờ `mt-auto`.** "Nhấn để lật" = pill (`rounded-full bg-default text-muted text-xs` + icon `CursorClickIcon`) **ghim đáy face NGOÀI vùng cuộn** (`shrink-0`), luôn thấy khi body cuộn. Block nhận `frontHint`/`backHint` (ReactNode) → render pill; feature KHÔNG nhét hint vào content body.
- **Da = surface bounded** (`rounded-2xl border border-default bg-surface`), KHÔNG `bg-default/40` nhạt (không ra "thẻ"). Theo card global (border + no shadow).
- **Skeleton mirror chiều cao + da MỚI** (`h-80 sm:h-[22rem] border border-default bg-surface`), KHÔNG `min-h-64 bg-default/40` cũ → loading không nhảy.

## Nguyên tắc rút ra
- **Khối nhiều-mặt-chồng-1-ô**: cố định kích thước container theo nhu cầu đọc, rồi xử lý TỪNG mặt theo bản chất nội dung (prompt ngắn → center; answer dài → scroll). Đừng để 1 mặt dài kéo cả khối phình làm mặt ngắn trống.
- **Style chỉ ở block:** FlipCard sở hữu height/center/scroll/pill; feature chỉ truyền `front`/`back`/`frontHint`/`backHint` (content). Khác alignment 2 face = việc của block (nó biết front vs back), không leak ra feature.

## ĐÃ ÁP DỤNG 2026-06-25 (FE) — hướng A
- `blocks/cards/FlipCard`: height cố định `h-80 sm:h-[22rem]`; front centered, back scroll (`Face` con với `bodyClass(centered)`); da `rounded-2xl border border-default bg-surface` (thay `min-h-64 bg-default/40`); thêm props `frontHint`/`backHint` → pill ghim đáy (ngoài scroll).
- `FlashcardReviewer` + `DueReview`: gỡ hint `mt-auto` trong content → truyền `frontHint`/`backHint` (`CursorClickIcon` + flipHint). Premium-lock back → `backHint=undefined`.
- 2 skeleton (`FlashcardReviewerSkeleton`, `DueReviewSkeleton`): mirror da mới. tsc + eslint sạch.
- **Chưa làm (optional):** hiện `nextIntervals` (số ngày/grade) trên RatingBar của `FlashcardReviewer` — cần field từ `queryFlashcardDeck` (hiện chỉ `DueReview` có) → BE work, defer.
- Doc brainstorm: `FlashcardReviewer/REVIEW-CARD-UX-BRAINSTORM.md` (3 hướng, chốt A).
