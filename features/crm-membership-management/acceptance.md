# Acceptance · CRM quản lý hồ sơ hội viên Tây Sơn

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Người dùng quản trị được phân quyền mở /hoi-vien và thấy hàng đợi hồ sơ hoặc một trạng thái loading, empty, error hay permission-denied rõ ràng. | `EV-001`, `EV-002` |
| `AC-02` | Staff được phép mở hồ sơ mới và chuyển hồ sơ từ new sang reviewing nhưng không nhận hành động ngoài quyền. | `EV-001`, `EV-002` |
| `AC-03` | Manager hoặc Admin được phép chuyển hồ sơ reviewing sang approved hoặc rejected và quyết định tạo audit entry. | `EV-001`, `EV-002` |
| `AC-04` | Chỉ hồ sơ approved đủ điều kiện tạo hồ sơ công khai; mọi trạng thái khác không được công khai. | `EV-001`, `EV-002` |
| `AC-05` | Người dùng không có quyền không đọc được hàng đợi, dữ liệu hồ sơ hoặc hành động xử lý bị cấm. | `EV-001`, `EV-002` |
| `AC-06` | Capability không tự xác định hoặc công khai trường cá nhân và doanh nghiệp chưa được owner chốt. | `EV-001`, `EV-002` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
