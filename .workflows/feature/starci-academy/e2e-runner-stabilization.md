<!-- starci-workflow: v2 -->

# E2E runner stabilization

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy; Nest executable `core` |
| Database | Primary PostgreSQL connection `primary`; E2E runner owns disposable PostgreSQL and Redis Testcontainers only, with no migration or seed change |
| Repo / branch | D:\Repositories\starci-academy-backend on `mtp` at `5a1b38b28e07eda0cb8ae04c7dd153103c4c1420` |
| Purpose | Khóa exact source tree và proof matrix để E2E runner vào được container, chạy assertion và teardown ổn định trước khi chứng minh lại bốn flow AI. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\e2e-runner-stabilization.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\e2e-runner-stabilization.md only; không sửa product/test source trong Plan |

Plan revision: `e2e-runner-stabilization-plan-r1`

### Objective

Khôi phục một owner duy nhất cho lifecycle E2E: parent runner boot disposable infrastructure, truyền đúng environment sang Jest child, chờ Jest kết thúc và teardown trong `finally`. Jest không còn vừa transform vừa thực thi Testcontainers trong `globalSetup`; nó chỉ discovery/transform/run flow specs. Bốn flow challenge, personal-project, CV và mock-interview giữ nguyên production boundary và deterministic provider stubs.

### Evidence

| Evidence | Finding |
|---|---|
| Live GraphQL schema | API `http://127.0.0.1:3001/graphql` trả unfiltered query/mutation inventory; các cửa `submitChallengeSubmission`, `submitPersonalGithubUrl`, `reviewPersonalProjectTask`, `generateCv`, `reviseCv`, `uploadCv` và `gradeMockInterviewSession` đều đang tồn tại. Đây là runner repair, không thêm hoặc đổi schema. |
| Canon | `TESTING-3`, `TESTING-9`, `FLOW-8`, `FLOW-11`, `FLOW-12` yêu cầu production transport/internal hops thật, external provider result deterministic, và một owner dựng world. |
| Standalone infrastructure | `PostgreSqlContainer('postgres:16-alpine')` start/stop thành công trong 2.8 giây; standalone `e2e-setup` + `e2e-teardown` profile `core` thành công trong 5.6 giây. Docker và `E2eStackService` không phải failure owner. |
| Current Jest lane | `src/tests/e2e/jest-e2e.json` chạy `ts-jest` cho cả TS lẫn JS, đặt `transformIgnorePatterns: []`, rồi thực thi Testcontainers trong TS `globalSetup`. Focused runs đứng trước container creation và không phát ra hook/assertion failure. |
| Transform probe | Bỏ transform toàn `node_modules` làm runner khởi động nhanh nhưng vỡ trên ESM-only dependencies. Error chain đã định danh `p-defer`, `superjson`, `copy-anything`, `is-what`, `p-retry`, `is-network-error`, `uuid`, `jose`. |
| Sibling family | `D:\Repositories\nivo-backend\src\tests\e2e\expert\jest-e2e.json` dùng `isolatedModules`, CommonJS TS transform và allowlist ESM; không transform toàn bộ `node_modules`. StarCi sẽ mirror shape này với package list riêng đo từ StarCi. |
| Concurrent lock | Một run từng chờ per-user Testcontainers lock do Nivo E2E giữ; task khác được giữ nguyên. Sau khi lock nhả, canonical Jest run vẫn đứng trước container creation, nên lock là một witness riêng chứ không phải toàn bộ root cause. |
| Four target flows | Cả bốn dùng GraphQL/Nest production path, PostgreSQL + Redis/BullMQ thật, `AiInvokeService`/routing/quota/persistence thật, và chỉ spy concrete `ChatOpenAI`/Qdrant/GitHub boundary. Không có evidence yêu cầu sửa flow source. |
| Version compatibility | Installed `jest@30.3.0`, `ts-jest@29.4.9`, TypeScript `5.9.3`, Testcontainers `12.0.1`; local peer ranges của `ts-jest` chấp nhận Jest 30 và TypeScript <7. Không có dependency migration trong boundary. |

### Architecture

