# Nền tảng website Cộng đồng Doanh nghiệp Tây Sơn

> Business head: `3fb28ac7bf9d941f7110141c095ec3d0cc74dcea0658bf6abb9721bcfcba0e53`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Website công khai responsive cùng CMS quản trị, API và dữ liệu nghiệp vụ cho thông tin cộng đồng, hội viên, nội dung truyền thông, biểu mẫu, người dùng, phân quyền, audit và backup/restore.

Included:
- Website công khai responsive bằng Next.js cho desktop, laptop và thiết bị di động
- Thông tin giới thiệu cộng đồng, điều lệ, ban chủ nhiệm và nội dung liên quan
- Danh sách hội viên, thông tin doanh nghiệp và đăng ký hội viên trực tuyến
- Tin tức, hoạt động, sự kiện, từ thiện, đối ngoại, liên hệ và các trang nội dung CMS
- CMS quản trị nội dung, bài viết, hội viên, banner, menu, danh mục, biểu mẫu và cấu hình website
- Đăng nhập quản trị, quản lý tài khoản, khóa tài khoản và phân quyền Admin, Manager, Staff
- API giao tiếp frontend-backend, audit thao tác quản trị thiết yếu và bảo mật cơ bản
- SEO cơ bản, SSR, hiệu năng tải trang và tương thích trình duyệt phổ biến
- Backup định kỳ và khôi phục dữ liệu khi có sự cố

Excluded:
- Cổng đăng nhập hoặc dashboard riêng cho hội viên
- Thanh toán trực tuyến hoặc quản lý nghĩa vụ thanh toán hợp đồng
- Hệ thống ticket hỗ trợ và bảo hành nội bộ
- Đa ngôn ngữ trong phiên bản đầu tiên
- Lịch xuất bản nội dung hoặc quy trình duyệt nhiều cấp
- Các chức năng ngoài phụ lục hợp đồng nếu chưa có quyết định owner mới

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci183/tayson.git | `6a954d40294c3dfaf7678d2eb4c34c1cd3c389d2` |
| be | https://github.com/starci183/tayson-be.git | `4226f4404948d5e5a29a4a31c4fd8b1ed5951f8e` |

## 3. Actors and access

### Khách truy cập

- Xem thông tin cộng đồng
- Xem hội viên và doanh nghiệp đã công khai
- Đọc nội dung truyền thông
- Gửi biểu mẫu liên hệ

Evidence: `EV-001`

### Người đăng ký hội viên

- Điền và gửi biểu mẫu đăng ký hội viên trực tuyến

Evidence: `EV-001`

### Nhân viên nội dung

- Soạn và chỉnh sửa nội dung
- Xử lý biểu mẫu
- Cập nhật hồ sơ hội viên trong phạm vi được giao

Evidence: `EV-001`

### Quản lý

- Xuất bản nội dung
- Duyệt hoặc từ chối đăng ký hội viên
- Quản lý nội dung, hội viên, biểu mẫu và cấu hình website

Evidence: `EV-001`

### Quản trị viên

- Toàn quyền CMS
- Quản lý tài khoản và phân quyền
- Khóa tài khoản
- Vận hành backup và restore

Evidence: `EV-001`

## 4. Entry points and surfaces

### Trang đầu cộng đồng

- ID: `public-home`
- Route: `unresolved://public-home`
- Purpose: Định hướng khách truy cập tới thông tin cộng đồng, hội viên, nội dung nổi bật, đăng ký và liên hệ.
- Regions: `home-introduction`, `home-featured-content`, `home-membership-entry`
- Navigation: Giới thiệu (available), Hội viên (available), Tin tức & Hoạt động (available), Liên hệ (available)

Evidence: `EV-001`

### Thông tin cộng đồng

- ID: `public-information`
- Route: `unresolved://public-information`
- Purpose: Công bố giới thiệu, điều lệ, ban chủ nhiệm và các nội dung liên quan.
- Regions: `information-document`
- Navigation: none

Evidence: `EV-001`

### Hội viên và doanh nghiệp

- ID: `member-directory`
- Route: `unresolved://member-directory`
- Purpose: Hiển thị danh sách và thông tin doanh nghiệp của hội viên đã được duyệt công khai.
- Regions: `member-list`
- Navigation: none

Evidence: `EV-001`

### Đăng ký hội viên

- ID: `membership-registration`
- Route: `unresolved://membership-registration`
- Purpose: Thu thập và gửi thông tin đăng ký hội viên trực tuyến.
- Regions: `membership-form`
- Navigation: none

