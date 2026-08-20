# States · Truy cập và bảo vệ tài khoản

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `details` | initial | Nhập thông tin | code, error | `EV-002`, `EV-003` |
| `code` | pending | Nhập OTP | done, details, error | `EV-002`, `EV-003` |
| `done` | success | Đã xác thực | Điều hướng về returnTo | `EV-001`, `EV-002` |
| `error` | error | Yêu cầu bị từ chối hoặc không nhận được kết quả | Thử lại, Gửi lại OTP, Đổi email | `EV-002`, `EV-003` |
| `pending-two-factor` | pending | TOTP đã thiết lập nhưng chưa xác nhận | two-factor-enabled, error | `EV-006` |
| `two-factor-enabled` | success | 2FA đang bật | two-factor-disabled, error | `EV-006` |
| `two-factor-disabled` | success | 2FA đã tắt | pending-two-factor | `EV-006` |