| Concern | Planned owner |
|---|---|
| Infrastructure lifecycle | `src/tests/helpers/e2e-runner.ts` tạo `E2eStackService`, gọi `up()`/`seed()`, spawn local Jest process với inherited environment, rồi gọi `down()` trong `finally`. |
| Jest process | Child process chạy exact `src/tests/e2e/jest-e2e.json`, `--runInBand`, nhận nguyên user arguments và trả nguyên exit status. |
| Transform policy | E2E config mirror Nivo: `isolatedModules`, CommonJS/Node resolution, `allowJs`, `esModuleInterop`, và ESM allowlist đo được; CommonJS `node_modules` không bị ts-jest transform. |
| Integration project | Root `jest.config.ts` cùng TS `globalSetup/globalTeardown` được giữ nguyên trong r1. `npm run test:int` là lane khác và không cần đổi để chứng minh bốn E2E flow. |
| Business flows | Bốn named specs và content-AI control spec là `REUSE`; không đổi assertion, provider stub, timeout hay product wiring. |

### Proposed source tree

| Path | Action | Shape owner |
|---|---|---|
| `package.json` | MODIFY | `test:e2e` gọi local TypeScript lifecycle runner; không thêm package hoặc đổi các lane khác. |
| `src/tests/helpers/e2e-runner.ts` | ADD | FLOW-8 owner duy nhất: boot/seed, spawn local Jest với inherited env/stdio và forwarded args, propagate exit, teardown cả success/failure/partial-start. |
| `src/tests/helpers/e2e-runner.spec.ts` | ADD | Twin cho lifecycle decisions: order, forwarding, exit propagation và cleanup trên mọi nhánh. |
| `src/tests/e2e/jest-e2e.json` | MODIFY | Bỏ `globalSetup`/`globalTeardown`; mirror Nivo isolated transform và StarCi ESM allowlist; giữ aliases, DB reset hook, timeout, roots và serial execution. |
| `src/tests/helpers/e2e-setup.ts` | MODIFY | Chỉ sửa mô tả owner: file này tiếp tục phục vụ root integration project, không còn tự nhận là owner của `test:e2e`. Không đổi runtime. |
| `src/tests/helpers/e2e-teardown.ts` | MODIFY | Cùng boundary tài liệu với setup; integration runtime giữ nguyên. |
| `src/tests/helpers/e2e-stack.service.ts` | MODIFY | Chỉ sửa mô tả consumer/lifecycle cho đúng runner mới và integration project; profile/start/stop behavior giữ nguyên. |

Không dự kiến đổi `package-lock.json`: toàn bộ runtime (`ts-node`, Jest, Testcontainers) đã có trong repository.

### Test matrix

| Case | Expected proof |
|---|---|
| Runner happy path | `up -> seed -> spawn Jest -> down`; trả exit code 0. |
| Jest non-zero | Runner vẫn `down`, giữ nguyên non-zero exit code. |
| Child spawn error | Runner teardown rồi surface failure; không báo green. |
| Partial infrastructure start failure | `down` vẫn được gọi để dừng mọi container đã track; Jest child không chạy. |
| Argument forwarding | `--runTestsByPath`, `--listTests`, `--detectOpenHandles` và named paths đến child không bị nuốt hoặc đổi thứ tự. |
| Environment handoff | Host/port/credential environment do stack tạo có trong Jest child; giá trị secret không log/persist. |
| ESM transform boundary | Tám ESM-only packages đo được load qua ts-jest; CommonJS dependencies bị ignore; focused target không đứng ở module evaluation. |
| Core stack startup | Với `E2E_STACK_PROFILE=core`, PostgreSQL + Redis tạo trước assertion và đều dừng sau run. |
| External Testcontainers lock | Runner được phép chờ lock của process khác; không kill task khác, không tạo workaround phá lock. Sau khi nhả, run tiếp tục. |
| Challenge flow | `challenge-submission.e2e-spec.ts` chạy assertion về durable job, retry, charge, reward và exhausted guard. |
| Personal-project flow | `personal-project-review.e2e-spec.ts` chạy GraphQL persistence lẫn durable worker/retry/charge/reward assertions. |
| CV flow | `cv-build.e2e-spec.ts` chạy generate/upload/revise, failure và retry/idempotency assertions. |
| Mock-interview flow | `mock-interview-grading-resilience.e2e-spec.ts` chạy first grade, replay và concurrent duplicate serialization assertions. |
| Control flow | `content-ai-session.e2e-spec.ts` vẫn pass để chứng minh runner repair không chỉ hợp với BullMQ-heavy specs. |
| Provider isolation | Không có live model call; concrete provider SDK result tiếp tục bị deterministic stub theo TESTING-9/FLOW-12. |
| Cleanup | Sau mỗi focused/full run không còn container mang session label của run và không còn Jest child do runner tạo. |
| Regression gates | Runner twin, full unit, typecheck, build, changed-file lint và `git diff --check` đều pass. |

### Exact proof commands for Review