Evidence: `EV-001`

### Tin tức và hoạt động

- ID: `public-content`
- Route: `unresolved://public-content`
- Purpose: Hiển thị tin tức, hoạt động, sự kiện, từ thiện, đối ngoại và các nội dung truyền thông đã xuất bản.
- Regions: `content-collection`
- Navigation: none

Evidence: `EV-001`

### Liên hệ

- ID: `public-contact`
- Route: `unresolved://public-contact`
- Purpose: Công bố thông tin liên hệ và tiếp nhận biểu mẫu liên hệ hoặc yêu cầu.
- Regions: `contact-details`, `contact-form`
- Navigation: none

Evidence: `EV-001`

### Đăng nhập quản trị

- ID: `admin-auth`
- Route: `unresolved://admin-auth`
- Purpose: Xác thực người dùng quản trị và mở đúng quyền theo vai trò.
- Regions: `admin-login-form`
- Navigation: none

Evidence: `EV-001`

### Quản lý nội dung

- ID: `admin-content`
- Route: `unresolved://admin-content`
- Purpose: Tạo, chỉnh sửa, xuất bản, lưu trữ nội dung và quản lý danh mục liên quan.
- Regions: `admin-content-list`, `admin-content-editor`
- Navigation: none

Evidence: `EV-001`

### Quản lý hội viên

- ID: `admin-members`
- Route: `unresolved://admin-members`
- Purpose: Tiếp nhận, xem xét, duyệt hoặc từ chối đăng ký và quản lý hồ sơ công khai.
- Regions: `admin-membership-queue`
- Navigation: none

Evidence: `EV-001`

### Quản lý biểu mẫu

- ID: `admin-submissions`
- Route: `unresolved://admin-submissions`
- Purpose: Xem và xử lý đăng ký, liên hệ hoặc yêu cầu được gửi từ website.
- Regions: `admin-submission-list`
- Navigation: none

Evidence: `EV-001`

### Quản trị hệ thống

- ID: `admin-system`
- Route: `unresolved://admin-system`
- Purpose: Quản lý người dùng, phân quyền, cấu hình website, audit, backup và restore.
- Regions: `admin-user-management`, `admin-site-settings`, `admin-audit-backup`
- Navigation: none

Evidence: `EV-001`

## 5. Business flows

### Khám phá cộng đồng Tây Sơn

Trigger: Khách truy cập mở website công khai

1. **visitor** — Mở trang đầu của website → Thấy nhận diện cộng đồng, điều hướng và nội dung nổi bật
2. **visitor** — Mở nội dung giới thiệu hoặc hoạt động → Đọc nội dung đã được xuất bản
3. **visitor** — Mở danh sách hội viên → Thấy các hồ sơ doanh nghiệp đã được duyệt công khai

Outcomes:
- Khách hiểu cộng đồng, hoạt động và các doanh nghiệp thành viên
- Khách có thể tiếp tục sang đăng ký hội viên hoặc liên hệ

Evidence: `EV-001`

### Đăng ký và duyệt hội viên

Trigger: Người quan tâm muốn tham gia cộng đồng

1. **applicant** — Mở biểu mẫu đăng ký hội viên → Thấy các trường dữ liệu và điều kiện gửi
2. **applicant** — Gửi thông tin hợp lệ → Hệ thống lưu hồ sơ mới và xác nhận đã tiếp nhận
3. **staff** — Kiểm tra hồ sơ mới → Hồ sơ chuyển sang đang xem xét
4. **manager** — Duyệt hoặc từ chối hồ sơ → Hồ sơ có quyết định cuối; hồ sơ được duyệt có thể công khai

Outcomes:
- Đăng ký được lưu và có trạng thái xử lý
- Chỉ hồ sơ được duyệt mới xuất hiện trong danh sách công khai

Evidence: `EV-001`

### Biên tập và xuất bản nội dung

Trigger: Nhân sự cần cập nhật tin tức, hoạt động, sự kiện hoặc trang nội dung

1. **staff** — Đăng nhập CMS → Truy cập đúng chức năng theo vai trò
2. **staff** — Tạo hoặc chỉnh sửa bản nháp → Nội dung được lưu nhưng chưa công khai
3. **manager** — Xuất bản nội dung → Nội dung chuyển sang công khai
4. **visitor** — Mở nội dung đã xuất bản → Đọc nội dung trên website công khai

Outcomes:
- Nội dung công khai chỉ xuất hiện sau khi được xuất bản
- Nội dung cũ có thể được lưu trữ thay vì xóa cứng

