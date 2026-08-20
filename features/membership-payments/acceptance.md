# Acceptance · Membership, gói tải đề và thanh toán

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Pricing không được hard-code price/entitlement ngoài catalog server trả về. | `EV-001`, `EV-002`, `EV-003` |
| `AC-02` | Redirect về không được coi là paid; chỉ reconciliation provider xác nhận mới cấp quyền. | `EV-003`, `EV-004` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