| Gate | Command shape |
|---|---|
| Runner twin | `npx jest --selectProjects unit --runInBand src/tests/helpers/e2e-runner.spec.ts` |
| Full unit | `npm test -- --runInBand` |
| Typecheck/build | `npm run typecheck`; `npm run build` |
| Focused E2E | Set process-only `TESTCONTAINERS_RYUK_DISABLED=true`, `E2E_STACK_PROFILE=core`; run `npm run test:e2e -- --runTestsByPath` with the four exact target files plus `content-ai-session.e2e-spec.ts`. |
| Cleanup | Read-only process/container inspection after Jest exits; no broad kill command. |
| Diff/lint | ESLint exact changed TS files; `git diff --check <baseline>..worktree`. |

### Assumptions and exclusions

| Item | Decision |
|---|---|
| GraphQL/business contracts | Excluded; live schema and target flow source remain binding and unchanged. |
| Four target specs | Excluded from writes unless Review finds a source-backed runner-independent defect. A newly required flow edit returns to Review. |
| Root integration lane | Excluded from r1 writes. Its shared setup/teardown files remain live and only receive truthful comments. |
| Full 77-suite E2E lane | Not an Apply completion gate for this repair. The four owed flows plus one control prove the stated capability; broad-lane debt remains separate. |
| Dependency upgrades | Excluded; installed versions satisfy local peer contracts. |
| Ryuk policy | No production default change. Disabling Ryuk is process-only proof configuration; cleanup is explicitly inspected. |
| Timeouts/thresholds | No increase, retry inflation, skipped test, assertion weakening or provider fallback. |

### OUTPUTS