Evidence: `EV-001`

### Quản trị website

Trigger: Quản trị viên cần quản lý người dùng hoặc cấu hình hệ thống

1. **administrator** — Đăng nhập CMS → Phiên quản trị được xác thực
2. **administrator** — Thêm, sửa, khóa hoặc phân quyền tài khoản → Tài khoản và quyền truy cập được cập nhật
3. **administrator** — Cập nhật banner, menu, thông tin liên hệ hoặc cấu hình website → Cấu hình mới được lưu và phản ánh trên website
4. **administrator** — Kiểm tra thao tác quản trị thiết yếu → Thấy lịch sử thao tác được ghi nhận

Outcomes:
- Website có thể được quản trị bởi Bên A
- Thao tác quản trị thiết yếu có dấu vết audit

Evidence: `EV-001`

### Gửi và xử lý liên hệ

Trigger: Khách truy cập muốn gửi liên hệ hoặc yêu cầu từ website

1. **visitor** — Mở biểu mẫu liên hệ → Thấy thông tin liên hệ và biểu mẫu
2. **visitor** — Gửi biểu mẫu hợp lệ → Yêu cầu được lưu và xác nhận tiếp nhận
3. **staff** — Mở và xử lý yêu cầu → Yêu cầu có trạng thái xử lý nội bộ

Outcomes:
- Thông tin gửi từ website được lưu trữ
- Nhân sự quản trị có thể theo dõi việc xử lý

Evidence: `EV-001`

## 6. Business rules

### BR-01

CMS có ba vai trò Admin, Manager và Staff; Admin toàn quyền, Manager quản lý nội dung/hội viên/biểu mẫu/cấu hình, Staff biên tập và xử lý biểu mẫu nhưng không quản lý tài khoản.

Strength: **confirmed** · Evidence: `EV-001`

### BR-02

Hồ sơ đăng ký hội viên đi theo new → reviewing → approved hoặc rejected; chỉ approved được hiển thị công khai.

Strength: **confirmed** · Evidence: `EV-001`

### BR-03

Nội dung đi theo draft → published → archived; phiên bản đầu không có scheduling hoặc duyệt nhiều cấp.

Strength: **confirmed** · Evidence: `EV-001`

### BR-04

Dữ liệu nghiệp vụ được xóa mềm để giữ khả năng audit và phục hồi.

Strength: **confirmed** · Evidence: `EV-001`

### BR-05

Phiên bản đầu sử dụng tiếng Việt; đa ngôn ngữ nằm ngoài phạm vi.

Strength: **confirmed** · Evidence: `EV-001`

### BR-06

Không có cổng đăng nhập hoặc dashboard riêng cho hội viên trong phạm vi hiện tại.

Strength: **confirmed** · Evidence: `EV-001`

### BR-07

Mọi chức năng quản trị yêu cầu đăng nhập và kiểm tra quyền theo vai trò.

Strength: **confirmed** · Evidence: `EV-001`

### BR-08

Hệ thống ghi audit cho các thao tác quản trị thiết yếu; tập sự kiện và thời gian lưu chưa được chốt.

Strength: **partial** · Evidence: `EV-001`

### BR-09

Hệ thống hỗ trợ backup định kỳ và restore khi có sự cố; lịch, retention, RPO và RTO chưa được chốt.

Strength: **partial** · Evidence: `EV-001`

### BR-10

Website công khai phải responsive, SEO cơ bản, SSR và tối ưu hiệu năng trên trình duyệt phổ biến.

Strength: **confirmed** · Evidence: `EV-001`

## 7. State model

- **Đăng ký mới** (`membership-new`, initial) → membership-reviewing — `EV-001`
- **Đang xem xét** (`membership-reviewing`, pending) → membership-approved, membership-rejected — `EV-001`
- **Đã duyệt** (`membership-approved`, success) → terminal — `EV-001`
- **Đã từ chối** (`membership-rejected`, error) → terminal — `EV-001`
- **Bản nháp** (`content-draft`, initial) → content-published — `EV-001`
- **Đã xuất bản** (`content-published`, success) → content-archived — `EV-001`
- **Đã lưu trữ** (`content-archived`, partial) → terminal — `EV-001`
- **Yêu cầu mới** (`submission-new`, initial) → submission-processing — `EV-001`
- **Đang xử lý** (`submission-processing`, pending) → submission-completed — `EV-001`
- **Đã xử lý** (`submission-completed`, success) → terminal — `EV-001`

## 8. Entities and data

