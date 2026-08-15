<!-- starci-workflow: v2 -->

# Surface family nested context

## plan r1

Revision: `surface-family-nested-context-plan-r1`

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
| Repo / branch | FE D:\Repositories\starci-academy-fe on `main`; BE D:\Repositories\starci-academy-backend on `mtp` |
| Purpose | Đề xuất family-wide `isNested` và luật surface-in-surface dùng border/no-shadow thay vì elevation cạnh tranh. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\surface-in-surface-is-nested.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow proposal này; không sửa `.claude`, lint mirror hoặc production source trong Upgrade Plan. |

Window: toàn bộ workflow records của app `starci-academy` đến 2026-08-15.

### GROUP A — family-wide nested context

| Requirement | Evidence |
|---|---|
| Refusal 1 | `.workflows/fidel/starci-academy/global-search-modal-spacing-listbox-20260815-01.md`: “Hiểu mọi surface-in-surface là shadow/elevation cạnh tranh” bị thay bằng nested mode giữ border và bỏ shadow. |
| Refusal 2 | `.workflows/fidel/starci-academy/course-detail-content-typography.md`: “Contract-owned outer border/radius layered inside HeroUI Card” bị thay bằng branch-owned HeroUI Card là sole surface owner. |
| Refusal 3 | `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md`: “Ép page surface dùng nested outline” bị bác vì `isNested` chỉ đúng khi list thật sự nằm trong raised parent. |
| Rule lúc đó | `.claude/fe/design/surface-in-surface.md` SURFACE-2 và `.claude/fe/canon/uxui/layers/branch.md` chỉ trao nested border/no-shadow cho `SurfaceListCard`; `SurfaceCard` và `SurfaceFormCard` không có public field tương đương. |
| Rule cần có | Mọi named `Surface*Card` branch đang hoặc sẽ sở hữu vendor Card phải nhận `isNested?: boolean`; `true` chỉ đổi wrapper context thành một token border, không shadow, giữ radius/inset/contract ownership và không tự cấp quyền lồng surface. |
| Nơi thuộc về | Product meaning ở `fe/design/surface-in-surface.md`; branch API/ownership ở `fe/canon/uxui/layers/branch.md`; machine enforcement ở canonical FE lint source/tests. |

### GROUP B — bounded overlays and nested objects

| Requirement | Evidence |
|---|---|
| Refusal 1 | `.workflows/designs/starci-academy/global-search-modal-20260815.md`: “Nested `SurfaceCard` inside the modal” bị thay bằng direct Tree vì rule coi mọi inner card là competing owner. |
| Refusal 2 | `.workflows/fidel/starci-academy/global-search-modal-spacing-listbox-20260815-01.md`: direct SelectionList/Tree ở giữa bị thay bằng label-less `SurfaceListCard` với `isNested: true`; user yêu cầu result list vẫn có bounded border. |
| Rule lúc đó | SURFACE-4 và VENDOR-8 cấm tuyệt đối overlay trực tiếp import named surface branch; rule không biểu diễn trường hợp inner object thật sự cần membership/clipping nhưng bỏ elevation qua nested mode. |
| Rule cần có | Overlay không được tạo page-elevation surface; một inner object có boundary semantics thật được dùng named `Surface*Card` chỉ với literal `isNested: true`, một border và không shadow. Heading/meta/action đơn lẻ vẫn không đủ điều kiện. |
| Nơi thuộc về | SURFACE-4/Forbidden examples; VENDOR-8 implementation và regression tests vì literal nested mode có thể kiểm máy. |

### PROPOSED RULE TREE

