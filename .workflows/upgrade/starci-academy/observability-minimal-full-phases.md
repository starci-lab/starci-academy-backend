<!-- starci-workflow: v2 -->

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | Source/Backend `D:\Repositories\starci-academy-backend` branch `mtp` at `4a39096a6fa35a21e1010da3b74e2779902a7252`; Frontend `D:\Repositories\starci-academy` branch `mtp` at `9a193423128efa1dc83f23ab0f79fb4ae66db847` |
| Purpose | Khóa proposal observability hai phase `Minimal` rồi `Full`, ưu tiên managed cloud và không thêm local runtime instance khi core path đã đủ. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\observability-minimal-full-phases.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow proposal này; không sửa `.claude`, Frontend, Backend, compose, cloud account hoặc runtime. |

### Window

| Scope | Value |
|---|---|
| Records | Toàn bộ workflow records hiện có dưới `.workflows/*/starci-academy/*.md`. |
| Evidence rule | Chỉ dùng các dòng có thật trong bảng `REJECTED`; bỏ `None`/`not recorded` và deduplicate theo workflow/phase. |
| Direct instruction | User chốt tên hai phase: `1 Minimal`, `2 Full`; hạn chế thêm instance để tránh overengineering; cập nhật `.claude` trước product/runtime. |
| Target rule lane | Backend observability canon; không mở một global workflow phase mới cho mọi loại feature. |

### Refusal groups

| Group | Refusals / witnesses | Rule at the time | Missing law | Home |
|---|---|---|---|---|
| Tooling và operational scope phải dừng ở boundary nhỏ nhất đủ mục tiêu | `.workflows/upgrade/starci-academy/design-apply-cross-repo-lint-gate.md:216`: “Mở rộng cả typecheck/build sang Backend” bị thay bằng “Chỉ dual lint”; cùng record dòng 315: “Sửa 174 lint errors trong Upgrade Apply này” bị thay bằng giữ source và route debt; `.workflows/upgrade/starci-academy/provider-direct-harness.md:297`: promote ngay provider matrix OpenAI/Gemini/Local/OpenRouter/Anthropic bị từ chối vì chưa có nhu cầu và sẽ ép dependency chưa dùng; `.workflows/designs/starci-academy/course-detail-page-v4.md:682`: component accordion mới bị thay bằng expanded rows trong surface hiện có vì small patch không yêu cầu interaction mới. | `skill-shape.md` đã khóa exact write boundary và route mở rộng về Review; `observability.md` chỉ quản stable structured logs, chưa nói maturity phase, managed backend hay instance budget. | Một observability proposal phải tách core production-capable khỏi optional maturity expansion; Apply mặc định chỉ mang phase Minimal, còn Full phải có trigger đo được và Review riêng. | `.claude/be/canon/patterns/observability.md`; đây là product/operations judgement, không phải ESLint rule. |

### Current trust evidence

| Area | Evidence | Verdict |
|---|---|---|
| Observability canon | `.claude/be/canon/patterns/observability.md` có `OBSERVABILITY-1..6`, tập trung đường log, stable event name, structured data, decision logging và exception identity. | Không có contract cho stack topology hoặc mức trưởng thành Minimal/Full. |
| Machine rules | `.claude/sources/be/observability.mjs` chỉ enforce house logger và stable event name; comment nói semantic judgements không thể suy ra bằng parser. | Không nên thêm lint rule đoán cloud, instance count hoặc trigger Full. |
| Runtime hiện tại | `.stacks/dev/infra/compose/compose.yaml` include Prometheus và cAdvisor; Grafana/Loki/Alertmanager chỉ còn ở `.containers` cũ. | Product migration cần capability riêng sau trust approval; Upgrade không được sửa runtime. |
| Existing product dependency | `PrometheusMetricsService` hiện phục vụ system-health bằng Prometheus local. | Không được xóa Prometheus/cAdvisor trong trust Apply; việc giảm instance cần feature migration và proof. |

### Proposed rule concepts

