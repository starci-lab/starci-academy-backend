<!-- starci-workflow: v2 -->

# local-test-account-otp-bypass

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia-api |
| Repo / branch | D:\Repositories\mia-mia-backend @ main |
| Purpose | Khóa capability test account local và OTP bypass chỉ dành cho đúng tài khoản test được cấu hình. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\local-test-account-otp-bypass.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; không sửa product source trong Plan. |

### SCHEMA EVIDENCE

| Evidence | Result |
|---|---|
| Unfiltered mutation schema tại `http://127.0.0.1:3071/graphql` | Có `signInInit`, `signInVerifyOtp`, `signInResendOtp`; không có mutation test-login riêng. |
| `signInInit` | Password đi qua Keycloak thật, sau đó tạo Redis OTP challenge và enqueue email. |
| `signInVerifyOtp` | Verify challenge, decode Keycloak subject, đọc `UserEntity` từ PostgreSQL primary, rồi resolver gắn refresh cookie, CSRF cookie và session. |
| Existing local provision | `scripts/provision-keycloak.ts` đã idempotently tạo `learner@miamia.test`; `scripts/dev-login.ts` đang bypass UI bằng cách in bearer token, không phù hợp live UI proof. |

### CAPABILITY BRIEF

Revision candidate: `local-test-otp-r1`

| Rule | Decision |
|---|---|
| Password | Luôn verify qua Keycloak; bypass không chấp nhận sai password. |
| Scope | Chỉ exact normalized `DEV_TEST_ACCOUNT_EMAIL`. |
| Environment | Chỉ khi `DEV_TEST_ACCOUNT_OTP_BYPASS_ENABLED=true`, `NODE_ENV != production` và hostname của `KEYCLOAK_URL` là loopback. |
| OTP | Dùng đúng mã 6 chữ số từ `DEV_TEST_ACCOUNT_OTP`; không trả mã/token ra log hoặc GraphQL response. |
| Mail | Không enqueue OTP email cho branch test local; mọi account khác giữ nguyên email OTP. |
| Session | Vẫn đi qua `signInVerifyOtp`, cookie, CSRF và `SessionService.startSession`; không tạo cửa login thứ hai. |
| Storage | Redis giữ challenge như bình thường; PostgreSQL primary chỉ được đọc khi verify; không thêm entity/table/migration. |
| Frontend | Không đổi source; browser nhập mã test local vào form OTP hiện hữu. |

### PROPOSED FILE TREE

| Path | Action | Shape evidence |
|---|---|---|
| `apps/api/src/modules/env/config.ts` | MODIFY | Thêm config test-account email, enabled và OTP; default phải disabled/empty. |
| `apps/api/src/modules/code/types/otp-challenge.ts` | MODIFY | Cho `CreateActionChallengeParams` nhận optional explicit OTP; type vẫn thuộc owner của challenge API. |
| `apps/api/src/modules/code/otp-challenge.service.ts` | MODIFY | Hash explicit OTP khi caller cung cấp, còn mọi flow khác tiếp tục dùng CSPRNG 6 chữ số. |
| `apps/api/src/modules/code/otp-challenge.service.spec.ts` | ADD | Twin spec chứng minh explicit OTP verify được, random path không đổi, mismatch vẫn giảm attempt và challenge single-use. |
| `apps/api/src/features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.handler.ts` | MODIFY | Owner của exact bypass decision; guard đủ environment/email/loopback rồi truyền OTP override và skip mail. |
| `apps/api/src/features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.handler.spec.ts` | MODIFY | Khóa cả hai phía của từng guard và password-before-bypass. |
| `.env.override` | MODIFY | Local-only non-production defaults: exact test email, enabled flag và fixed OTP; không chứa password/token. |

### TEST MATRIX

| Case | Expected consequence |
|---|---|
| Exact test email + enabled + development + loopback + valid fixed OTP | Keycloak password exchange chạy; challenge lưu fixed OTP; không enqueue mail; verify step nhận token/session bình thường. |
| Sai password trên exact test email | Không tạo challenge, không gửi mail, không có session. |
| Email khác | Random OTP + email queue như hiện tại. |
| Email khác casing/space nhưng cùng configured email | Normalize về cùng exact account và dùng local branch. |
| Enabled false | Random OTP + email queue. |
| `NODE_ENV=production` dù enabled true | Random OTP + email queue; không bypass. |
| Keycloak URL không loopback dù development | Random OTP + email queue; không bypass. |
| OTP config không đúng 6 chữ số | Fail closed sang normal OTP + mail; không dùng mã lỗi. |
| Fixed OTP sai | `ChallengeOtpMismatchException`; attempt giảm như challenge thường. |
| Fixed OTP đúng lần đầu | Challenge single-use; lần verify thứ hai là not-found. |
| Live UI | Provision account → login email/password → nhập fixed OTP → `/vi/profile` → `me`, `progressSummary`, `wrapped` authenticated; kiểm tra UI/network/console/FE+BE terminal. |

