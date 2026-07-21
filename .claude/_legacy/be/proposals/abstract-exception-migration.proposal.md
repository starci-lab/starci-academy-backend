# Proposal — Migrate remaining raw `throw` sites to `AbstractException`

**Status:** ✅ DONE · **Chốt:** 2026-07-11 · **Xong:** 2026-07-11 (mtp, cùng ngày — thầy chọn "xúc full" thay vì
để dành) · **Nguồn:** full-repo scan (Explore agent), theo [[abstract-exception-layer]] /
`.claude/be/rules/log-errors-typed-exception.md`.

## Kết quả build (2026-07-11)

Tất cả §1 (domain-logic, ~85 site) + §2 (guard, 23 site) đã migrate — build theo batch A→G y hệt kế hoạch
dưới đây, mỗi batch verify riêng (`tsc --noEmit` + eslint scoped đúng file). Tổng ~40 exception class mới
(một số điều kiện dùng lại class có sẵn thay vì tạo mới — vd `CourseNotFoundException`/`ContentNotFoundException`/
`EnrollmentNotFoundException`/`CvGenerationNotFoundException`/`CvSubmissionNotFoundException` đã có sẵn ở
domain `courses`/`api`, tái dùng thay vì trùng lặp). Domain mới tạo: `cv/`, `submission-review/`, `video-encoder/`,
`elasticsearch/`, `scylladb/`, `bento4/`, `crypto/`, `github/`, `personal-project/`, `guards/`.

**Phát hiện quan trọng giữa chừng (không có trong scan gốc):** không có global exception filter nào map
`AbstractException` → đúng HTTP status/GraphQL code — Nest mặc định trả 500 cho mọi exception không phải
`HttpException`. Guard (§2) đang throw 100% built-in ĐÚNG status (401/403/404) — migrate thẳng sẽ biến mọi
guard rejection thành 500, phá auth. Đã dựng hạ tầng TRƯỚC khi migrate guard:
- `AbstractException` (`errors/abstract.ts`) thêm field `httpStatus?: number` (tham số thứ 4 constructor,
  optional — 100% backward-compatible với ~150 exception class cũ, mặc định undefined→500 y hệt hành vi cũ).
- `AbstractExceptionHttpFilter` (`exceptions/filters/abstract-exception-http.filter.ts`) — `@Catch(AbstractException)`,
  đọc `exception.httpStatus ?? 500`, set đúng status cho REST; bỏ qua (rethrow) khi context là GraphQL vì
  Apollo tự xử lý response, gọi `res.json()` ở đây sẽ double-send. Đăng ký global qua `APP_FILTER` trong
  `apps/core/src/app.module.ts`.
- `formatError` trong `monolithic-apollo-server.module.ts` — stamp `extensions.code = exception.code` cho
  GraphQL response (GraphQL luôn 200, không có khái niệm status, nên `code` là tín hiệu ổn định duy nhất).
- Chỉ 12 exception class MỚI của guard (§2) + 4 class Keycloak-guard set `httpStatus` tường minh (401/403/404/400);
  ~180 class khác (đã có từ trước + Groups A-F mới tạo) giữ nguyên hành vi 500 mặc định — KHÔNG regression vì
  đó vốn đã là hành vi trước khi có filter (webhook handler đã mix sẵn AbstractException từ trước, ví dụ
  `TransactionExpiredError`/`TransactionCourseNotFoundException`).
- Verify: boot thật 2 lần (trước+sau migrate guard) — `Nest application successfully started`, không lỗi DI.
  tsc/eslint sạch toàn bộ `src/modules/exceptions/**` + mọi file touched (chỉ còn lỗi pre-existing không
  liên quan: Stripe namespace, apps/tools/dashboard JSX config, vài chỗ init/seeders khác).

**Cố ý KHÔNG migrate** (giữ nguyên `NotFoundException`): `mount-foundations.service.ts`/`.controller.ts` —
REST static-file server, 404 semantics thật (external link), migrate lúc CHƯA có filter sẽ biến 404→500 —
filter giờ đã có nhưng 2 site này chưa touch lại, để dành nếu cần (không phải domain-logic quan trọng, rủi ro
thấp nếu bỏ qua thêm 1 nhịp).