| Path | Proposed change |
|---|---|
| `.claude/fe/design/surface-in-surface.md` | Sửa SURFACE-2/SURFACE-4 và matrix: nested context là family-wide wrapper mode; ghi cases allowed/refused cho page card, joined list, form, accordion và overlay. |
| `.claude/fe/canon/uxui/layers/branch.md` | Khóa public `isNested?: boolean`, `data-surface-context`, border/no-shadow semantics cho toàn bộ named `Surface*Card`; giữ riêng `isLabelHidden` cho list. |
| `.claude/fe/canon/patterns/vendor-boundary.md` | Ghi overlay chỉ được dùng family branch ở nested mode, không dùng page elevation. |
| `.claude/sources/fe/vendor-boundary.mjs` | Thay VENDOR-8 absolute import ban bằng JSX-aware rule: surface family trong overlay chỉ hợp lệ khi mọi mount có literal `isNested` true; alias/import cases fail closed. |
| `.claude/sources/fe/vendor-boundary.test.mjs` | Test SurfaceCard/List/Form/Accordion nested pass; missing/false/spread/unknown alias fail; ordinary overlay mechanics vẫn pass. |
| `.claude/sources/fe/contract.mjs` | Thêm family implementation gate: Card root phải xuất `data-surface-context` từ public `isNested`, không tự viết border/shadow class tại call site. |
| `.claude/sources/fe/contract.test.mjs` | Test ba implementation hiện hữu và future family member contract; thiếu prop/marker hoặc hard-coded nested paint phải fail. |

### PRODUCT FOLLOW-UP — OUTSIDE UPGRADE APPLY

| Target | Follow-up after trust approval |
|---|---|
| `SurfaceCard` | Add `isNested?: boolean`, set `data-surface-context`, tests and shared theme selector. |
| `SurfaceListCard` | Preserve current `isNested`; migrate to the common family selector without changing `isLabelHidden`. |
| `SurfaceFormCard` | Add `isNested?: boolean`, set `data-surface-context`, tests and call-site proof. |
| `SurfaceAccordionCard` | WATCHED: canon names it but current FE source has no implementation; require parity when/if the branch exists, do not invent dead product source now. |
| Global Search | Keep middle populated state on `SurfaceListCard` with `isNested: true` and hidden duplicate label; empty replaces the surface with `EmptyNotice`. |

### WATCHED

| Candidate | Status | Promotion condition |
|---|---|---|
| One universal `isLabelHidden` across the family | WATCHED | A second non-list surface needs duplicate-name suppression; currently only joined lists have that semantic. |
| Automatically infer nested context from DOM ancestry | REJECTED from proposal | Explicit owner must choose semantics; ancestry cannot tell whether the inner boundary is meaningful. |
| Create missing `SurfaceAccordionCard` now | WATCHED | A real approved call site and contract require it. |

### OUTPUTS

