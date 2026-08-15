<!-- starci-workflow: v2 -->

# Design Review owner challenge

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
| Repo / branch | Source `D:\Repositories\starci-academy-backend` / `mtp`; Trust `D:\Repositories\starci-academy-backend\.claude` / `main`; FE `D:\Repositories\starci-academy-fe` / `main` |
| Purpose | Bắt Design Review công khai phản biện owner trước khi phê duyệt `ADD composite` hoặc `ADD block`. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\design-review-owner-challenge.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow proposal này; Plan không sửa `.claude`, canon, validator hoặc product source. |

Window: toàn bộ workflow records của app `starci-academy` hiện có đến 2026-08-16; evidence chỉ lấy từ các bảng `REJECTED` không rỗng.

### REFUSAL GROUP — OWNER ĐƯỢC THÊM TRƯỚC KHI OWNER GẦN NHẤT ĐƯỢC PHẢN BIỆN

| Refusal | Task record | Missing rule at the time |
|---|---|---|
| “R1 tạo `IconLabelFactRow` từ dead `QuickActionRow`” → “Rename/generalize proven `StatRow`” | `.workflows/consolidation/starci-academy/generic-action-row.md` | Review có `Reason` nhưng không bắt liệt kê owner đang có, import/call graph và verdict REUSE/ALTER trước ADD. |
| “Bỏ streak/credit/reward khỏi consolidation matrix” → “Include toàn bộ current `StatRow` consumers” | `.workflows/consolidation/starci-academy/generic-action-row.md` | Không có artifact buộc một generic-owner decision chứng minh toàn bộ consumers hiện hữu. |
| “Custom scope/list row và duplicate generic row” → “Reuse SelectionList/SurfaceListCard và alter proven StatRow owner” | `.workflows/fidel/starci-academy/global-search-modal-spacing-listbox-20260815-01.md` | Owner inventory/closure chỉ được bổ sung cho Fidelity sau sự cố; Design Review vẫn có thể duyệt ADD bằng một câu Reason chung chung. |

### CURRENT RULE GAP

| Current owner | What it already says | Gap |
|---|---|---|
| `fe/canon/uxui/layers/composite.md` | Composite tên theo shape; chỉ promote ở consumer thứ hai; không domain/hook/translation. | Định nghĩa đúng nhưng Design Review không bắt in evidence đã tìm consumer và owner gần nhất. |
| `fe/canon/uxui/layers/block.md` | Block sở hữu domain sentence, request, copy, state và connected/pure twin. | `COMPONENT DELTA.Reason` có thể nói “new block needed” mà không chứng minh domain owner hiện hữu không thể reuse/alter. |
| `skills/starci-fe-design-review/SKILL.md` | Bắt `COMPONENT DELTA`, `PROPS DELTA`, live definition/consumer scan và cấm duplicate shape. | Không có vòng owner challenge riêng; không có matching evidence row cho mỗi `ADD composite`/`ADD block`. |
| `scripts/validate-workflows.mjs` | Kiểm layer/action/path/call sites/contract/reason và prop verdict. | Chỉ kiểm Reason tồn tại, không kiểm ADD đã có owner challenge hoặc layer proof. |

### PROPOSED LAW

Một approved FE Design Review không được ghi `ADD composite` hoặc `ADD block` chỉ bằng `Reason`. Trước `COMPONENT DELTA`, Review phải in `### OWNER CHALLENGE`, khảo sát owner/contract gần nhất và thử `REUSE`, rồi `ALTER`, trước khi giữ verdict `ADD`.

| Proposed owner | Layer | Purpose | Closest existing owners / contracts | REUSE verdict | ALTER verdict | Layer proof | Decision | Evidence |
|---|---|---|---|---|---|---|---|---|

Rules for each matching row:

- `Closest existing owners / contracts` names concrete source owners and contracts. `None` is valid only with exact searched roots and import/call evidence in `Evidence`.
- `REUSE verdict` states why direct reuse preserves or breaks purpose; `ALTER verdict` states why renaming/generalizing an owner preserves or breaks all current consumers.
- `composite` layer proof names at least two real consumers of one closed named-slot shape. A one-consumer prediction cannot produce `ADD composite`; it stays block-internal.
- `block` layer proof names the distinct domain sentence plus request/copy/state ownership and connected/pure twin. Visual novelty is not block evidence, and a new block still reuses existing drawing vocabulary.
- `Decision` is `REUSE`, `ALTER`, `KEEP_APART` or `ADD`. Every `COMPONENT DELTA` row with layer `composite`/`block` and action `ADD` must match an `ADD` owner-challenge row; its `Reason` cites that decision.
- The table is printed in Review before approval. This is source architecture evidence, not content added to the tabbed HTML preview.

