<!-- starci-workflow: v2 -->

## plan r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy / core |
| Repo / branch | Backend `mtp`; Frontend `main` |
| Purpose | Cho phép đúng tài khoản test local hoàn tất đăng nhập mà không phải nhập email OTP, không tạo backdoor production. |
| Database | primary PostgreSQL; chỉ đọc user hiện hữu để giữ kiểm tra TOTP, không thêm schema hay migration |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\local-test-otp-bypass.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; Plan không sửa product source |

### Schema evidence

| Evidence | Result |
|---|---|
| Unfiltered live mutation dump at `http://localhost:3001/graphql` | Auth family đã có `signInInit`, `signInVerifyOtp`, `signInResendOtp`; không thêm mutation mới. |
| `signInInit` source + live family | Password được Keycloak xác minh trước; TOTP của user local được xác minh tiếp; sau đó mới tạo email challenge. |
| `signInVerifyOtp` source | Hoàn tất session gồm access token trả về, refresh token HttpOnly cookie, CSRF cookie và session device registration. |
| FE `useAuthPanel` | Init hiện chỉ hiểu challenge và luôn chuyển sang step `code`; cần nhận thêm nhánh session trực tiếp. |

### Product and security boundary

| Rule | Frozen candidate |
|---|---|
| Environment | Chỉ khi `NODE_ENV !== "production"`; production buộc false dù flag bị cấu hình nhầm. |
| Opt-in | `LOCAL_TEST_AUTH_BYPASS_ENABLED=true`, mặc định false. |
| Identity | Email phải khớp chính xác, không phân biệt hoa thường, với `DEV_TEST_ACCOUNT_EMAIL`; không có wildcard/list. |
| Required proofs | Keycloak password luôn chạy trước. Nếu user bật TOTP thì TOTP vẫn bắt buộc và phải đúng. |
| Bypassed factor | Chỉ email OTP của `signInInit`; không bypass sign-up, forgot-password, OAuth hay TOTP. |
| Session | Nhánh bypass phải dùng cùng cookie, CSRF và device-session side effects như `signInVerifyOtp`. |
| Standard users | Vẫn tạo challenge, enqueue mail và đi qua `signInVerifyOtp` như hiện tại. |

### Operation-family verdict

| Candidate | Verdict | Reason |
|---|---|---|
| Magic OTP cố định | REJECT | Là secret dùng chung, dễ rò và vẫn để lại challenge/email side effects. |
| Mutation local-only mới | REJECT | Tạo transport auth thứ hai và dễ lệch session semantics. |
| Bỏ qua cả password/TOTP | REJECT | Là backdoor xác thực. |
| Discriminated result trong `signInInit` | APPROVE CANDIDATE | Giữ một GraphQL door; handler quyết định `challenge` hoặc `session`, resolver sở hữu HTTP session side effects. |

### Planned production tree

| Path | Action | Shape evidence |
|---|---|---|
| `src/modules/platform/env/config.ts` | modify | Thêm config opt-in + exact test email trong keycloak auth config; forced-off production. |
| `src/features/api/core/graphql/mutations/keycloak/sign-in/init/graphql-types/response.ts` | modify | GraphQL data có nullable challenge fields hoặc access token; internal command result là discriminated union. |
| `src/features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.handler.ts` | modify | Sau password + optional TOTP, trả session branch cho exact local test identity; nhánh còn lại giữ challenge/mail. |
| `src/features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.handler.spec.ts` | modify | Twin tests toàn bộ enable/environment/identity/password/TOTP branches. |
| `src/features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.service.ts` | modify | Dispatch và trả exact command-result union, không chứa business logic. |
| `src/features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.resolver.ts` | modify | Với session branch, attach refresh cookie, issue CSRF, start device session rồi trả access token; challenge branch không có side effect này. |
| `src/features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.resolver.spec.ts` | add | Prove resolver side effects cho cả hai branches. |
| `src/tests/e2e/signup-and-signin.e2e-spec.ts` | modify | Đi qua GraphQL: standard account vẫn challenge; enabled exact local account hoàn tất session và gọi authenticated read path. |
| `D:\Repositories\starci-academy-fe\src\modules\api\graphql\mutations\types\auth.ts` | modify | `signInInit` data là union challenge/session có discriminator type guard từ field presence. |
| `D:\Repositories\starci-academy-fe\src\modules\api\graphql\mutations\types\auth.test.ts` | modify | Compile/runtime shape proof cho hai kết quả init. |
| `D:\Repositories\starci-academy-fe\src\modules\api\graphql\mutations\mutation-sign-in-init.ts` | modify | Select thêm nullable `accessToken`. |
| `D:\Repositories\starci-academy-fe\src\modules\api\graphql\mutations\mutation-sign-in-init.test.ts` | modify | Document proof chọn đủ challenge/session fields. |
| `D:\Repositories\starci-academy-fe\src\hooks\auth\useAuthPanel.ts` | modify | Session result gọi `onSession` ngay; challenge result mới chuyển step `code`. |
| `D:\Repositories\starci-academy-fe\src\hooks\auth\useAuthPanel.test.ts` | modify | Prove local direct session, standard OTP, refusal và stale response semantics. |
| `D:\Repositories\starci-academy-backend\.env.override` | local runtime only | Bật flag và exact test email; không stage/commit và không ghi credential vào workflow. |

