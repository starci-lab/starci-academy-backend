# Contracts · Truy cập và bảo vệ tài khoản

## Entity · Challenge xác thực (`auth-challenge`)

Fields: `challengeId`, `expiresInSeconds`, `email`, `otp`

Evidence: `EV-003`

## Entity · Tài khoản người dùng (`user-account`)

Fields: `id`, `keycloakId`, `email`, `username`, `authenticationType`, `twoFactorEnabled`, `twoFactorSecret`

Evidence: `EV-005`, `EV-006`

## Operation · signInInit

- Kind/owner: `mutation` / `backend`
- Inputs: username/password request, captcha
- Outputs: challengeId, expiresInSeconds
- Failures: Thông tin bị từ chối, Captcha hoặc throttle từ chối, Lỗi vận chuyển
- Evidence: `EV-003`, `EV-004`

## Operation · POST /v1/keycloak/auth/register

- Kind/owner: `command` / `backend`
- Inputs: email, password, firstName, lastName
- Outputs: user id, access token
- Failures: Đăng ký không hợp lệ, Keycloak từ chối
- Evidence: `EV-005`

## Operation · setupTwoFactor / confirmTwoFactor / disableTwoFactor

- Kind/owner: `mutation` / `backend`
- Inputs: authenticated member, TOTP code when confirming or disabling
- Outputs: secret and otpauthUrl on setup, success envelope
- Failures: TWO_FACTOR_INVALID_CODE_EXCEPTION
- Evidence: `EV-006`

## Operation · replace(returnTo)

- Kind/owner: `redirect` / `frontend`
- Inputs: returnTo query parameter
- Outputs: internal application route
- Failures: Không có; giá trị không an toàn được thay bằng /exam
- Evidence: `EV-001`

No field, failure or operation may appear here without routed source evidence.