### PROPOSED HOME AND PROOF

| Path | Planned change | Why this home |
|---|---|---|
| `.claude/skills/starci-fe-design-review/SKILL.md` | Add the mandatory owner-challenge pass/table and layer-specific burden of proof before component/props deltas. | The failure is how Review operates, while canon definitions are already sufficient. |
| `.claude/scripts/validate-workflows.mjs` | Require `OWNER CHALLENGE` in approved Design Review and a matching `ADD` row for each `ADD composite`/`ADD block`. | Presence and owner matching are mechanically checkable. |
| `.claude/sources/workflows.test.mjs` | Add positive and negative workflow fixtures for missing/mismatched challenge rows. | Prevent validator regression. |
| `.claude/sources/skills.test.mjs` | Assert Review wording includes REUSE → ALTER → ADD order and distinct composite/block proof. | Prevent skill prose from drifting away from the workflow gate. |

Canon files remain unchanged: the proposal operationalizes existing `COMPOSITE-2/7` and `BLOCK-1/4/9` rather than repeating them.

### WATCHED

| Pattern | Status | Promotion trigger |
|---|---|---|
| Extend owner challenge to every layer/action, including leaf, branch, page and MODIFY | WATCHED | Two refusal rows showing those owners escaped Review despite current Component Delta inventory. |
| Semantic lint deciding whether two shapes have the same purpose | WATCHED | A reliable source-level signal; current JSX/classes cannot prove product purpose. |
| Put owner rationale inside Design Plan HTML preview | REFUSED | Preview settles product direction; source ownership belongs in Review evidence. |

### OUTPUTS

| Concept | Result |
|---|---|
| Proposed rule | Approved Design Review must prove REUSE and ALTER were challenged before `ADD composite`/`ADD block`. |
| Composite burden | Two real consumers sharing one closed shape are mandatory; absence of a similar shape alone does not justify a composite. |
| Block burden | Distinct domain/request/copy/state ownership is mandatory; visual novelty does not justify a block. |
| Review visibility | Owner rationale becomes a dedicated printed matrix, not a vague Component Delta reason. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/design-review-owner-challenge.md` | `added` — refusal witnesses, rule proposal, exact trust boundary and proof plan. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Move proposal to Upgrade Review? | Recommended: review exact `OWNER CHALLENGE` schema and four-path trust boundary; alternative feedback revises this Plan first. |

### WARNINGS

| Warning | Impact |
|---|---|
| Semantic quality of REUSE/ALTER reasoning cannot be fully linted. | Validator can require rows and identity matching; Review/user must challenge whether the evidence is honest. |
| Source has unrelated concurrent backend work and one open Global Search fidelity continuation. | Upgrade phases must touch only this workflow until Apply is approved, then only the exact `.claude` paths. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Repeat composite/block canon definitions | Operationalize them in Design Review | Canon already says what each layer means; the observed failure is missing review evidence. |
| Accept “không có shape giống” as sufficient | Require owner scan plus layer proof | For composite, one novel shape with one caller argues against extraction; for block, visual novelty is irrelevant. |
| Add architecture notes to preview HTML | Print `OWNER CHALLENGE` in Review | Preview and source ownership answer different questions. |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge exact table wording and validator matching behavior | `$starci-fe-upgrade-review` revision. |
| Trust-tree source changes | Explicit approval of one Upgrade Review revision, then `$starci-fe-upgrade-apply`. |

## review r1

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
| Repo / branch | Source `D:\Repositories\starci-academy-backend` / `mtp`; Trust `D:\Repositories\starci-academy-backend\.claude` / `main`; FE `D:\Repositories\starci-academy-fe` / `main` |
| Purpose | Phản biện và khóa exact forward-only Design Review owner challenge revision. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\design-review-owner-challenge.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow review này; chưa sửa trust tree. |

Proposed revision: `design-review-owner-challenge-review-r1`

### DEDUPLICATED WITNESSES

| Missing law | Witnesses | Verdict |
|---|---|---|
| Review did not make proposed owner defeat existing REUSE/ALTER candidates before ADD. | `generic-action-row.md`: dead `QuickActionRow` chosen over proven six-call `StatRow`; existing consumers omitted. `global-search-modal-spacing-listbox-20260815-01.md`: custom scope/list row and duplicate generic row rejected for `SelectionList`/`SurfaceListCard` reuse plus `StatRow` alteration. | QUALIFIED — repeated, source-backed and crosses composite/leaf/branch candidates. |
| Every layer/action needs the same challenge gate. | No second refusal group for page/layout/overlay/leaf/branch additions or MODIFY-only rows. | WATCHED — r1 limits mandatory challenge to `ADD composite` and `ADD block` requested by founder. |

### REVIEW CHALLENGE

| Question | Finding | Revision verdict |
|---|---|---|
| Is `COMPONENT DELTA.Reason` enough? | No. It proves a sentence exists, not that owner candidates were inventoried or challenged. | Add a dedicated matrix before Component Delta. |
| Is “no similar shape exists” sufficient? | No. A one-consumer novel shape argues against composite extraction; visual novelty is irrelevant to block ownership. | Require layer-specific proof. |
| Should canon change? | No. `COMPOSITE-2/7` and `BLOCK-1/4/9` already define the law. | Operationalize Review only. |
| Should Plan preview display architecture rationale? | No. Preview settles product direction; Review settles source ownership. | Print matrix in Review narrative, not HTML. |
| Can workflow validator require the table globally now? | Not safely. Existing v2 approved Design Reviews would become retroactively invalid and historical records cannot be rewritten. | Remove validator and workflow-validator tests from r1. |
| How is future drift prevented? | Skill regression can assert mandatory wording/table/order without touching historical records. | Update `sources/skills.test.mjs`. |

### EXACT WORDING TO TRAVEL

Add this forward-only section to `starci-fe-design-review/SKILL.md` immediately before `### COMPONENT DELTA` instructions:

