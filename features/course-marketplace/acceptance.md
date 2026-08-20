# Acceptance · Khám phá và mua khóa học

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Danh mục phải tách owned khỏi discover và phân biệt pending, empty, filtered-empty, failed. | `EV-001`, `EV-002` |
| `AC-02` | Route chi tiết phải dùng displayId để resolve khóa học. | `EV-001` |
| `AC-03` | Giỏ không được coi người chưa đăng nhập là giỏ trống và không được báo thành công trước webhook. | `EV-001`, `EV-003` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
