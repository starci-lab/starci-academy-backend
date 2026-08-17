<!-- starci-workflow: v2 -->

# PayOS cho gói tải đề và Cloudflare webhook MiaMia

## plan r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | api |
| Repo / branch | D:\Repositories\mia-mia-backend @ main |
| Purpose | Khóa capability mua ba gói tải đề qua PayOS, grant entitlement an toàn và nhận webhook qua Cloudflare Tunnel do `.stacks` quản lý. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\payos-download-packages-and-webhook.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; không sửa product source, `.stacks`, PayOS dashboard, Cloudflare hay credential trong Plan. |

Database: PostgreSQL primary.

### OBJECTIVE

Tạo checkout PayOS riêng cho ba gói tải đề đã chốt, không biến chúng thành community membership. Một payment thành công phải được xác minh chữ ký, đối chiếu đúng amount/package, claim transaction đúng một lần và grant entitlement nguyên tử. Backend local port `3071` được publish tại `https://demo.studywithmiaenglish.vn`; PayOS IPN canonical là `https://demo.studywithmiaenglish.vn/api/v1/payos/webhook`.

### SCHEMA EVIDENCE

Live schema tại `http://localhost:3071/graphql` đã được dump không lọc. Mutation hiện có:

```text
submitContact
gradePaper
saveOnboarding
recordPractice
recordAttemptEvents
connectGithubAccount
exchangeCodeForToken
refreshToken
signOut
revokeSession
signInInit
signInVerifyOtp
signInResendOtp
forgotPasswordInit
forgotPasswordResendOtp
forgotPasswordVerifyOtp
signUpInit
signUpVerifyOtp
signUpResendOtp
purchaseMembership
updateProfile
generateAvatarPresignUrl
verifyAvatarPresignUrl
setupTwoFactor
confirmTwoFactor
disableTwoFactor
markNotificationAsRead
markAllNotificationsAsRead
setFollow
sendChatMessage
blockUser
unblockUser
reportContent
openDirectConversation
touchPresence
askChatbot
createChatbotSession
deleteChatbotSession
buyStreakFreeze
purchaseShopItem
```

Không có operation mua gói tải đề hoặc query entitlement tải đề. `purchaseMembership` trả checkout cho một membership product và không nhận package ID.

### SOURCE EVIDENCE

| Claim | Evidence | Decision |
|---|---|---|
| MiaMia chỉ có một membership product theo config hiện tại. | `apps/api/src/modules/filesystem/types/config.ts` ghi rõ “ONE Mia Mia app subscription”; `PurchaseMembershipRequest` chỉ nhận provider và redirect URLs. | Không sửa nghĩa `purchaseMembership`; thêm operation download-package riêng. |
| Pending checkout hiện được reuse theo user + action + provider. | `purchase-membership.handler.ts` không có package discriminator. | Transaction mới phải lưu `examDownloadPackage`; reuse phải bao gồm package để không trả nhầm giá. |
| PayOS transport đã tồn tại và xác minh chữ ký bằng SDK. | `payos.providers.ts`, `webhook.handler.ts`, `payment-payos.e2e-spec.ts`. | REUSE provider, webhook controller và probe-tolerant behavior; EXTEND finalization switch. |
| Route webhook đã được source xác định. | Global prefix `/api`, URI version `v1`, controller `payos`, action `webhook`. | URL đúng là `/api/v1/payos/webhook`. E2E helper bỏ global prefix nên dùng `/v1/payos/webhook` chỉ trong test. |
| Webhook và reconcile có thể đua nhau. | `MembershipService.grantMembership` dùng guarded update `Pending -> Succeeded`. | Entitlement grant mới phải claim transaction trong cùng DB transaction và loser trả `false`. |
| Dữ liệu đề hiện là question/paper entities, chưa có file PDF/DOCX để tải. | Không có learner download/presign operation; S3 presign hiện chỉ có admin surface. | Capability này bán và grant entitlement; generation/download artifact là feature kế tiếp, không vẽ URL giả. |
| `.stacks/dev/infra/tunnel` chưa có config hay token; script hiện tại hardcode StarCi. | Chỉ có `.gitkeep`; `cloudflare-tunnel-up.ps1` dùng `starci.org`, port `3001` và `.secrets`. | Chuyển script sang stack-owned config, host MiaMia và port `3071`. |
| DNS public chưa tồn tại. | Resolve `demo.studywithmiaenglish.vn` thất bại ngày 2026-08-16. | Apply phải upsert CNAME và kiểm tra DNS/HTTPS trước khi confirm PayOS webhook. |
| Dev PayOS secret ownership đang drift. | Plaintext API key tồn tại nhưng không có encrypted twin; `app.yaml` vẫn ở `.gitmounts`, trong khi manifest `.stacks` nói config đã chuyển. | Apply phải dùng `stack-secret.mjs`; chỉ `.enc` được commit và config default phải thống nhất. |
| Ảnh tham chiếu là màn hình SePay IPN. | UI trong ảnh mang nhãn SePay và Secret Key auth. | Không dùng secret/URL trong ảnh để cấu hình PayOS; SePay là capability khác. |

### PRODUCT CONTRACT

| Package ID | Giá VND | Entitlement dự kiến |
|---|---:|---|
| `personal50` | 99.000 | 50 download credits cá nhân. |
| `personal100Support` | 249.000 | 100 download credits cá nhân + hỗ trợ và tài liệu cập nhật. |
| `commercialLifetime` | 12.900.000 | Unlimited downloads, quyền dùng nội bộ thương mại, hỗ trợ trọn đời, nhóm Zalo và brand-promotion eligibility; không white-label, không bán lại kho dữ liệu. |

Catalog là server-owned trong encrypted `app.yaml`; frontend chỉ gửi enum package ID. Amount, credits và quyền không nhận từ client. Mỗi paid transaction grant vào một aggregate entitlement của user: finite credits cộng dồn; commercial unlimited chuyển `remainingCredits` thành `null`; webhook/reconcile trùng lặp không grant hai lần.

### OPERATION FAMILY

| Concern | Mirror | Result |
|---|---|---|
| Checkout mutation | `purchase-membership/*` và StarCi `purchase-ai-subscription/*` | CQRS command/handler/service/resolver/module/module-definition + GraphQL request/response + checkout types. |
| Atomic grant | `MembershipService.grantMembership` | Claim transaction guarded trong PostgreSQL transaction rồi mutate entitlement. |
| Payment finalization | `payos/webhook/webhook.handler.ts` và `reconcile-transaction.worker.ts` | Cả webhook và polling gọi cùng grant service. |
| Read model | `queries/exam/my-attempts/*` | Authenticated query trả aggregate entitlement sau redirect. |
| Tunnel | script StarCi hiện có + `.stacks` encryption convention | Giữ idempotent tunnel/DNS upsert nhưng bỏ hardcode và `.secrets`. |

### PROPOSED FILE TREE

