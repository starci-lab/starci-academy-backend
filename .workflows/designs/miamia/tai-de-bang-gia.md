<!-- starci-workflow: v2 -->

# Tải đề và bảng giá tổng thể MiaMia

## discovery layer-r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | D:\Repositories\miamia-fe @ main |
| Purpose | Xác định composition cho trang tải đề và bảng giá tổng thể gồm ba gói, PayOS và quyền lợi quảng bá thương hiệu trên MiaMia. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tai-de-bang-gia.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow record này; chưa sửa source FE/BE và chưa tạo preview. |

### EVIDENCE

| Layer | Câu hỏi | Kết luận | Bằng chứng / lý do |
|---|---|---|---|
| LAYER-2 | Người dùng cần mang theo điều gì khi ra quyết định? | Mang theo commitment đang được quyết định: số đề, quyền sử dụng, hỗ trợ, giá, thời hạn và quyền lợi quảng bá thương hiệu. Không cần identity rail cá nhân trên trang giá công khai. | Ba lựa chọn đều là entitlement thương mại rõ ràng, không phụ thuộc tiến độ học của một tài khoản cụ thể. |
| LAYER-3 | Đây là một công việc có thứ tự hay nhiều mode ngang hàng? | Một công việc có thứ tự: hiểu kho đề → so sánh quyền lợi → chọn gói → thanh toán/liên hệ. Ba gói là ba phương án của cùng một quyết định, không phải ba mode điều hướng ngang hàng. | Người mua cần so sánh cùng một bảng quyền lợi trước khi commit. |
| LAYER-4 | Trạng thái lựa chọn có đáng để gửi cho người khác bằng URL không? | **Chưa xác định — dừng tại đây.** | Yêu cầu chưa nói lựa chọn gói phải nằm trong URL để chia sẻ/deep-link hay chỉ tồn tại cục bộ trong checkout overlay. Quyết định này chi phối route, query contract, PayOS return URL và CTA quảng bá thương hiệu. |

### OUTPUTS

| Concept | Result |
|---|---|
| Product ladder | Cá nhân 50 đề → Cá nhân 100 đề + hỗ trợ → Thương mại Unlimited trọn đời. |
| Giá đang chốt | `99.000đ` → `249.000đ` → `12.900.000đ`. |
| Commercial promise | Dùng nội bộ cho lớp/trung tâm; hỗ trợ trọn đời; nhận tài liệu mới; vào nhóm Zalo; được quảng bá thương hiệu trên MiaMia. |
| Exclusion | Không gồm white-label, không bán lại dữ liệu/kho đề và không chuyển quyền sở hữu nội dung. |
| Derived archetype | Có xu hướng `decide-and-detail`, nhưng chưa khóa cho đến khi trả lời LAYER-4. |

### CHANGES

| Tree | Details |
|---|---|
| Workflow record | Thêm Layer Plan r1; chưa thay đổi source FE/BE. |

```text
D:\Repositories\starci-academy-backend\.workflows
└── designs
    └── miamia
        └── tai-de-bang-gia.md  [added: layer plan r1]
```

### NEED APPROVALS

| Question | Options |
|---|---|
| Cách giữ gói đã chọn | **A — Trang công khai `/pricing?plan=personal-50|personal-100|commercial` (khuyến nghị):** gửi thẳng gói cho khách hàng/trung tâm, giữ lựa chọn sau PayOS và đo chiến dịch. **B — Trang `/pricing`, lựa chọn chỉ giữ cục bộ trong checkout overlay:** URL gọn hơn nhưng khó chia sẻ và khôi phục checkout. |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend hiện chỉ có một membership product và request `purchaseMembership` chưa nhận package/plan ID. | Chưa thể bán đúng ba gói bằng runtime hiện tại; cần Backend Feature Plan riêng sau khi khóa thiết kế. |
| Quyền lợi “quảng bá thương hiệu trên MiaMia” chưa có contract về vị trí, thời hạn, kiểm duyệt asset và báo cáo lượt hiển thị. | Design có thể mô tả benefit, nhưng Apply không được giả lập capability vận hành chưa tồn tại. |
| Kho `100.000+ đề` là tuyên bố quy mô tương lai/chào bán. | Cần tách rõ số lượng đang live và entitlement tương lai để tránh CTA gây hiểu nhầm. |
| Gói thương mại không bao gồm white-label. | Khách hàng vẫn xuất hiện dưới sản phẩm MiaMia; chỉ thương hiệu của họ được quảng bá tại vị trí đã thỏa thuận. |
| Validator của workflow designs yêu cầu preview và direction tabs, trong khi Layer Plan bắt buộc dừng trước preview tại LAYER-4. | Record tạm thời còn đúng hai lỗi deferred; Design Plan sẽ xóa nợ này sau khi thầy duyệt A/B. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Không có | Không có | Chưa bác thêm hướng nào trong revision này. |

### OWED

| Owed | Cleared by |
|---|---|
| Hoàn tất LAYER-4 đến LAYER-7 và khóa page archetype. | Thầy duyệt A hoặc B. |
| Khóa phạm vi hiển thị quảng bá thương hiệu: vị trí, thời hạn, asset approval và metrics. | Design Plan/Review tiếp theo. |
| Render một HTML nhiều tab với 2–4 phương án khả thi. | `starci-fe-design-plan` sau khi Layer Plan hoàn tất. |
| Thiết kế contract ba SKU, quota tải, license thương mại và ad entitlement. | Backend Feature Plan/Review riêng. |

## plan r2

Proposed revision: `tai-de-bang-gia-plan-r2`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | D:\Repositories\miamia-fe @ main |
| Database | Primary PostgreSQL; MinIO cho exam asset |
| Purpose | Cập nhật bảng giá theo offer đã chốt, phân biệt subscription với download license và khóa checkout-return hierarchy. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tai-de-bang-gia.md |
| Language | vi |
| Phase | plan |
| Touching | Workflow này và D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\tai-de-bang-gia\r2\index.html; không sửa production source. |

### MODE VÀ BRIEF

| Claim | Kết luận |
|---|---|
| Mode | Creative — offer và reliability contract mới đã thay đổi product story; không có named legacy screen phải preserve. |
| Page thesis | Trang giúp người học, giáo viên hoặc trung tâm chọn đúng quyền học hay quyền dùng tài liệu bằng cách làm rõ loại quyền, giá và giới hạn bán lại trước CTA. |
| Primary action | Chọn một offer đúng nhu cầu tại lúc đã hiểu subscription khác license trọn đời. |
| Secondary action | White-label mở tư vấn; chưa được giả thành checkout tự động. |
| Anti-goal | Không trộn 49k/tháng với quyền sở hữu file; không hứa quyền bán lại; không coi webhook là payment truth; không ghi số đề live giả. |

### PRODUCT EVIDENCE

| Claim | Best-belief source | Consequence |
|---|---|---|
| MiaMia Pro là 49.000đ/tháng | User decision + `.stacks/dev/runtime/files/app.yaml` membership `priceVnd: 49000`. | Offer recurring đứng riêng, CTA dùng `purchaseMembership`. |
| Cá nhân là 249.000đ trọn đời | User decision + app config `examDownloads.packages.personal.priceVnd: 249000`. | Tải không giới hạn, cập nhật liên tục, Zalo; không có commercial teaching. |
| Thương mại là 4.999.000đ trọn đời | User decision + app config `commercial.priceVnd: 4999000`. | Dùng nội bộ để dạy, không bán lại, quảng bá thương hiệu 12 tháng. |
| White-label là liên hệ | User decision; backend chưa có SKU/checkout/lead contract. | Hiển thị tư vấn như separate offer, không gọi payment mutation. |
| Return status | Approved `myPaymentStatus` live schema + payment E2E. | Poll persisted owner transaction bằng exact-one ID/reference; Pending không tự thành success. |
| Payment truth | Approved reliability r2. | Webhook chỉ đánh thức; provider API/finalizer sở hữu terminal state và entitlement. |
| MiaMia visual grammar | `src/app/globals.css` + contract registry + `MiaMiaAppLayout`. | Reuse Sticker Study surface/button, desktop sidebar và mobile footbar; không fork shared StarCi pattern. |