### EXCLUSIONS

| Excluded | Reason |
|---|---|
| Trả access/refresh token từ `signInInit` | Bỏ qua cookie, CSRF và device session production path. |
| Bypass CAPTCHA | Local CAPTCHA đã no-op khi disabled; capability này không mở thêm bot bypass. |
| Bypass cho sign-up/forgot-password/resend | User chỉ cần existing test account login; mở rộng sẽ tăng security surface. |
| Sửa FE để auto-submit OTP | Không cần; fixed OTP đủ để agent đi qua UI thật mà không thay product contract. |
| Ghi password/token vào repo, workflow hoặc log | Secret handling violation. |

### OUTPUTS

| Concept | Result |
|---|---|
| Local test account login | Password và session vẫn đi qua production auth path; chỉ email delivery OTP được thay bằng mã local cố định. |
| Security boundary | Bypass cần đồng thời exact email, explicit enable, non-production và loopback Keycloak. |
| Runtime proof | Sau Apply có thể đăng nhập UI thật và đóng live proof Profile mà không cần SMTP/OTP thủ công. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/miamia/local-test-account-otp-bypass.md` | `added` — ghi schema evidence, exact file tree, guards và test matrix. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn semantics bypass local | **Fixed OTP nhưng vẫn đi qua form verify (khuyến nghị):** giữ cookie/CSRF/session path thật; hoặc auto-login ngay từ init, nhưng phải mở rộng GraphQL/FE và nhân security boundary. |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend worktree đang có 9 thay đổi dở về sync/stacks | Apply phải baseline-preserve chúng; không được sửa hoặc gom nhầm vào capability này. |
| `scripts/dev-login.ts` hiện in bearer token ra terminal | Không dùng script đó làm live proof và không ghi output của nó; hardening script là task riêng. |
| `.env.override` bật bypass local | Guard production + loopback + exact email là bắt buộc; thiếu một guard thì Review phải bác. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Tắt OTP toàn bộ development | Exact configured test account only | Development vẫn có thể được chia sẻ; scope rộng tạo auth backdoor. |
| Trả token thẳng từ `signInInit` | Fixed OTP qua `signInVerifyOtp` | Giữ nguyên cookie, CSRF và device-session boundary. |
| Dùng `scripts/dev-login.ts` để set localStorage | Login qua UI/GraphQL thật | Token injection không chứng minh auth flow. |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge exact guards và write boundary | `starci-be-feature-review` trên revision `local-test-otp-r1`. |
| Product source + tests | `starci-be-feature-apply` sau explicit approval. |
| Profile authenticated live proof | Browser login bằng test account sau backend Apply/restart. |

## review

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia-api |
| Repo / branch | D:\Repositories\mia-mia-backend @ main |
| Purpose | Review capability OTP cố định chỉ cho tài khoản test local mà vẫn giữ nguyên password, verify, cookie và session production path. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\local-test-account-otp-bypass.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; chưa sửa product source. |

### REVIEW VERDICT

Candidate revision: `local-test-otp-r2`

Approved revision: `local-test-otp-r2`

Approval evidence: user said `duyệt local-test-otp-r2` on 2026-08-15.

| Area | Verdict |
|---|---|
| Auth contract | Giữ `signInInit` và `signInVerifyOtp`; không thêm mutation, resolver hay response field. |
| Password | Bắt buộc Keycloak exchange thành công trước khi xét bypass. |
| Eligibility | `enabled=true` AND non-production AND Keycloak hostname loopback AND normalized email trùng exact configured account AND OTP config đúng sáu chữ số. |
| Failure mode | Thiếu/sai bất kỳ điều kiện nào đều fail-closed về random OTP + email hiện hữu, không làm login fail và không nới bypass. |
| Challenge API | Optional override phải mang tên `developmentOtp`, không dùng tên chung `otp`; chỉ handler sign-in local được phép truyền. |
| Verification | Fixed OTP vẫn được hash trong Redis và verify bằng service hiện hữu; mismatch, attempt limit, expiry và single-use không đổi. |
| Mail | Chỉ skip mail khi `developmentOtp` thực sự được chọn; các nhánh khác enqueue như cũ. |
| Secrets | Không log/trả OTP, password, access token hoặc refresh token. `.env.override` chỉ chứa local test email, enable flag và mã test, không chứa password/token. |

### FROZEN PRODUCTION TREE

| Path | Action | Exact responsibility |
|---|---|---|
| `apps/api/src/modules/env/config.ts` | MODIFY | Parse ba biến local-test; default disabled/empty. |
| `apps/api/src/modules/code/types/otp-challenge.ts` | MODIFY | Thêm `developmentOtp?: string` vào internal create params. |
| `apps/api/src/modules/code/otp-challenge.service.ts` | MODIFY | Dùng `developmentOtp` khi có; nếu không vẫn CSPRNG như cũ. |
| `apps/api/src/modules/code/otp-challenge.service.spec.ts` | ADD | Chứng minh override được hash/verify và random/mismatch/single-use không regress. |
| `apps/api/src/features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.handler.ts` | MODIFY | Owner duy nhất của eligibility predicate, skip-mail decision và URL parsing fail-closed. |
| `apps/api/src/features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.handler.spec.ts` | MODIFY | Twin specs cho từng guard, password-first, skip-mail và fallback. |
| `.env.override` | MODIFY | Bật capability cho `learner@miamia.test` trong stack local với một OTP sáu chữ số; không lưu password/token. |

Không sửa frontend, GraphQL schema/resolver, signup, resend, forgot-password, CAPTCHA, Keycloak provisioning hoặc database schema.

### FROZEN PROOF

| Gate | Proof |
|---|---|
| Focused unit | Hai spec owner ở trên đạt toàn bộ guard matrix. |
| Backend quality | Lint/typecheck/test/build theo scripts thực tế của repository; không suppression, không hạ gate. |
| Runtime negative | Account khác vẫn nhận normal challenge/mail branch; password sai không có challenge/session. |
| Runtime positive | Browser đăng nhập `learner@miamia.test` bằng password hợp lệ, nhập fixed OTP trong UI, nhận cookie/session và mở Profile authenticated. |
| Runtime diagnostics | Kiểm tra browser console/network và terminal FE/BE; không còn request fail không giải thích. |
| Workflow evidence | Ghi commands, pass/fail, diff baseline→worktree và live flow vào record này. |

### OUTPUTS

| Concept | Result |
|---|---|
| Local test login | Một test account có OTP dự đoán được nhưng password, challenge verify, cookie và session vẫn chạy thật. |
| Blast radius | Không thay public API hoặc hành vi của account khác; production và non-loopback luôn dùng OTP bình thường. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/miamia/local-test-account-otp-bypass.md` | `modified` — thêm Review r2, đổi generic OTP override thành `developmentOtp`, khóa fail-closed và exact production/proof boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Có duyệt Apply revision `local-test-otp-r2` không? | Thầy xác nhận `duyệt local-test-otp-r2` để Apply được baseline-commit current backend state rồi sửa đúng bảy path đã khóa. |

