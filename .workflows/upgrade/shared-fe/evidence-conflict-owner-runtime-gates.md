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
| Repo / branch | D:\Repositories\starci-academy-backend / mtp |
| Purpose | Đề xuất gate bắt buộc để contract/workflow cũ không lấn át live evidence, REUSE phải chứng minh parity thật và Fidelity phải bắt hydration lỗi trên fresh tab. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\shared-fe\evidence-conflict-owner-runtime-gates.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\upgrade\shared-fe\evidence-conflict-owner-runtime-gates.md |

Candidate revision: `shared-fe-evidence-conflict-owner-runtime-r1`

### AUDIT WINDOW

| Window | Records | REJECTED sections | Parsed rows | Non-empty rows |
|---|---:|---:|---:|---:|
| Toàn bộ Markdown workflow hiện có dưới `Source/.workflows`, loại `.previews`, tại 2026-08-15 | 21 | 93 | 265 | 254 |

Mỗi witness dưới đây được định danh theo workflow + phase. Các dòng `None`, `Chưa có` và các lần lặp cùng một kết luận trong cùng phase không được dùng để nâng số witness.

### GROUP 1 — EVIDENCE CONFLICT GATE

Status: **PROPOSED**

#### Refusals

| Refusal | Replacement | Workflow / phase |
|---|---|---|
| “Kết luận ‘Học viện chuyên gia chưa có backend contract’” | “Dùng operation family expert-sites đã có”; live schema và sibling folders chứng minh capability | `designs/nivo/provisioning-flows.md` / review r2 |
| “Historical ‘FAQ has no data’ verdict” | Live `course.data.qnas` | `designs/starci-academy/course-detail-page-v4.md` / review revision-3 |
| “Tabs thay thế breadcrumb” | Tabs và breadcrumb cùng tồn tại, mỗi loại đúng vai trò | `fidel/starci-academy/course-detail-ownership-and-rail.md` / feedback |
| “Gọi A2-A6 đã hoàn tất chỉ vì route/typecheck đã có” | Chọn direction rồi review với lint/live/browser evidence | `designs/starci-academy/learn-branch.md` / plan revision 3 |

#### What the rules said at the time

| Current rule | Location | Gap |
|---|---|---|
| Belief là provisional; phải thay khi stronger evidence xuất hiện | `.claude/fe/creativity/best-belief-source.md:10-11` | Canon đúng nhưng không skill/workflow artifact nào bắt phase chứng minh đã tìm competing evidence. |
| Chọn authority theo claim kind | `.claude/fe/creativity/best-belief-source.md:28` | Design Review không bắt ghi claim kind hay authority winner khi contract, prior workflow, live source và legacy xung đột. |
| Không resolve conflict silently | `.claude/fe/creativity/best-belief-source.md:89` | `validate-workflows.mjs` không kiểm tra conflict table; approval vẫn hợp lệ khi bảng này vắng mặt. |
| Review challenge live contracts và existing ownership | `.claude/skills/starci-fe-design-review/SKILL.md:23-26` | Câu lệnh không buộc đánh dấu nguồn cũ là stale hoặc sửa owner của nguồn stale trước Apply. |

#### Proposed rule

> Contract, prior workflow verdict và current implementation là belief có thời hạn, không phải truth tuyệt đối: khi current user instruction, live backend/schema, named legacy render hoặc sibling owner đưa bằng chứng đối nghịch, phase phải ghi conflict, chọn authority theo claim kind, đánh dấu nguồn stale và route việc sửa nguồn stale trước khi approval hoặc production correction được coi là settled.

#### Home and enforcement

