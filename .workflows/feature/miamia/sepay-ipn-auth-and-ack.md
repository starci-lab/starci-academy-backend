<!-- starci-workflow: v2 -->

# SePay IPN auth and acknowledgement

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
| Purpose | Lập brief xác thực SePay Payment Gateway IPN bằng `X-Secret-Key`, ACK HTTP 200 và chứng minh qua PostgreSQL primary cùng public tunnel. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\sepay-ipn-auth-and-ack.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; không sửa production source. |

### EVIDENCE

| Evidence | Result |
|---|---|
| App / database | `nest-cli.json` xác nhận app `api`; handler dùng `@InjectPrimaryPostgreSQLEntityManager`, nên database là PostgreSQL primary. |
| Live GraphQL schema | Đã dump toàn bộ query/mutation từ `localhost:3071`; capability này là HTTP webhook, không thêm GraphQL operation. |
| Production route | `SepayWebhookController` tạo `POST /api/v1/sepay/webhook`; E2E dùng `/v1/sepay/webhook` vì không có global `/api` prefix. |
| SePay contract | Payment Gateway IPN gửi `X-Secret-Key` khi Auth Type là `SECRET_KEY`, payload JSON và cần HTTP 200 để ACK. |
| Live unauthenticated call | `POST` public không có secret tới được handler và trả 500; route hiện chưa xác thực transport. |
| Existing handler | Dùng `order.retrieve(invoice)` với merchant API secret rồi mới grant, vì vậy tiếp tục không tin trạng thái paid từ body inbound. |
| Existing response | Controller POST mặc định trả 201; E2E đang khóa `.expect(201)`. |
| Existing logging | Controller và handler log toàn bộ body SePay; payload thật có transaction/customer/card metadata. |
| Existing secret owner | Merchant API secret đã nằm ở `sepay-api-key.key.enc`; IPN secret là credential khác và chưa có mount riêng. |
| Sibling | PayOS webhook xác minh transport/provider trước mutation, chỉ log reference không nhạy cảm và ACK callback đã xác minh nhưng không khớp pending transaction. |

### PROPOSED FILE TREE

| Path | Change | Shape owner |
|---|---|---|
| `apps/api/src/modules/env/config.ts` | MODIFY — thêm `SEPAY_IPN_SECRET_FILE` với default mount `sepay-ipn-secret.key`. | Existing mounted payment-secret paths. |
| `apps/api/src/modules/filesystem/utils/mount-secrets.ts` | MODIFY — thêm reader trim cho IPN secret. | `getSepayApiKey` và optional secret readers. |
| `apps/api/src/modules/filesystem/mount.service.ts` | MODIFY — expose `sepayIpnSecret()`. | Existing explicit mount service surface. |
| `apps/api/src/modules/exceptions/errors/payment/invalid-sepay-ipn-secret.ts` | ADD — domain 401 cho header thiếu hoặc không khớp. | Exception canon + official SePay authentication result. |
| `apps/api/src/modules/exceptions/errors/payment/sepay-ipn-secret-not-configured.ts` | ADD — domain 500 khi server chưa mount secret. | Existing admin-key not-configured sibling. |
| `apps/api/src/features/api/core/http/sepay/webhook/webhook.guard.ts` | ADD — đọc `x-secret-key`, fail closed và so sánh constant-time. | Transport canon; authentication không đi vào business handler. |
| `apps/api/src/features/api/core/http/sepay/webhook/webhook.guard.spec.ts` | ADD — twin spec cho mọi nhánh guard. | Testing canon. |
| `apps/api/src/features/api/core/http/sepay/webhook/webhook.controller.ts` | MODIFY — gắn guard, `@HttpCode(200)`, sửa OpenAPI và chỉ log metadata an toàn. | Existing SePay controller + PayOS logging sibling. |
| `apps/api/src/features/api/core/http/sepay/webhook/webhook.module.ts` | MODIFY — đăng ký guard trong operation module. | Existing operation wiring. |
| `apps/api/src/features/api/core/http/sepay/webhook/webhook.handler.ts` | MODIFY — không log full body; ACK unknown/already-settled invoice sau auth, vẫn verify paid/amount qua Order Detail trước grant. | PayOS probe/replay tolerance sibling + existing authoritative verification. |
| `apps/api/src/features/api/core/http/sepay/webhook/webhook.handler.spec.ts` | ADD — twin spec exhaustive cho handler branches bị đóng băng. | CQRS-7 / Apply twin gate. |
| `test/e2e/payment-sepay.e2e-spec.ts` | MODIFY — drive production HTTP guard, HTTP 200, real primary Postgres grant, replay và refusal cases. | Existing SePay flow E2E. |
| `.stacks/dev/runtime/files/sepay-ipn-secret.key.enc` | ADD — test IPN secret dưới SOPS; không commit plaintext. | Payment secret ownership. |
| `.stacks/dev/runtime/env/KEYS.md` | MODIFY — phân biệt merchant API secret và inbound IPN secret. | Stack contract documentation. |

