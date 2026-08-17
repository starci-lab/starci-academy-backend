<!-- starci-workflow: v2 -->

# Upgrade Plan — business input thành layout/block JSON

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | C:/Repositories/ac/starci-academy-backend |
| Source | C:/Repositories/ac/starci-academy-backend |
| Project | starci-academy-fe — user-declared |
| Frontend | C:/Repositories/starci-academy-fe |
| Backend | C:/Repositories/ac/starci-academy-backend |
| Trust | C:/Repositories/ac/starci-academy-backend/.claude |
| Skills | C:/Repositories/ac/starci-academy-backend/.claude/skills |
| App | starci-academy-fe |
| Repo / branch | Source C:/Repositories/ac/starci-academy-backend (mtp); Trust C:/Repositories/ac/starci-academy-backend/.claude (main); Frontend C:/Repositories/starci-academy-fe (main) |
| Purpose | Viết lại Gate 1 `layouts` để biến business input thô thành 3–4 phương án JSON có đúng ba phần `business`, `main`, `extends`, trong đó mọi block đều có inventory, trạng thái sử dụng và render brief đủ cho gate kế tiếp. |
| Workflow root | C:/Repositories/ac/starci-academy-backend/.workflows |
| Workflow | C:/Repositories/ac/starci-academy-backend/.workflows/upgrade/starci-academy-fe/business-to-layout-json-gate.md |
| Language | vi |
| Phase | plan |
| Touching | Plan chỉ ghi workflow này. Candidate Apply chỉ được ghi `.claude/fe/gates/layouts/**`; không sửa/tạo skill, `syntax/layout.md`, Gate 2 hoặc frontend production source. |

### WINDOW

Plan đọc Gate 1 hiện tại, schema nối sang Gate 2, proof scorecard hiện có và founder corrections trong
task ngày 2026-08-17. Đây là direct founder mandate cho một gate contract mới; không suy diễn thành
thay đổi skill hoặc thay đổi product source.

### DIRECT REQUIREMENT

Input mẫu là một business request chưa tồn tại trong source, ví dụ `Tạo trang Shop Quà cho StarCi`.
Gate phải dùng `src/components/contracts/index.ts` của Frontend làm vocabulary bắt buộc, rồi dùng tư
duy sản phẩm để trả 3–4 phương án JSON. Mỗi phương án có đúng ba phần:

1. `business`: prompt nguyên văn, mục tiêu, user, flows, dữ liệu đã biết và phần chưa biết.
2. `main`: layout chính, contract/CSS/bố cục phân vùng và toàn bộ block.
3. `extends`: navbar, persistent layout, drawer, modal, overlay hoặc owner ngoài main.

Mỗi block trong `main` hoặc `extends` phải ghi rõ đã dùng hay chưa, component/contract đã có hay cần
tạo, dữ liệu, chính xác sẽ render gì, state coverage, placement và lý do. Khi source chưa có owner,
block phải là `new-required` và có brief đủ để gate sau không tự đoán business.

Mỗi lần chạy Gate 1 phải ghi decision artifacts dưới một root bền vững trong workflow:

```text
<Source>/.workflows/<project>/fe/<decision-id>/layouts/
```

Không dùng raw prompt làm tên thư mục. `decision-id` là slug ổn định cộng suffix chống collision;
prompt nguyên văn nằm trong `input.json`.

### CURRENT GAP