## Bối cảnh

Rule STRICT: mọi `throw` trong `src/` phải extend `AbstractException` (`@modules/exceptions`) — cấm
`throw new Error(...)` và cấm Nest built-in (`BadRequestException`/`NotFoundException`/`ForbiddenException`/
`UnauthorizedException`/`ConflictException`/`HttpException`…). Concept doc đã note nợ kỹ thuật ở vài file
(course-enroll, purchase-ai, sandbox-repo-url, github-oauth, keycloak-auth, nowpayments) nhưng scan lần này
(2026-07-11) tìm ra phạm vi THẬT lớn hơn nhiều: **156 throw site / 81 file**.

4 site mới nhất (do tôi thêm khi build installment-plan checkout) đã fix ngay same-session — xem
`src/modules/exceptions/errors/payment/installment-{currency-not-supported,custom-amount-not-allowed,
amount-below-minimum}.ts`. Phần CÒN LẠI dưới đây là nợ kỹ thuật cũ + rải rác, quá lớn để build ngay — ghi
lại đây làm checklist cho lần build sau (gợi ý: 1 `Workflow` fan-out theo domain, hoặc build tuần tự theo
nhóm A-F).

## Triage buckets (156 site / 81 file)

| Bucket | File | Site | Quyết định |
|---|---|---|---|
| GUARD (auth/csrf/captcha/admin, 100% built-in) | 10 | 23 | Trong scope migrate (§2) |
| WEBHOOK chữ ký thật (paypal/nowpayments signature verify) | 2 | 2 | Trong scope migrate, gộp vào domain-logic webhook (§1.A) |
| NORMALIZE-HELPER (ngoại lệ hợp lệ theo concept doc) | 0 | 0 | Không có site nào dùng đúng pattern này — không cần giữ chỗ |
| **DOMAIN-LOGIC (actionable)** | ~46 | ~85 | **§1 — TRỌNG TÂM proposal này** |
| TEST-FILE (`.spec.ts` mock throws) | 3 | 4 | Bỏ qua — throw trong test fixture là bình thường |
| MOCK/TOOLS (`features/mock/`, `features/tools/`) | 12 | ~24 | Bỏ qua đợt này — sandbox/demo + tools ops (xem §3 ghi chú riêng) |

## §1 — DOMAIN-LOGIC: ~30-35 exception class mới cần author (bao ~85 call-site)

Nhóm theo domain — 1 exception dùng lại cho nhiều call-site cùng điều kiện (không phải 85 class riêng).
Domain nào đã có sẵn (vd `payment`, `courses`) thì thêm vào đúng `errors/<domain>/`; domain mới (vd CV
pipeline, video-encoder, mixin infra) → tạo folder mới dưới `src/modules/exceptions/errors/`.

### A. Payment / checkout / webhook reconciliation (domain `payment`)
- `UnsupportedPaymentTypeException { paymentType }` — dùng lại ở: `course-enroll.handler.ts:129`,
  `courses-checkout.handler.ts:411`, `purchase-membership.handler.ts:387`,
  `purchase-ai-subscription.handler.ts:390` (switch-default "Unsupported payment type").
- `UnsupportedInstallmentPaymentTypeException { paymentType }` —
  `pay-next-installment.handler.ts:315`.
- `PaypalCaptureNotConfirmedException { orderId, status }` — `paypal/webhook.handler.ts:134`.
- `UnsupportedTransactionActionException { actionType }` — dùng lại ở 5 webhook handler
  (`paypal:234`, `nowpayments:215`, `stripe:211`, `sepay:231`, `payos:200`) — cùng message
  "Unsupported transaction action type".
- `SepayOrderNotPaidException { invoice, detailStatus }` — `sepay/webhook.handler.ts:146`.
- `PaymentUnderpaidException { orderId, reportedAmount, expectedAmount, provider }` — dùng lại ở
  `sepay/webhook.handler.ts:159` + `payos/webhook.handler.ts:129`.
