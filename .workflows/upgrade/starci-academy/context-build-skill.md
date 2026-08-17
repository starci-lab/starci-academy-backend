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
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-backend / mtp; D:\Repositories\starci-academy-fe / main |
| Purpose | Đề xuất skill `starci-fe-context-build` để dựng context LLM từ các trang FE đã được người dùng verify, nhưng chỉ ghi context sau explicit approval. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\context-build-skill.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\context-build-skill.md |

Window: các workflow StarCi Academy đã Finality đến 2026-08-17, tập trung Dashboard, Courses và Course Detail.

### Evidence group: accepted render cannot be reconstructed from source alone

| The refusals | What the rules said at the time | What they should have said | Where it belongs |
|---|---|---|---|
| `course-detail-ownership-and-rail.md`: tabs bị đặt như body block, breadcrumb bị loại, sticky state bị bỏ sót; cùng component vẫn gây first-render mismatch | Gate đọc canon, contracts và source nhưng không có project-local snapshot của chrome/layout đã được founder chốt | Context dùng cho layout generation phải được dựng từ accepted workflow decision + runtime proof + exact source identity; source một mình chỉ là observed evidence | `starci-fe-context-build` PROCESS và `.starci/context/manifest.json` schema |
| `dashboard-content-typography.md`: mixed `text-base`/`text-sm`, long copy bị quá nặng | Typography rules có token nhưng thiếu accepted page-role mapping | Context phải lưu semantic role đã chốt theo page/block, không chỉ lưu class đang tồn tại | `starci-fe-context-build` PROCESS và `.starci/context/typography/` |
| `courses-assets-and-empty-state.md`: zero courses từng làm mất cả result region; stale asset origin từng bị che ở leaf | Source tree không phân biệt accepted empty state với incidental implementation | Context phải lưu required states và ownership decisions có provenance, gồm empty/error/loading/data | `starci-fe-context-build` PROCESS và `.starci/context/decisions/` |

### Evidence group: context writes need an approval barrier

| The refusals | What the rules said at the time | What they should have said | Where it belongs |
|---|---|---|---|
| `course-detail-ownership-and-rail.md`: contract belief `gap-4` stale khi binding feedback chứng minh `gap-2` | Contract/source có thể được đọc như truth dù chưa được người dùng chấp nhận | Không ghi `.starci/context/**` từ source scan; trước tiên tạo candidate revision, render/measure, liệt kê provenance và chờ explicit approval | `starci-fe-context-build` PROCESS |
| `course-detail-ownership-and-rail.md`: cùng owner không bảo đảm runtime parity; top-of-page proof không bảo đảm sticky proof | Existing evidence gate không bắt candidate context prove all named states | Candidate chỉ được approve nếu proof matrix bao phủ route, viewport, theme, auth và interaction/sticky states được khai báo | `starci-fe-context-build` PROCESS và deterministic validator |

### Proposed context tree

```text
D:\Repositories\starci-academy-fe\.starci\context\
├── manifest.json
├── layout\
│   ├── dashboard.json
│   ├── courses.json
│   └── course-detail.json
├── navigation\
│   └── chrome.json
├── components\
│   └── registry.json
├── typography\
│   └── roles.json
└── decisions\
    ├── dashboard.json
    ├── courses.json
    └── course-detail.json
```

`manifest.json` owns schema version, generated-at time, FE commit, per-file hashes, accepted candidate revision and workflow anchors. Every fact in the five shelves must carry either a direct source pointer or an approved workflow decision pointer. Rejected and superseded facts never enter resolved context.

### Proposed skill lifecycle

1. Resolve canonical Source/Frontend/Backend context and refuse inference from the Source folder name.
2. Select requested pages and locate their latest Finality/approved Apply records.
3. Read current source only as observed evidence; compare its hashes and runtime behavior with accepted records.
4. Generate a candidate review record outside `.starci/context/` containing normalized layout, navigation, component, typography and decision facts.
5. Render or inspect every declared state and print drift, unknowns and provenance.
6. Stop for explicit approval of one candidate revision. Do not create or update `.starci/context/**` before approval.
7. After approval, write the five shelves atomically, update `manifest.json`, validate schema/hashes and prove an LLM can reconstruct the three page plans without reading product source.
8. Never silently refresh accepted context. Source drift opens a new candidate revision.

### Initial verified page candidates

| Page | Accepted workflow seed | Candidate coverage |
|---|---|---|
| Dashboard | `dashboard-content-typography.md` plus related finalized Dashboard records | primary navbar, Dashboard extended navbar, rail/main frame, Continue Learning, Daily Quest, compact stats typography |
| Courses | `courses-assets-and-empty-state.md` plus finalized auth/nav record | primary navbar, catalog controls, grid/list states, data/empty/error states, card/list ownership |
| Course Detail | `course-detail-ownership-and-rail.md` plus approved/applied Course Detail design records | primary + course extended navbar, breadcrumb body owner, main/aside frame, sticky rail, pricing/trial/cart states, curriculum/review/FAQ surfaces |

### OUTPUTS

| Concept | Result |
|---|---|
| Context root | `.starci/context/` with the five approved shelves requested by the user. |
| New skill | `starci-fe-context-build`, with candidate → approval → atomic write lifecycle. |
| Initial scope | Dashboard, Courses and Course Detail only; no claim about unverified pages. |
| Authority order | Explicit current brief → approved context decision → accepted workflow evidence → observed source → marked inference. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/context-build-skill.md` | added — exact skill/context proposal only; no trust rule, skill or FE context written in Plan. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve the skill boundary and context tree for Review? | Recommended: approve `starci-fe-context-build-r1`; Review will freeze SKILL.md, schema, scripts and the three-page candidate proof before Apply creates anything. |
| Candidate write policy | Recommended: candidate workflow first, `.starci/context/**` only after explicit approval of a named revision. |

### WARNINGS

| Warning | Impact |
|---|---|
| Finalized records identify accepted corrections, but several point to historical worktree identities rather than immutable FE commits. | Build skill must re-measure current source/runtime and mark drift; it cannot copy historical source blindly. |
| Current source may contain later changes not covered by those Finality records. | Any mismatch remains candidate drift until the user accepts a new context revision. |
| Existing `.claude/fe` trust migration has unrelated staged/deleted state. | Apply must isolate the new skill and avoid absorbing unrelated trust changes. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Generate context directly from current source | Triangulate Finality/approved decision, fresh runtime and source identity | Current source can contain rejected, stale or concurrent work. |
| Write `.starci/context/` during discovery | Write a candidate record, then wait for explicit approval | User explicitly requires “chốt rồi mới ghi vào”. |
| Store screenshots or raw JSX as the main LLM context | Store normalized facts with provenance; screenshots/source remain evidence links | Raw artifacts are expensive, ambiguous and drift silently. |
| Treat one accepted page as global canon | Scope facts to page/route and promote only separately reviewed shared patterns | Prevents Course Detail decisions from leaking into Dashboard or Courses. |

### OWED

| Owed | Cleared by |
|---|---|
| Review exact SKILL.md, candidate record schema, context JSON schema, scripts and write boundary | `starci-fe-upgrade-review` approval of `starci-fe-context-build-r1`. |
| Create `starci-fe-context-build` and `.starci/context/` | `starci-fe-upgrade-apply` after Review approval. |
| Populate the three page contexts | Run the new skill, inspect its candidates, then explicit user approval per named revision. |