| Current Gate 1 | Gap so với founder contract |
|---|---|
| `LayoutPlan` trả `pageId`, `archetype`, `regions`, `sections`, `overlays`, `states`. | Không có ba phần `business/main/extends`; business meaning bị mất sau phân loại archetype. |
| `Section` chỉ có `id`, `region`, `order`, `renderForm`, `repeats`, `reason`. | Gate sau không biết block nào đã có, block nào mới, dữ liệu gì và sẽ render gì. |
| INDEX nói layouts không quyết định region chứa gì và không quyết định class. | Founder chốt Gate 1 phải trả block brief cùng CSS/bố cục phân bố để handoff không còn chỗ đoán. |
| Schema vẫn chứa `shell`, `RouteShell`, `ModalShell`, `DrawerShell`, `DropdownShell`. | Vocabulary đã stale sau no-shell refactor; gate có thể tái sinh kiến trúc vừa bị loại bỏ. |
| Root laws còn neo vào `RouteShell` và quan niệm layout không nhận `children`. | Neo không còn đúng với Frontend `main` hiện tại. |
| Proofs chỉ dựng lại Dashboard/Courses/Course Detail đã tồn tại. | Chưa chứng minh gate xử lý business net-new và phân biệt honest reuse với invented reuse. |
| `LayoutPlanSet` đã đòi 3–4 candidates. | Candidate vẫn dùng output cũ, chưa có full JSON business/block/extends cho từng phương án. |

### PROPOSED OUTPUT CONTRACT

Giữ `$defs/LayoutPlan` để `.claude/fe/gates/blocks/gate.schema.json` tiếp tục `$ref` đúng path mà
không sửa Gate 2. Viết lại nội dung `LayoutPlan` thành object ba phần:

```json
{
  "business": {},
  "main": {},
  "extends": []
}
```

`LayoutPlanSet` tiếp tục yêu cầu 3–4 candidates và một `recommended`. Mỗi candidate phải chứa một
`LayoutPlan` đầy đủ, không được đưa candidate rút gọn rồi bắt gate sau tự điền.

### RUNTIME DECISION ARTIFACTS

```text
.workflows/<project>/fe/<decision-id>/layouts/
├── manifest.json
├── input.json
├── source-context.json
├── candidates/
│   ├── 01.json
│   ├── 02.json
│   ├── 03.json
│   └── 04.json          optional
├── recommendation.json
└── decision.json        chỉ xuất hiện sau khi founder chọn
```

| Artifact | Contract |
|---|---|
| `manifest.json` | Schema version, project, decision id, candidate count, status `awaiting-decision/selected`, relative paths và SHA-256 của mọi JSON. |
| `input.json` | Input nguyên văn, input kind và timestamp; không paraphrase thay raw prompt. |
| `source-context.json` | Frontend HEAD, registry path/hash, inspected contract keys và existing component inventory dùng để phân loại reuse/new. |
| `candidates/NN.json` | Một full candidate có đúng `business/main/extends`; không phải delta so với candidate 01. |
| `recommendation.json` | Candidate gate khuyên, thesis và lý do so sánh với từng candidate còn lại. |
| `decision.json` | Founder choice, verbatim feedback, selected candidate path/hash và thời điểm chốt. Gate 2 chỉ được chạy khi file này tồn tại. |

Hierarchy `.workflows/<project>/fe/<decision-id>/layouts` phân vùng trực tiếp theo project, axis,
decision và gate, không thêm lớp `.artifacts`. Đây là decision evidence, không phải Git working copy
hoặc disposable scratch. Workflow phase record vẫn là Markdown canonical; decision folder chỉ giữ
machine JSON và phải được phase record link bằng relative path/hash.

#### `business`

| Field | Requirement |
|---|---|
| `rawPrompt` | Giữ nguyên input founder, không paraphrase thay thế. |
| `interpretedGoal` | Một outcome business kiểm chứng được. |
| `primaryUsers` | Các viewer/business actors thật; không bịa persona trang trí. |
| `coreFlows` | Các việc người dùng phải làm được, theo thứ tự ưu tiên. |
| `knownData` | Dữ liệu prompt/backend/source đã chứng minh. |
| `unknowns` | Điều chưa biết phải hỏi hoặc để owed; không tự lấp. |
| `sourceEvidence` | Frontend-relative contract registry path, contract keys/components đã inventory và source HEAD. |

#### `main`

