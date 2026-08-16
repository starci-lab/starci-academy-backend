<!-- starci-workflow: v2 -->
# Chuẩn hóa độ tin cậy thanh toán StarCi và MiaMia

## plan r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets: StarCi Academy + MiaMia |
| Frontend | D:\Repositories\starci-academy-fe; D:\Repositories\miamia-fe |
| Backend | D:\Repositories\starci-academy-backend; D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-miamia-payments — StarCi Nest app `core`; MiaMia Nest app `api` |
| Database | PostgreSQL `primary` riêng của từng backend |
| Repo / branch | D:\Repositories\starci-academy-backend @ mtp; D:\Repositories\mia-mia-backend @ main |
| Purpose | Thiết kế một state machine checkout → webhook → provider reconcile → cấp quyền thống nhất cho SePay và PayOS ở cả hai app. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-miamia-payments\payment-reliability.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; không sửa source, schema, stack, credential hay dữ liệu thanh toán. |

### EVIDENCE

| Nguồn | Bằng chứng |
|---|---|
| StarCi schema | Runtime `localhost:3001` không chạy; đã liệt kê toàn bộ operation folder. Không có query trạng thái thanh toán tổng quát theo transaction của chính user. |
| MiaMia schema | Đã dump unfiltered toàn bộ mutation và query từ `localhost:3071/graphql`; có `purchaseMembership`, `purchaseExamDownloadPackage`, nhưng không có query trạng thái thanh toán tổng quát. |
| StarCi SePay | `src/features/api/core/http/sepay/webhook/webhook.handler.ts` tự gọi `sepay.order.retrieve`, tự kiểm tra số tiền và tự cấp quyền theo `ActionType`; controller chưa có guard `X-Secret-Key`. |
| StarCi PayOS | `src/features/api/core/http/payos/webhook/webhook.handler.ts` verify signature rồi tự cấp quyền theo `ActionType`. |
| StarCi fallback | `transaction-reconcile-query.service.ts` gọi API PayOS/SePay; worker poll và cấp quyền; `reconcile-transaction-boot-sweep.service.ts` khôi phục các transaction `Pending` quá hạn sau restart. |
| MiaMia webhook | SePay đã có `X-Secret-Key` guard và ACK 200; SePay/PayOS handler vẫn tự cấp membership hoặc exam-download entitlement. |
| MiaMia fallback | Worker đã gọi API PayOS/SePay khi webhook không tới, nhưng module chưa có boot sweep. |
| Cả hai worker | `TransactionReconcileStatus` đang gộp “provider còn pending” và “không gọi được provider” thành `unknown`; khi hết attempt, đa số payment bị đổi sang `Unpaid`. |
| Queue | `EnqueueReconcileTransactionJobService` dùng UUID làm `jobId`, nên callback lặp có thể tạo nhiều poll cùng attempt; guard/idempotent grant giảm thiệt hại nhưng không chống gọi provider thừa. |
| SePay chính thức | Payment Gateway IPN dùng public HTTPS, `X-Secret-Key`, JSON và HTTP 200 để ACK; Order Detail API là nguồn kiểm tra trạng thái/amount phía server. |
| PayOS chính thức | Webhook phải verify signature và ACK 2xx; Payment Request API đọc trạng thái authoritative; endpoint confirm-webhook dùng để đăng ký URL. |

### ARCHITECTURE CONCEPT

| Stage | Owner duy nhất | Luật r1 đề xuất |
|---|---|---|
| Checkout | Mutation hiện hữu | Tạo reference bất biến, snapshot `actionType`/product/amount, lưu `Pending` trước, sau đó enqueue reconcile. Return/cancel URL lấy từ server allowlist, không tin URL tùy ý từ client. |
| Webhook transport | SePay/PayOS controller + guard/verify | Chỉ xác thực nguồn, parse reference, tìm transaction và phát một wake-up reconcile tức thời. Không cấp quyền và không coi redirect/webhook body là bằng chứng paid. Unknown/replay/terminal được log an toàn và ACK 200/2xx. |
| Provider adapter | `TransactionReconcileQueryService` | Gọi `PayOS paymentRequests.get` hoặc `SePay order.retrieve`; chuẩn hóa thành `paid`, `terminal-unpaid`, `pending`, `unavailable`, kèm amount/provider status đã parse. |
| Settlement | `ReconcileTransactionWorker` | Là nơi duy nhất switch `ActionType`, kiểm tra amount/expiry, claim transaction và cấp quyền idempotent. Webhook, delayed poll và boot sweep đều đi qua owner này. |
| Recovery | Queue + boot sweep | Checkout tạo delayed poll; webhook tạo immediate wake-up; boot sweep cứu pending bị mất job sau restart. Job wake-up phải dedupe theo transaction/attempt. |
| Unknown policy | Worker | Chỉ provider xác nhận cancelled/expired/failed mới được ghi `Unpaid`. Timeout, 5xx, network error hoặc payload không hiểu phải giữ `Pending`, chuyển sang nhịp slow sweep và cảnh báo vận hành. |
| Return UX contract | Query auth-gated | `myPaymentStatus(transactionId)` chỉ đọc transaction thuộc user hiện tại; FE hiển thị `Đang xác nhận`, poll DB status và không cấp UI success chỉ vì browser quay về return URL. |

