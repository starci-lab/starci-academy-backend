<!-- starci-workflow: v2 -->
# global-ai-chatbot

## plan r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets: frontend and backend supplied by user |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe @ main |
| Purpose | Khóa business role, global entry, disclosure, chat states và nhận diện logo float cho StarCi AI chatbot. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\global-ai-chatbot.md |
| Language | vi |
| Phase | plan |
| Touching | workflow này và `.workflows\.previews\designs\starci-academy\global-ai-chatbot\plan-r1\index.html` |

### Business boundary from live evidence

| Decision | Frozen plan result | Evidence |
|---|---|---|
| Product role | StarCi AI là trợ giảng lập trình cho learner: giải thích khái niệm, cùng phân tích lỗi, gợi ý cách tiếp cận và ôn tập. | Backend global prompt tự nhận là “sharp and friendly tutor” trên toàn app; không có support/tool-action contract. |
| Not its job | Không phải customer support, founder/community DM, sales bot, app-control agent; không tuyên bố đã điều hướng, sửa code hay thao tác app; không làm hộ bài đánh giá. | Community/chat có owner riêng; content-AI hiện chỉ stream câu trả lời text và lưu turn. |
| Global meaning | Session anchorless thuộc raw user, `scope: global`, không tự đọc lesson/course/trang đang mở. | `ContentAiScope`, `createSession`, `prepareMessages` và gateway hiện hành. |
| Access | Chỉ mount ở product shell đã đăng nhập; auth pages không có FAB. | Gateway từ chối socket chưa authenticated; FE hiện chỉ có product nav ở route clusters. |
| Cost disclosure | Header/composer phải cho biết AI credit/quota và có trạng thái exhausted với upgrade/recovery CTA do Review khóa. | Backend charge `AiCeilSurface.Chatbot`; legacy chat đã phân loại quota exhaustion. |
| Safety disclosure | Copy ngắn: AI có thể sai, người học kiểm tra thông tin quan trọng; coach không thay learner đưa đáp án. | CTA/hierarchy canon và business role trên. |

### Existing capability and reuse inventory

| Area | Classification | Owner / consequence |
|---|---|---|
| Float trigger | NEW composite/leaf meaning | Logo speech-mark + sparkle phải có meaning `ai-chatbot`; không tái dùng `talents` Sparkles icon. |
| Global mount | EXTEND shell navigation mounting | Mount một lần cùng product chrome; `AppProviders` không trở thành visual owner. Review phải khóa owner dùng chung cho mọi route cluster. |
| Panel mechanics | REUSE `DrawerShell` | Right drawer desktop, full-width/bottom treatment mobile theo owner hiện có; focus trap, Escape, close và backdrop thuộc shell. |
| Chat panel/thread/composer | NEW block + overlay composition | Current FE chưa có AI chat owner; port behavior từ legacy, dịch sang current contract tree thay vì copy component architecture. |
| Sessions/history | Backend REUSE, FE NEW integration | Create/list/search/rename/archive/delete/touch/history đã có backend owner. |
| Streaming | Backend REUSE, FE NEW socket hook | `sessionId`, `streamId`, chunk/done/error và abort đã tồn tại. |
| AI quota | REUSE current quota query plus chatbot surface response | Trạng thái ready, pending, exhausted và failed phải được Review liệt kê chính xác. |

### Directions

| Direction | Product decision | First click / hierarchy | Trade-off |
|---|---|---|---|
| A — Copilot tập trung | Trợ giảng luôn sẵn sàng, ưu tiên tốc độ hỏi. | Click FAB mở thẳng conversation gần nhất; thread mới hiện 3 starter prompts; history nằm sau secondary control. | Ít chrome, phù hợp app-wide; quản lý nhiều thread kém nổi bật. |
| B — Workspace hội thoại | AI là không gian học dài hạn, conversation continuity là first-class. | Click mở panel rộng với history rail desktop và active thread; mobile rail gấp sau control. | Mạnh cho người dùng quay lại; nặng panel và tranh chiều rộng với nội dung học. |
| C — Coach theo ý định | AI là Socratic coach, định vị “gợi mở trước, đáp án sau”. | Click mở 4 intent cards rồi tạo thread theo intent; composer tự do vẫn luôn thấy. | Business rõ và an toàn hơn; thêm một bước trước câu hỏi đầu tiên. |

Direction A là đề xuất của Plan vì khớp yêu cầu “click vào thì chat global”, dùng đúng capability hiện có và thêm ít disclosure nhất. Chưa direction nào binding trước khi user chọn.

### Preview tracking

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `global-ai-chatbot/plan-r1` | `http://127.0.0.1:8099/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\global-ai-chatbot\plan-r1\index.html` | `130E409731373472EF88FAE708C7CC5F897DF353A4D988B3C584C88DE06F416F` | đang chờ |

| Runtime | Value |
|---|---|
| PID | `25792` |
| Port | `8099` |
| HTTP | `200` |
| Browser QA | 3 tabs switch correctly; 390px drawer width follows app width; no console errors. |

### Direction tracking

| Direction | Tab | Status |
|---|---|---|
| A | `A · Copilot tập trung` | đang chờ |
| B | `B · Workspace hội thoại` | đang chờ |
| C | `C · Coach theo ý định` | đang chờ |

### Required Review decisions

Review must freeze: exact global shell owner and authenticated route boundary; component/contract tree; new icon meaning and source mapping; desktop/mobile overlay geometry; session default/resume/new-thread behavior; history disclosure; composer and streaming/abort/retry states; quota pending/exhausted/failed states; accessibility labels/focus return; public-prop migrations; exact production and test file boundary.

### OUTPUTS

| Concept | Result |
|---|---|
| Business definition | StarCi AI is a global programming tutor/coach, explicitly not support, DM or an app-action agent. |
| Logo direction | Distinct speech-mark + sparkle float identity, implemented through the current icon system after Review approves its semantic name. |
| Product directions | Three implementation-feasible tabs: focused copilot, conversation workspace and intent-led coach. |
| Preview | One served tabbed HTML at `http://127.0.0.1:8099/`, responsive-checked. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/global-ai-chatbot.md` | added — Plan evidence, business boundary, directions and tracking. |
| `.workflows/.previews/designs/starci-academy/global-ai-chatbot/plan-r1/index.html` | added — disposable three-tab visual preview only. |
| `D:\Repositories\starci-academy-fe` | unchanged by this Plan. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn business direction để chuyển sang Design Review? | A — Copilot tập trung (recommended); B — Workspace hội thoại; C — Coach theo ý định. |

### WARNINGS

| Warning | Impact |
|---|---|
| GraphQL request descriptions for content-AI sessions are stale and omit `global` although service runtime accepts it. | Review/Apply must use runtime type/service evidence and either update description in a separately authorized backend boundary or record it as backend debt. |
| Current FE worktree already contains unrelated modified/untracked work. | Later Apply must baseline and preserve those changes; no overwrite or cleanup is authorized. |
| Legacy `ContentAiChatDrawer` presentational twin says its body is a placeholder, while the older connected chat block has the real behavior. | Review must port proven behavior, not treat the staged placeholder as production parity. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Reuse the current `talents` sparkle icon for chatbot | Add a unique `ai-chatbot` semantic meaning and map the approved mark | Closed icon vocabulary already assigns `talents` to exceptional-talent discovery. |
| Promise page-aware or course-aware grounding in a global thread | Label global as not reading the current page; surface context can only be a separately selected scoped session | Backend `global` is intentionally anchorless. |
| Promise navigation/search/app actions | Text tutoring only in r1 | No tool/action contract exists for a global session. |
| Mount visual chatbot inside `AppProviders` | Mount once in an approved product shell/chrome owner | Providers own contexts, not visual composition. |

### OWED

| Owed | Cleared by |
|---|---|
| User choice of A, B or C | Explicit direction selection. |
| Exact owner tree, prop migration, state matrix and production boundary | `$starci-fe-design-review`. |
| Production implementation, tests and live proof | `$starci-fe-design-apply` after one approved Review revision. |

## plan r2

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe @ main |
| Purpose | Revision 2 khóa đầy đủ context ladder và mọi trạng thái của StarCi AI trên đọc bài, selection, challenge và các surface còn lại. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\global-ai-chatbot.md |
| Language | vi |
| Phase | plan |
| Touching | workflow này và `.workflows\.previews\designs\starci-academy\global-ai-chatbot\plan-r2\index.html` |

### Corrected business definition

`Global chatbot` nghĩa là entry và active conversation có thể theo learner qua product routes. Nó
không có nghĩa mọi ask đều chạy `scope: global`. Mỗi câu hỏi lấy đúng một grounding theo surface
hiện tại; `global` chỉ là fallback khi không có content, task, challenge, quiz, foundation hoặc course.

| Priority | Surface state | Scope / anchor | Visible disclosure | Supported action |
|---|---|---|---|---|
| 1 | Đọc lesson/content | `content` + `contentId` | `Bài đọc · <title>`; có hành động mở rộng ra toàn course | Tóm tắt, giải thích, ví dụ, hỏi phần khó, course retrieval đã có owner ở legacy. |
| overlay | Bôi đen trong `[data-ai-selectable]` | Giữ surface anchor + selection, paragraph và heading ẩn trong question context | Quote sticky phía trên thread/composer; clear thủ công | `Hỏi trong chat này` là primary; `Tạo thread mới` là secondary born-archived tangent. |
| 2 | Personal-project task | `task` + `taskId` | `Task dự án · <title>` | Làm rõ brief, chia bước, phân tích trade-off; không tuyên bố task đã hoàn thành. |
| 3 | Coding challenge | `challenge` + `challengeId` | `Challenge · <title>` | Làm rõ đề, phân tích failing test, Socratic hint; không đưa full solution mặc định. |
| 4 | Flashcard quiz/deck | `quiz` + `quizId` | `Quiz · <deck>` | Giải thích/ôn sau policy assessment; live-mode availability phải được Review khóa. |
| 5 | Foundation resource | `foundation` + `foundationId` | `Foundation · <title>` | Giải thích mental model, ví dụ và kiểm tra hiểu biết. |
| 6 | Course surface không có lesson | `course` + `courseId` | `Toàn khóa · <course>` | Hỏi toàn course và tìm nội dung course nếu query owner tồn tại. |
| fallback | Dashboard/profile/catalog/community và surface không anchor | `global`, không id | `Toàn cục · không đọc trang hiện tại` | General programming tutor; không giả vờ biết course/page. |

`prefersCourseScope` là explicit widening từ lesson sang course. Mỗi ask chỉ gửi id thuộc scope đã
hiển thị; các id priority thấp hơn không được gửi kèm. Selection chỉ xuất hiện trong vùng được đánh
dấu, tối thiểu 3 và tối đa 600 ký tự; surrounding context tối đa 700 ký tự theo legacy evidence.

### Context-continuity directions

| Direction | Navigation while chat is open | Session/history behavior | Selection behavior | Trade-off |
|---|---|---|---|---|
| A — Continuous conversation + per-ask context (recommended) | Active conversation không reset; scope pill và notice đổi theo surface cho câu hỏi kế tiếp. | Thread theo learner qua navigation; user tự New conversation hoặc chọn history. | Append vào active chat mặc định; explicit New thread tạo born-archived tangent. | Liên tục và đúng evolution mới nhất của legacy; một conversation có thể chứa nhiều grounding nên disclosure phải rất rõ. |
| B — Thread per context | Navigation tự resume conversation gần nhất của content/task/challenge/quiz/foundation/course/global vừa đến. | History được phân vùng tuyệt đối theo anchor. | Selection thuộc thread của reading surface. | Dễ hiểu grounding nhưng đổi trang làm active thread đổi, phá flow global mà user yêu cầu. |
| C — Explicit context lock | Conversation giữ scope cũ; khi surface đổi hiện choice `Giữ context cũ` / `Dùng trang này`. | Không đổi grounding âm thầm; thread không reset. | Selection luôn hỏi append/fork trước khi mở composer. | Kiểm soát cao nhưng thêm friction trên mọi lần di chuyển và selection. |

### Complete state matrix

| State group | Required states | Binding response |
|---|---|---|
| Visibility | guest; authenticated product route; auth page; active mock interview/evaluated full-screen mode | Guest/auth page hidden. Product route visible. Evaluated live modes default hidden until Review proves a safe allowed list; coding challenge remains available as scoped hint tutor. |
| Trigger | rest; hover/focus; first-discovery label; pressed/open; hidden while conflicting overlay/full-screen mode | One semantic `ai-chatbot` mark, keyboard label `Mở StarCi AI`, focus returns to trigger on close. |
| Panel | opening; ready; desktop drawer; mobile full-width/bottom; close/Escape/backdrop | `DrawerShell` mechanics; one mounted visual owner, not `AppProviders`. |
| Session resolution | sessions pending; no session; latest session; exact deep link; history pending; history failed | Skeleton only in owned region; new thread is lazy-created; deep link wins once and is not auto-overridden. |
| Composer | empty; typed; selected-passage pinned; invalid/blank; creating session; sending | Blank disabled; question preserved on create failure; selection remains until explicit clear. |
| Stream | first-token pending; delta streaming; done; user scrolled up; abort; socket disconnect/reconnect; terminal error | Stop action while streaming; do not auto-scroll if learner moved up; keep partial answer; inline retry/reconnect outcome. |
| Quota/model | quota pending; credit available; exhausted; quota query failed; auto model; selected model unavailable | No fake remaining count; exhausted answer owns upgrade/quota CTA; model falls back only by backend-supported policy. |
| Context change | global→content; content→challenge; challenge→course; surface leaves anchor; widen lesson→course | Direction decides switch behavior; pill must match grounding of next ask before send. |
| Selection | selection too short; outside selectable owner; valid mouse/touch selection; append; new tangent; sticky follow-up; clear | Invalid selection draws nothing. Valid selection shows two actions and includes hidden paragraph/section context. |
| Conversations | list ready; search pending/empty/failed; rename; archive/unarchive; delete; action failure | Each mutation shows only its own pending state and recovers without dropping active thread. |
| Responsive/a11y | 390px; desktop; tab/state overflow; focus trap; screen-reader names; reduced motion | No horizontal body overflow; state selectors scroll; panel remains a named dialog/drawer with focus return. |

### Capability gaps and Review challenges

| Finding | Consequence for Review |
|---|---|
| Legacy comments state active conversation follows navigation, but session listing remains queried by current scope/anchor. | Freeze whether active thread remains visible outside the current scoped history list and how reopen chooses a session. |
| `saveTurn` persists only `contentId` per turn while task/challenge/quiz/foundation grounding is supplied to the stream. | Prove persisted history remains understandable after cross-context asks; do not invent turn-level context badges without backend data. |
| Legacy `quizId` is explicitly plumbed-but-dormant because route state never exposes it. | Quiz tab is a required state, but Apply cannot promise functional quiz grounding until Review names an exact target route owner and data producer or excludes it as owed backend/FE plumbing. |
| Global and scoped prompts stream text; no global app-action tool contract exists. | No promise of app navigation, automatic code change or completing challenges. |

### Preview tracking

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `global-ai-chatbot/plan-r2` | `http://127.0.0.1:8100/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\global-ai-chatbot\plan-r2\index.html` | `D84474EA95BBBEC3FC7ABFD449E4A680A5DA4E039B29984C8506F3D117FD6956` | đang chờ |