| Field | Requirement |
|---|---|
| `component`, `status`, `usage` | `existing/new` và `used/not-used/conditional`; tên owner cụ thể. |
| `contract`, `contractDecision` | `reuse`, `extend`, `new-required` hoặc `not-applicable`; `reuse` chỉ hợp lệ khi child grammar cũng khớp. |
| `css` / `proposedCss` | Reuse chép đúng class array từ registry; new ghi proposed layout classes và đánh dấu chưa thành canon. |
| `distribution` | Regions, order, responsive axis, widths, optionality và owner của từng vùng. |
| `blocks` | Danh sách `BlockBrief` đầy đủ, không chỉ section id/render form. |
| `states` | Loading, empty, filtered-empty, failed, ready, guest/locked nếu business có; mỗi state nói node nào tồn tại. |
| `why` | Lý do business cho layout và thứ tự đọc. |

#### `BlockBrief`

| Field | Requirement |
|---|---|
| `id`, `component` | Stable id và PascalCase owner dự kiến/hiện có. |
| `status` | `existing`, `new` hoặc `modify`. |
| `usage` | `used`, `not-used`, `conditional` hoặc `used-repeatedly`. |
| `contract`, `contractDecision` | Existing key + `reuse/extend`, hoặc proposed key + `new-required`. |
| `businessPurpose` | Câu hỏi business block này trả lời. |
| `data` | Fields/collections/actions block cần; unknown phải ghi unknown. |
| `renderBrief` | Anatomy, order, disclosure và action sẽ nhìn thấy. |
| `states` | Mỗi cây pending/empty/error/ready và ai sở hữu recovery. |
| `placement` | Region, order, width/span và quan hệ với block bên cạnh. |
| `why` | Vì sao block tồn tại và nằm ở đó. |
| `brief` | Bắt buộc khi `status=new` hoặc `contractDecision=new-required`; đủ cho Gate 2 materialize mà không đoán. |
| `activationOrReason` | Bắt buộc khi `usage=not-used` hoặc `conditional`. |

#### `extends`

Dùng cùng inventory/status/contract/render/state discipline như block, cộng `owner`, `mountScope`,
`trigger`, `persistence` và `relationshipToMain`. Navbar, drawer, modal và overlay không được xuất hiện
chỉ bằng một string name.

### GATE BOUNDARY

Gate 1 chịu trách nhiệm business decomposition, layout, placement và block brief. Gate 2 vẫn chịu
trách nhiệm block anatomy chuẩn hóa sâu hơn: exact tier/file shape, pure/connected split, surface,
pending owner, copy ownership và public props/actions. Việc thêm `BlockBrief` ở Gate 1 không cho phép
Gate 2 bỏ validation; nó chỉ loại bỏ khoảng trống business trước khi Gate 2 bắt đầu.

Gate 2 không tự lấy `recommended`. Nó nhận candidate được `decision.json` chọn. Khi chưa có
`decision.json`, chain dừng ở Gate 1 với trạng thái `awaiting-decision`.

### FOUR GOLDEN CASES

Mỗi proof nhận một prompt net-new, inventory registry thật, rồi ghi 3 candidates hợp schema và đánh
dấu recommended. Mỗi candidate đều phải có đủ `business/main/extends`, không chỉ thesis.

| Proof | Business mới | Trục bắt gate chứng minh |
|---|---|---|
| `proofs/gift-shop.md` | Shop Quà dùng StarCi Credit | Mix reuse/new; catalog main, gift detail modal, gift cart drawer; không lạm dụng course/cart contracts. |
| `proofs/mentor-booking.md` | Đặt lịch mentor | List/detail/availability; booking modal; unknown timezone/cancellation phải hiện ra thay vì bị bịa. |
| `proofs/community-events.md` | Hub sự kiện cộng đồng | Filtered list, event detail, registration state; phân biệt empty với filtered-empty và overlay với route. |
| `proofs/team-learning-dashboard.md` | Dashboard quản trị đội học | Rail/main distribution, member progress blocks, invite modal; viewer role và permissions ảnh hưởng cây. |