| Home | Change | Why here |
|---|---|---|
| `.claude/skill-shape.md` | Thêm global `### EVIDENCE CONFLICTS` obligation cho FE Plan/Review và Fidelity Start/Feedback. | Đây là shape của mọi run, không phải riêng một page. |
| `.claude/skills/starci-fe-design-plan/SKILL.md` | Buộc tìm contract, previous workflow, sibling, legacy và live source competing evidence trước preview. | Plan là nơi assumption lần đầu được hình thành. |
| `.claude/skills/starci-fe-design-review/SKILL.md` | Cấm `Approved revision` khi conflict chưa có authority verdict hoặc stale-source repair route. | Review sở hữu quyết định trước Apply. |
| `.claude/skills/starci-fe-fidelity-start/SKILL.md` | Mỗi binding source phải được kiểm tra against competing evidence; feedback có thể sửa contract `why` nếu chính contract là defect. | Fidelity vừa gặp đúng failure này. |
| `.claude/scripts/validate-workflows.mjs` | Require exact table `| Claim | Incumbent source | Competing source | Authority | Verdict | Stale-source action |` ở approved Design Review và Fidelity Start/Feedback; `None` vẫn phải explicit. | Điều máy kiểm tra được không được để thành prose dễ bỏ qua. |
| `.claude/sources/skills.test.mjs` | Test ba skills dùng cùng header và wording “belief, not absolute truth”. | Ngăn skill drift khỏi global rule. |

### GROUP 2 — OWNER PARITY BEFORE REUSE

Status: **PROPOSED**

#### Refusals

| Refusal | Replacement | Workflow / phase |
|---|---|---|
| Flat `ProvisioningPageView` owning form, journey, live status và copy | Page composes domain blocks; blocks dùng composites/contracts | `designs/nivo/provisioning-flows.md` / plan r2 |
| Reuse `CourseDetailPage` làm `/learn/content` landing | `CourseLearnContentHomePage` thật | `designs/starci-academy/learn-branch.md` / review revision 4 |
| Generic landing/module/mobile replacements | Giữ binding redirect và trả anatomy còn lại về Review | `designs/starci-academy/learn-branch.md` / apply |
| “Kết luận navbar đã ổn chỉ vì dùng chung component” | Đo Console và khóa server/client first shape | `fidel/starci-academy/course-detail-ownership-and-rail.md` / feedback |

#### What the rules said at the time

| Current rule | Location | Gap |
|---|---|---|
| Reuse inventory phải có `why match`, behavior match và state match | `.claude/fe/creativity/best-belief-source.md:46` | Design Plan skill chỉ yêu cầu inventory existing keys và verdict REUSE/EXTEND/NEW, không bắt component props/states/behavior rows. |
| Review đọc imports, exports, props và call sites | `.claude/skills/starci-fe-design-review/SKILL.md:23-37` | `COMPONENT DELTA` chỉ có một cột Reason; một row `REUSE` có thể nói “same owner” mà không chứng minh rendered states hoặc behavior. |
| Workflow validator kiểm tra action/path/call-site/contract/reason | `.claude/scripts/validate-workflows.mjs:192-230` | Validator không đối chiếu mỗi `REUSE` owner với một parity row và không kiểm tra state/behavior evidence. |

#### Proposed rule

> `REUSE` chỉ đúng khi owner, public props, state union, behavior, route placement và rendered result cùng khớp frozen reference; cùng tên component, cùng contract key hoặc cùng CSS không phải parity proof.

#### Home and enforcement

| Home | Change | Why here |
|---|---|---|
| `.claude/skills/starci-fe-design-plan/SKILL.md` | Thay inventory prose bằng exact `### OWNER PARITY` table. | Plan phải thấy reuse candidates trước khi tạo direction. |
| `.claude/skills/starci-fe-design-review/SKILL.md` | Require một parity row cho mọi `REUSE` trong `COMPONENT DELTA`; mismatch phải đổi thành MODIFY/ADD/REJECT. | Review là nơi freeze owner tree. |
| `.claude/skills/starci-fe-fidelity-start/SKILL.md` | Với feedback “follow trang khác/legacy”, require target-vs-reference owner/state/behavior row trước patch. | Small patch vẫn có thể reuse sai owner state. |
| `.claude/scripts/validate-workflows.mjs` | Add exact header `| Owner | Reference | Why match | Props match | State match | Behavior match | Render proof | Verdict |`; approved Review phải cover mọi `REUSE` owner. | Owner names có thể machine-correlate giữa hai bảng. |
| `.claude/sources/skills.test.mjs` và workflow-validator tests | Test table presence, verdict vocabulary và missing-REUSE-row failure. | Chặn regression của process gate. |

