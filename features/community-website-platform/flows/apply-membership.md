# Flow · Đăng ký và duyệt hội viên

> ID: `apply-membership` · Trigger: Người quan tâm muốn tham gia cộng đồng

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `applicant` | `membership-registration` | Mở biểu mẫu đăng ký hội viên | Thấy các trường dữ liệu và điều kiện gửi |
| 2 | `applicant` | `membership-registration` | Gửi thông tin hợp lệ | Hệ thống lưu hồ sơ mới và xác nhận đã tiếp nhận |
| 3 | `staff` | `admin-members` | Kiểm tra hồ sơ mới | Hồ sơ chuyển sang đang xem xét |
| 4 | `manager` | `admin-members` | Duyệt hoặc từ chối hồ sơ | Hồ sơ có quyết định cuối; hồ sơ được duyệt có thể công khai |

## Outcomes

- Đăng ký được lưu và có trạng thái xử lý
- Chỉ hồ sơ được duyệt mới xuất hiện trong danh sách công khai

Evidence: `EV-001`