### STATE MATRIX

| Input | Normalized state | Transaction write | Tiếp theo |
|---|---|---|---|
| API provider xác nhận đủ tiền | `paid` | Guarded `Pending → Succeeded` bên trong grant idempotent | Cấp đúng entitlement/action một lần, gửi side-effect một lần. |
| API provider xác nhận cancelled/expired/failed | `terminal-unpaid` | Guarded `Pending → Unpaid` | Release reservation/voucher và thông báo thất bại một lần. |
| API provider báo pending/processing | `pending` | Không đổi | Retry có backoff; boot sweep tiếp quản nếu job mất. |
| API timeout/5xx/network/payload lạ | `unavailable` | Không đổi | Slow retry + operational warning; tuyệt đối không đổi thành `Unpaid`. |
| Webhook đúng auth/signature, reference lạ | wake-up bị bỏ qua | Không đổi | Log metadata tối thiểu, ACK thành công để tránh retry storm. |
| Webhook replay hoặc transaction terminal | replay | Không đổi | ACK thành công, không gọi grant lại. |
| Hai worker chạy đồng thời | concurrent paid | Chỉ một guarded claim thắng | Worker còn lại no-op; entitlement, email, voucher không lặp. |

### PROPOSED FILE TREE — STARCI

| Path | Vai trò / căn cứ hình dạng |
|---|---|
| `src/modules/bussiness/transactions/types/transaction.ts` | Thay union 3 trạng thái bằng discriminated result `paid | terminal-unpaid | pending | unavailable`, mang amount/status cần thiết. |
| `src/modules/bussiness/transactions/atomic/transaction-reconcile-query.service.ts` | Provider adapter duy nhất cho SePay/PayOS và các provider StarCi khác; không swallow mọi exception thành một `unknown`. |
| `src/modules/bussiness/transactions/atomic/transaction-reconcile-query.service.spec.ts` | Khóa mọi provider state, underpayment evidence, pending và unavailable. |
| `src/modules/bussiness/jobs/enqueue/reconcile-transaction.service.ts` | Thêm immediate wake-up và deterministic dedupe key theo transaction/attempt. |
| `src/modules/bussiness/jobs/enqueue/reconcile-transaction.service.spec.ts` | Chứng minh delayed/immediate, disabled switch và duplicate wake-up không tạo retry storm. |
| `src/features/api/processors/reconcile-transaction/reconcile-transaction.worker.ts` | Settlement owner duy nhất; nhận normalized result, kiểm amount, guarded claim, switch toàn bộ `ActionType`, không đổi unavailable thành `Unpaid`. |
| `src/features/api/processors/reconcile-transaction/reconcile-transaction.worker.spec.ts` | Khóa paid/unpaid/pending/unavailable, hết retry, replay, concurrent second writer và mọi `ActionType` StarCi. |
| `src/features/api/processors/reconcile-transaction/reconcile-transaction-boot-sweep.service.ts` | Duy trì recovery, bổ sung slow-sweep policy cho pending lâu. |
| `src/features/api/processors/reconcile-transaction/reconcile-transaction-boot-sweep.service.spec.ts` | Chứng minh pagination, fresh/overdue/long-pending, queue failure và restart recovery. |
| `src/features/api/core/http/sepay/webhook/webhook.guard.ts` | Guard `X-Secret-Key`, mirror MiaMia đã chứng minh. |
| `src/features/api/core/http/sepay/webhook/webhook.guard.spec.ts` | Missing/wrong/right secret và không log secret. |
| `src/features/api/core/http/sepay/webhook/webhook.controller.ts` | Gắn guard, explicit HTTP 200. |
| `src/features/api/core/http/sepay/webhook/webhook.module.ts` | Register guard. |
| `src/features/api/core/http/sepay/webhook/webhook.handler.ts` | Rút về authenticated wake-up; bỏ provider call và toàn bộ grant switch. |
| `src/features/api/core/http/sepay/webhook/webhook.handler.spec.ts` | Missing reference, unknown, replay, pending và duplicate delivery đều ACK/queue đúng. |
| `src/features/api/core/http/payos/webhook/webhook.handler.ts` | Verify signature rồi wake-up; bỏ grant switch. |
| `src/features/api/core/http/payos/webhook/webhook.handler.spec.ts` | Probe, invalid signature, unsuccessful event, unknown, replay và duplicate. |
| `src/modules/platform/env/config.ts` | Khai báo mount path SePay IPN secret. |
| `src/modules/filesystem/mount.service.ts` | Expose secret qua mount service, mirror MiaMia. |
| `src/modules/filesystem/utils/mount-secrets.ts` | Đọc secret từ mount; không thêm plaintext env fallback. |
| `src/modules/platform/exceptions/errors/payment/invalid-sepay-ipn-secret.ts` | Typed 401 cho secret sai. |
| `src/modules/platform/exceptions/errors/payment/sepay-ipn-secret-not-configured.ts` | Typed configuration failure khi thiếu secret. |
| `.stacks/dev/runtime/env/KEYS.md` | Ghi contract key, không ghi giá trị. |
| `.stacks/dev/runtime/files/sepay-ipn-secret.key.enc` | Encrypted secret mount; phải dùng secret đã rotate, không tái dùng secret lộ. |
| `src/features/api/core/graphql/queries/payments/payments.module.ts` | Query group mới, mirror domain-group module hiện hữu. |
| `src/features/api/core/graphql/queries/payments/payments.module-definition.ts` | Configurable module definition. |
| `src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.query.ts` | CQRS query mang transaction id và current user id. |
| `src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.handler.ts` | Owner-scoped DB read; not-found cho transaction người khác để không leak. |
| `src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.handler.spec.ts` | Own/not-found/foreign/terminal/pending cases. |
| `src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.service.ts` | Service dispatch query, mirror operation sibling. |
| `src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.resolver.ts` | Auth guard, throttle và GraphQL response. |
| `src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.module.ts` | Register resolver/service/handler. |
| `src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.module-definition.ts` | Configurable module definition. |
| `src/features/api/core/graphql/queries/payments/my-payment-status/graphql-types/request.ts` | Typed transaction id input. |
| `src/features/api/core/graphql/queries/payments/my-payment-status/graphql-types/response.ts` | Public status contract không lộ provider payload/secret. |
| `src/features/api/core/graphql/queries/queries.module.ts` | Register payment query group. |
| `test/e2e/payment-reliability.e2e-spec.ts` | Flow checkout → missed webhook → API reconcile → status query; callback replay/concurrency. |

