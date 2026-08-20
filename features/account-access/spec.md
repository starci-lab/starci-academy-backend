# Truy cập và bảo vệ tài khoản

> Business head: `f155d30db02551d9a7229bedb1d307e4acb8cff3d3fade0754f6f893d93ab761`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Người dùng đăng nhập, đăng ký hoặc khôi phục mật khẩu bằng email/mật khẩu và OTP; hệ thống chỉ điều hướng về đường dẫn nội bộ sau khi có phiên và hỗ trợ TOTP như lớp bảo vệ bổ sung.

Included:
- Màn hình xác thực
- Đăng nhập, đăng ký và khôi phục bằng OTP
- Điều hướng sau xác thực
- Đăng ký tài khoản cục bộ
- Thiết lập, xác nhận và tắt TOTP

Excluded:
- Thiết kế nhà cung cấp danh tính
- Quản trị người dùng
- Bề mặt quản lý phiên chưa có trong frontend

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/miamia-fe2.git | `775bc711bafd48675d6dc44beab81fad712a31da` |
| be | https://github.com/starci-lab/miamia-be.git | `9dc84d7278abb34030e8c8e6957e925abe4bef70` |

## 3. Actors and access

### Khách chưa xác thực

- Đăng nhập
- Đăng ký
- Khôi phục mật khẩu
- Dùng Google hoặc GitHub

Evidence: `EV-001`, `EV-002`, `EV-003`

### Thành viên

- Nhận phiên sau OTP
- Thiết lập và quản lý TOTP

Evidence: `EV-004`, `EV-005`, `EV-006`

## 4. Entry points and surfaces

### Đăng nhập, đăng ký hoặc khôi phục tài khoản

- ID: `authentication`
- Route: `/[lang]/authentication`
- Purpose: Thu thập thông tin tài khoản, xác minh OTP và đưa thành viên vào ứng dụng.
- Regions: `identity-shortcuts`, `credentials-form`, `otp-form`
- Navigation: Đăng nhập (active), Đăng ký (available), Quên mật khẩu (available)

Evidence: `EV-001`, `EV-002`, `EV-003`

## 5. Business flows

### Xác thực bằng OTP

Trigger: Khách mở /[lang]/authentication và gửi thông tin đăng nhập, đăng ký hoặc khôi phục.

1. **visitor** — Nhập email, mật khẩu và các lựa chọn cần thiết hoặc chọn Google/GitHub. → Frontend gửi yêu cầu khởi tạo challenge.
2. **visitor** — Nhập OTP đã nhận hoặc yêu cầu gửi lại. → Challenge được xác minh và phiên có thể được lưu.
3. **member** — Hoàn tất xác thực. → Ứng dụng thay route tới returnTo nội bộ hợp lệ, mặc định là /exam.

Outcomes:
- Phiên được tạo sau bước OTP thành công
- Từ chối của server hoặc lỗi vận chuyển được hiển thị như trạng thái lỗi
- Không điều hướng tới URL protocol-relative

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

### Quản lý TOTP

Trigger: Thành viên yêu cầu thiết lập, xác nhận hoặc tắt xác thực hai yếu tố.

1. **member** — Yêu cầu secret và URI TOTP. → Secret được lưu mã hóa nhưng chưa bật 2FA.
2. **member** — Gửi mã TOTP hợp lệ. → 2FA được bật.
3. **member** — Xác minh lại bằng mã hợp lệ để tắt. → Cờ 2FA và secret lưu trữ được xóa.

Outcomes:
- Mã sai không bật hoặc tắt 2FA
- Secret thô chỉ được trả khi thiết lập

Evidence: `EV-005`, `EV-006`

## 6. Business rules

### BR-01

returnTo chỉ được dùng khi bắt đầu bằng một dấu gạch chéo và không bắt đầu bằng hai dấu gạch chéo; nếu không, đích mặc định là /exam.

Strength: **confirmed** · Evidence: `EV-001`

### BR-02

Đăng nhập bằng mật khẩu chỉ khởi tạo challenge OTP; token chỉ được trả sau khi OTP được xác minh.

Strength: **confirmed** · Evidence: `EV-003`, `EV-004`

### BR-03

Đăng ký lại cùng Keycloak subject phải tái sử dụng user hiện có thay vì tạo bản ghi trùng.

Strength: **confirmed** · Evidence: `EV-005`

### BR-04

TOTP chỉ được bật sau khi xác nhận mã hợp lệ; secret lưu trữ được mã hóa và phải bị xóa khi tắt thành công.

Strength: **confirmed** · Evidence: `EV-006`

## 7. State model

