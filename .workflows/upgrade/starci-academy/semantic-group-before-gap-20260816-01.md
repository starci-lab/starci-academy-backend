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
| Repo / branch | D:\Repositories\starci-academy-backend / mtp @ 4615bc7dd2d19846bc69378690e56fc5302cb7d9 |
| Purpose | Operationalize group-first spacing so fidelity cannot choose gap before proving semantic container boundaries. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\semantic-group-before-gap-20260816-01.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow upgrade này. |

Window: toàn bộ `REJECTED` records hiện có của app `starci-academy` tại ngày 2026-08-16.

### Witnesses

| Refusal | Rule gap | Proposed home | Status |
|---|---|---|---|
| `designs/starci-academy/course-pricing-rail-density-r1.md`: từ chối chỉ giảm `gap-4`; cần thay composition/reading order. | Gap number was treated as the design input instead of a consequence of grouping. | Fidelity Start PROCESS evidence. | QUALIFIES — first witness. |
| `designs/starci-academy/course-pricing-rail-rebrainstorm.md`: từ chối nested intent cards; thay bằng hai named semantic groups trong cùng SurfaceCard. | Surface grouping existed conceptually but was not made an explicit precondition before spacing. | Fidelity Start PROCESS evidence plus contract-node naming. | QUALIFIES — independent second witness. |
| `fidel/starci-academy/course-detail-ownership-and-rail.md`: từ chối đọc sai component boundary và giữ `gap-4`; chốt compact grouped-card grids dùng `gap-2`. | Existing contract value was trusted before re-measuring direct-child ownership. | Fidelity Start PROCESS evidence. | QUALIFIES — repeated implementation witness. |
| `fidel/starci-academy/course-pricing-rail-trial-phase-density-20260815-01.md` feedback r4/r8/r9: từ chối flat gap; yêu cầu nested price/scarcity, trigger/content, copy/actions containers. | Canon states one seam per container, but workflow does not require a group tree before a gap patch. | Fidelity Start PROCESS; minimal canon cross-reference only if Review finds wording ambiguous. | QUALIFIES — current bounded recurrence. |

### EXISTING TRUST