### GROUP 3 — FRESH-TAB HYDRATION AND RUNTIME PROOF

Status: **PROPOSED**

#### Refusals

| Refusal | Replacement | Workflow / phase |
|---|---|---|
| Apply chỉ dừng ở typecheck, lint, build hoặc screenshot | Đăng nhập test account, chạy flow thật và kiểm tra UI + Network + Console + terminal | `upgrade/shared-fe/authenticated-live-flow-proof.md` / plan |
| Xem screenshot/click thành công là đủ | Correlate UI, Network, Console và Terminal | `upgrade/shared-fe/authenticated-live-flow-proof.md` / apply |
| “Tools đã dùng chung nên không lỗi” | First-render auth gate sau mount; fresh tab Console zero errors | `fidel/starci-academy/course-detail-ownership-and-rail.md` / feedback |
| Duyệt ngay chỉ vì backend Socket.IO đã có | Xác nhận cả backend + FE client boundary | `designs/nivo/provisioning-flows.md` / review r3 |

#### What the rules said at the time

| Current rule | Location | Gap |
|---|---|---|
| Live-flow proof yêu cầu Console không có hydration failure | `.claude/skills/starci-fe-design-review/references/live-flow-proof.md:29-35` | Không yêu cầu fresh tab/navigation window; log cũ hoặc HMR state có thể che first hydration. |
| Runtime proof tests chỉ khóa Apply lanes | `.claude/sources/live-flow-proof.test.mjs:9-37` | Fidelity Start/End không nằm trong covered skills. |
| Fidelity Start chỉ yêu cầu before/after, typecheck, lint, tests, build proportionate | `.claude/skills/starci-fe-fidelity-start/SKILL.md:74-76` | Không bắt Console, Network hay first-render proof khi touching shell/layout/auth/session. |
| Fidelity End chạy tests/build và related-bug scan | `.claude/skills/starci-fe-fidelity-end/SKILL.md:21-32` | End có thể pass session visual dù fresh browser Console chưa từng được đọc. |

#### Proposed rule

> Mọi FE change chạm shell, layout, auth, session hoặc SSR-rendered vendor control phải được chứng minh trong browser tab mới mở sau correction: ghi cả server-first shape và settled post-mount shape, bắt đầu Console window trước navigation, và không được có hydration mismatch hay unexplained runtime error; screenshot, unit test và HMR tab không thay proof này.

#### Home and enforcement

| Home | Change | Why here |
|---|---|---|
| `.claude/skills/starci-fe-design-review/references/live-flow-proof.md` | Thêm fresh-tab protocol, server-first/post-mount cells và log-window timing. | Shared runtime reference đã là owner của four-surface proof. |
| `.claude/skills/starci-fe-fidelity-start/SKILL.md` | Load shared proof khi touching shell/layout/auth/session/SSR vendor controls; correction không được claim passed khi fresh Console đỏ. | Feedback phải sửa và prove ngay, không chờ Apply. |
| `.claude/skills/starci-fe-fidelity-end/SKILL.md` | Require `### LIVE FLOW PROOF` trước End; unavailable surfaces vào OWED. | Finality không được dựa trên tests-only End. |
| `.claude/sources/live-flow-proof.test.mjs` | Cover Fidelity Start/End và assert tokens `fresh tab`, `server-first`, `post-mount`, `hydration`. | Đây là rule text có thể machine-lock. |
| `.claude/scripts/validate-workflows.mjs` | Require live-flow table ở Fidelity End; allow explicit `not-applicable` only with evidence. | Final workflow shape phải phản ánh runtime gate. |

### COVERED GROUPS — NO NEW RULE

| Pattern found in refusals | Current owner | Disposition |
|---|---|---|
| Invent backend fields/operations or duplicate deployment owner | Backend feature Plan/Review plus BELIEF-2/6/8 | Không propose thêm; current rules đã trực tiếp chặn và các later records cho thấy gate hoạt động. |
| Flat JSX, missing blocks/composites, structural literal classes | FE canon + lint rules | Không propose thêm rule; đây là enforcement đang bắt đúng source. |
| Dirty/baseline/source SHA drift | Apply baseline and approved-revision boundary | Không propose; current Apply rule đã require baseline commit và return-to-Review. |
| Fidelity lifecycle, mixed-feedback routing và canonical origin | Ba upgrade records hiện có dưới `upgrade/starci-academy` | Không duplicate upgrade đã Apply. |
| Product hierarchy choices như journey trong sidebar | Design choice + explicit user approval | Không biến preference cụ thể thành global law. |

