# CRM quản lý hồ sơ hội viên Tây Sơn

> Business identity: `tayson/crm-membership-management@045f96e7829e77924cce0b2e526b55f5d6ea0dcf3e250990b5a4ccd50d53bfe0`
>
> Source heads: authority `pending` · `fe@6a954d40294c`, `be@661c37a1c6bb`
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
collection-ready → membership-new → membership-reviewing → membership-approved
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `crm-membership-management` | `/hoi-vien` | Tiếp nhận, xem xét, duyệt hoặc từ chối hồ sơ đăng ký hội viên theo quyền của người dùng quản trị. | [surface](surfaces/crm-membership-management.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `Đọc hàng đợi hồ sơ hội viên` | backend | none | Các hồ sơ được phép xem, Trạng thái xử lý hiện tại |
| `Đọc một hồ sơ đăng ký hội viên` | backend | Định danh hồ sơ | Dữ liệu do người đăng ký cung cấp, Trạng thái xử lý, Thời điểm gửi |
| `Xử lý hồ sơ đăng ký hội viên` | backend | Định danh hồ sơ, Quyết định xử lý | Trạng thái hồ sơ đã cập nhật, Hồ sơ công khai nếu approved, Audit entry |

## Explicit unknowns

- `member-field-schema` — Hồ sơ đăng ký và hồ sơ doanh nghiệp gồm những trường nào, trường nào được phép công khai? Impact: Chặn schema cuối cùng, validation, privacy và anatomy chi tiết của màn xem hồ sơ.
- `queue-query-policy` — Hàng đợi cần pagination, filter, search và sort theo quy tắc nào? Impact: Chặn input query và điều khiển collection cuối cùng nhưng không chặn route hoặc lifecycle.
- `decision-details` — Từ chối hoặc duyệt có bắt buộc lý do, ghi chú nội bộ hay xác nhận bổ sung không? Impact: Chặn contract form quyết định và dữ liệu audit chi tiết.
- `auth-session-contract` — Cơ chế phiên, mời tài khoản, đặt lại mật khẩu, 2FA và thời hạn phiên của CRM là gì? Impact: Chặn auth implementation nhưng không thay đổi quyền nghiệp vụ của route /hoi-vien.
- `membership-api-shape` — Backend sẽ công bố query và command hội viên bằng GraphQL shape nào cùng persistence schema nào? Impact: Chặn backend file plan và kết nối FE thật; business model không khóa transport hoặc database shape.
- `membership-notifications` — Có cần gửi email hoặc thông báo khi hồ sơ chuyển reviewing, approved hoặc rejected không? Impact: Quyết định provider và event flow; hiện nằm ngoài operation đã chốt.
- `concurrent-review-policy` — Hệ thống xử lý thế nào khi hai người cùng xem xét hoặc quyết định một hồ sơ? Impact: Chặn concurrency contract và failure chi tiết.

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