| Candidate | Exact intent | Proposed home |
|---|---|---|
| `observability-two-phase-v1` | Mọi thay đổi observability phải khai báo `Phase 1 — Minimal` và `Phase 2 — Full`. Minimal là đường production-capable nhỏ nhất; Full chỉ là backlog có trigger đo được, không tự đi cùng Apply của Minimal. | Thêm rules sau `OBSERVABILITY-6` trong `.claude/be/canon/patterns/observability.md`. |
| `observability-cloud-instance-budget-v1` | Minimal ưu tiên managed cloud cho storage/query/dashboard/alert/synthetic; local chỉ giữ workload và một collector trên mỗi runtime host. Mỗi local telemetry instance bổ sung phải chứng minh signal không thể đi qua collector/cloud hiện có và khai owner, port, secret, persistence, health, backup cùng removal condition. | Cùng observability canon, dưới rule two-phase; không thêm lint. |
| `observability-full-trigger-v1` | Full gồm optional traces, profiling, specialized exporters, long retention hoặc incident integrations; chỉ được Review mở khi có ít nhất một trigger: SLO/debug gap, scale/cardinality, compliance/data residency, reliability hoặc cost evidence. | Cùng observability canon; examples/forbidden table để tránh biến danh sách tool thành mặc định triển khai. |

### Proposed phase contract

| Phase | Required boundary | Explicitly deferred |
|---|---|---|
| `Phase 1 — Minimal` | Managed metrics/logs/dashboard/alerts/synthetic; existing Sentry Cloud for exception ownership; one Alloy collector per runtime host; core API/job/AI/payment signals; critical alerts only; Search Console/Lighthouse remain external SEO services. | Local Grafana/Loki/Tempo/Alertmanager; profiling; specialized exporter fleet; product analytics; new managed datastore migrations. |
| `Phase 2 — Full` | Exact additions selected only from measured gaps and approved in a later Review. | Nothing is pre-approved merely because a cloud SKU exists. |

### WATCHED

| Observation | Witness | What would make it a rule |
|---|---|---|
| Exact topology “one Alloy per host” should be permanent across Docker, VPS and Kubernetes. | Direct correction in this task; no earlier observability-specific `REJECTED` row names Alloy or one collector per host. | Upgrade Review proves it is a stable architecture invariant rather than the current StarCi deployment choice, or a second independent runtime refusal confirms it. |
| Grafana Cloud is always preferred over every self-hosted observability backend. | Direct instruction “cái gì cloud được thì cloud”; no historical refusal establishes compliance/data-residency exceptions. | Review freezes explicit exceptions and portability requirements, or another refusal rejects self-hosting where managed cloud satisfies the same contract. |
| Sentry and Faro signal ownership should be permanently split. | Current architecture discussion only. | A product implementation exposes duplicate error ingestion/cost, or Review chooses one stable ownership contract. |

### Candidate trust write boundary for Upgrade Review

| Path | Expected action |
|---|---|
| `.claude/be/canon/patterns/observability.md` | MODIFY — add two-phase maturity rule, cloud/local instance decision table, Full triggers, forbidden examples and StarCi-neutral wording. |
| `.claude/sources/be/observability.mjs` | REUSE — topology is judgement; do not invent an ESLint rule. |
| `.claude/sources/be/observability.test.mjs` | REUSE unless Review requires a non-semantic documentation contract assertion; existing lint twin tests remain unchanged. |
| `.claude/INDEX.md` | REUSE — observability page is already indexed. |

### Acceptance evidence

| Gate | Proof |
|---|---|
| Wording | Canon names `Phase 1 — Minimal` and `Phase 2 — Full`, makes Minimal the default Apply boundary, and requires measured trigger plus Review for Full. |
| No overreach | Canon does not mandate vendor credentials, pricing tier, exact retention, provider-specific region or datastore migration. |
| Instance discipline | Every proposed new local telemetry service must carry necessity and lifecycle fields; managed backends do not count as local runtime instances. |
| Existing lint | `node --test .claude/sources/be/observability.test.mjs`. |
| Trust suite | `npm --prefix .claude test`; any unrelated pre-existing failure is reported honestly, not suppressed. |
| Workflow | `node .claude/scripts/validate-workflows.mjs --root .workflows`. |
| Product separation | `git diff --name-only` during Upgrade Apply contains only the exact approved trust paths plus this workflow; compose/application migration remains owed to its owning capability. |

### OUTPUTS