| Runtime | Value |
|---|---|
| Preview root | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\global-ai-chatbot\plan-r2` |
| PID / port | `60896` / `8100` |
| Browser QA | 3 directions × 8 state selectors switch client-side; state scope labels verified; 390px drawer follows app width; selection quote visible; no console errors. |

### Direction tracking

| Direction | Tab | Status |
|---|---|---|
| `continuous-per-ask-context` | `A · Liên tục + context theo câu hỏi` | đang chờ |
| `thread-per-context` | `B · Thread theo từng context` | đang chờ |
| `explicit-context-lock` | `C · Khóa context có xác nhận` | đang chờ |

### OUTPUTS

| Concept | Result |
|---|---|
| Corrected business model | Global availability + app-wide conversation, with one explicit context scope per ask rather than permanently global grounding. |
| Context ladder | Content, selection, task, challenge, quiz, foundation, course and global fallback are all represented with truthful capability boundaries. |
| State proof | Eight visual selectors plus complete visibility, async, stream, quota, session, mutation, responsive and accessibility matrix. |
| Revised directions | Product choice now compares context-continuity behavior, the missing decision raised by user feedback. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/global-ai-chatbot.md` | modified — appended Plan r2 business correction, direction model and complete state matrix. |
| `.workflows/.previews/designs/starci-academy/global-ai-chatbot/plan-r2/index.html` | added — disposable 3-direction × 8-state preview. |
| `D:\Repositories\starci-academy-fe` | unchanged by Plan r2. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn behavior khi learner đổi từ global → bài đọc → challenge mà chat vẫn đang mở? | A — giữ conversation, context đổi theo câu hỏi kế tiếp (recommended, đúng legacy evolution); B — tự chuyển thread theo context; C — khóa context đến khi xác nhận. |

### WARNINGS

| Warning | Impact |
|---|---|
| Quiz scope có backend shape nhưng legacy FE không bao giờ cấp `quizId`. | Review phải khóa producer thật hoặc đánh dấu quiz grounding chưa nằm trong production boundary đầu tiên. |
| Session list theo current scope nhưng active conversation được mô tả app-wide. | Nếu Review không giải quyết, history và active thread có thể mâu thuẫn sau navigation. |
| Live evaluated surfaces chưa có một policy duy nhất trong source. | Preview mặc định ẩn FAB trong mock interview/full-screen evaluated mode; Review phải chứng minh exact route allow/deny list. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Plan r1 chỉ minh họa global dashboard chat | Plan r2 có đủ bài đọc, bôi đen, challenge, task, quiz, foundation và runtime | User feedback: “rồi bôi đen thì sao, vô từng bài đọc, làm từng challenges thì sao??? xác định đủ state chứ”. |
| Hiểu `global chatbot` là mọi ask đều anchorless | Global entry + per-ask context ladder | Backend và legacy đều có surface grounding priority. |
| So sánh panel density/workspace/coach như quyết định chính | So sánh continuity model A/B/C | Context transition mới là quyết định làm behavior khác thật giữa các surface. |

### OWED

| Owed | Cleared by |
|---|---|
| User chọn context-continuity direction A, B hoặc C | Explicit direction selection trên preview r2. |
| Exact quiz producer, live-mode allow/deny list và cross-context session/history rule | `$starci-fe-design-review`. |
| Exact component/prop delta and production/test boundary | `$starci-fe-design-review` after direction selection. |

## plan r3

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe @ main |
| Purpose | Khóa Direction A cùng GitHub source viewer, sandbox-like file states và AI explanation grounded trên code trong lesson. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\global-ai-chatbot.md |
| Language | vi |
| Phase | plan |
| Touching | workflow này và `.workflows\.previews\designs\starci-academy\global-ai-chatbot\plan-r3\index.html` |

Selected direction: `continuous-per-ask-context`

Selection evidence: user trả lời “a” rồi yêu cầu thêm source code GitHub trong content để StarCi AI giải thích code. Direction B và C không còn là candidate cho Review; r3 chỉ mở composition của source surface bên trong Direction A đã chọn.

### Source-backed capability

| Capability | Existing owner | Plan consequence |
|---|---|---|
| Lesson declares source | `ContentEntity.isSandbox`, `githubBaseUrl`, `githubDir`, `backendUrl` | Current FE query must select only the fields needed to decide/render the source face. |
| Repository synchronization | `RepoSynchronizerService` | GitHub is build/sync-time origin; lesson open reads a stable MinIO snapshot, not live GitHub per request. |
| Public source delivery | MinIO public `repo/<repoName>/<githubDir>.json` | Non-premium source can fetch directly from CDN. |
| Premium source delivery | GraphQL `sandboxRepoUrl` | Backend verifies enrollment, then issues a short-lived presigned MinIO GET URL. Locked UI must never fetch the tree. |
| Sandbox runtime | Legacy `SandboxBody`, `SandpackPanel`, `useRepoSandpackFiles` | Proven file explorer, editable local editor, dependency extraction, preview, compile and reset behavior are parity evidence. |
| AI lesson grounding | `ContentAiService.loadFullCode` and content RAG | Backend already concatenates every relevant file; skips lockfiles, minified/vendor/node_modules; stuffs whole source inside budget and retrieves relevant code chunks above it. |
| Exact code selection | Existing `<display>/<context>` selection protocol can carry file path, line range and current local code | No new AI tool promise required; visible user message stays clean while selected code is hidden grounding for the next ask. |

### Corrected code-source business rules

| Rule | Frozen result |
|---|---|
| Source identity | Header shows lesson/source identity and active file path; never claims the snapshot is live GitHub HEAD. |
| Edit ownership | Sandpack edits are local and ephemeral. They do not commit, push or alter GitHub/MinIO. Reset restores the synced lesson snapshot. |
| AI on untouched source | `contentId` gives the AI prose plus full synced source; selected file/line narrows the question. |
| AI on edited source | The current selected code text, path and line range are embedded in the next question context, overriding stale snapshot text for that explanation. |
| Preview errors | Compile/runtime error belongs to sandbox preview and can itself be selected/asked about; article and chat remain usable. |
| Missing source | When `isSandbox=false` or source config is absent, Source tab is absent at rest; no empty tab/control. |
| Source fetch failure | Source panel owns retry and error; reading body remains available independently. |
| Premium lock | Locked reader does not fetch source or expose file names; entitlement CTA remains owned by the lesson paywall. |
| Mobile | File tree compresses/collapses; editor leads; preview becomes a secondary view; AI uses bottom/full-width overlay without covering the active line selection before action. |

### Composition directions inside selected A

| Direction | Reading order / composition | AI interaction | Trade-off |
|---|---|---|---|
| A1 — Source as lesson face (recommended) | Existing `ContentTabRow`: Bài đọc → Source code → Challenge. Source face owns file explorer + editable editor + live preview. | Select lines or file, press `Giải thích đoạn này`, append to active Direction-A conversation with `content` scope. | Closest to legacy Sandbox and current face architecture; prose and source are not visible simultaneously. |
| A2 — Prose then source on one face | Short lesson summary/article remains above a shorter workspace in the same reading flow. | Same file/line context action. | Keeps prose visible but makes long lessons and mobile scroll heavy; source error becomes part of reading face. |
| A3 — Full code workspace | Source face switches reader to a full-workspace composition with minimized article chrome and expanded editor/preview. | Code selection and AI drawer become primary peers. | Best for long labs but adds a new full-bleed shell state and moves farthest from ordinary content reading. |

### Complete source state matrix

| Group | Required states | Response |
|---|---|---|
| Availability | sandbox source; prose-only lesson; config absent; premium locked | Render Source face only when authorized source capability exists; no dead tab. |
| Transport | metadata pending; file-map pending; public CDN ready; presign pending; presign refused; CDN/JSON failed; retry | Source skeleton stays in source geometry; article transport does not block on repo files. |
| Explorer | collapsed folders; active file; long path; unsupported/binary/empty file; package.json removed into dependencies | Show source files only; preserve path identity; dependencies feed Sandpack rather than drawing as code by default. |
| Editor | ready; local edited; unsaved indicator; reset pending/done; selected lines; selection cleared; very large file | Local edits remain browser-only; selected range stays stable until ask/clear. |
| Preview | compiling; ready; compile error; runtime error; mock API unavailable; refresh/reset; mobile hidden/secondary | Error stays visible and askable; does not destroy editor state. |
| AI | whole-source lesson ask; file ask; selected-range ask; edited-range ask; compile-error ask; streaming/abort/error/quota | Context pill names lesson + source; source chip names path/range; edited text accompanies the ask. |
| Navigation | source→reading; source→challenge; file switch while chat open; route change while streaming | Direction A keeps conversation; next ask uses visible current context; abort policy is unchanged. |
| Responsive/a11y | desktop three-pane; tablet two-pane; mobile editor-first; keyboard file tree; line-selection announcement; focus return | File navigation and explain action are keyboard reachable; source/path are announced, not only syntax-colored. |

### Reuse inventory

| Area | Classification | Result |
|---|---|---|
| `ContentTabRow` | EXTEND | Add semantic `source` face/action; preserve reading/challenge axes and omit row when no choice. |
| Content reader page | EXTEND | Select source metadata, own active face and keep article/source failures independent. |
| Source file fetch | PORT/EXTEND legacy behavior | Current FE has no `useRepoSandpackFiles` or `sandboxRepoUrl` query; Review must name exact final owners. |
| Sandpack workspace | NEW in current FE, parity from legacy | Recreate through current contract/tree architecture, not by copying legacy JSX wholesale. |
| StarCi AI code selection | EXTEND selection context | Add code-specific producer; reuse active conversation, stream/session/quota owners from selected Direction A. |
| Drawer/chat mechanics | REUSE | No second chatbot or source-only chat thread. |

### Preview tracking

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `global-ai-chatbot/plan-r3` | `http://127.0.0.1:8101/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\global-ai-chatbot\plan-r3\index.html` | `343152F156B56E165F8617B2B07CF3716EEC6DCE010D48570B318E6E7A9C3A57` | đang chờ |

| Runtime | Value |
|---|---|
| Preview root | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\global-ai-chatbot\plan-r3` |
| PID / port | `7520` / `8101` |
| Browser QA | 3 composition tabs and 10 source states switch client-side; local-edit and compile-error states verified; 390px editor-first geometry has no body overflow; no console errors. |

### Direction tracking

| Direction | Tab | Status |
|---|---|---|
| `source-lesson-face` | `A1 · Source là một lesson tab` | đang chờ |
| `prose-source-flow` | `A2 · Prose + source song song` | đang chờ |
| `full-code-workspace` | `A3 · Full code workspace` | đang chờ |

### OUTPUTS

| Concept | Result |
|---|---|
| Context continuity | Direction A is selected: one conversation follows learner, next ask uses visible surface/source context. |
| Source pipeline | GitHub-origin lesson code is rendered from synchronized MinIO snapshots with public/premium entitlement paths already owned by backend. |
| AI code tutor | StarCi AI explains whole lesson code, active file, selected lines, local edits and sandbox errors without claiming to modify GitHub. |
| Source directions | A1 tabbed source face, A2 prose-plus-source flow and A3 full workspace are implementation-feasible choices. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/global-ai-chatbot.md` | modified — appended Direction-A selection, source capability evidence, composition directions and state matrix. |
| `.workflows/.previews/designs/starci-academy/global-ai-chatbot/plan-r3/index.html` | added — disposable 3-direction × 10-state source/AI preview. |
| `D:\Repositories\starci-academy-fe` | unchanged by Plan r3. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn composition cho Source code trong lesson? | A1 — Source là lesson tab, editable local sandbox (recommended, closest legacy); A2 — prose + source cùng flow; A3 — full code workspace. |