### PROPOSED FILE TREE — MIAMIA

| Path | Vai trò / căn cứ hình dạng |
|---|---|
| `apps/api/src/modules/bussiness/transactions/types/transaction.ts` | Cùng normalized result 4 nhánh với StarCi. |
| `apps/api/src/modules/bussiness/transactions/atomic/transaction-reconcile-query.service.ts` | Cùng adapter contract cho PayOS/SePay. |
| `apps/api/src/modules/bussiness/transactions/atomic/transaction-reconcile-query.service.spec.ts` | Bổ sung spec hiện còn thiếu parity. |
| `apps/api/src/modules/bussiness/jobs/enqueue/reconcile-transaction.service.ts` | Immediate wake-up + deterministic dedupe. |
| `apps/api/src/modules/bussiness/jobs/enqueue/reconcile-transaction.service.spec.ts` | Queue contract tests. |
| `apps/api/src/features/api/processors/reconcile-transaction/reconcile-transaction.worker.ts` | Settlement owner duy nhất cho membership và exam-download package. |
| `apps/api/src/features/api/processors/reconcile-transaction/reconcile-transaction.worker.spec.ts` | Toàn bộ state/action/replay/concurrency cases. |
| `apps/api/src/features/api/processors/reconcile-transaction/reconcile-transaction-boot-sweep.service.ts` | Port shape boot sweep đã chạy ở StarCi, dùng import aliases MiaMia. |
| `apps/api/src/features/api/processors/reconcile-transaction/reconcile-transaction-boot-sweep.service.spec.ts` | Port test matrix và thêm long-pending slow sweep. |
| `apps/api/src/features/api/processors/reconcile-transaction/reconcile-transaction.module.ts` | Register boot sweep. |
| `apps/api/src/features/api/core/http/sepay/webhook/webhook.handler.ts` | Giữ guard hiện tại, rút handler về enqueue wake-up. |
| `apps/api/src/features/api/core/http/sepay/webhook/webhook.handler.spec.ts` | Khóa ACK/queue/replay/unknown. |
| `apps/api/src/features/api/core/http/payos/webhook/webhook.handler.ts` | Verify signature rồi enqueue wake-up. |
| `apps/api/src/features/api/core/http/payos/webhook/webhook.handler.spec.ts` | Khóa probe/signature/status/replay/duplicate. |
| `apps/api/src/features/api/core/graphql/queries/payments/payments.module.ts` | Query group mới. |
| `apps/api/src/features/api/core/graphql/queries/payments/payments.module-definition.ts` | Configurable module definition. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.query.ts` | CQRS query current-user scoped. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.handler.ts` | Đọc đúng PostgreSQL primary và chống IDOR. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.handler.spec.ts` | Own/foreign/not-found/all statuses. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.service.ts` | Dispatch query. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.resolver.ts` | Auth-gated transport. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.module.ts` | Operation module. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.module-definition.ts` | Configurable module definition. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/graphql-types/request.ts` | Transaction id input. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/graphql-types/response.ts` | Public normalized status. |
| `apps/api/src/features/api/core/graphql/queries/queries.module.ts` | Register payment query group. |
| `test/e2e/payment-reliability.e2e-spec.ts` | Membership + download package, SePay + PayOS, missed webhook/replay/concurrency. |

### TEST MATRIX

| Gate | Cases bắt buộc |
|---|---|
| SePay transport | Missing/wrong/right `X-Secret-Key`; payload thiếu invoice; unknown invoice; replay terminal; không log body/secret; explicit 200. |
| PayOS transport | Invalid signature; validation probe; `code != 00`; thiếu orderCode; unknown; replay; explicit 2xx. |
| Provider adapters | Mọi status PayOS và SePay; đủ tiền/thiếu tiền; pending; timeout; 4xx/5xx; payload lạ; provider mismatch. |
| Queue | Delayed poll; immediate webhook wake-up; duplicate callback dedupe; disabled reconcile; enqueue failure; restart recovery. |
| Settlement | Not-found; already terminal; paid; terminal-unpaid; pending; unavailable trước/sau max attempts; concurrent second writer. |
| Action enum StarCi | `AiSubscriptionPurchase`, `MembershipPurchase`, `Enroll`, `InstallmentPayment`, unsupported/malformed snapshot. |
| Action enum MiaMia | `MembershipPurchase`, `ExamDownloadPackagePurchase`, unsupported/malformed snapshot. |
| Side effects | Entitlement/enroll/status/email/notification/voucher chỉ một lần dù webhook + poll + boot sweep đụng cùng transaction. |
| GraphQL status | Anonymous; owner; foreign id; not-found; Pending/Succeeded/Unpaid; không lộ provider raw payload. |
| E2E live | Mỗi app: một checkout PayOS và một checkout SePay; tắt webhook giả lập rồi provider API reconcile; callback lặp; restart trước poll; status query chuyển đúng. |

### ASSUMPTIONS AND EXCLUSIONS

| Type | Nội dung |
|---|---|
| Assumption | Provider API server-to-server là nguồn xác nhận authoritative; webhook chỉ là tín hiệu giảm latency. |
| Assumption | Grant service hiện hữu của từng `ActionType` có/được bổ sung guarded idempotency theo transaction id. |
| Exclusion | Không dùng BankHub webhook của SePay thay cho Payment Gateway IPN. |
| Exclusion | Không đưa credential, raw callback body, payer data hoặc provider response đầy đủ vào log/workflow. |
| Exclusion | Chưa thiết kế màn hình FE return/success trong backend plan này; chỉ khóa query contract. |
| Exclusion | Chưa tạo link thanh toán thật 10.000đ và chưa settle giao dịch thật trong phase Plan. |

### OUTPUTS

| Concept | Result |
|---|---|
| Payment reliability brief | Một state machine chung cho StarCi/MiaMia, SePay/PayOS: webhook authenticated wake-up, provider API authoritative reconcile, worker là settlement owner duy nhất. |
| Recovery model | Delayed poll + immediate wake-up + boot sweep; lỗi provider không còn bị hiểu nhầm là khách chưa trả tiền. |
| UX contract | Query owner-scoped cho FE hiển thị trạng thái xác nhận thật thay vì tin return URL. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-miamia-payments/payment-reliability.md` | `added` — brief r1, evidence, state matrix, exact proposed trees và test matrix; không sửa product source. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Khi provider API unavailable sau fast retry budget, transaction ở trạng thái nào? | **A (đề xuất):** giữ DB `Pending`, chuyển slow sweep + cảnh báo vận hành; không migration. **B:** thêm `ReviewRequired`, cần enum/migration/GraphQL/FE ở cả hai app. |
| Webhook có cấp quyền trực tiếp không? | **A (đề xuất):** không; verify/auth rồi immediate enqueue + ACK, worker gọi provider API và settle. **B:** webhook gọi provider API đồng bộ qua cùng settlement owner, queue chỉ fallback; latency callback cao hơn. |
| Cách triển khai sau Review? | **A (đề xuất):** ba boundary tuần tự: reliability core StarCi, reliability core MiaMia, status contract + FE return UX; test chéo sau mỗi boundary. **B:** một Apply cross-repo lớn. |

