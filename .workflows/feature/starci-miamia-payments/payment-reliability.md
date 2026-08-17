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

## apply r1

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
| Repo / branch | D:\Repositories\starci-academy-backend @ mtp |
| Purpose | Apply reliability core StarCi: webhook chỉ đánh thức, provider API quyết định trạng thái, reconcile worker là settlement owner duy nhất. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-miamia-payments\payment-reliability.md |
| Language | vi |
| Phase | apply |
| Touching | Đúng 33 path StarCi đã khóa trong Review r1; giữ nguyên mọi thay đổi workflow ngoài task. |

Applied revision: `payment-reliability-review-r1`

Baseline commit: `5a5a544434171eb176af0c6d09e33c4d77731753`

Tracked diff: `5a5a544434171eb176af0c6d09e33c4d77731753..worktree` theo 33 path trong `PRODUCTION TOUCHING — APPLY 1 STARCI`.

### EVIDENCE

| Gate | Kết quả |
|---|---|
| Focused unit | PASS — 7 suites, 74 tests: guard, SePay/PayOS handler, provider adapter, enqueue, worker, boot sweep. |
| Full unit | PASS — 230/230 suites, 1474/1474 tests. |
| Lint | PASS — `npm run lint:check`, 0 lỗi, 0 warning. |
| Typecheck | PASS — `npm run typecheck`. |
| Production build | PASS — `npm run build`; webpack compile thành công. |
| Payment E2E | PASS — 4/4 suites, 16/16 tests trên PostgreSQL primary + BullMQ. |
| Stack sync | PASS — encrypted secret được giải mã vào file gitignored; `KEYS.md` cross-check không thiếu required key. |
| Live GraphQL | PASS — API port 3001; dump unfiltered 180 query + 113 mutation; revision không thêm operation. |
| Live SePay transport | PASS — missing secret `401`, wrong secret `401`, valid secret + unknown invoice `200`. |
| Live pending fallback | PASS — callback pending `200`; provider unavailable được log `fast-retry`, DB vẫn `pending`. |
| Live restart recovery | PASS — restart với một row overdue; boot sweep count `1`, enqueue attempt `5`, `slow-retry` 900.000 ms; DB vẫn `pending`. |
| Exactly once | PASS — E2E race ba nguồn chỉ 1/3 guarded claim thắng; worker unit chứng minh side effect chỉ chạy sau claim thắng. |
| Secret safety | PASS — decrypted `.key` bị gitignore; scan trả `PLAINTEXT_SECRET_IN_TRACKED_DIFF=NO`; workflow/log không ghi giá trị. |
| Diff integrity | PASS — `git diff --check`; mọi thay đổi ngoài boundary là worktree có sẵn và không bị sửa bởi Apply này. |

### OUTPUTS

| Concept | Result |
|---|---|
| Webhook ownership | SePay xác thực transport, PayOS verify signature; cả hai chỉ ACK + immediate reconcile wake-up. |
| Provider truth | Năm provider được normalize thành `paid`, `terminal-unpaid`, `pending`, `unavailable`. |
| Settlement ownership | Reconcile worker là owner duy nhất của terminal transition và entitlement/action side effect. |
| Recovery | Fast budget chuyển sang slow lane; provider outage không còn biến giao dịch thành `Unpaid`; boot sweep phục hồi job sau restart. |

### CHANGES

| Tree | Details |
|---|---|
| `.stacks/dev/runtime/env/KEYS.md` + `.stacks/dev/runtime/files/sepay-ipn-secret.key.enc` | Thêm owner tài liệu và secret local/test được mã hóa; plaintext chỉ tồn tại ở file sync đã gitignore. |
| `src/modules/platform/env/config.ts` + `src/modules/filesystem/**` | Thêm slow reconcile delay, mount path IPN secret và reader fail-closed; không plaintext fallback. |
| `src/modules/platform/exceptions/errors/payment/*sepay-ipn-secret*` | Thêm typed lỗi secret thiếu/sai; REST global filter trả 401. |
| `src/features/api/core/http/{sepay,payos}/webhook/**` | SePay guard constant-time; explicit HTTP 200; handler bỏ provider call/grant switch, chỉ lookup Pending và enqueue dedupe TTL. |
| `src/modules/bussiness/transactions/**` | Adapter normalize đủ PayOS, SePay, Stripe, PayPal, Crypto và tách pending khỏi unavailable. |
| `src/modules/bussiness/jobs/**` + `src/modules/integrations/bullmq/**` | Thêm lane fast/slow và BullMQ deduplication TTL cho callback burst; delayed poll vẫn dùng job riêng. |
| `src/features/api/processors/reconcile-transaction/**` | Worker thành settlement owner duy nhất; terminal transition guarded; pending/unavailable giữ Pending và slow retry; boot sweep chọn lane theo tuổi row. |
| `src/modules/databases/postgresql/primary/enums/{transaction-status,action-type}.ts` | Sửa contract docs: `Unpaid` chỉ từ terminal provider evidence, không từ retry exhaustion. |
| `src/tests/e2e/{sepay-webhook,payos-webhook,payment-reconciliation,payment-idempotency}.e2e-spec.ts` | Khóa auth/signature, ACK 200, provider polling, slow retry và concurrency claim. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Apply 1 StarCi đã hoàn tất đúng revision; boundary tiếp theo phải mở Review riêng. |

### WARNINGS

| Warning | Impact |
|---|---|
| E2E runner vẫn in cảnh báo teardown/open handle lịch sử dù exit code 0 và 4 suites pass. | Không làm sai kết quả payment; cleanup runner là audit boundary khác. |
| Build in cảnh báo package metadata cho Node built-ins. | Webpack vẫn compile thành công; không thuộc payment behavior. |
| Chưa gửi giao dịch thật 10.000đ và chưa nhận callback PayOS signed từ provider live. | Không được dùng kết quả local/E2E để tuyên bố tiền thật đã settle; gate vận hành này còn nợ sau khi có checkout/link thật. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Hết fast retry thì ghi `Unpaid`. | Giữ `Pending`, chuyển slow lane và boot sweep. | Provider unavailable không phải bằng chứng chưa thanh toán. |
| Webhook tự cấp quyền. | Webhook chỉ wake; worker query provider và claim trước side effect. | Tránh drift, replay và double grant. |
| Fixed deterministic BullMQ `jobId`. | Deduplication TTL cho callback burst. | Completed fixed job có thể chặn poll hợp lệ về sau. |
| Mở helper E2E ngoài boundary. | Bốn suite đã duyệt tự dựng đúng focused module/runtime. | Giữ exact production touching của Review r1. |