`proofs/INDEX.md` thêm score rubric chung: đúng ba phần, 3–4 candidates, mọi block có status/usage,
mọi new owner có brief, mọi reuse khớp child grammar, CSS reuse khớp registry, extends có owner/trigger,
unknowns không bị bịa và recommended có lý do phân biệt được với các candidate còn lại.

### CANDIDATE APPLY BOUNDARY

| Path | Planned change |
|---|---|
| `.claude/fe/gates/layouts/INDEX.md` | Viết lại input/output contract, root law, routing instructions và no-shell/current-contract evidence. |
| `.claude/fe/gates/layouts/gate.schema.json` | Giữ `$id` + `$defs/LayoutPlan`; thay schema bằng `business/main/extends`, `BlockBrief`, `ContractDecision`, `Usage`, `SourceEvidence`; giữ candidate count 3–4. |
| `.claude/fe/gates/layouts/proofs/INDEX.md` | Thêm net-new rubric và bảng bốn golden cases; giữ historical shipped-screen scores làm regression evidence. |
| `.claude/fe/gates/layouts/proofs/gift-shop.md` | Add input + 3 candidate JSON outputs + score. |
| `.claude/fe/gates/layouts/proofs/mentor-booking.md` | Add input + 3 candidate JSON outputs + score. |
| `.claude/fe/gates/layouts/proofs/community-events.md` | Add input + 3 candidate JSON outputs + score. |
| `.claude/fe/gates/layouts/proofs/team-learning-dashboard.md` | Add input + 3 candidate JSON outputs + score. |
| `.claude/fe/gates/layouts/laws/l12-business-to-block-brief/{INDEX.md,vi.md,example.md,audit.md,changelog.md}` | Add proposed L12 owner inside layouts only; anchor to approved workflow revision and prove prefix has no collision. |

Explicitly out of boundary: `.claude/skills/**`, `.claude/syntax/layout.md`,
`.claude/fe/gates/blocks/**`, `.claude/sources/**` and `C:\Repositories\starci-academy-fe/**`.

Runtime artifacts under `.workflows/<project>/fe/<decision-id>/layouts/**` are outputs of future Gate 1 runs, không phải files
Apply tạo sẵn cho upgrade này. Bốn golden proofs vẫn nằm trong `fe/gates/layouts/proofs/**` vì chúng là
canon regression fixtures, không phải một founder decision đang chạy.

### ACCEPTANCE PROOF

| Gate | Pass condition |
|---|---|
| JSON syntax | `gate.schema.json` parses; every fenced JSON golden output parses. |
| Schema validation | Python `jsonschema` 4.26 validates every candidate set against Gate 1 output schema. |
| Candidate cardinality | Every golden case contains 3 or 4 full candidates and exactly one valid recommended index. |
| Artifact protocol | Một dry-run tạo đúng manifest/input/source-context/candidates/recommendation; chưa có choice thì không có `decision.json`. |
| Decision handoff | Sau simulated founder choice, `decision.json` hash khớp selected candidate và Gate 2 chỉ nhận candidate đó. |
| Three-part closure | Every candidate plan contains exactly `business`, `main`, `extends`; no missing or anonymous layout payload. |
| Block closure | Every block has `status`, `usage`, `contractDecision`, `businessPurpose`, `data`, `renderBrief`, `states`, `placement`, `why`; new owners also have `brief`. |
| Contract honesty | Every `reuse` key exists in Frontend registry and its child grammar fits; otherwise fixture says `extend` or `new-required`. |
| No shell vocabulary | Schema, INDEX, new L12 records and new proofs contain no active `shell` tier or `*Shell` owner. Historical proof quotations may remain explicitly marked historical. |
| Gate 2 link | Gate 2's existing `$ref` to `#/$defs/LayoutPlan` resolves after rewrite; no Gate 2 file changes. |
| Trust health | `node scripts/gate-health.mjs`, `npm test`, link/parity checks and docs discovery pass from Trust root. |
| Workflow | `node .claude/scripts/validate-workflows.mjs --root .workflows` passes. |
| Dirty-tree containment | Trust diff under this task contains only approved `.claude/fe/gates/layouts/**`; unrelated current Trust edits remain untouched. |