| Path | Action | Responsibility / shape owner |
|---|---|---|
| `.stacks/dev/runtime/files/app.yaml.enc` | ADD | Encrypted canonical app config: PayOS client/checksum và server-owned download package catalog. Sinh bằng `stack-secret.mjs`, không patch ciphertext thủ công. |
| `.stacks/dev/runtime/files/payos-api-key.key.enc` | ADD | Encrypted PayOS API key từ plaintext local hiện có; plaintext bị xóa sau khi encrypt. |
| `.stacks/dev/infra/tunnel/cloudflare.env.enc` | ADD | Encrypted operational config gồm account ID, zone, hostname, tunnel name và origin `http://localhost:3071`. |
| `.stacks/dev/infra/tunnel/cloudflare-api-token.key.enc` | ADD | Token có Tunnel Edit + Zone Read/DNS Edit; owner nhập tương tác, không xuất log. |
| `.stacks/dev/runtime/env/KEYS.md` | MODIFY | Sửa manifest cho đúng app config/PayOS/tunnel homes thực tế. |
| `package.json` | MODIFY | Thêm script `tunnel:up` và `payos:webhook:confirm`. |
| `scripts/cloudflare-tunnel-up.ps1` | MODIFY | Đọc `.stacks/dev/infra/tunnel`, validate exact account/zone, preflight origin, upsert named tunnel + CNAME, lấy run token không log và chạy `cloudflared`. |
| `scripts/confirm-payos-webhook.ts` | ADD | Dùng mounted PayOS provider values gọi `payos.webhooks.confirm()` với canonical URL sau health proof. |
| `scripts/run-primary-migrations.ts` | MODIFY | Trỏ migration glob sang `apps/api/src/...` và bỏ credential/database defaults StarCi hardcode. |
| `apps/api/src/modules/env/config.ts` | MODIFY | Default `CONFIG_APP_FILE` về `.stacks/dev/runtime/files/app.yaml`; bỏ comment/path drift. |
| `apps/api/src/modules/filesystem/types/config.ts` | MODIFY | Thêm typed `examDownloads.enabled` và catalog ba package; giữ `membership` độc lập. |
| `apps/api/src/modules/databases/postgresql/primary/enums/exam-download-package.ts` | ADD | Enum `personal50`, `personal100Support`, `commercialLifetime` + GraphQL registration. |
| `apps/api/src/modules/databases/postgresql/primary/enums/brand-promotion-status.ts` | ADD | Enum `notEligible`, `pendingReview`, `active`, `rejected`. |
| `apps/api/src/modules/databases/postgresql/primary/enums/action-type.ts` | MODIFY | Thêm `ExamDownloadPackagePurchase` và GraphQL description. |
| `apps/api/src/modules/databases/postgresql/primary/entities/exam-download-entitlement.entity.ts` | ADD | Aggregate 1:1 user: remaining credits/null unlimited, commercial/support flags và promotion status. |
| `apps/api/src/modules/databases/postgresql/primary/entities/transaction.entity.ts` | MODIFY | Nullable package snapshot cho action mới; dùng trong reuse và finalization. |
| `apps/api/src/modules/databases/postgresql/primary/entities/user.entity.ts` | MODIFY | Relation 1:1 optional tới download entitlement. |
| `apps/api/src/modules/databases/postgresql/primary/primary.module.ts` | MODIFY | Đăng ký entity mới đúng PostgreSQL primary. |
| `apps/api/src/modules/databases/postgresql/primary/migrations/1786850000000-AddExamDownloadPackages.ts` | ADD | Tạo enum/table/index/FK và thêm action/package columns có reversible `down`. |
| `apps/api/src/modules/exam-download/exam-download.module-definition.ts` | ADD | Configurable module definition theo sibling module. |
| `apps/api/src/modules/exam-download/exam-download.module.ts` | ADD | Provide/export entitlement service; không import ngang capability. |
| `apps/api/src/modules/exam-download/exam-download-entitlement.service.ts` | ADD | Atomic claim + grant/additive/unlimited dominance + brand status initialization. |
| `apps/api/src/modules/exam-download/exam-download-entitlement.service.spec.ts` | ADD | Twin quyết định grant, idempotency và concurrent claim. |
| `apps/api/src/modules/exam-download/types/grant-exam-download-entitlement.ts` | ADD | Typed grant params/result, gồm active EntityManager boundary. |
| `apps/api/src/app.module.ts` | MODIFY | Composition root đăng ký `ExamDownloadModule`; xác nhận app là `api`. |
| `apps/api/src/features/api/core/graphql/mutations/exam/exam.module.ts` | MODIFY | Import operation checkout mới trong exam mutation group. |
| `apps/api/src/features/api/core/graphql/mutations/exam/purchase-exam-download-package/purchase-exam-download-package.command.ts` | ADD | CQRS message mang request/user/locale. |
| `apps/api/src/features/api/core/graphql/mutations/exam/purchase-exam-download-package/purchase-exam-download-package.handler.ts` | ADD | Resolve server catalog, validate package/provider/URLs, package-aware reuse, create pending PayOS transaction và enqueue reconcile. |
| `apps/api/src/features/api/core/graphql/mutations/exam/purchase-exam-download-package/purchase-exam-download-package.handler.spec.ts` | ADD | Handler twin cho catalog, amount, reuse, provider và failure branches. |
| `apps/api/src/features/api/core/graphql/mutations/exam/purchase-exam-download-package/purchase-exam-download-package.service.ts` | ADD | Một dòng dispatch command bus. |
| `apps/api/src/features/api/core/graphql/mutations/exam/purchase-exam-download-package/purchase-exam-download-package.resolver.ts` | ADD | Authenticated GraphQL mutation `purchaseExamDownloadPackage`. |
| `apps/api/src/features/api/core/graphql/mutations/exam/purchase-exam-download-package/purchase-exam-download-package.module.ts` | ADD | CqrsModule + resolver/service/handler wiring. |
| `apps/api/src/features/api/core/graphql/mutations/exam/purchase-exam-download-package/purchase-exam-download-package.module-definition.ts` | ADD | Configurable module definition mirroring sibling. |
| `apps/api/src/features/api/core/graphql/mutations/exam/purchase-exam-download-package/graphql-types/request.ts` | ADD | Input: package, `paymentType`, PayOS return/cancel URLs; không nhận price/quota. |
| `apps/api/src/features/api/core/graphql/mutations/exam/purchase-exam-download-package/graphql-types/response.ts` | ADD | Checkout URL/reference/transaction/amount/package response envelope. |
| `apps/api/src/features/api/core/graphql/mutations/exam/purchase-exam-download-package/types/checkout.ts` | ADD | Provider checkout params/result typed theo sibling. |
| `apps/api/src/features/api/core/graphql/queries/exam/exam.module.ts` | MODIFY | Import entitlement query mới. |
| `apps/api/src/features/api/core/graphql/queries/exam/my-exam-download-entitlement/my-exam-download-entitlement.query.ts` | ADD | CQRS query mang authenticated user. |
| `apps/api/src/features/api/core/graphql/queries/exam/my-exam-download-entitlement/my-exam-download-entitlement.handler.ts` | ADD | Đọc aggregate của caller; empty trả zero/not-entitled shape, không null ambiguity. |
| `apps/api/src/features/api/core/graphql/queries/exam/my-exam-download-entitlement/my-exam-download-entitlement.handler.spec.ts` | ADD | Twin cho empty, finite, unlimited và promotion states. |
| `apps/api/src/features/api/core/graphql/queries/exam/my-exam-download-entitlement/my-exam-download-entitlement.service.ts` | ADD | Một dòng dispatch query bus. |
| `apps/api/src/features/api/core/graphql/queries/exam/my-exam-download-entitlement/my-exam-download-entitlement.resolver.ts` | ADD | Authenticated query `myExamDownloadEntitlement`. |
| `apps/api/src/features/api/core/graphql/queries/exam/my-exam-download-entitlement/my-exam-download-entitlement.module.ts` | ADD | Query operation wiring. |
| `apps/api/src/features/api/core/graphql/queries/exam/my-exam-download-entitlement/my-exam-download-entitlement.module-definition.ts` | ADD | Configurable module definition. |
| `apps/api/src/features/api/core/graphql/queries/exam/my-exam-download-entitlement/graphql-types/response.ts` | ADD | Stable finite/unlimited/support/commercial/promotion result. |
| `apps/api/src/features/api/core/http/payos/webhook/webhook.handler.ts` | MODIFY | Add action case gọi atomic exam-download grant; giữ signature/amount/expiry/probe behavior. |
| `apps/api/src/features/api/core/http/payos/webhook/webhook.handler.spec.ts` | ADD | Twin cho signature, package grant, wrong amount, unknown probe và duplicate delivery. |
| `apps/api/src/features/api/processors/reconcile-transaction/reconcile-transaction.worker.ts` | MODIFY | Finalize action mới qua cùng entitlement service để polling parity với webhook. |
| `test/e2e/purchase-exam-download-package.e2e-spec.ts` | ADD | GraphQL transport → pending transaction package/amount, auth và package-aware reuse. |
| `test/e2e/payment-payos.e2e-spec.ts` | MODIFY | Real PostgreSQL webhook grants entitlement, verifies underpayment and redelivery idempotency. |
| `test/e2e/reconcile-transaction.e2e-spec.ts` | MODIFY | Polling paid path grants cùng entitlement; webhook/poll race chỉ grant một lần. |

