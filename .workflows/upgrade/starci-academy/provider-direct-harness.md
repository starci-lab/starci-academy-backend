<!-- starci-workflow: v2 -->

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
| App | starci-academy |
| Repo / branch | Source/Backend D:\Repositories\starci-academy-backend branch `mtp` at `1dc850af005710a0186f1cf2b4c89238eb44e432`; Frontend D:\Repositories\starci-academy-fe branch `main` at `1392cdcd15cde00b1662f7e1d449ae908789e2b2` |
| Purpose | Khóa luật để model-quality harness gọi provider SDK trực tiếp bằng credential API riêng, không giả `AiInvokeService` hoặc dùng Claude Code OAuth. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\provider-direct-harness.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow proposal này; không sửa `.claude`, harness, production source, dependency hoặc credential. |

### Window

| Scope | Value |
|---|---|
| Records | Toàn bộ `.workflows/feature/*/*.md` hiện có trong Source. |
| Evidence rule | Chỉ các dòng trong bảng `REJECTED`; bỏ `None` và `not recorded`, deduplicate theo workflow/phase. |
| Direct instruction | User yêu cầu: harness test thẳng bằng API key, bỏ Claude override, update `.claude` và dùng agent xử toàn bộ harness. |
| Source audit | Hai agent audit read-only toàn bộ trust rule và sáu harness; không agent nào sửa file. |

### Refusal groups

| Group | Refusals / witnesses | Rule at the time | Missing law | Home |
|---|---|---|---|---|
| Proof phải giữ đúng internal/external boundary của lane | `.workflows/feature/nivo/agentos-capacity-autoscaling.md:257`: “Call a worker/handler directly in E2E” bị thay bằng “GraphQL payment -> real queue -> real Socket.IO”; cùng record dòng 258: “Mock capacity policy in E2E” bị thay bằng “Fake only the external provider result”; `.workflows/feature/miamia/topic-linked-practice-session.md:338`: “Migrate practice e2e sang một internal CQRS/service call khác” bị thay bằng GraphQL transport; `.workflows/feature/miamia/local-test-account-otp-bypass.md:123`: “Dùng `scripts/dev-login.ts` để set localStorage” bị thay bằng login UI/GraphQL thật. | `TESTING-9` tách E2E khỏi model call; `TESTING-10` nói harness gọi provider client trực tiếp. FLOW evidence đã yêu cầu production door và chỉ fake external result. | Mỗi lane phải giữ semantics mình tuyên bố: E2E đi qua production transport/orchestration và chỉ stub external SDK; model-quality harness đi từ exact production prompt builder tới provider SDK thật rồi production parser, không thay `AiInvokeService` bằng một adapter provider giả. | Canon `.claude/be/canon/patterns/testing.md`; machine rule `.claude/sources/be/testing.mjs` và focused tests. |

### Current implementation evidence

| Area | Evidence | Verdict |
|---|---|---|
| Existing canon | `.claude/be/canon/patterns/testing.md:127` đã ghi harness “talks to the provider's own client and nothing else”. | Đúng concept nhưng chưa cấm fake `AiInvokeService` và chưa có machine enforcement. |
| Provider transport | `src/tests/helpers/models.ts` chỉ tạo Anthropic client, đọc `CLAUDE_CODE_OAUTH_TOKEN` hoặc `.secrets/claude-code-token.txt`, nhận `sk-ant-oat` và OAuth beta header. | Sai authority theo instruction mới; credential consumer/CLI đang bị dùng như API credential. |
| Gateway disguise | `harness-invoke.ts` trả `Pick<AiInvokeService, "run">`; `harness-invoke.service.ts` và `test-helpers.module.ts` đưa stand-in vào DI. | API thật bị ngụy trang thành production gateway giả; provider/cost/token metadata bị hardcode. |
| Affected harnesses | `challenge-grading`, `content-ai`, `cv-scoring`, `milestone-grading`, `mock-interview-grading` override/provide `AiInvokeService`; `ai-tutor` gọi `askModel` trực tiếp nhưng Anthropic-only. | Sáu suite cần một provider-direct contract thống nhất. |
| E2E | `flow-world.ts`, `ai-entitlement-resilience`, `content-ai-session`, `rag-playground` stub `AiInvokeService`. | Giữ nguyên; đây là deterministic flow proof, không phải model-quality harness. |
| Judge | `judge.ts` dùng Anthropic structured output và pin `claude-sonnet-5`. | Cũng phải khai báo target/credential trực tiếp; SUT và judge không được chọn ngầm qua tier/router. |
| Case count | Sáu harness hiện có tổng 19 cases. | Review phải khóa 1–2 quality cases cho mỗi capability theo `TESTING-10`, không cắt coverage flow sang harness. |

