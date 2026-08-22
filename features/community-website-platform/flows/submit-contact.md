# Flow · Gửi và xử lý liên hệ

> ID: `submit-contact` · Trigger: Khách truy cập muốn gửi liên hệ hoặc yêu cầu từ website

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `visitor` | `public-contact` | Mở biểu mẫu liên hệ | Thấy thông tin liên hệ và biểu mẫu |
| 2 | `visitor` | `public-contact` | Gửi biểu mẫu hợp lệ | Yêu cầu được lưu và xác nhận tiếp nhận |
| 3 | `staff` | `admin-submissions` | Mở và xử lý yêu cầu | Yêu cầu có trạng thái xử lý nội bộ |

## Outcomes

- Thông tin gửi từ website được lưu trữ
- Nhân sự quản trị có thể theo dõi việc xử lý

Evidence: `EV-001`