### INVENTORY

| Candidate | Verdict | Reason |
|---|---|---|
| `MiaMiaAppLayout` / `learn-shell-frame` | REUSE | Đã sở hữu sidebar desktop và footbar mobile. |
| `page-header-stack` | REUSE | Đúng title hierarchy của route. |
| `premium-value-band` | EXTEND hoặc REUSE theo direction | Có value + CTA nhưng chưa diễn đạt nhiều offer/licensing peers. |
| `membership-checkout-panel` | EXTEND | Mutation Pro đã live; cần amount/period và return handoff rõ. |
| Exam download checkout FE | NEW | Backend có `purchaseExamDownloadPackage`, FE chưa có mutation/hook/panel. |
| Payment status FE | NEW | Backend vừa có `myPaymentStatus`; FE chưa có query/poll owner. |
| Pricing page graph | NEW | Không có route/page/block cho tổng offer ladder. |
| Global CSS | REUSE | Identity đã đúng MiaMia; Plan không đề xuất component-local product CSS. |

### INTERACTION CONSEQUENCE

| Interaction | Trigger | Product owner | Request / route | Visual states | Pending | Success | Failure | Persistence / shared effect | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| Chọn Pro | Press CTA 49k | Membership checkout | `purchaseMembership` rồi provider redirect | signed-out, ready, submitting, failed | Khóa double-submit; giữ overlay | Redirect; return poll tới Succeeded rồi mở quyền Pro | Giữ offer và retry | Transaction ID + reference ID phục hồi return | Existing FE checkout + backend mutation/status live. |
| Mua Cá nhân/Thương mại | Press license CTA | Exam download checkout | `purchaseExamDownloadPackage(packageId)` | signed-out, ready, submitting, failed | Khóa offer đang gửi | Redirect; Succeeded mở entitlement và CTA tải | Giữ package, retry | Package nằm trên transaction/entitlement | Backend CQRS, PayOS E2E và MinIO presign flow. |
| Return từ provider | Route có transaction/reference | Payment return owner | `myPaymentStatus` poll | pending, succeeded, unpaid, failed, cancelled | Hiển thị “đang xác nhận”, không cấp quyền client-side | CTA “Vào Pro” hoặc “Tải đề” | Retry checkout hoặc về pricing | Server transaction/entitlement là authority | `payment-status-review-r1` + live proof. |
| White-label | Press “Liên hệ” | Chưa có owner | Proposed contact route/lead | ready only trong preview | N/A | Chưa có capability | Không được ship CTA chết | Không có persistence hiện tại | User intent; backend/FE search không có lead contract phù hợp. |
| Chọn offer qua URL | Press card/CTA hoặc shared link | Pricing route | Proposed `/pricing?offer=pro|personal|commercial|white-label` | selected/default/invalid fallback | N/A | Giữ offer qua sign-in và provider return | Invalid value về default an toàn | Share/deep-link và attribution | LAYER-4 cũ còn nợ; return flow mới làm URL state hữu ích hơn. |

### DIRECTIONS

| Direction | Product hypothesis | Reading order |
|---|---|---|
| A · Hai nhu cầu | Vì subscription và license tạo hai quyền khác nhau, giải thích nhu cầu trước rồi mới cho so sánh offer để tránh mua nhầm. | Pro vs tải file → 3 license offer → return states. |
| B · So sánh trước | Vì người mua đã biết mình cần giá, matrix dẫn đầu để giảm thời gian đối chiếu quyền lợi. | Comparison matrix → license explanation → return states. |
| C · Kho đề dẫn đầu | Vì trọng tâm thương mại là kho đề và hỗ trợ, giá trị tài liệu dẫn đầu; Pro là lối phụ cho người không cần file. | Kho đề promise → Personal/Commercial → sticky Pro/White-label rail. |

### PREVIEW

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `tai-de-bang-gia-r2` | http://127.0.0.1:8081/ | D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\tai-de-bang-gia\r2\index.html | FCFE8A75A6649A50C853F1552695494CCA43401522F3F0EBAFA860F3FB74B350 | đang chờ |

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\tai-de-bang-gia\r2`

Preview PID: `31656`

Preview port: `8081`

| Direction | Tab | Status |
|---|---|---|
| `A-two-jobs` | `A · Hai nhu cầu` | đang chờ |
| `B-compare-first` | `B · So sánh trước` | đang chờ |
| `C-library-led` | `C · Kho đề dẫn đầu` | đang chờ |

### RESPONSIVE PROOF

| Check | Result |
|---|---|
| Three directions | PASS — client-side tab switch, cùng URL, không reload file khác. |
| Mobile 390x844 | PASS — sidebar ẩn, footbar hiện, `scrollWidth = clientWidth = 375`. |
| Preview console | Không có warning/error từ URL preview; các warning còn lưu trong browser đến từ runtime `localhost:3070`, không thuộc artifact này. |

### OUTPUTS

| Concept | Result |
|---|---|
| Offer model r2 | Pro 49k/tháng; Cá nhân 249k; Thương mại 4.999m; White-label liên hệ. |
| Reliability model | Checkout tạo intent; return chỉ poll persisted status; provider/finalizer quyết định terminal state. |
| Direction set | Ba hierarchy khác nhau thật sự: tách nhu cầu, so sánh trước, hoặc kho đề dẫn đầu. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/miamia/tai-de-bang-gia.md` | `modified` — append Plan r2, evidence, interaction consequences và proposal tracking. |
| `.workflows/.previews/designs/miamia/tai-de-bang-gia/r2/index.html` | `added` — một HTML, ba tab, responsive sidebar/footbar và checkout-return states. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn hierarchy production | **A (đề xuất):** Hai nhu cầu — phân biệt rõ Pro và giấy phép trước khi bán. **B:** comparison matrix dẫn đầu. **C:** kho đề thương mại dẫn đầu, Pro thành rail phụ. |
| Giữ offer trong URL | **A (đề xuất):** `/pricing?offer=...` để giữ lựa chọn qua sign-in/return và chia sẻ. **B:** chỉ state cục bộ, URL `/pricing`. |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend chưa expose public pricing catalog query. | FE không nên hardcode giá lâu dài; cần Backend Feature nhỏ đọc server-owned catalog trước Apply production. |
| “100.000 đề” chưa tương ứng số asset live đã seed/MinIO. | Copy production phải phân biệt quy mô roadmap/catalog với số file hiện có, không quảng cáo như inventory live đã đủ. |
| White-label chưa có contact destination, lead persistence hay quote workflow. | Review phải khóa CTA outcome hoặc giữ clearly unavailable; không ship nút chết. |
| Commercial promotion hiện là 12 tháng trong backend, không phải “trọn đời”. | Pricing phải ghi rõ quảng bá 12 tháng dù license dùng tài liệu là trọn đời. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Personal 50 / Personal 100 / Commercial 12.9m của Plan r1 | Personal unlimited 249k / Commercial 4.999m | User đã chốt lại offer và giá sau Plan r1. |
| Loại White-label khỏi ladder | White-label “Liên hệ” | User yêu cầu giữ lựa chọn sở hữu hệ thống/nhận diện riêng nhưng chưa định giá. |
| Trộn Pro với download license như cùng entitlement | Tách recurring learning access và lifetime document license | Business contracts và quyền sử dụng khác nhau. |

