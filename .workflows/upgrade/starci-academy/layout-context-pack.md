<!-- starci-workflow: v2 -->
# StarCi layout context pack

## plan — layout-context-pack-r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-backend` |
| Source | `D:\Repositories\starci-academy-backend` |
| Project | `starci-academy` — user-declared through the active StarCi task |
| Frontend | `D:\Repositories\starci-academy-fe` |
| Backend | `D:\Repositories\starci-academy-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Skills | `D:\Repositories\starci-academy-backend\.claude\skills` |
| App | `starci-academy` |
| Repo / branch | Backend workflow owner: `D:\Repositories\starci-academy-backend` / `mtp`; target Frontend: `D:\Repositories\starci-academy-fe` / `main` |
| Purpose | Đặt tên và khóa shape của context pack giúp Layout Gate chuyển business intent thành StarCi layout tree dựa trên route chrome, frame, source evidence và các layout đã duyệt. |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |
| Workflow | `D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\layout-context-pack.md` |
| Language | `vi` |
| Phase | `plan` |
| Touching | Chỉ workflow proposal này. Không tạo `.starci`, không sửa gate, skill, schema, generator hoặc Frontend source trong Plan. |

### EVIDENCE WINDOW

| Window | Evidence read |
|---|---|
| Một task StarCi Course Detail hoàn chỉnh | Toàn bộ các bảng `REJECTED` trong `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md`; các row `None` không được dùng làm witness. |
| Layout gate hiện hành | `.claude/fe/gates/layouts/INDEX.md`, `gate.schema.json`, bốn archetype indexes và `proofs/INDEX.md`. |
| Target identity | Frontend `main`; Backend workflow owner `mtp`. |

### GROUP A — route chrome và body ancestry không được cấp thành project context

| Requirement | Evidence |
|---|---|
| Refusals | `course-detail-ownership-and-rail.md:439`: tabs phải liền dưới primary navbar; `:440`: tabs không thay breadcrumb; `:1315`: tabs là navbar-adjacent layer còn breadcrumb thuộc route body; `:1387`: cùng owner chưa đủ nếu seam thật vẫn sai; `:782` và `:857`: extended navigation phải được prove ở sticky-scroll state. |
| Rules lúc đó | Layout gate có law về second-row navigation nhưng không cấp một project manifest nói route cluster nào dùng primary chrome nào, extension nào, sticky offset nào và breadcrumb thuộc vùng nào. Agent phải tự ghép source mỗi lần. |
| Rule cần có | Mỗi project phải cung cấp một resolved layout context liệt kê route cluster → primary navbar → optional extended navbar → body frame → breadcrumb owner → sticky/scroll owner; Gate 1 không được suy luận lại các quan hệ đã biết từ JSX rời. |
| Home đúng | Project artifact được version trong target Frontend tại `.starci/layout-context/`; schema, resolver và validator thuộc shared Layout Gate trong Trust. |

### GROUP B — source hiện tại không đồng nghĩa với quyết định đã duyệt

| Requirement | Evidence |
|---|---|
| Refusals | `course-detail-ownership-and-rail.md:630-631`: đọc sai component boundary và tin `gap-4` chỉ vì contract đang ghi vậy; `:1161-1162`: phải đo card-to-card relationship và thay stale contract bằng explicit founder feedback; `:1232`: dùng chung component vẫn có thể sai render thật. |
| Rules lúc đó | Gate neo vào source lines nhưng chưa phân loại source là `observed`, quyết định founder là `approved`, hay hình dạng đã bị bác là `rejected`. |
| Rule cần có | Context resolver áp precedence `current brief > approved decision > approved exemplar > observed source > explicit inference`; source evidence không được tự nâng thành approved canon. |
| Home đúng | Shared resolver/validator trong Layout Gate; project pack chỉ lưu evidence có status và workflow/source anchors. |

### GROUP C — layout gate đang nhận quá nhiều prose và quá ít project facts

| Requirement | Evidence |
|---|---|
| Refusals | `course-detail-ownership-and-rail.md:439-440`, `:630-631`, `:1315`, `:1387` cùng lặp lại dù gate đã có law tương ứng; lỗi nằm ở việc law không tới agent dưới dạng route/frame/tree facts. |
| Rules lúc đó | `.claude/fe/gates/layouts` có 84 files/11,546 lines; root INDEX vừa yêu cầu chọn một archetype trước vừa nói archetypes compose. Blind-chain proof hiện ghi điểm recommended trung bình ba trang 39.3%. |
| Rule cần có | Gate 1 chỉ nhận business brief cộng một resolved project context nhỏ, rồi xuất `chrome + layout tree + region purpose`; history/audit không đi trong runtime context. |
| Home đúng | Context-pack schema và generator contract trong Layout Gate; project-specific resolved artifact tại `.starci/layout-context/`. |

### PROPOSED NAME AND SHAPE

Recommended name: **`.starci/layout-context/`**.

`.layout` bị từ chối vì quá chung, không nói owner và sẽ va chạm nếu project có tool layout khác. `.starci/layout-context` nói đủ namespace, purpose và mở được sibling contexts sau này mà không tạo thêm hidden roots.

| Path candidate | Ownership | Content |
|---|---|---|
| `.starci/layout-context/manifest.json` | generated metadata | Schema/generator version, source commit, generated timestamp và hashes; không chứa layout decisions. |
| `.starci/layout-context/source.json` | generated from live source | Route clusters, primary/extended navbars, available frames, current owners, breakpoints, sticky/scroll mechanics; mọi entry mặc định `observed`. |
| `.starci/layout-context/decisions.json` | generated from approved workflow rows | Accepted/rejected decisions với workflow anchors; không chép narrative. |
| `.starci/layout-context/exemplars/*.json` | reviewed project evidence | 5–10 approved mappings `business intent → chrome + layout tree`; không chứa block/component paint. |
| `.starci/layout-context/resolved.json` | generated, sole Gate input | Merge theo precedence; chỉ file này được Layout Gate consume. |

### INITIAL EXEMPLAR SET

| Exemplar | Chrome | Body frame |
|---|---|---|
| Public/Home | primary navbar | `single` |
| Course Catalog | primary navbar | `single` |
| Dashboard Overview | primary + dashboard extension | `rail-main` |
| Dashboard Courses | primary + dashboard extension | `rail-main` |
| Course Detail | primary + course extension | `main-aside`, supporting purchase region sticky |
| Course Learning | learning extension | `rail-main` |
| Public Profile | primary + profile extension | `rail-main` |
| Practice Workspace | primary + practice extension | `split` |
| Cart/Checkout | primary navbar | `main-aside` |
| Authentication | no app navbar | `single` or approved overlay variant |

Each exemplar records only business purpose, chrome composition, region tree, axis, sizing, sticky/scroll behavior and narrow transformation. Blocks, cards, typography, colors, gap and vendor components belong to later gates.

### ACCEPTANCE

| Proof | Expected result |
|---|---|
| Schema validation | Every context file rejects unknown fields; `resolved.json` has one schema version and no prose-only decision. |
| Source extraction twin | Fixture with Dashboard and Course Detail routes emits their distinct extended navbar rows; catalog emits primary-only chrome. |
| Precedence twin | Approved founder decision overrides conflicting observed source; rejected evidence can never become resolved output. |
| Gate twin | Business Course Detail plus resolved context emits primary + course extension, breadcrumb in body and `main-aside` with sticky supporting region. |
| Drift proof | Changed route/layout owner makes generated source hash differ and reports drift instead of silently trusting stale `resolved.json`. |

### WATCHED

| Candidate | Why watched |
|---|---|
| Commit generated `resolved.json` versus generate on demand | Current refusals prove missing context, not the preferred artifact lifecycle. Review must inspect CI/offline skill consumption before choosing. |
| Put exemplars in Trust rather than target project | Only StarCi Academy exemplars are currently named; a second project witness is needed before promoting them to shared canon. |

### OUTPUTS

| Concept | Result |
|---|---|
| Project context name | Recommend `.starci/layout-context/`, replacing the ambiguous `.layout`. |
| Context boundary | Separate observed source, approved decisions and exemplars; expose only one resolved Gate input. |
| StarCi layout knowledge | Ten initial project exemplars include primary and route-specific extended navbars. |
| Authority model | Current brief and approved decisions beat observed source; rejected evidence is never selectable. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/layout-context-pack.md` | added — refusal-backed Plan for naming, context shape, authority precedence and proof boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Advance exact name/home to Upgrade Review? | Recommended: `.starci/layout-context/` in `D:\Repositories\starci-academy-fe`; alternative: `.starci/layout-profile/` if the artifact should be read as a source snapshot rather than an AI input pack. |

### WARNINGS

| Warning | Impact |
|---|---|
| Existing `.claude/fe/gates/layouts` prose and schema disagree on single plan versus plan set and single archetype versus composed layers. | Review must freeze the new resolved schema before Apply; copying the existing schema would preserve the defect. |
| Source contains observed breaches and stale contracts. | A source-only generator would reproduce rejected layouts unless status and precedence are mandatory. |
| `.claude/fe` currently has staged trust-tree deletions from the separate gates migration. | Upgrade Apply must isolate its baseline and must not absorb those unrelated staged changes. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `.layout/` | `.starci/layout-context/` | `.layout` has no project namespace or artifact purpose. |
| Let AI reread all JSX on every run | Generate a small source manifest and resolve it with approved decisions/exemplars | Repeated refusals show source lines alone are both incomplete and sometimes stale. |
| Store canon/history inside the project pack | Store compact anchored facts and keep shared grammar in Gate 1 | Otherwise the new folder becomes another 11,000-line shelf. |

### OWED

| Owed | Cleared by |
|---|---|
| Exact schema, extractor inputs and generated-artifact lifecycle | `$starci-fe-upgrade-review` on `layout-context-pack-r1`. |
| Trust and target write boundary | Explicit approval of one Upgrade Review revision, followed by `$starci-fe-upgrade-apply`. |
| Initial ten exemplars verified against live owners | Review source inventory and per-exemplar owner anchors before Apply. |
