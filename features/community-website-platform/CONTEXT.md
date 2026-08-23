# Nền tảng website Cộng đồng Doanh nghiệp Tây Sơn

> Business identity: `tayson/community-website-platform@63eb84036a986bd0e75e51b3b5088264b08e9d788876e5267c2ba1bf1b20b53f`
>
> Source heads: authority `pending` · `fe@6a954d40294c`, `be@4226f4404948`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Website công khai responsive cùng CMS quản trị, API và dữ liệu nghiệp vụ cho thông tin cộng đồng, hội viên, nội dung truyền thông, biểu mẫu, người dùng, phân quyền, audit và backup/restore.

**Primary actor.** Khách truy cập

**Primary outcome.** Khách hiểu cộng đồng, hoạt động và các doanh nghiệp thành viên

**Never does.** Cổng đăng nhập hoặc dashboard riêng cho hội viên

## Invariants

- `BR-01` — CMS có ba vai trò Admin, Manager và Staff; Admin toàn quyền, Manager quản lý nội dung/hội viên/biểu mẫu/cấu hình, Staff biên tập và xử lý biểu mẫu nhưng không quản lý tài khoản.
- `BR-02` — Hồ sơ đăng ký hội viên đi theo new → reviewing → approved hoặc rejected; chỉ approved được hiển thị công khai.
- `BR-03` — Nội dung đi theo draft → published → archived; phiên bản đầu không có scheduling hoặc duyệt nhiều cấp.
- `BR-04` — Dữ liệu nghiệp vụ được xóa mềm để giữ khả năng audit và phục hồi.
- `BR-05` — Phiên bản đầu sử dụng tiếng Việt; đa ngôn ngữ nằm ngoài phạm vi.

## Primary flow

