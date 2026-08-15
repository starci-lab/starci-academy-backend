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
| Repo / branch | D:\Repositories\starci-academy-backend / mtp |
| Purpose | Đề xuất lifecycle session ngắn cho fidelity: start, feedback, end và finalized, có thể tiếp nhận liên tục giữa các mốc. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\fidelity-session-lifecycle.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow proposal này; không sửa skill, canon hoặc production source. |

### Window

| Scope | Value |
|---|---|
| Records | Toàn bộ `.workflows/*/*/*.md` hiện có trong Source |
| Evidence rule | Chỉ đọc các bảng `REJECTED`; các dòng `None`, `not recorded` không phải witness. |
| Direct user instruction | Yêu cầu hiện tại về `start`, `feedback`, `end`, `finalized` được ghi riêng là user-directed, không nâng thành historical refusal. |

### Refusal groups

| Group | Refusals / witnesses | Rule at the time | Missing law | Home |
|---|---|---|---|---|
| Boundary drift during a run | `designs/nivo/provisioning-flows.md:553-553`: không bỏ qua `COMPONENT DELTA`/`PROPS DELTA`; `designs/nivo/provisioning-flows.md:637-637`: phát hiện owner mới phải mở Review; `designs/nivo/provisioning-flows.md:445-445`: phải xác nhận cả backend và FE boundary | Apply/Review không được tự mở rộng boundary | Khi feedback phát hiện boundary mới, ghi ngay vào session, sửa nếu vẫn trong boundary; nếu vượt boundary thì ghi finding và tiếp tục session ở trạng thái chờ quyết định, không mất context | `starci-fe-fidelity-*` PROCESS và `skill-shape.md` session protocol |
| Immediate evidence and closure | Chưa có đủ hai refusal trực tiếp về `start/end/finalized`; đây là WATCHED theo yêu cầu người dùng | Các skill hiện tại chỉ có Plan → Review → Apply và feedback loop trong Review | Mỗi session phải có mốc mở, feedback append-only, end summary + related-bug scan, và finalized mới được đóng | `starci-fe-fidelity-plan`, `starci-fe-fidelity-review`, `starci-fe-fidelity-apply`; nếu áp dụng mọi capability thì `skill-shape.md` |

### Proposed session protocol

| Event | Required action | May continue? | Closure condition |
|---|---|---|---|
| `start` | Tạo hoặc append session vào cùng workflow; ghi CONTEXT, binding evidence, comparison identity, owner và current status. | Có; nhận feedback liên tục trong cùng session. | Chưa đóng session. |
| `feedback` | Append feedback ngay khi nhận; phân loại `within-boundary`, `new-finding` hoặc `blocked`; nếu within-boundary thì sửa/prove ngay trong session hiện tại. | Có; không bắt người dùng mở lại task từ đầu giữa các mốc. | Chưa đóng session. |
| `end` | Append session summary, changed/proved claims, unresolved items và quét related bugs trong cùng state; route finding mới về capability owner nếu cần. | Có; feedback mới sau `end` mở continuation revision, không tạo workflow file thứ hai. | Chỉ finalized mới đóng. |
| `finalized` | Append final evidence, accepted/rejected/owed tables và explicit closure marker; không nhận thêm feedback vào session đã finalized. | Không; feedback mới mở continuation session liên kết tới session trước. | Session được coi là đã kết thúc. |

### Boundary decision

| Decision | Proposal | Alternative | Reason |
|---|---|---|---|
| Phạm vi thay đổi | Sửa ba fidelity skills và thêm protocol fidelity-specific; giữ Plan/Review/Apply làm execution roles bên dưới session events. | Sửa `skill-shape.md` để mọi capability dùng chung session protocol. | Yêu cầu hiện tại chỉ nhắm fidelity; thay đổi global sẽ ảnh hưởng backend/data/design workflow ngoài scope. |
| Feedback handling | Feedback trong boundary được sửa ngay và append proof trong cùng session. | Gom feedback chờ Review kế tiếp. | Đúng yêu cầu “feedback phải sửa ngay” và tránh session dài nhưng không có trạng thái thật. |
| Related bugs | `end` bắt buộc quét related bugs, nhưng chỉ route/record; không tự mở scope production. | Sửa luôn mọi related bug. | Giữ boundary và tránh biến fidelity repair thành redesign/feature work. |

### Acceptance evidence

| Claim | Proof |
|---|---|
| `start` ghi session | Một workflow fidelity mới có session id, timestamp/status và CONTEXT trước evidence/proof. |
| Feedback không làm mất continuity | Hai feedback liên tiếp append vào cùng workflow/session; feedback within-boundary có diff/proof ngay sau entry. |
| `end` tìm related bugs | Record có related-bug scan, classification và routing/None rõ ràng. |
| `finalized` đóng session | Record có final evidence, `finalized` marker và không còn owed chưa được phân loại. |
| Không tạo record trùng | Validator và kiểm tra path chứng minh continuation dùng cùng workflow file. |

