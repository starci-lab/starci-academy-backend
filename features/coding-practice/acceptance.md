# Acceptance · Luyện bài coding và nhận verdict

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Hub phải dẫn tới route domain ổn định. | `EV-001` |
| `AC-02` | Domain filter không được thay bằng tag filter. | `EV-001`, `EV-002` |
| `AC-03` | UI phải chờ verdict bất đồng bộ thay vì xem mutation response là kết quả chấm. | `EV-001`, `EV-003` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
