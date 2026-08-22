# API thông tin công khai Tây Sơn

> Business identity: `tayson/public-information-api@742352cc959645eaf1255c944a369ef5d7cf19ff76687be2f282626fb3dc4e82`
>
> Source heads: authority `implemented` · base `4386640cc7376e96c9f4678ad5e939063d843e393d73b9d5f78cd030c00730fe` · `fe@6a954d40294c`, `be@661c37a1c6bb`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Backend cung cấp truy vấn chỉ đọc tài liệu thông tin công khai đã xuất bản cho trang /gioi-thieu, với kết quả ổn định để frontend hiển thị ready, unavailable hoặc error mà không làm lộ nội dung nháp hay đã lưu trữ.

**Primary actor.** Khách truy cập

**Primary outcome.** Khách đọc được tài liệu thông tin công khai đã xuất bản từ backend

**Never does.** Mutation tạo, sửa, xuất bản hoặc lưu trữ nội dung trong CMS

## Invariants

- `BR-01` — Truy vấn công khai chỉ trả tài liệu có trạng thái published.
- `BR-02` — Tài liệu draft, archived hoặc không tồn tại được biểu diễn là unavailable và không làm lộ nội dung bị ẩn.
- `BR-03` — Backend cung cấp kết quả đủ ổn định để frontend ánh xạ sang ready, unavailable hoặc error trong chrome trang không đổi.
- `BR-04` — Capability này chỉ đọc và không sở hữu mutation CMS, xác thực hoặc phân quyền quản trị.
- `BR-05` — API không tự tạo tên nhân sự, điều khoản điều lệ hoặc dữ kiện pháp lý chưa được owner cung cấp.

## Primary flow

```text
information-loading → information-ready → information-ready
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `public-information` | `/gioi-thieu` | Hiển thị tài liệu thông tin công khai được đọc từ backend. | [surface](surfaces/public-information.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `Đọc tài liệu thông tin công khai` | backend | Định danh tài liệu công khai | Tiêu đề đã xuất bản, Các phần nội dung đã xuất bản theo thứ tự, Trạng thái hiển thị |

## Explicit unknowns

- `api-transport` — Backend sẽ công bố operation bằng REST, GraphQL hay transport nào theo pattern Tây Sơn? Impact: Được quyết định ở backend planning; không thay đổi business contract của truy vấn chỉ đọc.
- `persistence-schema` — Entity và persistence nào sẽ lưu tài liệu cùng các phần nội dung theo thứ tự? Impact: Chặn file plan và migration chính xác nhưng không chặn authority business.
- `canonical-document-identity` — Định danh canonical và seed production của tài liệu /gioi-thieu là gì? Impact: Chặn dữ liệu production chính thức; implementation có thể giữ contract định danh mà không tự tạo nội dung.
- `cache-policy` — Nội dung công khai có yêu cầu cache, revalidation hoặc invalidation cụ thể không? Impact: Chặn tối ưu vận hành cuối cùng nhưng không thay đổi quyền truy cập published-only.

## LOADS

| Need | Read |
|---|---|
| Scope, terminology and exclusions | [overview.md](overview.md) |
| Actor permissions and ownership | [actors.md](actors.md) |
| One user journey | `flows/<flow-id>.md` |
| One renderable screen | `surfaces/<surface-id>.md` |
| Business invariants | [rules.md](rules.md) |
| State transitions | [states.md](states.md) |
| Entities, inputs, outputs and failures | [contracts.md](contracts.md) |
| Completion and regression proof | [acceptance.md](acceptance.md) |
| Machine rendering/query | [model.json](model.json) |
| Exact source provenance | [evidence.json](evidence.json) |

## Context rule

Do not load every module by default. `CONTEXT.md` plus the one flow or surface being changed is the normal prompt. `model.json` is authoritative for machines; Markdown files are generated projections. Unknowns remain unknown until routed source or an explicit owner decision resolves them.