### WATCHED

| Item | What would make it a rule |
|---|---|
| Người dùng yêu cầu lifecycle `start → feedback → end → finalized` | Ít nhất một run tiếp theo bị từ chối vì skill không ghi session, không xử lý feedback ngay hoặc không scan related bugs ở `end`. |

### OUTPUTS

| Concept | Result |
|---|---|
| Fidelity session protocol | Đề xuất lifecycle ngắn có continuity giữa các mốc, immediate feedback repair, related-bug scan và explicit finalization. |
| Boundary-drift rule | Đã có nhóm witness lịch sử đủ mạnh để đề xuất ghi finding và route boundary mới trong cùng session. |
| User-directed lifecycle | Được ghi là WATCHED, chưa giả định là historical rule vì thiếu hai refusal trực tiếp. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/fidelity-session-lifecycle.md` | added — upgrade proposal; chưa sửa skill/canon. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Có muốn áp dụng protocol này chỉ cho fidelity hay nâng thành protocol chung trong `skill-shape.md`? | Chỉ fidelity (khuyến nghị); mọi capability |

### WARNINGS

| Warning | Impact |
|---|---|
| Historical refusals chưa có hai witness trực tiếp cho `start/end/finalized`. | Không được trình bày lifecycle mới như rule đã được chứng minh bởi lịch sử. |
| `finalized` cấm append vào session đã đóng. | Feedback phát sinh sau đó phải mở continuation revision có liên kết, nếu không sẽ mất trace. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | Chưa có proposal nào bị user từ chối trong upgrade này. |

### OWED

| Owed | Cleared by |
|---|---|
| User chọn fidelity-only hoặc global protocol | Trả lời NEED APPROVALS; sau đó chuyển sang `starci-fe-upgrade-review`. |
| Chuyển proposal thành wording/file boundary cụ thể | Review challenge và approve một revision duy nhất. |

## review

Approved revision: session-lifecycle-v1-global

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
| Repo / branch | D:\Repositories\starci-academy-backend\.claude / main |
| Purpose | Chốt wording và boundary cho session lifecycle toàn cục trước khi sửa trust tree. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\fidelity-session-lifecycle.md |
| Language | vi |
| Phase | review |
| Touching | Workflow review này; chưa sửa trust tree trong Review. |

### Review verdict

| Proposal | Witness / authority | Approved wording | Home | Test obligation | Write boundary | Status |
|---|---|---|---|---|---|---|
| Global session envelope | User explicitly selected “viết lại all”; historical boundary-drift witnesses in `designs/nivo/provisioning-flows.md` | User-facing lifecycle is `start → feedback* → end → finalized`. Internal Plan/Review/Apply responsibilities may continue as implementation roles, but must not force the user to restart context or wait at an artificial phase boundary. | `.claude/skill-shape.md` | Workflow validator accepts session fields and existing records remain valid. | `skill-shape.md`, validator, validator tests | APPROVED |
| Immediate feedback | Direct user instruction; boundary witnesses at rows 445, 553 and 637 of `designs/nivo/provisioning-flows.md` | Append feedback immediately. If it is inside the approved/authorized boundary, route to the responsible internal role and correct/prove it in the same session. If it expands scope or authority, record the finding and request only the new approval; do not discard session state. | `.claude/skill-shape.md` and every StarCi `SKILL.md` that states a contradictory stop/invite boundary | Search gate proves every StarCi skill points to the session lifecycle and no stale “invite sibling then stop” wording remains. | All `.claude/skills/starci-*/SKILL.md` files that contradict the protocol | APPROVED |
| End + related bugs | User-directed override; no fabricated historical witness | `end` appends summary, evidence, unresolved items and a bounded related-bug scan. Related findings are classified and routed; they are not silently added to production scope. | `.claude/skill-shape.md` | Validator requires end summary/related-bug field only for new session-format records. | `skill-shape.md`, validator, validator tests | APPROVED |
| Finalized closure | User-directed override; no fabricated historical witness | `finalized` is the only event that closes a session. Feedback after closure opens a continuation session linked to the finalized session. | `.claude/skill-shape.md` | Validator rejects append events after finalized within one session id and accepts linked continuation. | `skill-shape.md`, validator, validator tests | APPROVED |

### Exact operating model

| Event | Required record | Runtime behavior |
|---|---|---|
| `start` | Session id, status `open`, CONTEXT, binding request/evidence, authorized boundary | Start work immediately; internal role selection is automatic. |
| `feedback` | Timestamp/order, user feedback, classification, action/proof or approval needed | Fix immediately when in-boundary; otherwise ask only for the added authority. |
| `end` | Summary, evidence, owed work, related-bug scan and routing | Session remains resumable and can receive more feedback. |
| `finalized` | Final evidence, closure reason, unresolved items classified, continuation rule | Close the session; later work links a new continuation id. |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `session-lifecycle-v1-global` — global start/feedback/end/finalized envelope with internal role continuity. |
| Immediate correction rule | In-boundary feedback must be acted on and proved in the same open session. |
| Related-bug rule | `end` scans and routes related findings without silently widening production scope. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/fidelity-session-lifecycle.md` | modified — appended approved Review revision. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User explicitly approved global application with “viết lại all”. |