### TEST MATRIX

| Layer | Case | Expected proof |
|---|---|---|
| Handler | Anonymous caller | Named auth/user failure; không tạo transaction/provider call. |
| Handler | Catalog disabled | Named product-unavailable exception. |
| Handler | Mỗi enum package | Server chọn đúng 99.000 / 249.000 / 12.900.000; client không override amount/quota. |
| Handler | Unknown enum/invalid provider | GraphQL/provider validation fails trước persistence. |
| Handler | Thiếu return hoặc cancel URL | Named PayOS URL exception; không persistence. |
| Handler | Pending cùng user/provider/package còn fresh | Reuse đúng transaction. |
| Handler | Pending cùng user/provider nhưng package khác | Tạo transaction mới, không trả checkout gói cũ. |
| Handler | Pending đã stale | Tạo checkout mới. |
| Grant service | Lần mua finite đầu tiên | Tạo aggregate với đúng credits/flags. |
| Grant service | Mua finite lần hai | Credits cộng dồn nguyên tử. |
| Grant service | Commercial sau finite | `remainingCredits=null`, commercial/support true, promotion theo rule duyệt. |
| Grant service | Finite sau commercial | Unlimited vẫn chi phối; không hạ quyền. |
| Grant service | Webhook lặp | Guarded claim trả false; không cộng hai lần. |
| Grant service | Webhook và reconcile đồng thời | Chỉ một transaction finalizer thắng. |
| Webhook | Signature sai | HTTP non-2xx; không mutate. |
| Webhook | Probe/unknown order | HTTP 2xx; không grant. |
| Webhook | code không thành công | ACK/ignore; không grant. |
| Webhook | Amount nhỏ hơn persisted amount | Underpayment exception; transaction còn pending. |
| Webhook | Transaction expired | Named expiry failure; không grant. |
| Webhook | Action không hỗ trợ | Named unsupported-action failure. |
| Reconcile | PayOS says paid | Grant giống webhook và transaction succeeded. |
| Reconcile | unpaid/unknown/exhausted | Giữ đúng retry/status behavior hiện hữu; không grant. |
| Query | Chưa mua | Trả 0 credits, finite, false flags, `notEligible`. |
| Query | Personal finite | Trả remaining credits và support flag đúng. |
| Query | Commercial | Trả unlimited/commercial/support và promotion status đúng. |
| Tunnel | Origin port 3071 down | Script dừng trước Cloudflare mutation. |
| Tunnel | Account/zone/token sai | Dừng với metadata an toàn, không log token. |
| Tunnel | Chạy lần đầu/lần hai | Tạo rồi reuse cùng named tunnel; CNAME upsert idempotent. |
| Live PayOS | Public probe | `payos.webhooks.confirm()` nhận 2xx từ canonical webhook URL. |
| Live checkout | Test account mua package sandbox/số tiền tối thiểu được PayOS cho phép | Redirect tới PayOS, callback ký hợp lệ, entitlement xuất hiện qua query. |

### LIVE PROOF

Apply chưa được phép dùng tiền thật ngoài gói/test amount đã được owner xác nhận. Proof sequence sau Review:

```text
npm run sync
npm run start:dev
npm run tunnel:up
DNS + HTTPS health: https://demo.studywithmiaenglish.vn
POST probe: https://demo.studywithmiaenglish.vn/api/v1/payos/webhook
npm run payos:webhook:confirm
GraphQL authenticated checkout -> PayOS redirect -> signed webhook -> myExamDownloadEntitlement
terminal/network scan: không 4xx/5xx ngoài negative cases, không credential trong log
```

### ASSUMPTIONS AND EXCLUSIONS

- Gói tải đề là product add-on độc lập; không tự cấp Pro membership.
- PayOS là gateway trong scope. SePay IPN trong ảnh không được cấu hình ở capability này.
- Commercial cho phép dùng nội bộ trong lớp/trung tâm; không white-label và không resale dữ liệu.
- Chưa tạo PDF/DOCX, presigned download URL hoặc decrement credit; đó là feature kế tiếp sau khi owner chốt artifact.
- Brand promotion chỉ tạo eligibility/status; publishing asset là workflow vận hành riêng, không tự đăng logo sau webhook.
- Cloudflare Tunnel expose backend origin; auth/admin guards hiện hữu vẫn phải giữ. Không thêm Cloudflare Access trước PayOS webhook vì provider phải POST công khai.

### OUTPUTS

| Concept | Result |
|---|---|
| Payment capability | Operation riêng bán ba exam-download packages qua PayOS, không làm lệch community membership. |
| Settlement model | Webhook và reconcile cùng gọi một atomic grant, package-aware và idempotent. |
| Public callback | Canonical IPN là `https://demo.studywithmiaenglish.vn/api/v1/payos/webhook`. |
| Secret ownership | PayOS và Cloudflare credentials chuyển về encrypted `.stacks`; plaintext không được commit/log. |
| Commercial fulfillment | Payment cấp unlimited commercial entitlement và brand-promotion eligibility; không tự publish thương hiệu. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\miamia\payos-download-packages-and-webhook.md` | added — feature Plan r1, source evidence, exact proposed tree và test matrix. |

```text
D:\Repositories\starci-academy-backend\.workflows
└── feature
    └── miamia
        └── payos-download-packages-and-webhook.md