### OWED

| Owed | Cleared by |
|---|---|
| MiaMia parity cho cùng state machine, secret policy và E2E. | Mở Review/Apply 2 trên `D:\Repositories\mia-mia-backend`. |
| Payment-status contract và FE return/pending/success/failure cho hai app. | Backend Review tiếp theo + workflow `starci-fe-design-plan` riêng. |
| Giao dịch thật 10.000đ, PayOS signed callback, SePay provider settlement và replay trên public tunnel. | Có checkout/link thật, credential live đã rotate và cửa sổ test giao dịch; append live evidence, không thay source boundary. |

## review r2

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets: StarCi Academy + MiaMia |
| Frontend | D:\Repositories\starci-academy-fe; D:\Repositories\miamia-fe |
| Backend | D:\Repositories\starci-academy-backend; D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-miamia-payments |
| Repo / branch | D:\Repositories\mia-mia-backend @ main |
| Purpose | Review và khóa Apply 2: đưa MiaMia về cùng payment reliability state machine đã chứng minh ở StarCi. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-miamia-payments\payment-reliability.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; chưa sửa production source MiaMia hoặc frontend. |

Revision identity: `payment-reliability-miamia-review-r2`

### REVIEW FINDINGS

| Finding | Verdict |
|---|---|
| Live schema | MiaMia port 3071 trả unfiltered schema: 32 query, 41 mutation; checkout hiện có `purchaseMembership`, `purchaseExamDownloadPackage`; chưa có payment-status query. |
| Product actions | MiaMia settlement phải giữ đủ hai action thật: `MembershipPurchase` 49.000đ/tháng và `ExamDownloadPackagePurchase` cho Personal/Commercial. |
| SePay transport | Guard constant-time, encrypted mount và explicit HTTP 200 đã đúng; giữ nguyên guard/controller/secret files, chỉ đổi handler thành wake-up. |
| PayOS transport | Signature verify đã có nhưng controller còn implicit 201 và handler vẫn grant trực tiếp; phải explicit 200 và chỉ enqueue. |
| Provider truth | Adapter hiện gộp pending với outage thành `unknown`, không trả amount; phải dùng discriminated 4-state result cho đúng PayOS + SePay. |
| Retry exhaustion | Worker hiện hết attempt thì ghi `Unpaid`; phải giữ DB `Pending`, chuyển slow lane. |
| Restart | Winston enum/config đã có `TransactionReconcileBootSweep` nhưng không có service; thêm boot sweep vào module hiện hữu. |
| Exactly once | Membership/exam entitlement đã claim theo transaction id; worker vẫn phải chạy underpayment trước finalizer và side effect chỉ sau claim thắng. |
| Database | Toàn bộ lookup/claim tiếp tục dùng PostgreSQL `primary`; không migration, không projection mới. |
| Boundary sequencing | Revision này chỉ reliability parity backend MiaMia; payment-status GraphQL và FE checkout/return mở Review tiếp theo sau khi r2 xanh. |

### FROZEN FLOW — MIAMIA PARITY

| Step | Frozen behavior |
|---|---|
| 1. Checkout | `purchaseMembership` và `purchaseExamDownloadPackage` tiếp tục tạo transaction `Pending`, snapshot package/amount và enqueue delayed reconcile. |
| 2. SePay callback | Guard xác thực `X-Secret-Key`; missing/unknown/replay ACK 200; Pending enqueue immediate reconcile với dedupe TTL. |
| 3. PayOS callback | Verify signature; probe/non-success/unknown/replay ACK 200; Pending enqueue immediate reconcile với dedupe TTL. |
| 4. Provider query | PayOS/SePay adapter trả `paid`, `terminal-unpaid`, `pending`, `unavailable`, kèm reported amount khi có. |
| 5. Paid | Worker chặn underpayment rồi gọi đúng một finalizer: membership hoặc exam-download entitlement. |
| 6. Terminal unpaid | Chỉ provider-authoritative cancelled/expired/failed mới guarded-transition `Pending → Unpaid`. |
| 7. Pending/unavailable | Fast retry đến budget; sau đó slow retry 15 phút, transaction vẫn `Pending`. |
| 8. Restart | Boot sweep phân trang Pending overdue; row cũ vào slow lane và job mất được phục hồi. |
| 9. Concurrency | Callback burst dedupe TTL; callback/poll/boot race vẫn chỉ một terminal claim và một entitlement. |

### PRODUCTION TOUCHING — APPLY 2 MIAMIA