### Proposed rule concepts

| Candidate | Exact intent | Proposed home |
|---|---|---|
| `harness-provider-direct-v1` | Trong `*.harness-spec.ts`, model-quality call phải dùng approved provider SDK với provider, model và credential env explicit; cấm `provide/overrideProvider(AiInvokeService)`, `HarnessInvokeService`, `Pick<AiInvokeService, "run">`, tier, router, fallback, key pool hoặc implicit model choice. | Clarify `testing.md`; enforce trong `testing.mjs`; valid/invalid fixtures trong `testing.test.mjs`. |
| `lane-boundary-clarification-v1` | E2E giữ production transport/orchestration thật và stub external provider SDK/result; harness không chứng minh flow mà chỉ chứng minh chất lượng model từ production prompt builder qua real provider tới production parser. | `testing.md`, đồng bộ wording giữa TESTING-9/10 và FLOW rules. |
| `harness-explicit-target-v1` | SUT target và judge target là hai tuple explicit; retry chỉ cho transient provider failure và phải bounded; không ghi secret, không tự fallback provider/model. | `testing.md`; machine checks phần statically checkable trong `testing.mjs`. |

### WATCHED

| Observation | Witness | What would make it a rule |
|---|---|---|
| Credential harness chỉ dùng provider-issued API key, tuyệt đối không Claude Code/ChatGPT OAuth token hoặc CLI profile. | Một direct correction hiện tại: “harness là test thẳng bằng API key… bỏ trò override bằng claude”. | Một refusal độc lập khác, hoặc Review xác nhận đây chỉ là enforcement cụ thể của existing provider-direct canon thay vì luật product mới. |
| Mọi provider dùng prefix riêng `HARNESS_<PROVIDER>_API_KEY`. | Agent đề xuất để tách test credential khỏi production key pool; chưa có refusal lịch sử. | User từ chối một credential authority mơ hồ/fallback khác, hoặc security canon hiện hữu bắt exact prefix này. |
| Provider-neutral helper hỗ trợ OpenAI, Gemini, Local, OpenRouter và Anthropic ngay revision đầu. | Agent audit đề xuất; user mới chỉ yêu cầu bỏ Claude override và dùng API key. | Có nhu cầu thực tế cho provider thứ hai hoặc Review khóa exact provider matrix. |

### Candidate production migration boundary for later Backend Feature Review

| Slice | Expected action |
|---|---|
| Direct transport | Thêm test-only provider-direct client/credential parser và focused unit; chọn exact provider/model từ explicit env/config, không fallback. |
| Remove disguise | Xóa `harness-invoke.ts`, `harness-invoke.service.ts`, DI export và `scripts/set-claude-code-token.ps1`; bỏ mọi Claude OAuth wording/wiring trong harness/CI. |
| Prompt/parser seams | Extract/reuse exact production prompt builders và parsers để harness không override gateway nhưng vẫn test đúng production contract; snapshot messages trước/sau extraction. |
| Six suites | Migrate cả sáu harness; giảm còn 1–2 model-quality cases mỗi capability, chuyển deterministic flow assertions về unit/E2E phù hợp. |
| Production AI | Không đổi `AiInvokeService`, balancer, key pools, billing, entitlement hoặc provider routing production. |
| E2E | Không biến E2E thành live model calls; giữ deterministic external-provider stubs. |

### Acceptance evidence