### OWED

| Owed | Cleared by |
|---|---|
| Chọn một direction và URL-state option. | Thầy trả lời ví dụ `A/A`. |
| Khóa exact component tree, props, route states và CTA owner. | `starci-fe-design-review` sau lựa chọn. |
| Expose server-owned pricing catalog và white-label contact outcome nếu chọn ship CTA. | Backend Feature Plan/Review riêng trước FE Apply. |

### PLAN SELECTION r2

| Decision | Selected | Evidence | Status |
|---|---|---|---|
| Production hierarchy | `A-two-jobs` — Hai nhu cầu | Thầy trả lời `tiep tuc` sau khi trò đề xuất mặc định `A/A`; lựa chọn này giữ subscription học tập và license tải file thành hai commitment riêng. | selected |
| URL state | `/pricing?offer=pro|personal|commercial|white-label` | Cùng câu trả lời tiếp tục phương án mặc định; URL phải giữ offer qua sign-in, PayOS return và deep-link. | selected |
| `B-compare-first` | Không chọn | Matrix dẫn đầu làm loại quyền trở thành chi tiết dù đây là nguyên nhân mua nhầm chính. | rejected |
| `C-library-led` | Không chọn | Kho đề dẫn đầu hạ Pro thành rail phụ và làm yếu thesis “hai nhu cầu”. | rejected |

## review r1

Proposed revision: `tai-de-bang-gia-review-r1`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | D:\Repositories\miamia-fe @ main |
| Purpose | Khóa phương án A/A cho trang bảng giá và tải đề, gồm cây component, props, trạng thái thanh toán và boundary backend. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tai-de-bang-gia.md |
| Language | vi |
| Phase | review |
| Touching | Workflow này và bằng chứng source chỉ đọc; không sửa source FE/BE. |

### REVIEW VERDICT

| Claim | Verdict | Repair / frozen meaning | Evidence |
|---|---|---|---|
| A · Hai nhu cầu là hierarchy production | KEEP | Trang mở bằng phân biệt `Pro học trên app` với `License tải tài liệu`, sau đó mới so sánh Personal, Commercial và White-label. | Subscription 49k/tháng và license trọn đời có action type, entitlement và mutation khác nhau. |
| Giá viết trực tiếp trong FE | REJECT | FE chỉ hiển thị giá/benefit từ public server-owned pricing catalog. | Live schema 3071 có `purchaseMembership`, `purchaseExamDownloadPackage`, `myPaymentStatus`, `myExamDownloadEntitlement` nhưng không có pricing/package catalog query. |
| White-label có nút `Liên hệ` | REVISE | Hiển thị card thông tin với trạng thái `Liên hệ sau`, không press target, đến khi có contact/lead owner riêng. | Không có `/contact` route MiaMia, lead mutation hay destination Zalo/email được cấu hình. |
| Tin query params PayOS là payment truth | REJECT | `orderCode` chỉ là lookup key; `myPaymentStatus(referenceId)` mới quyết định trạng thái hiển thị. | Approved payment reliability: webhook chỉ đánh thức, provider/finalizer và persisted transaction sở hữu terminal state. |
| Một checkout panel dùng chung cả hai sản phẩm | REJECT | Hai connected block riêng; dùng chung contract shape `purchase-checkout-panel`, leaves và ModalShell. | Request, copy, entitlement và success path khác nhau; arrangement giống nhau không biến domain thành một block. |

### INTERACTION CONSEQUENCE

| Interaction | Trigger | Product owner | Visual state | Pending | Success | Failure | Persistence / shared effect | Evidence claim |
|---|---|---|---|---|---|---|---|---|
| Chọn offer | Press card CTA hoặc mở deep-link | `PricingOfferCatalog` + pricing route | default, selected, invalid-fallback, signed-out | N/A | URL trở thành `/pricing?offer=<id>` | Offer lạ fallback `pro`, không tạo checkout | Query param sống qua sign-in và share | Route owner đọc finite union, không nhận wildcard. |
| Mua Pro | Press `Đăng ký Pro 49k/tháng` | `MembershipCheckoutOverlay` / `MembershipCheckoutPanel` | idle, submitting, failed | Khóa CTA và giữ offer | Redirect PayOS với return/cancel về cùng pricing route | Giữ overlay, copy lỗi và retry | Transaction nằm server; URL chỉ giữ offer | Existing mutation + `submitCheckout`; giá đến catalog query. |
| Mua Personal/Commercial | Press CTA package | `ExamDownloadCheckoutOverlay` / `ExamDownloadCheckoutPanel` | idle, submitting, failed | Khóa đúng package, không double-submit | Redirect PayOS | Giữ package, copy lỗi và retry | `packageId` persisted trên transaction/entitlement | Live mutation `purchaseExamDownloadPackage`. |
| Trở về từ PayOS | URL có `return=1&orderCode=<reference>` | `PaymentReturnStatus` | pending, succeeded, cancelled, failed, unpaid | Poll 2 giây, tối đa 15 lần; có manual retry; không tự success | Theo `purchaseKind`: Pro → `/exam`; download → tải đề/kho đề | Terminal copy riêng; không cấp quyền client-side | `orderCode` chỉ lookup; persisted response là authority | Live `myPaymentStatus` trả status, purchaseKind, package và amount. |
| Đăng nhập giữa checkout | CTA khi chưa có token | `PricingPage` + `SignInOverlay` | signed-out → authenticating → resumed | Một deferred offer, không mở hai overlay | Token có thì mở đúng checkout | Dismiss giữ URL offer và không mua | Offer ở URL, không giữ bằng biến mất khi reload | Pattern đang dùng tại `ExamCatalogPage`. |
| White-label | Không có trigger trong r1 | `PricingOfferCatalog` | informational only | N/A | N/A | N/A | Không tạo lead giả | Chưa có route, destination hoặc mutation owner. |

### OWNER CHALLENGE

| Proposed owner | Layer | Purpose | Closest existing owners / contracts | REUSE verdict | ALTER verdict | Layer proof | Decision | Evidence |
|---|---|---|---|---|---|---|---|---|
| `PricingOfferCatalog` | block | Đọc catalog giá server-owned, diễn đạt hai nhu cầu và phát intent mua đúng offer. | `ExamCatalog`, `CoursePricingRail`, `premium-value-band` | Không owner nào biết cả subscription lẫn download license. | Mở rộng các owner trên sẽ trộn domain exam/course với pricing tổng thể. | Có request, copy, loading/failed/ready, selected offer và connected/pure twin riêng. | ADD | Search toàn `src/components`, `src/hooks`, GraphQL FE; chưa có pricing route/block/query. |
| `PaymentReturnStatus` | block | Poll persisted payment và giải thích outcome theo purchase kind. | `MembershipCheckoutPanel`, `EmptyNotice` | Panel chỉ tạo checkout; composite chỉ vẽ notice và không fetch. | Thêm polling vào checkout panel làm owner khởi tạo transaction sở hữu cả return route. | Có request, state union và recovery/continue action riêng. | ADD | Live `myPaymentStatus`; FE chưa có query/hook/call site. |
| `ExamDownloadCheckoutPanel` | block | Tạo checkout Personal/Commercial và mô tả license được chọn. | `MembershipCheckoutPanel` | Không thể reuse connected block vì mutation, request và entitlement khác. | Đổi membership block thành generic sẽ làm tên/copy/request không còn một domain sentence. | Distinct mutation, package union, success consequence và connected/pure twin. | KEEP_APART + ADD | Live `purchaseExamDownloadPackage`; FE chưa có mutation/hook/panel. |