| Concept | Result |
|---|---|
| Capability brief | `e2e-runner-stabilization-plan-r1`: lifecycle đứng ngoài Jest global setup, transform mirror sibling Nivo, business flows giữ nguyên. |
| Architecture concept | Một parent runner sở hữu disposable world và child Jest chỉ sở hữu discovery/transform/assertions; environment truyền qua process boundary, cleanup thuộc `finally`. |
| Acceptance concept | Runner decisions có twin; năm focused flow phải chạy assertion thật, không model call, không leak container/process. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/e2e-runner-stabilization.md` | `added` — ghi Plan r1, evidence, exact proposed tree, test matrix, assumptions và exclusions; không có source write. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Không có product rule hoặc credential decision trong Plan; chuyển sang `starci-be-feature-review` để challenge exact boundary. |

### WARNINGS

| Warning | Impact |
|---|---|
| Candidate transform chạy qua CLI vẫn đứng vì TS `globalSetup` hiện tại còn active. | Đây là lý do r1 tách lifecycle khỏi Jest; allowlist một mình chưa được claim là đủ. |
| Root integration project vẫn dùng TS global setup và transform-all policy. | R1 không tuyên bố sửa `npm run test:int`; nếu Review yêu cầu một runner chung cho cả hai lane thì phải revise exact tree trước Apply. |
| Full workflow validator có debt lịch sử/parallel ngoài record này. | Chỉ record này được yêu cầu zero validation errors; không được claim toàn root sạch. |
| Worktree có nhiều thay đổi song song ngoài capability. | Review/Apply phải preserve chúng; baseline confirmation và exact staging bắt buộc. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Chỉ tăng Jest/test timeout | Tách lifecycle owner và sửa transform boundary | Runner đứng trước hook/assertion; timeout lớn hơn chỉ chờ lâu hơn. |
| Transform toàn `node_modules` | Ignore CommonJS, allowlist ESM-only packages | Current policy làm ts-jest xử lý dependency graph không cần thiết và đứng trước container creation. |
| Ignore toàn `node_modules` | Mirror Nivo selective ESM allowlist | StarCi thực sự import ESM-only packages và đã phát `Unexpected token export/import` khi ignore toàn bộ. |
| Sửa bốn flow để né runner | Giữ nguyên flow, sửa shared lifecycle/transform owner | Standalone infra khỏe và không flow nào phát assertion failure. |
| Kill Testcontainers/Jest của repo khác | Chờ lock nhả và chỉ quản lý child do runner tạo | Concurrent process là unrelated user work. |
| Đưa live provider call vào E2E | Giữ concrete SDK deterministic stubs | TESTING-9/FLOW-12 cấm model call trong flow lane. |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge exact lifecycle runner, ESM list, root-integration exclusion và failure semantics | Chạy `starci-be-feature-review` trên `e2e-runner-stabilization-plan-r1`. |
| Production/test source implementation | Explicit approval của một Review revision rồi chạy `starci-be-feature-apply`. |
| Bốn target E2E và control-flow assertion proof | Apply chạy exact focused command sau runner repair. |

## review

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy; Nest executable `core` |
| Database | Primary PostgreSQL connection `primary`; E2E runner owns disposable PostgreSQL and Redis Testcontainers only, with no migration or seed change |
| Repo / branch | D:\Repositories\starci-academy-backend on `mtp` at `04636c2c` when Review began |
| Purpose | Challenge và khóa exact implementation boundary cho E2E runner stabilization cùng bốn composition-sync repairs. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\e2e-runner-stabilization.md |
| Language | vi |
| Phase | review |
| Touching | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\e2e-runner-stabilization.md only; Review không sửa product/test source |

Candidate revision: `e2e-runner-stabilization-review-r1`

Reviewed plan: `e2e-runner-stabilization-plan-r1`

### Review findings

| Finding | Verdict |
|---|---|
| Parent runner | Accepted with revision. An inline parent booted `E2eStackService`, spawned a Jest child with inherited environment, ran `content-ai-session.e2e-spec.ts` 6/6 in 13.223 seconds, then returned exit 0 after teardown. Implementation must use async child lifecycle and handle `SIGINT`/`SIGTERM`; `spawnSync` is not accepted because cleanup on interruption is not guaranteed. |
| ESM transform | Revised. The eight Plan packages load challenge/content graphs, but mock interview additionally imports ESM-only `@faker-js/faker`. Frozen allowlist is `p-defer`, `superjson`, `copy-anything`, `is-what`, `p-retry`, `is-network-error`, `uuid`, `jose`, `@faker-js/faker`. |
| `isolatedModules` | Revised. `ts-jest` warns that its top-level `isolatedModules` option is deprecated. Freeze `isolatedModules: true` inside the transform's `tsconfig` object, alongside CommonJS/Node resolution, `resolvePackageJsonExports: false`, `allowJs: true`, `esModuleInterop: true`. |
| Challenge flow | Plan exclusion rejected. With Testcontainers setup bypassed only for diagnosis, Jest loaded the module graph and Nest reported missing `ChallengeEvaluationPromptService` at `ProcessGitSubmissionGradeStepService` index 7. The E2E manual module must import/register that production prompt service. |
| Personal-project flow | Plan exclusion rejected. Nest reported missing `ProjectEvaluationPromptService` at `ReviewMilestoneTaskGradeStepService` index 8. The operational manual module must import/register it. |
| CV flow | Plan exclusion rejected. Nest reported missing `CvScoringPromptService` at `CvScoringService` index 2. The manual module must import/register it. |
| Mock-interview flow | Plan exclusion rejected. After adding `@faker-js/faker` to the diagnostic allowlist, Nest reported missing `GradeMockInterviewSessionParseService` at `MockInterviewGradingService` index 2. The manual module must import/register it. |
| Diagnostic cleanup noise | Not a product defect. Undefined DB/Redis/app cleanup errors were consequences of intentionally replacing global setup with teardown no-op and are excluded from source changes. Real parent-runner proof supplies valid infrastructure environment. |
| Business contracts | Unchanged. No GraphQL schema, production provider routing, parser, prompt, quota, charge, retry, reward or persistence source enters the boundary. |

### Frozen architecture

| Concern | Exact revision r1 |
|---|---|
| Parent lifecycle | `runE2e(argv, dependencies)` creates one stack, calls `up()` then `seed()`, starts one local Jest child with inherited `env`/stdio and `shell: false`, waits for close, and calls `down()` exactly once in `finally`, including partial startup and spawn failures. |
| Child command | Use `process.execPath` with local `require.resolve("jest/bin/jest")`. Forward user arguments, then append frozen `--config ./src/tests/e2e/jest-e2e.json` and `--runInBand` so the lane/config cannot drift. |
| Exit contract | Child code 0/non-zero is returned unchanged. Spawn errors reject after cleanup. `SIGINT`/`SIGTERM` are forwarded to the active child, cleanup is awaited, then parent reports conventional 130/143; no early `process.exit()` may skip `finally`. |
| Jest ownership | E2E JSON no longer owns `globalSetup`/`globalTeardown`; it retains DB reset, root, alias, timeout and serial settings and owns only discovery/transform/assertion execution. |
| Transform | CommonJS dependencies are ignored. Exactly nine measured ESM package roots are transformed with the frozen CommonJS TS config; no transform-all and no ignore-all policy. |
| Flow composition | Four target specs add one declaring-file import and one provider registration each. All existing mocks, production services, GraphQL doors, workers, queues and assertions remain byte-for-byte outside those import/provider rows. |
| Integration lane | Root `jest.config.ts` remains excluded. Existing setup/teardown remain runtime owners for `test:int`; only their comments and `E2eStackService` consumer comment become truthful. |

### Exact production boundary

| Path | Action | Frozen change |
|---|---|---|
| `package.json` | MODIFY | Replace only `test:e2e` command with `node -r ts-node/register/transpile-only src/tests/helpers/e2e-runner.ts`; no dependency or other script change. |
| `src/tests/helpers/e2e-runner.ts` | ADD | Signal-safe parent lifecycle and child Jest process described above; exported run seam accepts injected dependencies for deterministic twin tests. |
| `src/tests/helpers/e2e-runner.spec.ts` | ADD | Unit twin for order, arguments, env, success, child non-zero, spawn failure, partial start, SIGINT/SIGTERM and exactly-once cleanup. |
| `src/tests/e2e/jest-e2e.json` | MODIFY | Remove TS global setup/teardown; install frozen nine-package ESM allowlist and non-deprecated ts-jest `tsconfig` options; preserve all other lane settings. |
| `src/tests/helpers/e2e-setup.ts` | MODIFY | Comment-only: identify remaining root integration-project ownership. |
| `src/tests/helpers/e2e-teardown.ts` | MODIFY | Comment-only: identify remaining root integration-project ownership. |
| `src/tests/helpers/e2e-stack.service.ts` | MODIFY | Comment-only: identify parent E2E runner and root integration project as consumers; no profile/start/stop logic change. |
| `src/tests/e2e/challenge-submission.e2e-spec.ts` | MODIFY | Import/register `ChallengeEvaluationPromptService`; no other change. |
| `src/tests/e2e/personal-project-review.e2e-spec.ts` | MODIFY | Import/register `ProjectEvaluationPromptService` in operational worker module; no other change. |
| `src/tests/e2e/cv-build.e2e-spec.ts` | MODIFY | Import/register `CvScoringPromptService`; no other change. |
| `src/tests/e2e/mock-interview-grading-resilience.e2e-spec.ts` | MODIFY | Import/register `GradeMockInterviewSessionParseService`; no other change. |

`package-lock.json`, root `jest.config.ts`, production source, GraphQL schema and every other E2E spec are explicitly excluded.

### Frozen acceptance matrix

| Gate | Required evidence |
|---|---|
| Runner twin | Every lifecycle/exit/signal branch named above passes; tests assert observable order and result, not only collaborator calls. |
| Config shape | Effective Jest config shows no global setup/teardown, exact nine-package allowlist, `isolatedModules` inside `tsconfig`, existing reset/aliases/timeout/serial settings preserved. |
| Parent control | `content-ai-session.e2e-spec.ts` passes 6/6 through `npm run test:e2e`; no CLI transform/global-setup override. |
| Challenge | All four existing cases run through GraphQL + real Redis/BullMQ and pass. |
| Personal project | Both existing describes and durable worker cases pass; provider registration is the only source delta. |
| CV | All existing generate/upload/revise/retry/failure cases pass. |
| Mock interview | All three persistence/replay/concurrency cases pass. |
| Isolation | No live model call, threshold weakening, skipped case, increased timeout, `--forceExit`, fallback or provider-wrapper override in acceptance commands. |
| Cleanup | After each proof, no child Jest process from the runner and no Testcontainers container from that run remains. An unrelated concurrent process is never killed. |
| Regression | Focused runner twin, full unit, typecheck, build, lint exact changed TS files, workflow validation and `git diff --check` pass. |

### Exact Apply proof command shape

Set only process-local `TESTCONTAINERS_RYUK_DISABLED=true` and `E2E_STACK_PROFILE=core`, then invoke `npm run test:e2e -- --runTestsByPath` with these exact files in one serial run:

1. `src/tests/e2e/content-ai-session.e2e-spec.ts`
2. `src/tests/e2e/challenge-submission.e2e-spec.ts`
3. `src/tests/e2e/personal-project-review.e2e-spec.ts`
4. `src/tests/e2e/cv-build.e2e-spec.ts`
5. `src/tests/e2e/mock-interview-grading-resilience.e2e-spec.ts`

No `--forceExit`, Jest setup override, transform override, timeout override or assertion filter is permitted in Apply acceptance.

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate revision | `e2e-runner-stabilization-review-r1` freezes an external lifecycle owner, exact nine-package transform boundary, four provider-composition syncs and signal-safe cleanup. |
| Capability | Focused AI E2E flows can reach disposable infrastructure, execute production transport/internal orchestration with deterministic external provider results, and terminate without leaked runner-owned resources. |
| Architecture | Parent owns world lifecycle; child Jest owns tests; manual E2E modules mirror new production provider dependencies without changing business behavior. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/e2e-runner-stabilization.md` | `modified` — appended Review r1 evidence, rejected assumptions, exact 11-file boundary and acceptance matrix; no product/test source changed. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve exact Review revision for Apply? | Default: `approve e2e-runner-stabilization-review-r1`; alternative: provide one requested revision before any source write. |