```

### NEED APPROVALS

| Question | Options |
|---|---|
| “50 đề / 100 đề” là quota nào? | **A — Credits để người mua tự chọn bất kỳ đề nào trong kho (khuyến nghị cho kho 100.000+)**; B — hai bundle cố định do MiaMia đóng sẵn. |
| Quảng bá thương hiệu trong Commercial Lifetime kéo dài bao lâu? | **A — License tải + support trọn đời, vị trí đối tác 12 tháng rồi gia hạn (khuyến nghị để không bán inventory quảng cáo vĩnh viễn)**; B — vị trí quảng bá trọn đời cùng license. |
| Token Cloudflare cho dev tunnel | Owner nhập sau khi Review duyệt bằng `npm run secret:set -- dev/infra/tunnel/cloudflare-api-token.key`; token cần Account Tunnel Edit + Zone Read/DNS Edit. Không gửi token qua chat. |

### WARNINGS

| Warning | Impact |
|---|---|
| `demo.studywithmiaenglish.vn` hiện chưa resolve DNS. | PayOS confirm webhook chắc chắn thất bại cho tới khi tunnel + CNAME tồn tại và origin 3071 đang chạy. |
| Screenshot là SePay IPN, không phải PayOS. | Secret Key/Auth Type trong ảnh không được dùng cho `@payos/node`; nếu cần SePay phải mở plan riêng với `/api/v1/sepay/webhook`. |
| `.stacks/dev/runtime/files/payos-api-key.key` hiện chỉ có plaintext, không có `.enc`; app config vẫn ở `.gitmounts`. | Repo chưa portable/restart-safe và trái encrypted stack convention; Apply phải migrate trước live proof. |
| Current migration runner trỏ `src/...` và có StarCi credential/database defaults. | Migration mới có thể không chạy hoặc chạm nhầm database nếu không sửa runner trong cùng boundary. |
| Backend chưa có learner-download artifact/operation. | Thanh toán có thể grant entitlement nhưng chưa thể cung cấp file cho đến feature generation/download kế tiếp. |
| Public tunnel expose toàn backend origin. | Cần live negative checks cho admin/auth routes; PayOS webhook không thể đặt sau Cloudflare Access login. |
| Giá 12.900.000đ là giao dịch thật lớn. | Không chạy live charge commercial trong Apply nếu chưa có sandbox/test method hoặc owner xác nhận charge thật. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Dùng `purchaseMembership` cho cả ba gói tải đề | Tạo `purchaseExamDownloadPackage` và entitlement riêng | Membership hiện là subscription theo thời gian; package tải đề có quota/lifetime/commercial semantics khác và pending reuse hiện không phân biệt package. |
| Dùng `https://demo.studywithmiaenglish.vn` root làm PayOS IPN | Dùng `https://demo.studywithmiaenglish.vn/api/v1/payos/webhook` | Source route có global prefix, version, controller và action path cụ thể. |
| Copy script tunnel StarCi nguyên trạng | Stack-driven tunnel cho MiaMia port 3071 | Script hiện hardcode zone/hostname/tunnel/service StarCi và đọc `.secrets`, trái yêu cầu `.stacks`. |

### OWED

| Owed | Cleared by |
|---|---|
| Chốt hai product rules về quota và thời hạn quảng bá. | Owner trả lời A/B cho hai hàng đầu trong NEED APPROVALS. |
| Challenge exact file boundary và database migration strategy. | `starci-be-feature-review` revision r1. |
| Baseline commit trước mọi source/stack write. | `starci-be-feature-apply` sau khi Review được duyệt. |
| Cloudflare API token encrypted trong dev stack. | Owner chạy interactive `stack-secret.mjs set` trong Apply; không paste vào chat. |
| PayOS sandbox/live credential validity và webhook confirmation. | `npm run sync`, tunnel health, `payos.webhooks.confirm()` và signed live callback. |
| Tạo artifact PDF/DOCX, download authorization và credit decrement. | Backend Feature Plan kế tiếp sau khi owner chốt format/watermark/answer-key policy. |

## review r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | api |
| Repo / branch | D:\Repositories\mia-mia-backend @ main |
| Purpose | Challenge và khóa production boundary trước khi code PayOS packages cùng Cloudflare webhook. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\payos-download-packages-and-webhook.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; không sửa backend, `.stacks`, PayOS hay Cloudflare trong Review. |

Database reviewed: PostgreSQL primary. App reviewed: Nest `api`.

### REVIEW VERDICT

Revision identity: `payos-download-packages-and-webhook-review-r1`.

Brief đúng khi tách exam-download package khỏi membership và dùng chung PayOS settlement rail. Chưa thể approve Apply nếu không khóa quota semantics và thời hạn quảng bá. Revision r1 đề xuất mặc định A/A và bổ sung các owner bị Plan bỏ sót; không mở rộng sang generation/download artifact.

### CHALLENGES AND RESOLUTIONS

| Challenge | Finding | Revision r1 |
|---|---|---|
| Product bán nhưng chưa có artifact tải | Backend chỉ có normalized paper/questions, không có PDF/DOCX learner download. | Giữ payment + entitlement là capability này; ghi rõ checkout không được quảng cáo “tải ngay” cho đến feature artifact kế tiếp. |
| Exception identity bị thiếu khỏi exact tree | Plan nói named failure nhưng không nêu file exception. | Thêm `exam-download-package-not-available.ts` và `exam-download-package-config-invalid.ts`; không tái dùng membership exception. |
| Quảng bá 12 tháng cần durable boundary | Chỉ status enum không chứng minh lúc benefit hết hạn. | Nếu chọn A, entitlement thêm `brandPromotionEndsAt`; grant commercial đặt ngày theo server catalog, không theo client. |
| Pending reuse có thể trả nhầm package | Existing key không có package. | Unique lookup bắt buộc gồm user + action + provider + package + pending + freshness. |
| Webhook amount check chỉ chặn underpayment | Overpayment không làm sai entitlement nhưng phải trace. | Persisted transaction/package là authority; grant theo package snapshot, không suy package từ amount. Underpayment reject; overpayment không nâng gói. |
| App config migration có thể làm mất config không liên quan | `app.yaml` chứa system/membership/games/social và credential pair. | Encrypt nguyên file hiện tại bằng `--from-file`, prove parse/boot trước khi đổi default; không xóa bản `.gitmounts` trong boundary này. |
| Tunnel script đang chọn account đầu tiên | Sai account vẫn có thể tạo tunnel hợp lệ ở nơi khác. | `cloudflare.env` bắt buộc exact account ID + zone ID/name; không fallback account đầu tiên. |
| Public tunnel và PayOS probe | Cloudflare Access/login sẽ chặn provider. | Expose origin HTTPS công khai; giữ app auth guards, rate limits và signature verification; không đặt Access trước webhook. |
| PayOS confirmation có external mutation | `webhooks.confirm()` cập nhật channel webhook. | Chỉ chạy sau DNS/HTTPS/2xx probe và exact URL log-safe; ghi response status/channel metadata, không credential. |
| Live test giá lớn | Commercial charge 12.9m không phù hợp test tự động. | Unit/E2E cover exact production prices; live proof dùng PayOS-approved test/minimum package only sau owner consent. |

### FROZEN PRODUCT DEFAULTS PENDING APPROVAL

| Rule | Revision r1 |
|---|---|
| `personal50` | 50 credits để tự chọn bất kỳ paper đủ điều kiện; credits cộng dồn. |
| `personal100Support` | 100 credits tự chọn + support entitlement; credits cộng dồn. |
| `commercialLifetime` | Unlimited downloads + internal commercial use + lifetime support; không white-label/resale. |
| Brand promotion | Eligibility 12 tháng tính từ successful grant; hết hạn không ảnh hưởng license/support lifetime. |
| Repeated commercial purchase | Không gia tăng download; cộng thêm 12 tháng quảng bá từ max(now, current end). |
| Payment providers | PayOS only trong operation mới. Screenshot SePay không thuộc boundary. |