### WARNINGS

| Warning | Impact |
|---|---|
| `end/finalized` are user-directed and not backed by two historical refusals. | Apply must label the change as explicit owner direction, not evidence-derived law. |
| Destructive actions and new production scope still require their existing approvals. | “Fix feedback immediately” cannot override safety or authority boundaries. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Fidelity-only protocol | Global protocol | User answered “viết lại all”. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply trust-tree wording and validator support | `$starci-fe-upgrade-apply` implementing `session-lifecycle-v1-global`. |

## review revision 2

Approved revision: fidelity-session-v2

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
| Repo / branch | D:\Repositories\starci-academy-backend\.claude / main |
| Purpose | Thay revision global bằng bộ ba fidelity session đúng tên người dùng yêu cầu. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\fidelity-session-lifecycle.md |
| Language | vi |
| Phase | review |
| Touching | Workflow review này; trust-tree boundary được chốt cho Apply. |

### Review correction

| User correction | Result |
|---|---|
| “ý là sửa skills thành fidel start fidel end và fidel finalitiy” | Scope là riêng capability fidelity; ba skill canonical là `starci-fe-fidelity-start`, `starci-fe-fidelity-end`, `starci-fe-fidelity-finality`. |

### Approved wording and boundary

| Skill | Approved responsibility | Session behavior |
|---|---|---|
| `starci-fe-fidelity-start` | Mở session, ghi context/binding evidence/comparison/boundary, bắt đầu correction; mọi feedback trong boundary được append, sửa và prove ngay. | Session mở; có thể nhận nhiều `feedback` liên tục. |
| `starci-fe-fidelity-end` | Chạy proof cuối, ghi session summary và quét related bugs có giới hạn; related bug ngoài boundary chỉ được classify/route. | Session vẫn mở; feedback mới quay lại correction rồi chạy `end` lại. |
| `starci-fe-fidelity-finality` | Xác nhận end evidence, phân loại mọi owed item và append closure marker. | Đây là bước duy nhất đóng session; việc mới sau đó mở continuation session. |

### Exact write boundary

| Path | Action |
|---|---|
| `.claude/skills/starci-fe-fidelity-plan/` | rename to `starci-fe-fidelity-start/` and rewrite `SKILL.md` |
| `.claude/skills/starci-fe-fidelity-review/` | rename to `starci-fe-fidelity-end/` and rewrite `SKILL.md` |
| `.claude/skills/starci-fe-fidelity-apply/` | rename to `starci-fe-fidelity-finality/` and rewrite `SKILL.md` |
| `.claude/skill-shape.md` | add fidelity session exception without changing other capability trios |
| `.claude/INDEX.md` | replace fidelity trio/index narrative |
| `.claude/scripts/validate-workflows.mjs` | accept and validate fidelity `start/feedback/end/finality` sessions while preserving old Plan/Review/Apply records |
| `.claude/sources/workflows.test.mjs` | add twin tests for session order, end related-bug evidence and finality closure |
| Active trust-tree references to old fidelity skill names | update to new canonical names; historical claims remain history where no link breaks |

### Test obligation