| Concept | Result |
|---|---|
| Two-phase observability | Candidate `observability-two-phase-v1`: Minimal is the default production-capable boundary; Full is separately triggered and reviewed. |
| Cloud and instance discipline | Candidate prefers managed telemetry backends and requires explicit necessity/lifecycle evidence for every additional local instance. |
| Enforcement boundary | Architecture judgement stays in canon; no speculative lint rule or runtime edit is proposed. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/observability-minimal-full-phases.md` | `added` — refusal witnesses, trust gap, two-phase candidate, watched vendor/topology details, proposed Review boundary and proof gates. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Đưa ba candidate observability trên vào `$starci-fe-upgrade-review` để khóa exact wording và quyết định liệu “one Alloy per host” là canon hay chỉ là StarCi Minimal profile? | **Review (khuyến nghị):** canon hóa nguyên tắc Minimal/Full + instance budget, giữ exact Alloy topology trong profile/example; hoặc yêu cầu sửa candidate trước Review. |

### WARNINGS

| Warning | Impact |
|---|---|
| Repeated historical witnesses chứng minh chống scope expansion nhưng không trực tiếp nhắc Grafana Cloud/Alloy. | Two-phase law đủ điều kiện để Review; exact vendor/topology vẫn WATCHED và không được tự nâng thành invariant. |
| Backend health hiện phụ thuộc Prometheus local. | Không thể hứa giảm ngay hai container trong Upgrade Apply; cần product feature migration và live proof riêng. |
| Cloud-first đưa telemetry ra ngoài trust boundary. | Product Review sau này phải khóa PII redaction, label cardinality, egress, region, retention và budget trước rollout. |
| Worktree có unrelated changes trong `.workflows`. | Phải giữ nguyên; workflow mới là path duy nhất Plan này viết. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Một full observability stack được hiểu như một đợt triển khai mặc định | Hai phase: `1 Minimal`, `2 Full`; cập nhật `.claude` trước | User: “hạn chế thêm instances thôi, để tránh overengineer, kiểu core thôi” và “mình gọi là 2 phase”. |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge exact canon wording, vendor neutrality, Full triggers và trust write boundary | `$starci-fe-upgrade-review` trên candidate `observability-two-phase-v1`. |
| Apply approved `.claude` revision | Explicit approval của một Upgrade Review revision rồi `$starci-fe-upgrade-apply`. |
| Migrate runtime sang Alloy/Grafana Cloud và giảm Prometheus/cAdvisor instance mà không phá system health | Capability Plan → Review → Apply riêng sau trust revision. |

## review

Candidate revision: `observability-minimal-full-r1`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | Source/Backend `D:\Repositories\starci-academy-backend` branch `mtp` at `4a39096a6fa35a21e1010da3b74e2779902a7252`; Frontend `D:\Repositories\starci-academy` branch `mtp` at `9a193423128efa1dc83f23ab0f79fb4ae66db847` |
| Purpose | Challenge Plan và khóa một revision nhỏ nhất cho canon observability hai phase, không biến vendor/profile hiện tại thành luật toàn cục. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\observability-minimal-full-phases.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow review này; không sửa `.claude`, Frontend, Backend, compose, cloud account hoặc runtime. |

### Witness audit

| Proposed law | Deduplicated witnesses | Review verdict |
|---|---|---|
| Minimal là default boundary; Full không đi ké cùng Apply | `design-apply-cross-repo-lint-gate.md:216` từ chối mở rộng dual lint thành typecheck/build; cùng workflow phase sau tại dòng 315 từ chối sửa 174 lỗi ngoài boundary; `provider-direct-harness.md:297` từ chối provider matrix chưa dùng; `course-detail-page-v4.md:682` từ chối component mới khi small patch đủ. | QUALIFIED — các witness khác workflow/phase cùng chứng minh optional expansion không được tự nhập vào boundary đã chốt. |
| Mọi local telemetry instance phải chứng minh necessity/lifecycle cost | Current direct rejection “hạn chế thêm instances”; historical witnesses chỉ chứng minh scope discipline, chưa nhắc telemetry instance. | QUALIFIED AS APPLICATION of the first law, không tách thành một global architecture invariant độc lập. |
| One Alloy per host và Grafana Cloud luôn là canon | Chỉ direct instruction hiện tại; không có hai historical observability refusals. | WATCHED — giữ trong StarCi Minimal profile và later product brief, không ghi vendor/topology vào shared canon r1. |

### Rule-at-the-time audit

| Existing owner | What it already says | Gap after Review |
|---|---|---|
| `.claude/skill-shape.md` | Apply chỉ viết approved boundary; path mới phải quay lại Review. | Không định nghĩa thế nào là Minimal/Full cho observability hoặc bằng chứng nào mở Full. |
| `.claude/be/canon/patterns/observability.md` | `OBSERVABILITY-1..6` quản stable structured log và sanctioned standalone exit. | Không quản maturity scope hay runtime cost của telemetry processes. |
| `.claude/sources/be/observability.mjs` | Enforce framework logger và interpolated event names. | Parser không thể biết một service có cần thiết, cloud-compatible hay đã có measured trigger. |

### Exact candidate wording

Add after `OBSERVABILITY-6` in `.claude/be/canon/patterns/observability.md`:

> **OBSERVABILITY-7 · Observability grows in two phases: Minimal, then Full.**
>
> `Phase 1 — Minimal` is the default production change boundary. It carries the smallest complete
> path that can collect the named core signals, retain or forward them through an approved backend,
> show their health and fire the named critical alerts. It must declare what already exists, what it
> adds and what it deliberately defers.
>
> `Phase 2 — Full` is not unfinished work owed by Minimal. It begins in a later Review only when a
> measured SLO or debugging gap, scale/cardinality limit, compliance or data-residency constraint,
> reliability requirement or demonstrated cost justifies an exact addition. A tool being available,
> managed or cloud-hosted is not such evidence by itself.
>
> **OBSERVABILITY-8 · Every local telemetry process pays for its own lifecycle.**
>
> Before a new agent, collector, exporter, store or dashboard service becomes part of the runtime,
> its brief names the signal the existing path cannot carry, its owner, resource and port budget,
> credentials, persistence, health check, backup obligation and removal condition. If an existing
> process or approved managed backend can carry the same signal without violating security,
> residency or reliability requirements, the additional local process is refused.
>
> Managed backends reduce local runtime ownership; they do not remove the need to control PII,
> cardinality, egress, retention and spend before telemetry crosses the boundary.

### Canon table additions

Add these rows to `Forbidden`:

| Never | Why it is refused | Instead |
|---|---|---|
| Treating Full as part of the Minimal Apply because the tools integrate cleanly | Availability is not evidence of need and silently expands runtime and operating cost | Record the Full addition as deferred and name the measured trigger that can reopen Review |
| Adding a local telemetry service without a lifecycle budget | The new process creates ports, secrets, storage, health, backup and failure ownership even when its feature looks small | Reuse the existing path or declare every lifecycle field before approval |
| Calling cloud-first cloud-only | Security, residency, reliability or cost can make a managed backend the wrong owner | Prefer the smallest approved managed path, but record the constraint when local ownership is necessary |

### StarCi profile kept outside canon

| Profile decision | Review disposition |
|---|---|
| Grafana Cloud for metrics/logs/dashboard/alerts/synthetic | Later product brief may select it for StarCi Minimal; not shared canon wording. |
| One Alloy collector per runtime host | Later product Review must verify Docker/VPS/Kubernetes topology; WATCHED in trust r1. |
| Sentry Cloud owns exceptions/releases | Existing integration can remain in Minimal; exact Faro overlap is product configuration, not canon. |
| Tempo, profiling, exporter fleet and long retention | Full candidates only; none is pre-approved by trust r1. |

### Frozen write boundary

| Path | Action | Obligation |
|---|---|---|
| `.claude/be/canon/patterns/observability.md` | MODIFY | Add exact `OBSERVABILITY-7`, `OBSERVABILITY-8` and three Forbidden rows above; no vendor name or product-specific topology. |
| `.workflows/upgrade/starci-academy/observability-minimal-full-phases.md` | MODIFY | Append approved Review and Apply evidence only. |
| `.claude/sources/be/observability.mjs` | REUSE | No semantic lint inference. |
| `.claude/sources/be/observability.test.mjs` | REUSE | Existing rule twins remain the focused regression lane. |
| All product/runtime paths | REUSE | No compose, application, cloud credential or account change in Upgrade Apply. |

### Test obligation

| Gate | Expected verdict |
|---|---|
| `node --test .claude/sources/be/observability.test.mjs` | PASS; existing machine rules unaffected. |
| `npm --prefix .claude test` | PASS, or exact unrelated pre-existing failure recorded without suppression. |
| `node .claude/scripts/validate-workflows.mjs --root .workflows` | New workflow has zero errors; unrelated record errors remain external debt. |
| `git diff --name-only` | Only the workflow and approved observability canon path for Upgrade Apply. |
| Manual wording audit | Both phase names, Full triggers, lifecycle fields and managed-boundary controls appear exactly once in the correct canon owner. |

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate revision | `observability-minimal-full-r1` merges the Plan's three candidates into two cohesive canon rules. |
| Minimal/Full contract | Minimal is complete and default; Full is neither implicit nor owed and requires measured evidence plus later Review. |
| Instance budget | New local telemetry processes are refused unless necessity and complete lifecycle ownership are declared. |
| Vendor boundary | Grafana Cloud and one-Alloy-per-host remain StarCi profile decisions, not shared canon invariants. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/observability-minimal-full-phases.md` | `modified` — appended Review candidate r1, exact wording, home, test obligation and frozen trust boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Duyệt revision `observability-minimal-full-r1` để Apply sửa đúng một canon page trước khi lập product implementation? | **Duyệt r1 (khuyến nghị):** Minimal/Full + local instance lifecycle là canon; Grafana Cloud/Alloy chỉ là StarCi profile. Hoặc nêu exact wording/home cần sửa để Review append r2. |