### VISUAL JOB

| Visual element | Owner / state | Recognition, grouping or interaction job | Existing reference | Verdict | Evidence |
|---|---|---|---|---|---|
| Hai surface nhóm `Học trên app` và `Tải tài liệu` | `PricingOfferCatalog`, mọi state | Ngăn người đọc hiểu subscription và license là cùng một quyền. | `SurfaceCard` + MiaMia global surface tokens | KEEP | Bỏ grouping làm 49k và 249k/4.999m thành ba mức của cùng product. |
| Badge `Theo tháng`, `Trọn đời`, `Dạy học` | Offer cards, ready/loading | Nhận diện thời hạn và phạm vi license trước khi đọc benefit. | Existing `Badge` leaf | KEEP | Ba nhãn ánh xạ trực tiếp contract server, không phải trang trí. |
| Selected paint trên offer card | default, hover/focus, selected, selected-hover/focus | Cho biết offer đang nằm trong URL và sẽ được checkout. | Existing accent treatment; không thêm token mới | KEEP | State phải đồng bộ query param; focus không được mất khi selected. |
| Status surface | pending/succeeded/cancelled/failed/unpaid | Tách kết quả thanh toán khỏi offer catalogue và giữ một recovery path. | `SurfaceCard` + `EmptyNotice` | KEEP | Mỗi terminal state có consequence khác nhau; pending giữ geometry và không giả success. |
| White-label muted card | ready | Nhận diện đây là future assisted sale, không phải checkout live. | Existing neutral surface + Badge | KEEP | Không có button hoặc selected paint vì chưa có trigger owner. |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | Pricing route | ADD | N/A | `src/app/[lang]/(app)/pricing/page.tsx` | Next route only → `PricingPage` | N/A | Mount `/pricing`; route không fetch/draw. |
| page | `PricingPage` connected/pure | ADD | N/A | `src/components/pages/PricingPage/index.tsx`, `component.tsx` | Pricing route; composes catalogue, return status and overlays | `routed-page-main`, `pricing-page-stack` | Own finite query state, deferred sign-in intent and screen-level return situation. |
| layout | `MiaMiaAppLayout` | REUSE | `src/components/layouts/MiaMiaAppLayout/index.tsx`, `component.tsx` | same | `(app)/layout.tsx` | `learn-shell-frame` | Existing desktop sidebar/mobile footbar remains route-stable. |
| block | `PricingOfferCatalog` connected/pure | ADD | N/A | `src/components/blocks/payment/PricingOfferCatalog/index.tsx`, `component.tsx` | `PricingPage` | `pricing-offer-catalog`, `pricing-offer-card`, `pricing-license-grid` | Own server catalog, two-job copy and offer intents. |
| block | `PaymentReturnStatus` connected/pure | ADD | N/A | `src/components/blocks/payment/PaymentReturnStatus/index.tsx`, `component.tsx` | `PricingPage` when `return=1` and valid `orderCode` | `payment-return-status` | Own bounded poll and persisted status family. |
| block | `MembershipCheckoutPanel` | MODIFY | `src/components/blocks/membership/MembershipCheckoutPanel/index.tsx`, `component.tsx` | same | `MembershipCheckoutOverlay` | `purchase-checkout-panel` (renamed from `membership-checkout-panel`) | Show server amount/period and receive explicit return/cancel URL. |
| block | `ExamDownloadCheckoutPanel` connected/pure | ADD | N/A | `src/components/blocks/payment/ExamDownloadCheckoutPanel/index.tsx`, `component.tsx` | `ExamDownloadCheckoutOverlay` | `purchase-checkout-panel` | Own package mutation and license copy without duplicating arrangement. |
| overlay | `MembershipCheckoutOverlay` | MODIFY | `src/components/overlays/membership/MembershipCheckoutOverlay/index.tsx`, `component.tsx` | same | Existing `ExamCatalogPage`; new `PricingPage` | `ModalShell` | Preserve old caller while accepting explicit return/cancel URLs for pricing. |
| overlay | `ExamDownloadCheckoutOverlay` | ADD | N/A | `src/components/overlays/payment/ExamDownloadCheckoutOverlay/index.tsx`, `component.tsx` | `PricingPage` | `ModalShell` | Domain overlay for package checkout; reports dismissed outcome only. |
| branch | `Tree`, `SurfaceCard` | REUSE | `src/components/branches/Tree/index.tsx`, `SurfaceCard/index.tsx` | same | New pure blocks | New named contract keys | Existing typed host and surface mechanics are sufficient. |
| composite | `EmptyNotice` | REUSE | `src/components/composites/EmptyNotice/index.tsx` | same | Failed/terminal status rows | `empty-notice` | Existing closed message/action shape is sufficient. |
| leaf | `Heading`, `Text`, `Badge`, `Button` | REUSE | `src/components/leaves/Heading/index.tsx`, `src/components/leaves/Text/index.tsx`, `src/components/leaves/Badge/index.tsx`, `src/components/leaves/Button/index.tsx` | same | New blocks/panels | Existing leaf identities | No new primitive or vendor boundary needed. |
| shell | `ModalShell` | REUSE | `src/components/shells/ModalShell/index.tsx` | same | Both checkout overlays | N/A | Existing focus, escape, backdrop and return-focus mechanics. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| Pricing route | page mount | ADD | N/A | no public props; mounts `PricingPage` | Next route only | Route mounts exact page only. |
| `PricingPage` connected/pure | connected and pure APIs | ADD | N/A | connected page has no public props; pure twin receives catalog, optional return status and connected overlay slots | Pricing route and `PricingPage/index.tsx` | Pure page test binds normal and return reading order. |
| `PricingOfferCatalog` connected/pure | state, data and actions | ADD | N/A | `selectedOffer`; `loading | failed | ready`; server offers; actions `select`, `purchase`, `retry` keyed by finite ID | `PricingPage/index.tsx` and connected twin | Search proves no prior caller; tests cover finite IDs and selected-state family. |
| `PaymentReturnStatus` connected/pure | reference, state, data and actions | ADD | N/A | `referenceId`; `pending | succeeded | cancelled | failed | unpaid`; persisted purchase data; `retry`, `continue` | `PricingPage/index.tsx` and connected twin | Tests prove no terminal state is derived from URL params. |
| `MembershipCheckoutPanel` | `returnUrl`, `cancelUrl` | ADD | only `onDismiss` | required URLs plus existing dismiss | `MembershipCheckoutOverlay` | Existing direct call search finds overlay as sole producer. |
| `MembershipCheckoutPanel` | state/data | RETYPE | `idle | submitting | failed`; no amount/period | `loading | idle | submitting | failed`; server amount + period label | Connected twin | Update existing component test; no literal amount accepted from page. |
| `MembershipCheckoutOverlay` | return/cancel API | ADD | `isOpen`, `onDismiss` | keep existing; add optional `returnUrl`, `cancelUrl` with current URL fallback for legacy Exam caller | `ExamCatalogPage`, `PricingPage` | Both call sites named; default preserves existing behavior. |
| `ExamDownloadCheckoutPanel` connected/pure | connected/pure API | ADD | N/A | `packageId`, `returnUrl`, `cancelUrl`, `onDismiss`; pure state/data/actions analogous but package-specific | New overlay only | Mutation document and component tests bind package union. |
| `ExamDownloadCheckoutOverlay` | public API | ADD | N/A | `isOpen`, `packageId`, `returnUrl`, `cancelUrl`, `onDismiss` | `PricingPage` only | Search after Apply must show one producer. |
| Contract registry | key set | RENAME | `membership-checkout-panel` | `purchase-checkout-panel`; all old producers migrated | Membership panel + new download panel | `rg` proves zero old key; contract/type tests prove both consumers. |
| Contract registry | pricing/status keys | ADD | N/A | `pricing-page-stack`, `pricing-offer-catalog`, `pricing-license-grid`, `pricing-offer-card`, `payment-return-status` | New page/blocks only | Every key has at least one render in same diff; no dead key. |

