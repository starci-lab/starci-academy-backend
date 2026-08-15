<!-- starci-workflow: v2 -->

# Generic owner before duplicate trust upgrade

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
| Repo / branch | FE `D:\Repositories\starci-academy-fe` / `main`; BE `D:\Repositories\starci-academy-backend` / `mtp` |
| Purpose | Đề xuất trust rule buộc survey design-purpose và generic owner trước khi tạo một component cùng shape. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\generic-owner-before-duplicate.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; Plan không sửa `.claude`, test hay production source. |

Window: mọi `REJECTED` row trong workflow records thuộc app `starci-academy` tại thời điểm Plan.

### QUALIFIED GROUP — REFERENCE OWNER CLOSURE

| Witness | Refusal | Replacement | Missing law exposed |
|---|---|---|---|
| `fidel/starci-academy/course-detail-ownership-and-rail.md` | “Detail-specific ticked checklist” và “same-looking private implementation” | Shared catalog/detail `CourseValuePropositionList` | Nhìn giống reference không đủ; phải trace owner và reuse shape thật. |
| `designs/starci-academy/shell-account-language-menus.md` | Duplicate `account-menu-identity-header` contract | Reuse existing profile identity row | Contract search theo tên domain bỏ sót owner có cùng slot purpose. |
| `fidel/starci-academy/global-search-modal-spacing-listbox-20260815-01.md` | Scope row chrome tự chế | Reuse HeroUI `SelectionList`; later feedback còn chỉ ra dashboard row/StatRow | Inventory interaction owner nhưng không trace visual composite owner vẫn sinh typography/chrome drift. |
| `consolidation/starci-academy/generic-action-row.md` plan r1 | Tạo generic row từ dead `QuickActionRow`, bỏ streak/credit/reward | Rename/generalize proven `StatRow` và include toàn bộ consumers | Search theo tên/reference gần nhất không bằng survey slot/design purpose toàn graph. |

### RULES AT TIME

| Existing rule | What it said | Gap demonstrated |
|---|---|---|
| `fe/canon/uxui/layers/composite.md` COMPOSITE-2 | Composite names shape, never domain. | Đúng product law nhưng chỉ được đọc sau khi owner đã bị chọn sai. |
| `fe/canon/uxui/layers/composite.md` COMPOSITE-7 | Promote on second consumer. | Không bắt workflow chứng minh đã tìm consumer/owner thứ hai hoặc thứ ba. |
| `starci-fe-fidelity-start/SKILL.md` PROCESS | “inventory existing owners before inventing a new one”. | “Inventory” không yêu cầu trace reference component/contract, so slot purpose, hay xử lý domain-named owner. |
| `starci-fe-consolidate-plan/SKILL.md` PROCESS | Compare domain entity, flags and className cost. | Chỉ hữu ích sau khi đúng members đã được đưa vào survey; không ngăn bỏ sót `StatRow`. |

### PROPOSED RULE

Before drawing or copying a referenced shape, trace the rendered reference to its concrete component and contract, then compare its named slots and design purpose against existing leaf, composite and contract owners—including domain-named owners. When purpose matches, reuse or alter/rename the existing owner and contract; a different interaction host alone is not evidence for duplicating the visual content.

### PROPOSED HOME

| Path | Change | Why here |
|---|---|---|
| `.claude/skills/starci-fe-fidelity-start/SKILL.md` | Add mandatory `REFERENCE OWNER CLOSURE` step before smallest-boundary correction. Require evidence table: reference owner, contract, same-purpose candidates, verdict `reuse` / `alter-generic` / `keep-apart`, and interaction-host distinction. | Repeated misses happened while translating visual feedback into a patch; Fidelity Start owns that moment. |
| `.claude/sources/skills.test.mjs` | Add whitespace-tolerant regression assertions for trace concrete owner/contract, compare slot purpose including domain-named owners, and prefer reuse/alter over duplicate. | Process wording is machine-checkable even though semantic owner choice is not. |

No new canon wording is proposed: COMPOSITE-2/7 already state the product law. No semantic lint is proposed: “same design purpose” cannot be inferred honestly from JSX/classes alone.

### WATCHED

| Observation | Status | Promotion trigger |
|---|---|---|
| Automatically rename every domain-named composite when a second consumer appears | WATCHED | Repeated refusal where reuse was correct but rename itself caused avoidable migration cost. Current evidence supports deliberate review, not automatic rename. |
| Lint duplicate row markup structurally | WATCHED | A reliable AST signal separating same-purpose rows from coincidentally similar vendor hosts. |

### REVIEW / APPLY BOUNDARY

