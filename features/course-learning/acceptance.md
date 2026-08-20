# Acceptance · Học nội dung và làm thử thách khóa học

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Route Today phải nhận displayId và có pending/ready/empty/failed. | `EV-001` |
| `AC-02` | Reader phải phân biệt content thật với body bị giới hạn premium. | `EV-001`, `EV-002` |
| `AC-03` | Nộp thành công phải trả jobId, không giả lập kết quả đồng bộ. | `EV-001`, `EV-003` |
| `AC-04` | Q&A phải có trạng thái empty và failed trung thực. | `EV-001` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
