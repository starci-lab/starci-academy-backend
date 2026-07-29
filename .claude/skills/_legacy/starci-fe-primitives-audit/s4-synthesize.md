# S4 — Synthesize (Opus)

1 agent **Opus** (phase 'Synthesize') nhận toàn bộ gaps → viết report markdown gọn:

- **A. Top-N cần sửa nhất** — xếp hạng theo tổng điểm gap (`high·3 + med·2 + low·1`), mỗi dòng: tên · điểm · 2–3 gap chính.
- **B. GAP PHỔ BIẾN (làn sóng)** — với MỖI check, đếm bao nhiêu primitive dính, xếp giảm dần. Chỉ ra "làn sóng" đáng batch (vd isSkeleton thiếu ở N, spacing lệch ở M).
- **C. Đạt canon** — primitive 0 gap (hoặc gần nhất).
- **D. Khuyến nghị BATCH theo GAP (không theo primitive)** — 3–5 batch fix hàng loạt. Xếp: batch HIGH (compose/§6 fold) làm TRƯỚC (kẻo sinh việc thừa cho anatomy sắp thay).

> **Vì sao batch theo GAP:** 1 gap phổ biến (vd icon-ownership) sửa 1 pass cho N primitive hiệu quả hơn sửa lần lượt từng primitive. Report phải giúp thầy chọn "làn sóng" ROI cao.

Model: 1 call Opus effort high (synthesis cần chất).