| Concept | Result |
|---|---|
| Family nested-context contract | Propose one explicit `isNested` API and one border/no-shadow paint semantic for every named `Surface*Card`. |
| Overlay exception | Propose replacing absolute ban with a machine-checked literal nested mode for genuine bounded inner objects. |
| Product routing | Trust Apply changes rules only; production family APIs follow in their owning FE correction after approval. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/surface-in-surface-is-nested.md` | `added` — refusal witnesses, current rule gap, exact trust tree and product follow-up boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Upgrade Review | Chạy `$starci-fe-upgrade-review` để challenge r1, đặc biệt overlay exception và machine-checkable family contract. |

### WARNINGS

| Warning | Impact |
|---|---|
| “Mọi Surface*Card có isNested” là API availability, không phải permission lồng card tùy ý. | Nếu Review không khóa semantic eligibility, call sites sẽ dùng border như decoration và tái tạo clutter. |
| `SurfaceAccordionCard` có trong canon/lint family nhưng không tồn tại ở FE source hiện tại. | Apply không được tạo dead component chỉ để hoàn thành danh sách. |
| Canonical lint source và FE mirror là hai owners khác nhau. | Upgrade Apply chỉ sửa `.claude/sources`; FE lint sync phải cập nhật mirror sau đó. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Giữ nested mode chỉ cho SurfaceListCard | Family-wide `isNested` | User yêu cầu tất cả `Surface*Card` có cùng field và semantics. |
| Cho mọi nested surface hợp lệ chỉ vì có `isNested` | Chỉ genuine bounded inner object; literal nested mode là điều kiện cần, không đủ | Border vẫn là grouping claim, không phải decoration. |
| Sửa production APIs ngay trong Upgrade Plan | Route product follow-up sau trust approval | Plan chỉ viết proposal và phải giữ Plan → Review → Apply. |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge exact wording, lint AST behavior and file boundary | `$starci-fe-upgrade-review` revision r1. |
| Trust-tree implementation | Explicit approval of one Upgrade Review revision, then `$starci-fe-upgrade-apply`. |
| Product API/CSS migration | Follow-up FE correction after trust Apply; tests for SurfaceCard/List/Form and call sites. |

## review r1

Candidate revision: `surface-family-nested-context-review-r1`

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
| Repo / branch | FE D:\Repositories\starci-academy-fe on `main`; BE D:\Repositories\starci-academy-backend on `mtp` |
| Purpose | Khóa exact nested-context law, API shape, selector, lint behavior và trust write boundary trước Apply. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\surface-in-surface-is-nested.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow upgrade này; Review không sửa `.claude`, lint mirror hoặc production source. |

### REVIEW VERDICT

| Proposal | Verdict | Reason |
|---|---|---|
| Family-wide nested API | REVISE AND TRAVEL | “Surface*Card” phải là closed named family, không phải wildcard bắt mọi domain card. |
| Overlay exception | REVISE AND TRAVEL | Nested mode được phép cho genuine inner object, nhưng literal `props={{ isNested: true }}` phải là machine-checkable tại direct overlay mount. |
| Automatic ancestry inference | REJECT | DOM ancestry không biết inner boundary có semantic membership hay chỉ là decoration. |
| Universal hidden label | KEEP WATCHED | Chỉ SurfaceListCard có exact-list duplicate-heading semantics. |
| Create SurfaceAccordionCard | KEEP WATCHED | Canon có tên, product source chưa có call site/implementation. |

### DEDUPLICATED WITNESSES

| Group | Workflow witness | Refusal |
|---|---|---|
| Family paint ownership | `fidel/starci-academy/course-detail-content-typography.md` | Contract/call site tự vẽ border/radius bên trong vendor Card bị bác; branch phải là sole surface owner. |
| Context-specific nested mode | `fidel/starci-academy/course-detail-ownership-and-rail.md` | `isNested` trên page-ground list bị bác; mode chỉ đúng khi có outer bounded story thật. |
| Overlay nested object | `designs/starci-academy/global-search-modal-20260815.md` | Nested elevation bị bác vì modal đã bounded. |
| Overlay border exception | `fidel/starci-academy/global-search-modal-spacing-listbox-20260815-01.md` | Direct unbounded middle list bị bác; user khóa nested SurfaceListCard border/no-shadow. |

### APPROVAL WORDING

| ID | Exact rule wording | Home |
|---|---|---|
| NESTED-1 | The named surface family is `SurfaceCard`, `SurfaceListCard`, `SurfaceFormCard`, and any future family member explicitly admitted by the surface-family lint allow-list. Every implemented member exposes optional data field `isNested`; this is not a wildcard over domain components whose names happen to match `Surface*Card`. | `fe/canon/uxui/layers/branch.md` |
| NESTED-2 | `isNested: true` changes wrapper paint only: emit `data-surface-context="nested"`, retain the member's radius/inset/content contract, replace elevation with exactly one `var(--border)` border, and set `box-shadow: none`. Default/page context emits `data-surface-context="page"`. Call sites and content contracts never author nested border/radius/shadow classes. | `fe/design/surface-in-surface.md`; `fe/canon/uxui/layers/branch.md` |
| NESTED-3 | Nested mode is allowed only when the inner object still needs an independent membership, clipping, submission, disclosure, or selection boundary. If parent and child claim the same group, flatten one surface. A lone action, metadata line, heading, or decorative unfinished region never qualifies. | `fe/design/surface-in-surface.md` |
| NESTED-4 | An overlay may directly mount a named surface family branch only for a genuine inner object and only when its JSX supplies literal `props={{ ..., isNested: true }}`. Missing, false, computed, identifier-only, or spread-only nested evidence fails closed. Otherwise use flat Tree/leaves or a block whose reviewed semantics own the nested surface. | `fe/design/surface-in-surface.md`; `fe/canon/patterns/vendor-boundary.md`; `sources/fe/vendor-boundary.mjs` |
| NESTED-5 | `isLabelHidden` remains SurfaceListCard-only and is legal only when an enclosing owner already renders the exact resolved list label. `isNested` never implies hidden naming. | `fe/canon/uxui/layers/branch.md` |

### PUBLIC API SHAPE

| Family member | Approved shape for product follow-up | Marker |
|---|---|---|
| `SurfaceCard` | Add `isNested?: boolean` to `SurfaceCardData`; callers pass it through `props`. | Card root `data-surface-context={props.isNested === true ? "nested" : "page"}`. |
| `SurfaceListCard` | Preserve existing `SurfaceListCardData.isNested`; no prop migration. | Keep marker, move paint to common selector. |
| `SurfaceFormCard` | Add optional `props?: SurfaceFormCardData` with `isNested?: boolean`; preserve existing contract/render calls. | Card root emits the common marker. |
| `SurfaceAccordionCard` | No product write until it exists; future implementation must satisfy the same family gate. | Required on creation. |

### MACHINE OBLIGATIONS

| Owner | Required proof |
|---|---|
| `sources/fe/vendor-boundary.mjs` | VENDOR-8 recognizes aliases and direct overlay mounts; literal nested data passes, missing/false/computed/spread-only data fails. It does not bless arbitrary transitive nested surfaces. |
| `sources/fe/vendor-boundary.test.mjs` | Valid fixtures for SurfaceCard/List/Form nested mounts; invalid fixtures for missing, false, identifier, spread and unknown family alias. |
| `sources/fe/contract.mjs` | Closed family implementation gate requires public nested data, page/nested marker and forbids branch-authored nested border/shadow utility paint. |
| `sources/fe/contract.test.mjs` | Current three implementations pass fixtures; missing field/marker and hard-coded paint fail. Absent SurfaceAccordionCard is not fabricated. |
| Canon prose tests | Exact rule IDs and links remain indexed; no duplicate nested law in unrelated skills. |

### TRUST WRITE BOUNDARY

| Action | Exact path |
|---|---|
| MODIFY | `.claude/fe/design/surface-in-surface.md` |
| MODIFY | `.claude/fe/canon/uxui/layers/branch.md` |
| MODIFY | `.claude/fe/canon/patterns/vendor-boundary.md` |
| MODIFY | `.claude/sources/fe/vendor-boundary.mjs` |
| MODIFY | `.claude/sources/fe/vendor-boundary.test.mjs` |
| MODIFY | `.claude/sources/fe/contract.mjs` |
| MODIFY | `.claude/sources/fe/contract.test.mjs` |
| MODIFY | `.workflows/upgrade/starci-academy/surface-in-surface-is-nested.md` |

No production FE path, `.claude` mirror in another repository, or missing `SurfaceAccordionCard` is inside Upgrade Apply.

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate revision | `surface-family-nested-context-review-r1` freezes five exact laws, family API location, selector semantics and machine proof. |
| Family meaning | `isNested` is available to every named family member but remains an explicit semantic choice, never ancestry inference. |
| Overlay meaning | Genuine bounded inner objects may use nested mode; page-elevation or decorative cards remain forbidden. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/surface-in-surface-is-nested.md` | `modified` — added Review r1 verdict, exact wording, public API shape, tests and trust boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve `surface-family-nested-context-review-r1`? | Approve exact r1 to allow Upgrade Apply on the eight trust/workflow paths; otherwise provide one wording/boundary correction. |

### WARNINGS

| Warning | Impact |
|---|---|
| Product APIs and CSS are intentionally outside Upgrade Apply. | After trust Apply, a linked FE correction must add SurfaceCard/Form parity and sync canonical lint into FE. |
| Existing root workflow validation contains unrelated historical failures. | Target record must be verified by absence from validator errors; Apply cannot rewrite history. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Wildcard every component named `Surface*Card` | Closed named family allow-list | Domain component names must not acquire vendor-surface API accidentally. |
| Blanket permission for card-inside-card | Eligibility rule plus explicit nested mode | A border still asserts grouping and cannot be decorative. |
| Top-level `isNested` on SurfaceFormCard only | Optional data `props.isNested` across family | One public field location keeps AST enforcement and caller vocabulary consistent. |
| Keep absolute overlay import ban | Literal nested-mode exception for genuine inner objects | Current Global Search correction proves a nested border can be the correct membership boundary. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of Review r1 | User says `approve surface-family-nested-context-review-r1`. |
| Trust implementation and tests | `$starci-fe-upgrade-apply` after approval. |
| Product/API/CSS migration | Linked FE correction after trust Apply. |
