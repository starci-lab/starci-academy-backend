# Acceptance · Hồ sơ học viên và bằng chứng công khai

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Public profile dùng username và follow state live; owner-only progress không lộ cho visitor. | `EV-001`, `EV-002`, `EV-004` |
| `AC-02` | Không có accepted submission phải hiển thị empty proof trung thực. | `EV-001` |
| `AC-03` | Pinned và capstone phải có loading/error/empty độc lập. | `EV-001` |
| `AC-04` | Route phải giữ courseId và submissionId của bằng chứng. | `EV-001` |
| `AC-05` | CV phải phân biệt empty, uncompiled, ready và error; Wrapped phải giữ route riêng. | `EV-001` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
