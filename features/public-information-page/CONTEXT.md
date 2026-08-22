# Trang thông tin cộng đồng Tây Sơn

> Business identity: `tayson/public-information-page@c2e6b5db6ca026baa3693627defcbde2a09749494e7a6cc127131dfc044a3ffa`
>
> Source heads: authority `pending` · `fe@e89b39a3c6f8`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Trang công khai tiếng Việt tại /gioi-thieu giúp khách truy cập đọc nội dung giới thiệu, điều lệ, ban chủ nhiệm và thông tin liên quan đã được xuất bản, với trải nghiệm responsive, SSR/SEO cơ bản và các trạng thái tải, sẵn sàng, lỗi, không khả dụng.

**Primary actor.** Khách truy cập

**Primary outcome.** Khách hiểu mục đích, nguyên tắc và cơ cấu thông tin của cộng đồng

**Never does.** Tự tạo tên ban chủ nhiệm, điều khoản điều lệ hoặc dữ kiện pháp lý chưa được owner cung cấp

## Invariants

- `BR-01` — Trang công khai chỉ trình bày nội dung được xác định là đã xuất bản.
- `BR-02` — Phiên bản đầu của trang sử dụng tiếng Việt và phải responsive.
- `BR-03` — Khối tài liệu sở hữu bốn trạng thái loading, ready, error và unavailable; chrome trang vẫn ổn định khi trạng thái khối thay đổi.
- `BR-04` — Không hiển thị tên nhân sự, điều khoản điều lệ hoặc dữ kiện pháp lý chưa có nội dung owner cung cấp.

## Primary flow

```text
information-loading → information-ready → Chọn một liên kết tiếp tục
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `public-information` | `/gioi-thieu` | Công bố nội dung giới thiệu, điều lệ, ban chủ nhiệm và thông tin liên quan đã xuất bản. | [surface](surfaces/public-information.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `Đọc tài liệu thông tin công khai` | frontend | Định danh tài liệu công khai | Nội dung đã xuất bản, Trạng thái hiển thị |

## Explicit unknowns

- `official-board-content` — Danh sách và chức danh chính thức của ban chủ nhiệm là gì? Impact: Chưa hiển thị tên cá nhân hoặc chức danh cụ thể trong nội dung công khai.
- `official-charter-content` — Toàn văn điều lệ đã được duyệt để công bố là phiên bản nào? Impact: Chưa hiển thị điều khoản hoặc trích dẫn pháp lý cụ thể.
- `backend-content-contract` — API và CMS nào sẽ sở hữu nội dung công khai sau giai đoạn frontend hiện tại? Impact: Giai đoạn này dùng seed phát triển/test có kiểm soát; tích hợp backend nằm ngoài source boundary đã duyệt.

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