### OUTPUTS

| Concept | Result |
|---|---|
| Business-to-layout JSON contract | Đề xuất Gate 1 biến prompt net-new thành 3–4 phương án, mỗi phương án có `business/main/extends` và block brief đầy đủ. |
| Honest contract inventory | Mọi owner được phân loại `reuse`, `extend` hoặc `new-required`; không ép business mới vào contract cũ chỉ vì tên gần giống. |
| Gate handoff | Gate 2 nhận đủ business intent và render brief nhưng vẫn giữ trách nhiệm anatomy/file/pending/props chi tiết. |
| Decision artifact root | Runtime JSON nằm tại `.workflows/<project>/fe/<decision-id>/layouts/`; workflow Markdown giữ path/hash và Gate 2 chỉ chạy sau `decision.json`. |
| Golden proof set | Bốn business chưa tồn tại trong source chứng minh catalog, booking, events và team dashboard cùng overlay/role/unknown handling. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy-fe/business-to-layout-json-gate.md` | `added` — Plan, exact candidate boundary, four golden cases và acceptance proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Founder đã chốt ba phần, block detail, 3–4 JSON cases và scope chỉ `fe/gates/layouts`; Review sẽ challenge schema trước Apply. |

### WARNINGS

| Warning | Impact |
|---|---|
| Gate 1 hiện tuyên bố class thuộc Principles, còn founder yêu cầu main ghi CSS. | Review phải đóng rõ: Gate 1 ghi exact registry classes hoặc proposed classes; Principles vẫn validate/refine, không được âm thầm xóa CSS khỏi handoff. |
| Gate 2 hiện mô tả input theo `sections` cũ dù `$ref` trỏ động vào `LayoutPlan`. | Schema link vẫn resolve mà không sửa Gate 2, nhưng prose Gate 2 sẽ tạm stale; ngoài boundary nên phải ghi debt, không sửa lén. |
| `.workflows/<project>/fe/**` có thể lớn nếu mọi candidate giữ vô hạn. | Manifest phải có lifecycle; Review chốt retention nhưng không được xóa artifact còn được workflow active/approved tham chiếu. |
| Trust đang có nhiều unrelated edits, gồm `.claude/syntax/layout.md`. | Apply phải path-limit diff; không format/reset/commit chung các thay đổi đó. |
| Existing Gate 1 anchors còn trỏ drive/path và `RouteShell` cũ. | INDEX rewrite phải đo lại Frontend main hiện tại; không copy stale anchors sang L12. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Dùng dashboard đang có làm ví dụ chính | Dùng business chưa có trong source như Gift Shop | Founder sửa rõ prompt phải là “một thứ chưa có trong source”. |
| Gate 1 chỉ trả regions rồi để Gate 2 tự nghĩ blocks | Gate 1 trả block inventory + detailed render brief | Founder yêu cầu dữ liệu thô phải được chuyển thành block và gate sau không được tự đoán. |
| Block chỉ ghi tên component | Ghi status, usage, contract decision, data, render, states, placement, why và brief khi mới | Founder yêu cầu mỗi block giải thích và nói rõ đã dùng hay chưa. |
| Sửa hoặc tạo skill để đạt output | Chỉ viết lại `.claude/fe/gates/layouts/**` | Founder chốt “không tạo skills, chỉ là viết lại gate/layouts thôi”. |
| Một JSON duy nhất | 3–4 full JSON candidates/cases có recommended | Founder yêu cầu render 3–4 JSON để so/chọn. |
| `.worktrees/<project>/fe/<raw-prompt>/layouts` | `.workflows/<project>/fe/<decision-id>/layouts` | Đây là decision evidence, không phải Git worktree; raw prompt không an toàn làm path và dễ collision. |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge schema, L12 ownership và Gate 1/Gate 2 boundary | Chạy `starci-fe-upgrade-review`, freeze revision và exact paths. |
| Gate/layout implementation | Approved Apply chỉ trong `.claude/fe/gates/layouts/**`. |
| Four executable golden outputs | Apply viết bốn proof records và chạy `jsonschema` validation. |
| Artifact retention rule | Upgrade Review chốt thời điểm archive/delete candidate artifacts; active hoặc selected artifacts không được dọn. |

## review

Approved revision: `business-layout-json-r1`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | C:/Repositories/ac/starci-academy-backend |
| Source | C:/Repositories/ac/starci-academy-backend |
| Project | starci-academy-fe — user-declared |
| Frontend | C:/Repositories/starci-academy-fe |
| Backend | C:/Repositories/ac/starci-academy-backend |
| Trust | C:/Repositories/ac/starci-academy-backend/.claude |
| Skills | C:/Repositories/ac/starci-academy-backend/.claude/skills |
| App | starci-academy-fe |
| Repo / branch | Source C:/Repositories/ac/starci-academy-backend (mtp); Trust C:/Repositories/ac/starci-academy-backend/.claude (main); Frontend C:/Repositories/starci-academy-fe (main) |
| Purpose | Challenge và khóa schema, artifact protocol, block-depth boundary và exact write boundary trước khi viết Gate 1. |
| Workflow root | C:/Repositories/ac/starci-academy-backend/.workflows |
| Workflow | C:/Repositories/ac/starci-academy-backend/.workflows/upgrade/starci-academy-fe/business-to-layout-json-gate.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; Review không ghi Trust. |

### REVIEW VERDICT

| Concern | Frozen result |
|---|---|
| Output identity | Mỗi candidate là full `LayoutPlan` có đúng `business`, `main`, `extends`; set có 3–4 candidates và một recommendation. |
| Gate 1/Gate 2 seam | Gate 1 owns business decomposition, placement, status/usage, contract decision và render/state brief. Gate 2 vẫn owns exact anatomy, files/tiers, pure-connected split, pending/copy/props. |
| Contract authority | Reuse chỉ khi key và child grammar trong Frontend registry cùng khớp. Tên gần giống không đủ. |
| CSS authority | Existing reuse chép exact registry classes. New/extend chỉ ghi `proposedCss` và `cssStatus=proposed`, không giả đã thành canon. |
| Selection | Gate 1 ghi recommendation nhưng Gate 2 không chạy cho tới khi founder choice được ghi trong `decision.json`. |
| Artifact root | `.workflows/<project>/fe/<decision-id>/layouts/`; raw prompt ở `input.json`, không nằm trong path. |
| Runtime files | `manifest.json`, `input.json`, `source-context.json`, `candidates/01..04.json`, `recommendation.json`, optional `decision.json`. |
| Examples | Bốn net-new proofs: gift shop, mentor booking, community events, team learning dashboard. Mỗi proof có 3 full candidate JSONs. |
| No-shell cleanup | Xóa active shell vocabulary và stale RouteShell laws/anchors khỏi Gate 1; historical quotes chỉ được giữ khi dán nhãn historical. |
| Change home | Chỉ `.claude/fe/gates/layouts/**`; không skill, syntax, blocks, sources hay Frontend production source. |

### APPROVED WORDING AND TEST OBLIGATION

| Rule | Approved wording | Home | Proof obligation |
|---|---|---|---|
| L12 | Business input is not reduced to anonymous sections: every candidate preserves business intent, names main and extends, and inventories every block as used/not-used/conditional plus reuse/extend/new-required with a render/state brief. | `fe/gates/layouts/laws/l12-business-to-block-brief/**` | Four net-new cases validate against schema; removing status, usage, brief or one top-level part fails. |
| Decision artifacts | One decision run writes deterministic JSON under `.workflows/<project>/fe/<decision-id>/layouts`; Gate 2 consumes only the hash-selected candidate after `decision.json` exists. | `fe/gates/layouts/INDEX.md`, `gate.schema.json` | Artifact tree and hashes documented; proof fixtures contain candidate/recommendation/decision examples. |
| Contract honesty | Existing keys/classes come from current Frontend registry; proposed owners/classes remain explicitly proposed. | `INDEX.md`, schema, L12 | Each proof inventory demonstrates at least one honest reuse and one new/extend decision. |

### APPLY BOUNDARY

| Path | Action |
|---|---|
| `.claude/fe/gates/layouts/INDEX.md` | MODIFY |
| `.claude/fe/gates/layouts/gate.schema.json` | MODIFY |
| `.claude/fe/gates/layouts/proofs/INDEX.md` | MODIFY |
| `.claude/fe/gates/layouts/proofs/{gift-shop,mentor-booking,community-events,team-learning-dashboard}.md` | ADD |
| `.claude/fe/gates/layouts/laws/l12-business-to-block-brief/{INDEX.md,vi.md,example.md,audit.md,changelog.md}` | ADD |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved Gate 1 revision | `business-layout-json-r1` freezes the three-part candidate, block brief depth, artifact protocol and no-shell boundary. |
| Gate separation | Gate 1 carries business truth far enough to prevent guessing; Gate 2 remains the detailed block materializer. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy-fe/business-to-layout-json-gate.md` | modified — Review verdict, approved wording, test obligations and exact Apply boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Founder explicitly ordered Apply and previously froze scope to `gates/layouts`. |

### WARNINGS

| Warning | Impact |
|---|---|
| Gate 2 prose still describes old `sections`. | `$ref` remains valid through `$defs/LayoutPlan`, but Gate 2 documentation debt stays outside this boundary. |
| Whole-workflow validator has unrelated historical failures. | Apply reports task-local findings and does not repair the repository-wide backlog. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Gate 1 fully specifies block file/tier/pending APIs | Gate 1 stops at business/render/state brief; Gate 2 deepens it | Otherwise Gate 2 becomes a redundant gate and two shelves own one answer. |
| Proposed CSS presented as registry truth | Mark proposed CSS explicitly until contract materialization | Net-new business has no source contract to quote yet. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply `business-layout-json-r1` | Write only approved Gate 1 files and run schema/proof/health checks. |
| Gate 2 prose debt | Ghi follow-up riêng nếu founder cho mở boundary; task này không sửa Gate 2. |

## apply

Applied revision: `business-layout-json-r1`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | C:/Repositories/ac/starci-academy-backend |
| Source | C:/Repositories/ac/starci-academy-backend |
| Project | starci-academy-fe — user-declared |
| Frontend | C:/Repositories/starci-academy-fe |
| Backend | C:/Repositories/ac/starci-academy-backend |
| Trust | C:/Repositories/ac/starci-academy-backend/.claude |
| Skills | C:/Repositories/ac/starci-academy-backend/.claude/skills |
| App | starci-academy-fe |
| Repo / branch | Source mtp; Trust main; Frontend main |
| Trust baseline | f38cb415e3a1440054cc84e3dce9ce35afdad17d |
| Workflow root | C:/Repositories/ac/starci-academy-backend/.workflows |
| Workflow | C:/Repositories/ac/starci-academy-backend/.workflows/upgrade/starci-academy-fe/business-to-layout-json-gate.md |
| Language | vi |
| Phase | apply |
| Touching | Chỉ `.claude/fe/gates/layouts/**` và workflow record này. |

### OUTPUTS

| Output | Applied result |
|---|---|
| Gate 1 identity | Raw business input becomes 3–4 complete layout candidates; each plan has exactly `business`, `main`, `extends`. |
| Block depth | Every block carries status, usage, contract decision, purpose, data, render brief, state briefs, placement, CSS status, evidence and new/modify brief. |
| Contract honesty | Reuse requires registry key and exact registry CSS; extend/new requires proposed CSS and cannot claim canon. |
| Selection | Recommendation is advice; Gate 2 waits for founder `decision.json`, and both bind candidate bytes by SHA-256. |
| Runtime home | `.workflows/<project>/fe/<decision-id>/layouts/` with manifest, input, source context, candidates, recommendation and optional decision. |
| Orchestration | `starci-fe-design-plan` orchestrates layout selection, per-block proposal sets, then execution through principles, patterns and lints. |
| Gate 2 cardinality | One block yields 3–4 proposals; page input with N blocks yields N independent sets, or 3–4 × N block candidates. |
| Golden proofs | Gift shop, mentor booking, community events and team learning dashboard; 3 complete candidates each. |

### CHANGES

| Path | Change |
|---|---|
| `.claude/fe/gates/layouts/INDEX.md` | Replaced old screen-frame contract with business-to-layout journey, runtime records, decision boundary and orchestration contract. |
| `.claude/fe/gates/layouts/gate.schema.json` | Replaced LayoutPlan with the exact three-part shape; added detailed block/extend, runtime manifest, recommendation and decision schemas. |
| `.claude/fe/gates/layouts/laws/l12-business-to-block-brief/**` | Added the complete five-record L12 module. |
| `.claude/fe/gates/layouts/proofs/INDEX.md` | Added current golden-case routing and runtime handoff examples without generation labels. |
| `.claude/fe/gates/layouts/proofs/{gift-shop,mentor-booking,community-events,team-learning-dashboard}.md` | Added 12 full JSON candidates across four net-new business cases. |

### PROOF

| Check | Result |
|---|---|
| Draft 2020-12 schema self-check | PASS |
| Four proof JSON documents parse | PASS |
| `LayoutPlanSet` validation | PASS — 4 cases, 12 candidates, 0 errors |
| Exact candidate plan keys | PASS — every candidate is exactly `business`, `main`, `extends` |
| `node scripts/gate-health.mjs` | Layouts: 0 broken link, 0 row error, 0 record error, 0 dead repo, 0 conflict, 0 guess |
| `git diff --check -- fe/gates/layouts` | PASS; only Git line-ending notices |
| Active `shell`, `RouteShell`, generation and legacy wording in changed Gate 1 records | PASS — no matches |
| `npm test` | 197 pass, 6 fail outside this change boundary: BE duplicate rule aggregation, pre-existing dead links/canon parity, one BE workflow-contract gap, missing FE creativity canon. |

### WARNINGS

| Warning | Impact |
|---|---|
| `starci-fe-design-layout`, `starci-fe-design-block`, and `starci-fe-design-execute` do not exist as skill folders yet. | Gate 1 documents their frozen responsibilities; this Apply intentionally does not create or modify skills. |
| Gate 2 schema/prose still models the earlier page-wide handoff. | The required per-block candidate matrix is documented at the Gate 1 boundary, but Gate 2 materialization remains a separate approved change. |
| Whole Trust test suite has six unrelated failures. | Task-local schema/proof/gate checks pass; no unrelated canon or BE files were changed. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Put generation labels in current proof headings | Use stable names such as `Net-new golden cases` | Founder said the older shelves will be removed; generation wording must not become new canon. |
| Treat design-plan as another rendering gate | Treat it as the journey orchestrator | Founder defined layout, block and execute as the specialized stages. |
| Return only 3–4 page-wide block combinations at Gate 2 | Return 3–4 proposals independently for every block | Page input must preserve `3–4 × number of blocks`, not couple unrelated choices. |
| Create or rewrite skills during this Apply | Record the orchestration contract only in layouts | The approved write boundary remains `.claude/fe/gates/layouts/**`. |

### OWED

| Owed | Cleared by |
|---|---|
| Materialize the three specialized design skills and update `starci-fe-design-plan` orchestration | A separate Plan → Review → Apply change with skill paths in scope. |
| Rewrite Gate 2 as per-block candidate sets and add Cartesian proof | A separate Gate 2 change under `.claude/fe/gates/blocks/**`. |
| Remove superseded shelves and historical proof records | Separate repository cleanup after replacements have live consumers. |