| Source | What it already says | Finding |
|---|---|---|
| `.claude/fe/design/gap.md` GAP-6 | One seam per container; two seams require two containers. | Canon principle is already correct. |
| `.claude/fe/design/gap.md` GAP-8/GAP-9 | Parent/child groups own inner and outer rungs; composed groups use the next rung. | No new numeric gap law is needed. |
| `.claude/fe/canon/patterns/tokens.md` | Token ladder follows semantic grouping. | Token table is not the failure point. |
| `.workflows/upgrade/starci-academy/fidelity-closure-canon-audit.md` | Previously rejected duplicating gap prose when implementation ignored adequate canon. | Upgrade should enforce consumption, not add another descriptive paragraph. |

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate rule | Before changing spacing, partition direct children into named semantic groups. Each container owns exactly one seam. If sibling relationships need different seams, introduce nested named contract containers (rendered as `div` by default, or the correct semantic host such as `ul`/`section`) before assigning gap tokens. |
| Required evidence | Every fidelity spacing patch records a compact `GROUPING / SEAMS` table: container contract, direct children, relationship, selected gap and nested-group decision. |
| Primary home | `.claude/skills/starci-fe-fidelity-start/SKILL.md` PROCESS and output schema. |
| Secondary home | No canon mutation by default; Upgrade Review may approve one cross-reference in `.claude/fe/design/gap.md` only if needed to point to the required evidence shape. |
| Regression boundary | Skill-shape/fixture validation must fail a spacing-fidelity record that changes a gap without `GROUPING / SEAMS` evidence. Product lint should not guess semantic intent from arbitrary DOM. |
| Upgrade verdict | PROPOSED for Upgrade Review. The recurrence is a workflow-consumption defect, not a missing gap token. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/semantic-group-before-gap-20260816-01.md` | added — freezes witnesses and the proposed group-first enforcement boundary without editing trust or product source. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Upgrade Review | Freeze exact skill wording, evidence schema, validator fixture and whether a canon cross-reference is necessary. |

### WARNINGS

| Warning | Impact |
|---|---|
| Requiring literal `div` universally would break semantic list/section ownership. | Proposal defaults ordinary groups to `div` but preserves semantic hosts where required. |
| A generic lint rule cannot reliably infer whether two children form one thought group. | Enforcement belongs in fidelity evidence and contract-backed connected tests, not heuristic JSX lint. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Add another gap value or repeat the existing one-seam prose | Require a group tree before any gap decision | Existing canon already states the law; repeated misses show a consumption failure. |
| Force every group to be a literal `div` | Default to `div`, preserve `ul`, `section` or another correct semantic host | Grouping is mandatory; invalid HTML is not. |
| Infer semantic groups automatically in product lint | Validate workflow evidence and connected contract containment tests | Relationship intent is not reliably recoverable from syntax alone. |

### OWED

| Owed | Cleared by |
|---|---|
| Upgrade Review | Approve exact trust-tree wording, home, validator fixture and write boundary. |
| Upgrade Apply | Mutate trust only after Review approval and pass skill-shape gates. |

## review r1

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
| Repo / branch | D:\Repositories\starci-academy-backend / mtp @ 4615bc7dd2d19846bc69378690e56fc5302cb7d9 |
| Purpose | Close the leaf-folder escape hatch that allowed a structural disclosure tree to be filed as one leaf, then require tier ownership before spacing patches. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\semantic-group-before-gap-20260816-01.md |
| Language | vi |
| Phase | review |
| Touching | This workflow only. No trust or product source is written in Review. |

### OUTPUTS

| Concept | Result |
|---|---|
| Root cause | `no-structural-host-outside-contract-frame` deliberately exempts `leaves/`; its own test currently accepts `LEAF -> <div />`. The prose says a leaf wraps one primitive, but no machine gate rejects a leaf that nests `div > div > ul > li` and therefore arranges several contents. |
| Existing law retained | Hosts outside leaves/Tree/specific surface mechanics remain contract-owned. A leaf may still own one atomic intrinsic or vendor host such as `Text`, `Divider`, `DayCell`, a button or an input. |
| New canonical lint rule | Add `starci-fe/no-structural-arrangement-in-leaf` to `.claude/sources/fe/contract.mjs` and `recommended` at `error`. In a product file under `components/leaves`, report (1) a neutral or semantic structural host nested below another structural host, and (2) two or more structural host siblings under the same JSX element or fragment. The message must say that this is a composite/contract tree and instruct moving ownership to a branch rendered through `Tree`; adding `meta.shape = "leaf"`, `data-tier="leaf"`, aliases, constants or helper callbacks is not an exemption. |
| AST boundary | Structural hosts are the canonical `NEUTRAL_HOSTS` plus `SEMANTIC_HOSTS`. Count source JSX structure, not class strings, markers or component names. Separate conditional return branches each containing one atomic root do not become siblings merely because they share a file. Tests and the Tree frame remain excluded; leaf product source is the only governed tier for this rule. |
| Regression tests | Extend `.claude/sources/fe/contract.test.mjs`: valid atomic leaf host; valid atomic host containing inline text/icon controls; valid separate conditional atomic roots. Invalid nested `div > div`; invalid `div > ul`; invalid `ul > li`; invalid two structural siblings in a fragment; invalid two structural siblings under one atomic wrapper. Assert the canonical message id, not only error count. |
| Workflow consumption | Extend `.claude/skills/starci-fe-fidelity-start/SKILL.md`: before adding/changing wrapper, list, region or spacing, append `### GROUPING / TREE` with owner tier, contract key, host, direct children, semantic relationship, inner seam and outer seam. If the proposed owner is a leaf and contains more than one content or one structural relationship, classify it as `new-finding`/`ALTER`; do not patch it as a leaf. |
| Connected proof | A touched structural correction must run canonical contract lint plus a connected render assertion that the expected `Tree`/contract ancestry reaches the DOM. Role/text/class-only tests do not prove ownership. |
| No bypass | No eslint disable, severity downgrade, path exception, `data-tier` marker, renamed wrapper, helper extraction or `defineLeafComponent` render callback may satisfy the rule. An existing violation is debt to migrate through FE lint-sync/consolidation; it is not an exemption to copy. |
| Canon prose | No new gap canon. Existing one-seam law is sufficient. Add only a cross-reference from Fidelity Start to the new lint invariant; do not duplicate architecture prose. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/semantic-group-before-gap-20260816-01.md` | Append this reviewed revision. |
| `.claude/sources/fe/contract.mjs` | Approved candidate for Apply: add and export `no-structural-arrangement-in-leaf`; recommended severity remains `error`. |
| `.claude/sources/fe/contract.test.mjs` | Approved candidate for Apply: add positive and anti-bypass AST cases listed above. |
| `.claude/skills/starci-fe-fidelity-start/SKILL.md` | Approved candidate for Apply: require `GROUPING / TREE` evidence before structural/spacing writes. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Apply revision | Explicitly approve `semantic-group-tree-r1` for `$starci-fe-upgrade-apply`. |

### WARNINGS

| Warning | Impact |
|---|---|
| Existing frontend leaves include structural debt (`PricingPhaseDisclosure`, `CurriculumModuleRow`, `Article`). | The canonical rule must still be strict. Adoption/migration belongs to FE lint-sync or the active fidelity/consolidation boundary; Apply must not weaken the rule to preserve debt. |
| Literal `no-host-in-leaves` would also reject honest atomic leaves. | The reviewed invariant rejects arrangements, not the one atomic host a leaf exists to own. |
| Syntax cannot infer every semantic lie hidden behind imported components. | The AST rule is paired with required owner evidence and connected Tree ancestry proof; neither gate may substitute for the other. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Keep only `no-structural-host-outside-contract-frame` | Add the complementary leaf-arrangement gate | The current defect lives inside the folder that rule exempts. |
| Ban every intrinsic host in a leaf | Permit one atomic host, reject nested/sibling structural ownership | A leaf must ultimately own a primitive host; banning it would force fake composites and vendor wrappers. |
| Treat `meta.shape`, `data-tier` or `defineLeafComponent` as proof | Inspect JSX structure and connected contract ancestry | Those labels were exactly how the wrong component appeared compliant. |
| Fix only the current `PricingPhaseDisclosure` | Make the trust rule fail the entire defect class | A source patch alone would allow the next renamed leaf to repeat it. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of `semantic-group-tree-r1` | User approves this exact review revision. |
| Trust mutation | `$starci-fe-upgrade-apply` edits only the three approved trust files and runs contract tests plus trust gates. |
| Existing FE violations | Route separately through lint-sync/consolidation or the authorized open fidelity session; do not hide them in Upgrade Apply. |

## review r2

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
| Repo / branch | D:\Repositories\starci-academy-backend / mtp @ 4615bc7dd2d19846bc69378690e56fc5302cb7d9 |
| Purpose | Record explicit approval of the frozen leaf-arrangement lint and GROUPING / TREE evidence revision. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\semantic-group-before-gap-20260816-01.md |
| Language | vi |
| Phase | review |
| Touching | This workflow only. No trust or product source is written in Review. |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `semantic-group-tree-r1` |
| Approval evidence | User message `XÚC` on 2026-08-16 explicitly authorizes Apply. |
| Frozen write boundary | `.claude/sources/fe/contract.mjs`; `.claude/sources/fe/contract.test.mjs`; `.claude/skills/starci-fe-fidelity-start/SKILL.md`. |

Approved revision: semantic-group-tree-r1

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/semantic-group-before-gap-20260816-01.md` | Append-only approval evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Apply may begin within the frozen boundary. |