### HANDLER TEST MATRIX

| Case | Expected proof |
|---|---|
| Header absent | Guard throws `InvalidSepayIpnSecretException`; handler and database untouched. |
| Header array | First value is normalized; exact first value passes. |
| Mounted secret absent/blank | Guard throws `SepayIpnSecretNotConfiguredException`; fails closed. |
| Header wrong, same length | 401; proves content comparison. |
| Header wrong, different length | 401 without `timingSafeEqual` length exception. |
| Header exact | Guard returns true. |
| Authenticated payload missing invoice | Named transaction-not-found failure; no SDK call/write. |
| Authenticated unknown invoice | HTTP 200 ACK, safe ignored log, no SDK call/write. |
| Paid order detail | HTTP 200; real transaction succeeds and membership is active. |
| Order detail unpaid | Reject; transaction stays pending, no membership. |
| Reported amount below transaction amount | Reject underpayment; no grant. |
| Expired transaction | Reject; no grant. |
| Unsupported action type | Named domain exception; no grant. |
| Replay after first settlement | HTTP 200 twice; exactly one membership row. |
| Log proof | No assertion or implementation logs raw body, secret, customer or transaction object. |

### LIVE PROOF

| Boundary | Command/result required in Apply |
|---|---|
| Local API | POST without/wrong secret returns 401; exact secret with unknown invoice returns 200 and grants nothing. |
| Public tunnel | Same cases against `https://demo.studywithmiaenglish.vn/api/v1/sepay/webhook`. |
| Runtime log | No secret or full body appears; tunnel/network has no failure. |
| Database | E2E reads real primary PostgreSQL after success, refusal and replay. |

### OUTPUTS

| Concept | Result |
|---|---|
| SePay IPN brief r1 | Tách inbound IPN authentication khỏi merchant API authentication; xác thực ở transport trước CQRS. |
| ACK contract | Callback hợp lệ và replay/unknown vô hại trả 200; payload malformed hoặc payment chưa hợp lệ không grant. |
| Secret ownership | Test IPN secret ở encrypted stack riêng; không dùng lại merchant API secret. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/miamia/sepay-ipn-auth-and-ack.md` | added — evidence, exact production tree, test matrix và live proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| ACK invoice không tồn tại/already-settled sau khi secret hợp lệ? | **A — Trả 200 và log ignored (khuyến nghị, tránh SePay retry vô hạn)**; B — Trả 4xx như hiện tại. |
| Secret trong ảnh test đã lộ được dùng thế nào? | **A — Dùng tạm trong encrypted dev stack, bắt buộc rotate trước production (khuyến nghị theo “tài khoản test”)**; B — Dừng để thầy tạo secret mới ngay. |

### WARNINGS

| Warning | Impact |
|---|---|
| IPN secret trong ảnh đã lộ và có entropy thấp. | Chỉ phù hợp local/test; không được promoted sang production. |
| Merchant secret ở tab “Thông tin đơn vị” khác IPN secret. | Dùng nhầm sẽ làm outbound Order Detail hoặc inbound guard hỏng. |
| API hiện log full SePay payload hai lần. | PII/payment metadata có thể vào log; r1 loại bỏ. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Dùng URL root `https://demo.studywithmiaenglish.vn` | `/api/v1/sepay/webhook` | Root không phải POST controller route. |
| Giữ Auth Type “Không có” | `Secret Key` + `X-Secret-Key` guard | SePay hỗ trợ header chính thức và public endpoint cần fail closed. |
| Dùng merchant API secret làm IPN secret | Hai mounted secrets riêng | Hai credential có hướng sử dụng và quyền khác nhau. |