### WATCHED

| Candidate | Current witnesses | Why not proposed yet | Promote when |
|---|---:|---|---|
| Static rule tự phát hiện `contract.why` semantically stale | 1 direct contract defect: Course Detail tabs/breadcrumb | Máy không thể suy ra product ancestry chỉ từ prose; process conflict gate là correction vừa đủ. | Có witness thứ hai nơi contract `why` trực tiếp loại bỏ một owner/product behavior hợp lệ. |
| Dedicated React rule cấm auth-dependent first tree | 1 direct owner: `ShellNav` | Có thể có server-provided session hợp lệ ở app khác; cấm toàn cục sẽ quá rộng. | Có witness thứ hai mà auth/session store đổi structural tree trước hydration và fresh-tab gate chỉ phát hiện sau fact. |
| Bắt mọi Fidelity Feedback chạy full Network + Terminal | 1 runtime-heavy session; nhiều visual patch không gọi backend | Full four-surface proof cho icon/spacing thuần có thể tạo ceremony không có signal. | Có witness thứ hai nơi non-shell visual feedback che Network/Terminal failure liên quan trực tiếp. |

### PROPOSED CHANGE TREE

| Group | Candidate paths for Review | Write class |
|---|---|---|
| Evidence conflict | `.claude/skill-shape.md`, Design Plan/Review, Fidelity Start, workflow validator, skill tests | Trust/process + machine gate |
| Owner parity | Design Plan/Review, Fidelity Start, workflow validator, skill/validator tests | Skill/process + machine-correlated table |
| Fresh runtime | Shared live-flow reference, Fidelity Start/End, live-flow tests, workflow validator | Runtime protocol + machine gate |
| FE product source | None | Upgrade must not edit product source |

### ACCEPTANCE EVIDENCE

| Proof | Required result |
|---|---|
| Workflow validator fixtures | Approved Review without EVIDENCE CONFLICTS or missing REUSE parity row fails; valid explicit `None` conflict row passes. |
| Skill source tests | Design Plan/Review/Fidelity Start share the same conflict/parity headers and authority wording. |
| Live-flow tests | Fidelity Start/End are covered; fresh-tab/server-first/post-mount/hydration tokens cannot drift out. |
| Existing workflow compatibility | Historical records remain legacy evidence; validator migration must not rewrite old phases silently. |
| Trust-tree test run | All relevant `.claude/sources/*.test.mjs` and workflow validator tests pass unsuppressed. |

### OUTPUTS