### WARNINGS

| Warning | Impact |
|---|---|
| Current FE content query intentionally omits sandbox metadata and has no repo file/presign integration. | Review must add exact query/type/hook/component boundary; source cannot be implemented as a pure visual-only change. |
| Backend whole-source grounding reads the synchronized snapshot, not unsaved Sandpack edits. | Every AI ask about edited code must include selected current code text; asking vaguely about all unsaved edits is not supported without a larger protocol. |
| Sandpack external resources and mock API can fail independently of MinIO source. | Preview/runtime error states must not be collapsed into source fetch failure. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Context Direction B and C from r2 | Direction A | User explicitly selected “a”. |
| Fetch live GitHub on every lesson open | Read synchronized MinIO snapshot | Existing backend already owns stable, entitlement-aware repo delivery and AI RAG indexing. |
| Treat editor edits as GitHub writes | Local ephemeral Sandpack edits with Reset | No commit/push capability is authorized or implemented. |
| Separate source-only AI chat | Reuse the one active Direction-A conversation with source context | User asked StarCi AI to explain code, not a second assistant/thread system. |

### OWED

| Owed | Cleared by |
|---|---|
| User chooses source composition A1, A2 or A3 | Explicit selection on Plan r3. |
| Exact component/prop delta, source query fields, presign/fetch owners and code-selection protocol | `$starci-fe-design-review`. |
| Runtime proof against one real sandbox lesson, premium lock and edited-code ask | `$starci-fe-design-apply` after approved Review revision. |

## plan r4 — A1 selection closure and Code coach correction

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe @ main |
| Purpose | Close A1 and correct the preview so StarCi AI visibly behaves as a code-aware coach across source states. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\global-ai-chatbot.md |
| Language | vi |
| Phase | plan |
| Touching | this workflow and `.workflows\.previews\designs\starci-academy\global-ai-chatbot\plan-r3\index.html` only |

Selected direction: `source-lesson-face` (A1).

Selection evidence: user said “chốt … làm đi” after A1 was recommended, then rejected the unchanged AI treatment with “sao cái starci ai không thay đổi gì hết vậy??”. The composition remains A1; the correction is that StarCi AI must expose a distinct code-coach experience rather than merely relabeling the existing chat bubbles.

### Corrected StarCi AI behavior

| State / surface | Frozen visible behavior |
|---|---|
| Mode | Drawer exposes `Chat chung`, selected `Code coach`, and `Lịch sử`; the one active conversation remains shared rather than creating a second source-only chatbot. |
| Context | Next ask shows an ordered stack: lesson, active file, then optional selected range. Context is removable/narrowable before send. |
| Ready | Code coach names the active file and offers source-specific quick actions. |
| Selected lines | `Giải thích selection` is primary; path, line range and current code are attached to the next ask. |
| Local edits | `Review local edits` compares selected current browser text with the synchronized snapshot and explicitly says edits are not written to GitHub. |
| Compile/runtime error | `Debug preview` attaches the visible error and source location without collapsing it into source transport failure. |
| Explaining | Stream state says it is reading selection/runtime, exposes stop, preserves partial answer and keeps the active context visible. |
| Loading / failed | Code actions are unavailable while lesson chat remains available; the drawer states that source context is not ready. |
| Absent / locked | No file names leak; Code coach explains why source grounding is unavailable while ordinary lesson chat remains usable. |
| Mobile | AI becomes a bottom sheet with a compact horizontal context stack; editor selection remains visible before the learner opens/raises the sheet. |

### Preview tracking

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `global-ai-chatbot/plan-r3` revision 4 | `http://127.0.0.1:8101/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\global-ai-chatbot\plan-r3\index.html` | `26CECAAD4AA5A075752AAADE96362F15FFFE62F748417258E1394E96E470F3B3` | A1 selected; ready for Review |

| Runtime | Value |
|---|---|
| Preview root | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\global-ai-chatbot\plan-r3` |
| PID / port | `7520` / `8101` |
| Browser QA | Code coach mode and Lesson → File → Selection stack render in all three preview copies; selected, edited, compile-error, loading and locked states each switch the AI-owned response; 390px has no body overflow; console errors: none. |

### Direction tracking

| Direction | Tab | Status |
|---|---|---|
| `source-lesson-face` | `A1 · Source là một lesson tab` | selected |
| `prose-source-flow` | `A2 · Prose + source song song` | rejected |
| `full-code-workspace` | `A3 · Full code workspace` | rejected |

### OUTPUTS

| Concept | Result |
|---|---|
| Selected composition | A1: Reading → Source Code → Challenge, with an editable local sandbox in the Source face. |
| AI product correction | StarCi AI has a distinct Code coach mode, ordered code context and source-state-specific actions. |
| Conversation model | Direction A remains frozen: one active conversation follows navigation; each next ask uses the visible surface context. |
| Review handoff | Exact component tree, props migration, source transport owners and route visibility policy are now the remaining decisions. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/global-ai-chatbot.md` | modified — records A1 selection and the corrected Code coach behavior. |
| `.workflows/.previews/designs/starci-academy/global-ai-chatbot/plan-r3/index.html` | modified — adds AI modes, context stack, code quick actions and state-specific AI cards. |
| `D:\Repositories\starci-academy-fe` | unchanged by Plan r4. |

### NEED APPROVALS

| Question | Result |
|---|---|
| Plan direction | None: A1 is selected. Continue to `$starci-fe-design-review` and request approval only for its exact production revision. |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend grounding knows the synchronized snapshot, not every unsaved editor buffer. | Review must freeze the exact selected-code payload; “review all local edits” cannot silently imply a repository-wide diff protocol. |
| Code coach mode is a frontend disclosure mode, not a new backend model/tool. | Apply must reuse Content AI sessions/streaming and avoid inventing unsupported autonomous code changes. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Keep the old generic drawer and only change its context label | Distinct Code coach mode, context stack and state-specific actions | User explicitly rejected an AI surface that appeared unchanged. |
| A2 prose/source flow | A1 source lesson face | User closed the choice on A1. |
| A3 full workspace | A1 source lesson face | User closed the choice on A1 and legacy parity favors ContentTabRow/Sandbox composition. |

### OWED

| Owed | Cleared by |
|---|---|
| Exact page/layout/overlay/block/composite/branch/leaf/shell tree and all public-prop migrations | `$starci-fe-design-review`. |
| Exact source query, presign/fetch, Sandpack, code-selection and Content AI session/stream file boundary | `$starci-fe-design-review`. |
| Production implementation and real lesson runtime proof | `$starci-fe-design-apply` after explicit Review approval. |

## review r1 — candidate

Candidate revision: `global-ai-chatbot-source-face-code-coach-r1`

This is not approved yet. It is the exact production boundary proposed for user approval.

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe @ main |
| Purpose | Review A1 lesson Source face plus a genuinely code-aware global StarCi AI before production changes. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\global-ai-chatbot.md |
| Language | vi |
| Phase | review |
| Touching | this workflow only; target source is read-only during Review |

### Review verdict

