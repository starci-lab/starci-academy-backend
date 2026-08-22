# Surface · Quản lý nội dung

> ID: `admin-content` · Route: `unresolved://admin-content`

## Job

Tạo, chỉnh sửa, xuất bản, lưu trữ nội dung và quản lý danh mục liên quan.

## Navigation

- none

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `admin-content-list` | collection | Danh sách nội dung theo loại và trạng thái. | loading, empty, ready, error, permission-denied | Tạo nội dung | `EV-001` |
| `admin-content-editor` | form | Soạn, lưu nháp, xuất bản hoặc lưu trữ theo quyền. | ready, disabled, submitting, success, error | Lưu | `EV-001` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