- `InvalidPaypalWebhookSignatureException` — `paypal/webhook.handler.ts:104` (webhook sig check).
- `InvalidNowpaymentsWebhookSignatureException` — `nowpayments/webhook.handler.ts:92`.

### B. CV pipeline (domain mới `cv` — generate/tailor/rewrite/split/score/render/delete)
- `CvGenerationNotFoundException { cvGenerationId }` — `generate-cv.worker.ts:115`.
- `CvGenerationStepResultMissingException { step, stage }` — dùng lại ở compose(`:125`, step:"gather"),
  score(`:108`, step:"compose"), render(`:109`, step:"compose"), complete(`:95`, step:"compose"/"render").
- `CvModelOutputParseException { stage, raw?, cause }` — dùng lại ở compose(`:393`), score
  (`parse-cv-score.ts:45`), tailor(`:208`), split(`:273`), rewrite(`:285`) — mỗi call truyền `stage` khác.
- `CvModelOutputShapeException { stage, expected }` — tailor(`:216`, expected:"array"),
  split(`:281`, expected:"array"), rewrite(`:293`, expected:"object").
- `CvScoringInputMissingException` — `cv-scoring.service.ts:87`.
- `CvBlocksEmptyException { op }` — `tailor-cv-blocks.handler.ts:85` (op:"tailor").
- `CvTailorMissingJobDescriptionException` — `tailor-cv-blocks.handler.ts:90`.
- `CvSplitEmptyTextException` — `split-cv-from-text.handler.ts:131`.
- `CvBlockNotFoundException { op }` — `rewrite-cv-block.handler.ts:101` (op:"rewrite").
- `CvDocumentNotFoundException` — dùng lại ở update(`:75`), render(`:101`), delete(`:71`).
- `CvDocxBuildFailedException` — `render-cv-blocks.handler.ts:192`.
- `CvSubmissionNotFoundException { cvSubmissionId }` — `verify-submit-cv-presign-url.handler.ts:66`.

### C. AI submission-review workers (domain `ai` hoặc mới `submission-review`)
- `EnrollStepNotMappedException { currentStep, maxSteps }` — `enroll.worker.ts:113`.
- `SubmissionOwnerMissingException { userChallengeSubmissionId }` — dùng lại ở
  `process-git-submission-complete-step.service.ts:419` + `process-submission-complete-step.service.ts:410`.
- `GitRepositoryNotFoundException { repoUrl, branch }` — `review-milestone-task-grade-step.service.ts:236`.
- `GitRepositoryAccessDeniedException { repoUrl }` — cùng file `:241`.
- `GitRepositoryLoadFailedException { repoUrl, branch, cause }` — cùng file `:245`.
- `GitRepositoryEmptyException { repoUrl, branch }` — cùng file `:250`.
- `VideoDownloadFailedException { url, provider, key }` — `process-video-init-step.service.ts:134`
  (domain `video-encoder`, đã tồn tại thư mục riêng — kiểm tra trước khi tạo domain mới).

### D. AI invocation / infra (domain `ai`, `s3`, mới cho `elasticsearch`/`mixin`/`databases`/`bento4`/`crypto`)
- `AiInvokeTimeoutException { timeoutMs }` — `ai-invoke.service.ts:271`.
- `AiStreamTimeoutException { timeoutMs }` — `ai-invoke.service.ts:425`.
- `UnsupportedEmbeddingProviderException { provider }` — dùng lại
  `embedding-model.service.ts:110` + `:179`.
- `ElasticsearchIndexConfigMissingException { entity }` — `elasticsearch.service.ts:93`.
- `ElasticsearchBulkIndexException { index, firstError }` — `elasticsearch.service.ts:273`.
- `S3UploadFailedException { provider, bucket, key, cause }` — dùng lại
  `s3-upload.service.ts:135` + `:162`.
