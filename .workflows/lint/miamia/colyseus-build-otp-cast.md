<!-- starci-workflow: v2 -->

# colyseus-build-otp-cast

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
| App | miamia — Nest app `miamia-colyseus` |
| Repo / branch | D:\Repositories\mia-mia-backend @ `main`; HEAD `a2896be8672c68c5ced9e2ce26a50fb5ccea0ead` |
| Purpose | Đo và khóa repair boundary cho lỗi TypeScript duy nhất đang chặn `build:colyseus` |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\lint\miamia\colyseus-build-otp-cast.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; không sửa target source trong Plan |

### BASELINE GATE MATRIX

| Gate | Command | Result | Evidence |
|---|---|---|---|
| Colyseus build | `npm run build:colyseus` | FAIL, exit `1` | `TS2352` duy nhất tại `apps/api/src/modules/code/otp-challenge.service.spec.ts:34:17`; webpack compile xong nhưng type-check đỏ |
| Focused lint | `npx eslint apps/api/src/modules/code/otp-challenge.service.spec.ts` | PASS, exit `0` | Không error, không warning |
| Focused unit | `npx jest --selectProjects unit --runInBand apps/api/src/modules/code/otp-challenge.service.spec.ts` | PASS, exit `0` | `1/1` suite, `4/4` tests |
| Full lint baseline | `npm run lint:check` | PASS error gate | `0 errors`, `367 warnings` lịch sử |
| Full unit baseline | `npm run test:unit -- --runInBand` | PASS | `110/110` suites, `533/533` tests |
| API build baseline | `npm run build` | PASS | webpack compile thành công |
| Colyseus runtime baseline | `npm run start:colyseus` | PASS runtime | Prehook sync, listen `2638`, live two-session socket PASS; watch type-check vẫn in cùng `TS2352` |

### ROOT CAUSE

| Group | Evidence | Verdict |
|---|---|---|
| Test fixture typing | `redis` chỉ implement `set/get/del` và được khai báo `jest.Mocked<Pick<Redis,...>>`; dòng `redis as Redis` ép trực tiếp partial mock sang class có hơn 385 member | TypeScript 5 phát hiện hai type không overlap đủ; runtime mock vẫn đúng nên unit PASS |
| Production source | `OtpChallengeService` hợp lệ nhận full `Redis`; không có lỗi tại service implementation | Không đổi production constructor/API |
| Compiler/toolchain | `apps/miamia-colyseus/tsconfig.app.json` exclude specs nhưng Nest webpack type-check vẫn quan sát spec qua app-wide imported API graph | Không chữa bằng ignore/exclude vì sẽ làm yếu CI gate |

### CANDIDATE TREE

| Path | Action | Exact repair |
|---|---|---|
| `apps/api/src/modules/code/otp-challenge.service.spec.ts` | MODIFY | Đổi duy nhất constructor argument `redis as Redis` thành sanctioned spec-mock bridge `redis as unknown as Redis`; giữ nguyên mock behavior và production type |

### CLOSURE COMMANDS

| Order | Command | Expected |
|---:|---|---|
| 1 | `npx eslint apps/api/src/modules/code/otp-challenge.service.spec.ts` | `0 errors, 0 warnings` |
| 2 | `npx jest --selectProjects unit --runInBand apps/api/src/modules/code/otp-challenge.service.spec.ts` | `4/4` PASS |
| 3 | `npm run build:colyseus` | exit `0`, không `TS2352` |
| 4 | `npm run build` | exit `0` |
| 5 | `npm run test:unit -- --runInBand` | toàn bộ suite PASS |
| 6 | `npm run lint:check` | `0 errors`; warning baseline không tăng |

### OUTPUTS