| Concept | Result |
|---|---|
| Evidence conflict gate | Contract và prior workflow trở thành belief phải tái kiểm chứng; stronger live/sibling/legacy evidence bắt buộc reopen verdict. |
| Owner parity gate | `REUSE` phải chứng minh props, states, behavior và render, không chỉ cùng tên/contract. |
| Fresh-tab runtime gate | Fidelity shell/auth/layout corrections phải bắt hydration bằng tab mới và Console window sạch. |
| Candidate revision | `shared-fe-evidence-conflict-owner-runtime-r1` sẵn sàng cho Upgrade Review; chưa có trust rule nào được sửa. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/shared-fe/evidence-conflict-owner-runtime-gates.md` | added — ghi toàn bộ refusal window, ba proposed groups, covered dispositions, WATCHED và acceptance gates. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Plan chỉ ghi proposal; Upgrade Review sẽ challenge exact wording, homes và migration boundary trước trust writes. |

### WARNINGS

| Warning | Impact |
|---|---|
| Refusal audit chứa cả historical workflow trước và sau các upgrade cũ. | COVERED groups phải được loại khỏi proposal để không tạo duplicate law. |
| Workflow validator hiện đã báo lỗi ở các unrelated historical Nivo/Learn records. | Review/Apply phải prove candidate fixtures riêng và không claim full-tree validator green nếu lỗi cũ vẫn còn. |
| Bắt conflict/parity table trên mọi historical phase sẽ phá compatibility. | Gate chỉ được áp dụng cho phase mới hoặc version/migration rule explicit; không rewrite records cũ. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Thêm một câu “hãy đọc kỹ contract” | Evidence conflict table + validator gate | Canon hiện đã nói đúng nhưng skill vẫn có thể bỏ qua; prose lặp lại không ngăn failure. |
| Viết lint đoán contract semantically sai | Process evidence gate; static semantic lint để WATCHED | Product intent và route ancestry không thể suy ra an toàn từ class/slot AST. |
| Bắt full Network/Terminal cho mọi pixel patch | Targeted fresh-tab hydration gate; full expansion để WATCHED | Rule phải đủ hẹp để có signal và được tuân theo. |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge ba proposals against exact migration and validator compatibility | `starci-fe-upgrade-review`. |
| Explicit approval per proposed rule/home/test boundary | Upgrade Review revision được user approve. |
| Trust writes and gate tests | `starci-fe-upgrade-apply` chỉ sau approved Review. |

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
| App | shared-fe |
| Repo / branch | D:\Repositories\starci-academy-backend / mtp |
| Purpose | Review độc lập ba gate evidence conflict, owner parity và fresh-tab runtime trước khi sửa trust tree. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\shared-fe\evidence-conflict-owner-runtime-gates.md |
| Language | vi |
| Phase | review |
| Touching | D:\Repositories\starci-academy-backend\.workflows\upgrade\shared-fe\evidence-conflict-owner-runtime-gates.md |

Candidate revision: `shared-fe-evidence-conflict-owner-runtime-r2`

Review status: **AWAITING EXPLICIT APPROVAL**

### INDEPENDENT VERDICT

| Group | Witnesses | Verdict | Review correction |
|---|---:|---|---|
| Evidence conflict gate | 4 deduplicated workflows/phases | ACCEPT CONCEPT, REVISE MIGRATION | Không ép retroactive mọi workflow v2. Phase mới opt in bằng protocol marker rồi validator mới bắt bảng. |
| Owner parity before REUSE | 4 deduplicated workflows/phases | ACCEPT CONCEPT, REVISE COVERAGE | Design Review phải correlate mọi `COMPONENT DELTA` row `REUSE`; Fidelity chỉ cần target/reference parity khi claim reuse/follow legacy/sibling. |
| Fresh-tab hydration/runtime | 4 deduplicated workflows/phases | ACCEPT CONCEPT, NARROW TRIGGER | Bắt fresh-tab Console cho shell/layout/auth/session/SSR vendor control. Không bắt Network/Terminal cho pixel-only patch nếu không có runtime/backend boundary. |

Các witness trong Plan r1 đủ để nâng rule vì mỗi group có nhiều failure độc lập. Không có group nào được nâng chỉ từ một preference UI cụ thể.

### APPROVAL PACKAGES

| Package | Exact general rule | Home | Test obligation | Write boundary |
|---|---|---|---|---|
| A — evidence conflict | Contract, prior workflow verdict và current implementation là provisional evidence. Khi user instruction, live backend/schema, named legacy render hoặc sibling owner xung đột, phase phải ghi claim, hai nguồn, authority theo claim kind, verdict và stale-source action trước khi approval/correction được coi là settled. | `skill-shape.md`; Design Plan/Review; Fidelity Start | Protocol-marked Design Review hoặc Fidelity Start/Feedback thiếu exact conflict table phải fail; explicit `None` row phải pass; skill test khóa marker và header. | Chỉ trust/process files được liệt kê ở CHANGE TREE; không sửa contract canon hay product source. |
| B — owner parity | `REUSE` chỉ hợp lệ khi owner, public props, state union, behavior, route placement và rendered result khớp frozen reference; cùng tên/key/CSS không phải parity proof. | Design Plan/Review; Fidelity Start | Protocol-marked approved Design Review có `REUSE` nhưng thiếu matching OWNER PARITY `REUSE` phải fail; action mismatch phải fail; non-REUSE không bị ép giả parity. | Chỉ skills, validator và tests; không refactor component trong Upgrade Apply. |
| C — fresh runtime | Change chạm shell, layout, auth, session hoặc SSR-rendered vendor control phải được chứng minh bằng tab mới mở sau correction, Console window bắt đầu trước navigation, server-first và settled post-mount shape được ghi, không hydration mismatch hay unexplained runtime error. | Shared live-flow reference; Fidelity Start/End | Live-flow skill test phải cover Fidelity Start/End và khóa `fresh tab`, `server-first`, `post-mount`, `hydration`; protocol-marked applicable Fidelity End thiếu LIVE FLOW PROOF phải fail. | Chỉ runtime protocol và workflow gates; không sửa FE runtime trong Upgrade Apply. |

### PROTOCOL AND COMPATIBILITY

| Concern | Frozen decision |
|---|---|
| New Design Review records | Ghi `Review protocol: evidence-v1`; khi marker có mặt, `### EVIDENCE CONFLICTS` và `### OWNER PARITY` bắt buộc. Updated Design Review skill luôn phát marker. |
| New Fidelity records | Start ghi `Fidelity protocol: evidence-v1`; mọi event cùng session kế thừa protocol. Start/Feedback có conflict/parity obligations theo claim; applicable End có LIVE FLOW PROOF. |
| Historical v2 records | Không rewrite, không auto-fail chỉ vì thiếu marker. Validator tiếp tục kiểm tra obligations cũ. |
| Prevent silent bypass | `skills.test.mjs` khóa marker trong updated skills; vì run mới đi qua skill nên không thể hợp lệ theo procedure mà âm thầm bỏ protocol. |
| Explicit none | Conflict table cho phép một row `None` với evidence đã kiểm tra; không cho bỏ hẳn bảng ở protocol-marked phase. |
| Runtime applicability | End ghi trigger/boundary. `not-applicable` chỉ pass khi evidence nêu patch không chạm shell/layout/auth/session/SSR vendor control và không có runtime/backend behavior. |