| Path | Verdict |
|---|---|
| `.stacks/dev/runtime/env/KEYS.md` | MODIFY — document thêm slow reconcile key; không secret value. |
| `apps/api/src/modules/env/config.ts` | MODIFY — thêm `slowDelayMs`; sửa comment fast budget. |
| `apps/api/src/modules/databases/postgresql/primary/enums/action-type.ts` | MODIFY — bỏ contract exhaustion → Unpaid. |
| `apps/api/src/modules/databases/postgresql/primary/enums/transaction-status.ts` | MODIFY — `Unpaid` chỉ từ terminal provider evidence. |
| `apps/api/src/modules/bullmq/types/payloads/reconcile-transaction.ts` | MODIFY — thêm typed fast/slow lane. |
| `apps/api/src/modules/bussiness/transactions/types/transaction.ts` | MODIFY — discriminated reconcile result bốn nhánh. |
| `apps/api/src/modules/bussiness/transactions/atomic/transaction-reconcile-query.service.ts` | MODIFY — normalize PayOS + SePay status/error/amount. |
| `apps/api/src/modules/bussiness/transactions/atomic/transaction-reconcile-query.service.spec.ts` | ADD — provider state/error/amount matrix. |
| `apps/api/src/modules/bussiness/jobs/types/enqueue.ts` | MODIFY — lane/delay/dedupe input. |
| `apps/api/src/modules/bussiness/jobs/enqueue/reconcile-transaction.service.ts` | MODIFY — slow delay và BullMQ deduplication TTL. |
| `apps/api/src/modules/bussiness/jobs/enqueue/reconcile-transaction.service.spec.ts` | ADD — queue shape, dedupe, disabled/error. |
| `apps/api/src/features/api/core/http/sepay/webhook/webhook.handler.ts` | MODIFY — bỏ provider call/grant, chỉ lookup + wake-up. |
| `apps/api/src/features/api/core/http/sepay/webhook/webhook.handler.spec.ts` | MODIFY — missing/unknown/replay/pending/broker error. |
| `apps/api/src/features/api/core/http/payos/webhook/webhook.controller.ts` | MODIFY — explicit HTTP 200 và description đúng. |
| `apps/api/src/features/api/core/http/payos/webhook/webhook.handler.ts` | MODIFY — verify/find/wake-up; bỏ direct grant. |
| `apps/api/src/features/api/core/http/payos/webhook/webhook.handler.spec.ts` | MODIFY — signature/probe/non-success/pending/replay. |
| `apps/api/src/features/api/processors/reconcile-transaction/reconcile-transaction.worker.ts` | MODIFY — settlement owner duy nhất, underpayment và fast/slow state machine. |
| `apps/api/src/features/api/processors/reconcile-transaction/reconcile-transaction.worker.spec.ts` | ADD — bốn result branches, hai action finalizer, race/claim. |
| `apps/api/src/features/api/processors/reconcile-transaction/reconcile-transaction-boot-sweep.service.ts` | ADD — pagination, overdue recovery, slow lane. |
| `apps/api/src/features/api/processors/reconcile-transaction/reconcile-transaction-boot-sweep.service.spec.ts` | ADD — fresh/overdue/long-pending/pagination/failure. |
| `apps/api/src/features/api/processors/reconcile-transaction/reconcile-transaction.module.ts` | MODIFY — register boot sweep. |
| `test/e2e/payment-sepay.e2e-spec.ts` | MODIFY — authenticated ACK + wake-up; không direct grant. |
| `test/e2e/payment-payos.e2e-spec.ts` | MODIFY — signed ACK 200 + wake-up; checkout link vẫn giữ. |
| `test/e2e/reconcile-transaction.e2e-spec.ts` | MODIFY — missed webhook, underpayment, pending/unavailable slow retry, membership/exam exactly-once và restart recovery. |

Không path nào khác được mở trong Apply 2. Nếu DI hoặc test family bắt buộc path ngoài bảng, quay lại Review r3.

### ACCEPTANCE EVIDENCE — APPLY 2

| Proof | Required result |
|---|---|
| Baseline | Commit current clean MiaMia `main` trước source edit; ghi SHA và tracked diff. |
| Schema | Dump unfiltered query/mutation trước và sau; revision không thêm GraphQL operation. |
| Focused unit | Adapter, enqueue, SePay/PayOS handler, worker, boot sweep pass. |
| Full gates | Lint 0 lỗi, typecheck, full unit và production build pass. |
| E2E | Ba existing payment suites pass trên PostgreSQL primary; transport không grant trực tiếp. |
| Runtime | Port 3071: SePay missing/wrong `401`, valid unknown/replay `200`, pending wake-up; provider unavailable giữ Pending. |
| Restart | Pending overdue được boot sweep enqueue lại và vào slow lane sau restart. |
| Exactly once | Callback + delayed poll + boot sweep chỉ cấp một membership hoặc exam-download entitlement. |
| Secret safety | Không plaintext secret trong diff/log/workflow; không thay secret đã mount nếu không cần rotate. |

### OUTPUTS

| Concept | Result |
|---|---|
| Proposed revision | `payment-reliability-miamia-review-r2` đưa MiaMia về cùng reliability invariant với StarCi. |
| Payment products | Giữ nguyên membership 49.000đ/tháng và exam-download Personal/Commercial; chỉ đổi settlement ownership. |
| Next continuation | Sau Apply 2 mở payment-status backend + FE checkout/return; task không đóng ở backend parity. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-miamia-payments/payment-reliability.md` | `modified` — append Review r2, source-backed flow, exact 24-path MiaMia boundary và gates. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Duyệt `payment-reliability-miamia-review-r2` và exact 24-path boundary để Apply 2 trên MiaMia `main`? | **A (đề xuất):** duyệt; commit baseline sạch rồi code parity ngay. **B:** phản hồi để tạo Review r3, chưa sửa source. |

### WARNINGS

| Warning | Impact |
|---|---|
| MiaMia hiện đang chạy port 3071 bằng source cũ trong lúc Review. | Apply phải restart runtime trước live proof. |
| E2E hiện khẳng định webhook trực tiếp grant và PayOS trả 201. | Các assertion này bắt buộc đổi; giữ lại sẽ chứng minh contract cũ sai kiến trúc. |
| Payment-status query chưa tồn tại. | FE chưa thể poll trạng thái đáng tin cậy trong revision r2; đó là boundary kế tiếp, không bị quên. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Copy toàn bộ 33 path StarCi sang MiaMia. | Chỉ mở 24 path có drift thực. | Guard/secret/controller SePay hiện đã đúng và MiaMia chỉ có hai provider + hai product action. |
| Gộp GraphQL status và FE vào Apply 2. | Reliability parity trước, status/FE Review tiếp theo. | Giữ diff có thể chứng minh và tránh frontend dựa trên settlement owner đang đổi. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval `payment-reliability-miamia-review-r2`. | Thầy trả lời `Duyệt payment-reliability-miamia-review-r2`. |
| Apply 2 MiaMia parity. | `$starci-be-feature-apply` sau approval. |
| Payment-status + full checkout/return UX MiaMia. | Review/Apply backend kế tiếp rồi FE Design Review/Apply; tiếp tục cùng task. |

## apply r2

Approved revision: `payment-reliability-miamia-review-r2`

Approval evidence: Thầy trả lời chính xác `Duyệt payment-reliability-miamia-review-r2`.

Applied revision: `payment-reliability-miamia-review-r2`

Baseline commit: `68606fa44d343a58659bf263108d298a239c002b`

Tracked diff: `68606fa44d343a58659bf263108d298a239c002b..worktree`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets: StarCi Academy + MiaMia |
| Frontend | D:\Repositories\starci-academy-fe; D:\Repositories\miamia-fe |
| Backend | D:\Repositories\starci-academy-backend; D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-miamia-payments |
| Repo / branch | D:\Repositories\mia-mia-backend @ main |
| Purpose | Apply reliability parity để webhook chỉ đánh thức và worker là settlement owner duy nhất. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-miamia-payments\payment-reliability.md |
| Language | vi |
| Phase | apply |
| Touching | Exact 24 path đã khóa trong Review r2. |

### OUTPUTS

| Concept | Result |
|---|---|
| Approval | `payment-reliability-miamia-review-r2` đã được duyệt; bắt đầu Apply 2. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-miamia-payments/payment-reliability.md` | `modified` — ghi approval và CONTEXT trước khi sửa source. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Exact Review revision và 24-path boundary | Đã duyệt. |

