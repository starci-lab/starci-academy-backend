# States · API thông tin công khai Tây Sơn

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `information-loading` | initial | Đang tải thông tin | information-ready, information-unavailable, information-error | `EV-002`, `EV-003` |
| `information-ready` | success | Thông tin đã sẵn sàng | terminal | `EV-002`, `EV-003` |
| `information-unavailable` | empty | Thông tin chưa khả dụng | information-loading | `EV-002`, `EV-003` |
| `information-error` | error | Không thể tải thông tin | information-loading | `EV-002`, `EV-003` |
