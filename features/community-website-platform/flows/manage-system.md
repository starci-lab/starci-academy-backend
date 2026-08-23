# Flow · Quản trị website

> ID: `manage-system` · Trigger: Quản trị viên cần quản lý người dùng hoặc cấu hình hệ thống

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `administrator` | `admin-auth` | Đăng nhập CMS | Phiên quản trị được xác thực |
| 2 | `administrator` | `admin-system` | Thêm, sửa, khóa hoặc phân quyền tài khoản | Tài khoản và quyền truy cập được cập nhật |
| 3 | `administrator` | `admin-system` | Cập nhật banner, menu, thông tin liên hệ hoặc cấu hình website | Cấu hình mới được lưu và phản ánh trên website |
| 4 | `administrator` | `admin-system` | Kiểm tra thao tác quản trị thiết yếu | Thấy lịch sử thao tác được ghi nhận |

## Outcomes

- Website có thể được quản trị bởi Bên A
- Thao tác quản trị thiết yếu có dấu vết audit

Evidence: `EV-001`
