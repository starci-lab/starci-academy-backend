<!-- starci-workflow: v2 -->
# Context evidence router modularization

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-backend` |
| Source | D:/Repositories/starci-academy-backend |
| Project | `starci-academy` — user-declared |
| Frontend | `D:\Repositories\starci-academy-fe` |
| Backend | `D:\Repositories\starci-academy-backend` |
| Trust | D:/Repositories/starci-academy-backend/.claude |
| Skills | D:/Repositories/starci-academy-backend/.claude/skills |
| App | `starci-academy` |
| Repo / branch | Source/backend `D:\Repositories\starci-academy-backend` / `mtp`; Trust `D:\Repositories\starci-academy-backend\.claude` / `main`; Frontend `D:\Repositories\starci-academy-fe` / `main` |
| Purpose | Khóa module `context` làm điểm vào duy nhất để mọi skill biết phải lấy context nội bộ từ gates nào và context ngoài từ contract, code, schema, database, runtime, test, legacy hay reference nào. |
| Workflow root | D:/Repositories/starci-academy-backend/.workflows |
| Workflow | D:/Repositories/starci-academy-backend/.workflows/upgrade/starci-academy/context-evidence-router-20260817.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow proposal này. Không sửa `AGENTS.md`, `CLAUDE.md`, `.claude`, `.workspace` hoặc product source trong Plan. |

### REFUSAL EVIDENCE

| Witness | Rejection actually recorded | Failure pattern |
|---|---|---|
| `.workflows/upgrade/starci-academy/layout-context-pack.md`, plan | “Let AI reread all JSX on every run” bị thay bằng source manifest nhỏ kết hợp approved decisions/exemplars. | Source code đơn lẻ không đủ context và có thể stale; context cần authority và provenance. |
| `.workflows/upgrade/starci-academy/five-gates-root-test-20260817-01.md`, plan | Agent đã nhảy thẳng vào source/canon cục bộ thay vì nhận ra năm lớp kiểm tra liên tiếp. | Context nội bộ chưa được resolve thành một gate chain bắt buộc cho run. |
| `.workflows/upgrade/starci-academy-fe/business-to-layout-json-gate.md`, plan/review | Gate phải dùng FE contract làm vocabulary, giữ business brief và không để gate sau tự đoán block/data/render. | Context business, contract và gate handoff đang được nạp riêng lẻ nên ownership trôi giữa các phase. |
| `.workflows/upgrade/starci-academy/generic-owner-before-duplicate.md`, plan/review | Copy shape trước khi trace concrete component/contract bị bác; generic canon riêng lẻ cũng bị bác vì law đã có nhưng không được operationalize. | Skill thiếu một context receipt chứng minh đã đọc đúng owner/evidence trước khi hành động. |

### CURRENT STATE

| Owner hiện tại | Đang sở hữu | Gap |
|---|---|---|
| Root `AGENTS.md` | Route Codex sang `.claude/common/config/INDEX.md`. | Đúng vai bootstrap, nhưng chưa nói context module là output bắt buộc của loading order. |
| Root `CLAUDE.md` | Route Claude sang config và lặp riêng Coding gate. | Bootstrap đang chứa role law mà `AGENTS.md` không có; hai agent có thể nhận context khác nhau. |
| `.claude/common/config/INDEX.md` | Source/workspace/role resolution, contract precedence và skill loading order. | Vừa làm config router vừa làm context policy; module hóa chưa tách được “ở đâu” khỏi “evidence nào phải đọc”. |
| `.claude/common/config/frontend.md` và `backend.md` | Role-specific context order. | Cùng khái niệm context nhưng hai prose owners riêng, không xuất machine-checkable receipt. |
| `.claude/common/config/workspace.schema.json` | `instructions`, một `contract`, `manifests`. | Không biểu diễn code roots, API/schema, database evidence, runtime proof, tests, legacy/reference hoặc authority. |
| `.claude/skill-shape.md` | Bảng `CONTEXT` workflow và generic Plan/Review/Apply. | Bảng nhận identity/path nhưng không chứng minh internal gates và external evidence đã được nạp. |
| `.claude/fe/gates/**`, `.claude/be/gates/**` | Internal trust context. | Gate selection chưa được đóng gói thành một resolved context chain cho từng skill run. |

### PROPOSED RULE

> Mọi skill phải resolve và ghi một Context Receipt trước khi lập kế hoạch hoặc đọc target source. Receipt tách đúng hai trục: `internal` là trust modules/gates áp dụng cho run; `external` là evidence ngoài trust gồm target instructions, contracts, code, API/schema, database, runtime, tests, legacy và references. Bootstrap chỉ route đến context resolver; bootstrap, config, skill và gate không được copy law của nhau. Nếu hai evidence xung đột, ghi conflict và áp authority order thay vì tự chọn im lặng.

### MODULE SHAPE

Required home: `.claude/contexts/`.

```text
.claude/contexts/
├── INDEX.md
├── internal.md
├── external.md
├── authority.md
└── context-receipt.schema.json
```

| Module | One responsibility | Explicit non-ownership |
|---|---|---|
| `INDEX.md` | Resolve order, require one receipt and route to the three sibling modules. | Không chứa FE/BE laws, source paths hoặc product decisions. |
| `internal.md` | Chọn exact common/FE/BE gates theo role, capability và change surface; record path, reason và read status. | Không chép nội dung gate và không quyết định product truth. |
| `external.md` | Phân loại và resolve target evidence: `instructions`, `contracts`, `code`, `schemas`, `databases`, `runtime`, `tests`, `legacy`, `references`. | Không lưu credentials, connection strings, data dumps hoặc observed source thành canon. |
| `authority.md` | Precedence, freshness, conflict và provenance. | Không chứa evidence payload hoặc gate law. |
| `context-receipt.schema.json` | Machine-check shape của receipt. | Không tự discover path và không thay workflow record. |

### CONTEXT RECEIPT

| Field | Requirement |
|---|---|
| `identity` | Source, project, roles, target repositories, branch/HEAD và capability. |
| `internal.common` | Exact common modules đã đọc và lý do. |
| `internal.roles` | Exact FE/BE gate modules đã đọc, theo đúng order; một gate chỉ có path + reason + hash/read status. |
| `external.instructions` | Target `AGENTS.md`, `CLAUDE.md` hoặc instruction files từ role config. |
| `external.contracts` | FE composition contracts, API contracts hoặc registered domain contracts. |
| `external.code` | Exact source roots/files dùng làm implementation evidence. |
| `external.schemas` | GraphQL/OpenAPI/entity/migration/index mapping hoặc machine schema liên quan. |
| `external.databases` | Chỉ schema, migrations, query/projection ownership và safe runtime metadata; không có secret hay raw dump. |
| `external.runtime` | Health, network, console, service/container evidence cần cho claim. |
| `external.tests` | Tests/fixtures/commands chứng minh boundary. |
| `external.legacy` | Comparison-only evidence, luôn có role/status, không được nâng thành active owner. |
| `external.references` | User-provided screenshots/docs/approved exemplars và provenance. |
| `conflicts` | Hai nguồn bất đồng, authority winner, phần còn unresolved. |
| `missing` | Required context chưa resolve; block action tương ứng thay vì đoán. |

### AUTHORITY ORDER

| Question | Authority order |
|---|---|
| Product goal | Current user brief → approved decision/workflow → explicit product contract. |
| FE composition/shape | Current approved design decision → active FE contract → connected component/source → selected legacy/reference evidence. |
| Business behavior/security/data | Executable backend behavior + schema/migrations/tests → public API contract → FE presentation contract. |
| Trust expression | Applicable internal gates → role config → selected skill process. |
| Runtime claim | Current live proof → deterministic test/build proof → source inference. |

No lower source silently overrides a higher source. A conflict stays visible in `conflicts`; rejected evidence is never selectable.

### BOOTSTRAP AND LOADING ORDER

| Step | Owner | Result |
|---|---|---|
| 1 | `AGENTS.md` / `CLAUDE.md` | Identical thin bootstrap: route only to `.claude/common/config/INDEX.md`; remove Claude-only copied Coding gate. |
| 2 | `.claude/common/config/INDEX.md` | Resolve Source, project/roles and local role configs, then route to `.claude/contexts/INDEX.md`. |
| 3 | Context module | Build Context Receipt from internal and external axes; stop on required missing context. |
| 4 | `.claude/skill-shape.md` + selected skill | Consume the receipt; workflow `### CONTEXT` links/summarizes it instead of independently rediscovering evidence. |
| 5 | Skill execution | Read only receipt-selected modules/evidence plus newly discovered direct dependencies, appending provenance when scope expands. |

### CONFIG EVOLUTION

The ignored `.workspace/<project>/<role>/config.json` remains the machine-local route owner. It must
not hold trust laws, but its `context` shape needs plural evidence routes rather than the current
single contract slot.

| Current | Proposed |
|---|---|
| `instructions[]` | retained |
| `contract` + `contractSource` | `contracts[]` entries with `kind`, `path`, `source`, `authority` |
| `manifests[]` | retained |
| no source roots | `code[]` |
| no schema/data routes | `schemas[]`, `databases[]` |
| no proof routes | `runtime[]`, `tests[]` |
| legacy inferred by role | `legacy[]` with comparison-only authority |
| references ad hoc | `references[]` |

Setup owns discovery/refresh of these local routes. Skills may narrow them for a task but may not
rewrite workspace config as a side effect of feature/design work.

### REVIEW / APPLY BOUNDARY

| Area | Candidate Review/Apply boundary |
|---|---|
| Bootstrap | Root `AGENTS.md`, root `CLAUDE.md`: identical thin routing only. |
| Context module | Add `.claude/contexts/{INDEX.md,internal.md,external.md,authority.md,context-receipt.schema.json}`. |
| Config router | Update `.claude/common/config/{INDEX.md,workspace.md,frontend.md,backend.md,workspace.schema.json}` so config resolves identity/routes and context module owns evidence policy. |
| Global skill contract | Update `.claude/skill-shape.md` to require Context Receipt before Plan/source reads and to include receipt identity in `### CONTEXT`. |
| Workspace setup | Update `starci-setup-workspace` script/skill only as needed to emit schema v2 routes without product writes. |
| Proof | Add focused common-context/schema/bootstrap/skill-shape tests; update active link tests. |
| Product source | None. No FE/BE production code, database or runtime state changes. |

### ACCEPTANCE

| Proof | Expected result |
|---|---|
| Bootstrap parity | `AGENTS.md` and `CLAUDE.md` route to the same config/context chain; neither contains role/gate laws. |
| Context schema twins | FE receipt resolves contract + relevant FE gates; BE data task resolves code/schema/database + relevant BE gates; unknown fields and missing required evidence fail. |
| Authority twin | Approved decision beats stale source; backend behavior beats conflicting FE assumption; conflict remains recorded. |
| Legacy twin | `fe-legacy` is accepted only as comparison evidence and cannot become active owner. |
| Skill-shape twin | A skill without Context Receipt fails before Plan/source read; receipt paths are exact and provenance-bearing. |
| Setup twin | Workspace schema v2 can be generated/refreshed without storing secrets or editing target repositories. |
| Trust gates | Focused tests, full trust tests, link validation and workflow validation distinguish new failures from existing baseline debt. |

### OUTPUTS

| Concept | Result |
|---|---|
| First modularization unit | `context` becomes the sole evidence router for every skill run. |
| Internal context | Exact common/FE/BE gates selected for the capability; laws stay in their gate homes. |
| External context | Explicit target evidence classes for contracts, code, schemas, databases, runtime, tests, legacy and references. |
| Bootstrap contract | `AGENTS.md` and `CLAUDE.md` remain symmetric, thin pointers and never become secondary canon. |
| Run proof | A machine-checkable Context Receipt proves what was loaded, what conflicted and what remains missing. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/context-evidence-router-20260817.md` | `added` — refusal-backed Plan for the common context module, bootstrap routing, receipt schema and candidate Apply boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Advance module home and shape to Upgrade Review? | Required: `.claude/contexts/` with `INDEX/internal/external/authority/schema`; alternative `common/config` is rejected because it preserves mixed ownership. |
| Workspace context schema | Recommended: version 2 with plural typed evidence routes and a setup migration; alternative: keep v1 and let skills rediscover code/schema/database ad hoc. |

### WARNINGS

| Warning | Impact |
|---|---|
| `.claude` and Source currently contain unrelated dirty work from the approved drift cleanup and other workflows. | Future Apply must freeze a baseline and touch only the approved paths; it must not absorb or revert unrelated work. |
| Existing `layout-context-pack` proposed a project-local `.starci/layout-context`. | Review must mark it superseded or narrow it to approved project exemplars; it must not become a second context router. |
| Database context can expose secrets if modeled carelessly. | Schema permits only paths/metadata/provenance; credentials, DSNs and raw dumps remain forbidden. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Put all context prose into `AGENTS.md` or `CLAUDE.md` | Thin identical bootstraps route to common context | Bootstraps would drift by agent and become duplicate canon. |
| Treat gates as the whole context | Separate `internal` gates from `external` product/runtime evidence | Trust tells how to reason; it does not contain current product truth. |
| Treat contracts/code/database as one undifferentiated source bucket | Typed external evidence with authority and provenance | Their ownership, freshness and conflict semantics differ. |
| Let every skill rediscover context independently | One Context Receipt required by `skill-shape.md` | Repeated refusals show rules existed but were skipped or consumed out of order. |
| Create another project-local context root as the universal router | Common router + machine-local workspace routes + anchored project exemplars only when approved | A second root would duplicate config/trust and drift. |

### OWED

| Owed | Cleared by |
|---|---|
| Exact wording, schema v2 fields, migration compatibility and file boundary | `$starci-fe-upgrade-review` on revision `context-evidence-router-r1`. |
| Trust/bootstrap writes | Explicit approval of one Upgrade Review revision, then `$starci-fe-upgrade-apply`. |
| Product-specific exemplar policy | Review whether `layout-context-pack` is superseded entirely or retained only as non-authoritative approved exemplars. |

## review

Approved candidate revision: `context-evidence-router-r2`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-backend` |
| Source | D:/Repositories/starci-academy-backend |
| Project | `starci-academy` — user-declared |
| Frontend | `D:\Repositories\starci-academy-fe` |
| Backend | `D:\Repositories\starci-academy-backend` |
| Trust | D:/Repositories/starci-academy-backend/.claude |
| Skills | D:/Repositories/starci-academy-backend/.claude/skills |
| App | `starci-academy` |
| Repo / branch | Source/backend `D:\Repositories\starci-academy-backend` / `mtp`; Trust `D:\Repositories\starci-academy-backend\.claude` / `main`; Frontend `D:\Repositories\starci-academy-fe` / `main` |
| Purpose | Review và khóa owner, wording, test obligation và write boundary cho module `.claude/contexts/`. |
| Workflow root | D:/Repositories/starci-academy-backend/.workflows |
| Workflow | D:/Repositories/starci-academy-backend/.workflows/upgrade/starci-academy/context-evidence-router-20260817.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow review này; chưa sửa bootstrap, trust tree, workspace config hoặc product source. |

### REVIEW FINDINGS

| Finding | Evidence | Verdict |
|---|---|---|
| Hai bootstrap đang khác nhau | `CLAUDE.md` chứa Coding gate nhưng `AGENTS.md` không chứa; cả hai cùng route `common/config/INDEX.md`. | Xóa law khỏi `CLAUDE.md`; giữ hai bootstrap mỏng và đối xứng. |
| `common/config/INDEX.md` đang vừa route identity vừa mô tả context precedence/loading | Loading order hiện trộn workspace resolution, contract authority và gate selection. | Config chỉ resolve Source/project/role/path rồi route sang `.claude/contexts/INDEX.md`. |
| Trust hiện có đúng ba rules registries | `common-config.test.mjs` khóa `.claude/common`, `.claude/fe`, `.claude/be`. | `.claude/contexts/` là resolver/process module, tuyệt đối không là registry thứ tư và không chứa FE/BE laws. |
| Plan tạo receipt schema thứ hai | `.claude/skill-shape.md` đã có một workflow `### CONTEXT` machine-validated. | Không thêm `context-receipt.schema.json`; mở rộng receipt hiện hữu thay vì tạo format song song. |
| Plan nâng workspace schema trước khi có nhu cầu routing cụ thể | Schema v1 đã có repository root, instructions, contract và manifests; capability có thể trace schema/database/runtime/tests từ các anchor này. | Giữ workspace schema v1 trong revision đầu; context ngoài định nghĩa discovery order và provenance, không biến config local thành catalog stale. |
| Test hiện tại củng cố duplication | `common-config.test.mjs` yêu cầu Coding gate đồng thời ở `CLAUDE.md` và role docs. | Đổi test để cấm role law trong cả hai bootstrap và chứng minh context router được nạp. |

### APPROVED WORDING CANDIDATE

> `.claude/contexts/` là owner duy nhất của context resolution cho skill. Nó không sở hữu business truth, FE/BE law, workspace identity hay runtime state. Mỗi run đi qua bốn lớp theo thứ tự: bootstrap provenance, resolved workspace identity, internal context, external context. Internal context chỉ chọn và ghi exact gates cần đọc. External context chỉ chọn và ghi exact instructions, contracts, code, schemas, databases, runtime, tests, legacy và references cần làm bằng chứng. Mọi selection phải có path, reason và provenance; conflict hoặc required missing context phải xuất hiện trong workflow `### CONTEXT` trước khi skill lập kế hoạch hoặc đọc target source. Không copy payload/law vào contexts và không tạo receipt format thứ hai.

### MODULE BOUNDARY R2

```text
.claude/contexts/
├── INDEX.md
├── internal.md
├── external.md
└── authority.md
```

| Module | Sở hữu duy nhất | Không sở hữu |
|---|---|---|
| `INDEX.md` | Bốn bước resolve, stop conditions và cách ghi receipt vào workflow. | Workspace paths, role law, product decisions. |
| `internal.md` | Cách chọn exact common/FE/BE gates theo capability/change surface. | Nội dung của gates hoặc thứ tự implementation. |
| `external.md` | Discovery order cho `instructions`, `contracts`, `code`, `schemas`, `databases`, `runtime`, `tests`, `legacy`, `references`. | Secrets, raw dumps, copied source, product canon. |
| `authority.md` | Authority, freshness, conflict, provenance và missing-context policy. | Evidence payload hoặc role-specific law. |

### RESOLUTION ORDER R2

| Step | Input | Output |
|---|---|---|
| 1. Bootstrap provenance | Active root `AGENTS.md` hoặc `CLAUDE.md`. | Source + route tới `common/config/INDEX.md`; bootstrap không chứa gate law. |
| 2. Workspace identity | `.workspace/<project>/<role>/config.json` qua common config. | Project, role, repository root, instructions, contract và manifests. |
| 3. Internal context | Capability + change surface. | Exact gate paths cần đọc, reason và read status; không copy law. |
| 4. External context | Resolved repository anchors + user references. | Exact evidence paths/commands cho contracts, code, schema/database, runtime, tests, legacy/reference. |
| 5. Receipt | Kết quả bốn bước trên. | Một `### CONTEXT` duy nhất trong workflow, gồm selected context, conflict và missing state. |

### EXACT APPLY BOUNDARY R2

| Path | Approved intent |
|---|---|
| `AGENTS.md` | Giữ Codex bootstrap mỏng, route duy nhất tới common config. |
| `CLAUDE.md` | Xóa copied Coding gate, làm đối xứng với `AGENTS.md`. |
| `.claude/contexts/INDEX.md` | Thêm context entry/router. |
| `.claude/contexts/internal.md` | Thêm internal gate selection policy. |
| `.claude/contexts/external.md` | Thêm external evidence discovery policy. |
| `.claude/contexts/authority.md` | Thêm authority/conflict/freshness policy. |
| `.claude/common/config/INDEX.md` | Sau identity/role resolution, route tới `.claude/contexts/INDEX.md`; bỏ context policy bị chuyển đi. |
| `.claude/common/config/frontend.md` | Chỉ giữ FE route facts; context policy chung chuyển về contexts. |
| `.claude/common/config/backend.md` | Chỉ giữ BE route facts; context policy chung chuyển về contexts. |
| `.claude/skill-shape.md` | Mở rộng canonical `### CONTEXT` thành receipt có internal/external/conflicts/missing, không tạo schema khác. |
| `.claude/sources/common-config.test.mjs` | Chứng minh bootstrap parity, contexts là resolver không phải registry, và config route đúng. |
| `.claude/sources/contexts.test.mjs` | Thêm focused tests cho module homes, no-copy/no-secret invariants, selection/provenance wording và stop conditions. |
| `.claude/sources/workflows.test.mjs` | Chứng minh receipt fields được validator nhận và missing required context fail. |
| `.claude/INDEX.md`, `.claude/HOW-TO-WRITE.md` | Cập nhật tracked navigation/documentation tới module mới nếu link tests yêu cầu. |

Explicitly outside revision: `.claude/common/config/workspace.schema.json`, setup scripts, `.workspace/**`,
FE/BE gates, product source, databases và runtime state.

### TEST OBLIGATION R2

| Proof | Required command/result |
|---|---|
| Focused context | `node --test .claude/sources/common-config.test.mjs .claude/sources/contexts.test.mjs .claude/sources/workflows.test.mjs` — zero failures. |
| Full trust | Run the trust test command documented by `.claude/INDEX.md` — zero new failures. |
| Links | `node --test .claude/sources/links.test.mjs` — zero failures. |
| Workflow | `node .claude/scripts/validate-workflows.mjs --root .workflows` — current record clean; unrelated historical baseline reported separately. |
| Diff boundary | `git diff <baseline>` in Source and Trust contains only exact approved paths plus this workflow append. |

### OUTPUTS

| Concept | Result |
|---|---|
| Context resolver | `.claude/contexts/` là process module duy nhất cho context selection, không phải rules registry thứ tư. |
| Single receipt | Workflow `### CONTEXT` là receipt duy nhất; không sinh thêm JSON/session state dưới `.claude`. |
| Internal context | Chọn exact gates và provenance, không copy gate law. |
| External context | Trace từ workspace anchors tới exact contract/code/schema/database/runtime/test/legacy/reference evidence. |
| Bootstrap parity | `AGENTS.md` và `CLAUDE.md` chỉ bootstrap cùng một chain. |
| Approved candidate revision | `context-evidence-router-r2` với boundary và tests đã khóa, chờ explicit approval. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/context-evidence-router-20260817.md` | `modified` — appended Review revision r2, exact wording, home, tests and write boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Phê duyệt revision cho Apply? | Recommended: phê duyệt `context-evidence-router-r2` đúng boundary trên; alternative: yêu cầu sửa wording/boundary cụ thể trước Apply. |

### WARNINGS

| Warning | Impact |
|---|---|
| Trust worktree đang có nhiều thay đổi không thuộc context revision. | Apply phải baseline và lọc exact paths; không commit/revert/absorb phần việc khác. |
| Full workflow validator có historical debt ngoài record này. | Apply phải chứng minh record mới sạch và tách baseline cũ, không tuyên bố toàn bộ workflow sạch sai sự thật. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `.claude/common/context/` | `.claude/contexts/` | Thầy yêu cầu rõ home độc lập `.claude/contexts/...`. |
| `context-receipt.schema.json` mới | Mở rộng workflow `### CONTEXT` hiện có | Hai receipt formats tạo drift và ownership kép. |
| Workspace schema v2 trong revision đầu | Giữ v1; trace external evidence từ existing anchors | Tránh biến config local thành catalog stale và giữ module đầu tiên nhỏ, đúng chức năng. |
| Coding gate riêng trong `CLAUDE.md` | Hai bootstrap đối xứng, law nằm đúng gate/context owner | Bootstrap không được thành secondary canon theo agent. |

### OWED

| Owed | Cleared by |
|---|---|
| Trust/bootstrap implementation | Explicit approval of `context-evidence-router-r2`, then `$starci-fe-upgrade-apply`. |
| Baseline and exact diff isolation | Upgrade Apply records baseline commits before first trust/bootstrap write. |
| Product-specific exemplar policy | A later independent review of `layout-context-pack`; not part of this context resolver revision. |

## review

Candidate revision: `context-evidence-router-r3`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-backend` |
| Source | D:/Repositories/starci-academy-backend |
| Project | `starci-academy` — user-declared |
| Frontend | `D:\Repositories\starci-academy-fe` |
| Backend | `D:\Repositories\starci-academy-backend` |
| Trust | D:/Repositories/starci-academy-backend/.claude |
| Skills | D:/Repositories/starci-academy-backend/.claude/skills |
| App | `starci-academy` |
| Repo / branch | Source/backend `D:\Repositories\starci-academy-backend` / `mtp`; Trust `D:\Repositories\starci-academy-backend\.claude` / `main`; Frontend `D:\Repositories\starci-academy-fe` / `main` |
| Purpose | Khóa liên kết bắt buộc giữa `.workspace` role routes và `.claude/contexts/` trước Apply. |
| Workflow root | D:/Repositories/starci-academy-backend/.workflows |
| Workflow | D:/Repositories/starci-academy-backend/.workflows/upgrade/starci-academy/context-evidence-router-20260817.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ append workflow Review; chưa sửa `.workspace`, trust tree, bootstrap hoặc product source. |

### WORKSPACE LINK R3

> `.workspace/<project>/<role>/config.json` là nguồn định tuyến machine-local bắt buộc của context.
> `.claude/contexts/` không đoán repository hay contract path và không thay workspace ownership.
> Sau khi common config resolve Project + role, context resolver phải đọc role config và lấy contract
> file từ `context.contract`, provenance từ `context.contractSource`, target instructions từ
> `context.instructions`, manifests từ `context.manifests`, và code root từ `repository.diskPath`.
> Context resolver sau đó mới chọn gates và trace evidence sâu hơn. Missing role config hoặc missing
> contract cho capability cần contract là stop condition, không được fallback sang scan/guess.

| Workspace field | Context meaning | Required handling |
|---|---|---|
| `repository.diskPath` | Root của code ngoài trust. | Mọi source/schema/test discovery phải neo dưới root này hoặc một explicit user reference. |
| `context.instructions[]` | Instruction files của target repository. | Đọc hết trước target-specific planning/source inspection. |
| `context.contract` | Active contract file của role, ví dụ FE composition contract. | Đọc trước implementation; exact path được ghi trong receipt. `null` chỉ hợp lệ khi role/capability không yêu cầu contract. |
| `context.contractSource` | Provenance cho contract route. | Ghi cùng contract path; không tự nâng discovered source thành approved authority. |
| `context.manifests[]` | Registered source/data manifests. | Dùng làm anchor để trace schema/database/runtime/test evidence; không coi manifest là product truth nếu executable evidence mâu thuẫn. |
| `role` | Authority mode của route. | `fe-legacy` luôn comparison-only; không được trở thành active owner. |
| `repository.branch` / `head` | Freshness identity. | Ghi vào receipt để evidence không bị dùng ngoài checkout đã resolve. |

### RESOLUTION ORDER R3

| Step | Owner | Result |
|---|---|---|
| 1 | Root bootstrap | Resolve Source và route common config. |
| 2 | Common config + `.workspace` | Resolve Project, role, repository, instructions, contract, contract provenance và manifests. |
| 3 | `.claude/contexts/internal.md` | Chọn gates áp dụng dựa trên capability/change surface đã resolve. |
| 4 | `.claude/contexts/external.md` | Bắt đầu từ workspace anchors rồi trace exact code/schema/database/runtime/test/legacy/reference evidence. |
| 5 | `.claude/contexts/authority.md` | Resolve authority/freshness/conflicts/missing. |
| 6 | Workflow `### CONTEXT` | Ghi một receipt duy nhất trước Plan hoặc target source read. |

Workspace schema vẫn ở version 1 trong revision này vì các field cần cho routing đã tồn tại. Revision
không sửa `.workspace/**` hay setup script; focused tests dùng fixture hiện có để chứng minh contract
file thật sự được lấy từ role config, không hardcode hoặc scan đoán.

### OUTPUTS

| Concept | Result |
|---|---|
| Workspace-context relationship | Workspace sở hữu machine-local routes; contexts bắt buộc tiêu thụ routes đó để chọn evidence. |
| Contract resolution | Contract file luôn lấy từ `context.contract` cùng `contractSource`, không đoán từ source tree. |
| External evidence roots | Code từ `repository.diskPath`; instructions/manifests từ role config; evidence sâu hơn được trace có provenance. |
| Candidate revision | `context-evidence-router-r3` thay r2 và chờ explicit approval. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/context-evidence-router-20260817.md` | `modified` — appended r3 workspace linkage and exact field mapping. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Phê duyệt revision cho Apply? | Recommended: phê duyệt `context-evidence-router-r3`, gồm exact r2 boundary cộng workspace-link r3; alternative: chỉ rõ field/ownership cần sửa tiếp. |

### WARNINGS

| Warning | Impact |
|---|---|
| Một role config stale có thể route tới contract checkout cũ. | Receipt phải ghi branch/head và contract provenance; missing/unreadable path phải stop thay vì scan fallback. |
| Trust worktree vẫn chứa unrelated changes. | Apply phải baseline và chỉ chạm exact approved paths. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Context resolver độc lập với workspace | Context resolver bắt buộc lấy route từ `.workspace/<project>/<role>/config.json` | Thầy xác nhận context có liên kết với workspace và lấy info như contract file từ đó. |
| Tự scan source để tìm contract khi route thiếu | Stop và sửa workspace route bằng setup owner | Contract route phải có một owner, tránh mỗi skill chọn một file khác nhau. |

### OWED

| Owed | Cleared by |
|---|---|
| Trust implementation và tests cho workspace→contract routing | Explicit approval of `context-evidence-router-r3`, then `$starci-fe-upgrade-apply`. |
| Baseline/diff isolation | Upgrade Apply records baseline before first write. |
