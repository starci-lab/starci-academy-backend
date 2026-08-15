<!-- starci-workflow: v2 -->

# Generic icon-label-fact row consolidation

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
| Purpose | Khóa verdict hợp nhất dashboard/search row thành một generic owner mà không trộn interaction semantics. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\consolidation\starci-academy\generic-action-row.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; Plan không sửa production source. |

Scope: `QuickActionRow`, `QuickActionsList`, `SelectionList`, dashboard Quick Actions block và Global Search scope/result callers.

### IMPORT AND CALL-SITE EVIDENCE

| Owner | Production imports | Production JSX calls | Finding |
|---|---:|---:|---|
| `QuickActionRow` | 0 | 0 | Tên domain theo caller đầu tiên, tự mở `HeroLink`, không phải owner đang render dashboard. |
| `QuickActionsList` | 1 | 1 | Dashboard ListBox owner; tự vẽ icon + label row. |
| `SelectionList` | 2 | 2 | Search ListBox owner; tự vẽ icon + label + optional end metadata row. |

### GROUP VERDICT

| Group | Members | Domain/entity knowledge | Unification flags | Verdict | Reason |
|---|---|---|---|---|---|
| Icon–label–optional fact row | Dead `QuickActionRow`; inline rows trong `QuickActionsList` và scope branch của `SelectionList` | Không owner nào cần domain entity; đều nhận resolved icon/label/fact | Không cần boolean per caller; optional end fact là một closed shape difference | `merge` | Dùng owner hiện hữu làm điểm xuất phát rồi đổi thành composite tên theo shape; đây không phải extract owner mới cho một caller. |
| Dashboard list vs search list | `QuickActionsList`, `SelectionList` | Dashboard activation và search selection/activation khác nhau | Merge sẽ cần flags cho `selectionMode`, indicator, result description và keyboard semantics | `keep-apart` | Hai vendor interaction owners khác purpose; chỉ visual row được dùng chung. |

### PROPOSED OWNER

| Decision | Proposed result |
|---|---|
| Generic name | Rename/rehome `QuickActionRow` thành `IconLabelFactRow` dưới `components/composites`; tên sống được ở dashboard và search. |
| Contract | Thêm `icon-label-fact-row`: leading icon, normal-weight `sm` label, optional end `xs muted` text. Contract sở hữu gap/alignment; composite không viết class. |
| End component | Contract có optional named `end` component. Composite public data nhận closed `endText?: string`; không nhận arbitrary `ReactNode`/`endComponent`, vì như vậy composite biến thành branch và phá SLOTS-1/COMPOSITE-1. |
| Interaction | `QuickActionsList` và `SelectionList` tiếp tục sở hữu `ListBox.Item`, focus, selection, activation. Composite chỉ render content bên trong item. |
| Typography | Label dùng cùng normal `text-sm text-foreground`; end dùng `text-xs text-muted`; row hover/selected emphasis được một owner rule áp lên cả hai, không để caller viết lại font. |

### CANDIDATE PRODUCTION BOUNDARY

| Path | Planned action |
|---|---|
| `src/components/leaves/QuickActionRow/index.tsx` | REMOVE sau khi rehome; không giữ dead domain-named alias. |
| `src/components/composites/IconLabelFactRow/index.tsx` | ADD generic closed composite. |
| `src/components/composites/IconLabelFactRow/index.test.tsx` | ADD anatomy/optional-end proof. |
| `src/components/contracts/index.ts` | MODIFY thêm contract và đổi `quick-action-row` registry reference sang composite generic. |
| `src/components/leaves/QuickActionsList/index.tsx` | MODIFY dùng composite trong dashboard ListBox items. |
| `src/components/leaves/QuickActionsList/index.test.tsx` | ADD focused dashboard-list reuse proof. |
| `src/components/leaves/SelectionList/index.tsx` | MODIFY dùng composite cho scope rows; result-row anatomy giữ riêng. |
| `src/components/leaves/SelectionList/index.test.tsx` | MODIFY khóa shared composite, typography, end text và interaction parity. |
| `src/components/blocks/dashboard/QuickActions/component.test.tsx` | MODIFY khóa dashboard render parity. |
| `src/components/overlays/search/GlobalSearchOverlay/component.test.tsx` | MODIFY khóa search scope parity. |

