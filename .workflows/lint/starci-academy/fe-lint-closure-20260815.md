<!-- starci-workflow: v2 -->

# StarCi FE canonical lint closure

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | web |
| Repo / branch | D:\Repositories\starci-academy-fe @ `main` (`1392cdcd`) |
| Purpose | Đóng canonical FE lint mà không lint generated design artifacts/mirror và sửa false-positive trên shell test |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\lint\starci-academy\fe-lint-closure-20260815.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; target source/config chỉ đọc |

### BASELINE

| Probe | Result |
|---|---|
| Canon sync | Mirror `plugins/eslint-canon` khớp Trust; config đang import canonical plugin |
| Adoption audit | `ok: true`; không thiếu rule, không rule nào dưới error, inline config bị cấm |
| Full ESLint snapshot đầu | 105 errors: 59 `.artifacts`, 45 generated mirror, 1 source test false-positive |
| Live snapshot sau concurrent write | Thêm 186 `indent` tại `CourseDetailPage/index.tsx`; không đổi classification ba nhóm cũ |

### ROOT CAUSES

| Group | Evidence | Classification | Direction |
|---|---|---|---|
| Disposable design output | Sáu candidate/script artifacts bị full-repo ESLint quét | generated artifact/config boundary | Ignore toàn `.artifacts/**` thay vì duy trì danh sách đuôi rời rạc |
| Canon mirror | Bốn file generated mirror bị chính consumer lint bằng style/rules của app | generated artifact/config boundary | Ignore `plugins/eslint-canon/**`; source canon vẫn có test owner tại Trust |
| Shell test | `vendor-boundary` áp production empty-shell invariant lên `DropdownShell/index.test.tsx` | canonical rule defect | Rule bỏ qua `.test/.spec`, thêm regression test rồi sync mirror |
| Course detail | 186 `indent`, xuất hiện trong thay đổi concurrent sau snapshot đầu | product formatting defect | Chỉ mechanical ESLint fix sau khi xác nhận file không còn bị session khác ghi |

### CANDIDATE TREE

| Action | Exact path | Responsibility |
|---|---|---|
| MODIFY | `D:\Repositories\starci-academy-fe\eslint.config.mjs` | Ignore disposable `.artifacts/**` và generated `plugins/eslint-canon/**`; không ignore product `src` |
| MODIFY | `D:\Repositories\starci-academy-backend\.claude\sources\fe\vendor-boundary.mjs` | Exclude test/spec files khỏi production shell-empty invariant |
| MODIFY | `D:\Repositories\starci-academy-backend\.claude\sources\fe\vendor-boundary.test.mjs` | Prove production shell vẫn fail và test shell được phép fixture content |
| GENERATE | `D:\Repositories\starci-academy-fe\plugins\eslint-canon\vendor-boundary.mjs` | Exact sync output từ Trust |
| GENERATE | `D:\Repositories\starci-academy-fe\plugins\eslint-canon\vendor-boundary.test.mjs` | Exact sync output từ Trust |
| MODIFY | `D:\Repositories\starci-academy-fe\src\components\pages\CourseDetailPage\index.tsx` | Mechanical indent-only repair after concurrency guard |

### PROOF COMMANDS

| Gate | Command / pass condition |
|---|---|
| Canon tests | Node test lane owning `vendor-boundary.test.mjs` passes |
| Sync | `node .claude/scripts/sync-fe-lint.mjs --target D:\Repositories\starci-academy-fe` |
| Adoption | `node .claude/scripts/audit-fe-lint-adoption.mjs --target D:\Repositories\starci-academy-fe --probe src/components/shells/DropdownShell/index.tsx` returns `ok:true` |
| Full lint | `npm run lint` exits 0, zero errors/warnings under frozen policy |
| Static | `npm run typecheck`; production build exit 0 |
| Diff | No inline disable, severity weakening, product ignore, or semantic CourseDetail change |

### OUTPUTS