### WARNINGS

| Warning | Impact |
|---|---|
| Runtime port 3071 còn chạy source cũ. | Phải restart trước live proof. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Mở thêm path ngoài Review r2. | Quay lại Review r3 nếu phát sinh boundary mới. | Giữ Apply đúng approval. |

### OWED

| Owed | Cleared by |
|---|---|
| Baseline, implementation và proof của Apply 2. | Kết quả Apply bên dưới. |

### APPLY RESULT — MIAMIA PAYMENT RELIABILITY

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets: StarCi Academy + MiaMia |
| Frontend | D:\Repositories\starci-academy-fe; D:\Repositories\miamia-fe |
| Backend | D:\Repositories\starci-academy-backend; D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-miamia-payments |
| Repo / branch | D:\Repositories\mia-mia-backend @ main |
| Purpose | Apply MiaMia reliability parity; webhook chỉ đánh thức, provider API quyết định và worker settlement đúng một lần. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-miamia-payments\payment-reliability.md |
| Language | vi |
| Phase | apply |
| Touching | Đúng 24 path của `payment-reliability-miamia-review-r2`. |

### OUTPUTS

| Concept | Result |
|---|---|
| Baseline | Clean baseline commit `68606fa44d343a58659bf263108d298a239c002b` trên MiaMia `main`. |
| Settlement ownership | SePay/PayOS webhook chỉ verify/find/wake; worker là owner duy nhất của Membership và Exam Download entitlement. |
| Provider truth | Adapter phân biệt `paid`, `terminal-unpaid`, `pending`, `unavailable`; outage/unknown không còn thành `Unpaid`. |
| Recovery | Fast budget chuyển sang slow retry 15 phút; boot sweep phục hồi Pending overdue và dedupe callback/restart burst. |
| Schema | Trước/sau đều 32 query, 41 mutation; Apply 2 không đổi GraphQL. |
| Proof | Focused unit 34/34; full unit 124 suites/594 tests; payment E2E 3 suites/17 tests; typecheck/build/lint/live đều đạt. |
| Runtime | API restart PID 31684 trên port 3071; SePay missing 401, wrong 401, authenticated unknown 200; plaintext mount đã xóa. |

### CHANGES

| Tree | Details |
|---|---|
| `.stacks/dev/runtime/env/KEYS.md` | `modified` — document slow reconcile key, không ghi value. |
| `apps/api/src/modules/env/config.ts` | `modified` — thêm `slowDelayMs`; maxAttempts là fast budget. |
| `apps/api/src/modules/databases/postgresql/primary/enums/action-type.ts` | `modified` — bỏ contract exhaustion thành Unpaid. |
| `apps/api/src/modules/databases/postgresql/primary/enums/transaction-status.ts` | `modified` — Unpaid chỉ từ terminal provider evidence. |
| `apps/api/src/modules/bullmq/types/payloads/reconcile-transaction.ts` | `modified` — typed fast/slow lane. |
| `apps/api/src/modules/bussiness/transactions/types/transaction.ts` | `modified` — discriminated reconcile result bốn nhánh. |
| `apps/api/src/modules/bussiness/transactions/atomic/transaction-reconcile-query.service.ts` | `modified` — normalize PayOS/SePay status, errors và amount. |
| `apps/api/src/modules/bussiness/transactions/atomic/transaction-reconcile-query.service.spec.ts` | `added` — provider state/error/amount matrix. |
| `apps/api/src/modules/bussiness/jobs/types/enqueue.ts` | `modified` — lane, delay và dedupe input. |
| `apps/api/src/modules/bussiness/jobs/enqueue/reconcile-transaction.service.ts` | `modified` — BullMQ deduplication TTL và slow-lane payload. |
| `apps/api/src/modules/bussiness/jobs/enqueue/reconcile-transaction.service.spec.ts` | `added` — queue shape, disabled, dedupe và broker failure. |
| `apps/api/src/features/api/core/http/sepay/webhook/webhook.handler.ts` | `modified` — authenticated lookup + wake-up, không provider query/grant. |
| `apps/api/src/features/api/core/http/sepay/webhook/webhook.handler.spec.ts` | `modified` — missing/unknown/replay/pending/broker failure. |
| `apps/api/src/features/api/core/http/payos/webhook/webhook.controller.ts` | `modified` — explicit HTTP 200 ACK. |
| `apps/api/src/features/api/core/http/payos/webhook/webhook.handler.ts` | `modified` — signature verify/find/wake, không direct grant. |
| `apps/api/src/features/api/core/http/payos/webhook/webhook.handler.spec.ts` | `modified` — tamper/probe/non-success/pending/replay. |
| `apps/api/src/features/api/processors/reconcile-transaction/reconcile-transaction.worker.ts` | `modified` — single settlement owner, underpayment và fast/slow state machine. |
| `apps/api/src/features/api/processors/reconcile-transaction/reconcile-transaction.worker.spec.ts` | `added` — product finalizers, provider states, retries và underpayment. |
| `apps/api/src/features/api/processors/reconcile-transaction/reconcile-transaction-boot-sweep.service.ts` | `added` — paginated Pending recovery và dedupe. |
| `apps/api/src/features/api/processors/reconcile-transaction/reconcile-transaction-boot-sweep.service.spec.ts` | `added` — fresh/overdue/pagination/failure matrix. |
| `apps/api/src/features/api/processors/reconcile-transaction/reconcile-transaction.module.ts` | `modified` — register boot sweep. |
| `test/e2e/payment-sepay.e2e-spec.ts` | `modified` — auth + 200 ACK + wake-up, no direct grant. |
| `test/e2e/payment-payos.e2e-spec.ts` | `modified` — signature + 200 ACK + wake-up; create-link giữ 201. |
| `test/e2e/reconcile-transaction.e2e-spec.ts` | `modified` — terminal/pending/unavailable, slow retry và Membership/Exam exactly-once. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Apply 2 source boundary | Đã duyệt và đã triển khai đúng 24/24 path. |
| Boundary tiếp theo | Mở Backend Feature Plan/Review cho payment-status query rồi FE checkout/return; không tự trộn vào Apply 2. |