| Question challenged against live source | Frozen result |
|---|---|
| Where can the chatbot mount without losing the active conversation on nested route changes? | The locale root mounts one `GlobalAiChatLayout` through existing `RouteShell`; `AppProviders` remains provider-only and `ShellNav` remains route-cluster chrome. |
| Is AI another lesson face? | No. The disabled `ai` face is removed. AI is global FAB + drawer; Source is the new lesson face. |
| How is context resolved? | Route parser produces `content > task > challenge > foundation > course > global`; quiz live attempts and other evaluated full-bleed routes hide AI. No unsupported quiz anchor is claimed. |
| How does code reach AI? | Synced snapshot grounds the content on the backend. The next ask additionally embeds active path, selected line range, selected current editor text, local-edit flag and optional visible runtime error inside the question context. No new backend protocol or GitHub write is claimed. |
| How is the sandbox editable without coupling AI to vendor DOM? | A custom CodeMirror editor drives the Sandpack provider/preview. Its controlled selection API produces line ranges; AI never scrapes `.cm-line` or Sandpack internals. |
| What persists? | One backend Content-AI session persists turns. The active session remains in the root layout across client navigation; a full reload resolves the requested `chatSession` query parameter, otherwise the latest matching session, otherwise creates lazily on first send. |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | `LocaleLayout` | MODIFY | `src/app/[lang]/layout.tsx` | same | Next locale root; wraps existing routed children | existing `RouteShell` boundary | Mount one client layout that survives nested navigation without putting visuals in `AppProviders`. |
| layout | `GlobalAiChatLayout` | ADD | — | `src/components/layouts/GlobalAiChatLayout/index.tsx` | `LocaleLayout` through `RouteShell` | `global-ai-layout` | Own authenticated visibility, route context, active conversation identity, FAB/open state and the one visual host. |
| overlay | `StarCiAiDrawer` | ADD | — | `src/components/overlays/ai/StarCiAiDrawer/index.tsx`; `component.tsx` | `GlobalAiChatLayout` | `starci-ai-drawer-column` | One covering panel owns drawer composition while `DrawerShell` keeps focus/backdrop mechanics. |
| block | `StarCiAiChat` | ADD | — | `src/components/blocks/ai/StarCiAiChat/index.tsx`; `component.tsx` | `StarCiAiDrawer` | `starci-ai-chat-column`, `starci-ai-mode-row`, `starci-ai-context-stack`, `starci-ai-turn-list`, `starci-ai-composer` | Resolve sessions/history/quota/stream once and render General, Code coach and History disclosures without a duplicate chatbot. |
| block | `StarCiAiFab` | ADD | — | `src/components/blocks/ai/StarCiAiFab/component.tsx` | `GlobalAiChatLayout` | `floating-ai-trigger` | Give the global entry one semantic logo, keyboard name and open action. |
| block | `StarCiAiSelectionAsk` | ADD | — | `src/components/blocks/ai/StarCiAiSelectionAsk/index.tsx`; `component.tsx` | `GlobalAiChatLayout`; selectable `Article` and source editor roots | `selection-ai-actions` | Validate 3–600 character selections and offer append-to-active or explicit new archived tangent. |
| page | `CourseLearnContentPage` connected/pure twin | MODIFY | `src/components/pages/CourseLearnContentPage/index.tsx`; `component.tsx` | same | content detail route and existing tests | existing `course-learn-content-page` plus `source-workspace-grid` slot | Own `reading/source` face state, source transport state and independent article/source failures. |
| block | `ContentTabRow` | MODIFY | `src/components/blocks/learn/ContentTabRow/component.tsx` | same | `CourseLearnContentPage` and its test | existing `dual-tabs-toolbar` | Replace dead AI face dispatch with the selected Source face while retaining challenge navigation. |
| block | `ContentSourceWorkspace` | ADD | — | `src/components/blocks/learn/ContentSourceWorkspace/component.tsx` | `CourseLearnContentPage` | `source-workspace-grid`, `source-workspace-toolbar` | Draw ready/loading/failed/locked source geometry and hand runtime mechanics to the Sandpack shell. |
| branch | `SourceFileTree` | ADD | — | `src/components/branches/SourceFileTree/index.tsx` | `ContentSourceWorkspace` through `SandpackShell` | `source-file-list`, `source-file-row` | Own path/folder disclosure and keyboard file activation rather than leaking tree logic into the page. |
| leaf | `Article` | MODIFY | `src/components/leaves/Article/index.tsx` | same | content reader, problem reading column, foundation resource, playground session | leaf metadata stays `article` | Expose an opt-in semantic selection root for AI without making every rendered article selectable. |
| leaf | `Icon` | MODIFY | `src/components/leaves/Icon/index.tsx`; `icon.md` | same | `StarCiAiFab`, drawer/chat heading, existing icon consumers unchanged | leaf metadata stays `icon` | Add one `aiChatbot` meaning and purpose-drawn StarCi speech/code mark; do not reuse `talents` sparkles. |
| shell | `DrawerShell` | MODIFY | `src/components/shells/DrawerShell/index.tsx` | same | existing `CartDrawer`; new `StarCiAiDrawer` | shell remains an untyped body hole | Allow right desktop and bottom mobile placement while preserving vendor focus, Escape, backdrop and close behavior. |
| shell | `SandpackShell` | ADD | — | `src/components/shells/SandpackShell/index.tsx` | `ContentSourceWorkspace` | mechanics shell; interior uses `source-workspace-grid` | Wrap `SandpackProvider`, custom CodeMirror editor state and `SandpackPreview` once; no page or block imports vendor sandbox primitives. |
| layout | `LearnShellLayout` | MODIFY | `src/components/layouts/LearnShellLayout/index.tsx` | same | `/courses/[displayId]/learn` route layout | existing learn shell contract | Consume one shared full-bleed/evaluated-route predicate so shell geometry and AI visibility cannot drift. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| `LocaleLayout` | routed composition | KEEP | `children` under `AppProviders` | same routed child converted by `RouteShell` into `GlobalAiChatLayout.surface` | Next locale route only | No public route prop changes; existing messages/theme providers remain above the new frame. |
| `GlobalAiChatLayout` | `GlobalAiChatLayoutProps` | ADD | — | `{ readonly surface: ComponentType }` | `RouteShell` | Matches existing `RouteFrameProps`; no React `children` hole below the shell. |
| `GlobalAiChatLayout` | context API | ADD | — | `{ anchor, codeContext, isOpen, open, close, setCodeContext, clearCodeContext, startTangent }` | drawer, selection block, content source page | Provider is private to this layout; consumers use exported hook that throws outside owner. |
| `_StarCiAiDrawer` | state/data/actions | ADD | — | states `closed/pending/ready/failed`; data `{isOpen, placement, title, description}`; actions `{dismiss}`; connected twin renders `StarCiAiChat` | connected overlay and layout | Open flag stays with layout; overlay neither duplicates chat data nor owns route context. |
| `_StarCiAiChat` | state union | ADD | — | `sessionsPending/noSession/historyPending/ready/streaming/quotaExhausted/failed` | connected `StarCiAiChat` | Every async owner maps to one explicit state; partial answer is data in `streaming/failed`. |
| `_StarCiAiChat` | data/actions | ADD | — | resolved labels, mode, context chips, sessions, turns, draft, quota; actions for mode/session/search/rename/archive/delete/draft/send/stop/retry/clear-context | connected twin | Pure twin receives no router, SWR, socket, auth or translation objects. |
| `StarCiAiFab` | `StarCiAiFabProps` | ADD | — | `{ props: {label, isOpen, hasUnread?}, on?: {press?}, isLoading? }` | `GlobalAiChatLayout` | Closed semantic data fence; no className or arbitrary icon prop. |
| `_StarCiAiSelectionAsk` | selection/action API | ADD | — | states `hidden/ready`; data `{quote, appendLabel, tangentLabel, position}`; actions `{append,tangent,dismiss}` | connected selection listener | Connected twin alone reads `Selection`/range geometry and only inside `[data-ai-selectable=true]`. |
| `CourseLearnContentPage` | local face state | ADD | hard-coded `selectedFace: "reading"` | connected `ContentFaceId` state, reset to `reading` when `contentId` changes | content route | Source fetch starts only after `source` is selected; challenge remains routed rather than inline. |
| `_CourseLearnContentPage` | `CourseLearnContentPageData` | ADD | article/challenge faces only | optional `sourceState` and `source: ContentSourceWorkspaceData` | connected page | Source fields absent for prose-only or unauthorized content; article props remain independently available. |
| `_CourseLearnContentPage` | `CourseLearnContentPageActions` | REMOVE | `selectAi?: () => void` | — | connected page; tests | `rg selectAi` is empty after migration. |
| `_CourseLearnContentPage` | `CourseLearnContentPageActions` | ADD | — | `selectSource?: () => void`, `source?: ContentSourceWorkspaceActions` | connected page | Pure page dispatches only from the Source face/workspace. |
| `ContentTabRow` | `ContentFaceId` | RETYPE | `"reading" | "challenge" | "ai"` | `"reading" | "source" | "challenge"` | page and block tests are the only live consumers found by `rg ContentFaceId/selectAi`. |
| `ContentTabRow` | actions | RENAME | `selectAi?` | `selectSource?` | page and block tests | Dispatch table handles `source`; `ai` literal and action are absent after migration. |
| `ContentSourceWorkspace` | state/data/actions | ADD | — | states `pending/ready/failed`; data `{files, dependencies, activePath, editedPaths, runtimeError?, labels}`; actions `{activateFile,updateFile,reset,selectCode,askError,retry}` | content page | Locked/absent suppress the face before this block; fetch failure alone maps to `failed`. |
| `SourceFileTree` | data/actions | ADD | — | `{props:{label,files,activePath}, on?:{activate?}, isLoading?}` | source workspace | Paths are stable ids; binary/unsupported entries never enter `files`. |
| `Article` | `ArticleData.aiSelectable` | ADD | — | optional boolean, default `false`; true writes `data-ai-selectable="true"` on root | content reader, `ProblemReadingColumn`, foundation resource opt in; playground remains false | Existing four call sites compile unchanged; only the three grounded learning surfaces opt in. |
| `Icon` | `IconName` | ADD | closed union without chatbot identity | adds `"aiChatbot"` mapped in `GLYPHS` and documented in `icon.md` | FAB and AI drawer/chat | Existing meanings/glyphs unchanged; map exhaustiveness proves both cuts exist. |
| `DrawerShell` | placement API | RENAME | `side?: "left" | "right"` | `placement?: "left" | "right" | "bottom"`, default `right` | `CartDrawer` passes neither; StarCi drawer passes responsive placement | `rg side=` has no current DrawerShell call site; type and shell test prove migration. |
| `SandpackShell` | runtime API | ADD | — | `{props:{files,dependencies,activePath,template}, on?:{activateFile,updateFile,selectionChange,runtimeError,reset}}` | source workspace | Vendor imports exist only in this shell; CodeMirror selection emits path/range/current text without DOM scraping. |
| `LearnShellLayout` | public props | KEEP | `{displayId,surface}` | unchanged | learn route `RouteShell` | Only internal `isFullBleed` calculation moves to shared predicate. |

### Exact supporting production boundary

| Group | Exact files |
|---|---|
| Root/context | MODIFY `src/app/[lang]/layout.tsx`; ADD `src/components/layouts/GlobalAiChatLayout/index.tsx`, `context.ts`, `index.test.tsx`; ADD `src/modules/ai/content-ai-route-context.ts`, `content-ai-route-context.test.ts`, `content-ai-selection-context.ts`, `content-ai-selection-context.test.ts`; ADD `src/modules/learn/is-live-assessment-route.ts`, `is-live-assessment-route.test.ts`; MODIFY `src/components/layouts/LearnShellLayout/index.tsx`. |
| Global AI UI | ADD `src/components/overlays/ai/StarCiAiDrawer/index.tsx`, `component.tsx`, `component.test.tsx`; ADD `src/components/blocks/ai/StarCiAiChat/index.tsx`, `component.tsx`, `component.test.tsx`; ADD `src/components/blocks/ai/StarCiAiFab/component.tsx`, `component.test.tsx`; ADD `src/components/blocks/ai/StarCiAiSelectionAsk/index.tsx`, `component.tsx`, `component.test.tsx`. |
| AI queries/types/hooks | ADD `src/modules/api/graphql/queries/query-content-ai-sessions.ts`, `query-content-ai-sessions.test.ts`, `query-content-ai-history.ts`, `query-content-ai-history.test.ts`, `types/content-ai-sessions.ts`, `types/content-ai-history.ts`; ADD `src/hooks/swr/useQueryContentAiSessionsSwr.ts`, `useQueryContentAiSessionsSwr.test.ts`, `useQueryContentAiHistorySwr.ts`, `useQueryContentAiHistorySwr.test.ts`; MODIFY `src/hooks/index.ts`, `src/hooks/index.test.ts`. |
| AI mutations | ADD `src/modules/api/graphql/mutations/mutation-create-content-ai-session.ts`, `mutation-create-content-ai-session.test.ts`, `mutation-rename-content-ai-session.ts`, `mutation-rename-content-ai-session.test.ts`, `mutation-set-content-ai-session-archived.ts`, `mutation-set-content-ai-session-archived.test.ts`, `mutation-delete-content-ai-session.ts`, `mutation-delete-content-ai-session.test.ts`, `mutation-touch-content-ai-session.ts`, `mutation-touch-content-ai-session.test.ts`; ADD matching request/response files under `src/modules/api/graphql/mutations/types/` named `create-content-ai-session.ts`, `rename-content-ai-session.ts`, `set-content-ai-session-archived.ts`, `delete-content-ai-session.ts`, `touch-content-ai-session.ts`; ADD SWR hooks and tests under `src/hooks/swr/` named `useMutateCreateContentAiSessionSwr`, `useMutateRenameContentAiSessionSwr`, `useMutateSetContentAiSessionArchivedSwr`, `useMutateDeleteContentAiSessionSwr`, `useMutateTouchContentAiSessionSwr` with `.ts` and `.test.ts`; export all through `src/hooks/index.ts`. |
| AI stream | ADD `src/hooks/socketio/types/content-ai.ts`, `src/hooks/socketio/useContentAiStream.ts`, `useContentAiStream.test.ts`; reuse `socket.io-client` and existing auth/env client conventions. |
| Source transport/runtime | MODIFY `src/modules/api/graphql/queries/query-content.ts`, `query-content.test.ts`, `types/content.ts`; ADD `src/modules/api/graphql/queries/query-sandbox-repo-url.ts`, `query-sandbox-repo-url.test.ts`, `types/sandbox-repo-url.ts`; ADD `src/hooks/swr/useRepoSandpackFiles.ts`, `useRepoSandpackFiles.test.ts`; ADD `src/modules/code/sandbox-repo.ts`, `sandbox-repo.test.ts`; ADD `src/components/shells/SandpackShell/index.tsx`, `index.test.tsx`; MODIFY `package.json`, `package-lock.json` to add exactly `@codesandbox/sandpack-react@^2.20.0`. |
| Lesson UI | MODIFY `src/components/pages/CourseLearnContentPage/index.tsx`, `component.tsx`, `component.test.tsx`; MODIFY `src/components/blocks/learn/ContentTabRow/component.tsx`, `component.test.tsx`; ADD `src/components/blocks/learn/ContentSourceWorkspace/component.tsx`, `component.test.tsx`; ADD `src/components/branches/SourceFileTree/index.tsx`, `index.test.tsx`; MODIFY `src/components/leaves/Article/index.tsx`; ADD `src/components/leaves/Article/index.test.tsx`. |
| Shared vocabulary/copy | MODIFY `src/components/shells/DrawerShell/index.tsx`; ADD `src/components/shells/DrawerShell/index.test.tsx`; MODIFY `src/components/leaves/Icon/index.tsx`, `icon.md`; ADD `src/components/leaves/Icon/index.test.tsx`; MODIFY `src/components/contracts/index.ts`, `src/messages/en.json`, `src/messages/vi.json`. |

### Contract keys

| Key | Slots / host | Reason |
|---|---|---|
| `global-ai-layout` | `surface`, optional `selection`, optional `trigger`, optional `drawer` | Overlay controls must remain siblings of the routed surface so navigation replaces the surface without replacing the active conversation owner. |
| `floating-ai-trigger` | `icon`, `label`, optional `badge`; host `button` through branch/leaf control | The unique global action needs one fixed relationship between its mark, discovery label and unread fact. |
| `selection-ai-actions` | `quote`, repeated `action` | The selected passage stays tied to both mutually exclusive destinations before either action runs. |
| `starci-ai-drawer-column` | `mode`, `context`, `chat` | Mode and grounding must remain visible above the scrollable conversation they qualify. |
| `starci-ai-mode-row` | repeated `mode` | General, Code coach and History are one finite disclosure axis. |
| `starci-ai-context-stack` | repeated `context` | Lesson, file, selection and error narrow in order and must not collapse into one ambiguous sentence. |
| `starci-ai-turn-list` | repeated `turn` | History order and streaming tail remain one announced transcript. |
| `starci-ai-composer` | optional `selection`, `input`, `sendOrStop`, optional `quota` | Pinned code context and stream control must stay attached to the exact next ask. |
| `source-workspace-grid` | `files`, `editor`, `preview` | Explorer, editable source and runtime are peers on desktop and collapse in a defined order on narrow screens. |
| `source-workspace-toolbar` | `identity`, repeated `action`, optional `status` | Snapshot identity, reset and local-change status cannot drift into separate ownership. |
| `source-file-list` | repeated `file`; host `ul` | A file explorer is keyboard-readable only while paths remain one ordered list. |
| `source-file-row` | `disclosure`, `name`, optional `status`; host `li` | Folder/file identity and edit status must share one press target. |

### Owner states and invariants