| Phase | Exact boundary |
|---|---|
| Upgrade Review | Challenge wording/home/test obligations; no trust write. |
| Upgrade Apply | Only `.claude/skills/starci-fe-fidelity-start/SKILL.md` and `.claude/sources/skills.test.mjs`; run focused skill tests plus trust gates. |
| Product consolidation | Separate approved `generic-action-row` consolidation workflow; upgrade cannot edit FE product source. |

### OUTPUTS

| Concept | Result |
|---|---|
| Proposed trust upgrade | Add a mandatory reference-owner closure to Fidelity Start so it finds and alters a same-purpose generic contract/composite before copying row anatomy. |
| Evidence strength | Four deduplicated witnesses across design/fidelity/consolidation records; proposal qualifies beyond WATCHED. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/generic-owner-before-duplicate.md` | `added` — refusal group, existing-rule gap, proposed home and exact future boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Review rule home | Default: Fidelity Start process + focused skill regression test; alternative: broaden to shared `skill-shape.md`, which would affect non-FE capabilities without supporting refusals. |

### WARNINGS

| Warning | Impact |
|---|---|
| Canon already contains generic naming/reuse law. | Duplicating canon wording would not fix process compliance; proposal deliberately changes execution checklist instead. |
| Semantic same-purpose detection is not honest lint. | Test can enforce the required evidence step, not prove the human design verdict. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Add another generic-composite canon sentence | Add a Fidelity reference-owner closure | Existing COMPOSITE-2/7 already say it; failure occurred because the workflow did not trace candidates. |
| Automatically merge visually similar ListBox owners | Keep interaction hosts apart; consolidate visual content only after purpose comparison | Selection/activation semantics can differ while row content purpose matches. |
| Add heuristic duplicate-markup lint | Regression-test the required survey evidence | JSX similarity cannot prove design purpose. |

### OWED

| Owed | Cleared by |
|---|---|
| Upgrade Review | Run `starci-fe-upgrade-review` and approve exact wording/home/test revision. |
| Trust-tree write | After approval, run `starci-fe-upgrade-apply`. |
| Product consolidation | Complete its separate Consolidate Review/Apply before Fidelity End. |
| Fidelity closure | Run Fidelity End then Finality only after product proof and user acceptance. |

## review

Revision: `reference-owner-closure-review-r1`

Approved revision: reference-owner-closure-review-r1

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
| Repo / branch | FE `D:\Repositories\starci-academy-fe` / `main`; BE `D:\Repositories\starci-academy-backend` / `mtp` |
| Purpose | Review exact `.claude` wording, home, regression test và write boundary cho generic-owner closure. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\generic-owner-before-duplicate.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ upgrade workflow; chưa sửa trust tree. |

### WITNESS REVIEW

| Witness group | Dedup verdict | Qualifies? |
|---|---|---|
| Course detail private checklist vs shared catalog/detail owner | One workflow witness | Yes. |
| Account menu duplicate identity contract vs profile identity row | One workflow witness | Yes. |
| Global Search custom scope row + missed StatRow owner | Global Search fidelity + linked consolidation evidence count as one incident | Yes. |

Three independent incidents remain after deduplication; proposal is not a one-off preference.

### EXACT APPROVED-CANDIDATE WORDING

Add under Fidelity Start `PROCESS`, before the smallest-boundary correction:

> **REFERENCE OWNER CLOSURE.** Before drawing or copying a referenced shape, trace the rendered reference to its concrete component and contract. Compare its named slots and design purpose with existing leaf, composite and contract owners, including owners whose current name is domain-specific. Record each plausible owner as `reuse`, `alter-generic` or `keep-apart`. A different interaction host does not by itself justify duplicating the visual content. When purpose matches, prefer reusing or altering/renaming the existing owner and its contract; if that requires a boundary not already authorized, route that exact consolidation boundary before writing the duplicate.

Required fidelity evidence table:

| Reference | Concrete owner / contract | Same-purpose candidates | Verdict | Interaction-host difference |
|---|---|---|---|---|

### HOME / TEST / BOUNDARY REVIEW

| Item | Frozen decision |
|---|---|
| Home | `.claude/skills/starci-fe-fidelity-start/SKILL.md`, because it governs reference-to-patch execution. |
| Canon | No edit; COMPOSITE-2/7 already own shape naming and second-consumer law. |
| Lint | No edit; same design purpose is semantic and not reliably inferable. |
| Regression | Extend `.claude/sources/skills.test.mjs` Fidelity Start test with whitespace-tolerant assertions for heading, trace, domain-specific candidates, three verdicts and interaction-host sentence. |
| Apply write boundary | Exactly the skill file and test file above; workflow append is evidence. |
| Gates | `node --test .claude/sources/skills.test.mjs`, then repository trust test command if package scripts expose one, plus workflow validator with unrelated historical errors separated. |

### OUTPUTS

| Concept | Result |
|---|---|
| Review revision | `reference-owner-closure-review-r1` freezes exact wording, evidence table, home, test obligation and two-file trust boundary. |
| Behavior change | Fidelity must proactively find the concrete contract and alter/generalize it when design purpose matches; it may not copy visual content merely because interaction hosts differ. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/generic-owner-before-duplicate.md` | `modified` — append exact review wording/home/test/boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve trust revision | Default: approve `reference-owner-closure-review-r1`; alternative: revise wording/home before `.claude` write. |