- `S3CopyUnsupportedProviderException { provider }` — `s3-copy.service.ts:45`.
- `NextjsQueryPageNotRegisteredException { baseUrl }` — `nextjs-query.service.ts:67`.
- `ReadinessWatcherAlreadyExistsException { name }` — `readiness-watcher-factory.service.ts:24`.
- `ReadinessWatcherNotFoundException { name }` — dùng lại 3 site (`:44,54,66`).
- `InvalidScyllaIdentifierException { value }` — `scylladb.service.ts:104`.
- `Bento4NoMovieFoundException` — `bento4.service.ts:81`.
- `Bento4Mp4FragmentException { stderr }` — `bento4.service.ts:112`.
- `Bento4Mp4DashException { stderr }` — `bento4.service.ts:147`.
- `InvalidIvLengthException` — `encryption.service.ts:105`.
- `DecryptionFailedException { cause }` — `encryption.service.ts:121` — ⚠️ **ưu tiên cao hơn các case
  khác**: catch hiện tại chỉ `console.error` rồi throw message chung, MẤT lỗi gốc thật (không phải
  normalize-helper hợp lệ) — khi migrate PHẢI giữ `originalError`/`cause` để không mất thông tin debug.

### E. Auth / OAuth / session (domain `keycloak`, `session`, `github`, mới nếu cần)
- `SessionSupersededException` — dùng lại 2 site `session.service.ts:231,240`.
- `KeycloakUserIdResolutionFailedException` — `token.service.ts:225`.
- `OidcStateExpiredException` — `keycloak-oidc-redirect.service.ts:154`.
- `KeycloakTokenPayloadInvalidException` — dùng lại `register.handler.ts:73` + `login.handler.ts:59`.
- `KeycloakTokenSubjectMissingException` — `register.handler.ts:78`.
- `InvalidRefreshTokenException` — `github/oauth/redirect.handler.ts:76`.
- `github/oauth/redirect.handler.ts:83` "User not found" → **dùng lại `UserNotFoundException` đã có sẵn**
  (đã là `AbstractException`, không cần class mới).
- `InvalidOAuthStatePayloadException` — `github/oauth/callback.handler.ts:88`.
- `OAuthStateFieldMissingException { field }` — dùng lại `callback.handler.ts:103` (field:"redirectUri")
  + `:108` (field:"userId").
- `GithubTokenExchangeFailedException` — `github/auth.service.ts:58`.
- `GithubProfileMissingLoginException` — `github/auth.service.ts:89`.

### F. GraphQL query/mutation domain khác (domain `courses`, mới nếu cần)
- `ContentNotFoundException`, `ContentNotSandboxException`, `SandboxSourceNotConfiguredException` —
  `sandbox-repo-url.service.ts:55,59,63`.
- `sandbox-repo-url.service.ts:81` "User is not enrolled" → **kiểm tra trước** có thể dùng lại exception
  của guard `graphql-must-enrolled.guard.ts` sau khi guard đó cũng migrate (§2) thay vì tạo class trùng.
- `course-price-preview.service.ts:84` "Course not found" → **kiểm tra trước** domain `courses` đã có
  `course-not-found.ts` — rất có thể dùng lại được, không tạo mới.
- `PersonalTaskAttemptAccessDeniedException` — `last-personal-task-attempt.handler.ts:88`.
- `AvatarKeyOwnershipMismatchException` — `verify-avatar-presign-url.handler.ts:70`.
- `PersonalProjectGithubSyncInputMissingException` — dùng lại
  `sync-personal-project-github.handler.ts:117,166`.
- `PersonalProjectGithubUrlMissingException` — dùng lại `sync-personal-project-github.handler.ts:124` +
  `review-personal-project-task.handler.ts:128`.
- `PersonalProjectBranchTooLongException { max }` — dùng lại `sync:137` + `review:142`.
- `PersonalProjectInvalidBranchNameException` — dùng lại `sync:142` + `review:147`.
- `PremiumContentAiAccessDeniedException` — `content-ai.service.ts:193`.
- `MountFoundationsResourceNotFoundException` — dùng lại `mount-foundations.service.ts:28,37` +
  `mount-foundations.controller.ts:55`.