### WARNINGS

| Warning | Impact |
|---|---|
| Root integration project retains its current TS global setup and transform-all policy. | This revision proves `test:e2e` only and must not claim `test:int` stabilization. |
| Nine-package allowlist is frozen for the five named flows, not every one of 77 E2E files. | A package needed only by another flow requires a later measured revision; Apply cannot silently broaden this list. |
| Worktree remains dirty with unrelated observability/course/Nivo/workflow changes. | Apply requires explicit branch/current-worktree/boundary confirmation and a clean recoverable baseline before source writes. |
| Full workflow validator has historical/parallel errors outside this record. | This record must remain zero-error; no global-clean claim is allowed. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Plan exclusion of all four target E2E files | Add exactly one new production seam provider to each manual test module | Diagnostic module loading exposed real Nest DI failures introduced by commit `099a9a8e`. |
| Eight-package ESM allowlist | Add `@faker-js/faker` as the ninth package | Mock-interview module graph failed on its ESM-only entry before Nest compile. |
| Top-level ts-jest `isolatedModules` | Put `isolatedModules: true` inside transform `tsconfig` | Installed ts-jest emits a deprecation warning for the top-level option. |
| Synchronous child process as sufficient lifecycle owner | Async child plus explicit signal forwarding/awaited teardown | Interruptions must not skip cleanup. |
| Harden four specs' `afterAll` against undefined resources | Keep cleanup unchanged and fix the setup/composition owners | Undefined cleanup appeared only under deliberate no-infrastructure diagnostics. |
| Expand r1 to root integration runner | Keep `test:int` unchanged | No evidence is needed from that lane to close the four owed E2E flows. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit owner approval of candidate revision and exact 11-file production boundary | User replies `approve e2e-runner-stabilization-review-r1`. |
| Baseline confirmation | Before Apply writes: confirm `mtp`, current worktree baseline and exact Review r1 boundary. |
| Implementation and all frozen gates | Run `starci-be-feature-apply` only after both approvals. |