### SUPPORTING PRODUCTION BOUNDARY

| Tree | Frozen change |
|---|---|
| `src/components/contracts/index.ts` | Rename checkout key and add only five pricing/status arrangements above. |
| `src/modules/api/graphql/queries/query-miamia-pricing-catalog.ts` + `types/miamia-pricing.ts` + tests | Consume new public backend catalog; no price literals in page/block. |
| `src/hooks/swr/useQueryMiaMiaPricingCatalogSwr.ts` | Public catalog cache owner. |
| `src/modules/api/graphql/mutations/mutation-purchase-exam-download-package.ts` + types + tests | Exact live mutation fields including transaction/reference/package/amount. |
| `src/hooks/swr/useMutatePurchaseExamDownloadPackageSwr.ts` | Package checkout mutation owner. |
| `src/modules/api/graphql/queries/query-my-payment-status.ts` + types + tests | Exact live status fields; request accepts exactly one ID/reference. |
| `src/hooks/swr/useQueryMyPaymentStatusSwr.ts` + test | Disabled without key; 2s poll only while pending; cap 15 automatic attempts. |
| `src/messages/vi.json`, `src/messages/en.json` | Pricing, checkout and return copy; Vietnamese is production primary and English key parity remains green. |
| `src/app/globals.css` | No planned edit: use existing MiaMia global identity and component states. Any new paint returns to Review. |
| Backend prerequisite | Add one public read-only pricing catalog query exposing enabled flags, membership monthly/yearly price and both package benefits/prices from app config. Exact BE file tree must be owned by `starci-be-feature-plan/review`; FE Apply waits for approved/live schema. |

### STATE MATRIX VÀ ACCEPTANCE

| Surface | Required proof |
|---|---|
| Pricing catalog | loading geometry; failed retry; ready A hierarchy; invalid offer fallback; selected/hover/focus/selected-focus; no hardcoded amount. |
| Responsive | Desktop sidebar and mobile footbar persist; 390x844 and 1440x900 have no horizontal overflow; reading order remains Pro then license. |
| Authentication | Signed-out purchase opens sign-in; success resumes exact URL offer once; dismiss creates no transaction. |
| Checkout | Pro and Personal/Commercial each submit once; pending disables exact CTA; error preserves offer; network has no failed GraphQL request. |
| Return | pending polls boundedly; succeeded, cancelled, failed and unpaid render distinct copy; URL `status`/`cancel` never grants success. |
| Accessibility | Heading order h1→h2, card groups named, keyboard focus visible, modal focus returns, informational White-label has no fake button role. |
| Runtime | Test account: sign in → Pro checkout intent → return status; sign in → Personal/Commercial checkout intent → return status; inspect terminal and browser network. Real provider payment remains a separate destructive-money approval. |

Acceptance commands after approved Apply:

```powershell
npm run typecheck
npm run lint
npm run test
npm run test:rules
npm run build
```

### OUTPUTS