### WARNINGS

| Warning | Impact |
|---|---|
| StarCi runtime schema không available ở `localhost:3001`; Plan dùng toàn bộ operation tree thay thế theo skill. | Review phải re-dump live schema trước khi duyệt Apply. |
| StarCi SePay chưa có IPN secret guard; MiaMia secret test từng lộ trong ảnh. | Phải rotate và mount encrypted secret trước live callback; không tái dùng secret cũ. |
| UUID queue job hiện không dedupe callback trùng. | Có thể phát sinh nhiều provider API call đồng thời dù grant cuối cùng idempotent. |
| `unknown` hiện gộp pending và outage rồi có thể thành `Unpaid`. | Có nguy cơ đóng nhầm giao dịch đã trả khi provider lỗi hoặc callback chậm. |
| Logic cấp quyền đang trùng giữa webhook và worker. | Thêm `ActionType` ở một đường nhưng quên đường kia gây paid nhưng thiếu entitlement. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Tin webhook body hoặc browser return là bằng chứng paid. | Query provider API server-to-server rồi guarded settlement. | Callback có thể replay/tamper; redirect chỉ phản ánh navigation, không phản ánh settlement. |
| Đổi sang `Unpaid` vì hết retry khi provider unavailable. | Giữ Pending/slow sweep hoặc explicit review state. | Không biết trạng thái không đồng nghĩa chưa thanh toán. |
| Duy trì grant switch riêng ở từng webhook. | Một settlement owner trong reconcile worker. | Hai đường đã drift về action support và side effects. |