## review r2

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy; Nest executable `core` |
| Database | Primary PostgreSQL connection `primary`; E2E runner owns disposable PostgreSQL and Redis Testcontainers only, with no migration or seed change |
| Repo / branch | D:\Repositories\starci-academy-backend on `mtp` at `3c3a7514dfe0022d9c4e9319a86fb4d73232fc3d` |
| Purpose | Ghi explicit owner approval cho exact Review r1 và mở khóa Apply handoff. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\e2e-runner-stabilization.md |
| Language | vi |
| Phase | review |
| Touching | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\e2e-runner-stabilization.md only; không sửa product/test source |

Approved revision: `e2e-runner-stabilization-review-r1`

Owner approval received verbatim: `approve e2e-runner-stabilization-review-r1`.

Exact approved production boundary remains the 11 paths frozen in the preceding Review. Architecture, nine-package allowlist, signal-safe lifecycle, four provider registrations, exclusions and acceptance matrix are unchanged.

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `e2e-runner-stabilization-review-r1` is frozen and eligible for `starci-be-feature-apply`. |
| Approved capability | Parent-owned disposable E2E lifecycle, selective ESM transform and four composition-sync repairs, with no business-contract change. |
| Apply handoff | Apply may begin only after explicit confirmation of `mtp`, current-worktree baseline and exact r1 boundary. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/e2e-runner-stabilization.md` | `modified` — appended explicit owner approval and Apply handoff; no product/test source changed. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Confirm Apply baseline authority | Default: `confirm mtp + current worktree baseline + exact r1 boundary`; alternative: stop before baseline/source writes. |

### WARNINGS

| Warning | Impact |
|---|---|
| Worktree still contains unrelated modified/untracked files. | Apply must baseline only after owner confirmation, preserve all concurrent work and stage exact capability paths thereafter. |
| Root integration lane and broad 77-suite coverage remain excluded. | Apply cannot widen the approved claim or source tree. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | Owner approved Review r1 without further revision. | No new feedback changed the frozen architecture or boundary. |

### OWED

| Owed | Cleared by |
|---|---|
| Branch/current-worktree/exact-boundary confirmation | User replies `confirm mtp + current worktree baseline + exact r1 boundary`. |
| Baseline, implementation and frozen proof gates | Run `starci-be-feature-apply` after that confirmation. |

## apply

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy; Nest executable `core` |
| Database | Primary PostgreSQL connection `primary`; parent runner owns disposable PostgreSQL and Redis Testcontainers under `E2E_STACK_PROFILE=core`; no migration or seed change |
| Repo / branch | D:\Repositories\starci-academy-backend on `mtp` at baseline `50a6121fe2f72d08daa0d19b40a657e790d71515` |
| Purpose | Apply exact Review r1 so the parent runner owns E2E infrastructure lifecycle and five AI flows execute through their production boundaries. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\e2e-runner-stabilization.md |
| Language | vi |
| Phase | apply |
| Touching | `package.json`; `src/tests/helpers/e2e-runner.ts`; `src/tests/helpers/e2e-runner.spec.ts`; `src/tests/e2e/jest-e2e.json`; `src/tests/helpers/e2e-setup.ts`; `src/tests/helpers/e2e-teardown.ts`; `src/tests/helpers/e2e-stack.service.ts`; `src/tests/e2e/challenge-submission.e2e-spec.ts`; `src/tests/e2e/personal-project-review.e2e-spec.ts`; `src/tests/e2e/cv-build.e2e-spec.ts`; `src/tests/e2e/mock-interview-grading-resilience.e2e-spec.ts`; và workflow record này |

Applied revision: `e2e-runner-stabilization-review-r1`

Baseline commit: `50a6121fe2f72d08daa0d19b40a657e790d71515`

Tracked diff: `50a6121fe2f72d08daa0d19b40a657e790d71515..worktree`

Owner baseline confirmation received verbatim: `confirm mtp + current worktree baseline + exact r1 boundary`.

### Implementation evidence

| Concern | Applied result |
|---|---|
| Parent lifecycle | `runE2e(argv, dependencies)` owns `up -> seed -> Jest child -> down`, returns the child code, tears down on startup/spawn/test failure and maps forwarded `SIGINT`/`SIGTERM` to 130/143 without early `process.exit()`. |
| Child contract | Local `jest/bin/jest` is launched with `process.execPath`, inherited environment/stdio, `shell: false`, user arguments first and frozen config/serial arguments last. |
| Transform boundary | Jest no longer owns global setup/teardown; ts-jest uses CommonJS/Node options with `isolatedModules` inside `tsconfig` and transforms exactly the nine reviewed ESM package roots. |
| Composition sync | Challenge, personal-project, CV and mock-interview manual modules each import/register exactly the reviewed production prompt/parse provider. |
| Integration lane | Existing setup/teardown/stack runtime is unchanged; comments now identify root integration ownership and the parent runner consumer truthfully. |
| Live boundary | Five focused specs called GraphQL HTTP doors and real Redis/BullMQ/PostgreSQL internals through the running Nest test applications; external model results remained deterministic concrete-provider stubs. |

### Commands and results

| Command | Result |
|---|---|
| `npm test -- --runTestsByPath src/tests/helpers/e2e-runner.spec.ts --runInBand` | PASS — 1 suite, 9 tests; covers order, forwarding, environment, zero/non-zero/null child exit, async/sync spawn failure, partial startup, seed failure, SIGINT, SIGTERM and exactly-once cleanup. |
| `npx eslint src/tests/helpers/e2e-runner.ts src/tests/helpers/e2e-runner.spec.ts src/tests/helpers/e2e-setup.ts src/tests/helpers/e2e-teardown.ts src/tests/helpers/e2e-stack.service.ts src/tests/e2e/challenge-submission.e2e-spec.ts src/tests/e2e/personal-project-review.e2e-spec.ts src/tests/e2e/cv-build.e2e-spec.ts src/tests/e2e/mock-interview-grading-resilience.e2e-spec.ts` | PASS — zero lint errors. |
| `npx jest --config ./src/tests/e2e/jest-e2e.json --showConfig` | PASS — no global setup/teardown; exact nine-root allowlist; reviewed ts-jest options effective; aliases, DB reset, timeout and one worker preserved. |
| `npm run typecheck` | PASS — zero TypeScript errors. |
| `npm run build` | PASS — webpack compiled successfully; only existing package-discovery warnings for Node built-ins. |
| `npm test -- --runInBand` | PASS — 227 suites, 1462 tests, 0 snapshots in 156.603 seconds. |
| `$env:TESTCONTAINERS_RYUK_DISABLED='true'; $env:E2E_STACK_PROFILE='core'; npm run test:e2e -- --runTestsByPath src/tests/e2e/content-ai-session.e2e-spec.ts src/tests/e2e/challenge-submission.e2e-spec.ts src/tests/e2e/personal-project-review.e2e-spec.ts src/tests/e2e/cv-build.e2e-spec.ts src/tests/e2e/mock-interview-grading-resilience.e2e-spec.ts` | PASS — 5 suites, 39 tests in 58.633 seconds; no setup/transform/timeout/force-exit override. |
| `node .claude/scripts/validate-workflows.mjs --root .workflows` plus target-error filter | TARGET PASS — latest check covered 70 records with zero errors for `feature/starci-academy/e2e-runner-stabilization.md`; concurrent root errors moved from 527 to 534 between checks. |
| `git diff --check 50a6121f -- package.json src/tests` | PASS — no whitespace errors in approved product/test boundary. |
| Process and Docker inspection after E2E | PASS for runner ownership — no `e2e-runner.ts` process and no Testcontainers-owned PostgreSQL/Redis container from this run remained. Existing Compose services and old Review diagnostic processes were not killed. |

### OUTPUTS

| Concept | Result |
|---|---|
| E2E runner stabilization | Parent process now owns disposable infrastructure, passes its environment to one local serial Jest child and always performs cleanup. |
| Focused AI flow proof | Content AI, challenge, personal project, CV and mock interview all execute and pass through production transport/internal orchestration with deterministic external-provider results. |
| Approved revision | `e2e-runner-stabilization-review-r1` is fully applied against baseline `50a6121f`. |

### CHANGES

| Tree | Details |
|---|---|
| `package.json` | `modified` — `test:e2e` now enters the parent TypeScript runner. |
| `src/tests/helpers/e2e-runner.ts` | `added` — signal-safe parent lifecycle, Jest child invocation, exit propagation and dependency seam. |
| `src/tests/helpers/e2e-runner.spec.ts` | `added` — exhaustive lifecycle/exit/signal twin with 9 passing cases. |
| `src/tests/e2e/jest-e2e.json` | `modified` — removed global hooks and froze selective nine-package ESM transform configuration. |
| `src/tests/helpers/e2e-setup.ts` | `modified` — comment-only integration ownership correction. |
| `src/tests/helpers/e2e-teardown.ts` | `modified` — comment-only integration ownership correction. |
| `src/tests/helpers/e2e-stack.service.ts` | `modified` — comment-only lifecycle consumer correction. |
| `src/tests/e2e/challenge-submission.e2e-spec.ts` | `modified` — imported/registered `ChallengeEvaluationPromptService`. |
| `src/tests/e2e/personal-project-review.e2e-spec.ts` | `modified` — imported/registered `ProjectEvaluationPromptService`. |
| `src/tests/e2e/cv-build.e2e-spec.ts` | `modified` — imported/registered `CvScoringPromptService`. |
| `src/tests/e2e/mock-interview-grading-resilience.e2e-spec.ts` | `modified` — imported/registered `GradeMockInterviewSessionParseService`. |
| `.workflows/feature/starci-academy/e2e-runner-stabilization.md` | `modified` — appended Apply context, implementation evidence and exact proof results. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Apply boundary and proof are complete. |

### WARNINGS

| Warning | Impact |
|---|---|
| Jest printed `Jest did not exit one second after the test run has completed` after all 39 assertions passed, then exited normally. | A test-owned asynchronous handle survives briefly; runner-owned child and Testcontainers resources still terminated. This does not invalidate r1 but is evidence for a later bounded open-handle audit if stricter immediate-exit behavior is required. |
| Old Review diagnostic Jest processes with command-line transform/global-hook overrides remain active and predate this Apply run. | They are not children or resources of the new runner and were preserved under the explicit no-unrelated-kill rule. |
| Concurrent MiAmia/observability/lint workflow edits appeared after baseline. | They remain outside this capability and must not be staged with the Apply commit. |
| Full workflow root had 534 historical/parallel validation errors at the final pre-commit check. | Target record has zero validation errors; no global-clean claim is made. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | Applied the exact approved revision. | No new architecture or source-boundary decision arose during Apply. |

### OWED

| Owed | Cleared by |
|---|---|
| None | All frozen implementation and proof gates completed. |