### WARNINGS

| Warning | Impact |
|---|---|
| `.env.override` là tracked local configuration | Fixed OTP không phải secret production, nhưng chỉ an toàn khi đồng thời giữ đủ production + loopback + exact-account guards. |
| Backend đang có chín thay đổi dở không thuộc capability | Apply phải baseline-commit trạng thái hiện tại theo skill trước khi sửa, rồi chỉ đánh giá diff mới của bảy path đã khóa. |
| Live proof cần password test account hợp lệ | Bypass không và không được phép thay thế password verification của Keycloak. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Generic `otp?: string` trên challenge params | `developmentOtp?: string` | Tên API phải tự bộc lộ đây là test-only escape hatch. |
| Auto-login từ `signInInit` | Fixed OTP qua verify hiện hữu | Không tạo auth contract/session path thứ hai. |
| Catch lỗi auth rồi cấp session test | Chỉ xét eligibility sau Keycloak success | Sai password phải luôn bị từ chối. |
| Bật theo development בלבד | Thêm loopback + exact email + explicit flag + valid OTP | Development có thể là shared environment; một guard là không đủ. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval cho r2 | Feedback chính xác `duyệt local-test-otp-r2`. |
| Baseline commit, source implementation và automated proof | `starci-be-feature-apply` sau approval. |
| Authenticated Profile live proof và terminal/network evidence | Apply restart stack rồi test browser end-to-end. |