```text
Mở trang đầu của website → content-published → membership-approved
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `public-home` | `unresolved://public-home` | Định hướng khách truy cập tới thông tin cộng đồng, hội viên, nội dung nổi bật, đăng ký và liên hệ. | [surface](surfaces/public-home.md) |
| `public-information` | `unresolved://public-information` | Công bố giới thiệu, điều lệ, ban chủ nhiệm và các nội dung liên quan. | [surface](surfaces/public-information.md) |
| `member-directory` | `unresolved://member-directory` | Hiển thị danh sách và thông tin doanh nghiệp của hội viên đã được duyệt công khai. | [surface](surfaces/member-directory.md) |
| `membership-registration` | `unresolved://membership-registration` | Thu thập và gửi thông tin đăng ký hội viên trực tuyến. | [surface](surfaces/membership-registration.md) |
| `public-content` | `/tin-tuc-hoat-dong` | Hiển thị tin tức, hoạt động, sự kiện, từ thiện, đối ngoại và các nội dung truyền thông đã xuất bản. | [surface](surfaces/public-content.md) |
| `public-content-detail` | `/tin-tuc-hoat-dong/:slug` | Hiển thị một nội dung truyền thông đã xuất bản từ danh sách tin tức và hoạt động. | [surface](surfaces/public-content-detail.md) |
| `public-contact` | `unresolved://public-contact` | Công bố thông tin liên hệ và tiếp nhận biểu mẫu liên hệ hoặc yêu cầu. | [surface](surfaces/public-contact.md) |
| `admin-auth` | `unresolved://admin-auth` | Xác thực người dùng quản trị và mở đúng quyền theo vai trò. | [surface](surfaces/admin-auth.md) |
| `admin-content` | `unresolved://admin-content` | Tạo, chỉnh sửa, xuất bản, lưu trữ nội dung và quản lý danh mục liên quan. | [surface](surfaces/admin-content.md) |
| `admin-members` | `unresolved://admin-members` | Tiếp nhận, xem xét, duyệt hoặc từ chối đăng ký và quản lý hồ sơ công khai. | [surface](surfaces/admin-members.md) |
| `admin-submissions` | `unresolved://admin-submissions` | Xem và xử lý đăng ký, liên hệ hoặc yêu cầu được gửi từ website. | [surface](surfaces/admin-submissions.md) |
| `admin-system` | `unresolved://admin-system` | Quản lý người dùng, phân quyền, cấu hình website, audit, backup và restore. | [surface](surfaces/admin-system.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `Đọc danh sách nội dung công khai` | backend | Không có | Các danh mục đang hoạt động cùng nội dung published, chưa xóa mềm, theo thứ tự danh mục và publishedAt giảm dần |
| `Đọc chi tiết nội dung công khai` | backend | Slug nội dung | Một nội dung published và chưa xóa mềm |
| `Đọc hội viên công khai` | backend | Phân trang hoặc định danh | Hồ sơ hội viên đã duyệt và công khai |
| `Gửi đăng ký hội viên` | backend | Dữ liệu biểu mẫu đăng ký | Đăng ký trạng thái new, Xác nhận tiếp nhận |
| `Gửi biểu mẫu liên hệ` | backend | Dữ liệu liên hệ hoặc yêu cầu | Biểu mẫu trạng thái new, Xác nhận tiếp nhận |
| `Đăng nhập quản trị` | backend | Thông tin đăng nhập | Phiên xác thực và quyền |
| `Đăng xuất quản trị` | backend | Phiên hiện tại | Phiên bị kết thúc |
| `Quản lý tài khoản và phân quyền` | backend | Thông tin tài khoản, Vai trò, Trạng thái khóa | Tài khoản đã cập nhật, Audit entry |

## Explicit unknowns

- `unknown-brand-assets` — Logo, màu thương hiệu, font, hình ảnh và nội dung khởi tạo chính thức là gì? Impact: Chặn khóa visual identity và dữ liệu production của website công khai.
- `unknown-route-map` — Route URL chính xác cho các trang công khai và module CMS còn lại ngoài family /tin-tuc-hoat-dong là gì? Impact: Chặn page map cuối cùng của các surface còn dùng unresolved route identities; không chặn list/detail Tin tức & Hoạt động đã được chốt.
- `unknown-member-fields` — Biểu mẫu đăng ký và hồ sơ doanh nghiệp gồm những trường nào, trường nào được công khai? Impact: Chặn schema cuối cùng, validation, privacy và giao diện form/detail.
- `unknown-production-content-values` — Nhãn chuyên mục, nội dung, hình ảnh và media production chính thức là gì? Impact: Không chặn schema, seed development hoặc list/detail V1; chỉ chặn dữ liệu production cuối cùng.
- `unknown-auth-recovery` — Cơ chế đặt lại mật khẩu, mời tài khoản, 2FA và thời hạn phiên được yêu cầu ra sao? Impact: Chặn hoàn thiện security flow của CMS.
- `unknown-notifications` — Có cần gửi email hoặc thông báo khi tiếp nhận, duyệt hoặc từ chối đăng ký/liên hệ không? Impact: Quyết định provider, template và event flow.
- `unknown-media-policy` — Giới hạn loại tệp, dung lượng, lưu trữ và xử lý ảnh/media là gì? Impact: Chặn validation và xử lý upload của CMS; không chặn public read rendering từ hero media key tùy chọn.
- `unknown-audit-policy` — Những thao tác nào bắt buộc audit và thời gian lưu audit bao lâu? Impact: Chặn tập sự kiện và retention chính xác.
- `unknown-backup-policy` — Tần suất backup, retention, vị trí lưu, RPO và RTO là gì? Impact: Chặn cấu hình vận hành và acceptance test restore.
- `unknown-domain-hosting` — Tên miền, hosting/VPS, DNS, SSL và credential authority do ai cung cấp? Impact: Chặn deploy/go-live nhưng không chặn code local.
- `unknown-browser-matrix` — Danh sách trình duyệt và phiên bản phải hỗ trợ cụ thể là gì? Impact: Chặn browser acceptance matrix cuối cùng.
- `unknown-privacy-consent` — Nội dung đồng ý xử lý dữ liệu cá nhân, chống spam và thời hạn lưu biểu mẫu là gì? Impact: Chặn privacy copy, consent field và retention.

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