| Concept | Result |
|---|---|
| Adoption | Canon is already fully adopted and strict |
| Repair policy | Generated trees are excluded; product source remains strict |
| Rule policy | Fix canonical false-positive at Trust owner and sync it |
| Product policy | Current CourseDetail drift gets indent-only repair with concurrency guard |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\lint\starci-academy\fe-lint-closure-20260815.md` | added — measured Plan and candidate boundary |

### NEED APPROVALS

| Question | Options |
|---|---|
| Review route | Review exact six-path boundary; Apply only after explicit revision approval |

### WARNINGS

| Warning | Impact |
|---|---|
| `CourseDetailPage/index.tsx` changed while measurement ran | Apply must compare file identity immediately before edit and stop if another writer is active |
| Ignoring generated mirror removes duplicate lint | Canon source tests remain mandatory; mirror equality is separately audited |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Disable `vendor-boundary` inline in test | Fix canonical rule applicability | Inline suppression hides the defect |
| Lower rules to warning | Keep all canonical rules error | Adoption contract forbids weakened severity |
| Ignore `src/**` or specific failing product file | Mechanical fix exact product file | Product source remains governed |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge config/rule/product classifications | `starci-fe-lint-sync-review` |
| Exact edits and gates | `starci-fe-lint-sync-apply` after approval |

## review r1 candidate

Approved revision: `fe-lint-closure-r1`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | web |
| Repo / branch | D:\Repositories\starci-academy-fe @ `main` (`1392cdcd`) |
| Purpose | Review exact generated ownership, canonical rule defect and product formatting boundary |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\lint\starci-academy\fe-lint-closure-20260815.md |
| Language | vi |
| Phase | review |
| Touching | Workflow/review evidence only |

### OUTPUTS

| Concept | Result |
|---|---|
| `fe-lint-closure-r1` | Approve generated-tree ignores, canonical test exclusion, synchronized mirror and one indent-only product repair |
| Frozen closure | Full lint/typecheck/build green; canon test and adoption audit green; no semantic UI change |

### CHANGES

| Tree | Details |
|---|---|
| This workflow | appended Review r1 candidate; no target write |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve revision | Reply `approve fe-lint-closure-r1` to run `starci-fe-lint-sync-apply`, or provide boundary feedback |

### WARNINGS

| Warning | Impact |
|---|---|
| Concurrent CourseDetail ownership | Apply may edit it only when unchanged from reviewed snapshot; otherwise split/defer that path |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Broad suppressions or weak severity | Exact generated ownership plus rule repair | Preserves strict product governance |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit r1 approval | Cleared 2026-08-15 by `approve fe-lint-closure-r1 và backend-zero-error-r1` |
| Apply and proof | `starci-fe-lint-sync-apply` |

## apply

Applied revision: `fe-lint-closure-r1`

Baseline commit: `3f44dd7b681dc5ed27bf9787c6cf53af900298e9`

Tracked diff: `3f44dd7..worktree`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | web |
| Repo / branch | D:\Repositories\starci-academy-fe @ `main` (`3f44dd7`) |
| Purpose | Apply strict canonical lint closure without changing rendered behavior |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\lint\starci-academy\fe-lint-closure-20260815.md |
| Language | vi |
| Phase | apply |
| Touching | `eslint.config.mjs`; Trust and mirrored `vendor-boundary` twins; `CourseDetailPage/index.tsx`; this workflow |

### GATE MATRIX

| Gate | Before | After |
|---|---|---|
| Full lint | 105 errors at frozen snapshot; later 186 concurrent indent errors | PASS — 0 errors, 0 warnings |
| Canon rule twin | Missing test-shell applicability case | PASS — 12/12 |
| Adoption audit | Strict and complete | PASS — `ok:true`, no missing/non-error rules, inline config refused |
| Typecheck | Not rerun for Apply | PASS |
| Production build | Not rerun for Apply | PASS — Next production routes generated |
| Visible runtime delta | None approved | Not applicable — CourseDetail diff is indentation only |

### OUTPUTS

| Concept | Result |
|---|---|
| Canonical adoption | Strict canonical FE lint is fully adopted and green |
| Generated ownership | Disposable design artifacts and generated lint mirror no longer masquerade as product source |
| Rule correctness | Production shells remain closed; shell RuleTester fixtures no longer false-fail |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-fe\eslint.config.mjs` | modified — exact generated-tree ownership ignores |
| `D:\Repositories\starci-academy-backend\.claude\sources\fe\vendor-boundary.mjs` | modified — production shell invariant excludes test/spec files |
| `D:\Repositories\starci-academy-backend\.claude\sources\fe\vendor-boundary.test.mjs` | modified — regression case for DropdownShell test fixture |
| `D:\Repositories\starci-academy-fe\plugins\eslint-canon\vendor-boundary.mjs` | generated — synchronized Trust mirror |
| `D:\Repositories\starci-academy-fe\plugins\eslint-canon\vendor-boundary.test.mjs` | generated — synchronized Trust mirror test |
| `D:\Repositories\starci-academy-fe\src\components\pages\CourseDetailPage\index.tsx` | modified — indentation only |
| This workflow | modified — Apply closure evidence |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| Next reports deprecated `middleware` convention | Build remains green; proxy migration belongs to another boundary |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Inline disable or weakened rule | Canonical applicability repair | Keeps production strict |

### OWED

| Owed | Cleared by |
|---|---|
| None | None |