### REQUIRED TABLES

`### EVIDENCE CONFLICTS`

| Claim | Incumbent source | Competing source | Authority | Verdict | Stale-source action |
|---|---|---|---|---|---|
| None | Named sources checked | No conflict found | claim-kind authority checked | keep-incumbent | None |

Allowed conflict verdicts: `keep-incumbent`, `replace-incumbent`, `resolve-before-write`, `none`.

`### OWNER PARITY`

| Owner | Reference | Why match | Props match | State match | Behavior match | Render proof | Verdict |
|---|---|---|---|---|---|---|---|
| Example owner | Frozen owner/reference | Exact responsibility | yes/no/n-a | yes/no/n-a | yes/no/n-a | Named render evidence | REUSE/MODIFY/ADD/REJECT/None |

Review correlation: mỗi `COMPONENT DELTA` action `REUSE` phải có đúng owner và verdict `REUSE`; bất kỳ mismatch nào phải đổi action hoặc resolve trước approval.

`### LIVE FLOW PROOF` giữ header hiện tại:

| Flow | Persona | Steps | UI | Network | Console | Terminal | Verdict | Evidence |
|---|---|---|---|---|---|---|---|---|
| Fresh-tab hydration | Named persona | Open new tab after correction; start Console before navigation | Server-first and settled post-mount shape | Relevant requests or n-a with reason | Zero hydration/unexplained runtime errors | Relevant logs or n-a with reason | pending/passed/failed | Named artifacts |

### CHANGE TREE