| Concept | Result |
|---|---|
| Audit brief r1 | Một lỗi test-fixture typing duy nhất chặn Colyseus build; không có product runtime defect |
| Repair policy | Giữ full `Redis` contract ở production và chỉ bridge partial mock tại spec boundary |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\lint\miamia\colyseus-build-otp-cast.md` | added — baseline gates, root cause, exact one-file candidate và closure commands |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chuyển sang Audit Review | Khuyến nghị: review one-line spec-only bridge `as unknown as Redis`; hoặc yêu cầu đổi production constructor contract nhưng sẽ mở rộng behavior boundary không cần thiết |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend worktree đang chứa 9 path của Apply readiness chưa commit | Audit Apply sau này phải baseline toàn bộ trạng thái này trước và tracked diff chỉ có OTP spec |
| Full lint có `367` warning lịch sử | Closure của task này là zero errors và warning count không tăng; không tuyên bố zero warnings |
| Runtime hiện chạy được dù watch type-check đỏ | Không được dùng runtime PASS để thay cho frozen build gate |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Thêm `any` cast | `as unknown as Redis` trong spec mock | Canon cấm `any`; unknown bridge buộc ghi rõ test double boundary |
| Mở rộng `exclude` hoặc tắt type-check | Giữ gate, sửa invalid cast | Không che lỗi bằng compiler/config suppression |
| Thu hẹp production constructor thành ba Redis methods | Không đổi service contract | Đây chỉ là fixture mismatch; production cần Redis instance thật qua DI |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge candidate, baseline overlap và closure gates | `starci-be-audit-review` cho `colyseus-build-otp-cast-plan-r1` |
| Source repair | Approval một Review revision rồi `starci-be-audit-apply` |
| Đóng Apply readiness trước | Colyseus build PASS sau repair và append kết quả vào workflow `colyseus-local-runtime-readiness.md` |

## review r1

Revision identity: `colyseus-build-otp-cast-review-r1`

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
| App | miamia — Nest app `miamia-colyseus` |
| Repo / branch | D:\Repositories\mia-mia-backend @ `main`; HEAD `a2896be8672c68c5ced9e2ce26a50fb5ccea0ead` |
| Purpose | Challenge và freeze type-safe OTP test repair cùng baseline/diff policy |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\lint\miamia\colyseus-build-otp-cast.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; không sửa backend source trong Review |

### REVIEW VERDICTS

| Plan item | Verdict | Revision |
|---|---|---|
| `redis as unknown as Redis` tại constructor call | REJECT | Không thêm cast để làm compiler im lặng |
| Giữ production constructor nhận toàn bộ `Redis` | REVISE | Thu hẹp dependency type nội bộ về đúng `set/get/del` signatures service thật sự gọi; Redis runtime vẫn structurally satisfies |
| Không đổi runtime behavior | KEEP | Decorator token, provider wiring, key format, TTL, NX semantics và OTP branches giữ nguyên |
| One-file boundary | REVISE | Hai file: service type-only contract + spec bỏ cast; không config/lockfile/generated output |

### FROZEN TREE

| Path | Action | Exact change |
|---|---|---|
| `apps/api/src/modules/code/otp-challenge.service.ts` | MODIFY | Thay full `Redis` field type bằng local structural contract cho `set(key,value,"PX",ttl,"NX")`, `get(key)`, `del(key)`; giữ `@InjectIoRedis(...)` và mọi runtime statement nguyên vẹn |
| `apps/api/src/modules/code/otp-challenge.service.spec.ts` | MODIFY | Bỏ import `Redis`, bỏ `as unknown as jest.Mocked<Pick<...>>` và `as Redis`; truyền inferred Jest mock trực tiếp vào service |

### FROZEN BASELINE POLICY

| State | Apply handling |
|---|---|
| HEAD baseline trước readiness Apply | `a2896be8672c68c5ced9e2ce26a50fb5ccea0ead` |
| 9 readiness paths đang dirty | Apply audit phải commit toàn bộ current target state làm baseline theo skill; các path đó không thuộc audit implementation diff |
| Audit implementation diff | Sau baseline chỉ được có đúng hai OTP paths trong frozen tree |
| Workflow records | Nằm ở Source repo, không gộp vào backend baseline/diff |

### FROZEN CLOSURE POLICY

| Gate | Required result |
|---|---|
| Focused lint | Exit `0`, zero diagnostics trên hai OTP paths |
| Focused OTP unit | `4/4` PASS, không skip |
| Colyseus build/typecheck | Exit `0`, không `TS2352` hoặc error khác |
| API build | Exit `0` |
| Full unit | Toàn bộ suite PASS, không unexpected skip |
| Full lint | Exit `0`, `0 errors`, warning count không vượt baseline `367` |
| Diff audit | Không suppression, ignore, severity change, dependency/lockfile hoặc generated artifact |
| Readiness closure | Append build PASS vào `colyseus-local-runtime-readiness.md`; không cần rerun live socket vì repair chỉ thay type và test fixture |

### OUTPUTS

| Concept | Result |
|---|---|
| Review r1 | Khóa repair type-safe thay vì double cast: dependency contract phản ánh đúng ba Redis operations OTP sở hữu |
| Runtime boundary | Không đổi DI token, provider instance hay behavior; chỉ compiler contract và test fixture được chỉnh |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\lint\miamia\colyseus-build-otp-cast.md` | modified — append Review r1 verdict, frozen two-file tree, baseline và closure policy |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chốt Review r1 | Khuyến nghị: duyệt `colyseus-build-otp-cast-review-r1` để Apply đúng hai OTP paths; hoặc phản hồi nếu muốn giữ full Redis type và chấp nhận test-only cast |

### WARNINGS

