# Truy cập và bảo vệ tài khoản

> Business identity: `miamia/account-access@f155d30db02551d9a7229bedb1d307e4acb8cff3d3fade0754f6f893d93ab761`
>
> Source heads: `fe@775bc711bafd`, `be@9dc84d7278ab`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Người dùng đăng nhập, đăng ký hoặc khôi phục mật khẩu bằng email/mật khẩu và OTP; hệ thống chỉ điều hướng về đường dẫn nội bộ sau khi có phiên và hỗ trợ TOTP như lớp bảo vệ bổ sung.

**Primary actor.** Khách chưa xác thực

**Primary outcome.** Phiên được tạo sau bước OTP thành công

**Never does.** Thiết kế nhà cung cấp danh tính

## Invariants

- `BR-01` — returnTo chỉ được dùng khi bắt đầu bằng một dấu gạch chéo và không bắt đầu bằng hai dấu gạch chéo; nếu không, đích mặc định là /exam.
- `BR-02` — Đăng nhập bằng mật khẩu chỉ khởi tạo challenge OTP; token chỉ được trả sau khi OTP được xác minh.
- `BR-03` — Đăng ký lại cùng Keycloak subject phải tái sử dụng user hiện có thay vì tạo bản ghi trùng.
- `BR-04` — TOTP chỉ được bật sau khi xác nhận mã hợp lệ; secret lưu trữ được mã hóa và phải bị xóa khi tắt thành công.

## Primary flow

```text
details → code → done
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `authentication` | `/[lang]/authentication` | Thu thập thông tin tài khoản, xác minh OTP và đưa thành viên vào ứng dụng. | [surface](surfaces/authentication.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `signInInit` | backend | username/password request, captcha | challengeId, expiresInSeconds |
| `POST /v1/keycloak/auth/register` | backend | email, password, firstName, lastName | user id, access token |
| `setupTwoFactor / confirmTwoFactor / disableTwoFactor` | backend | authenticated member, TOTP code when confirming or disabling | secret and otpauthUrl on setup, success envelope |
| `replace(returnTo)` | frontend | returnTo query parameter | internal application route |

## Explicit unknowns

- `session-management-surface` — Frontend sẽ đặt bề mặt xem và thu hồi các phiên đăng nhập ở route nào? Impact: Backend có năng lực phiên nhưng source FE hiện tại không có route chuyên biệt để tạo nội dung prototype trung thực.
- `two-factor-surface` — Frontend sẽ đặt thao tác thiết lập, xác nhận và tắt TOTP ở bề mặt nào? Impact: Không được thêm vùng 2FA vào prototype xác thực khi chưa có route hoặc component FE chứng minh vị trí đó.

## LOADS

| Need | Read |
|---|---|
| Scope, terminology and exclusions | [overview.md](overview.md) |
| Actor permissions and ownership | [actors.md](actors.md) |
| One user journey | `flows/<flow-id>.md` |
| One renderable screen | `surfaces/<surface-id>.md` |
| Business invariants | [rules.md](rules.md) |
| State transitions | [states.md](states.md) |
| Entities, inputs, outputs and failures | [contracts.md](contracts.md) |
| Completion and regression proof | [acceptance.md](acceptance.md) |
| Machine rendering/query | [model.json](model.json) |
| Exact source provenance | [evidence.json](evidence.json) |

## Context rule

Do not load every module by default. `CONTEXT.md` plus the one flow or surface being changed is the normal prompt. `model.json` is authoritative for machines; Markdown files are generated projections. Unknowns remain unknown until routed source or an explicit owner decision resolves them.
