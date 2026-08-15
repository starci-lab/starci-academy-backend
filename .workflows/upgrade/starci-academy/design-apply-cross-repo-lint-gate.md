<!-- starci-workflow: v2 -->

## plan

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
| App | starci-academy |
| Repo / branch | Source/Backend D:\Repositories\starci-academy-backend branch mtp at 26e3bfd3209fd451915c55dc4ec1cc1cd223169f; Frontend D:\Repositories\starci-academy-fe branch main at d428f0e75aa4db5a4ed00fa69b56d426fdf88b51 |
| Purpose | Khóa một post-Apply lint gate không-fix cho cả Frontend và Backend sau FE Design Apply. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\design-apply-cross-repo-lint-gate.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow proposal này; không sửa skill, lint rule, config hoặc product source. |

### Window

| Scope | Value |
|---|---|
| Records | Toàn bộ `.workflows/*/*/*.md` hiện có trong Source |
| Evidence rule | Chỉ các dòng trong bảng `REJECTED`; bỏ `None` và `not recorded`. |
| Direct instruction | User yêu cầu riêng: sau `starci-fe-design-apply`, lint cả FE và BE; sau đó thu hẹp rõ “update lint thôi”. |

### Refusal groups

| Group | Refusals / witnesses | Rule at the time | Missing law | Home |
|---|---|---|---|---|
| Apply proof chỉ bao phủ một phía của runtime boundary | `.workflows/upgrade/shared-fe/authenticated-live-flow-proof.md:65`: “Apply chỉ dừng ở typecheck, lint, build hoặc screenshot” bị thay bằng proof cả UI/Network/Console/terminal; `.workflows/designs/nivo/provisioning-flows.md:445`: “Duyệt ngay chỉ vì backend Socket.IO đã có” bị thay bằng xác nhận cả backend và FE client boundary. | `starci-fe-design-apply/SKILL.md` nói “Run typecheck, lint and build” nhưng không định danh repo; live-flow proof yêu cầu xem cả frontend/backend terminal nhưng không bắt lint hai target. | Khi Apply đã resolve cả Frontend và Backend, chạy lint không-fix tại từng repo và ghi hai verdict độc lập; thiếu hoặc fail một verdict thì Apply chưa được đóng. | `starci-fe-design-apply/SKILL.md` PROCESS; assertion trong `.claude/sources/skills.test.mjs`. |

### Proposed rule

| Decision | Exact intent |
|---|---|
| Scope | Chỉ `starci-fe-design-apply`; không đổi lint rules, ESLint config, canon hoặc skill khác. |
| Frontend gate | Chạy repository-owned non-mutating lint command trong `Frontend` đã resolve. |
| Backend gate | Chạy repository-owned non-mutating lint command trong `Backend` đã resolve. Ưu tiên script check-only như `lint:check`; không chạy script có `--fix` như một proof gate. |
| Verdict | Append command, cwd, exit code và result riêng cho FE và BE. Cả hai phải chạy và pass trước khi Apply báo hoàn tất. |
| Failure ownership | Lint fail không tự mở rộng production boundary và không cho phép sửa repo còn lại; ghi `OWED` hoặc return đúng Review/capability owner. |
| Enforcement | Thêm focused assertion trong `.claude/sources/skills.test.mjs` để skill không quay lại wording lint mơ hồ một repo. |

### Acceptance evidence

| Gate | Proof |
|---|---|
| Skill structure | `python -X utf8 C:\Users\Hi\.codex\skills\.system\skill-creator\scripts\quick_validate.py D:\Repositories\starci-academy-backend\.claude\skills\starci-fe-design-apply` nếu validator path còn tồn tại; nếu không, dùng validator tương đương được discover từ skill-creator. |
| Focused trust test | `node --test .claude/sources/skills.test.mjs` |
| Full trust test | `npm --prefix .claude test` |
| Workflow | `node .claude/scripts/validate-workflows.mjs --root .workflows` |
| Diff | Chỉ approved workflow, `starci-fe-design-apply/SKILL.md` và focused trust test được thay đổi bởi capability này. |

### OUTPUTS

