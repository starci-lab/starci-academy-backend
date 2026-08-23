# Business rules · Truy cập và bảo vệ tài khoản

## BR-01

returnTo chỉ được dùng khi bắt đầu bằng một dấu gạch chéo và không bắt đầu bằng hai dấu gạch chéo; nếu không, đích mặc định là /exam.

- Strength: `confirmed`
- Evidence: `EV-001`

## BR-02

Đăng nhập bằng mật khẩu chỉ khởi tạo challenge OTP; token chỉ được trả sau khi OTP được xác minh.

- Strength: `confirmed`
- Evidence: `EV-003`, `EV-004`

## BR-03

Đăng ký lại cùng Keycloak subject phải tái sử dụng user hiện có thay vì tạo bản ghi trùng.

- Strength: `confirmed`
- Evidence: `EV-005`

## BR-04

TOTP chỉ được bật sau khi xác nhận mã hợp lệ; secret lưu trữ được mã hóa và phải bị xóa khi tắt thành công.

- Strength: `confirmed`
- Evidence: `EV-006`