| Concept | Result |
|---|---|
| Proposed revision | `tai-de-bang-gia-review-r1` khóa hierarchy A/A, server-owned pricing, two checkout owners và provider-authoritative return states. |
| White-label honesty | Có mặt trong ladder nhưng là thông tin `Liên hệ sau`, chưa có tương tác cho đến khi contact owner tồn tại. |
| Apply meaning | FE chỉ được sửa đúng component/props/boundary đã liệt kê sau khi backend pricing catalog live và revision này được duyệt rõ. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/miamia/tai-de-bang-gia.md` | `modified` — ghi lựa chọn A/A và append Design Review r1; không sửa production source. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Duyệt exact Review revision | **Duyệt `tai-de-bang-gia-review-r1` (đề xuất):** giữ White-label informational, mở Backend Feature Plan cho public pricing catalog, sau đó mới Apply FE. **Sửa revision:** thầy nêu đúng owner/state/path cần đổi. |

### WARNINGS

| Warning | Impact |
|---|---|
| Public pricing catalog chưa tồn tại trong live schema. | FE Apply bị gate; nếu bỏ gate sẽ phải hardcode giá trái server ownership. |
| White-label chưa có destination/lead persistence. | Chỉ được hiển thị “Liên hệ sau”; CTA live là claim giả. |
| Preview nói đến kho 100.000 đề nhưng inventory MinIO live chưa chứng minh con số đó. | Production copy không được dùng `100.000 đề đang có`; chỉ mô tả cập nhật liên tục và quyền đã có contract. |
| Test payment tiền thật có external effect. | Apply chỉ tạo/test intent và status bằng test account; trả tiền thật cần approval riêng ngay trước giao dịch. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| B/C hierarchy | A · Hai nhu cầu | Thầy tiếp tục phương án mặc định A/A; A làm rõ loại quyền trước giá. |
| Hardcode 49k/249k/4.999m trong FE | Public pricing catalog | Giá đã thuộc app config và có thể đổi không qua FE deploy. |
| White-label CTA chưa có owner | Informational `Liên hệ sau` | Không có route, contact destination hay lead mutation để hoàn thành press. |
| Một generic checkout block | Hai domain block dùng chung contract shape | Membership và download license có mutation, entitlement và success path khác nhau. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval Review r1 | Thầy trả lời `Duyệt tai-de-bang-gia-review-r1`. |
| Backend public pricing catalog | `starci-be-feature-plan -> review -> apply`, live schema và twin/E2E proof. |
| FE implementation and runtime UX | `starci-fe-design-apply` sau hai gate trên; baseline commit trước source edit. |

Approved revision: `tai-de-bang-gia-review-r1`

Approval evidence: thầy trả lời `ok` ngay sau handoff yêu cầu duyệt exact revision.

Post-approval finding: schema dump unfiltered của Backend Feature Plan phát hiện mutation public `submitContact`. Vì vậy câu “không có lead mutation” trong r1 không còn đúng tuyệt đối. R1 vẫn khóa đúng pricing/payment tree, nhưng White-label phải quay lại Design Review r2 để quyết định reuse `submitContact(category: partnership)` bằng form/overlay hay tiếp tục informational trước FE Apply; Apply không được tự chọn.

## review r2

Proposed revision: `tai-de-bang-gia-review-r2`

Approved revision: `tai-de-bang-gia-review-r2`

Approval evidence: thầy trả lời `Duyệt pricing-catalog-review-r1 và tai-de-bang-gia-review-r2.`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | D:\Repositories\miamia-fe @ main |
| Purpose | Sửa White-label từ informational thành contact flow thật, giữ nguyên pricing/payment architecture r1. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tai-de-bang-gia.md |
| Language | vi |
| Phase | review |
| Touching | Workflow này và source/schema chỉ đọc; không sửa production source. |

### REVIEW VERDICT

| Claim | Verdict | Frozen meaning | Evidence |
|---|---|---|---|
| Pricing/payment tree r1 | KEEP | Hierarchy A/A, catalog, checkout owners và provider-authoritative return states không đổi. | R1 đã được duyệt; finding mới chỉ thay White-label consequence. |
| White-label chỉ ghi `Liên hệ sau` | REVISE | Card có CTA `Nhận tư vấn White-label`, mở anonymous inquiry overlay và submit mutation thật. | Live schema/source có public `submitContact`; `partnership` là accepted category. |
| Cho user chọn contact category | REJECT | Adapter luôn gửi `category: "partnership"`; form chỉ hỏi tên, email và nhu cầu. | Product intent tại CTA đã xác định category; thêm select tạo quyết định giả. |
| Bắt đăng nhập trước contact | REJECT | Anonymous flow; không mở `SignInOverlay`. | Backend resolver không có auth guard và contact không tạo entitlement. |
| Thêm local pricing CSS | REJECT | Reuse contracts, leaves, `ModalShell` và MiaMia `globals.css`; không có component stylesheet. | User requirement và existing component grammar. |

### INTERACTION CONSEQUENCE

| Interaction | Trigger | Product owner | Request / route | Visual states | Pending | Success | Failure | Persistence / shared effect | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| Chọn offer | Press offer CTA hoặc deep-link | `PricingPage` + `PricingOfferCatalog` | `/pricing?offer=<finite-id>` | default, selected, invalid-fallback | N/A | URL giữ exact offer | Invalid fallback Pro, không side effect | Survives sign-in, share và provider return | Approved r1 finite URL union. |
| Mua Pro | Press monthly CTA | Membership checkout owners | `purchaseMembership` | idle, submitting, failed | Exact CTA disabled | Provider redirect | Preserve offer and retry | Server transaction owns state | Existing live mutation. |
| Mua download license | Press Personal/Commercial CTA | Exam download checkout owners | `purchaseExamDownloadPackage` | idle, submitting, failed | Exact package disabled | Provider redirect | Preserve package and retry | Server transaction/entitlement owns state | Existing live mutation. |
| Return payment | Valid order reference | `PaymentReturnStatus` | `myPaymentStatus` | pending, succeeded, cancelled, failed, unpaid | 2s poll capped 15 | Continue by purchase kind | Manual retry or return pricing | Persisted response, never URL status, is authority | Approved payment-status contract. |
| Mở White-label | Press `Nhận tư vấn White-label` | `PricingOfferCatalog` → `WhiteLabelInquiryOverlay` | No request | closed, idle | N/A | Overlay opens and focus enters title/first field | N/A | URL remains `offer=white-label`; closing returns focus | Existing `ModalShell` mechanics. |
| Gửi White-label inquiry | Submit name/email/message | `WhiteLabelInquiryPanel` | `submitContact({ category: "partnership" })` | idle, invalid, submitting, succeeded, failed | Fields and submit disabled; dismiss ignored to avoid ambiguous in-flight outcome | Confirmation with close action; no checkout/sign-in | Preserve entered values and show retry | Mail queue is backend consequence; no client-made lead ID | Live anonymous mutation and request fields inspected. |

### OWNER CHALLENGE

| Proposed owner | Layer | Purpose | Closest existing owners / contracts | REUSE verdict | ALTER verdict | Layer proof | Decision | Evidence |
|---|---|---|---|---|---|---|---|---|
| `PricingOfferCatalog` | block | Catalog data, two-job hierarchy and offer intents. | `ExamCatalog`, `CoursePricingRail` | No existing owner spans subscription and document licenses. | Altering either mixes unrelated domain behavior. | Own request/copy/state/selected offer. | ADD | Full FE search from r1. |
| `PaymentReturnStatus` | block | Poll and explain persisted payment outcome. | `MembershipCheckoutPanel`, `EmptyNotice` | Neither owns return-route request/state. | Altering checkout makes creation owner also own reconciliation. | Distinct request and state union. | ADD | Live status query. |
| `ExamDownloadCheckoutPanel` | block | Create Personal/Commercial checkout. | `MembershipCheckoutPanel` | Mutation, copy and entitlement differ. | Generic connected owner would erase domain sentence. | Distinct request/copy/success. | KEEP_APART | Live package mutation. |
| `WhiteLabelInquiryPanel` | block | Collect one assisted-sale request and own validation/submission outcomes. | `AuthenticationPanel`, `Field`, `Textarea`, `EmptyNotice` | Existing block owns auth; lower owners only render controls/notices. | Adding partnership submission to auth or pricing catalog mixes request and form state into wrong owner. | Distinct anonymous mutation, localized copy, invalid/submitting/success/failure states and connected/pure twin. | ADD | No FE `submitContact` document/hook/form exists; backend mutation is live. |

### VISUAL JOB

| Visual element | Owner / state | Recognition, grouping or interaction job | Existing reference | Verdict | Evidence |
|---|---|---|---|---|---|
| White-label CTA replaces muted label | White-label offer ready/selected | Signals assisted sale is actionable but not automatic checkout. | Existing primary/outline Button states | REVISE | Press now has a real mutation consequence. |
| Inquiry modal surface | idle, invalid, submitting, succeeded, failed | Isolates contact commitment from pricing comparison while preserving return focus. | `ModalShell` | KEEP | Overlay is temporary focused work, not a new route. |
| Field refusal text | invalid | Associates validation failure with exact input and announces it. | `Field` → `label-field-hint` | KEEP | Existing composite owns label/input/hint semantics. |
| Success/failure notice | succeeded/failed | Distinguishes accepted mail enqueue from retryable failure without leaving form geometry ambiguous. | `EmptyNotice` | KEEP | Existing notice has message and one action. |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | Pricing route | ADD | N/A | `src/app/[lang]/(app)/pricing/page.tsx` | Next route only → `PricingPage` | N/A | Mount `/pricing`; route does not fetch or draw. |
| page | `PricingPage` connected/pure | ADD | N/A | `src/components/pages/PricingPage/index.tsx`, `component.tsx` | Pricing route; composes catalog, status and overlays | `routed-page-main`, `pricing-page-stack` | Own URL offer, sign-in resume and overlay coordination. |
| layout | `MiaMiaAppLayout` | REUSE | `src/components/layouts/MiaMiaAppLayout/index.tsx`, `component.tsx` | same | `(app)/layout.tsx` | `learn-shell-frame` | Existing sidebar/footbar remains route-stable. |
| block | `PricingOfferCatalog` connected/pure | ADD | N/A | `src/components/blocks/payment/PricingOfferCatalog/index.tsx`, `component.tsx` | `PricingPage` | `pricing-offer-catalog`, `pricing-offer-card`, `pricing-license-grid` | Own catalog request/copy and four finite intents. |
| block | `PaymentReturnStatus` connected/pure | ADD | N/A | `src/components/blocks/payment/PaymentReturnStatus/index.tsx`, `component.tsx` | `PricingPage` on valid return reference | `payment-return-status` | Own bounded payment polling and outcomes. |
| block | `MembershipCheckoutPanel` | MODIFY | `src/components/blocks/membership/MembershipCheckoutPanel/index.tsx`, `component.tsx` | same | `MembershipCheckoutOverlay` | `purchase-checkout-panel` | Receive explicit URLs and server amount/period. |
| block | `ExamDownloadCheckoutPanel` connected/pure | ADD | N/A | `src/components/blocks/payment/ExamDownloadCheckoutPanel/index.tsx`, `component.tsx` | `ExamDownloadCheckoutOverlay` | `purchase-checkout-panel` | Own package checkout without duplicating arrangement. |
| block | `WhiteLabelInquiryPanel` connected/pure | ADD | N/A | `src/components/blocks/payment/WhiteLabelInquiryPanel/index.tsx`, `component.tsx` | `WhiteLabelInquiryOverlay` | `white-label-inquiry-panel` | Own anonymous partnership mutation and full form state family. |
| overlay | `MembershipCheckoutOverlay` | MODIFY | `src/components/overlays/membership/MembershipCheckoutOverlay/index.tsx`, `component.tsx` | same | `ExamCatalogPage`, `PricingPage` | `ModalShell` | Preserve legacy caller and accept explicit pricing return URLs. |
| overlay | `ExamDownloadCheckoutOverlay` | ADD | N/A | `src/components/overlays/payment/ExamDownloadCheckoutOverlay/index.tsx`, `component.tsx` | `PricingPage` | `ModalShell` | Package-specific checkout overlay. |
| overlay | `WhiteLabelInquiryOverlay` | ADD | N/A | `src/components/overlays/payment/WhiteLabelInquiryOverlay/index.tsx`, `component.tsx` | `PricingPage` | `ModalShell` | Connected inquiry panel in shared focus/dismiss mechanics. |
| branch | `Tree`, `SurfaceCard`, `SurfaceFormCard` | REUSE | `src/components/branches/Tree/index.tsx`, `src/components/branches/SurfaceCard/index.tsx`, `src/components/branches/SurfaceFormCard/index.tsx` | same | New pure owners | Named contracts below | Existing typed hosts/surfaces are sufficient. |
| composite | `EmptyNotice`, `Field` | REUSE | `src/components/composites/EmptyNotice/index.tsx`, `src/components/composites/Field/index.tsx` | same | Status and inquiry states | `empty-notice`, `label-field-hint` | Existing closed shapes own notice and labelled input semantics. |
| leaf | `Heading`, `Text`, `Badge`, `Button`, `Label`, `Textarea` | REUSE | Exact existing leaf index files | same | New pure owners | Existing leaf identities | No new primitive or vendor boundary. |
| shell | `ModalShell` | REUSE | `src/components/shells/ModalShell/index.tsx` | same | Three overlays | N/A | Existing focus, escape, backdrop and return-focus mechanics. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| Pricing route | page mount | ADD | N/A | no public props; mounts `PricingPage` | Next route only | Exact route test/render. |
| `PricingPage` connected/pure | connected/pure API | ADD | N/A | connected no public props; pure receives catalog, optional return status and overlay slots | Pricing route and connected twin | Page tests bind normal, return and White-label overlay order. |
| `PricingOfferCatalog` connected/pure | state/data/actions | ADD | N/A | finite selected offer; loading/failed/ready; `select`, `purchase`, `contact`, `retry` | `PricingPage` and connected twin | Tests bind four IDs and contact action only on White-label. |
| `PaymentReturnStatus` connected/pure | reference/state/actions | ADD | N/A | reference ID, persisted status union, retry/continue | `PricingPage` and connected twin | Tests reject URL-derived terminal state. |
| `MembershipCheckoutPanel` | return/cancel URL | ADD | only `onDismiss` | required return/cancel URL plus dismiss | `MembershipCheckoutOverlay` | Sole producer search. |
| `MembershipCheckoutPanel` | state/data | RETYPE | idle/submitting/failed; no amount | loading/idle/submitting/failed; server amount and period | Connected twin | Existing tests migrate; no page price literal. |
| `ExamDownloadCheckoutPanel` connected/pure | connected/pure API | ADD | N/A | package ID, URLs, dismiss; package-specific state/data/actions | New overlay only | Mutation and component tests bind enum. |
| `WhiteLabelInquiryPanel` connected/pure | state/data/actions | ADD | N/A | idle/invalid/submitting/succeeded/failed; resolved copy and field errors; submit/retry/dismiss actions | `WhiteLabelInquiryOverlay` and connected twin | Component tests cover every state; mutation adapter fixes category. |
| `MembershipCheckoutOverlay` | public API | ADD | isOpen/onDismiss | optional return/cancel URLs plus existing props | `ExamCatalogPage`, `PricingPage` | Existing caller fallback retained. |
| `ExamDownloadCheckoutOverlay` | public API | ADD | N/A | isOpen/packageId/returnUrl/cancelUrl/onDismiss | `PricingPage` | One producer search. |
| `WhiteLabelInquiryOverlay` | public API | ADD | N/A | isOpen/onDismiss; panel slot remains internal | `PricingPage` | One producer search; dismiss blocked only while submitting. |
| Contract registry | key set | RENAME | `membership-checkout-panel` | `purchase-checkout-panel` | Membership and download panels | Zero old key after migration. |
| Contract registry | pricing/inquiry keys | ADD | N/A | pricing/status keys from r1 plus `white-label-inquiry-panel` | New page/blocks only | Every key rendered and contract tests green. |

### SUPPORTING PRODUCTION BOUNDARY

| Tree | Frozen change |
|---|---|
| `src/components/contracts/index.ts` | Pricing/status contracts, checkout rename và one `white-label-inquiry-panel`; no other grammar. |
| `src/modules/api/graphql/queries/query-miamia-pricing-catalog.ts`, `types/miamia-pricing.ts`, tests | Public catalog adapter from approved backend schema. |
| `src/hooks/swr/useQueryMiaMiaPricingCatalogSwr.ts` | Public catalog cache owner. |
| `src/modules/api/graphql/mutations/mutation-purchase-exam-download-package.ts`, types, tests | Download checkout adapter. |
| `src/hooks/swr/useMutatePurchaseExamDownloadPackageSwr.ts` | Download mutation state. |
| `src/modules/api/graphql/queries/query-my-payment-status.ts`, types, tests | Persisted status adapter. |
| `src/hooks/swr/useQueryMyPaymentStatusSwr.ts`, test | Disabled without reference; 2s poll capped 15 while Pending only. |
| `src/modules/api/graphql/mutations/mutation-submit-contact.ts`, `types/submit-contact.ts`, test | Anonymous mutation adapter; category argument is not public and is fixed to `partnership`. |
| `src/hooks/swr/useMutateSubmitContactSwr.ts`, test | One mutation state owner; retry uses same form payload. |
| `src/messages/vi.json`, `src/messages/en.json` | Pricing, checkout, return and inquiry copy with key parity. |
| `src/app/globals.css` | No planned edit; existing MiaMia identity only. |

### STATE MATRIX VÀ ACCEPTANCE

| Surface | Required proof |
|---|---|
| White-label inquiry | CTA opens without auth; invalid name/email/message map to exact fields; one pending request; success confirmation; failure preserves values and retries. |
| Overlay semantics | Focus enters, Escape/backdrop close only outside pending, success close returns focus to White-label CTA. |
| Network | Submit sends exactly name/email/message and fixed `partnership`; no auth header requirement; success requires GraphQL `success`. |
| Pricing/payment | All r1 loading, selected, auth, checkout and return state proofs remain mandatory. |
| Responsive | 390x844 footbar and 1440x900 sidebar; modal and catalogue no horizontal overflow. |
| Styling | No component CSS or new visual token; contract/global grammar only. |
| Runtime | Anonymous inquiry test plus signed-in Pro/Personal/Commercial intent/status tests; browser console/network inspected and results appended. |

Acceptance commands remain:

```powershell
npm run typecheck
npm run lint
npm run test
npm run test:rules
npm run build
```

### OUTPUTS

| Concept | Result |
|---|---|
| Proposed revision | `tai-de-bang-gia-review-r2` preserves r1 and turns White-label into a real anonymous assisted-sale flow. |
| Contact consequence | Name, email and need are sent as fixed `partnership`; no login and no fake checkout. |
| Visual architecture | Shared ModalShell/contracts/leaves and global MiaMia identity; no local design CSS. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/miamia/tai-de-bang-gia.md` | `modified` — append Design Review r2; no production source. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Duyệt exact FE revision | **Duyệt `tai-de-bang-gia-review-r2` (đề xuất):** anonymous White-label inquiry overlay dùng fixed partnership mutation và giữ toàn bộ r1. **Sửa revision:** nêu owner/state/path cần đổi. |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend email subject/inbox copy của `submitContact` còn ghi StarCi và resolver legacy chưa CQRS. | Inquiry vẫn đến đúng founder nhưng internal mail branding chưa sạch MiaMia; refactor là Backend Feature/Audit riêng, không lén vào FE Apply. |
| Mutation không có idempotency key. | Network-loss retry có thể enqueue email trùng; UI chống double-submit nhưng không thể dedupe server-side. |
| Pricing catalog phải live trước FE Apply. | Nếu không, FE không có nguồn giá hợp lệ và Apply phải dừng. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| White-label informational-only r1 | Real inquiry overlay | Plan A/A được duyệt sau khi live mutation được phát hiện. |
| User-selectable category | Fixed partnership category | CTA đã xác định intent; select là quyết định thừa. |
| Sign-in gate | Anonymous contact | Backend contract là public và inquiry không cấp quyền. |
| New local CSS | Existing global/contracts | MiaMia phải follow StarCi patterns và chỉ global identity. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval Design Review r2 | Thầy trả lời `Duyệt tai-de-bang-gia-review-r2`. |
| Backend catalog live | Approved Backend Review → Apply → schema/live proof. |
| FE production implementation | `starci-fe-design-apply` sau cả hai Review approvals và backend prerequisite. |