| Owner | Required states / invariant |
|---|---|
| Global host | hidden for guest/auth and live full-bleed evaluation routes; visible for authenticated product routes; one mounted active session survives nested navigation. |
| Route context | `content > task > challenge > foundation > course > global`; selected source context narrows content only; leaving source clears file/range/error before the next ask. |
| Session resolution | query-param exact session once; latest matching session next; lazy create on first send; create failure preserves draft and selection. |
| Streaming | first-token pending, buffered deltas, done, abort, disconnect, terminal error, partial answer; no auto-scroll after learner scrolls up. |
| Quota | pending, available, exhausted, failed; never invent a remaining count; exhausted disables send and owns quota CTA. |
| Selection | 3–600 chars, selectable root only, mouse/touch/keyboard, append active by default, explicit new tangent created archived, clear on send/dismiss/context exit. |
| Source | face absent for `isSandbox=false` or incomplete config; public direct snapshot; premium presigned URL only after authorization; no locked file-name leak. |
| Editor/runtime | local edits stay browser-only; reset restores snapshot; selected current text overrides stale snapshot for that ask; compile/runtime error is independently askable. |
| Mobile | source is editor-first; preview secondary; AI uses bottom placement; no horizontal body overflow; trigger and drawer restore focus. |

### Fixture identities and acceptance evidence

| Evidence | Exact identity / command |
|---|---|
| Public sandbox lesson | `/en/courses/fullstack-mastery/learn/content/modules/dc528b81-7f4f-58d7-8da3-dc88911f681c/contents/dd3d74b1-80a1-5a17-af23-9b81f5123fdb` (`usequery-and-cache-lifecycle`, `isSandbox=true`, `isPremium=false`). |
| Premium sandbox lesson | `/en/courses/fullstack-mastery/learn/content/modules/cee4103b-895f-5f30-8886-f6fae8884ff3/contents/2986d12a-53ed-5171-b1ee-58f47099ce7c` (`multer-single-file-upload`, `isSandbox=true`, `isPremium=true`). |
| Data evidence | Read-only query against live `starci-postgres` confirms both fixture ids, module ids, course and source flags. |
| Targeted tests | `npx vitest run src/components/layouts/GlobalAiChatLayout src/components/overlays/ai/StarCiAiDrawer src/components/blocks/ai/StarCiAiChat src/components/blocks/ai/StarCiAiFab src/components/blocks/ai/StarCiAiSelectionAsk src/components/pages/CourseLearnContentPage src/components/blocks/learn/ContentTabRow src/components/blocks/learn/ContentSourceWorkspace src/components/branches/SourceFileTree src/components/shells/SandpackShell src/hooks/socketio/useContentAiStream.test.ts src/hooks/swr/useRepoSandpackFiles.test.ts` |
| Static gates | `npm run typecheck`; `npm run lint`; `npm run test`; `npm run test:rules`. |
| Browser desktop | Seeded authenticated learner: open public fixture, select Source, edit code, select lines, ask Code coach, observe one persisted streamed turn, reset; navigate dashboard → course → lesson and confirm same active conversation with changed next-ask context. |
| Browser premium | Non-enrolled account on premium fixture: body/paywall remains readable, Source face/file names absent and no repo request; enrolled account receives presigned snapshot and Source face. |
| Browser mobile | 390×844 on public fixture: editor-first source, bottom AI drawer, keyboard-reachable files/actions, no body overflow, close returns focus to FAB. |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved concept candidate | A1 Source lesson face plus one global conversation and a distinct Code coach mode. |
| Legacy parity | Stable MinIO source delivery, entitlement gate, editable local sandbox, session/history CRUD, selection ask and context ladder are retained. |
| Current architecture | One root layout owner, pure/connected twins, closed props, contract keys and vendor shells replace legacy global stores and hand-built vendor composition. |
| Acceptance meaning | A learner can read, edit, preview and ask about exact current code while the same StarCi AI conversation follows product navigation truthfully. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/global-ai-chatbot.md` | modified — appended candidate Review r1 with exact component, props, production, contract, state and evidence boundaries. |
| `D:\Repositories\starci-academy-fe` | unchanged by Review. |

### NEED APPROVALS

| Question | Required response |
|---|---|
| Approve this exact production boundary? | Reply `approve global-ai-chatbot-source-face-code-coach-r1` to authorize recording the approved revision and then running `$starci-fe-design-apply`; any correction produces Review r2 instead. |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend whole-source grounding sees the synchronized snapshot, not a repository-wide set of local editor diffs. | r1 supports exact current selection and visible runtime error; “review every unsaved file at once” remains outside this boundary. |
| The content-AI gateway buffers the winning provider output until billing/persistence succeeds, then emits preserved deltas. | UI must show a truthful first-token pending state and cannot promise immediate token paint. |
| Backend GraphQL descriptions omit some newer scope names although runtime/request fields support them. | FE uses the live request fields and exact route ladder; description cleanup is owed backend documentation, not required FE production code. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Mount chatbot inside `ShellNav` | Locale-root `GlobalAiChatLayout` | `ShellNav` is repeated by route clusters and would drop conversation state on cross-cluster navigation. |
| Put visual chatbot in `AppProviders` | Provider-only `AppProviders`; sibling client layout through `RouteShell` | Existing owner explicitly contains contexts and nothing visual. |
| Keep disabled AI lesson tab | Remove AI face; add Source face; AI remains FAB/drawer | Global assistant and lesson content face are different axes. |
| Scrape Sandpack/CodeMirror DOM for selected lines | Controlled CodeMirror selection feeding Sandpack runtime | Vendor DOM is not a public contract and cannot be the grounding protocol. |
| Add a new backend AI endpoint for code | Existing Content-AI socket plus question context | Backend already grounds whole lesson source and supports streaming/session persistence. |
| Promise GitHub commit/push | Browser-local edits and reset only | No authorized or implemented write-back capability exists. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of `global-ai-chatbot-source-face-code-coach-r1` | User response named in NEED APPROVALS. |
| Baseline commit, exact source implementation and baseline-to-worktree diff | `$starci-fe-design-apply` after approval. |
| Runtime proof on both named sandbox fixtures and browser state evidence | Apply acceptance pass. |

## plan r5 — quoted code turn and compact context

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe @ main |
| Purpose | Correct A1 Code coach so selected code is quoted in the transcript and active context occupies one compact line. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\global-ai-chatbot.md |
| Language | vi |
| Phase | plan feedback correction |
| Touching | workflow and existing disposable preview only |

Selected direction remains `source-lesson-face` (A1).

Feedback evidence: user required “giải thích dòng thì phải quote lại đoạn code đó” and asked for a shorter context treatment because three rows consume too much drawer height.

### Corrected transcript/context behavior

| Concern | Frozen result |
|---|---|
| Selected-code user turn | The user bubble contains a code quote with `file · dòng start–end`, the exact selected current text, then the visible question. A line label alone is insufficient. |
| Persistence | The sent question carries machine-readable display/context sections. History parsing reconstructs the same quote after reload; it is not a preview-only decoration. |
| Long selection | Selection remains capped at 600 characters. The quote scrolls internally after its bounded height; code is not silently truncated from the payload. |
| Compact context | One bar only: `lesson / file:start–end / local|snapshot|error`; long file paths ellipsize, full value remains accessible to assistive text/title. |
| No selection | Bar compacts to the strongest available context, e.g. `Async patterns / useTodos.ts`; global mode can show `Toàn StarCi`. |
| Clear behavior | One clear control removes file/range/error narrowing and falls back to lesson/course/global before the next ask. |

### Preview tracking

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `global-ai-chatbot/plan-r3` revision 5 | `http://127.0.0.1:8101/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\global-ai-chatbot\plan-r3\index.html` | `97F5F459B5146D0D19D70FEB1BF6CA9369CB1513387D60C0EC3472276F420818` | A1 selected; corrected for Review r2 |

| Runtime | Value |
|---|---|
| Browser QA | Selected user turn visibly includes all eight code lines and question; context bar is one 30.4px row; three direction copies render; console errors: none. |

### OUTPUTS

| Concept | Result |
|---|---|
| Code quote | Exact selected current code is part of the visible and persisted user turn. |
| Compact grounding | Context metadata is one ellipsized bar rather than three stacked rows. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/global-ai-chatbot.md` | modified — records quote/context correction. |
| `.workflows/.previews/designs/starci-academy/global-ai-chatbot/plan-r3/index.html` | modified — renders quoted code in the user bubble and one compact context bar. |
| `D:\Repositories\starci-academy-fe` | unchanged. |

### NEED APPROVALS

| Question | Result |
|---|---|
| Plan direction | None; A1 remains selected. Review r1 must be revised to r2. |

### WARNINGS

| Warning | Impact |
|---|---|
| A visible quote reconstructed only from transient editor state would disappear after reload. | The production protocol must serialize quote metadata/text into the persisted question and parse it back from history. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Context-only `useTodos.ts · dòng 14–21` with an unquoted question | Visible code quote plus question | User cannot verify what AI is explaining from a line label alone. |
| Three context rows for lesson, file and selection | One compact context bar | Three rows consume disproportionate drawer height. |

### OWED

| Owed | Cleared by |
|---|---|
| Revise component contracts, turn data and acceptance cases | Review r2 below. |

## review r2 — candidate

Candidate revision: `global-ai-chatbot-source-face-code-coach-r2`

r2 supersedes unapproved r1. The exact production file boundary, fixture identities, route policy, source transport, session CRUD, stream behavior and all component rows not explicitly changed below remain frozen exactly as listed in r1. The following complete delta tables replace r1's two interface tables for approval.

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe @ main |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\global-ai-chatbot.md |
| Phase | review |
| Touching | workflow only; no target source |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | `LocaleLayout` | MODIFY | `src/app/[lang]/layout.tsx` | same | locale root via `RouteShell` | existing shell boundary | Mount one persistent client AI layout. |
| layout | `GlobalAiChatLayout` | ADD | — | `src/components/layouts/GlobalAiChatLayout/index.tsx` | locale root | `global-ai-layout` | Own auth/route context, active session and visual host across navigation. |
| overlay | `StarCiAiDrawer` | ADD | — | `src/components/overlays/ai/StarCiAiDrawer/index.tsx`; `component.tsx` | global AI layout | `starci-ai-drawer-column` | Own one drawer composition over any product surface. |
| block | `StarCiAiChat` | ADD | — | `src/components/blocks/ai/StarCiAiChat/index.tsx`; `component.tsx` | AI drawer | `starci-ai-chat-column`, `starci-ai-context-bar`, `starci-ai-turn-list`, `starci-ai-composer` | Render compact grounding, quoted turns, session/history/quota and stream states. |
| block | `StarCiAiFab` | ADD | — | `src/components/blocks/ai/StarCiAiFab/component.tsx` | global AI layout | `floating-ai-trigger` | Unique semantic global entry and focus-return target. |
| block | `StarCiAiSelectionAsk` | ADD | — | `src/components/blocks/ai/StarCiAiSelectionAsk/index.tsx`; `component.tsx` | global AI layout; selectable article/editor roots | `selection-ai-actions` | Capture valid text/code and choose active chat or tangent. |
| page | `CourseLearnContentPage` | MODIFY | `src/components/pages/CourseLearnContentPage/index.tsx`; `component.tsx` | same | content detail route | existing page + `source-workspace-grid` | Own Reading/Source state and independent source transport. |
| block | `ContentTabRow` | MODIFY | `src/components/blocks/learn/ContentTabRow/component.tsx` | same | content page | `dual-tabs-toolbar` | Replace dead AI face with Source. |
| block | `ContentSourceWorkspace` | ADD | — | `src/components/blocks/learn/ContentSourceWorkspace/component.tsx` | content page | `source-workspace-grid`, `source-workspace-toolbar` | Draw source states and report exact selected current code. |
| branch | `SourceFileTree` | ADD | — | `src/components/branches/SourceFileTree/index.tsx` | source workspace | `source-file-list`, `source-file-row` | Keyboard file/folder disclosure with path identity. |
| leaf | `Article` | MODIFY | `src/components/leaves/Article/index.tsx` | same | reader/problem/foundation/playground article call sites | leaf `article` | Opt in grounded prose selection. |
| leaf | `Icon` | MODIFY | `src/components/leaves/Icon/index.tsx`; `icon.md` | same | FAB and AI panel | leaf `icon` | Add distinct StarCi chatbot meaning/mark. |
| shell | `DrawerShell` | MODIFY | `src/components/shells/DrawerShell/index.tsx` | same | CartDrawer and AI drawer | vendor shell | Add bottom placement without duplicating focus mechanics. |
| shell | `SandpackShell` | ADD | — | `src/components/shells/SandpackShell/index.tsx` | source workspace | mechanics shell | Couple controlled CodeMirror selection to Sandpack provider/preview without vendor DOM scraping. |
| layout | `LearnShellLayout` | MODIFY | `src/components/layouts/LearnShellLayout/index.tsx` | same | learn route layout | existing | Share exact evaluated/full-bleed hide predicate with AI host. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| `LocaleLayout` | route props | KEEP | Next `children/params` | unchanged | Next only | Composition changes internally through existing `RouteShell`. |
| `GlobalAiChatLayout` | props/context | ADD | — | `{surface: ComponentType}` plus private context `{anchor, codeContext,isOpen,open,close,setCodeContext,clearCodeContext,startTangent}` | RouteShell, AI descendants, source page | Hook throws outside sole provider. |
| `_StarCiAiDrawer` | state/data/actions | ADD | — | states `closed/pending/ready/failed`; `{isOpen,placement,title,description}`; `{dismiss}` | connected overlay/layout | Layout owns open flag. |
| `_StarCiAiChat` | states | ADD | — | `sessionsPending/noSession/historyPending/ready/streaming/quotaExhausted/failed` | connected twin | Async owners map explicitly; partial answer survives failure. |
| `_StarCiAiChat` | compact context | ADD | — | one `contextSummary:{visibleText,accessibleText,tone,canClear}` and `clearContext` action | route/code context resolver | Replaces r1's repeated context-chip stack; one 30–32px row only. |
| `_StarCiAiChat` | turn data | ADD | — | each user turn has `question` and optional `quote:{kind:"code"|"prose",sourceLabel,startLine?,endLine?,text}`; assistant turn has `content,isPartial?` | history parser and live send reducer | Same render shape for live turn and reloaded persisted history. |
| `_StarCiAiChat` | remaining data/actions | ADD | — | mode, sessions, turns, draft, quota; mode/session/search/rename/archive/delete/draft/send/stop/retry actions | connected twin | No router/SWR/socket/translation object crosses pure boundary. |
| `StarCiAiFab` | props/actions | ADD | — | `{props:{label,isOpen,hasUnread?},on?:{press?},isLoading?}` | global layout | Closed semantic data; no arbitrary icon/class prop. |
| `_StarCiAiSelectionAsk` | selection API | ADD | — | `{quote,appendLabel,tangentLabel,position}` and `{append,tangent,dismiss}` | connected listener | 3–600 chars within selectable root only. |
| `CourseLearnContentPage` | face state | ADD | hard-coded Reading | controlled local `ContentFaceId`, reset per content id | connected page | Source fetch only after face selection. |
| `_CourseLearnContentPage` | source data/actions | ADD | — | optional `sourceState/source` data; `selectSource/source` actions | connected page | Absent/locked source never reaches workspace. |
| `_CourseLearnContentPage` | `selectAi` | REMOVE | optional action | — | page/tests | `rg selectAi` empty after migration. |
| `ContentTabRow` | face/action | RETYPE | `reading/challenge/ai`, `selectAi` | `reading/source/challenge`, `selectSource` | page/tests | Live consumer inventory already frozen in r1. |
| `ContentSourceWorkspace` | state/data/actions | ADD | — | `pending/ready/failed`; files/deps/active/edited/error/labels; activate/update/reset/selectCode/askError/retry | content page | `selectCode` emits exact current text/path/line range/edit flag. |
| `SourceFileTree` | props/actions | ADD | — | `{label,files,activePath}` and `activate` | source workspace | Stable path ids and keyboard list semantics. |
| `Article` | `aiSelectable` | ADD | — | optional, default false | content/problem/foundation true; playground false | Existing call sites compile unchanged until opt-in. |
| `Icon` | `IconName` | ADD | no chatbot identity | `aiChatbot` | FAB/panel | Exhaustive glyph map and icon canon entry. |
| `DrawerShell` | placement | RENAME | `side?: left/right` | `placement?: left/right/bottom`, default right | Cart passes none; AI responsive | No existing `side=` consumer. |
| `SandpackShell` | runtime API | ADD | — | files/deps/path/template; activate/update/selectionChange/runtimeError/reset | source workspace | Selection callback is controlled, not DOM-derived. |
| `LearnShellLayout` | props | KEEP | `{displayId,surface}` | unchanged | learn route | Only internal predicate owner changes. |

### Revised protocol and acceptance delta

| Item | r2 freeze |
|---|---|
| Outgoing selected-code question | Serialize `<display>learner question</display>` plus `<context kind="code" source="useTodos.ts" start="14" end="21" edited="true|false">exact current selected text</context>`. Escape user/code text; never concatenate raw pseudo-XML. |
| Backend grounding | The full serialized question is sent to existing Content-AI socket so code is available to grounding; no backend endpoint change. |
| Persisted history | Backend stores the same question. FE history parser extracts display/context; malformed/legacy messages fall back to plain text rather than disappearing. |
| Visible user turn | Quote figure first, exact code in a bounded scrollable `pre/code`, then the question. File/range remain visible in quote caption. |
| Context bar | One line only; `lesson / basename:start–end / local|snapshot|error`; long text ellipsizes and exposes full accessible label. |
| Tests added to r1 boundary | `content-ai-selection-context.test.ts` covers escaping, parse round-trip, malformed fallback, 600-char boundary and code quote reconstruction; chat component test asserts quote before question and one context row. |

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate concept | A1 + global Code coach with visible/persisted exact code quote and one compact context bar. |
| Acceptance meaning | Learner can verify exactly what code AI is explaining without sacrificing drawer space to metadata. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/global-ai-chatbot.md` | modified — appended Plan r5 and candidate Review r2. |
| `D:\Repositories\starci-academy-fe` | unchanged by Review. |