### WARNINGS

| Warning | Impact |
|---|---|
| Existing FE leaf violations remain outside this Apply boundary. | They must be surfaced, not weakened or repaired here. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Expand Apply into product repairs | Keep exact trust-only boundary | Approval covers the reviewed trust revision only. |

### OWED

| Owed | Cleared by |
|---|---|
| Trust mutation and proof | `$starci-fe-upgrade-apply` applies the frozen revision and records gates. |

## apply

Applied revision: semantic-group-tree-r1

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
| Repo / branch | D:\Repositories\starci-academy-backend / mtp @ 898bf89d24b05d0d71c1259ce6ad1a54c8a61c34 |
| Purpose | Enforce one atomic host per leaf and require owner/group evidence before structural or spacing fidelity patches. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\semantic-group-before-gap-20260816-01.md |
| Language | vi |
| Phase | apply |
| Touching | Approved trust files, generated FE lint mirror, and this append-only workflow record. No product source repair. |

### OUTPUTS

| Concept | Result |
|---|---|
| Applied revision | `semantic-group-tree-r1` |
| Baseline | Path-scoped workflow baseline commit `898bf89d24b05d0d71c1259ce6ad1a54c8a61c34`; unrelated dirty files were not staged. |
| Canon rule | Added strict `starci-fe/no-structural-arrangement-in-leaf`; one atomic host remains legal, nested structural hosts and structural siblings are errors. |
| Anti-bypass | Twin cases cover neutral and semantic nesting, fragment/custom-parent siblings, host alias and `defineLeafComponent` callback extraction. |
| Fidelity consumption | `GROUPING / TREE` now freezes owner tier, key, host, direct children, semantic relationship, inner/outer seams and verdict before structural/spacing writes. |
| Focused canon proof | `node --test .claude/sources/fe/contract.test.mjs`: 17/17 pass. |
| Mirror proof | Generated mirror synced; mirror `contract.test.mjs`: 17/17 pass; subsequent `gate:canon` reports exact parity. |
| Real-source proof | FE lint reports four strict findings: one in `CurriculumModuleRow`, three in `PricingPhaseDisclosure`. No false-positive class appeared across the remaining leaf sources. |
| Trust proof | Full trust suite: 191/192 pass; sole pre-existing failure is `starci-be-audit-apply` missing `## PROCESS`. Workflow history validator remains red on unrelated legacy records. |