## Frontend Design Apply — tai-de-bang-gia-review-r2

### CONTEXT

| Field | Value |
|---|---|
| Source | `D:\Repositories\starci-academy-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Skills | `D:\Repositories\starci-academy-backend\.claude\skills` |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |
| Project | `miamia` |
| Frontend | `D:\Repositories\miamia-fe` |
| Backend | `D:\Repositories\mia-mia-backend` |
| Workdir | `D:\Repositories\miamia-fe` |
| Workflow | `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tai-de-bang-gia.md` |
| Purpose | Apply trang bảng giá/tải đề đã duyệt trực tiếp vào source MiaMia, dùng global identity và shared StarCi patterns. |

### APPROVAL

| Revision | Evidence | Result |
|---|---|---|
| `tai-de-bang-gia-review-r2` | Thầy trả lời chính xác `Duyệt pricing-catalog-review-r1 và tai-de-bang-gia-review-r2.` | APPROVED |

### OUTPUTS

| Concept | Result |
|---|---|
| Pricing hierarchy | Tách rõ Pro học trên app với giấy phép tải đề Personal/Commercial và White-label liên hệ. |
| Purchase UX | Giá lấy từ backend; checkout có return/cancel URL; return page chỉ tin persisted payment status. |
| White-label | CTA mở inquiry anonymous, category cố định `partnership`; không giả checkout hoặc ép đăng nhập. |
| Responsive | Desktop dùng sidebar hiện hữu; mobile dùng footbar, không có horizontal overflow. |

### CHANGES

| Tree | Details |
|---|---|
| `src/app/[lang]/(app)/pricing/page.tsx` | Thêm route pricing production. |
| `src/components/pages/PricingPage/**` | Thêm page owner điều phối catalog, return status và ba overlay. |
| `src/components/blocks/payment/**` | Thêm catalog, payment return, exam-download checkout và White-label inquiry blocks. |
| `src/components/overlays/payment/**` | Thêm exam-download và White-label overlays dùng `ModalShell`. |
| `src/components/blocks/membership/MembershipCheckoutPanel/**` | Nhận server price/period và explicit return/cancel URLs. |
| `src/components/overlays/membership/MembershipCheckoutOverlay/index.tsx` | Giữ caller cũ, cho pricing truyền return/cancel URLs. |
| `src/modules/api/graphql/{queries,mutations}/**` | Thêm adapters catalog, purchase package, payment status và submit contact cùng tests. |
| `src/hooks/swr/**` | Thêm request-state owners; pending status poll hữu hạn, response lỗi không bị giả thành Pending. |
| `src/components/contracts/index.ts` | Thêm pricing/status/inquiry contracts và đổi checkout contract thành owner dùng chung. |
| `src/messages/{vi,en}.json` | Thêm copy pricing, checkout, return và inquiry đồng bộ hai locale. |
| `src/app/globals.css` | Không đổi; toàn bộ trang dùng MiaMia global identity và patterns hiện hữu. |
| `plugins/eslint-canon/**` | Canon mirror được sync từ Trust để đo lint hiện hành; phát hiện hai lỗi ngoài production boundary bên dưới. |

### PROOF

| Gate | Result |
|---|---|
| Baseline | `9360359d964efd0f24a8f3b5025f3eaaa71d502b` — commit toàn trạng thái FE trước Apply. |
| Focused ESLint | PASS 0 error trên toàn source/test của revision. |
| Focused Vitest | PASS 7 files, 9/9 tests. |
| Typecheck | PASS. |
| Production build | PASS; route `/[lang]/pricing` có trong route manifest. |
| Browser desktop | PASS trên tab sạch: catalog live đúng 49k/249k/4.999m, không overflow, không console error. |
| Browser mobile | PASS tại viewport mobile: nav desktop ẩn, footbar sticky hiện, `clientWidth = scrollWidth`. |
| White-label validation | PASS: CTA anonymous mở modal; name/email/message rỗng map đúng lỗi và không gửi external mutation. |
| Return failure | PASS: reference không tồn tại hiển thị thất bại/retry, không giả Pending. |
| Full suite inventory | 172 files/556 tests pass; 11 files/15 tests fail do debt lịch sử ngoài boundary (next-intl/navigation, ResizeObserver, old roster/projection expectations). |
| Workflow validator | PASS cho record đích: 0 lỗi; toàn workflow root còn 743 lỗi lịch sử ngoài hai record này. |

### NEED APPROVALS

| Need | Status |
|---|---|
| Revision r2 | Đã duyệt. |
| Gửi White-label inquiry thật | Chưa gửi vì tạo email/lead ra hệ thống; chỉ chạy sau xác nhận hành động external cụ thể. |
| Source review/commit cuối | Diff đang để worktree cho thầy kiểm tra; chưa tự commit sau Apply. |

### WARNINGS

| Warning | Impact |
|---|---|
| Full canonical lint còn hai error ngoài boundary: generated `plugins/eslint-canon/index.test.mjs` có `ruleOwners` unused và legacy `CurriculumModuleRow` vi phạm structural-arrangement-in-leaf. | Focused revision xanh; toàn repo chưa thể tuyên bố lint sạch nếu chưa mở lint-sync/audit boundary. |
| Full test suite còn 15 failure lịch sử ngoài pricing. | Không liên quan 9 focused tests; cần audit riêng để đạt full-suite green. |
| PayOS create-payment live treo trước khi persist vì provider unavailable và SDK/retry thiếu hard timeout. | CTA checkout không thể được tuyên bố end-to-end live; cần Backend Feature/Audit revision riêng để timeout/fail-fast và test provider outage. |
| Console có warning HeroUI `PressResponder` lịch sử nhưng không có error trên tab pricing sạch. | Không chặn thao tác pricing; nên gom vào FE audit/fidelity continuation. |
| Document title hiện vẫn là `StarCi Academy`. | Nội dung và visual là MiaMia nhưng metadata branding còn debt ngoài exact pricing component tree. |

### APPLY STATUS

`tai-de-bang-gia-review-r2` đã được triển khai và chứng minh trong exact FE boundary. Design Apply chưa được gọi là full-runtime closed cho tới khi PayOS checkout fail-fast/live settlement và các full-repo gates ngoài boundary được xử lý theo workflow riêng.