## §2 — GUARD (10 file, 23 site) — batch fix riêng, cùng đợt hoặc đợt sau

100% built-in, không mixed usage → dễ batch. Gợi ý domain `guards` hoặc gắn vào domain liên quan
(`keycloak`, `csrf`, `captcha`):
- `admin-access.guard.ts` (`:27,42,45`) + `graphql-admin-access.guard.ts` (`:37,54,57`) →
  `InvalidAdminApiKeyException` (dùng lại cả 2 guard, REST+GraphQL).
- `graphql-must-enrolled.guard.ts` (`:40,47`) → `NotEnrolledInCourseException` (kiểm tra trùng với §1.F).
- `graphql-profile-visibility.guard.ts` (`:67`) → `ProfileNotVisibleException`.
- `captcha.guard.ts` (`:55`) → `CaptchaVerificationFailedException`.
- `csrf.guard.ts` (5 site `:60,73,80,84,122`) → có thể 1 class `CsrfValidationFailedException { reason }`
  hoặc 5 class riêng theo reason (missing-request/missing-token/mismatch/invalid/untrusted-origin) — CHỐT
  khi build.
- `keycloak/guards/abstract.ts` (`:62,69,73`) + `keycloak-auth-graphql.guard.ts` (`:59`) +
  `keycloak-optional-auth-graphql.guard.ts` (`:42,57,65`) → domain `keycloak`, gộp theo lý do
  (missing-token/invalid-token/expired…).
- `features/tools/guards/local-only.guard.ts` (`:29`) → xem §3 (tools/ chưa chốt có migrate hay không).

## §3 — Ghi chú KHÔNG migrate đợt này (cần chốt riêng nếu muốn mở rộng)

- `src/features/mock/` (12 site) — sandbox/demo code cho bài học, không phải production logic thật.
- `src/features/tools/` (10 site qua 7 file: artifacts/dash/media/pg-backup/sync/targets/upload) — ops
  toolkit thật (backup/media pipeline), gated bởi `local-only.guard.ts`, prod-adjacent nhưng KHÔNG phải
  request path chính — cần thầy chốt có đáng migrate hay để nguyên (rule hiện chỉ nói `src/` chung chung,
  không loại trừ `tools/`, nên về lý là VẪN vi phạm — nhưng ưu tiên thấp).
- `.spec.ts` mock throws — không migrate, throw trong test fixture là chủ ý.

## Verify plan (khi build)

- Mỗi domain migrate xong: `npx tsc --noEmit -p tsconfig.build.json` + eslint trên đúng file đã sửa
  (không chạy full-repo tsc mỗi lần, tốn thời gian).
- Với guard migrate (§2): xác nhận GraphQL/HTTP error response vẫn map đúng qua exception filter (kiểm
  tra `envelope-response-shape` / GraphQL transform interceptor có xử lý đúng `AbstractException` không
  bị mất status code phù hợp — guard rejection nên vẫn trả 401/403-equivalent, không phải 500).
- `encryption.service.ts:121` (§1.D) khi migrate PHẢI giữ nguyên `originalError` trong metadata — test lại
  1 case decrypt-fail thật để xác nhận log vẫn thấy stack gốc.
- Gộp domain trùng đã có sẵn (đừng tạo lại `CourseNotFoundException`/`NotEnrolledInCourseException` nếu
  domain `courses` hoặc guard nào đó đã có tên tương đương) — **grep trước khi tạo**.

## Gợi ý build

Việc lớn (~46 file, ~30-35 class mới) — nên build theo BATCH domain (A→F ở trên), mỗi batch 1 lượt
tsc+eslint riêng, KHÔNG gộp hết vào 1 PR khổng lồ. Có thể dùng `Workflow` fan-out mỗi domain 1 agent
(đọc đúng file, author class, sửa call-site, verify) nếu muốn làm nhanh; hoặc build tuần tự thủ công nếu
muốn kiểm soát chặt từng class.
