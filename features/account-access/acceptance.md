# Acceptance · Truy cập và bảo vệ tài khoản

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Route xác thực mount đúng một màn hình xác thực và sau khi thành công chỉ thay route tới returnTo nội bộ hợp lệ hoặc /exam. | `EV-001` |
| `AC-02` | Màn hình hỗ trợ các cây details, code và done, với trạng thái lỗi và pending không bị nhầm thành bước mới. | `EV-002` |
| `AC-03` | signInInit trả challengeId và expiresInSeconds thay vì token trước OTP. | `EV-003`, `EV-004` |
| `AC-04` | Đăng ký cùng subject không tạo user thứ hai. | `EV-005` |
| `AC-05` | TOTP sai không đổi trạng thái; TOTP đúng bật 2FA và khi tắt thành công secret được xóa. | `EV-006` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