| Concept | Result |
|---|---|
| Cross-repository lint gate | Candidate `design-apply-dual-lint-v1`: FE Design Apply chỉ được đóng sau hai lint verdict không-fix, một cho Frontend và một cho Backend. |
| Scope discipline | Lint failure là proof failure, không phải quyền sửa ngoài approved production boundary. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/design-apply-cross-repo-lint-gate.md` | `added` — proposal, evidence, exact scope và acceptance gates. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Duyệt candidate `design-apply-dual-lint-v1` để vào Upgrade Review? | **Duyệt (khuyến nghị):** chỉ sửa Design Apply + focused test; hoặc nêu chính xác wording/gate cần đổi. |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend hiện có `lint` chứa `--fix` và `lint:check` không-fix. | Gate phải chọn `lint:check`; dùng `lint` sẽ tạo mutation ngoài design boundary. |
| Frontend hiện có untracked design artifacts và backend có nhiều untracked workflow records. | Apply phải giữ nguyên toàn bộ unrelated work và không dùng broad formatting/fix command. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Nâng cấp lint rules/config | Chỉ thêm orchestration gate trong FE Design Apply | User làm rõ: “update lint thôi”. |
| Chỉ lint Frontend vì đây là FE Design Apply | Lint độc lập cả Frontend và Backend | User yêu cầu rõ cả FE và BE. |
| Dùng backend `npm run lint` có `--fix` | Dùng non-mutating `npm run lint:check` | Proof gate không được âm thầm sửa backend ngoài boundary. |

### OWED

| Owed | Cleared by |
|---|---|
| Review exact wording, test assertion và write boundary | `$starci-fe-upgrade-review` trên candidate `design-apply-dual-lint-v1`. |
| Trust write | Explicit approval của một Upgrade Review revision rồi `$starci-fe-upgrade-apply`. |

## review

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
| App | starci-academy |
| Repo / branch | Source/Backend D:\Repositories\starci-academy-backend branch mtp at 26e3bfd3209fd451915c55dc4ec1cc1cd223169f; Frontend D:\Repositories\starci-academy-fe branch main at d428f0e75aa4db5a4ed00fa69b56d426fdf88b51 |
| Purpose | Review exact wording, home, test obligation và trust write boundary cho dual lint gate. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\design-apply-cross-repo-lint-gate.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; chưa sửa trust skill, test hoặc product source. |

### Evidence review

| Requirement | Verdict | Evidence |
|---|---|---|
| Deduplicated witnesses | PASS | Hai witness khác workflow/phase: shared FE Apply proof phải quan sát cả UI/backend terminal; Nivo provisioning phải xác nhận cả backend và FE client boundary. |
| Current-rule gap | PASS | Design Apply chỉ nói “Run typecheck, lint and build” và không định danh lint repo. |
| Smallest rule | PASS | Chỉ thêm lint không-fix cho hai target đã resolve; không nhân rộng typecheck/build sang BE và không đổi lint implementation. |
| Correct home | PASS | Cross-repo phase orchestration thuộc `starci-fe-design-apply/SKILL.md`; regression assertion thuộc `.claude/sources/skills.test.mjs`, không thuộc ESLint rule. |
| Direct user scope | PASS | User yêu cầu “lint cho cả fe be”, sau đó thu hẹp “update lint thôi”. |

### Revision

Candidate revision: `design-apply-dual-lint-r1`

Approved revision: `design-apply-dual-lint-r1`

Approval evidence: User trả lời `duyet` sau khi Review in exact wording, test obligation và three-path write boundary.

#### Exact skill wording

Thay câu mơ hồ `Run typecheck, lint and build without suppression.` bằng rule giữ typecheck/build hiện hữu ở Frontend và thêm đoạn bắt buộc:

> Run the approved Frontend typecheck, lint and build gates without suppression. In addition, before
> closing Apply, run a repository-owned non-mutating lint command in each resolved target repository:
> Frontend and Backend. Resolve the package manager and check-only script from that repository; prefer
> `lint:check` when available and never use `--fix` as a proof command.
>
> Append a `### CROSS-REPOSITORY LINT PROOF` table with one row per target containing repository,
> working directory, exact command, exit code and verdict. Both rows must be present and pass. A lint
> failure does not expand the approved production boundary: record it in `OWED` and return the repair
> to its owning Review or audit capability. Apply cannot close while either lint verdict is missing or
> failed.

#### Exact test obligation