| Gate | Proof |
|---|---|
| Trust focused rule | `node --test .claude/sources/be/testing.test.mjs` với fixtures pass cho direct SDK và fail cho fake gateway/OAuth/fallback. |
| Trust full suite | `npm --prefix .claude test`; không được che lỗi có sẵn. |
| Forbidden architecture | `rg -n "HarnessInvokeService|createHarnessInvoke|Pick<AiInvokeService|provide:\\s*AiInvokeService|overrideProvider\\(AiInvokeService" src/tests/harness` trả zero match sau product migration. |
| OAuth removal | `rg -n "CLAUDE_CODE_OAUTH_TOKEN|claude-code-token|sk-ant-oat|OAUTH_BETA" src/tests scripts .github` không còn harness-related match. |
| Static product proof | `npm run typecheck`, `npm run lint:check`, `npm test`, `npm run harness -- --listTests`. |
| Live harness proof | Chạy harness bằng exact provider-issued API key secret ở runtime; ghi provider/model, case count và verdict nhưng không ghi key. |
| Workflow | `node .claude/scripts/validate-workflows.mjs --root .workflows`; record mới không phát sinh error. |

### OUTPUTS

| Concept | Result |
|---|---|
| Provider-direct harness | Candidate `harness-provider-direct-v1`: quality harness gọi SDK provider thật từ production prompt builder tới production parser, không giả production `AiInvokeService`. |
| Lane separation | E2E tiếp tục deterministic và giữ orchestration thật; chỉ harness mới gọi model live. |
| Credential correction | Claude Code OAuth removal được ghi WATCHED vì mới có một refusal; Review phải quyết định xem đây là enforcement của canon hiện hữu hay chờ thêm witness trước khi thành trust law. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/provider-direct-harness.md` | `added` — refusal evidence, source audit, candidate trust rules, watched items, later product boundary và proof gates. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Đưa candidate `harness-provider-direct-v1` vào `$starci-fe-upgrade-review` để khóa exact trust wording/enforcement trước khi sửa `.claude` và mở Backend Feature migration? | **Review (khuyến nghị):** challenge home, provider/credential contract và exact write boundary; hoặc nêu row cần đổi. |

### WARNINGS

| Warning | Impact |
|---|---|
| Direct API-key/OAuth correction mới có một refusal trong workflow window. | Theo Upgrade skill, chưa tự động biến exact credential prefix/provider matrix thành luật; chỉ phần lane-boundary có đủ repeated witnesses. |
| `.claude/sources/be/index.mjs` hiện flatten rules bằng `Object.fromEntries`; `testing.mjs` và `e2e-flow.mjs` có ba rule id trùng nhau. | Duplicate owner có thể bị overwrite trước khi test phát hiện; cần capability trust riêng hoặc được Review thêm exact boundary, không sửa lén trong candidate này. |
| Full trust suite hiện 188/189 do `starci-be-audit-apply` thiếu heading `## PROCESS`. | Không thể gọi toàn trust tree green; lỗi ngoài boundary phải được báo riêng. |
| Harness live tiêu token và provider output không deterministic. | Chỉ giữ 1–2 quality cases/capability, bounded retry và không chạy lane live trong ordinary E2E. |
| ChatGPT/Codex login token không phải backend API credential. | Live harness cần provider-issued server-side API key; không được trích hoặc tái sử dụng session token người dùng. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Dùng Claude Code OAuth/`sk-ant-oat` làm harness credential | Provider-issued API key ở runtime | User: “harness là test thẳng bằng API key… bỏ trò override bằng claude”. |
| Bọc live provider call thành fake `AiInvokeService` | Production prompt builder → provider SDK trực tiếp → production parser | Fake gateway làm sai contract provider/token/cost và trái TESTING-10. |
| Chuyển E2E hiện tại sang live provider | Giữ E2E deterministic, chỉ stub external provider boundary | E2E chứng minh transport/orchestration/persistence, không chứng minh model quality. |

### OWED

| Owed | Cleared by |
|---|---|
| Review exact canon wording, machine checks, credential authority và trust write boundary | `$starci-fe-upgrade-review` trên candidate `harness-provider-direct-v1`. |
| Apply trust-tree revision | Explicit approval của một Upgrade Review revision rồi `$starci-fe-upgrade-apply`. |
| Migrate sáu harness và prompt/parser seams | `$starci-be-feature-plan` → Review → Apply sau khi trust revision được khóa. |
| Finish existing CV evidence Apply record | Re-run/record CV harness under the new approved direct-provider architecture, then append final CV Apply evidence. |

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
| App | starci-academy |
| Repo / branch | Source/Backend D:\Repositories\starci-academy-backend branch `mtp` at `1dc850af005710a0186f1cf2b4c89238eb44e432`; Frontend D:\Repositories\starci-academy-fe branch `main` at `1392cdcd15cde00b1662f7e1d449ae908789e2b2` |
| Purpose | Challenge và khóa exact wording, home, machine tests và write boundary cho provider-direct harness law. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\provider-direct-harness.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; chưa sửa trust tree, harness, production source, dependency hoặc credential. |