## apply r2

Applied revision: `local-test-otp-r2`

Baseline commit: `420b0599c57e8fe2eceb060f00e14c9e4ac45d07`

Tracked diff: `420b0599c57e8fe2eceb060f00e14c9e4ac45d07..worktree`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia-api |
| Repo / branch | D:\Repositories\mia-mia-backend @ main |
| Purpose | Apply local-test-otp-r2 và chứng minh đăng nhập Profile qua UI thật. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\local-test-account-otp-bypass.md |
| Language | vi |
| Phase | apply |
| Touching | Bảy path của r2; dừng trước production edit khi phát hiện config source sai owner. |

### APPLY FINDING

| Evidence | Result |
|---|---|
| Baseline | Commit `420b0599c57e8fe2eceb060f00e14c9e4ac45d07` đã giữ nguyên chín thay đổi sync/stacks có sẵn. |
| `.env.override` header | File được generate và ghi rõ mọi hand edit sẽ bị overwrite bởi lần `npm run sync` kế tiếp. |
| Runtime lifecycle | `prestart` và `prestart:dev` đều chạy `node scripts/sync.mjs --quiet`. |
| Config owner | `.stacks/dev/runtime/env/app.env` → `app.env.enc` → `npm run sync` → `.env.override`. |
| Product diff | Không có source OTP nào được sửa sau baseline. |

### OUTPUTS

| Concept | Result |
|---|---|
| Apply r2 | Dừng an toàn trước implementation vì config path đã duyệt không tồn tại bền qua restart. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\mia-mia-backend` | `committed` — baseline hiện trạng trước capability tại `420b0599c57e8fe2eceb060f00e14c9e4ac45d07`. |
| `.workflows/feature/miamia/local-test-account-otp-bypass.md` | `modified` — ghi baseline và owner mismatch phát hiện trong Apply. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Có thay r2 bằng revision sửa đúng config owner không? | Duyệt r3 sau đây (khuyến nghị); hoặc giữ r2 nhưng bypass sẽ mất sau restart nên không thể pass live proof. |

### WARNINGS

| Warning | Impact |
|---|---|
| Sửa trực tiếp `.env.override` | `npm run sync` xóa thay đổi ngay trước khi API start. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Tiếp tục viết `.env.override` bằng tay | Route về Review r3 và sửa source env thực | Evidence trong chính generated file bác tính bền vững của r2. |

### OWED

| Owed | Cleared by |
|---|---|
| Exact revised config boundary | Approval `local-test-otp-r3`. |
| Implementation và proof | Apply r3 sau approval. |

## review r3

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia-api |
| Repo / branch | D:\Repositories\mia-mia-backend @ main |
| Purpose | Thay config write owner sai của r2 bằng stack source bền qua sync; không đổi auth semantics. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\local-test-account-otp-bypass.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow; chưa sửa product source sau baseline. |

Candidate revision: `local-test-otp-r3`

Approved revision: `local-test-otp-r3`

Approval evidence: user said `duyệt local-test-otp-r3` on 2026-08-15.

### REVISED BOUNDARY

Mọi auth rule, guard, test matrix và runtime proof của r2 được giữ nguyên. Chỉ thay config ownership như sau.

| Path | Action | Exact responsibility |
|---|---|---|
| `apps/api/src/modules/env/config.ts` | MODIFY | Parse local-test enabled/email/OTP; defaults disabled/empty. |
| `apps/api/src/modules/code/types/otp-challenge.ts` | MODIFY | Thêm internal `developmentOtp?: string`. |
| `apps/api/src/modules/code/otp-challenge.service.ts` | MODIFY | Hash explicit development OTP hoặc giữ CSPRNG path. |
| `apps/api/src/modules/code/otp-challenge.service.spec.ts` | ADD | Exhaustive challenge override/random/mismatch/single-use specs. |
| `apps/api/src/features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.handler.ts` | MODIFY | Owner exact eligibility predicate và skip-mail branch. |
| `apps/api/src/features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.handler.spec.ts` | MODIFY | Exhaustive guard/password-first/fallback specs. |
| `.stacks/dev/runtime/env/app.env` | MODIFY, gitignored | Local plaintext source được Apply dùng để regenerate encrypted env; không chứa password/token. |
| `.stacks/dev/runtime/env/app.env.enc` | MODIFY | Tracked SOPS source cho ba local-test values. |
| `.stacks/dev/runtime/env/KEYS.md` | MODIFY | Document ba key names, consumer, optionality và owner; không ghi values. |
| `.env.override` | REGENERATE | Derived output bằng `npm run sync`; tuyệt đối không hand-edit. |

### OUTPUTS

| Concept | Result |
|---|---|
| Revision r3 | Giữ nguyên bypass an toàn của r2 và làm cấu hình sống qua sync/restart/fresh clone có master identity. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/miamia/local-test-account-otp-bypass.md` | `modified` — thêm evidence Apply r2 và exact config ownership r3. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Có duyệt Apply revision `local-test-otp-r3` trên baseline hiện có không? | Trả lời `duyệt local-test-otp-r3` (khuyến nghị); auth semantics không đổi, chỉ thêm đúng source/generated env paths. |