### WARNINGS

| Warning | Impact |
|---|---|
| Full lint còn 502 warning lịch sử, 0 error; boundary này có một số formatting warning. | Không chặn gate đã duyệt; không mở audit ngoài 24 path. |
| `npm install` báo 80 dependency vulnerability hiện hữu. | Không chạy `audit fix --force`; package-lock đã restore, không có dependency diff. |
| Live PayOS callback cần chữ ký provider thật. | Signature/ACK được chứng minh trong E2E; live SePay đã chứng minh production route và secret guard. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Mark `Unpaid` khi hết retry hoặc provider lỗi. | Giữ `Pending`, chuyển slow lane. | Không biến thiếu bằng chứng thành thất bại tài chính. |
| Grant entitlement trong webhook transport. | Dedupe wake-up rồi worker provider-query/finalize. | Loại hai settlement owner và race callback/poll. |
| Sửa warning/dependency ngoài boundary. | Ghi warning và giữ diff đúng 24 path. | Bảo toàn approval và unrelated work. |

### OWED

| Owed | Cleared by |
|---|---|
| Payment-status query cho return page poll trạng thái đáng tin cậy. | Backend Feature Plan/Review/Apply kế tiếp. |
| Checkout/return UX MiaMia cho Membership 49k/tháng và Exam Download packages. | FE Design Review/Apply sau khi status contract được duyệt. |
| Callback thanh toán provider thật và entitlement production exactly-once. | Một giao dịch test thật sau khi status/return flow hoàn chỉnh; không dùng secret đã lộ cho production. |

### COMMAND EVIDENCE

| Command | Result |
|---|---|
| `npx tsc --noEmit -p apps/api/tsconfig.app.json` | PASS. |
| Focused Jest sáu suites | 6/6 suites, 34/34 tests PASS. |
| `npm run test:unit -- --runInBand` | 124/124 suites, 594/594 tests PASS. |
| `npm run lint:check` | PASS, 0 errors; 502 historical warnings. |
| `npm run build:api` | webpack production build PASS. |
| Payment Jest E2E | 3/3 suites, 17/17 tests PASS trên PostgreSQL container. |
| Live `/graphql` | 32 queries, 41 mutations; API PID 31684 port 3071. |
| Live `/api/v1/sepay/webhook` | missing 401; wrong 401; authenticated unknown 200. |
| `git diff --check` | PASS; chỉ line-ending notices, không whitespace error. |

## plan r3

Proposed revision: `payment-status-plan-r1`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets: StarCi Academy + MiaMia |
| Frontend | D:\Repositories\starci-academy-fe; D:\Repositories\miamia-fe |
| Backend | D:\Repositories\starci-academy-backend; D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-miamia-payments |
| Repo / branch | D:\Repositories\mia-mia-backend @ main |
| Database | Primary PostgreSQL |
| Purpose | Brief query payment-status an toàn theo owner để trang return poll sau PayOS/SePay checkout. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-miamia-payments\payment-reliability.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; không sửa product source. |

### SCHEMA EVIDENCE

| Evidence | Finding |
|---|---|
| Unfiltered live schema port 3071 | 32 query và 41 mutation; không có transaction/payment-status query. |
| Checkout outputs | `purchaseMembership` và `purchaseExamDownloadPackage` đều trả `transactionId`, `referenceId`, `amount`; package mutation còn trả `packageId`. |
| Sibling family | Mirror full CQRS shape của `my-exam-download-entitlement`: query, handler, service, resolver, module, module-definition, GraphQL types và twin spec. |
| Data owner | `TransactionEntity` trên Primary PostgreSQL có owner `userId`, `status`, `actionType`, `paymentType`, `amount`, `examDownloadPackage`. |
| Return behavior | PayOS có thể trả orderCode/reference; FE luôn nhận transactionId trước redirect. SePay success return không được giả định luôn mang cùng query param. |

### CONTRACT BRIEF

| Contract | Frozen proposal |
|---|---|
| Query | Authenticated `myPaymentStatus(request: MyPaymentStatusRequest!): MyPaymentStatusResponse!`. |
| Lookup | Request nhận nullable `transactionId: ID` và `referenceId: String`; handler yêu cầu chính xác một khóa. |
| Ownership | Query luôn ghép khóa với `user.id`; foreign và missing cùng throw `TransactionNotFoundException`, không lộ tồn tại. |
| Response | `transactionId`, `referenceId`, `status`, `actionType`, `paymentType`, `amount`, nullable `examDownloadPackage`, `createdAt`, `updatedAt`. |
| Settlement boundary | Chỉ đọc DB; không query provider, không enqueue reconcile và không cấp entitlement từ GraphQL read. |
| Poll semantics | FE dừng khi status khác Pending; `Succeeded` mở success CTA, `Unpaid/Failed/Cancelled` mở retry CTA. |
| Database | Không migration, không projection, chỉ Primary PostgreSQL. |