### Evidence review

| Requirement | Verdict | Evidence |
|---|---|---|
| Repeated witnesses | PASS | Bốn refusal deduplicated chứng minh cùng law: proof không được đi tắt internal boundary và chỉ external boundary mới được fake. |
| Existing-rule gap | PASS | `TESTING-10` đã yêu cầu provider client trực tiếp nhưng `testing.mjs` chỉ enforce phía E2E; harness hoàn toàn không có rule. |
| Source contradiction | PASS | Năm harness provide/override `AiInvokeService`; helper trả `Pick<AiInvokeService, "run">` với provider/cost/token giả. Harness còn lại gọi Anthropic-only helper. |
| Credential authority | PASS as clarification | Các refusal về `dev-login` token injection, bỏ session guard và process override đã chứng minh proof phải dùng credential authority đúng boundary. Provider-issued API key là authority của provider API; Claude Code/ChatGPT session OAuth không phải server API credential. |
| Smallest general rule | PASS | Chỉ khóa lane boundary, direct provider import/call và credential authority; không áp đặt một provider/model cụ thể vào canon. |
| Correct home | PASS | Semantics thuộc `testing.md`; statically checkable imports/overrides/consumer-auth literals thuộc `testing.mjs`; twin fixtures thuộc `testing.test.mjs`. |
| Product migration separation | PASS | Trust Apply không sửa sáu harness. Source migration đi Backend Feature lifecycle với exact prompt/parser tree riêng. |

### Revision

Candidate revision: `provider-direct-harness-r1`

Approved revision: `provider-direct-harness-r1`

Approval evidence: User trả lời `approve provider-direct-harness-r1` sau khi Review in exact wording, twin-test obligation và four-path boundary.

#### Exact canon wording

Append vào `TESTING-10` của `.claude/be/canon/patterns/testing.md`:

> A model-quality harness owns one explicit provider target. It imports the approved provider SDK,
> supplies a provider-issued server API key from an explicit harness environment variable, names
> the exact model and endpoint, and calls that SDK directly. It may reuse the production prompt
> builder and production parser; it must not provide, override, wrap or impersonate
> `AiInvokeService`, and it must not route through a tier, catalog, fallback chain, key pool or
> house model-call helper.
>
> A consumer or CLI credential is not a provider API credential. Claude Code OAuth tokens,
> ChatGPT/Codex session tokens, CLI profiles and token files are forbidden harness authorities.
> A separate LLM judge, when used, declares its own explicit provider/model/endpoint/key tuple.
> Neither SUT nor judge silently inherits or falls back to another tuple.
>
> Lane ownership remains asymmetric: an e2e keeps production transport and internal orchestration
> real while replacing only the external provider result; a model-quality harness calls the live
> provider but proves only prompt/model/parser quality. It does not replace flow coverage. Keep one
> or two live quality cases per capability and bound retries to transient provider failures.

Also replace any TESTING-9 wording that describes overriding `AiInvokeService` itself as the preferred E2E boundary. The revised wording must say the deterministic seam is the external provider SDK/result while production `AiInvokeService` orchestration remains real where the flow owns it.

#### Exact machine rule

Add `harness-calls-provider-directly` to `.claude/sources/be/testing.mjs`, recommended severity `error`:

1. Scope only `*.harness-spec.ts` plus harness model-call helpers under `src/tests/helpers` when imported by that lane; do not fire on unit or E2E specs.
2. In a harness spec, reject imports/references to `HarnessInvokeService`, `createHarnessInvoke`, `Pick<AiInvokeService, "run">` and model-call house wrappers.
3. Reject `provide: AiInvokeService`, `overrideProvider(AiInvokeService)` and equivalent Nest/Jest provider replacement in a harness spec.
4. A harness that performs a model-quality call must import an approved provider SDK directly. Credential-only helpers may be shared; helpers must not hide the provider call.
5. Reject harness/helper references to `CLAUDE_CODE_OAUTH_TOKEN`, `claude-code-token`, `sk-ant-oat`, `OAUTH_BETA`, ChatGPT/Codex session-token names or CLI auth-profile fallback.
6. Do not ban deterministic `AiInvokeService` stubs in `*.e2e-spec.ts`; existing E2E rules own that lane.