> **OWNER CHALLENGE.** Before freezing `COMPONENT DELTA`, challenge every proposed `ADD` whose layer is `composite` or `block`. Search live owners, contracts, imports and call sites; try `REUSE`, then `ALTER`, before retaining `ADD`. Print the matrix under the exact heading `### OWNER CHALLENGE` before `### COMPONENT DELTA`:

| Proposed owner | Layer | Purpose | Closest existing owners / contracts | REUSE verdict | ALTER verdict | Layer proof | Decision | Evidence |
|---|---|---|---|---|---|---|---|---|

Then require:

- Each proposed `ADD composite` names at least two real consumers of the same closed named-slot shape. One caller remains block-internal; a prediction of reuse is not a consumer.
- Each proposed `ADD block` names its distinct domain sentence, request/copy/state ownership and connected/pure twin. A block may reuse an existing visual shape; visual novelty is not layer proof.
- `Closest existing owners / contracts` names concrete source candidates. `None` is accepted only when `Evidence` records the exact searched roots plus import/call result.
- `REUSE verdict` and `ALTER verdict` explain why purpose and every current consumer survive or fail. A different interaction host alone does not defeat reuse of the same visual content.
- `Decision` is `REUSE`, `ALTER`, `KEEP_APART` or `ADD`. Every `COMPONENT DELTA` row for `ADD composite` or `ADD block` must have one matching owner/layer row whose decision is `ADD`; its `Reason` cites the challenge evidence.
- If the selected direction proposes no such addition, print one `None` row so Review explicitly proves the gate was considered.
- Reject approval when the table is absent, a candidate/evidence cell is deferred, a composite has fewer than two proven consumers, a block is justified only by appearance, or a matching delta row is missing.
- Present `OWNER CHALLENGE` to the user before `COMPONENT DELTA` and `PROPS DELTA`; do not hide the rationale in a workflow-only appendix.

### APPROVAL UNIT

