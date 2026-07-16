# Principle — Progressive Disclosure (Giấu phụ, mở khi cần)

> Nguyên tắc xuyên-suốt (họ `principles/*`). Tổng quát hoá [[when-drawer]] (khi nào dùng Drawer) + [[label]] §2 (summary-row + caret) thành 1 nguyên tắc chọn-khi-nào-giấu, áp cho cả Drawer/Accordion/Modal/"xem thêm".

## Rule of thumb
**Nội dung PHỤ (ít dùng, hoặc làm loãng quyết định chính) giấu sau 1 label+caret, mở ra khi cần — nội dung CHÍNH luôn bày thẳng, không giấu.**

## Nguyên tắc
- **Trigger = 1 summary-row clickable** (`label` trái + `caret-right` phải), hover kích cả hàng — KHÔNG 1 nút lạc lõng cạnh nội dung tĩnh.
- **Chọn đúng lớp theo VAI:** Drawer = phụ, xem-rồi-quay-lại-luồng-chính (không rời ngữ cảnh); Modal = 1 BƯỚC CHẶN cần quyết định trước khi tiếp; Accordion = nhiều mục cùng cấp, mở 1-vài lúc; "Xem thêm"/pagination = list dài hơn sức chứa mặc định.
- **Ẩn hẳn trigger khi nội dung phụ rỗng/không khả dụng** — đừng để 1 hàng mở ra thứ trống (vd cổng thanh toán quốc tế: ẩn cả label-row khi đơn không có giá USD).
- **Tiêu chí "đủ phụ để giấu":** ít dùng/thiểu số, HOẶC làm loãng quyết định chính, HOẶC khối lớn nhưng không-bắt-buộc-thấy-ngay. Nếu >1 phần đều "phụ" cùng lúc → xem lại bố cục tổng trước khi xếp lớp giấu tiếp.

> Đã áp: [[when-drawer]] (PaymentModal: cổng quốc tế giấu sau "Thanh toán quốc tế ›" mở Drawer, cổng nội địa bày thẳng) · [[label]] §2 (GradeModelDropdown "Cài đặt chấm điểm ›" — summary-row + caret mở panel).

## Liên quan
- [[when-drawer]] · [[label]] · [[accordion]] · [[interactive-needs-hover]] (trigger vẫn phải có hover/cursor đầy đủ).