| Path | Approved mutation after user approval |
|---|---|
| `.claude/skill-shape.md` | Add protocol-marker and evidence-conflict global shape without changing historical workflow validity. |
| `.claude/skills/starci-fe-design-plan/SKILL.md` | Gather competing evidence and OWNER PARITY candidates before preview. |
| `.claude/skills/starci-fe-design-review/SKILL.md` | Emit `Review protocol: evidence-v1`; require conflict resolution and REUSE correlation before approval. |
| `.claude/skills/starci-fe-fidelity-start/SKILL.md` | Emit/inherit fidelity protocol; check conflicting evidence and target/reference parity; invoke runtime proof on bounded triggers. |
| `.claude/skills/starci-fe-fidelity-end/SKILL.md` | Require applicable fresh-tab LIVE FLOW PROOF before End evidence passes. |
| `.claude/skills/starci-fe-design-review/references/live-flow-proof.md` | Define new-tab timing, server-first/post-mount evidence and conditional surfaces. |
| `.claude/scripts/validate-workflows.mjs` | Enforce new tables only for `evidence-v1` protocol-marked phases/sessions. |
| `.claude/sources/skills.test.mjs` | Lock markers, shared headers, authority wording and Fidelity routing. |
| `.claude/sources/workflows.test.mjs` | Add pass/fail fixtures for protocol gating, conflict table, REUSE correlation and Fidelity End applicability. |
| `.claude/sources/live-flow-proof.test.mjs` | Extend coverage to Fidelity Start/End and fresh-tab hydration tokens. |
| `.workflows/upgrade/shared-fe/evidence-conflict-owner-runtime-gates.md` | Record approved revision and Apply evidence. |

Excluded: `.claude/fe/creativity/best-belief-source.md` already owns the correct authority law; editing it would duplicate wording without closing the execution gap. Excluded: all frontend/backend product source.

### ACCEPTANCE TESTS

| Gate | Required result |
|---|---|
| `node --test .claude/sources/skills.test.mjs .claude/sources/workflows.test.mjs .claude/sources/live-flow-proof.test.mjs` | All pass unsuppressed. |
| Protocol compatibility fixtures | Historical unmarked workflow remains valid; marked records fail missing evidence and pass complete evidence. |
| REUSE correlation fixtures | Missing owner row, mismatched owner and non-REUSE parity verdict fail. |
| Fidelity runtime fixtures | Applicable End without live proof fails; justified not-applicable passes; fresh-tab tokens remain present in both Fidelity skills/reference. |
| `node .claude/scripts/validate-workflows.mjs --root .workflows` | New workflow has no new error. Existing unrelated errors, if any, are reported and not claimed fixed. |
| `git diff --check` | Clean. |

### OUTPUTS

| Concept | Result |
|---|---|
| Review revision | `shared-fe-evidence-conflict-owner-runtime-r2` freezes three independently approvable packages. |
| Migration | Changed from broad retroactive enforcement to `evidence-v1` phase/session protocol markers. |
| Canon ownership | Existing best-belief canon remains authoritative and unchanged; upgrades target execution and machine gates. |
| Production boundary | No FE/BE product source belongs to this upgrade. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/shared-fe/evidence-conflict-owner-runtime-gates.md` | Appended Review r2 only; no trust rule or product code changed. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve exact Upgrade Review r2? | Reply `approve upgrade r2, apply` to approve packages A+B+C and the listed write boundary; otherwise name a package to revise. |

### WARNINGS

| Warning | Impact |
|---|---|
| Full workflow tree already has unrelated historical validator failures. | Apply must prove new fixtures and classify old failures; it may not report the whole tree green unless it really is. |
| Protocol markers preserve history but old hand-written runs can remain unmarked. | Skill tests are the prevention gate for new procedure-driven runs; migration does not rewrite evidence history. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Enforce new tables retroactively on every workflow v2 phase | `evidence-v1` opt-in marker emitted by updated skills | Prevents unrelated historical records from becoming invalid while making every new compliant run enforceable. |
| Edit best-belief canon again | Keep canon; strengthen skills, workflow shape and validator | The canon already states beliefs are provisional and conflicts cannot be silent; execution was missing. |
| Require full Network + Terminal for every visual patch | Triggered runtime proof with explicit not-applicable evidence | Keeps the gate proportional while still catching shell/auth/hydration failures. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of packages A+B+C, exact paths and tests | User reply approving `shared-fe-evidence-conflict-owner-runtime-r2`. |
| Trust-tree mutations and gate implementation | `starci-fe-upgrade-apply` after approval. |
| Apply evidence and final validator classification | Apply phase appended to this workflow. |
