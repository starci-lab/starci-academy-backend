# Flow · Biên tập và xuất bản nội dung

> ID: `publish-content` · Trigger: Nhân sự cần cập nhật tin tức, hoạt động, sự kiện hoặc trang nội dung

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `staff` | `admin-auth` | Đăng nhập CMS | Truy cập đúng chức năng theo vai trò |
| 2 | `staff` | `admin-content` | Tạo hoặc chỉnh sửa bản nháp | Nội dung được lưu nhưng chưa công khai |
| 3 | `manager` | `admin-content` | Xuất bản nội dung | Nội dung chuyển sang công khai |
| 4 | `visitor` | `public-content` | Mở nội dung đã xuất bản | Đọc nội dung trên website công khai |

## Outcomes

- Nội dung công khai chỉ xuất hiện sau khi được xuất bản
- Nội dung cũ có thể được lưu trữ thay vì xóa cứng

Evidence: `EV-001`