### ACCEPTANCE EVIDENCE

| Proof | Acceptance |
|---|---|
| Import/call graph | Cả dashboard và search scope đều render `IconLabelFactRow`; không còn production import/call `QuickActionRow`. |
| DOM | Dashboard/search label cùng size/weight; search count là optional end text, không badge. |
| Interaction | Dashboard action vẫn activate; search scope vẫn select/activate; result selection/detail không đổi. |
| Gates | Focused tests + ESLint + typecheck trên candidate boundary pass; không suppression. |

### OUTPUTS

| Concept | Result |
|---|---|
| Consolidation brief | Đề xuất merge visual row vào `IconLabelFactRow`, đồng thời giữ hai ListBox interaction owners tách biệt. |
| Public API direction | Optional end là closed fact data rendered qua contract; không mở arbitrary component slot. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/consolidation/starci-academy/generic-action-row.md` | `added` — survey, verdict, exact candidate boundary và proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Review generic owner/API | Mặc định: `IconLabelFactRow` + closed `endText`; alternative: một branch có arbitrary `end` render slot nếu user thực sự cần nhiều end component types. |

### WARNINGS

| Warning | Impact |
|---|---|
| `endComponent` là arbitrary React component sẽ vi phạm composite/data fence hiện hành. | Nếu chọn API đó, owner phải là branch, không còn là composite như yêu cầu. |
| FE worktree đang có nhiều thay đổi song song. | Review phải freeze exact baseline/boundary trước Apply và bảo toàn diff ngoài scope. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Merge cả `QuickActionsList` và `SelectionList` | Chỉ merge visual row composite | Interaction/selection/result anatomy khác purpose và merge toàn list sẽ cần nhiều flags. |
| Giữ tên `QuickActionRow` cho search scope | Đổi tên theo shape `IconLabelFactRow` | Tên theo caller đầu tiên trở thành sai khi consumer thứ hai dùng cùng shape. |

### OWED

| Owed | Cleared by |
|---|---|
| Consolidation review | Chạy `starci-fe-consolidate-review` và approve một exact revision. |
| Production implementation | Sau Review approval, chạy `starci-fe-consolidate-apply`. |

### APPLY EVIDENCE DRAFT

Applied revision: generic-icon-label-fact-row-review-r1

Baseline commit: 16f172e

Tracked diff: 16f172e..worktree

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
| Purpose | Áp dụng generic icon-label-fact owner và chứng minh parity cho toàn bộ consumer đã khóa. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\consolidation\starci-academy\generic-action-row.md |
| Language | vi |
| Phase | apply |
| Touching | Exact boundary của `generic-icon-label-fact-row-review-r1` và workflow evidence này. |

### PROOF

| Gate | Result |
|---|---|
| Focused render tests | PASS — 9 files, 23 tests; peer, label-led, compact-action, pending, dashboard activation và search selection/detail đều xanh. |
| Focused ESLint | PASS — 0 errors; chỉ warning repo config chưa khai React version. |
| Rule tests | PASS — `npm run test:rules`; runner hiện discover 0 tests. |
| Import/call graph | PASS — không còn production import/call `StatRow` hoặc `QuickActionRow`; sáu existing calls, Quick Actions và Search scopes dùng `IconLabelFactRow`. |
| Live browser | BLOCKED — canonical origin `http://localhost:3000/vi/dashboard` chuyển sang authentication trước dashboard render. |
| Repository typecheck | BASELINE RED — contract registry cascade từ unsupported baseline classes làm `ChildrenOf<...>` thành `never`; không sửa hoặc suppress ngoài boundary. |

### OUTPUTS

