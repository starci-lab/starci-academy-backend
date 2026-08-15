<!-- starci-workflow: v2 -->

# fidelity-closure-canon-audit

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
| Repo / branch | D:\Repositories\starci-academy-backend / mtp @ 7acd312a858be7ed58dc847c25ec86d801be17f8 |
| Purpose | Audit 11 finalized fidelity sessions và đề xuất tối thiểu các canon gaps thật sự gây feedback lặp. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\fidelity-closure-canon-audit.md |
| Language | vi |
| Phase | plan |
| Touching | Workflow record này בלבד; Plan không sửa canon, skill hoặc lint. |

Window: 11 StarCi fidelity sessions finalized ngày 2026-08-15.

### EVIDENCE GROUPS

| Group | Repeated refusal | Existing rule gap | Proposed home | Verdict |
|---|---|---|---|---|
| Body/title typography | Dashboard cards, identity stats, Course Detail facts và accordion liên tục bị trả lại vì lẫn text-base/text-sm và weight | Typography canon định nghĩa scale nhưng chưa có bảng chọn rank theo vai trò nội dung | `.claude/fe/canon/patterns/typography.md` | CHANGE |
| ChoiceTabs hierarchy | Contribution years từng bị render full-width underline như ShellNav; semantic “secondary” từng bị dịch sai thành vendor secondary | Composite canon có ví dụ feed tabs nhưng chưa có bảng tổng quát local parameter versus region navigation | `.claude/fe/canon/uxui/layers/composite.md` | CHANGE |
| Surface/card ownership | Group card radius, shadow, divider, joined review list và one-card-six-cells bị nhắc nhiều lần | `tokens.md`, `contract.md` và vendor boundary đã nói Card owns paint, joined list padding/dividers và ordinary radius | Existing canon | NO CHANGE — enforcement/compliance issue |
| Spacing | Nhiều cụm peer phải gap-2 | `tokens.md` đã định nghĩa gap-2 cho compact horizontal peers và grouped cards | Existing canon | NO CHANGE |
| Localhost/runtime | OAuth/CORS hỏng khi dùng 127.0.0.1 và port offset sai | Fidelity Start đã cấm coi localhost và 127.0.0.1 là tương đương | Existing skill | NO CHANGE |
| Fidelity chronology | Feedback phải sửa ngay; End không đóng; Finality mới đóng | `skill-shape.md` và ba fidelity skills đã quy định start → feedback → end → finality | Existing skill shape | NO CHANGE |

### PROPOSED TYPOGRAPHY TABLE

| Content role | Component | Size | Weight | Conditions |
|---|---|---|---|---|
| Page/section title | Heading | level-owned | level-owned | Có outline rank; không dùng body Text để giả heading |
| Dominant title của một object/card lớn | Text | text-base | medium | Ngắn, đại diện object chính, card thực sự có prominence; hover không phải điều kiện |
| Compact, repeated hoặc long title | Text | text-sm | medium | DailyStats, rows, accordion, dense list, title dài hoặc lặp nhiều lần |
| Body, description, metadata, ordinary value | Text | text-sm | normal | Nội dung đọc liên tục; không tự tăng rank vì là số |
| Compact peer label cần phân biệt với value | Text | text-sm | medium | Weight tạo phân cấp; peer value vẫn text-sm normal/muted |
| Supporting caption | Text | text-xs | normal + muted | Chỉ giải thích line/surface chính; không dùng làm primary fact |

Proposed rule: `TYPE-9 · Body title rank follows content ownership, not hover, numeric value or available space.`

### PROPOSED CHOICE TABS TABLE

| Situation | Variant | Geometry | Example |
|---|---|---|---|
| Local parameter/choice bên trong một bounded owner | primary | Intrinsic segmented/pill; nằm trong owner row | Contribution year 2026/2025/2024 |
| Route hoặc major region navigation sở hữu một line độc lập | secondary | Full navigation run/underline; có sticky behavior khi shell yêu cầu | ShellNav Course sections |
| Product meaning gọi một axis là “secondary” nhưng control vẫn là peer local choice | primary | Giữ vendor primary | Feed category tabs |

Proposed rule: `COMPOSITE-7 · ChoiceTabs variant follows navigation ownership scope, not data volume, option count or the word secondary in product prose.`

Machine-check verdict: WATCHED, không thêm lint. Dominance, object ownership và navigation scope cần component evidence; class-only lint sẽ tạo false positive.

### OUTPUTS

