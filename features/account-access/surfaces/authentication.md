# Surface · Đăng nhập, đăng ký hoặc khôi phục tài khoản

> ID: `authentication` · Route: `/[lang]/authentication`

## Job

Thu thập thông tin tài khoản, xác minh OTP và đưa thành viên vào ứng dụng.

## Navigation

- journey / Đăng nhập — active
- journey / Đăng ký — available
- journey / Quên mật khẩu — available

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `identity-shortcuts` | navigation | Google; GitHub | details | Tiếp tục với Google, Tiếp tục với GitHub | `EV-002` |
| `credentials-form` | form | Email; Mật khẩu; Ghi nhớ đăng nhập; Đồng ý điều khoản và quyền riêng tư | details, error | Tiếp tục, Quên mật khẩu | `EV-002`, `EV-003` |
| `otp-form` | form | Mã OTP; Trạng thái gửi hoặc xác minh | code, error, done | Xác minh, Gửi lại mã, Dùng email khác | `EV-002`, `EV-003` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