### WARNINGS

| Warning | Impact |
|---|---|
| Review r1 chưa được user phê duyệt. | Upgrade Apply chưa được phép sửa `.claude`. |
| Full workflow-tree validator có lỗi ở records ngoài boundary. | Apply chỉ có thể chứng minh record mới sạch riêng và báo full-tree debt; không sửa historical records lén. |
| Canon r1 không bảo đảm giảm container ngay. | Prometheus/cAdvisor removal vẫn cần product capability vì system-health đang phụ thuộc chúng. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Ba rule rời cho two-phase, cloud-instance budget và Full trigger | Hai rule: phase contract chứa trigger; local-process lifecycle chứa instance budget | Trigger là điều kiện mở Full, không phải một law độc lập. |
| Ghi “one Alloy per host” vào shared canon r1 | Giữ trong StarCi Minimal product profile | Chỉ có một direct correction và topology phụ thuộc runtime. |
| Ghi “Grafana Cloud luôn được ưu tiên” như luật tuyệt đối | Managed path preference có explicit security/residency/reliability exception | Cloud availability không tự chứng minh đúng trust boundary. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval hoặc feedback cho `observability-minimal-full-r1` | User trả lời duyệt r1 hoặc nêu exact revision cần đổi. |
| Apply canon-only revision | Sau approval, chạy `$starci-fe-upgrade-apply` với frozen two-path boundary. |
| StarCi Minimal product plan | Sau trust Apply, capability Plan riêng khóa Alloy/Grafana Cloud, signals, secrets, cost và health migration. |