### OWED

| Owed | Cleared by |
|---|---|
| Review exact boundary và ACK policy. | `starci-be-feature-review`. |
| Production source, encrypted secret và proof. | Explicit approval rồi `starci-be-feature-apply`. |

## review r1

Revision: `sepay-ipn-auth-and-ack-review-r1`.

Approved revision: sepay-ipn-auth-and-ack-review-r1.

Approved choices: A/A — ACK unknown/replay sau auth và dùng test secret tạm trong encrypted dev stack.

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
| Purpose | Phản biện brief SePay IPN và khóa exact production boundary trước Apply. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\sepay-ipn-auth-and-ack.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; không sửa production source. |

### REVIEW VERDICT

| Concern | Verdict |
|---|---|
| Transport boundary | Guard là owner đúng; không truyền IPN secret vào command/handler. |
| Secret compare | Constant-time với explicit length guard; không log expected/actual. |
| Data trust | Header chỉ chứng minh caller; paid state và amount vẫn phải lấy từ `order.retrieve`. |
| HTTP ACK | Controller khóa 200; unknown/replay sau auth ACK 200 nhưng không grant. |
| Database | Chỉ primary PostgreSQL; không entity/migration/schema change. |
| Runtime | Public route là `/api/v1/sepay/webhook`; tunnel hiện trỏ đúng API 3071. |
| Logging | Chỉ notification type, invoice và safe status; loại full body khỏi controller/handler. |
| Scope | Không đổi PayOS, pricing, checkout, frontend hay SePay merchant API key. |

### FROZEN PRODUCTION BOUNDARY

| Tree | Allowed delta |
|---|---|
| `apps/api/src/modules/env/config.ts` | Add IPN secret mount path only. |
| `apps/api/src/modules/filesystem/utils/mount-secrets.ts` | Add trimmed IPN secret reader only. |
| `apps/api/src/modules/filesystem/mount.service.ts` | Add `sepayIpnSecret()` only. |
| `apps/api/src/modules/exceptions/errors/payment/invalid-sepay-ipn-secret.ts` | Add 401 domain exception. |
| `apps/api/src/modules/exceptions/errors/payment/sepay-ipn-secret-not-configured.ts` | Add 500 configuration exception. |
| `apps/api/src/features/api/core/http/sepay/webhook/webhook.guard.ts` | Add `X-Secret-Key` transport guard. |
| `apps/api/src/features/api/core/http/sepay/webhook/webhook.guard.spec.ts` | Add exhaustive guard twin. |
| `apps/api/src/features/api/core/http/sepay/webhook/webhook.controller.ts` | Guard + 200 + safe metadata log only. |
| `apps/api/src/features/api/core/http/sepay/webhook/webhook.module.ts` | Register guard only. |
| `apps/api/src/features/api/core/http/sepay/webhook/webhook.handler.ts` | Safe logs + unknown/replay ACK only; preserve payment verification/grant rules. |
| `apps/api/src/features/api/core/http/sepay/webhook/webhook.handler.spec.ts` | Add exhaustive handler twin. |
| `test/e2e/payment-sepay.e2e-spec.ts` | Update auth/status/replay flow against real primary PostgreSQL. |
| `.stacks/dev/runtime/files/sepay-ipn-secret.key.enc` | Add SOPS-encrypted test secret only. |
| `.stacks/dev/runtime/env/KEYS.md` | Document distinct IPN secret owner. |