### OWED

| Owed | Cleared by |
|---|---|
| Chốt ba quyết định A/B ở `NEED APPROVALS`. | Feedback của thầy và `$starci-be-feature-review`. |
| Re-dump StarCi live query/mutation schema. | Start StarCi API rồi chạy unfiltered GraphQL introspection trước Review approval. |
| Khóa exact diff theo từng boundary, bao gồm config/stack secret rotation. | `starci-be-feature-review` tạo revision được duyệt cho từng Apply. |
| Thiết kế FE return/pending/success/failure cho cả hai app. | Workflow riêng qua `starci-fe-design-plan` sau khi query contract được duyệt. |
| Live 10.000đ settlement, replay callback và entitlement exactly-once. | Apply xong, rotate secret, tunnel live và chạy giao dịch thật có đối soát. |

### FEEDBACK 2026-08-17

| Decision | Result |
|---|---|
| Settlement evidence | Chốt: webhook chỉ xác thực và đánh thức reconcile; provider API mới quyết định `paid`, `terminal-unpaid`, `pending` hoặc `unavailable`. |
| Direct webhook grant | Bác bỏ: webhook không gọi grant/entitlement trực tiếp. |
| Review input | Giữ nguyên Architecture Concept A làm binding input cho `starci-be-feature-review`; Review còn phải khóa unavailable policy và rollout boundary. |

## review r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets: StarCi Academy + MiaMia |
| Frontend | D:\Repositories\starci-academy-fe; D:\Repositories\miamia-fe |
| Backend | D:\Repositories\starci-academy-backend; D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-miamia-payments |
| Repo / branch | D:\Repositories\starci-academy-backend @ mtp; D:\Repositories\mia-mia-backend @ main |
| Purpose | Review và khóa boundary đầu tiên của rollout A: reliability core StarCi, không mở source MiaMia/FE trong Apply này. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-miamia-payments\payment-reliability.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; không sửa production source. |

Revision identity: `payment-reliability-review-r1`

Approved revision: `payment-reliability-review-r1`

Approval evidence: thầy trả lời `tiếp tục` ngay sau khi được yêu cầu duyệt revision và production boundary này.

### REVIEW FINDINGS

