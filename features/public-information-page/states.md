# States · Trang thông tin cộng đồng Tây Sơn

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `information-loading` | initial | Đang tải thông tin | information-ready, information-error, information-unavailable | `EV-002` |
| `information-ready` | success | Thông tin đã sẵn sàng | terminal | `EV-001`, `EV-002` |
| `information-error` | error | Không thể tải thông tin | information-loading | `EV-002` |
| `information-unavailable` | empty | Thông tin chưa khả dụng | information-loading | `EV-002` |