| Concept | Result |
|---|---|
| Generic owner | `IconLabelFactRow` là một owner cho Chuỗi ngày học/AI credit/reward, profile/price, dashboard Quick Actions và Global Search scopes. |
| Interaction ownership | Dashboard và Search giữ hai ListBox host riêng; chỉ visual icon-label-optional-fact được dùng chung. |
| Closed API | `props.recipe` chọn `peer`, `label-led` hoặc `compact-action`; optional end dùng `endText`, không nhận arbitrary component. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/composites/StatRow/**` → `src/components/composites/IconLabelFactRow/**` | `renamed` + `modified` — generic data/recipe và ba recipe tests. |
| `src/components/leaves/QuickActionRow/index.tsx` | `deleted` — dead domain-named owner. |
| `src/components/contracts/index.ts` | `modified` — compact-action contract và generic composite identity. |
| `src/components/leaves/Text/**` | `modified` — closed parent emphasis token + test. |
| `src/components/leaves/QuickActionsList/**` | `modified` — reuse generic row + focused activation test. |
| `src/components/leaves/SelectionList/**` | `modified` — scope branch reuse; result branch giữ anatomy; tests cập nhật. |
| `src/components/blocks/dashboard/{StreakStatRow,CreditStatRow,RewardStatRow}/component.tsx` | `modified` — migrate `peer` recipe. |
| `src/components/blocks/dashboard/IdentityRail/index.tsx` | `modified` — generic composite registry identity. |
| `src/components/blocks/profile/overview/SkillSnapshot.tsx` | `modified` — migrate `label-led` recipe. |
| `src/components/blocks/courses/CoursePriceDetail/component.tsx` | `modified` — migrate `label-led` recipe. |
| `src/components/blocks/dashboard/QuickActions/component.test.tsx` | `modified` — assert shared compact contract. |
| `src/components/overlays/search/GlobalSearchOverlay/component.test.tsx` | `modified` — assert shared compact contract. |
| `.workflows/consolidation/starci-academy/generic-action-row.md` | `modified` — approval và Apply evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Revision đã được user chấp thuận bằng “tiếp tục”. |

### WARNINGS

| Warning | Impact |
|---|---|
| Auth middleware chặn dashboard/search live proof. | Visual runtime production chưa được capture; component render và interaction tests đã pass. |
| Full typecheck đỏ từ baseline contract registry cascade. | Không thể tuyên bố repository-wide typecheck xanh; focused boundary không được suppress. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Arbitrary `endComponent` | Closed `endText` rendered by contract fact | Giữ composite data fence và typography ownership. |

### OWED

| Owed | Cleared by |
|---|---|
| Authenticated production visual proof | Đăng nhập local tại canonical origin, mở dashboard + Global Search và capture peer/compact states. |
| Repository-wide typecheck | Repair approved baseline contract registry errors, rồi chạy `npm run typecheck`. |

## review

Revision: `generic-icon-label-fact-row-review-r1`

Approved revision: generic-icon-label-fact-row-review-r1

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
| Purpose | Review exact generic row owner, API migration và toàn bộ consumer parity boundary. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\consolidation\starci-academy\generic-action-row.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ consolidation workflow; không sửa FE source trước approval. |

### CHALLENGE VERDICTS

| Question | Evidence | Verdict |
|---|---|---|
| Có dùng chung cả ListBox không? | Dashboard activation-only; search scopes single-select; search results có description/indicator/detail selection. | `keep-apart` interaction hosts. |
| Generic composite owner nào đúng? | `StatRow` có 5 import files/6 production calls và đã dùng glyph–label–fact contracts; `QuickActionRow` có 0 call. | Rename/generalize `StatRow`; remove dead `QuickActionRow`. |
| `endComponent` có phải ReactNode slot? | COMPOSITE-1 và SLOTS-1 cấm caller đưa component/markup vào closed composite. | Contract có optional `fact` component; caller truyền closed `endText` data. |
| Typography có được caller chỉnh không? | Search tự thêm `font-medium` gây drift so với dashboard; SLOTS-6 cấm appearance slot. | Named recipe nằm trong generic owner/contract; caller không có class/weight prop. |
| Existing `hierarchy` API có đúng fence không? | `StatRowProps = CompositeProps<...> & { hierarchy?: ... }` mở slot thứ tư ngoài `props`. | Move named recipe vào discriminated `props`; không giữ top-level hierarchy. |

### FROZEN GENERIC API

```ts
type IconLabelFactRowData = {
    readonly icon: IconName
    readonly label: string
    readonly endText?: string
    readonly recipe: "peer" | "label-led" | "compact-action"
}

type IconLabelFactRowProps = CompositeProps<IconLabelFactRowData>
```

| Recipe | Label | End fact | Consumers |
|---|---|---|---|
| `peer` | `sm`, normal, foreground | `sm`, muted | Streak, AI credit, reward. |
| `label-led` | `md`, normal, foreground | `xs`, muted | Profile skill snapshot, course-price detail. |
| `compact-action` | `sm`, normal, foreground | `xs`, muted | Dashboard Quick Actions (end absent), Global Search scopes (count present). |

For `compact-action`, ListBox Item is the state host. One named contract rule owns hover/selected descendant emphasis; both label and end receive `text-accent-soft` under the requested row state. No caller supplies typography or color props.

### EXACT TRAVELLING GROUPS

| Group | Final verdict | Members/call sites |
|---|---|---|
| Visual glyph-label-fact shape | `merge` | Six current `StatRow` calls + one QuickActionsList row mapper + one SelectionList scope mapper. |
| Dashboard/search ListBox owners | `keep-apart` | `QuickActionsList`; `SelectionList` scope/result branches. |
| Dead domain-named owner | `remove` within merge | `QuickActionRow` definition, zero imports/calls. |

### EXACT APPLY BOUNDARY

| Path | Action |
|---|---|
| `src/components/composites/StatRow/index.tsx` | RENAME to `src/components/composites/IconLabelFactRow/index.tsx`; migrate data/recipe contract. |
| `src/components/composites/StatRow/index.test.tsx` | RENAME and expand three-recipe tests. |
| `src/components/leaves/QuickActionRow/index.tsx` | REMOVE dead owner. |
| `src/components/contracts/index.ts` | MODIFY contract/composite identities and compact-action row state selectors. |
| `src/components/leaves/Text/index.tsx` + test only if required by contract-owned inherited emphasis | MODIFY exact closed tone support; no caller appearance slot. |
| `src/components/leaves/QuickActionsList/index.tsx` + new focused test | MODIFY to render generic composite inside ListBox Item. |
| `src/components/leaves/SelectionList/index.tsx` + test | MODIFY scope branch only; result branch unchanged. |
| Five current direct `StatRow` import files and their focused tests | MODIFY import + `props.recipe/endText`; preserve rendered recipes. |
| `src/components/blocks/dashboard/QuickActions/component.test.tsx` | MODIFY/assert shared composite identity. |
| `src/components/overlays/search/GlobalSearchOverlay/component.test.tsx` | MODIFY/assert compact-action identity/count. |

### PARITY PROOF MATRIX

| State | Required proof |
|---|---|
| Streak/credit/reward settled + pending | Same icon, sm/sm hierarchy and loading fact. |
| Profile/price | Same md/xs hierarchy. |
| Dashboard Quick Actions | Same ListBox activation and normal sm label; no end fact. |
| Search scope idle/selected/hover | Same selection callbacks; count xs muted at rest; both texts accent under row emphasis; no badge/tick. |
| Search result selected/detail | No DOM/API behavior change because result branch does not use generic composite. |

### OUTPUTS

| Concept | Result |
|---|---|
| Review revision | `generic-icon-label-fact-row-review-r1` freezes one generic composite, three closed recipes and separate interaction hosts. |
| Contract policy | Alter existing contracts/owner; optional end is contract-owned fact, not arbitrary ReactNode. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/consolidation/starci-academy/generic-action-row.md` | `modified` — append exact review/API/boundary/parity matrix. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve consolidation revision | Default: approve `generic-icon-label-fact-row-review-r1`; alternative: revise exact name/recipe before any FE write. |

### WARNINGS

| Warning | Impact |
|---|---|
| Candidate Text change is conditional on contract implementation. | Apply may omit it if contract selectors achieve state emphasis without opening Text API; may not add another styling escape hatch. |
| Dirty FE worktree contains unrelated changes. | Apply must preserve them and report exact bounded diff. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `endComponent: ReactNode` on composite | Optional contract fact + `endText` data | Arbitrary content makes it a branch and violates the closed data fence. |
| Keep top-level `hierarchy` prop | `props.recipe` discriminant | CompositeProps permits only props/on/isLoading. |
| Use generic row for search results too | Scope branch only | Result rows own title/kind/indicator and different reading behavior. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit review approval | User says `approve generic-icon-label-fact-row-review-r1`. |
| Consolidation Apply | Run only after approval, then prove full parity matrix. |

## plan r2

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
| Purpose | Mở rộng survey sang dashboard standing facts và chọn đúng generic composite owner hiện hữu. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\consolidation\starci-academy\generic-action-row.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; Plan không sửa production source. |

User feedback: “thế còn cái chuỗi ngày học thì sao??? không tái sử dụng luôn à”.

### REVISED IMPORT AND CALL-SITE EVIDENCE

| Owner | Production imports | Production JSX calls | Consumers |
|---|---:|---:|---|
| `StatRow` | 5 direct import files | 6 calls | Streak, AI credit, reward, profile skill snapshot, course-price detail. |
| `QuickActionRow` | 0 | 0 | Dead candidate; không phải source of truth. |
| `QuickActionsList` inline row | 1 | 1 | Dashboard quick access. |
| `SelectionList` scope inline row | 2 list consumers | 1 scope branch | Global Search scopes; result branch có anatomy khác. |

### REVISED GROUP VERDICT

| Group | Members | Verdict | Reason |
|---|---|---|---|
| Icon + label + trailing fact | `StatRow`, dashboard quick-action row, search scope row | `merge` | `StatRow` đã là composite có 5 import files/6 calls và đúng contract glyph–title–fact; streak là witness thứ ba mà r1 bỏ sót. |
| Generic naming | `StatRow` → candidate generic owner | `merge` + rename | `StatRow` mô tả caller read-only đầu tiên; consumer action/selection làm tên đó không còn bao quát shape. |
| List interaction owners | `QuickActionsList`, `SelectionList` | `keep-apart` | Activation-only và selectable/result semantics vẫn khác; chỉ content composite dùng chung. |

### REVISED OWNER/API

| Decision | Revised result |
|---|---|
| Generic owner | Rename `StatRow` thành `IconLabelFactRow`; không tạo composite mới từ dead `QuickActionRow`. |
| Data | `icon`, `label`, optional `endText`; named hierarchy recipe giữ peer fact, label-led fact và compact action fact. |
| Contract | Reuse/evolve `glyph-peer-fact-row` và `glyph-title-fact-row`, hoặc Review hợp nhất thành một contract có named recipe; optional contract child `fact` là “end component” ở tree level. |
| Typography | Compact action recipe: label `text-sm text-foreground` normal; end `text-xs text-muted`; parent hover/selected state đổi cả hai về accent token bằng một owner rule. |
| Interaction | Composite không mở vendor primitive và không giữ selection. Dashboard/search ListBox Item là interaction host; streak/credit/reward render Tree read-only. |
| Dead owner | Remove `QuickActionRow`; không giữ alias khiến vocabulary có hai row owners. |

### REVISED CANDIDATE PRODUCTION BOUNDARY

| Path family | Planned action |
|---|---|
| `src/components/composites/StatRow/**` → `src/components/composites/IconLabelFactRow/**` | RENAME + MODIFY generic props/recipes/tests. |
| Five current `StatRow` importing production files | MODIFY imports/props with render parity. |
| `src/components/leaves/QuickActionRow/index.tsx` | REMOVE dead duplicate owner. |
| `src/components/leaves/QuickActionsList/**` | MODIFY dashboard rows to generic composite; add focused test if absent. |
| `src/components/leaves/SelectionList/**` | MODIFY scope rows to generic composite; result rows unchanged. |
| `src/components/contracts/index.ts` | MODIFY composite identity, contract children/recipe and registry admissions. |
| Dashboard/search focused block tests | MODIFY only where import/DOM identity changes. |

### OUTPUTS

| Concept | Result |
|---|---|
| Consolidation brief r2 | `StatRow` is the proven generic source; rename/generalize it and reuse it for standing facts, dashboard actions and search scopes. |
| Consumer coverage | Streak, credit, reward, profile, price, Quick Actions and Search scope are now all inside the review matrix. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/consolidation/starci-academy/generic-action-row.md` | `modified` — append r2 with StatRow evidence and revised boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Review exact generic name and recipe API | Default: `IconLabelFactRow` with closed `endText` and named hierarchy recipe; alternative name/API must remain domain-free and closed. |

### WARNINGS

| Warning | Impact |
|---|---|
| Rename touches five existing import files and six calls before adding dashboard/search. | Apply must prove every existing StatRow consumer, không chỉ modal. |
| Arbitrary `endComponent: ReactNode` vẫn trái composite/data fence. | Contract có optional end child nhưng caller chỉ truyền closed data; muốn arbitrary component phải đổi owner thành branch. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| R1 tạo `IconLabelFactRow` từ dead `QuickActionRow` | Rename/generalize proven `StatRow` | User chỉ ra “Chuỗi ngày học”; source xác nhận StatRow đã sở hữu đúng glyph–label–fact shape với nhiều consumers. |
| Bỏ streak/credit/reward khỏi consolidation matrix | Include toàn bộ current `StatRow` consumers | Generic owner chỉ đáng tin khi mọi consumer hiện hữu được chứng minh parity. |

### OWED

| Owed | Cleared by |
|---|---|
| Consolidation review r2 | Chạy `starci-fe-consolidate-review` trên revised matrix và approve exact revision. |
| Production implementation | Sau Review approval, chạy `starci-fe-consolidate-apply`. |

## apply

Applied revision: generic-icon-label-fact-row-review-r1

Baseline commit: 16f172e

Tracked diff: 16f172e..worktree

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
| Purpose | Áp dụng generic icon-label-fact owner và chứng minh parity cho toàn bộ consumer đã khóa. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\consolidation\starci-academy\generic-action-row.md |
| Language | vi |
| Phase | apply |
| Touching | Exact boundary của `generic-icon-label-fact-row-review-r1` và workflow evidence này. |

Proof: focused tests PASS 23/23; focused ESLint PASS; import graph không còn `StatRow`/`QuickActionRow`; browser production bị auth middleware chặn; full typecheck vẫn đỏ từ baseline contract-registry cascade.

### OUTPUTS

| Concept | Result |
|---|---|
| Generic owner | `IconLabelFactRow` phục vụ standing facts, profile/price, Quick Actions và Search scopes bằng ba closed recipes. |
| Interaction ownership | Dashboard và Search giữ ListBox semantics riêng; chỉ visual content được hợp nhất. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/composites/StatRow/**` → `src/components/composites/IconLabelFactRow/**` | `renamed` + `modified` — generic recipes/tests. |
| `src/components/leaves/QuickActionRow/index.tsx` | `deleted` — dead duplicate. |
| `src/components/contracts/index.ts`, `src/components/leaves/{Text,QuickActionsList,SelectionList}/**` | `modified` — generic contract, closed parent emphasis và consumers. |
| `src/components/blocks/{dashboard,profile,courses}/**` bounded callers/tests | `modified` — migrate all approved consumers. |
| `.workflows/consolidation/starci-academy/generic-action-row.md` | `modified` — approval và Apply evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Revision đã được user chấp thuận bằng “tiếp tục”. |

### WARNINGS

| Warning | Impact |
|---|---|
| Auth middleware chặn live dashboard/search proof. | Runtime production visual capture còn owed. |
| Full typecheck đỏ từ baseline contract registry. | Không tuyên bố repository-wide typecheck xanh và không suppress ngoài boundary. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Arbitrary `endComponent` | Closed `endText` fact | Giữ composite data fence. |

### OWED

| Owed | Cleared by |
|---|---|
| Authenticated production visual proof | Đăng nhập local rồi capture dashboard + Global Search. |
| Repository-wide typecheck | Repair approved baseline contract registry errors và chạy `npm run typecheck`. |
