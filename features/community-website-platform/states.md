# States · Nền tảng website Cộng đồng Doanh nghiệp Tây Sơn

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `membership-new` | initial | Đăng ký mới | membership-reviewing | `EV-001` |
| `membership-reviewing` | pending | Đang xem xét | membership-approved, membership-rejected | `EV-001` |
| `membership-approved` | success | Đã duyệt | terminal | `EV-001` |
| `membership-rejected` | error | Đã từ chối | terminal | `EV-001` |
| `content-draft` | initial | Bản nháp | content-published | `EV-001` |
| `content-published` | success | Đã xuất bản | content-archived | `EV-001` |
| `content-archived` | partial | Đã lưu trữ | terminal | `EV-001` |
| `submission-new` | initial | Yêu cầu mới | submission-processing | `EV-001` |
| `submission-processing` | pending | Đang xử lý | submission-completed | `EV-001` |
| `submission-completed` | success | Đã xử lý | terminal | `EV-001` |
