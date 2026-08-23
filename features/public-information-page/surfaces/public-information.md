# Surface · Thông tin cộng đồng Tây Sơn

> ID: `public-information` · Route: `/gioi-thieu`

## Job

Công bố nội dung giới thiệu, điều lệ, ban chủ nhiệm và thông tin liên quan đã xuất bản.

## Navigation

- Thông tin cộng đồng / Giới thiệu — active
- Thông tin cộng đồng / Điều lệ — available
- Thông tin cộng đồng / Ban chủ nhiệm — available

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `information-masthead` | summary | Định vị mục đích trang và phạm vi thông tin công khai. | default | none | `EV-002` |
| `document-index` | navigation | Giới thiệu; Điều lệ; Ban chủ nhiệm | default | none | `EV-001`, `EV-002` |
| `information-document` | content | Hiển thị nội dung đã xuất bản hoặc phản hồi trạng thái tương ứng. | information-loading, information-ready, information-error, information-unavailable | Tải lại | `EV-001`, `EV-002` |
| `continuation-band` | navigation | Đưa khách sang các bề mặt công khai liên quan khi khả dụng. | default | Khám phá hội viên, Theo dõi hoạt động | `EV-001`, `EV-002` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
