# Acceptance · Phỏng vấn, dự án cá nhân và playground

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Setup phải phân biệt phiên đang có với tạo phiên mới và không tự dựng seed topics. | `EV-001`, `EV-002` |
| `AC-02` | Task và result phải giữ taskId và displayId trong route. | `EV-001` |
| `AC-03` | Session chỉ bắt đầu khi backend trả id, pairingCode và steps. | `EV-001`, `EV-003` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