### PROPOSED PRODUCTION TREE

| Path | Purpose / shape evidence |
|---|---|
| `apps/api/src/modules/exceptions/errors/payment/payment-status-lookup-invalid.ts` | Domain exception cho request thiếu cả hai hoặc truyền đồng thời hai lookup key. |
| `apps/api/src/features/api/core/graphql/queries/payments/index.ts` | Payment query family export surface, mirror domain query groups. |
| `apps/api/src/features/api/core/graphql/queries/payments/payments.module-definition.ts` | Configurable group-module definition. |
| `apps/api/src/features/api/core/graphql/queries/payments/payments.module.ts` | Register `MyPaymentStatusQueryModule`. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/index.ts` | Operation export surface. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/graphql-types/request.ts` | Nullable ID/reference fields; handler owns exact-one rule. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/graphql-types/response.ts` | Typed owner-safe transaction status response. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.query.ts` | CQRS params-only query message. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.handler.ts` | Validate auth/key shape; owner-scoped Primary Postgres read; map response. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.handler.spec.ts` | Exhaustive decision twin. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.service.ts` | One-line QueryBus dispatch. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.resolver.ts` | Authenticated GraphQL door and response envelope. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.module-definition.ts` | Operation configurable module definition. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.module.ts` | Wire handler/service/resolver. |
| `apps/api/src/features/api/core/graphql/queries/queries.module.ts` | Register `PaymentsQueriesModule` at query composition root. |
| `test/e2e/payment-status.e2e-spec.ts` | Production GraphQL auth/ownership/read flow on Primary PostgreSQL. |

### TEST MATRIX

| Layer | Cases |
|---|---|
| Handler twin | no user; neither key; both keys; owned by transactionId; owned by referenceId; missing; foreign owner; every `TransactionStatus`; Membership action; Exam Download action with/null package; amount/timestamps preserved; no provider/queue side effect. |
| Resolver/GraphQL | auth guard; request validation/serialization; response enum/object shape. |
| E2E | owner polls Pending then reads Succeeded after real DB transition; fallback reference lookup; foreign user receives same not-found code as missing; no provider SDK called. |
| Regression | typecheck, focused unit, full unit, lint 0 errors, production build, unfiltered schema 33 queries/41 mutations, live authenticated query. |

### OUTPUTS

| Concept | Result |
|---|---|
| Capability brief | `payment-status-plan-r1`: owner-scoped, read-only payment state contract cho cả membership và exam-download return flow. |
| Resilience | Hai lookup key tránh phụ thuộc riêng vào sessionStorage hoặc provider redirect params. |
| Security | Foreign và missing indistinguishable; không trả checkout URL, provider payload hay user data. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-miamia-payments/payment-reliability.md` | `modified` — append Payment Status Plan r1, exact 16-path tree và test matrix. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Lookup contract | **A (đề xuất):** hỗ trợ chính xác một trong `transactionId` hoặc `referenceId`. **B:** chỉ transactionId, FE phụ thuộc storage trước redirect. |
| Response breadth | **A (đề xuất):** status + purchase/provider identity an toàn như bảng contract. **B:** chỉ status và transactionId, FE phải giữ thêm checkout context cục bộ. |

### WARNINGS

| Warning | Impact |
|---|---|
| `ActionType` GraphQL enum hiện chứa cả internal job actions. | Query chỉ trả action của owner transaction; Review cần quyết định reuse enum hay thêm purchase-kind GraphQL enum hẹp. |
| Payment Apply r2 vẫn là worktree diff từ baseline. | Apply status kế tiếp phải tạo baseline mới chỉ sau khi r2 được commit, không được baseline trên implementation dở. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Query provider trực tiếp mỗi lần FE poll. | Read DB; callback/reconcile worker sở hữu provider truth. | Tránh side effect trong query và provider thundering herd. |
| Public lookup không auth. | Key + authenticated owner scope. | Transaction/order code không phải authorization secret. |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge enum breadth, exact response, file boundary và tests. | `starci-be-feature-review`. |
| Implement payment-status. | `starci-be-feature-apply` sau explicit approval. |
| Checkout/return UX. | FE Design Review/Apply sau backend status contract. |

## review r3

Proposed revision: `payment-status-review-r1`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets: StarCi Academy + MiaMia |
| Frontend | D:\Repositories\starci-academy-fe; D:\Repositories\miamia-fe |
| Backend | D:\Repositories\starci-academy-backend; D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-miamia-payments |
| Repo / branch | D:\Repositories\mia-mia-backend @ main |
| Database | Primary PostgreSQL |
| Purpose | Challenge và khóa payment-status contract, ownership, enum surface, exact source tree và proof. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-miamia-payments\payment-reliability.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; không sửa product source. |

### REVIEW FINDINGS

| Finding | Verdict |
|---|---|
| Schema chưa có status read | ADD một authenticated GraphQL query; REST không có transport exception phù hợp. |
| Reuse `ActionType` | REJECT — enum chứa internal workers và product khác; thêm GraphQL-only `PaymentPurchaseKind` gồm `membership`, `examDownload`. |
| Lookup một khóa | REVISE — hỗ trợ exact-one `transactionId` hoặc `referenceId`; owner scope nằm trong cùng DB predicate. |
| Lookup transaction action khác | REJECT as not found — query này chỉ đọc Membership/Exam Download purchases; không mở generic transaction API. |
| Provider call từ query | REJECT — polling read không đánh thức hay settle; reliability worker đã sở hữu provider truth. |
| Succeeded semantics | ACCEPT — atomic finalizer chuyển transaction và entitlement trong cùng DB transaction, nên Succeeded đồng nghĩa entitlement đã sẵn sàng. |
| Baseline next Apply | Current r2 diff chưa commit; khi r3 được duyệt, baseline commit kế tiếp sẽ chứa completed r2 trước khi viết status source. |

### FROZEN CONTRACT — R1

| Surface | Exact behavior |
|---|---|
| Query | `myPaymentStatus(request: MyPaymentStatusRequest!): MyPaymentStatusResponse!`. |
| Auth | `KeycloakAuthGraphQLGuard`; missing user throws `UserNotFoundException`. |
| Input | Nullable `transactionId: ID`, nullable `referenceId: String`; exactly one required. |
| Invalid input | Neither/both throws `PaymentStatusLookupInvalidException` with booleans, no secret/provider payload. |
| Ownership | Query predicate combines supplied key + `user.id` + action in Membership/Exam Download. |
| Missing/foreign/wrong action | Same `TransactionNotFoundException`; no existence oracle. |
| Output | IDs, `status`, narrow `purchaseKind`, `paymentType`, integer `amount`, nullable `examDownloadPackage`, `createdAt`, `updatedAt`. |
| State | Return all persisted `TransactionStatus` values unchanged; no synthetic success, timeout or expiry. |
| Side effects | None: no provider SDK, no queue, no mutation, no entitlement grant. |
| Database | Primary PostgreSQL only; no migration/projection/cache. |

### EXACT PRODUCTION TOUCHING — 17 PATHS

| Path | Verdict |
|---|---|
| `apps/api/src/modules/exceptions/errors/payment/payment-status-lookup-invalid.ts` | ADD — stable exact-one lookup exception. |
| `apps/api/src/features/api/core/graphql/queries/payments/index.ts` | ADD — family export. |
| `apps/api/src/features/api/core/graphql/queries/payments/payments.module-definition.ts` | ADD — group configurable module. |
| `apps/api/src/features/api/core/graphql/queries/payments/payments.module.ts` | ADD — register status operation. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/index.ts` | ADD — operation export. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/graphql-types/request.ts` | ADD — lookup input. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/graphql-types/purchase-kind.ts` | ADD — narrow `PaymentPurchaseKind` GraphQL enum. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/graphql-types/response.ts` | ADD — owner-safe status data/envelope. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.query.ts` | ADD — params-only query. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.handler.ts` | ADD — exact-one validation, owner/action-scoped read và mapping. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.handler.spec.ts` | ADD — exhaustive twin. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.service.ts` | ADD — QueryBus dispatch only. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.resolver.ts` | ADD — authenticated GraphQL door. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.module-definition.ts` | ADD — operation module definition. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.module.ts` | ADD — handler/service/resolver wiring. |
| `apps/api/src/features/api/core/graphql/queries/queries.module.ts` | MODIFY — register payment query family. |
| `test/e2e/payment-status.e2e-spec.ts` | ADD — authenticated owner/missing/foreign/state flow through GraphQL. |