| Proof | Expected |
|---|---|
| `npm test` from `.claude` | green |
| Workflow validator twin tests | new fidelity session accepted; invalid order/closure rejected; legacy v2 records remain accepted |
| `rg` old names | no active instruction or index routes to removed skill paths |
| `node scripts/validate-workflows.mjs --root ../.workflows` | no new error attributable to session migration |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `fidelity-session-v2` — fidelity-only `start/end/finality`, with continuous feedback inside an open session. |
| Global revision | Superseded before trust-tree writes. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/fidelity-session-lifecycle.md` | modified — appended corrected approved Review. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User explicitly named the three replacement skills. |

### WARNINGS

| Warning | Impact |
|---|---|
| Existing fidelity records use `plan/review/apply`. | Validator must preserve them as valid historical evidence. |
| `end` scans related bugs but does not authorize unrelated production edits. | Related findings outside the current boundary must be routed, not silently fixed. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `session-lifecycle-v1-global` | `fidelity-session-v2` | User clarified the change is specifically the three fidelity skills. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply `fidelity-session-v2` | Rename/rewrite skills, update references and pass trust gates. |

## apply

Applied revision: fidelity-session-v2
Baseline commit: 26e3bfd3209fd451915c55dc4ec1cc1cd223169f
Tracked diff: 26e3bfd3209fd451915c55dc4ec1cc1cd223169f..worktree

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
| Repo / branch | D:\Repositories\starci-academy-backend\.claude / main |
| Purpose | Áp dụng bộ ba fidelity Start, End và Finality cùng validator session liên tục. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\fidelity-session-lifecycle.md |
| Language | vi |
| Phase | apply |
| Touching | Ba fidelity skill, `skill-shape.md`, index/reference chủ động, workflow validator, twin tests và workflow record. |

### Applied lifecycle

| Event / skill | Result |
|---|---|
| `starci-fe-fidelity-start` | Mở session ngay, ghi binding/comparison/boundary và sửa feedback trong boundary liên tục. |
| `starci-fe-fidelity-end` | Rerun proof, ghi summary và bảng `RELATED BUGS`; session vẫn mở. |
| `starci-fe-fidelity-finality` | Kiểm tra End rồi ghi closure; việc sau closure phải mở continuation. |

### Verification

| Proof | Result |
|---|---|
| Trust fetch | `main` ahead 9, behind 0; không cần merge trước write. |
| `npm test` trong `.claude` | PASS — 186 tests, 0 failures. |
| Workflow twin tests | PASS — valid session, required related-bug scan, End-before-Finality và no-feedback-after-Finality. |
| `git diff --check` | PASS. |
| Workflow tree validator | Fidelity/upgrade migration không tạo lỗi mới; còn 4 lỗi pre-existing ở `designs/starci-academy/learn-branch.md` về COMPONENT/PROPS DELTA. |
| Old-name active reference scan | Không còn reference chủ động ngoài `docs/skills-audit-finalize.md`, là thư mục untracked/historical đã có từ trước và không bị sửa. |

### OUTPUTS

| Concept | Result |
|---|---|
| Fidelity lifecycle | Đã thay Plan/Review/Apply bằng Start/End/Finality với feedback liên tục trong session mở. |
| Session validation | Validator giữ record cũ và kiểm tra đúng thứ tự/trạng thái cho record fidelity mới. |

### CHANGES

| Tree | Details |
|---|---|
| `.claude/skills/starci-fe-fidelity-plan/` → `.claude/skills/starci-fe-fidelity-start/` | renamed and rewritten — session opening, immediate correction and feedback continuation. |
| `.claude/skills/starci-fe-fidelity-review/` → `.claude/skills/starci-fe-fidelity-end/` | renamed and rewritten — proof summary and related-bug scan without closure. |
| `.claude/skills/starci-fe-fidelity-apply/` → `.claude/skills/starci-fe-fidelity-finality/` | renamed and rewritten — final session closure only. |
| `.claude/skill-shape.md` | modified — fidelity session exception and event order. |
| `.claude/INDEX.md` | modified — canonical fidelity names and responsibilities. |
| `.claude/fe/creativity/INDEX.md` | modified — bounded-fix route points to Fidelity Start. |
| `.claude/skills/starci-fe-design-plan/SKILL.md` | modified — bounded-fix handoff points to Fidelity Start. |
| `.claude/skills/starci-workflow-drift-apply/SKILL.md` | modified — fidelity drift route points to Fidelity Start. |
| `.claude/scripts/validate-workflows.mjs` | modified — validates start/feedback/end/finality while preserving legacy phases. |
| `.claude/sources/workflows.test.mjs` | modified — added fidelity session twin tests. |
| `.claude/sources/skills.test.mjs` | modified — canonical lifecycle gate recognizes the fidelity exception. |
| `.workflows/upgrade/starci-academy/fidelity-session-lifecycle.md` | modified — recorded Plan, corrected Review and Apply proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Applied exactly the three fidelity names the user specified. |

### WARNINGS

| Warning | Impact |
|---|---|
| Existing fidelity workflow files remain in Plan/Review/Apply history. | They validate as legacy v2 evidence; new sessions use Start/Feedback/End/Finality. |
| `.claude/docs/` is an unrelated untracked tree containing historical old-name prose. | It was preserved and excluded from the active-reference claim. |
| Global workflow validation has four pre-existing Design Review errors. | The whole workflow root is not green, though the new trust tests and session cases are green. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Global session migration | Fidelity-only Start/End/Finality | User clarified the intended skill set before trust writes. |

### OWED

| Owed | Cleared by |
|---|---|
| None | None |
