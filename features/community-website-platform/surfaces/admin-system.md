# Surface · Quản trị hệ thống

> ID: `admin-system` · Route: `unresolved://admin-system`

## Job

Quản lý người dùng, phân quyền, cấu hình website, audit, backup và restore.

## Navigation

- none

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `admin-user-management` | collection | Tài khoản, vai trò và trạng thái khóa. | loading, empty, ready, error, permission-denied | Thêm tài khoản | `EV-001` |
| `admin-site-settings` | form | Banner, menu, thông tin liên hệ và cấu hình cơ bản. | ready, disabled, submitting, success, error | Lưu cấu hình | `EV-001` |
| `admin-audit-backup` | collection | Nhật ký thao tác thiết yếu, backup và restore. | loading, empty, ready, error, permission-denied | Tạo backup | `EV-001` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