### FROZEN TEST MATRIX

| Proof | Cases / expected result |
|---|---|
| Handler twin | no user; neither key; both keys; ID lookup; reference lookup; missing; foreign; wrong action; each persisted status; Membership mapping; Exam Download mapping; amount/timestamps exact. |
| No side effects | Test module provides no payment SDK/queue/finalizer; handler compiles and all reads pass. |
| GraphQL E2E | anonymous denied; owner ID Pending; owner reference Succeeded; foreign and missing same exception code; response uses narrow purchase kind; enum/schema generated. |
| State transition | Seed Pending, perform real guarded DB transition to Succeeded, query again and observe Succeeded. |
| Regression | Focused unit/E2E, full unit, lint 0 errors, typecheck, build. |
| Schema | Unfiltered after Apply: 33 queries, 41 mutations; open `myPaymentStatus` args and response type. |
| Live | Authenticated test user calls query by owned transactionId; foreign test remains indistinguishable from missing. |

### OUTPUTS

| Concept | Result |
|---|---|
| Review revision | `payment-status-review-r1` khóa owner-safe read contract và exact 17-path boundary. |
| Product surface | Chỉ hai MiaMia purchases, narrow purchase kind; không biến thành generic transaction history API. |
| Reliability seam | Return polling đọc persisted truth; worker vẫn là settlement owner duy nhất. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-miamia-payments/payment-reliability.md` | `modified` — append Review r1, frozen contract, 17-path boundary và proof matrix. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Duyệt `payment-status-review-r1`? | **A (đề xuất):** duyệt exact-one ID/reference lookup + narrow purchase kind và exact 17 path. **B:** phản hồi để tạo Review r2, chưa sửa source. |
| Baseline trước Apply | **A (đề xuất):** commit completed r2 diff làm baseline hiện tại rồi mới thêm 17 path. **B:** dừng để thầy review r2 diff thêm. |

### WARNINGS

| Warning | Impact |
|---|---|
| Live auth proof cần seed/owned transaction của test account. | Apply phải dùng local test account và không log credential/token. |
| Trang return FE chưa nằm trong boundary này. | Backend status xanh vẫn chưa hoàn tất UX; FE phase tiếp tục ngay sau. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Expose `ActionType` trực tiếp. | `PaymentPurchaseKind` hẹp. | Không công khai internal job/action vocabulary cho FE. |
| Generic owner transaction lookup. | Chỉ Membership/Exam Download actions. | Scope hiện tại là MiaMia checkout return, không phải lịch sử giao dịch. |
| Query gọi provider/enqueue. | Pure Primary PostgreSQL read. | Giữ CQRS query không side effect và tránh poll amplification. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval `payment-status-review-r1` và baseline option A/B. | Thầy trả lời `Duyệt payment-status-review-r1, A/A` hoặc feedback r2. |
| Backend source + live auth proof. | `starci-be-feature-apply` sau approval. |
| Full checkout/return UI. | FE Design Review/Apply sau status source xanh. |

Approval evidence: Thầy trả lời chính xác `Duyệt payment-status-review-r1, A/A.`

Approved revision: `payment-status-review-r1`

Approved decisions: exact-one `transactionId/referenceId`, narrow purchase kind và commit completed r2 làm baseline trước Apply.

## apply r3

Applied revision: `payment-status-review-r1`

Baseline commit: `ecf8844`

Tracked diff: `ecf8844..worktree`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets: StarCi Academy + MiaMia |
| Frontend | D:\Repositories\starci-academy-fe; D:\Repositories\miamia-fe |
| Backend | D:\Repositories\starci-academy-backend; D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-miamia-payments |
| Repo / branch | D:\Repositories\mia-mia-backend @ main |
| Database | Primary PostgreSQL |
| Purpose | Apply owner-safe payment status để checkout/return polling đọc persisted provider-authoritative truth. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-miamia-payments\payment-reliability.md |
| Language | vi |
| Phase | apply |
| Touching | Đúng 17 path của `payment-status-review-r1`. |

### OUTPUTS

| Concept | Result |
|---|---|
| Payment status | GraphQL authenticated read theo đúng một trong transaction ID/reference ID. |
| Owner safety | Missing, foreign owner và action ngoài Membership/Exam Download cùng một not-found contract. |
| Reliability | Query chỉ đọc persisted state; provider API, reconcile queue và entitlement finalizer vẫn ở settlement boundary. |
| Checkout handoff | FE có thể poll cùng transaction qua ID trước redirect hoặc reference sau return. |

### CHANGES

| Tree | Details |
|---|---|
| `apps/api/src/modules/exceptions/errors/payment/payment-status-lookup-invalid.ts` | `added` — stable bad-request exception cho neither/both lookup key, chỉ ghi hai boolean. |
| `apps/api/src/features/api/core/graphql/queries/payments/index.ts` | `added` — export payment query family. |
| `apps/api/src/features/api/core/graphql/queries/payments/payments.module-definition.ts` | `added` — configurable group-module contract. |
| `apps/api/src/features/api/core/graphql/queries/payments/payments.module.ts` | `added` — compose `MyPaymentStatusQueryModule`. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/index.ts` | `added` — operation export surface. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/graphql-types/request.ts` | `added` — nullable UUID/reference input; handler khóa exact-one. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/graphql-types/purchase-kind.ts` | `added` — narrow enum `membership`/`examDownload`. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/graphql-types/response.ts` | `added` — owner-safe typed persisted payment facts. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.query.ts` | `added` — params-only CQRS query. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.handler.ts` | `added` — user + key + approved-action predicate trong một Primary PostgreSQL read. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.handler.spec.ts` | `added` — 15-case decision twin, mọi persisted status và mapping. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.service.ts` | `added` — QueryBus dispatch. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.resolver.ts` | `added` — Keycloak-authenticated GraphQL query/envelope. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.module-definition.ts` | `added` — operation configurable module. |
| `apps/api/src/features/api/core/graphql/queries/payments/my-payment-status/my-payment-status.module.ts` | `added` — self-contained CQRS + handler/service/resolver wiring. |
| `apps/api/src/features/api/core/graphql/queries/queries.module.ts` | `modified` — register payment query group. |
| `test/e2e/payment-status.e2e-spec.ts` | `added` — real GraphQL HTTP, auth guard, Primary PostgreSQL ownership và state-transition proof. |

### VERIFICATION

| Gate | Result |
|---|---|
| Baseline | Commit `ecf8844` chứa completed payment reliability r2 trước khi status source được viết. |
| Focused handler | PASS — 1 suite, 15/15 tests. |
| Payment E2E | PASS — 5 suites, 24/24 tests trên PostgreSQL container. |
| Full unit | PASS — 125 suites, 609/609 tests. |
| Typecheck | PASS — `tsc --noEmit -p apps/api/tsconfig.app.json`. |
| Production build | PASS — webpack compile API thành công. |
| Lint | PASS — 0 error; 503 warning lịch sử. Focused diff còn 1 warning do canonical rule vẫn giả định `src/modules/platform/exceptions`, trong khi approved repository family nằm tại `apps/api/src/modules/exceptions`. |
| Schema | PASS — 33 queries, 41 mutations; có `myPaymentStatus`. |
| Live auth | PASS — local test account đăng nhập qua OTP bypass; không log token/cookie. |
| Live checkout/status | PASS — tạo membership SePay 49.000đ, đọc cùng transaction Pending qua ID và reference, HTTP 200, payload nhất quán. |
| Diff hygiene | PASS — `git diff --check ecf8844`; chỉ có notice LF/CRLF, không whitespace error. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Backend payment-status source | Không còn approval; đã apply đúng revision r1. |
| Checkout/return UI | Cần đi tiếp FE lifecycle để wire polling, success/failure/retry và pricing CTA vào MiaMia source. |

### WARNINGS

| Warning | Impact |
|---|---|
| Live transaction test còn ở trạng thái `pending`. | Đúng boundary status-read; settle thật cần callback/provider-confirmed payment, không được query tự chuyển thành success. |
| API runtime đang chạy PID 54436 tại port 3071. | Đây là build mới chứa query; restart stack sau này phải giữ canonical generated env/secret mounts. |
| Repo-wide lint có 503 warning lịch sử. | Không có error; warning ngoài 17-path boundary không được sửa lẫn trong feature Apply này. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Poll query tự gọi provider hoặc enqueue reconcile. | Pure persisted read. | Không nhân tải provider và không tạo side effect từ GraphQL Query. |
| Trả generic `ActionType`. | `PaymentPurchaseKind` hẹp. | Không rò internal worker vocabulary. |
| Lookup không owner scope. | Owner + key + action trong cùng predicate. | Không tạo transaction existence oracle. |

### OWED

| Owed | Cleared by |
|---|---|
| FE checkout/return polling UX cho membership và exam-download. | Tiếp tục FE Design Review/Apply theo approved product pricing/CTA. |
| Callback thật đổi transaction Pending thành terminal state. | Provider-confirmed callback/reconcile live gate; không giả lập từ status query. |