### Test matrix

| Case | Expected proof |
|---|---|
| Flag false + matching email | Password valid -> challenge + email; no direct session. |
| Non-production + flag true + exact email | Password valid -> direct access token; no OTP challenge/mail. |
| Production + flag true + exact email | Forced standard OTP path. |
| Flag true + different email | Standard OTP path. |
| Email case variation | Exact normalized match still bypasses. |
| Wrong password on allowlisted email | Keycloak refusal; no session/challenge/mail. |
| TOTP-enabled allowlisted user, missing/wrong code | Domain TOTP refusal; no session/challenge/mail. |
| TOTP-enabled allowlisted user, correct code | Direct session only after TOTP passes. |
| Resolver challenge branch | Returns challenge; no refresh/CSRF/device session. |
| Resolver session branch | Returns access token and performs all three session side effects. |
| FE challenge branch | Opens code step with challenge metadata. |
| FE session branch | Stores token, reaches done, never opens code step. |
| E2E standard sign-in | Existing GraphQL init -> verify flow remains green. |
| E2E local bypass | GraphQL init sets cookies, returns token, authenticated read succeeds. |

### OUTPUTS

| Concept | Result |
|---|---|
| Local test OTP bypass brief | Một opt-in local-only branch trong auth family hiện hữu, vẫn giữ password/TOTP và parity session. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/local-test-otp-bypass.md` | added — evidence, exact boundary, production tree và test matrix. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Security rule | Recommended: duyệt toàn bộ boundary ở trên; không cho phép magic OTP hoặc bypass password/TOTP. |
| Apply branches | Backend hiện ở `mtp`, Frontend ở `main`; xác nhận Apply trực tiếp đúng hai branch này. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE đang có nhiều thay đổi Course Detail không liên quan. | Apply phải chỉ chạm sáu auth files nêu trên và không stage/commit thay đổi của người dùng. |
| Backend workflow tree đang untracked. | Baseline/commit phải loại workflow artifacts khỏi product-source baseline theo skill Apply. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Fixed OTP, password bypass, broad dev bypass | Exact-account direct session after password + optional TOTP | Không tạo credential chung hay mở rộng quyền ngoài mục tiêu local test. |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge exact boundary against auth family/canon | `starci-be-feature-review`. |
| Explicit owner approval | Approve one named review revision before Apply. |

## review revision-1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy / core |
| Repo / branch | Backend `mtp`; Frontend `main` |
| Purpose | Review local-only OTP bypass without weakening production authentication. |
| Database | primary PostgreSQL read only; no schema/migration |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\local-test-otp-bypass.md |
| Language | vi |
| Phase | review |
| Touching | Workflow/review artifact only; no product source |

Candidate revision: `local-test-otp-bypass-r1`

Review status: awaiting explicit approval

### Review verdict

| Boundary | Exact revision |
|---|---|
| Gate | `!isProduction && LOCAL_TEST_AUTH_BYPASS_ENABLED && normalizedEmail === normalized DEV_TEST_ACCOUNT_EMAIL`. |
| Proof order | Keycloak password -> existing TOTP check when enrolled -> bypass decision. |
| Result model | Internal discriminated union `challenge` / `session`; GraphQL data exposes nullable challenge fields and nullable `accessToken`. |
| HTTP ownership | `signInInit` resolver mirrors verify resolver for refresh cookie, CSRF and device session only on `session`. |
| Standard parity | All non-matching requests retain challenge creation, mail enqueue and verify operation. |
| FE behavior | Direct session skips OTP UI; challenge continues unchanged. |
| Persistence | No entity, table, migration or new write path. |
| Runtime config | `.env.override` only, ignored/uncommitted; no password or token recorded. |
| Production Touching | Exact fourteen source/test files listed in Plan; no other product files. |
| Proof | BE twin specs + resolver spec + auth e2e; FE mutation/type/hook specs; lint/typecheck/build; live local login then authenticated `/learn` proof. |

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate `local-test-otp-bypass-r1` | Safe local test convenience while preserving production and second-factor boundaries. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/local-test-otp-bypass.md` | modified — appended reviewed candidate and frozen Touching boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve `local-test-otp-bypass-r1`? | Recommended: approve exact local-only boundary and Apply on Backend `mtp` + Frontend `main`. |