### CHANGES

| Tree | Details |
|---|---|
| `.claude/sources/fe/contract.mjs` | Added and exported the strict leaf-arrangement rule; recommended severity is automatically `error`. |
| `.claude/sources/fe/contract.test.mjs` | Added valid atomic/conditional cases and seven invalid/anti-bypass cases. |
| `.claude/skills/starci-fe-fidelity-start/SKILL.md` | Added mandatory `GROUPING / TREE` evidence and connected Tree ancestry proof. |
| `D:\Repositories\starci-academy-fe\plugins\eslint-canon\contract.mjs` | Generated mirror synchronized from canon. |
| `D:\Repositories\starci-academy-fe\plugins\eslint-canon\contract.test.mjs` | Generated twin mirror synchronized from canon. |
| `.workflows/upgrade/starci-academy/semantic-group-before-gap-20260816-01.md` | Appended approval and Apply evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Product migration | Route the four strict findings through FE lint-sync/consolidation or an authorized open fidelity boundary; this Apply does not own those product files. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE lint is now red on four real leaf-arrangement errors. | Canon is strict as approved; product migration is required before repository lint returns green. |
| Source `.claude/` is ignored by the Source repository's `.gitignore`. | The authoritative local trust files were updated and mirrored; the workflow baseline/record is tracked, but the trust source itself has no ordinary git diff in Source. |
| Full trust suite has one unrelated pre-existing failure. | The new contract twins pass; no claim is made that the entire trust tree is green. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Downgrade the new rule to warning or add path exceptions | Keep generated recommended severity at `error` | The approved defect class must fail rather than teach authors to ignore it. |
| Repair `CurriculumModuleRow` or `PricingPhaseDisclosure` inside Upgrade Apply | Record exact findings and route product ownership separately | Product files were outside the approved trust boundary. |
| Treat aliases, metadata or callback extraction as compliance | Inspect source JSX structure and require connected Tree ancestry | Labels and indirection do not change ownership. |

### OWED

| Owed | Cleared by |
|---|---|
| Migrate `CurriculumModuleRow` structural ownership | Approved FE lint-sync/consolidation or bounded fidelity product repair, then green FE lint. |
| Migrate `PricingPhaseDisclosure` structural ownership | Approved FE lint-sync/consolidation or bounded fidelity product repair, then green FE lint. |
| Pre-existing trust skill-shape failure | Separate backend trust upgrade for `starci-be-audit-apply`; not part of this revision. |

### VERIFICATION ADDENDUM

| Gate | Result |
|---|---|
| Isolated workflow validation | 1 checked, 0 legacy, 0 errors. |
| Canon-to-frontend parity | `sync-fe-lint.mjs` reports the mirror matches the trust tree and target config imports it. |
| Diff hygiene | `git diff --check` passes for the workflow and both generated frontend mirror files; only line-ending notices remain. |
