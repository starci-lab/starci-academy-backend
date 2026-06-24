# Draft — Khối "tiến độ/progress" = ĐẠI LƯỢNG LỚN DẦN làm headline (1 meter có nghĩa), vanity-number xuống phụ (2026-06-25)

- File/§ đích khi `/merge`: `elements/` (stats/progress) hoặc `main.md` §14 + liên quan [[one-progress-bar-at-a-time]] · [[item-card-meta-inside-bounded-object]] · [[course-home-no-duplicate-surfaces]] (cắt vanity).
- Bối cảnh: trang Ôn tập (`/learn/flashcards`) khối "Tiến bộ" (`FlashcardStatsStrip`) = 3 `StatPair` phẳng (streak · retention% · totalReviewed). Thầy: *"tiến độ render phèn quá"* → `/starci-fe-ux-brainstorm` → chốt hướng A (mastery-meter-led).

## Luật (STRICT)
- **Khối "tiến độ" của 1 surface phải DẪN bằng 1 ĐẠI LƯỢNG LỚN DẦN, CÓ NGHĨA (= "tôi tới đâu rồi"), render thành 1 meter — KHÔNG phải 1 hàng N con số rời (vanity stat-strip).** Hỏi: *thứ học viên thực sự muốn biết về tiến độ là gì?* → đó là đại lượng tiến tới mục tiêu (vd SRS: **đã thuộc / tổng thẻ**), không phải 3 metric ngang hàng không kể chuyện. Stat-strip N số = "dashboard cho có": không phân cấp, số nhỏ in to trông phèn/tội (vd user mới `1 · 100% · 1`).
- **1 tín hiệu CHÍNH (headline + meter), phần còn lại XUỐNG PHỤ** (chip/caption), KHÔNG để mọi metric cùng cỡ. Vd: mastery = headline + maturity bar; **streak = chip momentum** nhỏ; **retention = caption** muted. (Cùng họ [[one-progress-bar-at-a-time]]: 1 thanh/lúc; [[item-card-meta-inside-bounded-object]]: meta xuống phụ cạnh primary.)
- **Số chỉ-có-nghĩa-khi-đủ-mẫu phải GATE, đừng show số nhiễu.** `retention 100% từ ĐÚNG 1 review` = vô nghĩa → ẩn caption khi `totalReviewed < ~5` (thay bằng nudge "ôn thẻ đầu tiên..."). Đừng phô 1 con số gây hiểu lầm vì mẫu quá nhỏ.
- **Chỉ thiết kế cho DATA ĐÃ CÓ; đại lượng chính ghép từ field sẵn, đừng đẻ query mới cho vanity.** Mastery meter = Σ`masteredCount`/Σ`cards` (`flashcardDecksByCourse`) + `newTotalCount` (`myDueFlashcards`) + streak/retention (`myFlashcardStats`) — **share SWR key với sibling** (deck list, due hero) → 0 fetch thêm. Forecast/heatmap/maturity-histogram = chưa có query → KHÔNG vẽ (grounded-in-data).
- **Empty/loading đúng khung:** empty CHỈ khi thật rỗng (total=0); user mới (chưa thuộc gì) vẫn render meter 0% + nudge (như heatmap rỗng vẫn là grid — [[heatmap-trong-la-bug-token-khong-redesign]] họ "render rỗng có nghĩa"), KHÔNG ẩn câm ([[labeled-section-render-empty-not-self-hide]]). Skeleton mirror meter (dùng `Skeleton.SegmentBar`), KHÔNG mirror 3-stat cũ.

## Nguyên tắc rút ra
- Trước khi render "tiến độ", hỏi: **đại lượng nào LỚN DẦN tới mục tiêu của surface này?** → đó là headline+meter. Mọi số khác là context (chip/caption), không ngang hàng. N-số-ngang-hàng = vanity; 1-meter-có-nghĩa + phụ = progress thật.
- Dùng block sẵn (`SegmentBar` max-mode = meter có maturity + legend đếm; `ProgressMeter` = 1 thanh; `Chip` bg-token/10 = momentum) — đừng tự dựng stat-strip.

## ĐÃ ÁP DỤNG 2026-06-25 (FE)
- `FlashcardStatsStrip` viết lại: bỏ 3 `StatPair` → headline "Đã thuộc {m}/{total} thẻ · {%}" + chip streak (FlameIcon, `bg-warning/10`) + `SegmentBar` (mastered `--success` · learning `--warning` · **new = `--default` = TRACK TONE nhạt, KHÔNG `--muted` xám đậm**, `max=total`, legend đếm) + retention caption gate `totalReviewed≥5` (else nudge "ôn thẻ đầu tiên"). 3 SWR share key sibling (0 fetch thêm). Skeleton → `Skeleton.SegmentBar`. i18n `flashcard.stats.{masteredLine,mastered,learning,new,streakChip,retentionCaption,firstReviewHint,barAria}`. tsc/eslint sạch.
- **Slice "chưa có/chưa đạt" (remainder) = TRACK TONE `--default`** (đúng màu track rỗng của `ProgressBar`/`SegmentBar`, `bg-default`), KHÔNG `--muted` (xám đậm "đen kinh" — thầy bác 2026-06-25). Nguyên tắc: phần "untouched/remaining" của 1 meter để NHẠT như track, chỉ phần ĐÃ-ĐẠT mới có màu semantic đậm (success/warning). Slice tối = hiểu nhầm "có data nhiều".
- Doc brainstorm: `FlashcardStatsStrip/UX-BRAINSTORM.md` (3 hướng A/B/C, chốt A).