The rule must inspect syntax/imports, not comments or broad substring grep, except exact string literals that select a forbidden credential authority.

#### Exact test obligation

Extend `.claude/sources/be/testing.test.mjs` with twin fixtures:

| Fixture | Expected |
|---|---|
| Harness imports official provider SDK, loads one explicit harness key env and calls SDK in the spec | PASS |
| Harness reuses a production prompt builder/parser around that direct call | PASS |
| E2E provides a deterministic `AiInvokeService` stub and does not import provider SDK | PASS |
| Unit spec imports AI service/provider for a bounded unit concern | Out of rule scope |
| Harness imports/gets `HarnessInvokeService` or `createHarnessInvoke` | FAIL |
| Harness uses `provide: AiInvokeService` or `overrideProvider(AiInvokeService)` | FAIL |
| Harness imports a house helper that performs the model call without direct provider SDK import | FAIL |
| Harness/helper selects Claude Code OAuth, token file, CLI profile or session-token authority | FAIL |
| Harness has no explicit provider SDK for a model-quality call | FAIL |

#### Exact Upgrade Apply write boundary

| Path | Action |
|---|---|
| `.claude/be/canon/patterns/testing.md` | MODIFY — clarify TESTING-9/10 lane, provider, credential and judge contract. |
| `.claude/sources/be/testing.mjs` | MODIFY — add `harness-calls-provider-directly` and recommended error level. |
| `.claude/sources/be/testing.test.mjs` | MODIFY — add focused valid/invalid twin fixtures. |
| `.workflows/upgrade/starci-academy/provider-direct-harness.md` | APPEND — Apply evidence and canonical outputs. |

Explicitly excluded: `.claude/sources/be/index.mjs`, `.claude/sources/be/index.test.mjs`, skill files, product source, package files, CI and credential files. Duplicate rule-owner detection is a separate trust defect and does not travel in revision r1.

### Later Backend Feature boundary to freeze separately

| Decision | Review constraint |
|---|---|
| Provider | Backend Feature Review chooses the exact live SUT and judge tuples from available provider-issued API keys; trust law remains provider-neutral. |
| API key | Runtime secret only; workflow records env names/provider/model but never secret values. No automatic use of production key pools. |
| Prompt/parser | Every migrated suite must name exact production builder/parser seams and prove extraction parity before deleting override helpers. |
| Cases | Freeze 1–2 live quality cases per capability; deterministic branches stay unit/E2E. |
| Deletions | Exact references must reach zero before deleting `harness-invoke*`, Claude token script or old model helper. |
| Existing CV work | Preserve approved CV scoring changes; only replace its harness transport boundary. |

### Acceptance gates

| Gate | Exact proof |
|---|---|
| Focused trust | `node --test .claude/sources/be/testing.test.mjs` |
| Full trust | `npm --prefix .claude test`; report the known unrelated 188/189 failure rather than claiming green. |
| Workflow | `node .claude/scripts/validate-workflows.mjs --root .workflows`; no error may name this record. |
| Boundary | `git diff --check` plus path reconciliation against the four approved paths. |
| No premature product write | Upgrade Apply diff contains no `src/**`, `scripts/**`, `.github/**`, `package*.json` or secret file. |

### OUTPUTS

