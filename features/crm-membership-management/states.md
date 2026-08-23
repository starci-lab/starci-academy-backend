# States · CRM quản lý hồ sơ hội viên Tây Sơn

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `collection-loading` | initial | Đang tải hàng đợi hồ sơ | collection-ready, collection-empty, collection-error, permission-denied | `EV-001`, `EV-002` |
| `collection-ready` | success | Hàng đợi hồ sơ sẵn sàng | membership-new, membership-reviewing, membership-approved, membership-rejected | `EV-001`, `EV-002` |
| `collection-empty` | empty | Không có hồ sơ phù hợp | collection-loading | `EV-001`, `EV-002` |
| `collection-error` | error | Không thể tải hàng đợi hồ sơ | collection-loading | `EV-001`, `EV-002` |
| `permission-denied` | error | Không có quyền truy cập CRM hội viên | terminal | `EV-001`, `EV-002` |
| `membership-new` | initial | Hồ sơ mới | membership-reviewing | `EV-001`, `EV-002` |
| `membership-reviewing` | pending | Hồ sơ đang xem xét | membership-approved, membership-rejected | `EV-001`, `EV-002` |
| `membership-approved` | success | Hồ sơ đã duyệt | terminal | `EV-001`, `EV-002` |
| `membership-rejected` | error | Hồ sơ đã từ chối | terminal | `EV-001`, `EV-002` |