### WARNINGS

| Warning | Impact |
|---|---|
| This changes the public `signInInit.data` shape additively. | Existing clients selecting only challenge fields remain valid; FE must narrow which branch arrived. |
| Live bypass proof creates a real local device session. | It is scoped to the supplied test account and local stack. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Add a new auth operation | Extend existing init result | One auth transport and one session owner. |
| Return impossible mixed payload | Discriminated internal result and FE narrowing | Prevent challenge+session combinations in product logic. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of revision and branches | User says `approve local-test-otp-bypass-r1`. |
| Product implementation | `starci-be-feature-apply` after approval. |

## review revision-2

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy / core |
| Repo / branch | Backend `mtp`; Frontend `main` |
| Purpose | Ghi nhận explicit approval cho local-only OTP bypass và exact production boundary. |
| Database | primary PostgreSQL read only; no schema/migration |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\local-test-otp-bypass.md |
| Language | vi |
| Phase | review |
| Touching | Workflow/review artifact only; no product source |

Approved revision: `local-test-otp-bypass-r1`

Approval evidence: user trả lời chính xác `approve local-test-otp-bypass-r1`, xác nhận candidate và Backend `mtp` + Frontend `main` Touching boundary nêu trong revision-1.

### OUTPUTS

| Concept | Result |
|---|---|
| Approved local test OTP bypass | `local-test-otp-bypass-r1` được phép vào Apply với password/TOTP và production gates giữ nguyên. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/local-test-otp-bypass.md` | modified — append explicit approval evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Exact revision, branches và production Touching đã được duyệt. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE có unrelated dirty worktree. | Apply chỉ stage/commit auth files trong approved boundary. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | Approved candidate unchanged | Không có feedback sửa revision. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply implementation and proof | `starci-be-feature-apply`. |

## apply r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy / core |
| Repo / branch | Backend `mtp`; Frontend `main` |
| Purpose | Apply local-only email OTP bypass và prove password/TOTP/production/session boundaries. |
| Database | primary PostgreSQL read only; no schema/migration |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\local-test-otp-bypass.md |
| Language | vi |
| Phase | apply |
| Touching | 8 approved BE auth/config/e2e files; 6 approved FE auth files; local ignored `.env.override`; workflow |

Applied revision: `local-test-otp-bypass-r1`

Baseline commit: `36c9cffa7584666ebdd5e845e3be6678e67a9c8c` (Backend)

Frontend baseline commit: `92e2f42fce52bdc27510ccafa10d80a680dd6f87`

Tracked diff: `36c9cffa7584666ebdd5e845e3be6678e67a9c8c..worktree` and `92e2f42fce52bdc27510ccafa10d80a680dd6f87..worktree`, path-filtered to approved Touching because unrelated FE Course Detail work predates this Apply.

Implementation commits: Backend `34776cd6b51d56e5b229442a353307019a916cb3`; Frontend `85f4e6663dfdea68bb56eec4956cc681641afe35`.

### Commands and results

| Proof | Result |
|---|---|
| BE handler + resolver twin specs | PASS — 2 suites, 11/11 tests. |
| BE auth flow e2e | PASS — `signup-and-signin.e2e-spec.ts`, 6/6 steps through GraphQL. |
| BE focused ESLint | PASS — 8 approved files, zero findings. |
| BE `npm run typecheck` | PASS — zero TypeScript errors. |
| BE `npm run build` | PARTIAL PASS — webpack compiled successfully; ForkTsChecker child emitted 2 GB heap warning despite standalone typecheck PASS. |
| FE auth specs | PASS — 3 files, 37/37 tests. |
| FE focused ESLint | PASS — 6 approved files, zero findings; existing React-version config warning only. |
| FE `npm run typecheck` | PASS — zero TypeScript errors. |
| FE `npm run build` | PASS — production Next build and all routes generated. |
| Local API boot | PASS — production GraphQL door listening on `localhost:3001` using `.env.override`. |
| Live supplied credential call | BLOCKED AT PASSWORD — `signInInit` returned Keycloak Axios refusal; direct token exchange returned HTTP 401. Read-only admin query proved supplied email has 0 local Keycloak users while seeded test identity has 1. No password/TOTP bypass occurred. |

### OUTPUTS

| Concept | Result |
|---|---|
| Local test email OTP bypass | Implemented: exact configured non-production identity can complete at `signInInit` only after password and existing TOTP proof; all ordinary users retain OTP. |
| Session parity | Direct branch attaches refresh cookie, CSRF cookie and device session exactly at resolver HTTP boundary. |

### CHANGES

| Tree | Details |
|---|---|
| `src/modules/platform/env/config.ts` | modified — local opt-in, production forced-off and exact identity config. |
| `src/features/api/core/graphql/mutations/keycloak/sign-in/init/graphql-types/response.ts` | modified — additive nullable public fields and internal discriminated result. |
| `src/features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.handler.ts` | modified — direct session after password/TOTP for exact local identity. |
| `src/features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.handler.spec.ts` | modified — exhaustive gate/password/TOTP/standard branch tests. |
| `src/features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.service.ts` | modified — dispatches exact command-result union. |
| `src/features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.resolver.ts` | modified — owns refresh/CSRF/device-session side effects. |
| `src/features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.resolver.spec.ts` | added — challenge versus session HTTP side-effect proof. |
| `src/tests/e2e/signup-and-signin.e2e-spec.ts` | modified — standard OTP and opt-in direct-session GraphQL flow. |
| `D:\Repositories\starci-academy-fe\src\modules\api\graphql\mutations\types\auth.ts` | modified — init challenge/session union and type guard. |
| `D:\Repositories\starci-academy-fe\src\modules\api\graphql\mutations\types\auth.test.ts` | modified — both init shapes proved. |
| `D:\Repositories\starci-academy-fe\src\modules\api\graphql\mutations\mutation-sign-in-init.ts` | modified — selects additive access token. |
| `D:\Repositories\starci-academy-fe\src\modules\api\graphql\mutations\mutation-sign-in-init.test.ts` | modified — document selection proof. |
| `D:\Repositories\starci-academy-fe\src\hooks\auth\useAuthPanel.ts` | modified — direct session skips code step. |
| `D:\Repositories\starci-academy-fe\src\hooks\auth\useAuthPanel.test.ts` | modified — direct-session UI state proof. |
| `.env.override` | modified locally, ignored/uncommitted — enable flag and exact test identity only; no password/token persisted. |
| `.workflows/feature/starci-academy/local-test-otp-bypass.md` | modified — approval, Apply evidence and remaining live-account blocker. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Local identity provisioning | Recommended: owner authorizes creating/resetting the supplied email as a local Keycloak test user; alternative: provide credentials for the existing seeded local identity. |

### WARNINGS

| Warning | Impact |
|---|---|
| Supplied email is absent from local Keycloak. | Live browser bypass cannot complete until a valid password identity exists; implementation refuses correctly before bypass. |
| `.env.override` is generated runtime material. | A future sync may overwrite local bypass keys unless the stack source owns them. |
| BE build checker child hit fixed 2 GB heap. | Webpack output and standalone typecheck pass, but clean build output retains this infrastructure warning. |
| FE unrelated dirty files remain. | They were not staged or committed by this Apply. |
| Global workflow validator exited 1 on pre-existing records (`global-ai-chatbot`, `learn-branch`, nivo/fidelity/upgrade records). | This workflow emitted no validator error; repository-wide workflow debt remains outside this boundary. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Auto-create/reset local Keycloak account during this Apply | Stop at password refusal and request explicit authority | Identity mutation was not in approved production/runtime boundary. |

### OWED

| Owed | Cleared by |
|---|---|
| Live successful sign-in with no challenge | Provision/reset approved local test identity or provide valid seeded credentials, then rerun GraphQL/browser login. |
| Persist bypass config in stack source | Separate approved stack/config change if local sync must preserve it. |

## apply r2

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy / core |
| Repo / branch | Backend `mtp`; Frontend `main` |
| Purpose | Tạo local test identity được owner cho phép, bổ sung local-user provisioning parity và hoàn tất live proof không OTP. |
| Database | primary PostgreSQL; direct branch provision local `UserEntity` như sibling verify handler |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\local-test-otp-bypass.md |
| Language | vi |
| Phase | apply |
| Touching | Existing approved init handler/spec; authorized local Keycloak identity; workflow |

Applied revision: `local-test-otp-bypass-r1`

Baseline commit: `36c9cffa7584666ebdd5e845e3be6678e67a9c8c`

Tracked diff: `36c9cffa7584666ebdd5e845e3be6678e67a9c8c..worktree`, approved auth paths only.

Continuation commit: Backend `0a590f2b58768a3b7e4183e998470c33fc05d726`.

### Completion evidence

| Proof | Result |
|---|---|
| Owner authority | User explicitly instructed `tao live test account di`. |
| Local Keycloak identity | PASS — created enabled + email-verified identity and set the previously supplied password without logging it. |
| Direct-branch user parity | PASS — init handler now mirrors verify handler JWT validation, `UserEntity` provisioning and email bloom update. |
| Updated handler twin | PASS — 10/10 cases, including new user and existing user branches. |
| BE focused ESLint + typecheck | PASS — zero findings/errors. |
| Auth GraphQL e2e after parity patch | PASS — 6/6 steps. |
| Live `signInInit` | PASS — success true, access token present, challenge absent, 4 cookies attached, no GraphQL errors. |
| Live authenticated `me` | PASS — success true, local user id present, email matches, no GraphQL errors. |
| Workflow validation scoped by error identity | PASS — no error names this workflow; 189 unrelated historical errors remain elsewhere. |

### OUTPUTS

| Concept | Result |
|---|---|
| Ready local test account | The supplied identity now exists in local Keycloak and signs in with the supplied password without email OTP. |
| Complete learner ownership | First direct login provisions the same local learner identity the OTP verify path would create. |

### CHANGES

| Tree | Details |
|---|---|
| `src/features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.handler.ts` | modified — validate JWT and provision/reuse local user before direct session. |
| `src/features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.handler.spec.ts` | modified — new/existing local-user branch proof. |
| Local Keycloak realm | modified — authorized test identity created, enabled, verified and assigned supplied password. |
| `.workflows/feature/starci-academy/local-test-otp-bypass.md` | modified — append successful live completion evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Approved local identity and exact bypass are live. |

### WARNINGS

| Warning | Impact |
|---|---|
| Seeded `test@starci.local` password remains unreadable by design. | It was not reset because the newly authorized live account now supplies the required test login. |
| `.env.override` may be regenerated. | Preserve keys in stack source separately if future sync should retain bypass automatically. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Reveal or recover existing seeded password | Create the authorized live test identity with the password already supplied | Keycloak stores password hashes and cannot return plaintext. |

### OWED

| Owed | Cleared by |
|---|---|
| None | Live login and authenticated read both pass. |
