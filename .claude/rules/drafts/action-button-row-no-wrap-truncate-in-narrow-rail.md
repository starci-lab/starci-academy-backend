# Draft — Hàng nút hành động trong rail/panel HẸP: KHÔNG flex-wrap, primary giữ tự nhiên + secondary flex-1 truncate (2026-06-24)

- File/§ đích khi `/merge`: `starci-ui.rules` (button/action-row patterns) + [[interactive-needs-hover]] / [[three-tier-page-layout]].
- Bối cảnh: panel "Nộp bài" (ChallengeSubmissionPanel/SubmissionRow) ở **right rail hẹp** của trang giải challenge. Hàng
  2 nút `[Nộp bài]` (primary) + `[Xem lịch sử nộp bài]` (secondary) để `flex flex-wrap` → nút secondary **dài quá bị
  wrap xuống hàng 2** (trông như 2 nút xếp dọc). Thầy: *"Nộp bài với xem lịch sử cùng 1 hàng, nút dài quá bắt xuống
  hàng => ellipse"*.

## Luật (STRICT)
- **Hàng nút hành động trong container HẸP (rail/panel/card cột phải) = 1 HÀNG, KHÔNG `flex-wrap`.** `flex-wrap` để
  cứu overflow bằng cách **đẩy nút xuống hàng** = sai khi thầy muốn giữ 1 hàng. Thay vì wrap → **ép 1 hàng + truncate
  nhãn nút dài** (ellipsis). Container: `flex w-full items-center gap-2` (bỏ `flex-wrap`, thêm `w-full` để flex-1 có
  chỗ chia).
- **Nút PRIMARY (CTA chính, nhãn ngắn) = `shrink-0`** (giữ đọc trọn vẹn, không bao giờ truncate — nó là hành động
  chính). Icon trong nút cũng `shrink-0`.
- **Nút SECONDARY (nhãn dài) = `min-w-0 flex-1`** + bọc nhãn trong `<span className="truncate">` → nút lấp phần còn
  lại của hàng, nhãn dài quá thì **ellipsis** (không phá layout, không wrap). `min-w-0` BẮT BUỘC để phần tử flex co
  được dưới kích thước nội dung (mặc định `min-width:auto` chặn truncate).
- **Nguyên tắc tổng quát:** trong vùng hẹp, ưu tiên **bảo toàn 1 hàng + cho nhãn co/ellipsis** hơn là cho nút rớt
  hàng. Phân vai: cái-phải-đọc-trọn (primary CTA) = `shrink-0`; cái-chịu-cắt-được (secondary/label dài) = `flex-1` +
  `truncate`. KHÔNG để cả 2 cùng `flex-1` nếu 1 cái là CTA ngắn cần đọc trọn (sẽ phình thừa).

## ĐÃ ÁP DỤNG 2026-06-24
- `ChallengeSubmissionPanel/SubmissionRow/index.tsx`: `flex flex-wrap` → `flex w-full`; primary `shrink-0`
  (icon `shrink-0`); secondary `min-w-0 flex-1` + nhãn `<span className="truncate">`. eslint sạch.