| Finding | Verdict |
|---|---|
| Webhook settlement | Giữ quyết định đã chốt: SePay guard/PayOS signature chỉ cho phép callback tạo immediate wake-up; không handler nào cấp entitlement trực tiếp. |
| Provider truth | `TransactionReconcileQueryService` phải trả discriminated result; `pending` và `unavailable` không còn dùng chung `unknown`. |
| Exhaustion | Chốt A: provider unavailable giữ transaction `Pending`; sau fast budget worker tự enqueue slow retry, boot sweep cứu job mất sau restart. Không thêm enum/migration `ReviewRequired`. |
| Rollout | Chốt A: revision này chỉ mở StarCi reliability core. MiaMia parity và payment-status/FE là hai review/apply boundary nối tiếp. |
| Queue dedupe | Sửa Plan: không dùng deterministic `jobId` cố định vì completed job có thể chặn retry hợp lệ. Dùng BullMQ `deduplication` TTL chỉ cho burst webhook wake-up; delayed/slow poll vẫn có job riêng. |
| Shared providers | StarCi adapter hiện phục vụ `PayOS`, `Sepay`, `Stripe`, `Paypal`, `Crypto`; đổi result contract phải test đủ cả năm provider dù mục tiêu UX hiện nhấn mạnh SePay/PayOS. |
| Documentation drift | `TransactionStatus.Unpaid`, `ActionType.ReconcileTransaction` và reconcile payload đang mô tả “hết attempt → Unpaid”; phải sửa cùng code để public/internal contract không sai. |
| E2E shape | Plan ghi nhầm `test/e2e/...`; StarCi thực tế dùng `src/tests/e2e/`. Revision sửa bằng cách mở rộng bốn flow có sẵn, không tạo suite song song. |
| Schema | StarCi `localhost:3001` vẫn refused; đã enumerate operation tree ở Plan. MiaMia live schema dump lại thành công và vẫn không có payment-status query. StarCi live dump là Apply precondition, không phải lý do mở query trong boundary này. |
| Database | Mọi transaction lookup/claim tiếp tục dùng PostgreSQL `primary`; không tạo projection/database mới. |

### FROZEN FLOW — STARCI CORE

| Step | Frozen behavior |
|---|---|
| 1. Checkout | Mutation hiện hữu lưu `Pending`, rồi enqueue delayed reconcile như hiện tại. Không đổi price/product contract trong revision này. |
| 2. SePay callback | Guard constant-time kiểm `X-Secret-Key`; callback hợp lệ parse invoice, unknown/replay ACK 200; pending enqueue immediate reconcile dedupe TTL. |
| 3. PayOS callback | Verify signature trước; probe/non-success/unknown/replay ACK 200; pending enqueue immediate reconcile dedupe TTL. |
| 4. Reconcile | Worker load transaction `Pending`, gọi provider adapter; webhook body/return URL không tham gia quyết định paid. |
| 5. Paid | Adapter phải trả provider evidence và amount khi provider có amount; worker reject underpayment, sau đó đi đúng một action finalizer hiện hữu. |
| 6. Terminal unpaid | Chỉ provider trả cancelled/expired/failed/voided mới guarded-transition `Pending → Unpaid`, release voucher và gửi mail một lần. |
| 7. Pending | Fast retry đến max budget, sau đó chuyển slow retry nhưng vẫn giữ DB `Pending`. |
| 8. Unavailable | Network/timeout/5xx/payload không hiểu chuyển slow retry, giữ `Pending`, log trạng thái không nhạy cảm. |
| 9. Restart | Boot sweep phân trang mọi `Pending`, bỏ qua fresh row, enqueue overdue row; long-pending quay lại slow lane. |
| 10. Concurrency | Webhook burst được dedupe; nếu hai worker vẫn race, transaction/action grant theo transaction id phải khiến chỉ một claim/side effect thắng. |

### PRODUCTION TOUCHING — APPLY 1 STARCI