Approved revision: `observability-minimal-full-r1`

## apply

Applied revision: `observability-minimal-full-r1`

Baseline commit: `e63cffb3ec6373687316923b2d3f9436ea0b6f03`

Workflow baseline commit: `a98f506f`

Tracked diff: `e63cffb3ec6373687316923b2d3f9436ea0b6f03..worktree`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | Source/Backend `D:\Repositories\starci-academy-backend` branch `mtp` at workflow baseline `a98f506f`; Trust nested repo `D:\Repositories\starci-academy-backend\.claude` branch `main` at baseline `e63cffb3ec6373687316923b2d3f9436ea0b6f03`; Frontend `D:\Repositories\starci-academy` branch `mtp` at `9a193423128efa1dc83f23ab0f79fb4ae66db847` |
| Purpose | Áp dụng approved observability Minimal/Full canon và chứng minh không mở rộng sang vendor profile hoặc runtime. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\observability-minimal-full-phases.md |
| Language | vi |
| Phase | apply |
| Touching | `.claude/be/canon/patterns/observability.md` và `.workflows/upgrade/starci-academy/observability-minimal-full-phases.md`; không sửa Frontend, Backend product source, compose, cloud account hoặc credential. |

### Baseline and fetch evidence

| Check | Result |
|---|---|
| Parent fetch | `git fetch origin`; parent `origin/mtp` không có `.claude` diff vì trust tree là nested repository. |
| Trust fetch | `git -C .claude fetch origin`; `origin/main` bằng pre-Apply trust HEAD `428013d0`; không có remote diff ở observability canon. |
| Workflow baseline | Parent commit `a98f506f` chứa riêng Plan/Review workflow; unrelated dirty files không được stage. |
| Trust baseline | Nested trust empty commit `e63cffb3ec6373687316923b2d3f9436ea0b6f03` được tạo khi target observability canon khớp HEAD; unrelated trust changes được giữ ngoài commit. |