- **Tài khoản quản trị**: Thông tin tài khoản, Trạng thái hoạt động hoặc bị khóa, Vai trò Admin, Manager hoặc Staff, Dấu thời gian xóa mềm — `EV-001`
- **Đăng ký hội viên**: Dữ liệu biểu mẫu do người đăng ký cung cấp, Trạng thái xử lý, Thời điểm gửi, Dấu thời gian xóa mềm — `EV-001`
- **Hồ sơ hội viên và doanh nghiệp**: Thông tin doanh nghiệp, Trạng thái duyệt, Trạng thái công khai, Dấu thời gian xóa mềm — `EV-001`
- **Nội dung website**: Loại nội dung, Tiêu đề, Nội dung, Trạng thái, Banner hoặc media liên quan, Dấu thời gian xuất bản, Dấu thời gian xóa mềm — `EV-001`
- **Danh mục**: Nhóm ngành nghề hoặc lĩnh vực, Loại nội dung, Thứ tự hiển thị, Trạng thái — `EV-001`
- **Dữ liệu biểu mẫu**: Loại biểu mẫu, Payload người dùng gửi, Trạng thái xử lý, Thời điểm gửi, Dấu thời gian xóa mềm — `EV-001`
- **Cấu hình website**: Thông tin website, Banner, Menu, Thông tin liên hệ, Cấu hình cơ bản — `EV-001`
- **Nhật ký quản trị**: Người thao tác, Hành động, Đối tượng, Thời điểm, Chi tiết cần thiết — `EV-001`
- **Bản sao lưu**: Thời điểm tạo, Trạng thái, Vị trí lưu trữ, Kết quả restore nếu có — `EV-001`

## 9. Operations and APIs

- **Đọc nội dung công khai** (query, backend) — input: Loại nội dung, Định danh nội dung; output: Nội dung đã xuất bản; failures: Không tìm thấy, Nội dung chưa công khai — `EV-001`
- **Đọc hội viên công khai** (query, backend) — input: Phân trang hoặc định danh; output: Hồ sơ hội viên đã duyệt và công khai; failures: Không tìm thấy — `EV-001`
- **Gửi đăng ký hội viên** (mutation, backend) — input: Dữ liệu biểu mẫu đăng ký; output: Đăng ký trạng thái new, Xác nhận tiếp nhận; failures: Dữ liệu không hợp lệ, Không thể lưu — `EV-001`
- **Gửi biểu mẫu liên hệ** (mutation, backend) — input: Dữ liệu liên hệ hoặc yêu cầu; output: Biểu mẫu trạng thái new, Xác nhận tiếp nhận; failures: Dữ liệu không hợp lệ, Không thể lưu — `EV-001`
- **Đăng nhập quản trị** (mutation, backend) — input: Thông tin đăng nhập; output: Phiên xác thực và quyền; failures: Sai thông tin, Tài khoản bị khóa, Không đủ quyền — `EV-001`
- **Đăng xuất quản trị** (mutation, backend) — input: Phiên hiện tại; output: Phiên bị kết thúc; failures: Phiên không hợp lệ — `EV-001`
- **Quản lý tài khoản và phân quyền** (command, backend) — input: Thông tin tài khoản, Vai trò, Trạng thái khóa; output: Tài khoản đã cập nhật, Audit entry; failures: Không đủ quyền, Dữ liệu không hợp lệ, Xung đột tài khoản — `EV-001`
- **Quản lý và xuất bản nội dung** (command, backend) — input: Nội dung, Danh mục, Trạng thái; output: Nội dung đã cập nhật, Audit entry; failures: Không đủ quyền, Dữ liệu không hợp lệ, Không tìm thấy — `EV-001`
- **Xử lý đăng ký hội viên** (command, backend) — input: Định danh đăng ký, Quyết định; output: Trạng thái đăng ký, Hồ sơ công khai nếu approved, Audit entry; failures: Không đủ quyền, Chuyển trạng thái không hợp lệ, Không tìm thấy — `EV-001`
- **Cập nhật cấu hình website** (command, backend) — input: Banner, Menu, Thông tin liên hệ, Cấu hình cơ bản; output: Cấu hình đã cập nhật, Audit entry; failures: Không đủ quyền, Dữ liệu không hợp lệ — `EV-001`
- **Tạo backup** (command, provider) — input: Phạm vi backup; output: Backup record; failures: Lưu trữ không khả dụng, Backup thất bại — `EV-001`
- **Khôi phục dữ liệu** (command, provider) — input: Định danh backup; output: Kết quả restore; failures: Backup không hợp lệ, Restore thất bại — `EV-001`