| Path | Verdict |
|---|---|
| `.stacks/dev/runtime/env/KEYS.md` | MODIFY — khai báo tên SePay IPN secret, không ghi giá trị. |
| `.stacks/dev/runtime/files/sepay-ipn-secret.key.enc` | ADD — encrypted local/test secret; live secret phải rotate và provision riêng. |
| `src/modules/platform/env/config.ts` | MODIFY — mount path IPN secret và slow reconcile delay. |
| `src/modules/filesystem/mount.service.ts` | MODIFY — expose IPN secret. |
| `src/modules/filesystem/utils/mount-secrets.ts` | MODIFY — strict trimmed secret reader, không plaintext fallback. |
| `src/modules/platform/exceptions/errors/payment/invalid-sepay-ipn-secret.ts` | ADD — typed 401. |
| `src/modules/platform/exceptions/errors/payment/sepay-ipn-secret-not-configured.ts` | ADD — typed configuration failure. |
| `src/modules/databases/postgresql/primary/enums/transaction-status.ts` | MODIFY — sửa mô tả `Unpaid`: chỉ terminal provider evidence, không phải retry exhaustion. |
| `src/modules/databases/postgresql/primary/enums/action-type.ts` | MODIFY — sửa mô tả reconcile, bỏ lời hứa exhaustion → Unpaid. |
| `src/modules/integrations/bullmq/types/payloads/reconcile-transaction.ts` | MODIFY — mô tả fast/slow attempts đúng state machine. |
| `src/modules/bussiness/transactions/types/transaction.ts` | MODIFY — discriminated reconcile result 4 nhánh. |
| `src/modules/bussiness/transactions/atomic/transaction-reconcile-query.service.ts` | MODIFY — normalize đủ năm `PaymentType`; không swallow outage thành pending. |
| `src/modules/bussiness/transactions/atomic/transaction-reconcile-query.service.spec.ts` | MODIFY — provider/status/error/amount matrix. |
| `src/modules/bussiness/jobs/types/enqueue.ts` | MODIFY — typed lane/delay/dedup parameters nếu shape hiện hữu chưa chứa. |
| `src/modules/bussiness/jobs/enqueue/reconcile-transaction.service.ts` | MODIFY — delayed/slow poll và immediate wake-up dedupe TTL. |
| `src/modules/bussiness/jobs/enqueue/reconcile-transaction.service.spec.ts` | MODIFY — queue shape, TTL dedupe, disabled/error cases. |
| `src/features/api/core/http/sepay/webhook/webhook.guard.ts` | ADD — transport auth. |
| `src/features/api/core/http/sepay/webhook/webhook.guard.spec.ts` | ADD — missing/wrong/right/unconfigured/secret-safe tests. |
| `src/features/api/core/http/sepay/webhook/webhook.controller.ts` | MODIFY — guard + explicit 200 + safe metadata. |
| `src/features/api/core/http/sepay/webhook/webhook.module.ts` | MODIFY — register guard. |
| `src/features/api/core/http/sepay/webhook/webhook.handler.ts` | MODIFY — parse/find/enqueue only; bỏ provider call/grant switch. |
| `src/features/api/core/http/sepay/webhook/webhook.handler.spec.ts` | MODIFY — wake-up/ACK/replay/unknown/duplicate tests. |
| `src/features/api/core/http/payos/webhook/webhook.controller.ts` | MODIFY — explicit 200 và description đúng wake-up. |
| `src/features/api/core/http/payos/webhook/webhook.handler.ts` | MODIFY — verify/find/enqueue only; bỏ grant switch. |
| `src/features/api/core/http/payos/webhook/webhook.handler.spec.ts` | MODIFY — signature/probe/wake-up/ACK/replay tests. |
| `src/features/api/processors/reconcile-transaction/reconcile-transaction.worker.ts` | MODIFY — settlement owner duy nhất, fast/slow state machine. |
| `src/features/api/processors/reconcile-transaction/reconcile-transaction.worker.spec.ts` | MODIFY — four result branches, five providers' shared behavior, mọi payment action và concurrency. |
| `src/features/api/processors/reconcile-transaction/reconcile-transaction-boot-sweep.service.ts` | MODIFY — long-pending slow lane và restart recovery. |
| `src/features/api/processors/reconcile-transaction/reconcile-transaction-boot-sweep.service.spec.ts` | MODIFY — pagination/fresh/overdue/long-pending/failure. |
| `src/tests/e2e/sepay-webhook.e2e-spec.ts` | MODIFY — auth, explicit 200, pending wake-up, replay/unknown. |
| `src/tests/e2e/payos-webhook.e2e-spec.ts` | MODIFY — signature/probe/explicit 200/wake-up. |
| `src/tests/e2e/payment-reconciliation.e2e-spec.ts` | MODIFY — missed webhook/provider polling/pending-vs-unavailable/slow retry. |
| `src/tests/e2e/payment-idempotency.e2e-spec.ts` | MODIFY — webhook + poll + boot-sweep race cấp quyền/side effect đúng một lần. |

Không path nào khác được mở trong Apply 1. Nếu DI/module wiring bắt buộc thêm path ngoài bảng này, Apply phải quay lại Review.

