# Concept — KHI NÀO dùng Drawer (giấu thông tin phụ sau 1 label mở ra)

> Heuristic quyết định: surface đang QUÁ NHIỀU thông tin phụ → đừng bày hết inline → gom phần phụ vào **Drawer**, để lại 1 **label + caret** (mở khi cần). Họ doc `concepts/when-*` = "khi nào dùng X".

## Quy tắc (STRICT)
- **Khi 1 surface (modal/panel/card/trang) có QUÁ NHIỀU thông tin/lựa chọn PHỤ làm loãng phần chính → giấu phần phụ sau 1 `label + caret-right` mở ra Drawer.** Phần CHÍNH (việc user tới đây để làm) bày thẳng; phần PHỤ (ít dùng, tuỳ chọn, tham khảo) thu thành 1 hàng nhãn → mở Drawer khi cần. Drawer = "ngăn kéo" tạm trượt ra, đóng lại về luồng chính → không chiếm chỗ thường trực.
- **Tiêu chí "phụ" để đẩy vào Drawer (đủ 1 là cân nhắc):**
  1. **Ít dùng / thiểu số** — chỉ 1 phần nhỏ user cần (vd cổng thanh toán quốc tế với audience VN; cài đặt nâng cao; lịch sử/log).
  2. **Làm loãng quyết định chính** — bày ngang hàng với phần chính khiến user phân tâm khỏi 1 primary action.
  3. **Khối lớn nhưng không-bắt-buộc-thấy-ngay** — danh sách dài, form phụ, chi tiết tham khảo.
- **Trigger = label-row clickable + caret** (KHÔNG phải nút lạc lõng): `[icon + label]` trái · `caret-right` phải, cả hàng hover/cursor. Class + pattern xem [[elements/label]] §2 (summary-row mở drawer). Caret slide khi hover.
- **Drawer placement:** `right` desktop / `bottom` mobile (`useSmViewpoint`). Dùng block HeroUI `Drawer` (đã có ở repo: `E2eResultDrawer`…), KHÔNG tự chế overlay. Nội dung dài → bọc `ScrollShadow` ([[sticky-rail-overflow-wrap-scrollshadow]]).
- **Ẩn label-row khi nội dung phụ rỗng/không khả dụng** — đừng để 1 hàng mở ra Drawer trống/vô dụng (vd cổng quốc tế khi đơn không có giá USD → ẩn luôn row). Đồng nhất "no dead rows".

## Drawer vs Modal vs inline (chọn cái nào)
- **Inline** — phần CHÍNH, phải thấy ngay, ít. Bày thẳng (List Card / section).
- **Drawer** — phần PHỤ của CÙNG 1 luồng, mở ra rồi quay lại luồng chính (settings, nhóm tuỳ chọn phụ, chi tiết). Trượt từ cạnh, không rời ngữ cảnh.
- **Modal** — 1 BƯỚC chặn cần quyết/nhập trước khi tiếp (xác nhận, form bắt buộc). Chiếm tâm điểm, nền mờ. KHÔNG dùng modal cho "xem thêm thông tin phụ" (đó là Drawer).
- (Thầy nói "label mở = modal" — đúng tinh thần "giấu sau nhãn"; nhưng với **thông tin phụ xem-rồi-quay-lại** thì DRAWER hợp hơn modal. Modal để dành cho bước-chặn.)

## Nguyên tắc rút ra
- Đếm thông tin trên surface: cái nào là "việc chính"? Cái còn lại nếu **không phải lúc nào cũng cần** → đừng nhồi inline (loãng + dài) → 1 nhãn mở Drawer. Surface gọn = quyết định nhanh (ref design-restraint, 1 primary action, Baymard checkout: phần phụ không cướp tâm điểm CTA).

## Áp đầu (2026-06-24)
- `PaymentModal`: cổng **nội địa** (PayOS/Sepay — chính) bày thẳng List Card; cổng **quốc tế** (Stripe/PayPal/Crypto — phụ, audience VN ít dùng) → label-row "Thanh toán quốc tế ›" mở Drawer; ẩn khi `!hasUsd`. Ref [[when-drawer]] + [[elements/label]].
