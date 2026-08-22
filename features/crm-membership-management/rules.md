# Business rules · CRM quản lý hồ sơ hội viên Tây Sơn

## BR-01

Hồ sơ đăng ký hội viên chỉ chuyển theo new → reviewing → approved hoặc rejected.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-002`

## BR-02

Chỉ hồ sơ approved mới đủ điều kiện trở thành hồ sơ hội viên công khai; hồ sơ new, reviewing hoặc rejected không được công khai.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-002`

## BR-03

Admin có toàn quyền trong scope, Manager được quản lý và quyết định hồ sơ, Staff được biên tập và xử lý biểu mẫu nhưng không quản lý tài khoản.

- Strength: `confirmed`
- Evidence: `EV-001`

## BR-04

Hành động không được vai trò cho phép phải bị từ chối và không xuất hiện như một thao tác khả dụng trong CRM.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-002`

## BR-05

Quyết định xử lý hồ sơ tạo audit entry và dữ liệu nghiệp vụ sử dụng xóa mềm để giữ khả năng audit và phục hồi.

- Strength: `confirmed`
- Evidence: `EV-001`

## BR-06

Phiên bản đầu của CRM hội viên sử dụng tiếng Việt và không cung cấp cổng đăng nhập riêng cho hội viên.

- Strength: `confirmed`
- Evidence: `EV-001`

## BR-07

Hồ sơ CRM V1 gồm mã hồ sơ, tên doanh nghiệp, mã số thuế, người đại diện và chức vụ, địa chỉ doanh nghiệp, email, điện thoại, lĩnh vực và phần giới thiệu; sau khi approved chỉ tên doanh nghiệp, lĩnh vực và phần giới thiệu được phép công khai.

- Strength: `confirmed`
- Evidence: `EV-003`

## BR-08

Hàng đợi cho phép tìm theo mã hồ sơ, tên doanh nghiệp hoặc mã số thuế, lọc theo trạng thái, sắp xếp hồ sơ mới nhất trước và phân trang 20 hồ sơ mỗi trang.

- Strength: `confirmed`
- Evidence: `EV-003`

## BR-09

Từ chối bắt buộc có lý do, duyệt cho phép ghi chú nội bộ tùy chọn, cả hai quyết định đều cần xác nhận và audit ghi người thao tác, thời điểm, quyết định cùng lý do hoặc ghi chú tương ứng.

- Strength: `confirmed`
- Evidence: `EV-003`
