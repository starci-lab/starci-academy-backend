# Flow · Quản lý TOTP

> ID: `manage-two-factor` · Trigger: Thành viên yêu cầu thiết lập, xác nhận hoặc tắt xác thực hai yếu tố.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `member` | — | Yêu cầu secret và URI TOTP. | Secret được lưu mã hóa nhưng chưa bật 2FA. |
| 2 | `member` | — | Gửi mã TOTP hợp lệ. | 2FA được bật. |
| 3 | `member` | — | Xác minh lại bằng mã hợp lệ để tắt. | Cờ 2FA và secret lưu trữ được xóa. |

## Outcomes

- Mã sai không bật hoặc tắt 2FA
- Secret thô chỉ được trả khi thiết lập

Evidence: `EV-005`, `EV-006`