### NEED APPROVALS

| Question | Required response |
|---|---|
| Approve revised exact boundary? | Reply `approve global-ai-chatbot-source-face-code-coach-r2`; otherwise feedback produces r3. |

### WARNINGS

| Warning | Impact |
|---|---|
| Serialized context is persisted as message text because backend has no structured per-turn code-context columns. | Parser/escaping tests are mandatory; malformed legacy messages must remain readable as plain turns. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| r1 repeated context stack | one compact `starci-ai-context-bar` | User rejected the three-row height. |
| r1 question with only path/range metadata | exact code quote + question | User requires visible evidence of the code being explained. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit r2 approval | User response named above. |
| Baseline, implementation and named-fixture proof | `$starci-fe-design-apply` after approval. |

## plan r6 — complete interactive state matrix

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe @ main |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\global-ai-chatbot.md |
| Phase | plan feedback correction |
| Touching | workflow and existing disposable preview only |

Selected direction remains `source-lesson-face` (A1). Feedback evidence: user required the preview to run the full, materially larger state set rather than the original ten source-only states.

### Complete preview state inventory

| Group | Interactive states |
|---|---|
| Source/editor | ready; selected lines; AI explaining; local edited; preview compile failed; source loading; source failed; no source; premium locked; long quote. |
| Context/navigation | content/file selection; global; course; challenge; context cleared to lesson; mobile. |
| Sessions/history | sessions loading; no conversation; history ready; search empty; history failed; rename pending; archive pending; delete confirmation. |
| Quota/realtime | quota pending; credits exhausted; socket offline; reconnecting; stream failed with partial answer; answer aborted. |
| Conversation branching | explicit new born-archived tangent while active conversation A remains unchanged. |

### Preview tracking

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `global-ai-chatbot/plan-r3` revision 6 | `http://127.0.0.1:8101/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\global-ai-chatbot\plan-r3\index.html` | `632B33F8920A092342A59B06499014C6A5C6CFB6E60D904BC5E637C7D18074A3` | A1 selected; 30-state matrix verified |

| Verification pass | Result |
|---|---|
| Desktop | 3 composition directions × 30 states = 90/90 pass using actual rendered geometry/ancestor visibility; console errors: 0. |
| Mobile | 390×844, 3 directions × 30 states = 90/90 pass; no body overflow; drawer within viewport; context ≤32.1px including subpixel tolerance; long quote ≤118.5px; console errors: 0. |
| Total | 180/180 final combinations pass after corrections. |

### Corrections found by full-state execution

| Finding | Correction |
|---|---|
| Challenge compact context rendered 36px on mobile. | Compact bar now owns fixed 32px height, 100% width and ellipsis-safe children. |
| History mode kept Code coach banner/context/actions above the list. | Session/history/search/mutation states hide chat-owned context/actions and show the history owner directly below mode tabs. |
| A2 hides preview pane, so compile failure disappeared from workspace. | Every compile state marks editor header `preview failed`; A1/A3 additionally retain visible preview error panel. |
| First automation run found duplicate accessible name `Lịch sử` between state control and mode. | Test driver uses declared `data-state` identity for scenario controls; product mode button keeps its truthful accessible name. |

### OUTPUTS

| Concept | Result |
|---|---|
| Complete state preview | 30 interactive states cover source, grounding, conversations, quota, realtime and branching. |
| Cross-composition proof | Every state runs in A1/A2/A3 instead of being visually checked in only the selected direction. |
| Responsive proof | The same complete matrix runs at 390px with geometry assertions. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/global-ai-chatbot.md` | modified — records complete state inventory, fixes and 180-combination evidence. |
| `.workflows/.previews/designs/starci-academy/global-ai-chatbot/plan-r3/index.html` | modified — expands 10 to 30 states and corrects mobile context, history hierarchy and hidden-preview compile status. |
| `D:\Repositories\starci-academy-fe` | unchanged. |

### NEED APPROVALS

| Question | Result |
|---|---|
| Plan direction | None; A1 remains selected. Review r2 must be revised to r3 with the full state inventory. |

### WARNINGS

| Warning | Impact |
|---|---|
| Preview state controls are a design proof, not production controls. | Apply implements owner-driven async states; it does not copy the scenario switcher. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Treat ten Source states as complete chatbot coverage | Thirty states across source + AI runtime + session/history + quota + navigation | User correctly identified that chatbot state space is much larger. |
| Validate child `display` without ancestor visibility | Rendered-geometry visibility checks | Hidden-history/chat descendants otherwise produced false passes. |

### OWED

| Owed | Cleared by |
|---|---|
| Carry full state ownership into the approved production revision | Review r3 below. |

## review r3 — candidate

Candidate revision: `global-ai-chatbot-source-face-code-coach-r3`

r3 supersedes unapproved r2. The complete component and props delta, exact file boundary, contracts, fixtures and protocols from r2 remain unchanged except for the explicit owner-state and acceptance corrections below.

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source / Backend | D:\Repositories\starci-academy-backend |
| Frontend | D:\Repositories\starci-academy-fe |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe @ main |
| Phase | review |
| Touching | workflow only; no production source |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | `LocaleLayout` | MODIFY | `src/app/[lang]/layout.tsx` | same | locale root via `RouteShell` | existing shell boundary | Mount one persistent client AI owner. |
| layout | `GlobalAiChatLayout` | ADD | — | `src/components/layouts/GlobalAiChatLayout/index.tsx` | locale root | `global-ai-layout` | Own route/auth visibility and active conversation across navigation. |
| overlay | `StarCiAiDrawer` | ADD | — | `src/components/overlays/ai/StarCiAiDrawer/index.tsx`; `component.tsx` | global layout | `starci-ai-drawer-column` | Compose responsive drawer states over all product surfaces. |
| block | `StarCiAiChat` | ADD | — | `src/components/blocks/ai/StarCiAiChat/index.tsx`; `component.tsx` | AI drawer | `starci-ai-chat-column`, `starci-ai-context-bar`, `starci-ai-turn-list`, `starci-ai-composer` | Own all 20 AI/session/context/realtime states and quoted turns. |
| block | `StarCiAiFab` | ADD | — | `src/components/blocks/ai/StarCiAiFab/component.tsx` | global layout | `floating-ai-trigger` | Global semantic entry and focus-return target. |
| block | `StarCiAiSelectionAsk` | ADD | — | `src/components/blocks/ai/StarCiAiSelectionAsk/index.tsx`; `component.tsx` | global layout + selectable roots | `selection-ai-actions` | Produce active-chat or tangent code/prose asks. |
| page | `CourseLearnContentPage` | MODIFY | `src/components/pages/CourseLearnContentPage/index.tsx`; `component.tsx` | same | content detail route | existing page + source workspace | Own Reading/Source and ten source/editor states. |
| block | `ContentTabRow` | MODIFY | `src/components/blocks/learn/ContentTabRow/component.tsx` | same | content page | `dual-tabs-toolbar` | Replace AI face with Source face. |
| block | `ContentSourceWorkspace` | ADD | — | `src/components/blocks/learn/ContentSourceWorkspace/component.tsx` | content page | `source-workspace-grid`, `source-workspace-toolbar` | Draw source/editor/runtime states and current selection. |
| branch | `SourceFileTree` | ADD | — | `src/components/branches/SourceFileTree/index.tsx` | source workspace | `source-file-list`, `source-file-row` | Keyboard source navigation. |
| leaf | `Article` | MODIFY | `src/components/leaves/Article/index.tsx` | same | reader/problem/foundation/playground call sites | leaf `article` | Opt-in grounded selection root. |
| leaf | `Icon` | MODIFY | `src/components/leaves/Icon/index.tsx`; `icon.md` | same | FAB and AI panel | leaf `icon` | Distinct chatbot mark. |
| shell | `DrawerShell` | MODIFY | `src/components/shells/DrawerShell/index.tsx` | same | CartDrawer + AI drawer | vendor shell | Right desktop and bottom mobile mechanics. |
| shell | `SandpackShell` | ADD | — | `src/components/shells/SandpackShell/index.tsx` | source workspace | mechanics shell | Controlled editor + Sandpack preview. |
| layout | `LearnShellLayout` | MODIFY | `src/components/layouts/LearnShellLayout/index.tsx` | same | learn route | existing | Share evaluated/full-bleed visibility predicate. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| `GlobalAiChatLayout` | props/context | ADD | — | `{surface}` plus private anchor/code/open/tangent context API | RouteShell and AI descendants | One provider; hook fails outside owner. |
| `_StarCiAiDrawer` | state/data/actions | ADD | — | `closed/pending/ready/failed`; responsive placement/title/dismiss | connected overlay/layout | Layout retains open owner. |
| `_StarCiAiChat` | state union | ADD | — | `sessionsPending/noSession/historyPending/historyReady/searchEmpty/historyFailed/renaming/archiving/deleteConfirm/ready/streaming/quotaPending/quotaExhausted/offline/reconnecting/streamFailed/aborted/tangentReady/contextCleared` | connected chat | Exactly matches interactive AI-owner states; history states hide chat-owned context/actions. |
| `_StarCiAiChat` | context/turn API | ADD | — | one compact summary; quoted user turn; assistant partial flag; clear/send/stop/retry/session mutation actions | route parser/history parser/live reducer | Quote round-trips; one context row; malformed history fallback. |
| `StarCiAiFab` | props/actions | ADD | — | label/open/unread + press | global layout | Closed semantic data. |
| `_StarCiAiSelectionAsk` | selection API | ADD | — | 3–600-char quote, position, append/tangent/dismiss | connected listener | Selectable owner only. |
| `CourseLearnContentPage` | face/source API | ADD | Reading hard-coded | Reading/Source state and source data/actions | connected/pure twin | Reset per content; lazy source fetch. |
| `_CourseLearnContentPage` | `selectAi` | REMOVE | optional action | — | page/tests | `rg selectAi` empty. |
| `ContentTabRow` | face/action | RETYPE | reading/challenge/ai + selectAi | reading/source/challenge + selectSource | page/tests | Exact consumers frozen. |
| `ContentSourceWorkspace` | state/data/actions | ADD | — | pending/ready/failed plus editor local/selected/compile/loading/failure/absent/locked/long-quote projections | content page | A2/mobile compile failure remains visible through editor status when preview pane is hidden. |
| `SourceFileTree` | props/actions | ADD | — | label/files/activePath + activate | workspace | Stable paths. |
| `Article` | `aiSelectable` | ADD | — | optional false | grounded article call sites | Existing callers unchanged until opt-in. |
| `Icon` | `IconName` | ADD | no chatbot | `aiChatbot` | FAB/panel | Exhaustive map. |
| `DrawerShell` | placement | RENAME | `side` left/right | `placement` left/right/bottom | Cart none; AI responsive | No current `side=` consumer. |
| `SandpackShell` | runtime API | ADD | — | files/deps/path/template and controlled update/selection/error/reset events | source workspace | No vendor DOM scrape. |
| `LearnShellLayout` | public props | KEEP | `{displayId,surface}` | unchanged | learn route | Internal predicate reuse only. |

### Acceptance delta

| Proof | Required result |
|---|---|
| Pure component fixtures | One named fixture per state in the r3 unions above; history fixtures assert context/actions absent, chat fixtures assert compact context and quote present. |
| Source compile state | A1/A3 show preview error; A2/mobile show `preview failed` in editor header and AI debug card. |
| Desktop browser | Named public fixture: all owner states exercised; no console error; no stale context after context clear/navigation. |
| Mobile browser | 390×844: context ≤32.1px including subpixel tolerance, quote scroll ≤118.5px, no body overflow, drawer inside viewport. |

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate | A1 global Code coach r3 with complete owner-state contract and quoted code. |
| Acceptance | Production cannot call itself complete by proving only ready/selected/error; session, quota, realtime, mutation and responsive states are mandatory. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/global-ai-chatbot.md` | modified — appended Plan r6 and candidate Review r3. |
| `D:\Repositories\starci-academy-fe` | unchanged by Review. |