### Applied canon delta

| Approved item | Result |
|---|---|
| `OBSERVABILITY-7` | Added exact two-phase wording: Minimal là default complete boundary; Full cần later Review và measured trigger, không phải debt của Minimal. |
| `OBSERVABILITY-8` | Added local telemetry process lifecycle budget và managed-boundary controls. |
| Forbidden rows | Added Full-by-availability, lifecycle-less local service và cloud-first/cloud-only traps. |
| Vendor neutrality | No `Grafana`, `Alloy`, `Loki`, `Tempo`, provider credential, pricing tier, region hoặc retention literal added to canon. |
| Machine rule boundary | `.claude/sources/be/observability.mjs` và twin test reused; không thêm semantic lint inference. |

### Gate evidence

| Gate | Result |
|---|---|
| `node --test sources/be/observability.test.mjs` from Trust | PASS — 3/3 tests. |
| `npm test` from Trust | NON-REGRESSION / external FAIL — 189/190 pass; same existing failure before and after r1: `starci-be-audit-apply` missing `## PROCESS` in `sources/skills.test.mjs`. |
| Backend `npm run lint:check` | PASS — zero errors. |
| Frontend `npm run lint` | EXTERNAL FAIL — 4,584 errors and 4,509 warnings across existing Frontend source; no Frontend file belongs to or changed in r1. |
| New workflow isolated validation | PASS — final `validateWorkflow(...)` returns zero errors after Apply append. |
| Final full workflow tree | EXTERNAL FAIL — 432 errors across historical/concurrent records; new workflow contributes zero. |

### Diff reconciliation

| Repository | Approved path | Verdict |
|---|---|---|
| Trust | `be/canon/patterns/observability.md` | MATCH — only approved rules and Forbidden rows. |
| Source | `.workflows/upgrade/starci-academy/observability-minimal-full-phases.md` | MATCH — append-only Plan/Review/Apply evidence. |
| Frontend/Backend runtime | None | REUSE — no r1 product/runtime mutation. |

### OUTPUTS

| Concept | Result |
|---|---|
| Observability maturity law | `OBSERVABILITY-7` now makes `Phase 1 — Minimal` the complete default and gates `Phase 2 — Full` on measured evidence plus later Review. |
| Local instance law | `OBSERVABILITY-8` now requires necessity and complete lifecycle ownership before adding a local telemetry process. |
| Cloud boundary | Managed backends reduce local ownership but still owe PII, cardinality, egress, retention and spend controls. |
| Vendor profile | Grafana Cloud/Alloy remain a later StarCi product decision, not canon. |

### CHANGES

| Tree | Details |
|---|---|
| `.claude/be/canon/patterns/observability.md` | `modified` — added approved `OBSERVABILITY-7`, `OBSERVABILITY-8` and three Forbidden rows. |
| `.workflows/upgrade/starci-academy/observability-minimal-full-phases.md` | `modified` — appended approval, baselines, exact Apply delta and gate evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| Trust full suite remains 189/190 because `starci-be-audit-apply` lacks `## PROCESS`. | r1 proves no regression but cannot claim the whole trust tree green; repair belongs to its own trust capability. |
| Frontend lint remains broadly red outside r1. | No Frontend cleanliness claim; existing lint closure workflow owns that debt. |
| Full workflow validator has historical/concurrent errors outside the new record. | Only isolated zero-error validation can be claimed for this workflow. |
| Runtime still contains Prometheus/cAdvisor and no Grafana Cloud rollout was performed. | This Apply changes future decision law only; StarCi Minimal implementation remains a separate capability. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | No new Apply proposal was rejected. |

### OWED

| Owed | Cleared by |
|---|---|
| Repair the external `starci-be-audit-apply: ## PROCESS` trust failure | Separate evidence-backed Upgrade Plan/Review/Apply for that skill contract. |
| Close existing Frontend lint debt | Existing FE lint closure capability; not this trust revision. |
| Plan and implement StarCi `Phase 1 — Minimal` | New product capability Plan after this trust Apply, with Grafana Cloud/Alloy profile, exact signals, secrets, budget and health migration. |
