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
| App | shared-fe |
| Repo / branch | D:\Repositories\starci-academy-backend / mtp @ 26e3bfd3209fd451915c55dc4ec1cc1cd223169f |
| Purpose | Audit repeated refusals around `gap-2` versus `gap-4` for card grids and record the smallest future rule candidate without changing trust prematurely. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\shared-fe\compact-grouped-card-gap-classification.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\upgrade\shared-fe\compact-grouped-card-gap-classification.md |

Candidate revision: `shared-fe-compact-card-grid-gap-r1`

### AUDIT WINDOW

| Window | Records | REJECTED sections | Parsed rows | Non-empty rows |
|---|---:|---:|---:|---:|
| Toàn bộ Markdown dưới `Source/.workflows`, loại `.previews`, tại 2026-08-15 | 24 | 115 | 238 | 227 |

Witness được deduplicate theo workflow + phase. Hai rejected rows cùng feedback phase hiện tại chỉ tính là một witness.

### WATCHED

| Candidate | Current witnesses | Why not proposed yet | Promote when |
|---|---:|---|---|
| Phân loại compact grouped-card grid trước khi chọn `gap-2` hay `gap-4` | 1 — `fidel/starci-academy/course-detail-ownership-and-rail.md` / feedback: catalog grid và course signal grid bị giữ ở `gap-4`, user sửa thành `gap-2` | Upgrade Plan yêu cầu ít nhất hai refusal witnesses độc lập; các record còn lại không có refusal cùng failure pattern về card-grid rung | Một workflow/phase khác bị user bác vì compact grouped-card grid chọn `gap-4`, hoặc một grid độc lập bị ép `gap-2` sai relationship |

### RULE EVIDENCE

| Current source | Current statement | Ambiguity exposed by witness |
|---|---|---|
| `.claude/fe/canon/patterns/tokens.md` | `gap-2` áp dụng cho grouped cards | Không định nghĩa đủ để phân biệt compact functional cluster với independent decision cards. |
| `.claude/fe/canon/patterns/tokens.md` | `gap-4` áp dụng cho peer cards repeating across a grid | Cùng một grid có thể vừa được đọc là grouped cards vừa là repeating peer cards. |
| `.claude/fe/design/gap.md` GAP-9 | Peer cards repeating across responsive grid dùng group rung `gap-4` | Container direction được cảnh báo là không đủ, nhưng chưa có test cụ thể cho compact card clusters như signal board. |

### SMALLEST CANDIDATE RULE

Status: **WATCHED — not proposed**

> Chỉ dùng `gap-2` khi các card là những thành viên compact, đồng loại của một functional comparison hoặc signal cluster và được đọc như một đơn vị quyết định. Dùng `gap-4` khi mỗi card là một decision group độc lập có inner seams riêng. `contract.why` phải gọi tên classification, không được chọn rung chỉ vì container là grid.

### CANDIDATE HOME AND ENFORCEMENT

| Candidate home | Future change if promoted | Enforcement class |
|---|---|---|
| `.claude/fe/canon/patterns/tokens.md` | Tách ví dụ “grouped cards” thành compact functional cluster và independent decision-card grid. | Canon wording. |
| `.claude/fe/design/gap.md` | Thêm positive/negative pair cho signal/comparison grids; làm rõ participant test trước container form. | Design reasoning reference. |
| `.claude/sources` focused tests | Lock exact distinction tokens and examples if the rule is promoted. | Machine drift gate; không cố suy luận semantic từ JSX. |

### COVERED GROUPS — NO NEW RULE

| Pattern found in refusals | Current owner | Disposition |
|---|---|---|
| Heading-to-card, label-to-surface và section seams | GAP-8 owner/owned unit | Không gộp với card-to-card witness. |
| List rows không có gap và dùng row padding | GAP-11 / SurfaceListCard canon | Không liên quan responsive card grid. |
| Tabs, breadcrumbs, sticky nav và divider | Existing fidelity/navigation upgrades | Không biến navigation correction thành spacing law. |

### PROPOSED CHANGE TREE

| Group | Candidate paths for a later Review | Write class |
|---|---|---|
| Compact card-grid classification | `tokens.md`, `gap.md`, focused trust tests | WATCHED only; no trust write authorized now. |
| FE product source | None | Upgrade Plan never edits product source. |

### ACCEPTANCE EVIDENCE

| Proof | Required result if promoted |
|---|---|
| Witness threshold | At least two deduplicated workflow/phase refusals with the same classification failure. |
| Canon examples | One `gap-2` compact cluster and one `gap-4` independent decision-card grid differ by participant relationship, not by grid direction. |
| Skill behavior | Fidelity records exact owner and measured card-to-card seam before patching. |
| Trust tests | Focused tests fail if either classification or its counterexample disappears. |

### OUTPUTS