Thêm một focused test vào `.claude/sources/skills.test.mjs` đọc `starci-fe-design-apply/SKILL.md` và assert đủ các invariant:

1. Có heading `### CROSS-REPOSITORY LINT PROOF`.
2. Nêu rõ cả `Frontend` và `Backend` resolved targets.
3. Bắt buộc non-mutating/check-only lint và cấm `--fix` làm proof.
4. Hai verdict đều phải present/pass trước khi Apply close.
5. Lint failure không mở rộng approved production boundary.

#### Exact Apply write boundary

| Path | Action |
|---|---|
| `.claude/skills/starci-fe-design-apply/SKILL.md` | MODIFY — thêm dual lint PROCESS rule. |
| `.claude/sources/skills.test.mjs` | MODIFY — thêm focused regression assertion. |
| `.workflows/upgrade/starci-academy/design-apply-cross-repo-lint-gate.md` | APPEND — Apply evidence và canonical outputs. |

Không sửa `package.json`, ESLint rule/config, canon, product source, Frontend hoặc Backend application code.

### Acceptance gates

| Gate | Exact proof |
|---|---|
| Skill validation | Run skill-creator `quick_validate.py` against `.claude/skills/starci-fe-design-apply`. |
| Focused regression | `node --test .claude/sources/skills.test.mjs` |
| Full trust suite | `npm --prefix .claude test` |
| Workflow validator | `node .claude/scripts/validate-workflows.mjs --root .workflows`; new record must emit no error, while unrelated pre-existing errors remain warnings. |
| Diff boundary | `git diff --check` and path reconciliation against the three approved paths. |

### OUTPUTS

| Concept | Result |
|---|---|
| Revision `design-apply-dual-lint-r1` | Exact wording, home, test obligation và three-path write boundary đã được review; đang chờ explicit approval. |
| Dual lint semantics | Chỉ lint cả hai repo; không mở rộng typecheck/build sang Backend và không tự sửa lint failure. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/design-apply-cross-repo-lint-gate.md` | `modified` — append Review revision và approval boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Duyệt revision `design-apply-dual-lint-r1` để `$starci-fe-upgrade-apply` sửa đúng ba path đã khóa? | **Duyệt (khuyến nghị):** apply exact wording/test/boundary; hoặc nêu row cần sửa. |

### WARNINGS

| Warning | Impact |
|---|---|
| Global workflow validator đang báo lỗi ở nhiều record cũ không thuộc capability này. | Apply chỉ được yêu cầu record mới không phát sinh error; không được sửa workflow khác. |
| Backend `npm run lint` có `--fix`. | Skill phải resolve `npm run lint:check` cho Backend hiện tại và cấm fix command làm proof. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Mở rộng cả typecheck/build sang Backend | Chỉ dual lint | User thu hẹp rõ phạm vi là lint. |
| Sửa lint rules/config | Sửa orchestration text + regression test | Vấn đề là gate không chỉ rõ hai repo, không phải lint implementation. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval revision `design-apply-dual-lint-r1` | User trả lời duyệt revision này. |
| Trust implementation và gates | `$starci-fe-upgrade-apply` sau approval. |

## apply

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
| App | starci-academy |
| Repo / branch | Trust D:\Repositories\starci-academy-backend\.claude branch main at 428013d08e21b66cb7e4e5edfedbcd77edb6c94c; Source/Backend branch mtp; Frontend branch main |
| Purpose | Apply revision đã duyệt để FE Design Apply lint không-fix cả Frontend và Backend. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\design-apply-cross-repo-lint-gate.md |
| Language | vi |
| Phase | apply |
| Touching | `.claude/skills/starci-fe-design-apply/SKILL.md`, `.claude/sources/skills.test.mjs`, và workflow này. |

Applied revision: `design-apply-dual-lint-r1`

Baseline commit: `428013d08e21b66cb7e4e5edfedbcd77edb6c94c`

Tracked diff: `428013d08e21b66cb7e4e5edfedbcd77edb6c94c..worktree`; exact task hunks là dual-lint wording và named regression test. Các thay đổi trust có sẵn khác, kể cả hunk khác trong `sources/skills.test.mjs`, được giữ nguyên và không nhận ownership.

### Applied rule

| Rule | Result |
|---|---|
| Frontend lint | Design Apply phải chạy repository-owned non-mutating lint trong resolved Frontend. |
| Backend lint | Design Apply phải chạy repository-owned non-mutating lint trong resolved Backend, ưu tiên `lint:check` và cấm `--fix` làm proof. |
| Verdict | Workflow phải ghi `### CROSS-REPOSITORY LINT PROOF` với command, cwd, exit code và verdict riêng cho hai target; thiếu/fail một bên thì FE Design Apply không được đóng. |
| Boundary | Lint failure không cấp quyền sửa ngoài approved production boundary; ghi `OWED` và route về owner. |

