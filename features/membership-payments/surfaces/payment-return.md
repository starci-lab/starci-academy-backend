# Surface · Trạng thái thanh toán

> ID: `payment-return` · Route: `provider-return-url (không có page chuyên biệt trong FE current head)`

## Job

Diễn giải pending/succeeded/unpaid từ transaction thay vì tự suy luận theo redirect.

## Navigation

- none

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `payment-return-content` | content | Trạng thái giao dịch; Quyền đã cấp | pending, ready, empty, error | Kiểm tra lại | `EV-003`, `EV-004` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