### OUTPUTS

| Concept | Result |
|---|---|
| Review r1 | Kiến trúc đủ khóa để Apply không phải quyết định thêm file, status, secret owner hoặc refusal behavior. |
| Security model | Hai lớp: `X-Secret-Key` xác thực nguồn, Order Detail xác minh trạng thái/amount trước mutation. |
| Runtime contract | SePay cấu hình HTTPS public, Secret Key, JSON; API ACK đúng 200. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/miamia/sepay-ipn-auth-and-ack.md` | modified — appended Review r1 và frozen production boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Duyệt revision để Apply | Gửi `Duyệt sepay-ipn-auth-and-ack-review-r1, A/A` để chọn ACK unknown/replay và dùng test secret tạm; hoặc ghi lựa chọn khác. |

### WARNINGS

| Warning | Impact |
|---|---|
| Test secret đã xuất hiện trong ảnh. | Apply có thể chứng minh local/test nhưng OWED rotate vẫn mở cho đến khi thay secret production. |
| Full live paid transaction cần đơn SePay thật. | Apply vẫn chứng minh paid flow qua E2E real PostgreSQL và public auth/ACK live call không mutation; giao dịch tiền thật là gate riêng. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Verify secret bên trong handler | Transport guard trước CQRS | Request giả không được phép chạm business flow hoặc database. |
| Chỉ đổi `.expect(201)` thành 200 | Guard + ACK + replay semantics + safe logs | Đổi status đơn lẻ không sửa xác thực hoặc retry behavior. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval exact revision và A/A. | Owner gửi câu duyệt. |
| Baseline commit trước production edit. | `starci-be-feature-apply` sau approval. |
| Source, twin specs, E2E và public live proof. | Apply hoàn tất frozen boundary. |

## apply r1

Applied revision: `sepay-ipn-auth-and-ack-review-r1`.

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
| Database | PostgreSQL primary |
| Repo / branch | D:\Repositories\mia-mia-backend @ main |
| Baseline | `aadf1c0` |
| Implementation commit | `7704ce7` |
| Purpose | Apply `sepay-ipn-auth-and-ack-review-r1` theo lựa chọn A/A. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\sepay-ipn-auth-and-ack.md |
| Language | vi |
| Phase | apply |
| Touching | Đúng 14 path production đã khóa trong Review r1; workflow ghi ở Source. |

### PROOF

| Gate | Result |
|---|---|
| Guard + handler twin specs | PASS — 2 suites, 13/13 tests. |
| Flow E2E | PASS — 6/6 qua production HTTP boundary và PostgreSQL primary thật; gồm grant, malformed, unknown, replay, thiếu/sai secret. |
| Full unit | PASS — 120/120 suites, 570/570 tests. |
| Build | PASS — `nest build api`, webpack compile thành công. |
| Full lint | PASS về gate lỗi — 0 errors; còn 470 warnings lịch sử. |
| Focused lint | 0 errors; 2 warnings do rule canonical đang yêu cầu cây `src/modules/platform/exceptions/errors` không tồn tại trong family hiện tại. |
| Diff | `git diff --check` PASS trước commit; staged list khớp đúng 14 path frozen. |
| Local live call | Thiếu secret = HTTP 401; secret đúng + invoice lạ = HTTP 200, không mutation. |
| Public tunnel | `https://demo.studywithmiaenglish.vn/api/v1/sepay/webhook`: thiếu secret = HTTP 401; secret đúng + invoice lạ = HTTP 200. |
| Secret | Test IPN secret được nhập bằng hidden prompt, lưu SOPS `.enc`; plaintext mount bị git ignore và không commit. |

### OUTPUTS

| Concept | Result |
|---|---|
| SePay IPN authentication | `X-Secret-Key` được xác thực constant-time tại transport guard trước CQRS và database. |
| ACK contract | Request hợp lệ trả 200; unknown/replay đã auth được ACK vô hại, không gọi Order Detail và không grant. |
| Payment trust | Paid status và amount vẫn được xác minh qua SePay Order Detail trước mutation. |
| Runtime | Local API và public Cloudflare hostname cùng đạt refusal/ACK contract. |