### CROSS-REPOSITORY LINT PROOF

| Target | Repository | Working directory | Command | Exit code | Verdict |
|---|---|---|---|---:|---|
| Frontend | starci-academy-fe | D:\Repositories\starci-academy-fe | `npm exec eslint -- .` | 1 | FAIL — 104 errors; chủ yếu untracked `.artifacts` và existing `plugins/eslint-canon` findings. Không file nào được fix. |
| Backend | starci-academy-backend | D:\Repositories\starci-academy-backend | `npm run lint:check` | 1 | FAIL — 70 errors trong course-review specs/E2E và một coding-domain E2E. Không file nào được fix. |

### Verification

| Gate | Result |
|---|---|
| Trust fetch | `.claude` fetched `origin/main`; local và remote cùng `428013d08e21b66cb7e4e5edfedbcd77edb6c94c`, không target drift. |
| Skill validation | `quick_validate.py`: `Skill is valid!`. |
| Focused regression | Named test `FE Design Apply proves non-mutating lint in both resolved target repositories`: 1 pass, 0 fail. |
| Full trust suite | 188 pass, 1 fail; lỗi có sẵn: `starci-be-audit-apply` thiếu exact heading `## PROCESS`, ngoài boundary. |
| Workflow validator | Record này không phát sinh error; validator toàn cây vẫn đỏ bởi các workflow cũ ngoài boundary. |
| Diff check | Scoped `git diff --check` pass cho hai trust files và workflow. |

### OUTPUTS

| Concept | Result |
|---|---|
| Dual lint gate | `starci-fe-design-apply` giờ bắt buộc lint không-fix cả FE và BE trước khi đóng Apply. |
| Regression protection | Focused trust test khóa heading, hai target, non-mutating command, cấm `--fix`, hai verdict và boundary behavior. |

### CHANGES

| Tree | Details |
|---|---|
| `.claude/skills/starci-fe-design-apply/SKILL.md` | `modified` — thêm cross-repository lint proof gate. |
| `.claude/sources/skills.test.mjs` | `modified` — thêm focused regression test; giữ nguyên các hunk user có sẵn khác. |
| `.workflows/upgrade/starci-academy/design-apply-cross-repo-lint-gate.md` | `modified` — append approved Review và Apply evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Exact approved trust change đã được apply; lint debt không được sửa trong boundary này. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE lint hiện có 104 errors và BE lint hiện có 70 errors. | Future FE Design Apply sẽ giữ trạng thái open cho tới khi hai verdict pass hoặc repair được route/approved đúng capability. |
| Full trust suite còn một lỗi ngoài task. | Không thể gọi toàn bộ trust tree green; focused revision proof vẫn pass. |
| Trust worktree đã dirty trước Apply và có thay đổi user trong cùng test file. | Baseline-to-worktree diff rộng hơn task; task ownership chỉ gồm named test hunk và dual-lint wording. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Chạy lint với `--fix` để làm xanh hai repo | Ghi verdict thật và route debt | Proof không được tạo mutation ngoài approved boundary. |
| Sửa 174 lint errors trong Upgrade Apply này | Giữ nguyên source và ghi `OWED` | User chỉ duyệt update lint gate, không duyệt product/audit repair. |

### OWED

| Owed | Cleared by |
|---|---|
| FE 104 lint errors | FE audit/fidelity capability với boundary riêng; sau đó `npm exec eslint -- .` exit 0. |
| BE 70 lint errors | `$starci-be-audit-plan` → Review → Apply; sau đó `npm run lint:check` exit 0. |
| Trust suite lỗi heading của `starci-be-audit-apply` | Trust upgrade riêng hoặc owner hiện tại sửa đúng lifecycle; `npm --prefix .claude test` đạt 189/189. |