| Concept | Result |
|---|---|
| Minimal upgrade | Chỉ hai canon deltas: typography rank table và ChoiceTabs ownership table. |
| Existing-law audit | Surface, spacing, localhost và Fidelity lifecycle đã đủ luật; không nhân bản wording. |
| Test obligation | Canon source tests phải tiếp tục pass; không thêm semantic lint suy đoán. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/fidelity-closure-canon-audit.md` | Added evidence groups, exact proposed wording/home và no-change verdicts. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Review approval | Phê duyệt hoặc sửa exact TYPE-9 table và COMPOSITE-7 table trước khi Apply chạm canon. |

### WARNINGS

| Warning | Impact |
|---|---|
| Whole trust/workflow validator còn legacy errors | Apply chỉ được claim focused canon gates; không tuyên bố toàn trust tree sạch. |
| FE worktree có concurrent changes | Upgrade không sửa FE production source. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Thêm luật mới cho surface/gap/localhost/Fidelity lifecycle | Giữ luật hiện có và ghi compliance verdict | Canon đã đủ rõ; lặp wording không ngăn implementation bỏ qua luật. |
| Lint suy đoán dominant card hoặc local parameter | Canon table + examples | Máy không có product ownership context để phân loại trung thực. |
| Hover quyết định text-base | Semantic dominance quyết định rank | Interaction cue và typography rank là hai trục độc lập. |

### OWED

| Owed | Cleared by |
|---|---|
| Review exact wording, homes và test boundary | `starci-fe-upgrade-review`. |

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
| Repo / branch | D:\Repositories\starci-academy-backend / mtp @ 7acd312a858be7ed58dc847c25ec86d801be17f8 |
| Purpose | Review hai canon deltas rút ra từ 11 fidelity sessions đã finalized. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\fidelity-closure-canon-audit.md |
| Language | vi |
| Phase | review |
| Touching | Workflow record này בלבד; Review không sửa canon, skill, lint hoặc production source. |

Approved revision: `fidelity-closure-canon-audit-r1`.

### OUTPUTS

| Concept | Result |
|---|---|
| Typography | Thêm đúng bảng role → component → size → weight → conditions và `TYPE-9`; semantic ownership quyết định rank. |
| ChoiceTabs | Thêm đúng bảng local choice versus major-region navigation và rule ownership scope. |
| Rule identity | Đổi số đề xuất từ `COMPOSITE-7` thành `COMPOSITE-8` vì canon hiện đã sở hữu `COMPOSITE-7`; wording và meaning không đổi. |
| Enforcement | WATCHED only; không thêm lint suy đoán semantic dominance/navigation ownership. |
| No-change groups | Không nhân bản luật surface/card, gap-2, localhost origin hoặc Fidelity lifecycle. |
| Apply boundary | Chỉ hai canon files và workflow record; không sửa FE production source. |

### CHANGES

| Tree | Details |
|---|---|
| `.claude/fe/canon/patterns/typography.md` | Thêm body-title decision table, `TYPE-9`, forbidden row và contrasting example. |
| `.claude/fe/canon/uxui/layers/composite.md` | Thêm ChoiceTabs ownership table, `COMPOSITE-8`, forbidden row và contrasting example. |
| `.workflows/upgrade/starci-academy/fidelity-closure-canon-audit.md` | Ghi Review và Apply evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Revision r1 | Approved explicitly by user on 2026-08-15; proceed to Apply. |

### WARNINGS

| Warning | Impact |
|---|---|
| Plan proposed duplicate `COMPOSITE-7` | Review corrects identity to next free rule `COMPOSITE-8`; no existing rule is overwritten. |
| Global workflow validator has legacy failures | Apply reports focused record result separately and does not claim the whole workflow tree is clean. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Using hover as the gate for `text-base` | Classify the content owner | Hover is interaction affordance, not content rank. |
| Choosing ChoiceTabs from option count, data volume or prose word “secondary” | Classify navigation ownership scope | Variant follows ownership and navigation scope. |
| Adding semantic lint | Keep the canon rule WATCHED | The required product ownership is not reliably inferable from classes. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply approved revision r1 | `starci-fe-upgrade-apply` updates exactly the three files above and runs focused trust gates. |

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
| Repo / branch | D:\Repositories\starci-academy-backend / mtp @ 7acd312a858be7ed58dc847c25ec86d801be17f8 |
| Purpose | Apply approved typography and ChoiceTabs canon revision from finalized fidelity evidence. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\fidelity-closure-canon-audit.md |
| Language | vi |
| Phase | apply |
| Touching | `typography.md`, `composite.md` và workflow record này; không sửa FE source, skills hoặc lint. |

Applied revision: `fidelity-closure-canon-audit-r1`.

### OUTPUTS

| Concept | Result |
|---|---|
| Typography ownership | Added the approved six-row body-title decision table and `TYPE-9`. |
| ChoiceTabs ownership | Added the approved three-row decision table and `COMPOSITE-8`. |
| Rule identity | Preserved existing `COMPOSITE-7`; the new approved rule occupies the next free identity. |
| Examples | Added one contrasting valid/invalid example for each decision table. |
| Enforcement | Kept both rules WATCHED; no speculative lint was introduced. |
| Production boundary | No frontend or backend production source changed. |

### CHANGES

| Tree | Details |
|---|---|
| `.claude/fe/canon/patterns/typography.md` | Added body-title role table, `TYPE-9`, forbidden classification shortcut and example. |
| `.claude/fe/canon/uxui/layers/composite.md` | Added ChoiceTabs ownership table, `COMPOSITE-8`, forbidden shortcut and example. |
| `.workflows/upgrade/starci-academy/fidelity-closure-canon-audit.md` | Recorded approved Review r1 and Apply evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Further approval | None; revision r1 was explicitly approved and applied without widening scope. |

### WARNINGS

| Warning | Impact |
|---|---|
| Trust suite is 188/189 | The sole failure is the pre-existing out-of-boundary `starci-be-audit-apply: ## PROCESS` skill-shape defect; both canon files pass all exercised canon tests. |
| Global workflow validator remains red | Existing historical records remain invalid; the current `fidelity-closure-canon-audit.md` has zero focused validator errors. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Editing the unrelated backend audit skill to make the suite green | Record the exact external failure | It is outside approved revision r1. |
| Repairing historical workflow records | Validate this workflow separately | Apply must not widen into unrelated history. |
| Editing FE production source | Canon-only change | The approved goal is permanent trust guidance, not another fidelity patch. |

### OWED

| Owed | Cleared by |
|---|---|
| None inside revision r1 | Canon deltas, examples, focused workflow validation and diff checks are complete. |