### NEED APPROVALS

| Question | Required response |
|---|---|
| Approve complete r3 boundary? | Reply `approve global-ai-chatbot-source-face-code-coach-r3`; feedback produces r4. |

### WARNINGS

| Warning | Impact |
|---|---|
| Thirty preview switches are scenario fixtures, not a production state enum copied wholesale. | Connected owners derive states from source/session/quota/socket/mutation data; pure twins receive the frozen unions. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| r2 ten-state visual acceptance | r3 complete owner-state matrix | User required full coverage. |
| History list below Code coach context/actions | History owner directly below mode tabs | Current mode must own the drawer body hierarchy. |
| Compile error only inside optional preview pane | Editor-level failed status plus preview error where pane exists | A2/mobile otherwise hide the failure. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit r3 approval | User response named above. |
| Baseline, implementation and named-fixture runtime proof | `$starci-fe-design-apply` after approval. |

## plan r7 — quota semantics correction

### CONTEXT

| Field | Value |
|---|---|
| Source / Backend | `D:\Repositories\starci-academy-backend` |
| Frontend | `D:\Repositories\starci-academy-fe` |
| App | `starci-academy` |
| Scope | Global StarCi AI drawer on `/learn`, including lesson Source/Code coach |
| Phase | plan correction after founder feedback |

### BACKEND EVIDENCE

| Evidence | Business consequence |
|---|---|
| `AiEntitlementService.consume()` checks and debits quota only when resolved model `cost > 0`. | Zero-cost models remain usable with zero paid credits. |
| Content AI invokes the resolved model before consuming its token-derived cost. | A quota query is advisory UI data, not authoritative preflight permission. |
| Content AI starts from the Low model floor and may climb the balancer chain. | A free route can succeed; a later paid route can be rejected by backend consumption. |
| Gateway withholds streamed deltas until invocation, consumption and persistence succeed. | A paid-quota rejection emits no answer; draft and quote can remain available for retry. |

### STATE CORRECTION

| Previous state | Revision 7 state | Composer |
|---|---|---|
| `Đang tải quota` and blocked send | `Đang tải AI credits`; only the credit badge is pending | enabled |
| `Hết AI credits`; all chat blocked | `0 paid credits`; free model remains available | enabled |
| absent | `Paid model bị từ chối`; served paid cost exceeds remaining credits | enabled for retry; no answer emitted for failed turn |

### PREVIEW TRACKING

| Preview | URL | SHA-256 | Status |
|---|---|---|---|
| `global-ai-chatbot/plan-r3` revision 7 | `http://127.0.0.1:8101/` | `7C2AD46B21D3E1F53F7754DB46A36B5E6AA7F66DE949585633DDEAC7988B3720` | A1 selected; 31-state matrix verified |

| Verification pass | Result |
|---|---|
| Desktop | 3 directions × 31 states = 93/93 pass. |
| Mobile | 390×844, 3 directions × 31 states = 93/93 pass. |
| Quota behavior | `quota`, `exhausted`, and `quotarejected` cards render; send remains `opacity: 1`, `pointer-events: auto`. |
| Total | 186/186 combinations pass. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Treat quota fetch as a chatbot permission gate | Render it as pending credit-display data | Backend owns final cost validation. |
| Disable AI whenever paid credits are zero | Keep free model path available | `cost = 0` is neither checked nor debited. |

## review r4 — candidate

Candidate revision: `global-ai-chatbot-source-face-code-coach-r4`

r4 supersedes unapproved r3. Every component, file boundary, contract and acceptance row from r3 remains unchanged except the exact quota state correction below.

### PROPS DELTA CORRECTION

| Owner | r3 | r4 |
|---|---|---|
| `_StarCiAiChat` state union | `quotaPending/quotaExhausted` | `quotaPending/zeroPaidCredits/quotaRejected` |
| `_StarCiAiChat` send rule | quota pending/exhausted could imply blocking | quota states never globally disable send; only connection/active-send ownership may do so |
| Credit badge | unspecified pending role | advisory balance display with loading/error handling; never presented as authorization |

### ACCEPTANCE DELTA

| Proof | Required result |
|---|---|
| Zero-cost route | With paid balance `0`, a zero-cost served model can complete and persist normally. |
| Paid rejection | If served model cost exceeds remaining credit, no answer delta renders; draft and code quote remain retryable. |
| Pending quota query | Credit badge may load independently while composer remains usable. |
| Authority | UI never promises that preflight balance guarantees a paid run; backend consumption remains final. |

### NEED APPROVALS

| Question | Required response |
|---|---|
| Approve corrected r4 boundary? | Reply `approve global-ai-chatbot-source-face-code-coach-r4`; feedback produces r5. |

## review r4 — approved

| Field | Value |
|---|---|
| Approved revision | `global-ai-chatbot-source-face-code-coach-r4` |
| Approval | Founder: `ok dứt đi, vậy cũng được` |
| Meaning | Approves the immediately preceding r4 component boundary, prop/state correction and acceptance delta. |
| Production writes | None; Design Review ends here. |
| Apply eligibility | `$starci-fe-design-apply` may implement exactly r4 in a later task. |

## pre-apply boundary confirmation

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-fe` |
| Source | `D:\Repositories\starci-academy-backend` |
| Project | `Explicit targets` |
| Frontend | `D:\Repositories\starci-academy-fe` |
| Backend | `D:\Repositories\starci-academy-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Skills | `D:\Repositories\starci-academy-backend\.claude\skills` |
| App | `starci-academy` |
| Repo / branch | `D:\Repositories\starci-academy-fe @ main` |
| Purpose | Apply approved revision `global-ai-chatbot-source-face-code-coach-r4`. |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |
| Workflow | `D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\global-ai-chatbot.md` |
| Language | `vi` |
| Phase | `apply` |
| Touching | This workflow plus exactly the paths in Review r1 `Exact supporting production boundary`, inherited without expansion by r2–r4; no other target path. |

Selected revision: `global-ai-chatbot-source-face-code-coach-r4` (pending production-write confirmation)

### BASELINE PRECHECK

| Check | Result |
|---|---|
| Target branch | `main` |
| Current target HEAD | `1bc591b chore: capture course faq baseline` |
| Existing source work | 24 entries: 22 modified, 2 untracked |
| Existing overlap with r4 | `src/components/contracts/index.ts`, `src/messages/en.json`, `src/messages/vi.json` |
| Excluded generated evidence | 5 `.artifacts/` entries; not included in baseline commit |
| Production writes | Not started |

### OUTPUTS