### CHANGES

| Tree | Details |
|---|---|
| `apps/api/src/modules/env/config.ts` | modified — thêm default path `SEPAY_IPN_SECRET_FILE`. |
| `apps/api/src/modules/filesystem/utils/mount-secrets.ts` | modified — reader trim cho IPN secret. |
| `apps/api/src/modules/filesystem/mount.service.ts` | modified — expose `sepayIpnSecret()`. |
| `apps/api/src/modules/exceptions/errors/payment/invalid-sepay-ipn-secret.ts` | added — domain 401 cho header thiếu/sai. |
| `apps/api/src/modules/exceptions/errors/payment/sepay-ipn-secret-not-configured.ts` | added — fail closed khi server chưa mount secret. |
| `apps/api/src/features/api/core/http/sepay/webhook/webhook.guard.ts` | added — constant-time `X-Secret-Key` guard với length check. |
| `apps/api/src/features/api/core/http/sepay/webhook/webhook.guard.spec.ts` | added — 6 guard cases. |
| `apps/api/src/features/api/core/http/sepay/webhook/webhook.controller.ts` | modified — guard, HTTP 200 và safe metadata logs. |
| `apps/api/src/features/api/core/http/sepay/webhook/webhook.module.ts` | modified — đăng ký guard. |
| `apps/api/src/features/api/core/http/sepay/webhook/webhook.handler.ts` | modified — bỏ raw payload logs và ACK unknown/replay. |
| `apps/api/src/features/api/core/http/sepay/webhook/webhook.handler.spec.ts` | added — 7 tests phủ mọi nhánh handler đã khóa. |
| `test/e2e/payment-sepay.e2e-spec.ts` | modified — auth/refusal/200/replay và real PostgreSQL proof. |
| `.stacks/dev/runtime/files/sepay-ipn-secret.key.enc` | added — test secret mã hóa SOPS, tách merchant secret. |
| `.stacks/dev/runtime/env/KEYS.md` | modified — ghi ownership và default mount contract. |

### NEED APPROVALS

| Question | Options |
|---|---|
| SePay dashboard | Đổi IPN URL thành `https://demo.studywithmiaenglish.vn/api/v1/sepay/webhook`, giữ Secret Key hiện tại và `application/json`; backend đã sẵn sàng nhận. |

### WARNINGS

| Warning | Impact |
|---|---|
| Secret test đã từng xuất hiện trong ảnh và entropy thấp. | Chỉ dùng demo/local; phải rotate trước production. |
| Focused E2E app không lắp production exception filter. | Hai refusal hiện thành >=400 trong focused harness; live runtime đầy đủ đã chứng minh chính xác 401. |
| `npm run sync` còn báo các REQUIRED key lịch sử khác thiếu. | Không liên quan IPN secret; default mount mới đã decrypt và live guard đọc thành công. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Log raw IPN body | Chỉ log notification type, invoice, order status | Tránh lộ payer/card/customer/payment metadata. |
| ACK 4xx cho unknown/replay đã auth | HTTP 200, không mutation | Chặn retry vô hạn và giữ idempotency. |
| Dùng merchant API key cho inbound auth | IPN secret mount riêng | Credential có hướng dùng và quyền khác nhau. |

### OWED

| Owed | Cleared by |
|---|---|
| Rotate test IPN secret trước production. | Tạo secret mạnh mới trong SePay và chạy `stack-secret set` lại. |
| Xác nhận một callback paid thật từ SePay dashboard. | Tạo đơn test thật; đối chiếu IPN log an toàn, transaction succeeded và entitlement đúng một lần. |
| Cập nhật IPN URL trong SePay dashboard nếu vẫn đang để hostname root. | Owner lưu exact route `/api/v1/sepay/webhook`. |
