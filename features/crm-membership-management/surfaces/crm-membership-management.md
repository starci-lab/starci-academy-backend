# Surface · Quản lý hội viên

> ID: `crm-membership-management` · Route: `/hoi-vien`

## Job

Tiếp nhận, xem xét, duyệt hoặc từ chối hồ sơ đăng ký hội viên theo quyền của người dùng quản trị.

## Navigation

- none

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `membership-queue` | collection | Định danh hồ sơ; Trạng thái xử lý; Thời điểm gửi | collection-loading, collection-empty, collection-ready, collection-error, permission-denied | Xem hồ sơ | `EV-001`, `EV-002` |
| `membership-review` | flow | Dữ liệu do người đăng ký cung cấp; Trạng thái hiện tại | membership-new, membership-reviewing, membership-approved, membership-rejected, permission-denied | Bắt đầu xem xét, Duyệt hồ sơ, Từ chối hồ sơ | `EV-001`, `EV-002` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