| Change | Exact home | Test obligation | Write boundary |
|---|---|---|---|
| Mandatory owner challenge pass and printed matrix | `.claude/skills/starci-fe-design-review/SKILL.md` | Skill text names heading, exact header, REUSE → ALTER → ADD order, composite two-consumer proof, block domain-owner proof, matching delta and visible presentation. | This file only. |
| Trust regression | `.claude/sources/skills.test.mjs` | One focused test asserts all obligations above and rejects silent removal by future edits. | This file only. |

No changes travel to canon, `skill-shape.md`, workflow validator, FE/BE source or other skills in r1.

### OUTPUTS

| Concept | Result |
|---|---|
| Review revision | `design-review-owner-challenge-review-r1` is the smallest forward-only rule that covers the repeated owner failures. |
| User-visible review | Every future relevant Design Review prints owner candidates and explicit REUSE/ALTER/ADD reasoning before deltas. |
| Layer distinction | Composite proves two consumers of a closed shape; block proves domain/request/copy/state ownership, not visual novelty. |
| Historical safety | Existing workflow records remain valid; no retroactive validator gate. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/design-review-owner-challenge.md` | `modified` — append review r1, exact wording, two-file boundary and approval unit. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve `design-review-owner-challenge-review-r1`? | Recommended: approve exact two-file boundary; feedback produces r2 before any `.claude` write. |

### WARNINGS

| Warning | Impact |
|---|---|
| Skill test checks that reasoning is demanded, not whether a semantic verdict is truthful. | User/Review must still challenge weak evidence; JSX similarity cannot decide purpose. |
| No validator presence gate in r1. | Historical workflows stay valid; future compliance relies on loaded Review skill plus trust regression. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Four-path Plan boundary including validator/workflow tests | Two-path skill + skill regression boundary | Mandatory validator presence would retroactively invalidate existing approved v2 Review records. |
| Generic “A because no shape is similar” wording | Layer-specific burden of proof | It gives the wrong answer for both one-consumer composites and visually familiar blocks. |
| Challenge every component layer/action in r1 | `ADD composite` and `ADD block` only | Broader gate lacks repeated refusal evidence and would add review ceremony without measured need. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of r1 | User replies `approve design-review-owner-challenge-review-r1`. |
| Trust source implementation | `$starci-fe-upgrade-apply` after approval. |

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
| App | starci-academy |
| Repo / branch | Source `D:\Repositories\starci-academy-backend` / `mtp`; Trust `D:\Repositories\starci-academy-backend\.claude` / `main`; FE `D:\Repositories\starci-academy-fe` / `main` |
| Purpose | Centralize owner-challenge law in creativity contract graph and make Design Review/Fidelity consume one contract. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\design-review-owner-challenge.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow review này; chưa sửa trust tree. |

Proposed revision: `shared-owner-challenge-review-r2`

Founder feedback: “cả fidelity chứ??” và “bỏ vào creativitys trong cannon đi mấy skilsl ref cho khỏe”.

### R2 CHALLENGE

| Question | Evidence | Revised verdict |
|---|---|---|
| Shared law already has an owner? | `fe/creativity/contract-graph.md` owns translation from selected design to page/block/branch/composite/leaf/shell and `GRAPH-3` already requires proof for new vocabulary. | MODIFY `GRAPH-3`; do not duplicate the full law in each skill. |
| Should Design Review consume it? | Review freezes the graph into Component/Props Delta. | Yes; reference graph law and print its exact matrix before deltas. |
| Should Fidelity consume it? | Fidelity reference repair already inventories owners, but its current private `REFERENCE OWNER CLOSURE` is weaker and can drift from Design Review. | Yes; reference the same graph law and print the same matrix before an owner correction. |
| Can Fidelity freely retain `ADD`? | Creativity INDEX says Fidelity returns to Plan when ownership or reusable vocabulary needs a choice. | Only exact binding evidence that already approved the owner can authorize ADD; otherwise classify as `new-finding` and route while continuing independent fixes. |
| Should block/composite definitions move into creativity? | No. Their semantic definitions remain layer canon. | Contract graph references their proof; it does not replace layer canon. |

### SHARED OWNER CHALLENGE CONTRACT

Extend `GRAPH-3 · Propose new vocabulary with proof` with this exact matrix:

| Proposed owner | Layer | Purpose | Closest existing owners / contracts | REUSE verdict | ALTER verdict | Layer proof | Decision | Evidence |
|---|---|---|---|---|---|---|---|---|

Shared requirements:

- Search live owners, contracts, imports and call sites. Try `REUSE`, then `ALTER`, before retaining `ADD`.
- Concrete candidates are mandatory. `None` requires exact searched roots and import/call evidence.
- `REUSE verdict` and `ALTER verdict` explain purpose and current-consumer effects; a different interaction host alone does not defeat reuse of shared visual content.
- `Decision` is `REUSE`, `ALTER`, `KEEP_APART` or `ADD`.
- `ADD composite` requires at least two real consumers of one closed named-slot shape; one consumer remains block-internal.
- `ADD block` requires a distinct domain sentence plus request/copy/state ownership and connected/pure twin; visual novelty is not block evidence.
- The consuming workflow prints one row for each challenged owner. If no composite/block addition is proposed, print one explicit `None` row.

### SKILL CONSUMPTION

| Consumer | Required behavior |
|---|---|
| `starci-fe-design-review` | Read shared GRAPH-3; print `### OWNER CHALLENGE` before `### COMPONENT DELTA`; every `ADD composite`/`ADD block` delta matches one `ADD` challenge row and cites its evidence in `Reason`; reject approval on missing/weak rows. |
| `starci-fe-fidelity-start` | Read shared GRAPH-3 during reference-owner closure; print `### OWNER CHALLENGE` before production correction when composite/block ownership is involved; proceed with REUSE/ALTER inside boundary, but route unapproved ADD as `new-finding`. |