| Warning | Impact |
|---|---|
| Apply baseline commit sẽ chứa 9 readiness paths đang dở | Đây là checkpoint bắt buộc trước repair; tracked audit diff bắt đầu sau commit đó |
| Contract mới phải khớp overload của Redis thật | `build:colyseus` và API build là proof bắt buộc; nếu không structurally compatible phải quay lại Review, không cast |
| Full lint warning baseline là `367` | Apply không được tăng warning; task không mở rộng thành cleanup toàn repo |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Plan r1: `redis as unknown as Redis` | Structural OTP Redis contract + cast-free fixture | Double cast che mismatch thay vì kiểm chứng dependency shape |
| Compiler exclude/inline disable/skip build | Giữ nguyên gate và sửa type contract | False green bị cấm |
| `any` hoặc full fake Redis object | Mock đúng ba operation service dùng | Không làm yếu type safety hoặc dựng hơn 385 member giả |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval `colyseus-build-otp-cast-review-r1` | Feedback của thầy |
| Baseline commit, exact two-file repair và full closure gates | `starci-be-audit-apply` sau approval |
| Close readiness Apply | Append Colyseus build PASS vào workflow feature sau audit Apply |

Approved revision: `colyseus-build-otp-cast-review-r1`

## apply r1

Applied revision: `colyseus-build-otp-cast-review-r1`

Baseline commit: `72a8f7ff4e5bba25a0736b7e7687e1d57efcb840`

Tracked diff: `72a8f7ff4e5bba25a0736b7e7687e1d57efcb840..worktree`

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
| App | miamia — Nest app `miamia-colyseus` |
| Repo / branch | D:\Repositories\mia-mia-backend @ `main`; baseline `72a8f7ff4e5bba25a0736b7e7687e1d57efcb840` |
| Purpose | Apply type-safe OTP Redis dependency contract và đóng toàn bộ frozen gates |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\lint\miamia\colyseus-build-otp-cast.md |
| Language | vi |
| Phase | apply |
| Touching | `apps/api/src/modules/code/otp-challenge.service.ts`; `apps/api/src/modules/code/otp-challenge.service.spec.ts`; workflow record |

### BEFORE / AFTER GATES

| Gate | Before | After |
|---|---|---|
| Focused OTP lint | PASS, `0` diagnostics | PASS, `0` diagnostics |
| Focused OTP unit | PASS `4/4` | PASS `4/4` |
| Colyseus build | FAIL `TS2352` tại spec cast | PASS, webpack compile thành công |
| API build | PASS | PASS |
| Full unit | PASS `533/533` | PASS `110/110` suites, `533/533` tests |
| Full lint | `0 errors`, `367 warnings` | `0 errors`, `367 warnings`; budget không tăng |

### ITERATION LEDGER

| Iteration | Finding | Repair | Result |
|---:|---|---|---|
| 1 | Full `Redis` dependency làm partial mock cần unsafe cast | Thêm local `OtpChallengeStore` đúng ba operation/overload và bỏ cast khỏi spec | Focused lint/unit PASS; build tìm tiếp fixture rest args chỉ nhận string |
| 2 | Redis `PX` overload truyền TTL number nhưng mock khai báo `...args:string[]` | Đổi fixture rest args thành `Array<string | number>` | Colyseus build PASS; toàn bộ frozen matrix PASS |

### DIFF AUDIT

| Check | Result |
|---|---|
| `git diff --name-status 72a8f7f...` | Đúng hai OTP paths trong frozen tree |
| `git diff --check` | PASS |
| Suppression/gate weakening scan | Không `eslint-disable`, `ts-ignore`, `ts-expect-error`, `any`, exclude hoặc severity change |
| Runtime behavior | Không đổi runtime statement/DI token; live flow không cần rerun theo Review |

### OUTPUTS

| Concept | Result |
|---|---|
| Audit Apply r1 | OTP Redis dependency có structural contract tối thiểu, fixture type-safe và không còn cast che mismatch |
| Build closure | Colyseus và API đều build sạch; readiness blocker đã được gỡ |
| Quality closure | Unit giữ `533/533`; lint giữ `0 errors` và warning baseline không tăng |

### CHANGES

| Tree | Details |
|---|---|
| `apps/api/src/modules/code/otp-challenge.service.ts` | modified — thêm local `OtpChallengeStore` với ba Redis operation/overload và dùng làm injected field type |
| `apps/api/src/modules/code/otp-challenge.service.spec.ts` | modified — bỏ full Redis import/casts; fixture nhận string/number Redis args và truyền trực tiếp |
| `D:\Repositories\starci-academy-backend\.workflows\lint\miamia\colyseus-build-otp-cast.md` | modified — append Apply baseline, iterations, gates và closure evidence |
| `D:\Repositories\starci-academy-backend\.workflows\feature\miamia\colyseus-local-runtime-readiness.md` | modified — append closure update cho Colyseus build debt |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Không còn quyết định hoặc blocker trong approved boundary |

### WARNINGS

| Warning | Impact |
|---|---|
| Full lint còn `367` warning lịch sử | Non-blocking theo approved policy; audit này không tăng warning và không tuyên bố zero warnings |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Test-only double cast | Structural dependency contract + cast-free fixture | Review r1 yêu cầu type safety thật, không false green |
| Suppression, exclude hoặc severity weakening | Giữ nguyên mọi gate | Build phải xanh nhờ sửa nguyên nhân |

### OWED

| Owed | Cleared by |
|---|---|
| None | Toàn bộ frozen lint/build/test/diff gates đã PASS |
