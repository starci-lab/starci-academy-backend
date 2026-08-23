# Flow · Xác thực bằng OTP

> ID: `authenticate-with-otp` · Trigger: Khách mở /[lang]/authentication và gửi thông tin đăng nhập, đăng ký hoặc khôi phục.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `visitor` | `authentication` | Nhập email, mật khẩu và các lựa chọn cần thiết hoặc chọn Google/GitHub. | Frontend gửi yêu cầu khởi tạo challenge. |
| 2 | `visitor` | `authentication` | Nhập OTP đã nhận hoặc yêu cầu gửi lại. | Challenge được xác minh và phiên có thể được lưu. |
| 3 | `member` | `authentication` | Hoàn tất xác thực. | Ứng dụng thay route tới returnTo nội bộ hợp lệ, mặc định là /exam. |

## Outcomes

- Phiên được tạo sau bước OTP thành công
- Từ chối của server hoặc lỗi vận chuyển được hiển thị như trạng thái lỗi
- Không điều hướng tới URL protocol-relative

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`