### ACCEPTANCE EVIDENCE — APPLY 1

| Proof | Required result |
|---|---|
| Baseline | Commit workflow/review hiện tại trước source edit; giữ nguyên mọi unrelated worktree change và ghi path-filtered tracked diff cho boundary trên. |
| Schema | Start app `core`, dump unfiltered query + mutation schema; xác nhận revision không thêm GraphQL operation. |
| Focused unit | Guard, SePay/PayOS handlers, adapter, enqueue service, worker, boot sweep: tất cả pass. |
| Full unit | Toàn bộ StarCi backend test pass. |
| Static gates | Lint zero errors, typecheck và frozen production build pass; không suppression/weaken gate. |
| E2E | Bốn existing payment suites ở trên pass trên PostgreSQL primary + BullMQ. |
| Live SePay | Public/local callback missing/wrong secret → 401; valid unknown/replay → 200; valid pending → immediate reconcile; provider unavailable giữ Pending. |
| Live PayOS | Confirm/probe + signed callback → 200; invalid signature không enqueue; valid pending đi qua provider reconcile. |
| Exactly once | Hai callback đồng thời cộng delayed poll chỉ tạo một terminal transaction và một entitlement/enrollment/email/voucher outcome. |
| Restart | Tạo Pending, bỏ delayed job/restart app, boot sweep enqueue lại và provider result settle đúng. |
| Secret safety | Không plaintext secret trong git diff, terminal output, logs hay workflow. |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved decisions from Plan | A/A đã khóa: unavailable giữ Pending + slow sweep; rollout chia ba boundary tuần tự. |
| Review revision | `payment-reliability-review-r1` khóa StarCi core làm boundary Apply đầu tiên. |
| Settlement ownership | Webhook chỉ authenticated wake-up; provider adapter là truth source; reconcile worker là grant owner duy nhất. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-miamia-payments/payment-reliability.md` | `modified` — append Review r1, frozen flow, exact StarCi Apply boundary và acceptance evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Duyệt production boundary `payment-reliability-review-r1` để vào Apply 1 StarCi? | **A (đề xuất):** duyệt đúng 33 path đã khóa; MiaMia/GraphQL/FE vẫn ngoài diff. **B:** phản hồi để tạo Review r2, chưa Apply. |

### WARNINGS

| Warning | Impact |
|---|---|
| StarCi API hiện không chạy ở `localhost:3001`. | Live schema và callback proof phải chạy trong Apply; không được tuyên bố hoàn tất chỉ bằng unit test. |
| StarCi worktree chứa nhiều workflow thay đổi không thuộc task. | Baseline/commit/diff phải stage path chính xác, không lấy hoặc sửa thay đổi của user. |
| SePay secret từng xuất hiện trong lịch sử hội thoại/ảnh ở luồng MiaMia. | StarCi test/live secret phải là giá trị mới; production bắt buộc rotate trước public tunnel. |
| Slow retry giữ Pending vô hạn nếu provider chết dài ngày. | Không mất quyền của người đã trả, nhưng cần log/monitor vận hành; dashboard/manual review là capability sau. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Webhook cấp entitlement trực tiếp. | Auth/verify rồi immediate reconcile wake-up. | Thầy chốt “webhook chỉ đánh thức, provider API mới quyết định trạng thái”. |
| `ReviewRequired` enum/migration trong r1. | Giữ `Pending` + slow sweep. | Thầy chọn A trong Plan approval. |
| Một Apply cross-repo lớn. | StarCi core → MiaMia parity → status contract/FE. | Thầy chọn rollout A. |
| Deterministic fixed BullMQ `jobId`. | BullMQ deduplication TTL cho burst wake-up. | Fixed completed job có thể chặn retry hợp lệ về sau. |
| Tạo `test/e2e/payment-reliability.e2e-spec.ts`. | Mở rộng bốn suite `src/tests/e2e/*` hiện hữu. | Plan path sai family; sibling suites đã chia đúng transport/reconcile/idempotency. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval revision `payment-reliability-review-r1`. | Thầy trả lời `Duyệt payment-reliability-review-r1`. |
| Apply 1 StarCi reliability core. | `$starci-be-feature-apply` sau approval. |
| Apply 2 MiaMia parity. | Append Review r2 sau khi StarCi core pass toàn bộ gates. |
| Apply 3 payment-status backend + FE return UX. | Backend Review tiếp theo và workflow `starci-fe-design-plan` riêng. |
| Live giao dịch 10.000đ. | Sau Apply 1/2, rotate secret, public tunnel và callback/provider reconciliation thật. |