| Concept | Result |
|---|---|
| Revision `provider-direct-harness-r1` | Exact canon wording, machine rule, twin-test obligation và four-path trust boundary đã được review; đang chờ explicit approval. |
| Credential authority | Provider-issued API key + explicit target; consumer/CLI OAuth/session credentials và fallback bị loại khỏi harness contract. |
| Lane contract | E2E giữ production orchestration và fake external result; harness gọi live provider trực tiếp nhưng chỉ chứng minh model quality. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/provider-direct-harness.md` | `modified` — append Review revision, exact wording, machine fixtures, write boundary và gates. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Duyệt revision `provider-direct-harness-r1` để `$starci-fe-upgrade-apply` sửa đúng bốn path trust đã khóa, rồi mở Backend Feature migration cho cả sáu harness? | **Approve `provider-direct-harness-r1` (khuyến nghị):** apply exact wording/rule/tests/boundary; hoặc nêu row cần sửa. |

### WARNINGS

| Warning | Impact |
|---|---|
| Machine rule không thể chứng minh provider output có chất lượng hoặc key thực sự hợp lệ. | Live harness proof vẫn bắt buộc ở Backend Feature Apply; lint chỉ khóa architecture tĩnh. |
| Exact provider/model cho lần live run chưa được chọn trong trust Review. | Đây là product/test runtime decision và phải được Backend Feature Review khóa từ credential sẵn có, không hardcode vào canon. |
| Duplicate rule IDs giữa `testing.mjs` và `e2e-flow.mjs` vẫn ngoài boundary. | Aggregator có thể overwrite owner; r1 không được âm thầm sửa defect này. |
| Full trust suite có một lỗi heading ngoài task. | Upgrade Apply chỉ được gọi focused revision green và báo full-suite failure trung thực. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Promote provider matrix OpenAI/Gemini/Local/OpenRouter/Anthropic thành canon ngay | Provider-neutral explicit tuple; product Review chọn provider thực tế | Chưa có repeated refusal cho matrix và canon không nên ép dependency chưa dùng. |
| Cho model call nằm sau shared house helper | Harness spec import/call official SDK trực tiếp; chỉ credential loader được share | House helper tái tạo routing abstraction mà TESTING-10 cấm. |
| Gộp duplicate rule-owner repair vào r1 | Route một trust capability riêng | Không có refusal group và không thuộc exact user correction về harness. |
| Sửa sáu harness trong Upgrade Apply | Tách Backend Feature Plan/Review/Apply sau trust approval | Upgrade Apply chỉ sở hữu trust tree, không được lén mở product boundary. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval revision `provider-direct-harness-r1` | User trả lời `approve provider-direct-harness-r1`. |
| Trust implementation và gates | `$starci-fe-upgrade-apply` sau approval. |
| Exact six-harness source tree, provider tuples và live proof | `$starci-be-feature-plan` → Review → Apply sau trust revision. |

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
| App | starci-academy |
| Repo / branch | Trust D:\Repositories\starci-academy-backend\.claude branch `main` at `428013d08e21b66cb7e4e5edfedbcd77edb6c94c`; Source/Backend branch `mtp` at `1dc850af005710a0186f1cf2b4c89238eb44e432`; Frontend branch `main` at `1392cdcd15cde00b1662f7e1d449ae908789e2b2` |
| Purpose | Apply provider-direct harness canon và machine enforcement đã duyệt, đo debt thật trước target adoption. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\provider-direct-harness.md |
| Language | vi |
| Phase | apply |
| Touching | `.claude/be/canon/patterns/testing.md`, `.claude/sources/be/testing.mjs`, `.claude/sources/be/testing.test.mjs`, và workflow này. |

Applied revision: `provider-direct-harness-r1`

Approval evidence: User trả lời `approve provider-direct-harness-r1` sau khi Review in exact wording, twin-test obligation và four-path boundary.

Baseline commit: `428013d08e21b66cb7e4e5edfedbcd77edb6c94c`

Tracked diff: `428013d08e21b66cb7e4e5edfedbcd77edb6c94c..worktree`; task ownership chỉ gồm ba approved trust files và workflow record. Các trust changes có sẵn khác được giữ nguyên.

### Applied rule

| Rule | Result |
|---|---|
| TESTING-9 lane | E2E giữ transport và `AiInvokeService` orchestration thật; chỉ external provider SDK result được stub deterministic. |
| TESTING-10 harness | Harness import/call approved provider SDK trực tiếp bằng explicit provider API key/model/endpoint; production prompt builder/parser được reuse. |
| Forbidden gateway disguise | Rule bắt `HarnessInvokeService`, `createHarnessInvoke`, `Pick<AiInvokeService, "run">`, `provide: AiInvokeService`, `overrideProvider(AiInvokeService)` và house model-call helper. |
| Forbidden credential authority | Rule bắt Claude Code OAuth/token file, `sk-ant-oat`, OAuth beta, ChatGPT/Codex session token và CLI auth profile. |
| Lane carve-out | Rule không cấm deterministic `AiInvokeService` stub trong E2E hoặc bounded AI imports trong unit specs. |

### Verification

| Gate | Result |
|---|---|
| Trust fetch | `git fetch origin main`; local và `origin/main` cùng `428013d08e21b66cb7e4e5edfedbcd77edb6c94c`, không stale drift. |
| Focused twin | `node --test sources/be/testing.test.mjs`: 6 pass, 0 fail; gồm direct provider, production prompt/parser, E2E carve-out, gateway/helper/Pick/OAuth invalid fixtures. |
| Real-source measurement | Rule mới chạy trực tiếp trên `src/tests/harness/*.harness-spec.ts` và `src/tests/helpers/*.ts`: 33 findings trên cả 6 harness/helpers; gồm missing direct SDK, hidden helper, fake gateway và consumer auth. |
| Full trust | `npm test` trong `.claude`: 189 pass, 1 fail; lỗi có sẵn `starci-be-audit-apply: ## PROCESS`, ngoài boundary. |
| Mirror check | `node .claude/scripts/sync-be-lint.mjs --target .`: 3 findings; mirror drift, 7 local-only rules, 11 dark canon rules gồm `harness-calls-provider-directly`. Không chạy `--write` vì mirror/config ngoài approved boundary. |
| Backend lint | `npm run lint:check`: 219 errors, 0 warnings trong unrelated course-price/review/CV/e2e worktree; rule mới chưa mirror/enable nên không tạo các lỗi này. |

### OUTPUTS

| Concept | Result |
|---|---|
| Provider-direct trust law | `provider-direct-harness-r1` đã được authored trong canon với machine rule và passing twin tests. |
| Measured migration debt | Sáu harness/helpers hiện có 33 direct-rule findings; không thể gọi target adoption hoàn tất trước source migration. |
| Safe adoption order | Migrate sáu harness và credential authority trước, sau đó mirror + enable strict rule trong cùng Backend Feature boundary. |

### CHANGES

| Tree | Details |
|---|---|
| `.claude/be/canon/patterns/testing.md` | `modified` — clarify E2E external seam và exact provider-direct/API-key harness law, Forbidden rows và examples. |
| `.claude/sources/be/testing.mjs` | `modified` — add `harness-calls-provider-directly` strict rule. |
| `.claude/sources/be/testing.test.mjs` | `modified` — add TESTING-10 valid/invalid twin fixtures. |
| `.workflows/upgrade/starci-academy/provider-direct-harness.md` | `modified` — append approved Apply evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Trust write đúng approved boundary đã hoàn tất; target source/mirror phải đi Backend Feature lifecycle riêng. |

### WARNINGS

| Warning | Impact |
|---|---|
| Rule chưa được mirror/enable trong backend config. | Không được gọi canonical rule đã ship tới target; enable trước source migration sẽ thêm 33 lỗi có chủ đích. |
| Backend lint hiện đỏ 219 errors ngoài trust boundary. | Backend Feature Apply phải phân biệt harness migration findings với unrelated dirty work; không chạy broad `--fix`. |
| Full trust còn một lỗi heading ngoài task. | Chỉ focused revision proof green; không được báo toàn trust tree green. |
| Trust worktree dirty từ trước. | Baseline-to-worktree diff rộng hơn task; ownership chỉ gồm exact approved hunks. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Chạy `sync-be-lint --write` trong r1 | Defer mirror/config vào Backend Feature Review | `plugins/eslint-canon/**` và `eslint.config.mjs` nằm ngoài approved four-path boundary. |
| Enable strict rule trước khi sửa source | Đo 33 findings, migrate source rồi enable | Một rule biến target đỏ mà chưa có repair boundary là finding, không phải success. |
| Sửa 219 backend lint errors bằng broad fix | Giữ nguyên và route đúng owners | Không thuộc provider-direct harness revision và có nhiều unrelated user work. |

### OWED

| Owed | Cleared by |
|---|---|
| Migrate đủ sáu harness, remove fake gateway/Claude OAuth và chọn explicit SUT/judge tuples | `$starci-be-feature-plan` → Review → Apply. |
| Mirror canon rule và enable `starci-be/harness-calls-provider-directly` | Exact Backend Feature Review boundary gồm `plugins/eslint-canon/**` và `eslint.config.mjs`, sau source migration. |
| Live model-quality proof | Run 1–2 cases/capability bằng provider-issued API key; record provider/model/verdict, không record secret. |
| CV Apply closure | Re-run CV scoring harness dưới direct provider architecture và append final evidence vào CV workflow. |