## 10. Acceptance conditions

- **AC-01** Website công khai hiển thị tốt trên desktop, laptop và thiết bị di động, có SEO cơ bản, SSR và hiệu năng tải trang phù hợp. — `EV-001`
- **AC-02** Khách truy cập xem được giới thiệu, thông tin cộng đồng, điều lệ, ban chủ nhiệm, hội viên, doanh nghiệp, tin tức, hoạt động, sự kiện và các chuyên mục đã xuất bản. — `EV-001`
- **AC-03** Người đăng ký gửi được biểu mẫu hội viên; hệ thống lưu hồ sơ ở trạng thái new và chỉ công khai hồ sơ approved. — `EV-001`
- **AC-04** Khách gửi được biểu mẫu liên hệ hoặc yêu cầu và nhân sự quản trị theo dõi được trạng thái xử lý. — `EV-001`
- **AC-05** CMS hỗ trợ đăng nhập, đăng xuất, thêm/sửa/xóa mềm/khóa tài khoản và phân quyền Admin, Manager, Staff. — `EV-001`
- **AC-06** CMS quản lý được bài viết, tin tức, hoạt động, sự kiện, banner, menu, danh mục, hội viên, biểu mẫu và cấu hình website. — `EV-001`
- **AC-07** API cung cấp đầy đủ giao tiếp giữa website công khai, CMS và backend với kiểm tra quyền phù hợp. — `EV-001`
- **AC-08** Các thao tác quản trị thiết yếu tạo audit entry và dữ liệu nghiệp vụ sử dụng xóa mềm. — `EV-001`
- **AC-09** Hệ thống có thể tạo backup định kỳ và thực hiện restore khi có sự cố. — `EV-001`
- **AC-10** Bên A nhận quyền quản trị để chủ động đăng nhập và chỉnh sửa thông tin trong phạm vi CMS. — `EV-001`
- **AC-11** Phiên bản đầu vận hành bằng tiếng Việt và không cung cấp cổng đăng nhập riêng cho hội viên. — `EV-001`

## 11. Explicit unknowns

- **Logo, màu thương hiệu, font, hình ảnh và nội dung khởi tạo chính thức là gì?** — Chặn khóa visual identity và dữ liệu production của website công khai.
- **Route URL chính xác cho từng trang công khai và module CMS là gì?** — Chặn page map cuối cùng của giai đoạn thiết kế; business surfaces hiện dùng unresolved route identities.
- **Biểu mẫu đăng ký và hồ sơ doanh nghiệp gồm những trường nào, trường nào được công khai?** — Chặn schema cuối cùng, validation, privacy và giao diện form/detail.
- **Mỗi loại nội dung yêu cầu trường, media, taxonomy và bố cục chi tiết nào?** — Chặn schema nội dung và editor cuối cùng.
- **Cơ chế đặt lại mật khẩu, mời tài khoản, 2FA và thời hạn phiên được yêu cầu ra sao?** — Chặn hoàn thiện security flow của CMS.
- **Có cần gửi email hoặc thông báo khi tiếp nhận, duyệt hoặc từ chối đăng ký/liên hệ không?** — Quyết định provider, template và event flow.
- **Giới hạn loại tệp, dung lượng, lưu trữ và xử lý ảnh/media là gì?** — Chặn upload contract và storage implementation.
- **Những thao tác nào bắt buộc audit và thời gian lưu audit bao lâu?** — Chặn tập sự kiện và retention chính xác.
- **Tần suất backup, retention, vị trí lưu, RPO và RTO là gì?** — Chặn cấu hình vận hành và acceptance test restore.
- **Tên miền, hosting/VPS, DNS, SSL và credential authority do ai cung cấp?** — Chặn deploy/go-live nhưng không chặn code local.
- **Danh sách trình duyệt và phiên bản phải hỗ trợ cụ thể là gì?** — Chặn browser acceptance matrix cuối cùng.
- **Nội dung đồng ý xử lý dữ liệu cá nhân, chống spam và thời hạn lưu biểu mẫu là gì?** — Chặn privacy copy, consent field và retention.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | owner | `decision:385cfe6dd712eff610dbefaf8060661780d51183c7c9bfe18b5c148ca750bdf1` | owner-decision | Owner cung cấp hợp đồng/phụ lục Tây Sơn có SHA-256 b7c71e5034ee8f2d2a79fb0ba42be16a93c91f27ded43fb18e75b8caf92ab973 và chấp thuận scope cùng các mặc định business được hiển thị trước khi publish pending. |
