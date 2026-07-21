# Concept — Khối "tiến độ" = ĐẠI LƯỢNG LỚN DẦN làm headline (1 meter có nghĩa), vanity-number xuống phụ

> Heuristic (họ `concepts/*`). Bổ trợ [[meter-tracks-out-of-box-default-target]] (meter có mốc phải chạy out-of-box) · [[one-progress-bar-at-a-time]] (1 thanh/lúc) · [[whitespace-over-dividers]] (cắt vanity).

## Quy tắc (STRICT)
- **Khối "tiến độ" của 1 surface phải DẪN bằng 1 ĐẠI LƯỢNG LỚN DẦN, CÓ NGHĨA (= "tôi tới đâu rồi"), render thành 1 meter — KHÔNG phải 1 hàng N con số rời (vanity stat-strip).** Hỏi: *thứ học viên thực sự muốn biết về tiến độ là gì?* → đó là đại lượng tiến tới mục tiêu (vd SRS: **đã thuộc / tổng thẻ**), không phải 3 metric ngang hàng không kể chuyện. Stat-strip N số = "dashboard cho có": không phân cấp, số nhỏ in to trông phèn (vd user mới `1 · 100% · 1`).
- **1 tín hiệu CHÍNH (headline + meter), phần còn lại XUỐNG PHỤ** (chip/caption), KHÔNG để mọi metric cùng cỡ. Vd: mastery = headline + maturity bar; streak = chip momentum nhỏ; retention = caption muted. (Cùng họ [[one-progress-bar-at-a-time]] + [[item-card-meta-inside-bounded-object]]: meta xuống phụ cạnh primary.)
- **Số chỉ-có-nghĩa-khi-đủ-mẫu phải GATE, đừng show số nhiễu.** `retention 100% từ ĐÚNG 1 review` = vô nghĩa → ẩn caption khi mẫu quá nhỏ (thay bằng nudge "ôn thẻ đầu tiên…"). Đừng phô con số gây hiểu lầm vì mẫu quá nhỏ.
- **Chỉ thiết kế cho DATA ĐÃ CÓ; đại lượng chính ghép từ field sẵn, đừng đẻ query mới cho vanity.** Share SWR key với sibling → 0 fetch thêm. Forecast/heatmap/maturity-histogram = chưa có query → KHÔNG vẽ (grounded-in-data).
- **Empty/loading đúng khung:** empty CHỈ khi thật rỗng (total=0); user mới (chưa thuộc gì) vẫn render meter 0% + nudge (như heatmap rỗng vẫn là grid — [[heatmap-trong-la-bug-token-khong-redesign]] họ "render rỗng có nghĩa"), KHÔNG ẩn câm ([[labeled-section-render-empty-not-self-hide]]). Skeleton mirror meter.
- **Slice "chưa đạt/remainder" của meter = TRACK TONE `--default` (nhạt), KHÔNG `--muted` (xám đậm).** Phần "untouched/remaining" để nhạt như track; chỉ phần ĐÃ-ĐẠT mới có màu semantic đậm (success/warning). Slice tối = hiểu nhầm "có data nhiều".

## Nguyên tắc rút ra
- Trước khi render "tiến độ", hỏi: **đại lượng nào LỚN DẦN tới mục tiêu của surface này?** → đó là headline+meter. Mọi số khác là context (chip/caption), không ngang hàng. N-số-ngang-hàng = vanity; 1-meter-có-nghĩa + phụ = progress thật.
- Dùng block sẵn (`SegmentBar` max-mode = meter có maturity + legend; `ProgressMeter` = 1 thanh; `Chip` bg-token/10 = momentum) — đừng tự dựng stat-strip.

## Liên quan
- [[meter-tracks-out-of-box-default-target]] (meter có mốc → default target, luôn chạy) · [[one-progress-bar-at-a-time]] · [[heatmap-trong-la-bug-token-khong-redesign]] (rỗng vẫn render có nghĩa) · [[whitespace-over-dividers]] (cắt vanity) · [[labeled-section-render-empty-not-self-hide]].
