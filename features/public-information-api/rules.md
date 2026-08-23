# Business rules · API thông tin công khai Tây Sơn

## BR-01

Truy vấn công khai chỉ trả tài liệu có trạng thái published.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-002`, `EV-003`

## BR-02

Tài liệu draft, archived hoặc không tồn tại được biểu diễn là unavailable và không làm lộ nội dung bị ẩn.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-003`

## BR-03

Backend cung cấp kết quả đủ ổn định để frontend ánh xạ sang ready, unavailable hoặc error trong chrome trang không đổi.

- Strength: `confirmed`
- Evidence: `EV-002`, `EV-003`

## BR-04

Capability này chỉ đọc và không sở hữu mutation CMS, xác thực hoặc phân quyền quản trị.

- Strength: `confirmed`
- Evidence: `EV-003`

## BR-05

API không tự tạo tên nhân sự, điều khoản điều lệ hoặc dữ kiện pháp lý chưa được owner cung cấp.

- Strength: `confirmed`
- Evidence: `EV-002`, `EV-003`