- **Nhập thông tin** (`details`, initial) → code, error — `EV-002`, `EV-003`
- **Nhập OTP** (`code`, pending) → done, details, error — `EV-002`, `EV-003`
- **Đã xác thực** (`done`, success) → Điều hướng về returnTo — `EV-001`, `EV-002`
- **Yêu cầu bị từ chối hoặc không nhận được kết quả** (`error`, error) → Thử lại, Gửi lại OTP, Đổi email — `EV-002`, `EV-003`
- **TOTP đã thiết lập nhưng chưa xác nhận** (`pending-two-factor`, pending) → two-factor-enabled, error — `EV-006`
- **2FA đang bật** (`two-factor-enabled`, success) → two-factor-disabled, error — `EV-006`
- **2FA đã tắt** (`two-factor-disabled`, success) → pending-two-factor — `EV-006`

## 8. Entities and data

- **Challenge xác thực**: challengeId, expiresInSeconds, email, otp — `EV-003`
- **Tài khoản người dùng**: id, keycloakId, email, username, authenticationType, twoFactorEnabled, twoFactorSecret — `EV-005`, `EV-006`

## 9. Operations and APIs

- **signInInit** (mutation, backend) — input: username/password request, captcha; output: challengeId, expiresInSeconds; failures: Thông tin bị từ chối, Captcha hoặc throttle từ chối, Lỗi vận chuyển — `EV-003`, `EV-004`
- **POST /v1/keycloak/auth/register** (command, backend) — input: email, password, firstName, lastName; output: user id, access token; failures: Đăng ký không hợp lệ, Keycloak từ chối — `EV-005`
- **setupTwoFactor / confirmTwoFactor / disableTwoFactor** (mutation, backend) — input: authenticated member, TOTP code when confirming or disabling; output: secret and otpauthUrl on setup, success envelope; failures: TWO_FACTOR_INVALID_CODE_EXCEPTION — `EV-006`
- **replace(returnTo)** (redirect, frontend) — input: returnTo query parameter; output: internal application route; failures: Không có; giá trị không an toàn được thay bằng /exam — `EV-001`

## 10. Acceptance conditions

- **AC-01** Route xác thực mount đúng một màn hình xác thực và sau khi thành công chỉ thay route tới returnTo nội bộ hợp lệ hoặc /exam. — `EV-001`
- **AC-02** Màn hình hỗ trợ các cây details, code và done, với trạng thái lỗi và pending không bị nhầm thành bước mới. — `EV-002`
- **AC-03** signInInit trả challengeId và expiresInSeconds thay vì token trước OTP. — `EV-003`, `EV-004`
- **AC-04** Đăng ký cùng subject không tạo user thứ hai. — `EV-005`
- **AC-05** TOTP sai không đổi trạng thái; TOTP đúng bật 2FA và khi tắt thành công secret được xóa. — `EV-006`

## 11. Explicit unknowns

- **Frontend sẽ đặt bề mặt xem và thu hồi các phiên đăng nhập ở route nào?** — Backend có năng lực phiên nhưng source FE hiện tại không có route chuyên biệt để tạo nội dung prototype trung thực.
- **Frontend sẽ đặt thao tác thiết lập, xác nhận và tắt TOTP ở bề mặt nào?** — Không được thêm vùng 2FA vào prototype xác thực khi chưa có route hoặc component FE chứng minh vị trí đó.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `src/components/pages/AuthenticationPage/index.tsx:7` | route | Sau xác thực, frontend chỉ chấp nhận returnTo nội bộ và mặc định về /exam. |
| EV-002 | fe | `src/components/blocks/auth/AuthenticationPanel/component.tsx:13` | ui | Màn hình xác thực có ba cây details, code, done; pending và lỗi là trạng thái hiển thị trên cùng cây, với shortcut đứng trước form. |
| EV-003 | fe | `src/modules/api/graphql/mutations/mutation-sign-in-init.ts:11` | api | Frontend khởi tạo sign-in challenge ẩn danh và đọc toàn bộ envelope cùng challengeId và thời hạn. |
| EV-004 | be | `apps/api/src/features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.resolver.ts:49` | api | Backend bảo vệ signInInit bằng captcha và throttle, xác minh mật khẩu rồi gửi OTP; token chỉ đến sau OTP. |
| EV-005 | be | `test/e2e/auth-register.e2e-spec.ts:131` | test | Đăng ký tạo một user theo Keycloak subject, gửi email xác minh và tái sử dụng row khi subject đã tồn tại. |
| EV-006 | be | `test/e2e/two-factor.e2e-spec.ts:277` | test | TOTP secret được lưu mã hóa; mã hợp lệ bật 2FA, mã sai giữ nguyên trạng thái, và tắt hợp lệ xóa cờ cùng secret. |