### WARNINGS

| Warning | Impact |
|---|---|
| Rule can require evidence but cannot automate semantic design-purpose judgment. | Human/agent still owns `reuse` vs `keep-apart`; regression test ensures the step cannot silently disappear. |
| Product migration belongs to consolidation workflow. | Upgrade Apply cannot repair FE source. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Put rule only in composite canon | Put execution closure in Fidelity Start | Existing canon was already sufficient but was not operationalized during the patch. |
| Force automatic merge on matching markup | Require slot/purpose verdict and interaction-host comparison | Similar markup can still represent different owners. |
| Change shared `skill-shape.md` | Change FE Fidelity Start only | Witnesses all arise in FE reference correction; broader scope lacks evidence. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit review approval | User says `approve reference-owner-closure-review-r1`. |
| Upgrade Apply | After approval, modify exact two trust files and run gates. |
| Product consolidation | Approve/apply `generic-icon-label-fact-row-review-r1` separately. |
| Fidelity End/Finality | Only after both Applies, production proof and user acceptance. |

## apply

Applied revision: reference-owner-closure-review-r1

Baseline commit: 12b43a2

Tracked diff: 12b43a2..worktree

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
| Repo / branch | Trust `D:\Repositories\starci-academy-backend\.claude` / `main`; FE `main`; BE `mtp` |
| Purpose | Áp dụng reference-owner closure đã duyệt và chứng minh regression test. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\generic-owner-before-duplicate.md |
| Language | vi |
| Phase | apply |
| Touching | `.claude/skills/starci-fe-fidelity-start/SKILL.md`, `.claude/sources/skills.test.mjs`, workflow evidence này. |

### PROOF

| Gate | Result |
|---|---|
| Focused twin regression | PASS — `node --test --test-name-pattern "Fidelity Start fixes small patches" sources/skills.test.mjs`: 1/1. |
| Full skills suite | BASELINE RED — 13/14 pass; unrelated `starci-be-audit-apply` lacks `## PROCESS`. |
| Workflow validator | BASELINE RED — 79 records checked; historical errors remain; không có lỗi mới thuộc workflow consolidation/upgrade này. |
| Diff check | PASS — exact two-file trust diff from `12b43a2`, no whitespace errors. |

### OUTPUTS

| Concept | Result |
|---|---|
| Reference-owner closure | Fidelity Start phải trace component/contract thật và phân loại owner `reuse`, `alter-generic`, `keep-apart` trước khi copy shape. |
| Interaction distinction | Interaction host khác không còn tự động biện minh cho visual duplicate. |

### CHANGES

| Tree | Details |
|---|---|
| `.claude/skills/starci-fe-fidelity-start/SKILL.md` | `modified` — mandatory closure wording + evidence table. |
| `.claude/sources/skills.test.mjs` | `modified` — whitespace-tolerant regression assertions. |
| `.workflows/upgrade/starci-academy/generic-owner-before-duplicate.md` | `modified` — approval và Apply evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Exact trust revision đã được chấp thuận. |

### WARNINGS

| Warning | Impact |
|---|---|
| Full trust suite có một lỗi baseline ngoài boundary. | Không thể tuyên bố toàn trust tree xanh; focused new regression đã pass. |
| Workflow validator có historical debt lớn. | Không làm mất hiệu lực exact workflow evidence mới nhưng gate tổng vẫn đỏ. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Heuristic duplicate-markup lint | Mandatory semantic owner evidence | Same-purpose không thể suy ra đáng tin chỉ từ JSX/classes. |

### OWED

| Owed | Cleared by |
|---|---|
| Full skills gate | Thêm approved `## PROCESS` cho `starci-be-audit-apply`, rồi chạy lại `node --test sources/skills.test.mjs`. |
| Historical workflow gate | Repair/rerun workflow drift theo từng owning workflow; không mở rộng upgrade boundary này. |
