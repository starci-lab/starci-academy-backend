# States · Trò chơi, bảng xếp hạng và streak

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `pending` | pending | Đang tải hoặc đang xử lý | ready, empty, error | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005` |
| `ready` | success | Dữ liệu sẵn sàng | Thực hiện hành động tiếp theo | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005` |
| `empty` | empty | Không có dữ liệu phù hợp | Đổi bộ lọc, Quay lại | `EV-001`, `EV-002` |
| `error` | error | Không thể hoàn tất yêu cầu | Thử lại | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005` |
