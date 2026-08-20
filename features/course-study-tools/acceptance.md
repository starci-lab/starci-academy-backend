# Acceptance · Công cụ ôn tập trong khóa học

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Review/quiz phải dùng sessionId ổn định và result route tương ứng. | `EV-001`, `EV-002` |
| `AC-02` | Mỗi category/resource phải giữ identity route riêng. | `EV-001` |
| `AC-03` | Mind map phải phân biệt không có graph với không có kết quả tìm kiếm. | `EV-001` |
| `AC-04` | List và detail phải có empty/not-found/failed trung thực. | `EV-001` |
| `AC-05` | Bảng xếp hạng phải có pending/ready/empty/failed. | `EV-001` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