### WARNINGS

| Warning | Impact |
|---|---|
| `app.env` là plaintext local và gitignored | Apply phải tránh in values; chỉ `app.env.enc` được commit. |
| Fresh clone cần master identity để decrypt dev stack | Đây là contract hiện hữu của toàn bộ MiaMia local stack, không phải yêu cầu mới của OTP. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Hand-edit `.env.override` trong r2 | Sửa `app.env`/`app.env.enc`, rồi regenerate | `prestart` chắc chắn overwrite generated file. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit r3 approval | User nói `duyệt local-test-otp-r3`. |
| Source, specs, gates và live UI proof | Apply r3. |

## apply r3

Applied revision: `local-test-otp-r3`

Baseline commit: `420b0599c57e8fe2eceb060f00e14c9e4ac45d07`

Tracked diff: `420b0599c57e8fe2eceb060f00e14c9e4ac45d07..worktree`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia-api |
| Repo / branch | D:\Repositories\mia-mia-backend @ main |
| Purpose | Apply fixed OTP cho exact local test account, giữ password và verify/session path thật, rồi chứng minh trên runtime. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\local-test-account-otp-bypass.md |
| Language | vi |
| Phase | apply |
| Touching | Mười path của r3; runtime plaintext secrets chỉ được reconcile local, không commit và không log. |

### COMMANDS AND RESULTS

| Gate | Command / evidence | Result |
|---|---|---|
| Baseline | `git commit -m "chore: baseline before local test OTP bypass"` | PASS — `420b0599c57e8fe2eceb060f00e14c9e4ac45d07`; giữ nguyên chín thay đổi có sẵn. |
| Env source | SOPS encrypt `app.env` → `app.env.enc`, rồi `npm run sync -- --quiet` | PASS cho ba `DEV_TEST_ACCOUNT_*` keys; không in values. |
| Focused lint | `npx eslint --max-warnings=0 <six TS paths>` | PASS — 0 error, 0 warning. |
| Focused unit | Jest hai owner specs | PASS — 2 suites, 14/14 tests. |
| Full unit | `npm run test:unit -- --runInBand` | PASS — 108 suites, 516/516 tests. |
| Build/typecheck | `npm run build` và Nest watch typecheck | PASS — webpack compile success, `No typescript errors found`. |
| Diff | `git diff --check 420b059` | PASS — không whitespace error; source diff nằm trong approved tree. |
| Wrong password live | GraphQL `signInInit` với exact account nhưng password sai | PASS — `success=false`, không challenge. |
| Correct password live | GraphQL `signInInit` qua Keycloak local | PASS — `success=true`, challenge TTL 600 giây. |
| Browser OTP flow | FE source tại `localhost:3000` → sign in exact test account → nhập fixed OTP | PASS — UI chuyển sang trạng thái `Bạn đã đăng nhập` / `Đã đăng nhập`; không cần SMTP. |
| Backend terminal | API `3071`, Nest startup và watch | PASS — app started; không runtime error trong login/OTP calls. |
| FE terminal | Next dev `3000` với process-local GraphQL endpoint `3071` | PASS cho auth requests; có warning/error FE độc lập ghi dưới đây. |

### OUTPUTS