Neither skill restates the full layer law. Both link the same canonical graph section and state only phase-specific handling.

### APPROVAL UNIT R2

| Change | Exact home | Test obligation | Write boundary |
|---|---|---|---|
| Shared owner challenge schema and layer proof | `.claude/fe/creativity/contract-graph.md` | Skill regression reads exact heading/header and shared requirements. | This file only. |
| Design Review consumption | `.claude/skills/starci-fe-design-review/SKILL.md` | Assert canonical reference, table-before-delta, matching ADD and rejection behavior. | This file only. |
| Fidelity consumption | `.claude/skills/starci-fe-fidelity-start/SKILL.md` | Assert canonical reference, same table, REUSE/ALTER continuation and unapproved ADD routing. | This file only. |
| Shared trust regression | `.claude/sources/skills.test.mjs` | One test proves canon and both skills carry the same header/reference without duplicated schemas. | This file only. |

No changes travel to layer canon, `skill-shape.md`, workflow validator, FE/BE source or other skills in r2.

### OUTPUTS

| Concept | Result |
|---|---|
| Shared law | Creativity contract graph becomes the single owner-challenge source for new/reworked vocabulary. |
| Design Review | Prints and challenges the shared matrix before freezing component/props deltas. |
| Fidelity | Uses the same matrix; REUSE/ALTER can continue in boundary, unapproved ADD routes as new ownership work. |
| Layer law | Composite/block definitions stay in canon and are referenced, not copied. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/design-review-owner-challenge.md` | `modified` — append r2 shared-canon architecture and four-file boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve `shared-owner-challenge-review-r2`? | Recommended: approve shared contract graph + Design Review + Fidelity + regression boundary; feedback produces r3. |

### WARNINGS

| Warning | Impact |
|---|---|
| `fe/creativity` is process canon, not semantic layer canon. | GRAPH-3 may coordinate proof but must not redefine what composite/block mean. |
| No global workflow-validator presence gate. | Historical v2 records remain valid; future behavior is enforced through loaded skills and trust regression. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| r1 Design Review-only wording | Shared creativity graph consumed by Design Review and Fidelity | Founder requires Fidelity too and one source avoids drift. |
| Duplicate full matrix law in both skills | Canonical GRAPH-3 schema plus phase-specific references | Two copies will diverge. |
| Allow Fidelity to invent a new reusable owner during a settled patch | Route unapproved ADD as `new-finding` | Fidelity cannot silently turn a parity correction into reusable-vocabulary design. |
| Move composite/block definitions into creativity | Keep layer canon; reference it from graph | Meaning of a layer and process for challenging ownership are different laws. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of r2 | User replies `approve shared-owner-challenge-review-r2`. |
| Trust-tree implementation and proof | `$starci-fe-upgrade-apply` after approval. |