| Concept | Result |
|---|---|
| Refusal audit | One deduplicated witness found; threshold for a trust proposal is not met. |
| Rule conflict | `grouped cards` and `peer cards in grid` can overlap without a participant-level classification. |
| Candidate disposition | WATCHED; exact future wording/home/evidence are recorded, but `.claude` remains unchanged. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/shared-fe/compact-grouped-card-gap-classification.md` | added — records full refusal-window count, one witness, competing rules and promotion threshold. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | No trust mutation is proposed with only one deduplicated witness. |

### WARNINGS

| Warning | Impact |
|---|---|
| The current product correction is binding only for `catalog-card-grid` and `course-signal-board`. | Do not mechanically replace `gap-4` on unrelated card grids. |
| Current canon remains ambiguous for this edge case. | Until a second witness exists, owners must record relationship and measured seam explicitly. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Sửa canon ngay sau một feedback phase | Keep WATCHED and wait for a second independent witness | Upgrade threshold prevents one page preference from becoming global law. |
| Thay mọi card grid từ `gap-4` sang `gap-2` | Scope product patch to two user-identified compact clusters | Other grids may contain independent composed decision cards. |
| Viết lint đoán semantic grid từ class names | Lock wording/examples and require owner evidence if promoted | Static classes cannot prove the relationship among participants. |

### OWED

| Owed | Cleared by |
|---|---|
| Second independent witness | Another workflow/phase records the same card-grid classification refusal. |
| Upgrade Review | Only after promotion threshold is met or the user explicitly challenges witness classification. |

## plan revision 2

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
| App | shared-fe |
| Repo / branch | D:\Repositories\starci-academy-backend / mtp @ 26e3bfd3209fd451915c55dc4ec1cc1cd223169f |
| Purpose | Remove `group card` as a card type and make card radius invariant across every grouping context. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\shared-fe\compact-grouped-card-gap-classification.md |
| Language | vi |
| Phase | plan revision 2 |
| Touching | D:\Repositories\starci-academy-backend\.workflows\upgrade\shared-fe\compact-grouped-card-gap-classification.md |

Candidate revision: `shared-fe-card-grouping-without-card-variant-r2`

This revision supersedes `shared-fe-compact-card-grid-gap-r1`. The founder explicitly rejected the
classification that r1 was watching: grouping may classify a relationship and its seam, but it may
not create a second card geometry.

### AUDIT WINDOW

| Window | Records | Parsed REJECTED rows | Deduplication |
|---|---:|---:|---|
| Every Markdown workflow record under `Source/.workflows`, excluding `.previews`, at 2026-08-15 | 26 | 252 | workflow + phase; repeated restatements inside one phase count once |

### GROUP 1 — GROUPING IS NOT A CARD VARIANT

| Refusal witness | Rejected reading | Binding replacement |
|---|---|---|
| `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md` / feedback | Treat the green regions as generic section or peer-card seams and preserve the incumbent card-grid reading. | Identify the exact relationship owner and use the founder-confirmed seam; stale contract wording does not define component identity. |
| `.workflows/upgrade/shared-fe/compact-grouped-card-gap-classification.md` / plan revision 2 input | Keep `group card` as a distinct semantic card category, potentially with its own geometry. | “Bỏ khái niệm group card”; grouping describes layout only, and a grouped card has the same radius as an ordinary card. |

Status: **PROPOSED**. The prior WATCHED witness has now repeated as an explicit rejection of the
classification itself, so this revision promotes the smallest invariant and discards r1's proposed
`compact grouped-card` subtype.

### RULE EVIDENCE

| Current source | Current statement | Failure exposed |
|---|---|---|
| `.claude/fe/canon/patterns/tokens.md` | `gap-2` examples include “grouped cards”. | The phrase sounds like a card subtype and allows spacing vocabulary to leak into radius/geometry. |
| `.claude/fe/design/gap.md` GAP-7 | “cards in one horizontal card group” are compact peers. | The relationship is valid, but the noun creates an unnecessary `group card` identity. |
| `.claude/fe/canon/patterns/contract.md` CONTRACT-12 | A named surface branch owns ground, radius and elevation; two card kinds are forbidden. | This already implies one house card geometry, but the invariant is not stated at the grouping boundary. |
| `.claude/fe/canon/uxui/layers/branch.md` | Nested `SurfaceListCard` keeps ordinary `SurfaceListCard` radius. | The same invariant is explicit only for one branch variant, not every card in a layout group. |
| `.claude/sources/fe/contract.mjs` | `rounded-*` stays machine-legal because it can represent clipping/division as well as a card corner. | A broad class-name lint cannot safely decide whether a rounded node is a card or a joined container. |

### SMALLEST PROPOSED RULE

> Grouping is a container relationship, never a card variant. A component that is a card always uses
> the single ordinary card surface and radius, regardless of whether it appears alone, in a grid, in
> a compact cluster or inside another story surface. The relationship owner may change gap,
> separators, clipping or outer composition, but it may not lower or replace a child card's radius.

Consequences:

| Before | After |
|---|---|
| `group card`, `grouped-card`, `card group` used as a card identity | `card` remains the identity; `compact peer cluster`, `comparison row` or another relationship name describes only the container |
| Radius selected from layout context | Radius selected only by the ordinary named card surface owner |
| Smaller corners used to visually imply grouping | Gap, separator, clipping or an explicit joined-list container expresses grouping |
| A new grouped-card token/branch | Forbidden; reuse the ordinary card branch/token |

### PROPOSED HOME AND ENFORCEMENT

| Owner | Exact revision boundary | Enforcement |
|---|---|---|
| `.claude/fe/canon/patterns/tokens.md` | Remove `grouped cards` from the `gap-2` vocabulary; state that gap classification never changes a participant card's radius. | Canon wording plus focused source-text test. |
| `.claude/fe/design/gap.md` | Rewrite GAP-7 around compact functional peers/containers without naming a `card group`; add a counterexample that same-radius cards may still use different relationship gaps. | Design reasoning reference plus focused source-text test. |
| `.claude/fe/canon/uxui/layers/branch.md` | Generalize the existing nested-list sentence into one ordinary-card-radius invariant for all named card surfaces and contexts. | Canon wording plus focused source-text test. |
| `.claude/sources/fe/contract.test.mjs` or a focused trust test beside the owning source | Lock removal of `grouped card` terminology and presence of the radius invariant. | Machine drift gate; do not infer semantic card identity from arbitrary JSX/class names. |

No product source belongs to Upgrade Apply. Any existing FE card-like node that owns a reduced
`rounded-*` value must be inventoried and migrated through its owning product workflow after the
trust rule is approved; joined-list clipping remains legal because it is not a card radius.

### ACCEPTANCE EVIDENCE

| Proof | Required result |
|---|---|
| Vocabulary | Trust canon contains no `group card`, `grouped card`, `grouped-card` or `card group` as a card type. |
| Radius invariant | Canon says grouping cannot change a card's ordinary radius and names the surface branch as owner. |
| Relationship examples | Compact peer seams are still expressible without creating a card subtype. |
| Counterexample | Joined-list/container clipping remains distinct from card radius. |
| Trust gates | Focused tests and the frozen trust validation commands pass without semantic class-name guessing. |
| Product boundary | Upgrade Apply changes no file under `D:\Repositories\starci-academy-fe`. |

### OUTPUTS

| Concept | Result |
|---|---|
| Card identity | PROPOSED — one ordinary card geometry; no grouped-card subtype. |
| Grouping | PROPOSED — container relationship only; owns seam/composition, never child radius. |
| Gap rule | PROPOSED — preserve functional-peer classification while removing card-type terminology. |
| Enforcement | PROPOSED — focused trust text/invariant tests; no heuristic lint over arbitrary rounded classes. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/shared-fe/compact-grouped-card-gap-classification.md` | Appended plan revision 2; supersedes r1 and freezes the trust-only proposal boundary. |