| Concept | Result |
|---|---|
| Live test account | `learner@miamia.test` đã được create/reset idempotently trong Keycloak local và xác thực password thật. |
| Local OTP bypass | Exact account nhận deterministic OTP qua Redis challenge thật; không gửi mail, không log/trả OTP từ API. |
| Security boundary | Production, non-loopback, disabled flag, invalid OTP hoặc account khác đều fail-closed về normal OTP + mail. |
| Runtime proof | Password → challenge → OTP verify → UI signed-in đã chạy thành công trên FE/BE thật. |

### CHANGES

| Tree | Details |
|---|---|
| `apps/api/src/modules/env/config.ts` | `modified` — parse enabled/email/OTP với defaults disabled/empty. |
| `apps/api/src/modules/code/types/otp-challenge.ts` | `modified` — thêm internal `developmentOtp?: string`. |
| `apps/api/src/modules/code/otp-challenge.service.ts` | `modified` — hash fixed development OTP hoặc giữ random path. |
| `apps/api/src/modules/code/otp-challenge.service.spec.ts` | `added` — prove override, random, mismatch limit và single-use. |
| `apps/api/src/features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.handler.ts` | `modified` — exact guarded eligibility, skip mail và fail-closed URL parsing. |
| `apps/api/src/features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.handler.spec.ts` | `modified` — exhaustive guards, password-first và mail fallback. |
| `.stacks/dev/runtime/env/app.env` | `modified`, gitignored — local source values; không commit. |
| `.stacks/dev/runtime/env/app.env.enc` | `modified` — tracked SOPS source chứa ba encrypted values. |
| `.stacks/dev/runtime/env/KEYS.md` | `modified` — document ba key names/owners, không values. |
| `.env.override` | `regenerated`, gitignored — nhận ba keys qua `npm run sync`; không hand-edit. |
| `.workflows/feature/miamia/local-test-account-otp-bypass.md` | `modified` — ghi approval, baseline, automated/runtime evidence và debt. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| `scripts/provision-keycloak.ts` mặc định client `miamia-web`, runtime dùng `academy-web`, và script ghi secret vào `.gitmounts` thay vì stack runtime owner | Provision mặc định tạo 401; live proof phải truyền đúng client ID và reconcile plaintext secret rồi start API không chạy sync lần hai. Cần backend feature riêng để sửa bền. |
| Encrypted runtime client secret hiện chưa được update trong r3 | `npm run sync` kế tiếp khôi phục secret cũ; OTP code đúng nhưng password exchange lại 401 cho tới khi provision ownership được sửa. |
| FE process environment ban đầu ép GraphQL `3072` | Tab cũ trả `Bad Request Exception`; live proof phải start FE với process-local `NEXT_PUBLIC_API_GRAPHQL_BASE_URL=http://localhost:3071/graphql` và mở tab mới. |
| FE token chỉ nằm trong module memory và standalone AuthenticationPanel không SPA-route sau success | Full navigation tới `/vi/profile` làm mất bearer; không thể đóng proof Profile authenticated dù OTP sign-in UI đã PASS. |
| Profile console có missing `weeklyChallenge.claimed` và PressResponder warnings | Profile shell render nhưng console/network gate chưa sạch; cần FE fidelity/feature riêng. |
| FE terminal báo thiếu global `timeZone`; stack sync báo 13 REQUIRED keys cũ còn thiếu | Là debt hiện hữu ngoài r3; không ảnh hưởng focused OTP tests nhưng ngăn tuyên bố toàn stack sạch. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Mở rộng r3 để sửa provision script, FE endpoint, token persistence hoặc Profile console | Ghi WARNING/OWED và route đúng capability riêng | Các path này không thuộc approved backend OTP boundary. |

### OWED

| Owed | Cleared by |
|---|---|
| Provision client ID + secret owner bền qua `npm run sync` | Một `starci-be-feature` riêng sửa provision/runtime secret contract và prove restart bình thường. |
| Persist/refresh hoặc SPA navigation để Profile giữ authenticated viewer | FE Plan/Review/Apply riêng cho auth-session navigation. |
| Profile console sạch (`weeklyChallenge.claimed`, PressResponder, timezone) | `starci-fe-fidelity-start` trên exact Profile runtime evidence. |
| Full authenticated Profile network flow | Sau hai debt trên: sign in → OTP → SPA Profile → `me`, progress, wrapped; browser console/network và FE/BE terminal sạch. |