| Concept | Result |
|---|---|
| Apply entry | r4 is selected and its inherited exact boundary has been re-read; write gate is pending. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/global-ai-chatbot.md` | modified — recorded Apply context and baseline precheck only. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Confirm production repo/branch and touching? | Recommended: confirm `D:\Repositories\starci-academy-fe @ main`, commit the 24 existing source entries as baseline while excluding `.artifacts`, then edit only r4's inherited exact boundary; otherwise name a different branch or baseline policy. |

### WARNINGS

| Warning | Impact |
|---|---|
| The target is already dirty and three existing files overlap r4. | Baseline must preserve them before chatbot edits so later diff attribution remains exact. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | None |

### OWED

| Owed | Cleared by |
|---|---|
| Baseline commit and all production implementation/proof | User confirmation of repo/branch and touching. |

## review r5

Candidate revision: `global-ai-chatbot-source-face-code-coach-r5`

Approved revision: `global-ai-chatbot-source-face-code-coach-r5`

Approval: founder replied `approve global-ai-chatbot-source-face-code-coach-r5`.

r5 keeps A1, all r4 product states, transport contracts, fixtures and every unchanged production row. It revises only ownership that canonical lint proved impossible during Apply.

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-fe` |
| Source | `D:\Repositories\starci-academy-backend` |
| Project | `Explicit targets` |
| Frontend | `D:\Repositories\starci-academy-fe` |
| Backend | `D:\Repositories\starci-academy-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Skills | `D:\Repositories\starci-academy-backend\.claude\skills` |
| App | `starci-academy` |
| Repo / branch | `D:\Repositories\starci-academy-fe @ main` |
| Purpose | Correct two r4 owner/path decisions rejected by canonical lint without changing A1 or chatbot business. |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |
| Workflow | `D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\global-ai-chatbot.md` |
| Language | `vi` |
| Phase | `review` |
| Touching | This workflow only; no further production write until r5 approval. |

### EVIDENCE

| Gate | Result | Consequence |
|---|---|---|
| Targeted r4 tests | 34 files, 102/102 pass | Product/API behavior is retained. |
| Typecheck | All r4 paths clean; two remaining errors are concurrent `CoursePricingRail` work outside this boundary | No r5 interface change is driven by TypeScript. |
| Canonical lint | `surface-folder-two-files-only` rejects `layouts/GlobalAiChatLayout/context.ts` | Context API must leave the surface folder. |
| Canonical lint | `vendor-boundary` rejects `shells/SandpackShell` because only Modal/Drawer/Dropdown/Route are shells | Sandbox composition must be a named branch, not a fifth shell. |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| layout | `GlobalAiChatLayout` | MODIFY | `src/components/layouts/GlobalAiChatLayout/index.tsx`; remove `context.ts` passenger | `src/components/layouts/GlobalAiChatLayout/index.tsx` | locale root, drawer/chat/source selection consumers | `global-ai-layout` | Keep the layout folder to its connected half and test; shared context moves to module ownership. |
| branch | `SandpackWorkspace` | MOVE | `src/components/shells/SandpackShell/index.tsx`; `index.test.tsx` | `src/components/branches/SandpackWorkspace/index.tsx`; `index.test.tsx` | `ContentSourceWorkspace` | `source-workspace-grid` | Sandpack composes a visible files/editor/preview product shape; it is not covering mechanics and cannot be a shell. |
| block | `ContentSourceWorkspace` | MODIFY | `src/components/blocks/learn/ContentSourceWorkspace/component.tsx`; test | same | `CourseLearnContentPage` | `source-workspace-toolbar`, `source-workspace-root` | Mount the renamed branch and give the block root a declared contract node. |
| branch | `SourceFileTree` | MODIFY | `src/components/branches/SourceFileTree/index.tsx`; test | same | `SandpackWorkspace` | `source-file-navigation`, `source-file-list`, `source-file-row` | Replace the unnamed nav host with a contract-owned navigation node. |
| block | `StarCiAiChat` | MODIFY | `src/components/blocks/ai/StarCiAiChat/index.tsx`; `component.tsx`; tests | same | AI drawer | existing AI contracts | Keep connected CRUD wiring and add documentation-only lint compliance; state/business unchanged. |
| overlay | `StarCiAiDrawer` | MODIFY | existing overlay files/tests | same | global AI layout | `starci-ai-drawer-column` | Documentation and typed test doubles only; overlay API unchanged. |
| leaf | `Article` | REUSE | `src/components/leaves/Article/index.tsx` | same | existing article consumers | leaf `article` | r4 implementation already passes its targeted proof. |
| shell | `DrawerShell` | REUSE | `src/components/shells/DrawerShell/index.tsx` | same | CartDrawer, AI drawer | closed shell | r4 placement API remains correct; only its test doubles require lint-safe typing. |

All other route/page/layout/overlay/block/branch/leaf rows and exact transport files remain exactly r4; r5 adds no new product owner.

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| `GlobalAiChatLayout` | context API import | KEEP | `{anchor,codeContext,isOpen,open,close,setCodeContext,clearCodeContext,startTangent}` from layout passenger | same API from `src/modules/ai/global-ai-chat-context.tsx` | layout, chat, drawer, selection, content page | `rg GlobalAiChatLayout/context` empty. |
| `SandpackWorkspace` | runtime API | RENAME | `SandpackShellData/Actions/Props` | `SandpackWorkspaceData/Actions/Props` | `ContentSourceWorkspace` | `rg SandpackShell` empty; vendor imports owned by this branch only. |
| `SandpackWorkspaceData` | `previewLabel` | ADD | hard-coded `Sandbox preview` | required resolved string | `CourseLearnContentPage` translation producer | No hard-coded preview label remains. |
| `ContentSourceWorkspaceData` | inherited runtime data | RETYPE | extends `SandpackShellData` | extends `SandpackWorkspaceData` | connected content page | Typecheck proves one producer. |
| `SourceFileTree` | public props/actions | KEEP | label/files/activePath/editedLabel + activate | unchanged | Sandpack workspace | Structural ownership changes only. |
| `_StarCiAiChat` | states/actions | KEEP | r4 union and CRUD actions | unchanged | connected chat | 102-state/transport targeted tests remain binding. |
| `_StarCiAiDrawer` | props | KEEP | state/data/dismiss/chat | unchanged | connected drawer | Test harness uses named types, no API change. |
| `DrawerShell` | placement | KEEP | left/right/bottom | unchanged | CartDrawer and AI drawer | Test harness correction only. |

### EXACT SUPPORTING PRODUCTION BOUNDARY DELTA

| Action | Exact paths |
|---|---|
| ADD | `src/modules/ai/global-ai-chat-context.tsx`; `src/components/branches/SandpackWorkspace/index.tsx`; `src/components/branches/SandpackWorkspace/index.test.tsx`. |
| REMOVE | `src/components/layouts/GlobalAiChatLayout/context.ts`; `src/components/shells/SandpackShell/index.tsx`; `src/components/shells/SandpackShell/index.test.tsx`. |
| MODIFY | Existing r4 consumers/tests in `GlobalAiChatLayout`, `StarCiAiChat`, `StarCiAiSelectionAsk`, `StarCiAiDrawer`, `CourseLearnContentPage`, `ContentSourceWorkspace`, `SourceFileTree`, `DrawerShell`; `src/components/contracts/index.ts`; `src/messages/en.json`; `src/messages/vi.json`; `src/modules/ai/content-ai-selection-context.ts`; `src/modules/code/sandbox-repo.ts`. |

### ACCEPTANCE

| Proof | Required result |
|---|---|
| Targeted tests | Existing 102/102 remain green plus moved branch tests. |
| Targeted lint | Zero errors across every r5 production/test path without suppression. |
| Rename proof | `rg 'GlobalAiChatLayout/context|SandpackShell' src` empty. |
| Static gates | `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:rules`, `npm run build` green after concurrent outside-boundary work settles. |
| Runtime | Same authenticated desktop/premium/mobile r4 flows; no business or visual state is removed. |

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate r5 | Canon-compliant context module and Sandpack branch; A1 and all r4 states remain unchanged. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/global-ai-chatbot.md` | modified — recorded Apply findings and exact r5 correction boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve r5 ownership correction? | Recommended: `approve global-ai-chatbot-source-face-code-coach-r5`; otherwise name a different canon-compliant owner for context or Sandpack composition. |

### WARNINGS

| Warning | Impact |
|---|---|
| r4 Apply is paused with implementation present. | No further production edits occur until this correction is approved. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `GlobalAiChatLayout/context.ts` | shared AI context module | Canon forbids a third passenger in a layout surface folder. |
| `SandpackShell` | `SandpackWorkspace` branch | Canon's shell list is closed to actual covering/framework mechanics. |

### OWED

| Owed | Cleared by |
|---|---|
| r5 approval and resumed Apply | Explicit approval phrase above. |

## apply r1

Applied revision: `global-ai-chatbot-source-face-code-coach-r5`

Baseline commit: `6d07fcee8e56a095666930e6d8f3adc6b3a64f15`

Implementation commit: `6a3cf191991e5e1e5ef4a39956f3473da4f18c9a`

Tracked diff: `6d07fcee8e56a095666930e6d8f3adc6b3a64f15..6a3cf191991e5e1e5ef4a39956f3473da4f18c9a`

Apply status: `OPEN — authenticated browser proof is blocked at OTP; no credentials or tokens are recorded.`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-fe` |
| Source | `D:\Repositories\starci-academy-backend` |
| Project | `Explicit targets` |
| Frontend | `D:\Repositories\starci-academy-fe` |
| Backend | `D:\Repositories\starci-academy-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Skills | `D:\Repositories\starci-academy-backend\.claude\skills` |
| App | `starci-academy` |
| Repo / branch | `D:\Repositories\starci-academy-fe @ main` |
| Purpose | Apply approved global StarCi AI, Source face and Code coach with r5 canon ownership. |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |
| Workflow | `D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\global-ai-chatbot.md` |
| Language | `vi` |
| Phase | `apply` |
| Touching | Approved r4 boundary plus the exact r5 ownership moves and the approved StarCi AI brand mark; concurrent course-detail/start-trial/artifact changes remain unstaged. |

### COMMAND PROOF

| Command / gate | Result |
|---|---|
| `rg 'GlobalAiChatLayout/context|SandpackShell' src` | PASS — no stale source import, owner or call site. |
| Focused ESLint over every AI/Source/r5 owner and test | PASS — zero errors, no suppression. |
| `npm run typecheck` | PASS. |
| Focused Vitest | PASS — 17 files, 57/57 tests. Earlier integrated revision proof remains 34 files, 102/102 tests. |
| Backend Content AI unit suites | PASS — service/handler 33/33; socket gateway 1/1. |
| Live OpenRouter assertion | PASS — `deepseek/deepseek-v4-flash` returned the exact assertion through the mounted key pool; key value was never printed. |
| `npm run build` | PASS — Next production build and all routes compiled. |
| `npm run test:rules` | PASS — command exited 0. |
| `npm run lint` | BLOCKED OUTSIDE BOUNDARY — 104 errors are in excluded `.artifacts/**` and mirrored `plugins/eslint-canon/**`; focused r5 lint is clean. |
| `npm test` | BLOCKED OUTSIDE BOUNDARY — 155/166 files pass and 597/611 tests pass; 14 failures plus four zero-test suites are existing dashboard/course/cart/hooks/Next environment work, not r5 owners. |

### LIVE FLOW PROOF

| Time window / route | Persona and fixture | UI | Network / auth | Console | Verdict |
|---|---|---|---|---|---|
| 2026-08-15, `http://localhost:3000/en/courses/fullstack-mastery/learn`, desktop English/light | Local authorized test-account flow | Real `/learn` route renders; signed-out state correctly omits the global AI trigger. Latest logo asset is served by the built production bundle. | Seeded local account reached mandatory email OTP. The separately authorized account returned HTTP 401. No OTP or valid session was available, so authenticated AI, lesson Source and mobile states could not be exercised. | Four existing HeroUI `PressResponder` warnings; no credential/token logged. | BLOCKED — Apply cannot close until login completes and the authenticated AI/Source states are exercised in UI, Network, Console and both terminals. |

### OUTPUTS

| Concept | Result |
|---|---|
| r5 ownership | Shared context now belongs to `modules/ai`; Sandpack composition is the `SandpackWorkspace` branch; stale names are absent. |
| Global StarCi AI | Persistent layout, branded floating trigger, drawer modes, session CRUD/history, quota advisory states, retry/stop/tangent and selected-code grounding are implemented. |
| Source / Code coach | Lesson Source face, synchronized snapshot, editable browser-local Sandpack runtime, file selection and quoted-code explanation context are implemented. |
| Brand mark | `public/brand/starci-ai-mark-v1.png` and `StarCiAiMark` replace the generic AI glyph. |
| Proof status | Static, focused, backend and live-model gates pass; authenticated browser gate remains open at OTP. |

### CHANGES

| Tree | Details |
|---|---|
| Dependencies / locale root | `package.json`, `package-lock.json`, `src/app/[lang]/layout.tsx` — Sandpack/CodeMirror dependencies and one persistent locale-root AI owner. |
| AI surfaces | `src/components/blocks/ai/StarCiAiChat/**`, `StarCiAiFab/**`, `StarCiAiSelectionAsk/**`, `src/components/overlays/ai/StarCiAiDrawer/**`, `src/components/layouts/GlobalAiChatLayout/**` — global chat UI and interaction states. |
| Source workspace | `src/components/blocks/learn/ContentSourceWorkspace/**`, `ContentTabRow/**`, `src/components/branches/SandpackWorkspace/**`, `SourceFileTree/**`, `src/components/pages/CourseLearnContentPage/**` — Source face and browser-local code workspace. |
| Shared UI | `src/components/contracts/index.ts`, `src/components/layouts/LearnShellLayout/index.tsx`, `src/components/leaves/Article/**`, `Icon/**`, `StarCiAiMark/**`, `src/components/shells/DrawerShell/**` — approved contracts, selection seam, mechanics and branded mark. |
| Client transport | `src/hooks/socketio/**`, the content-AI/session/repo hooks under `src/hooks/swr/**`, and `src/hooks/index.ts`/test — streaming and SWR owners. |
| GraphQL transport | Content AI CRUD/history and sandbox/content query files under `src/modules/api/graphql/{mutations,queries}/**` — typed documents and tests. |
| Domain modules | `src/modules/ai/**`, `src/modules/code/**`, `src/modules/learn/is-live-assessment-route*` — route grounding, selection normalization, shared context and sandbox parsing. |
| Copy / asset | `src/messages/en.json`, `src/messages/vi.json`, `public/brand/starci-ai-mark-v1.png` — resolved state copy and alpha brand mark. |
| Workflow | `.workflows/designs/starci-academy/global-ai-chatbot.md` — approval, implementation commit and proof state. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Complete authenticated browser proof | Provide/complete the OTP in the handed-off localhost tab, or provide another authorized test account that can finish sign-in without an unavailable OTP. |

### WARNINGS

| Warning | Impact |
|---|---|
| Full lint and full test are red only outside the approved r5 source boundary. | They are recorded, not suppressed and not folded into this commit. Apply remains open. |
| Concurrent course-detail/start-trial and `.artifacts` work remains in the frontend worktree. | Preserved unstaged and absent from implementation commit `6a3cf19`. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Keep `GlobalAiChatLayout/context.ts` | `src/modules/ai/global-ai-chat-context.tsx` | Canon permits only the layout connected half and test in that surface folder. |
| Keep `SandpackShell` | `src/components/branches/SandpackWorkspace` | The composition is product structure, not one of the closed vendor mechanics shells. |
| Claim authenticated UI proof from the disposable 8101 preview | Real localhost route with honest blocked status | Preview state cannot prove auth, network, stream or backend terminal behavior. |

### OWED

| Owed | Cleared by |
|---|---|
| Authenticated desktop Source/code-selection/chat flow | Complete local sign-in, open AI, open one real lesson Source face, select lines, ask, inspect quote + stream + requests + both terminals. |
| Authenticated mobile drawer flow and live-assessment hidden state | Repeat the approved responsive and hidden-route fixtures after authentication. |
| Full-repo lint/test closure | Resolve the separately owned `.artifacts`/canon and dashboard/course/cart/hooks/Next failures, then rerun the frozen commands. |