### PRODUCTION TOUCHING BOUNDARY

```text
D:\Repositories\mia-mia-backend
├── .stacks/dev/runtime/files/app.yaml.enc                                      ADD
├── .stacks/dev/runtime/files/payos-api-key.key.enc                            ADD
├── .stacks/dev/infra/tunnel/cloudflare.env.enc                                ADD
├── .stacks/dev/infra/tunnel/cloudflare-api-token.key.enc                      ADD
├── .stacks/dev/runtime/env/KEYS.md                                             MODIFY
├── package.json                                                               MODIFY
├── scripts/cloudflare-tunnel-up.ps1                                           MODIFY
├── scripts/confirm-payos-webhook.ts                                           ADD
├── scripts/run-primary-migrations.ts                                          MODIFY
├── apps/api/src/app.module.ts                                                 MODIFY
├── apps/api/src/modules/env/config.ts                                         MODIFY
├── apps/api/src/modules/filesystem/types/config.ts                            MODIFY
├── apps/api/src/modules/exceptions/errors/exam/exam-download-package-not-available.ts ADD
├── apps/api/src/modules/exceptions/errors/exam/exam-download-package-config-invalid.ts ADD
├── apps/api/src/modules/databases/postgresql/primary/enums/exam-download-package.ts ADD
├── apps/api/src/modules/databases/postgresql/primary/enums/brand-promotion-status.ts ADD
├── apps/api/src/modules/databases/postgresql/primary/enums/action-type.ts      MODIFY
├── apps/api/src/modules/databases/postgresql/primary/entities/exam-download-entitlement.entity.ts ADD
├── apps/api/src/modules/databases/postgresql/primary/entities/transaction.entity.ts MODIFY
├── apps/api/src/modules/databases/postgresql/primary/entities/user.entity.ts   MODIFY
├── apps/api/src/modules/databases/postgresql/primary/primary.module.ts         MODIFY
├── apps/api/src/modules/databases/postgresql/primary/migrations/1786850000000-AddExamDownloadPackages.ts ADD
├── apps/api/src/modules/exam-download/exam-download.module-definition.ts       ADD
├── apps/api/src/modules/exam-download/exam-download.module.ts                  ADD
├── apps/api/src/modules/exam-download/exam-download-entitlement.service.ts     ADD
├── apps/api/src/modules/exam-download/exam-download-entitlement.service.spec.ts ADD
├── apps/api/src/modules/exam-download/types/grant-exam-download-entitlement.ts ADD
├── apps/api/src/features/api/core/graphql/mutations/exam/exam.module.ts        MODIFY
├── apps/api/src/features/api/core/graphql/mutations/exam/purchase-exam-download-package/
│   ├── purchase-exam-download-package.command.ts                              ADD
│   ├── purchase-exam-download-package.handler.ts                              ADD
│   ├── purchase-exam-download-package.handler.spec.ts                         ADD
│   ├── purchase-exam-download-package.service.ts                              ADD
│   ├── purchase-exam-download-package.resolver.ts                             ADD
│   ├── purchase-exam-download-package.module.ts                               ADD
│   ├── purchase-exam-download-package.module-definition.ts                    ADD
│   ├── graphql-types/request.ts                                               ADD
│   ├── graphql-types/response.ts                                              ADD
│   └── types/checkout.ts                                                      ADD
├── apps/api/src/features/api/core/graphql/queries/exam/exam.module.ts          MODIFY
├── apps/api/src/features/api/core/graphql/queries/exam/my-exam-download-entitlement/
│   ├── my-exam-download-entitlement.query.ts                                  ADD
│   ├── my-exam-download-entitlement.handler.ts                                ADD
│   ├── my-exam-download-entitlement.handler.spec.ts                           ADD
│   ├── my-exam-download-entitlement.service.ts                                ADD
│   ├── my-exam-download-entitlement.resolver.ts                               ADD
│   ├── my-exam-download-entitlement.module.ts                                 ADD
│   ├── my-exam-download-entitlement.module-definition.ts                      ADD
│   └── graphql-types/response.ts                                              ADD
├── apps/api/src/features/api/core/http/payos/webhook/webhook.handler.ts        MODIFY
├── apps/api/src/features/api/core/http/payos/webhook/webhook.handler.spec.ts   ADD
├── apps/api/src/features/api/processors/reconcile-transaction/reconcile-transaction.worker.ts MODIFY
├── test/e2e/purchase-exam-download-package.e2e-spec.ts                         ADD
├── test/e2e/payment-payos.e2e-spec.ts                                          MODIFY
└── test/e2e/reconcile-transaction.e2e-spec.ts                                  MODIFY
```

No other source path is approved. Discovery of another owner returns to Review.

### ACCEPTANCE GATES

| Gate | Required evidence |
|---|---|
| Baseline | Apply commits clean current `main` before first production write and records SHA. |
| Types/build/lint | Existing strict commands pass without suppression or weakened rule. |
| Unit twins | Checkout handler, grant service, entitlement query and webhook handler suites pass. |
| E2E | GraphQL checkout + real PostgreSQL webhook + reconcile race cases pass. |
| Migration | `up`, schema inspection and `down/up` scratch proof; no StarCi default database. |
| Stack secrecy | `git status` shows only encrypted twins; secret scanner and log scan show no value. |
| Tunnel | Origin preflight, CNAME resolution, HTTPS route and second-run idempotency pass. |
| PayOS | Official SDK confirms exact webhook; signed probe ACKs; invalid signature mutates nothing. |
| Live account | Test user checkout → PayOS → return → entitlement query; terminal/network have no unexplained 4xx/5xx. |

### OUTPUTS