### NEED APPROVALS

| Question | Required answer |
|---|---|
| Run `starci-fe-upgrade-review` on `shared-fe-card-grouping-without-card-variant-r2`? | Explicit approval of revision 2 before any `.claude` file changes. |

### WARNINGS

| Warning | Impact |
|---|---|
| Same radius does not mean same gap. | Gap still follows participant relationship; this revision removes a geometry subtype, not the spacing scale. |
| `rounded-*` may represent clipping rather than a card. | Enforcement must prove owner/identity and may not bulk-delete radius classes. |
| Existing FE source is outside this phase. | Trust approval does not silently authorize product migration. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Keep `group card` as a named card category | Treat grouping as a container relationship only | A layout relationship must not create a second surface geometry. |
| Give grouped cards a smaller radius | Use the ordinary card radius in every grouping context | Radius belongs to the card surface owner, not the surrounding gap or cluster. |
| Replace every group with a joined border box | Preserve independent cards; use joined-list clipping only when the items truly form one joined list | Same-radius cards can still be grouped by gap without changing identity. |
| Lint every `rounded-*` class as a card | Test the canon invariant and migrate only owner-proven cards | Rounded edges also clip and divide non-card containers. |

### OWED

| Owed | Cleared by |
|---|---|
| Upgrade Review | Explicit approval of revision 2, then `starci-fe-upgrade-review` challenges wording, homes and test boundary. |
| Trust mutation | Only an approved Upgrade Apply revision may edit `.claude`. |
| Existing product audit/migration | A later owning product workflow inventories card-like FE nodes after the trust rule is finalized. |
