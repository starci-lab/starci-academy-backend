# CRM quản lý hồ sơ hội viên Tây Sơn

> Business identity: `tayson/crm-membership-management@8b9e9d34039f91f39422ae6798b5d3256198f813d6d06bd925c36bb2c2be804c`
>
> Source heads: authority `in-progress` · `fe@6a954d40294c`, `be@661c37a1c6bb`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** CRM nội bộ tại /hoi-vien cho phép nhân sự được phân quyền tiếp nhận, xem xét và quyết định hồ sơ đăng ký hội viên theo vòng đời đã duyệt, đồng thời chỉ cho phép hồ sơ được phê duyệt trở thành hồ sơ công khai.

**Primary actor.** Nhân viên vận hành

**Primary outcome.** Hồ sơ có một trạng thái xử lý hợp lệ và quyết định có dấu vết audit

**Never does.** Biểu mẫu đăng ký hội viên công khai

## Invariants

- `BR-01` — Hồ sơ đăng ký hội viên chỉ chuyển theo new → reviewing → approved hoặc rejected.
- `BR-02` — Chỉ hồ sơ approved mới đủ điều kiện trở thành hồ sơ hội viên công khai; hồ sơ new, reviewing hoặc rejected không được công khai.
- `BR-03` — Admin có toàn quyền trong scope, Manager được quản lý và quyết định hồ sơ, Staff được biên tập và xử lý biểu mẫu nhưng không quản lý tài khoản.
- `BR-04` — Hành động không được vai trò cho phép phải bị từ chối và không xuất hiện như một thao tác khả dụng trong CRM.
- `BR-05` — Quyết định xử lý hồ sơ tạo audit entry và dữ liệu nghiệp vụ sử dụng xóa mềm để giữ khả năng audit và phục hồi.

## Primary flow

```text
collection-ready → membership-new → membership-reviewing → Xác nhận duyệt hoặc từ chối hồ sơ đang xem xét
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `crm-membership-management` | `/hoi-vien` | Tiếp nhận, xem xét, duyệt hoặc từ chối hồ sơ đăng ký hội viên theo quyền của người dùng quản trị. | [surface](surfaces/crm-membership-management.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `Đọc hàng đợi hồ sơ hội viên` | backend | Từ khóa tìm theo mã hồ sơ, tên doanh nghiệp hoặc mã số thuế, Bộ lọc trạng thái, Trang hiện tại với 20 hồ sơ mỗi trang, Sắp xếp thời điểm gửi mới nhất trước | Các hồ sơ được phép xem, Trạng thái xử lý hiện tại, Thông tin phân trang, Phiên bản hồ sơ dùng cho lệnh chuyển trạng thái |
| `Đọc một hồ sơ đăng ký hội viên` | backend | Định danh hồ sơ | Các trường hồ sơ CRM V1, Phân loại trường nội bộ và trường được phép công khai, Trạng thái xử lý, Thời điểm gửi, Phiên bản hồ sơ dùng cho lệnh chuyển trạng thái |
| `Bắt đầu xem xét hồ sơ hội viên` | backend | Định danh hồ sơ, expectedVersion của hồ sơ | Hồ sơ ở trạng thái reviewing, Phiên bản hồ sơ mới, Audit entry bắt đầu xem xét |
| `Quyết định hồ sơ đăng ký hội viên` | backend | Định danh hồ sơ, Quyết định xử lý, Lý do bắt buộc khi từ chối, Ghi chú nội bộ tùy chọn khi duyệt, Xác nhận quyết định, expectedVersion của hồ sơ | Trạng thái hồ sơ đã cập nhật, Hồ sơ công khai nếu approved, Audit entry |

## Explicit unknowns

- No unresolved question is recorded.

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