| Concept | Result |
|---|---|
| Review revision | `payos-download-packages-and-webhook-review-r1` freezes a separate package payment rail and exact production boundary. |
| Default quota model | Buyer-selected credits for personal packages; unlimited dominance for commercial. |
| Default advertising model | Commercial license/support lifetime, partner placement entitlement 12 months. |
| Runtime model | Stack-owned PayOS credentials and idempotent Cloudflare tunnel to port 3071 with canonical webhook path. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\miamia\payos-download-packages-and-webhook.md` | modified — appended Review r1, challenges, defaults, exact production boundary and gates. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve product defaults? | **A/A — buyer-selected credits + quảng bá 12 tháng (khuyến nghị)**; hoặc trả lời rule cần đổi. |
| Approve exact revision for coding? | Gửi `Duyệt payos-download-packages-and-webhook-review-r1` để cho phép Apply baseline commit rồi sửa đúng boundary trên. |

### WARNINGS

| Warning | Impact |
|---|---|
| Feature này chưa sinh hoặc tải PDF/DOCX. | Payment/entitlement có thể hoàn thành nhưng CTA tải file phải chờ capability kế tiếp. |
| Dev Cloudflare token chưa có trong `.stacks`. | Apply có thể code/test local nhưng không hoàn tất public tunnel/PayOS confirm cho tới khi owner nhập token. |
| Full `app.yaml` migration mang theo config ngoài payment. | Apply phải preserve byte-equivalent parsed values và không xóa source legacy trong revision này. |
| Live payment có thể là giao dịch thật. | Chỉ test amount/method được owner xác nhận; không charge 12.9m tự động. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Review tự suy “quảng bá trọn đời” từ chữ Commercial Lifetime | License/support lifetime, quảng bá 12 tháng pending approval | Inventory quảng cáo vĩnh viễn là cam kết khác và chưa được owner nói rõ. |
| Grant package theo số tiền webhook | Grant theo package snapshot trên pending transaction | Amount không phải product identity và overpayment không được nâng gói. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval revision r1 và defaults A/A. | Owner gửi đúng approval text hoặc feedback revision. |
| Baseline commit và implementation. | `starci-be-feature-apply` sau approval. |
| Cloudflare credential entry. | Interactive `stack-secret.mjs set` trong Apply, không gửi chat. |
| Runtime/browser/live PayOS proof. | Apply gates sau khi tunnel và test account khả dụng. |

## review r2

Approved revision: `payos-download-packages-and-webhook-review-r2`.

Approved defaults: A/A/A — Personal và Commercial là one-time lifetime licenses; Pro gia hạn PayOS thủ công từng tháng; Commercial có partner-brand placement 12 tháng.

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | api |
| Repo / branch | D:\Repositories\mia-mia-backend @ main |
| Purpose | Thay revision r1 bằng pricing model mới gồm Pro subscription, hai download licenses và White-label contact. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\payos-download-packages-and-webhook.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; chưa sửa production source, `.stacks`, PayOS hay Cloudflare. |

Database reviewed: PostgreSQL primary. App reviewed: Nest `api`.

### FEEDBACK RECEIVED

| Founder feedback | Contract consequence |
|---|---|
| “gói cá nhân, tải ko giới hạn, cập nhật liên tục, add vào nhóm zalo hỗ trợ - 249k” | Bỏ hoàn toàn credit/quota 50 và 100; Personal là unlimited download license có update + support entitlement. |
| “gói thương mai, đem dạy học thoải mái, nhưng không dc bán - 4tr999” | Commercial là internal teaching license, unlimited, không resale. Giá 4.999.000đ. |
| “whitelable, của mình luôn r - liên hệ sau” | White-label không self-serve PayOS; chỉ contact/quote, chưa tạo entitlement tự động. |
| “đăng khí sucribtipn là 49k/tháng là pro” | Existing community membership trở thành Pro subscription 49.000đ/tháng, tách khỏi download licenses. |

### REVISED PRODUCT MODEL

Revision identity: `payos-download-packages-and-webhook-review-r2`.

| Offer | Price | Payment | Backend meaning |
|---|---:|---|---|
| Pro | 49.000đ/tháng | Existing `purchaseMembership` qua PayOS | In-app Pro membership, period một tháng; không tự cấp download license. |
| Personal | 249.000đ | New PayOS package checkout | Unlimited personal downloads, continuous material updates, Zalo support; không commercial teaching/resale. |
| Commercial | 4.999.000đ | New PayOS package checkout | Unlimited downloads + dùng nội bộ để giảng dạy; không bán lại nội dung/dữ liệu. |
| White-label | Liên hệ | Không tạo PayOS checkout | Sales/contact handoff; scope brand/domain/source/data được thương lượng và triển khai bằng contract riêng. |

`membership` tiếp tục là time-bound Pro. `examDownloadLicense` là one-time license aggregate độc lập. Client chỉ gửi `personal` hoặc `commercial`; `whiteLabel` không phải enum mua hàng và không thể bị gọi lách qua GraphQL.

### R2 DOMAIN REVISION

| Owner | r1 | r2 |
|---|---|---|
| Download package enum | `personal50`, `personal100Support`, `commercialLifetime` | `personal`, `commercial`; không có `whiteLabel`. |
| Download entitlement | remaining credits, unlimited dominance | `licenseTier`, unlimited=true, continuousUpdates, zaloSupport, commercialTeaching, resaleAllowed=false. |
| Brand promotion | status + expiry | Loại khỏi backend r2 cho tới khi thầy xác nhận còn thuộc Commercial. |
| Pro membership | Không đổi giá trong r1 | Server config `membership.priceVnd=49000`, mỗi paid checkout grant một tháng theo behavior hiện hữu. |
| White-label | Không có | Không có payment/domain entity; contact only và nằm ngoài backend Apply. |
| Repeat Personal/Commercial purchase | Add credits / extend promotion | Idempotent grant; cùng hoặc thấp hơn tier không làm thay đổi license, transaction vẫn settle đúng một lần. Commercial nâng Personal; Personal không hạ Commercial. |

### R2 BOUNDARY DELTA

Các path hạ tầng, PayOS operation family, webhook/reconcile, migration, query, e2e và `.stacks` trong r1 vẫn giữ. Nội dung các file sau thay đổi shape:

```text
REMOVE FROM R1 BOUNDARY
apps/api/src/modules/databases/postgresql/primary/enums/brand-promotion-status.ts

KEEP BUT REVISE
apps/api/src/modules/filesystem/types/config.ts
  - membership.priceVnd = 49_000 in mounted config
  - examDownloads packages = personal/commercial only
apps/api/src/modules/databases/postgresql/primary/enums/exam-download-package.ts
  - personal | commercial
apps/api/src/modules/databases/postgresql/primary/entities/exam-download-entitlement.entity.ts
  - no credit counters or brand status
  - license tier + update/support/teaching/resale facts
apps/api/src/modules/exam-download/exam-download-entitlement.service.ts
  - idempotent same-tier, commercial upgrades personal, never downgrade
apps/api/src/features/api/core/graphql/mutations/exam/purchase-exam-download-package/**
  - accepts personal/commercial only; price 249_000 / 4_999_000 server-side
apps/api/src/features/api/core/graphql/queries/exam/my-exam-download-entitlement/**
  - returns tier and license facts, not credits/promotion status
apps/api/src/features/api/core/http/payos/webhook/**
apps/api/src/features/api/processors/reconcile-transaction/**
test/e2e/**
  - assertions follow r2 license rules
```

Exact production boundary is Review r1 minus the removed enum path above; no White-label backend files are added. Every other path remains exact and cannot expand during Apply.

### R2 TEST DELTA

| Case | Expected result |
|---|---|
| Pro checkout amount | `purchaseMembership` charges server-owned 49.000đ and grants one month. |
| Pro repeated payment | Extends one month from max(now, current period end); webhook/reconcile race grants once. |
| Personal checkout | Charges 249.000đ and grants unlimited personal license + updates/Zalo support. |
| Commercial checkout | Charges 4.999.000đ and grants unlimited commercial-teaching license with resale=false. |
| White-label package injection | GraphQL enum rejects before handler; no provider call/transaction. |
| Personal after Personal | No duplicate entitlement mutation; transaction settles once. |
| Commercial after Personal | Atomic upgrade to Commercial. |
| Personal after Commercial | No downgrade. |
| Download license vs Pro | Buying one never grants the other. |
| Price tampering | Request has no amount field; persisted/config price wins. |

### OUTPUTS

| Concept | Result |
|---|---|
| Pricing architecture r2 | Pro subscription 49k/month is separate from Personal 249k and Commercial 4.999m download licenses. |
| Personal license | Unlimited personal download, continuous updates and Zalo support. |
| Commercial license | Unlimited internal teaching use with explicit no-resale rule. |
| White-label | Contact-only offer; no PayOS SKU or automatic entitlement in this backend revision. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\miamia\payos-download-packages-and-webhook.md` | modified — appended Review r2 replacing quota packages and separating Pro, licenses and White-label. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Personal và Commercial là mua một lần dùng trọn đời? | **A — Đúng, one-time lifetime license (khuyến nghị theo “cập nhật liên tục/đem dạy thoải mái”)**; B — Có thời hạn, thầy ghi số tháng/năm. |
| Pro 49k/tháng gia hạn kiểu nào? | **A — Thanh toán PayOS thủ công mỗi tháng (khuyến nghị, đúng capability hiện tại)**; B — Auto recurring, cần thêm billing mandate/provider capability riêng. |
| Commercial còn gồm quảng bá thương hiệu trên MiaMia không? | **A — Có, quyền hiển thị đối tác 12 tháng (khuyến nghị theo feedback trước)**; B — Không, quảng bá chỉ thương lượng trong White-label; C — Có trọn đời. |
| Duyệt revision để code | Sau khi chốt ba hàng trên, gửi `Duyệt payos-download-packages-and-webhook-review-r2, A/A/A` hoặc lựa chọn khác. |

### WARNINGS

| Warning | Impact |
|---|---|
| PayOS flow hiện là one-time payment link, membership `autoRenew=false`. | Gọi nó “subscription tự động” sẽ sai nếu thầy chọn auto recurring mà chưa bổ sung capability. |
| White-label “của mình luôn” chưa định nghĩa asset/source/domain/data ownership. | Contact-only là trung thực; không được tự cấp source code hay tenant sau payment. |
| Backend vẫn chưa sinh/tải PDF/DOCX. | Download license sẽ tồn tại trước download artifact feature. |
| R1 vừa được approve nhưng bị chính feedback cùng tin nhắn thay đổi. | Không được Apply r1; chỉ r2 sau explicit approval mới hợp lệ. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `personal50` / `personal100Support` và credit counters | Personal unlimited 249k | “gói cá nhân, tải ko giới hạn” |
| Commercial 12.900.000đ | Commercial 4.999.000đ | “gói thương mai ... 4tr999” |
| White-label như một self-serve PayOS package | Contact-only White-label | “liên hệ sau” |
| Apply revision r1 sau approval | Review r2 trước Apply | Feedback mới thay schema, prices và entitlement semantics của r1. |

### OWED

| Owed | Cleared by |
|---|---|
| Chốt lifetime/manual renewal/brand promotion. | Owner trả lời ba lựa chọn r2. |
| Explicit approval r2 và exact boundary. | `Duyệt payos-download-packages-and-webhook-review-r2, ...`. |
| Baseline commit và source implementation. | `starci-be-feature-apply` sau approval r2. |
| Cloudflare token, tunnel và PayOS live confirmation. | Interactive secret entry + Apply runtime gates. |

## apply r2

Baseline commit: `069339dcc96427d15332b720f9ba0828b5bade1c`.

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | api |
| Repo / branch | D:\Repositories\mia-mia-backend @ main |
| Purpose | Apply pricing r2, checkout PayOS, entitlement, webhook/reconcile và runtime tunnel theo revision đã duyệt. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\payos-download-packages-and-webhook.md |
| Language | vi |
| Phase | apply |
| Touching | Đúng production boundary của Review r2. |

### OUTPUTS

| Concept | Result |
|---|---|
| Pricing | Pro 49.000đ/tháng tách biệt với Personal 249.000đ và Commercial 4.999.000đ. |
| Checkout | Client chỉ chọn package; giá persist lấy từ cấu hình server, không tin amount trả về từ gateway. |
| Entitlement | Personal/Commercial lifetime, upgrade một chiều, không resale; Commercial có quảng bá 12 tháng. |
| Settlement | Webhook và reconcile dùng cùng grant service, transaction claim bảo đảm idempotent. |
| Local runtime | OTP test account tạo app session thật; authenticated entitlement query trả state ổn định. |

### CHANGES

| Tree | Details |
|---|---|
| `apps/api/src/features/api/core/graphql/mutations/exam/purchase-exam-download-package/**` | Thêm checkout package server-owned price, pending transaction và reconcile enqueue. |
| `apps/api/src/features/api/core/graphql/queries/exam/my-exam-download-entitlement/**` | Thêm query trạng thái license của user hiện tại. |
| `apps/api/src/modules/exam-download/**` | Thêm aggregate grant/upgrade entitlement dùng chung. |
| `apps/api/src/features/api/core/http/payos/webhook/**` | Route paid transaction theo action type và grant download license idempotent. |
| `apps/api/src/features/api/processors/reconcile-transaction/**` | Polling paid path dùng cùng entitlement grant. |
| `apps/api/src/modules/databases/postgresql/primary/**` | Thêm enum, entity, relation và migration package/license. |
| `.stacks/dev/**`, `scripts/cloudflare-tunnel-up.ps1`, `scripts/confirm-payos-webhook.ts` | Mã hóa cấu hình app/tunnel, canonical hostname và helper confirm webhook không log secret. |
| `test/e2e/**` | Chứng minh package price 249k/4.999m, PayOS webhook và reconcile trên PostgreSQL thật. |

### TEST RESULTS

| Gate | Result |
|---|---|
| Focused unit | PASS — 4 suites, 11 tests. |
| Purchase package E2E | PASS — 2/2, gồm gateway amount giả `1` nhưng DB vẫn persist server price. |
| PayOS webhook E2E | PASS — 5/5. |
| Reconcile E2E | PASS — 5/5. |
| Full unit | PASS — 114 suites, 544 tests. |
| Build | PASS — `nest build api`. |
| Lint | PASS — 0 error. |
| Migration | PASS — `AddExamDownloadPackages1786850000000` trên PostgreSQL MiaMia local. |
| Authenticated live query | PASS — OTP local → app session → `myExamDownloadEntitlement`, không dùng direct-grant token. |

### NEED APPROVALS

| Need | Status |
|---|---|
| PayOS API key thật để tạo giao dịch và confirm webhook với PayOS | Chưa có secret trong canonical `.stacks`; không cản code/test local nhưng cản giao dịch live. |

### WARNINGS

| Warning | Impact |
|---|---|
| Chưa có PayOS API key thật. | Chưa thể khẳng định PayOS dashboard đã nhận webhook hoặc thanh toán tiền thật thành công. |
| White-label vẫn contact-only. | Không có SKU/entitlement tự động, đúng Review r2. |

### OWED

| Owed | Cleared by |
|---|---|
| Live PayOS create-payment + webhook confirmation | Nhập PayOS API key vào canonical encrypted stack rồi chạy `payos:webhook:confirm` và một giao dịch test. |
| Commit implementation r2 | Commit toàn bộ diff từ baseline sau khi record này được cập nhật. |

Implementation commit: `c0edb5f6a5ec95dd44a30b220c2d1e1e15addc8e`.

## apply runtime tunnel r1 — 2026-08-17

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\mia-mia-backend` |
| Source | `D:\Repositories\starci-academy-backend` |
| Project | `miamia` |
| Frontend | `D:\Repositories\miamia-fe` |
| Backend | `D:\Repositories\mia-mia-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Skills | `D:\Repositories\starci-academy-backend\.claude\skills` |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |
| Workflow | `D:\Repositories\starci-academy-backend\.workflows\feature\miamia\payos-download-packages-and-webhook.md` |
| Purpose | Mở Cloudflare Tunnel cho API MiaMia `localhost:3071` tại `https://demo.studywithmiaenglish.vn`. |
| Phase | Apply runtime — đang chặn bởi quyền Cloudflare. |

### OUTPUTS

| Concept | Result |
|---|---|
| API local | Runtime đích tiếp tục là `http://localhost:3071`. |
| API token | Credential trong environment được Cloudflare chấp nhận xác thực nhưng không nhìn thấy zone `studywithmiaenglish.vn`. |
| Tunnel token | Credential hiện tại không phải token chạy tunnel hợp lệ; `cloudflared` từ chối trước khi kết nối. |
| Public hostname | Chưa có DNS cho `demo.studywithmiaenglish.vn`; HTTPS chưa thể kiểm chứng. |

### CHANGES

| Tree | Details |
|---|---|
| `scripts/cloudflare-tunnel-up.ps1` | Chuẩn hóa secret dạng dotenv; cho phép `CF_API_TOKEN` runtime override; resolve account từ zone để tương thích token least-privilege. Chưa commit vì public runtime gate chưa đạt. |
| `.workflows/feature/miamia/payos-download-packages-and-webhook.md` | Ghi lại đầy đủ lần chạy, lỗi Cloudflare và credential cần bổ sung. |

### TEST RESULTS

| Gate | Result |
|---|---|
| Encrypted token | FAIL — Cloudflare API code `10000 Authentication error`. |
| `CF_API_TOKEN` override | PARTIAL — xác thực được, nhưng query zone trả rỗng. |
| `CF_TUNNEL_TOKEN` direct run | FAIL — `Provided Tunnel token is not valid`. |
| DNS resolve | FAIL — `demo.studywithmiaenglish.vn` chưa tồn tại trong DNS. |
| HTTPS GraphQL | BLOCKED — không có DNS/tunnel để gọi live. |

### NEED APPROVALS

| Need | Status |
|---|---|
| Cloudflare API token mới | Cần token thuộc account đang quản lý `studywithmiaenglish.vn`, có `Account > Cloudflare Tunnel > Edit`, `Zone > DNS > Edit`, `Zone > Zone > Read`; giới hạn resource đúng account/zone là đủ. |

### WARNINGS

| Warning | Impact |
|---|---|
| Hai credential hiện tại không provision hoặc chạy được tunnel đích. | Không thể tự tạo tunnel, CNAME hay chứng minh webhook public nếu chưa thay credential. |
| Không có bản ghi DNS public. | PayOS không thể gọi webhook qua hostname đã chốt. |
| Script đang có diff chưa commit. | Chỉ commit sau khi credential mới giúp toàn bộ tunnel + HTTPS gate đạt. |

### OWED

| Owed | Cleared by |
|---|---|
| Provision tunnel `miamia-demo`, CNAME và ingress về `localhost:3071`. | Cấp token đúng quyền rồi chạy lại `npm run tunnel:dev`. |
| Kiểm chứng HTTPS GraphQL và endpoint webhook từ internet. | Tunnel connected và DNS resolve thành công. |
| Đồng bộ token vào `.stacks` dưới dạng mã hóa, không log plaintext. | Runtime gate đạt với credential mới. |

## apply runtime tunnel r2 — 2026-08-17

Applied revision: payos-download-packages-and-webhook-review-r2.

Baseline commit: `c0edb5f6a5ec95dd44a30b220c2d1e1e15addc8e`.

Tracked diff: `c0edb5f6a5ec95dd44a30b220c2d1e1e15addc8e..worktree` trong boundary tunnel.

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | D:\Repositories\mia-mia-backend @ main |
| Purpose | Mã hóa credential Cloudflare, provision named tunnel và chứng minh API/webhook qua HTTPS public. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\payos-download-packages-and-webhook.md |
| Language | vi |
| Phase | apply |
| Touching | `.stacks/dev/infra/tunnel/cloudflare-api-token.key.enc`, `scripts/cloudflare-tunnel-up.ps1`, workflow hiện tại. |

### TEST RESULTS

| Gate | Result |
|---|---|
| SOPS credential | PASS — User API token được mã hóa trực tiếp vào `.stacks`; file plaintext tạm được xóa ngay. |
| Provision | PASS — tunnel `miamia-demo` được tạo/cập nhật, ingress trỏ `demo.studywithmiaenglish.vn` tới `http://localhost:3071`. |
| Connector | PASS — 4/4 kết nối QUIC registered; connectivity pre-check DNS, UDP, TCP và Cloudflare API đều PASS. |
| Restart từ canonical stack | PASS — `npm run tunnel:dev` chạy lại chỉ bằng encrypted stack, không cần environment override. |
| Secret logging | PASS sau sửa — inherited `CF_API_TOKEN` và `CF_TUNNEL_TOKEN` bị xóa trước khi gọi `cloudflared`; run token được mask. |
| Public DNS | PASS — resolver `1.1.1.1` và `8.8.8.8` trả Cloudflare edge IPv4/IPv6. |
| Public GraphQL | PASS — `POST https://demo.studywithmiaenglish.vn/graphql` trả HTTP 200 và `Query`. |
| Public webhook boundary | PASS — `OPTIONS /api/v1/payos/webhook` trả 204; `GET` trả 404 đúng vì production route chỉ nhận POST. Không gửi payload giả. |

### OUTPUTS

| Concept | Result |
|---|---|
| Public MiaMia API | `https://demo.studywithmiaenglish.vn` đang tunnel tới API local port `3071`. |
| PayOS callback boundary | URL public `https://demo.studywithmiaenglish.vn/api/v1/payos/webhook` đã tới đúng runtime. |
| Credential ownership | Cloudflare API credential nằm trong encrypted `.stacks`; environment không còn được tin làm nguồn canonical. |

### CHANGES

| Tree | Details |
|---|---|
| `.stacks/dev/infra/tunnel/cloudflare-api-token.key.enc` | modified — thay credential Cloudflare bằng User API token đã mã hóa SOPS. |
| `scripts/cloudflare-tunnel-up.ps1` | modified — chuẩn hóa legacy dotenv secret, resolve account từ zone cho least-privilege token và xóa inherited Cloudflare environment trước khi gọi `cloudflared`. |
| `.workflows/feature/miamia/payos-download-packages-and-webhook.md` | modified — ghi proof provision, restart, public HTTPS và secret-log repair. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| Credential API đã được gửi qua chat trong lúc bàn giao. | Phải rotate token sau khi commit/runtime proof hoàn tất, rồi cập nhật lại encrypted stack; token hiện tại không nên coi là bí mật dài hạn. |
| Windows DNS client vẫn giữ negative cache trong lần kiểm tra trực tiếp. | Không ảnh hưởng public DNS; Cloudflare và Google resolver đều trả edge, HTTPS đã PASS bằng `--resolve`. |
| PayOS live confirm chưa chạy vì canonical PayOS key vẫn thiếu. | Tunnel/webhook boundary đã sẵn sàng nhưng dashboard PayOS chưa được confirm tự động. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Dùng inherited `CF_API_TOKEN`/`CF_TUNNEL_TOKEN` khi restart | Chỉ dùng SOPS encrypted stack | Environment cũ gây drift và `cloudflared` có thể in credential vào log. |

### OWED

| Owed | Cleared by |
|---|---|
| Rotate Cloudflare token đã đi qua chat và re-encrypt bản mới. | Tạo token cùng quyền, nhập bằng prompt ẩn, chạy lại `npm run tunnel:dev` và public GraphQL gate. |
| Confirm webhook trực tiếp trên PayOS dashboard/API. | Bổ sung PayOS key canonical rồi chạy `npm run payos:webhook:confirm`. |

Implementation commit: `aadf1c0`.
