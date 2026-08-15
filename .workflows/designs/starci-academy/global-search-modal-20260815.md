<!-- starci-workflow: v2 -->

# Global search modal

## plan r1

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
| Repo / branch | FE `D:\Repositories\starci-academy-fe @ mtp`; BE `D:\Repositories\starci-academy-backend @ mtp` |
| Purpose | Chọn trải nghiệm global search modal mới dựa trên legacy nhưng nhanh, rõ và keyboard-first hơn |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\global-search-modal-20260815.md |
| Language | vi |
| Phase | plan |
| Touching | Workflow này và `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\global-search-modal-20260815\r1\index.html` |

### BRIEF

| Claim | Quyết định |
|---|---|
| Người dùng | Khách hoặc học viên đang ở bất kỳ route nào và nhớ một khóa học, module, bài học, challenge hoặc nền tảng nhưng không nhớ đường dẫn |
| Thesis | Global search giúp người dùng tới đúng nội dung bằng cách biến navbar search thành một command surface có phân loại, ngữ cảnh và điều khiển bàn phím |
| Primary action | Mở một kết quả search theo `path` canonical do backend trả |
| Secondary action | Thu hẹp scope kết quả hoặc mở khóa học phổ biến khi chưa nhập gì/không có kết quả |
| Anti-goals | Không trở thành trang search riêng, không hứa AI ranking, recent history hay dữ liệu ngoài GraphQL contract hiện có |

### EVIDENCE

| Fact | Source | Constraint |
|---|---|---|
| Legacy mở modal từ navbar và `Ctrl/Cmd+K`, debounce 200ms, hiển thị grouped results và popular-course fallback | `D:\Repositories\starci-academy\src\components\overlays\modals\GlobalSearchModal\` và `Navbar/index.tsx` | Direction A phải giữ parity-first; mọi direction giữ shortcut, debounce, fallback và route close |
| Legacy từng thiếu autofocus, ArrowDown/roving tabindex và keyboard-complete ListBox sau khi đổi component | Comment contract trong legacy `GlobalSearchModal/component.tsx` | Preview bắt buộc thể hiện focus đầu vào, hàng active, ↑↓, Enter và Escape |
| Backend trả 8 bucket: courses, modules, challenges, contents, flashcardDecks, milestones, milestoneTasks, foundations | `AutocompleteGlobalSearchData` | Không invent thêm loại kết quả; scope/rail chỉ là cách nhìn trên 8 bucket thật |
| Mỗi hit có `title`, snippets, `path`, `parentPath`; course/content có enrolled/free/premium flags | `AutocompleteGlobalSearchItem` | Row có thể vẽ title, match, breadcrumb và status; navigation dùng `path`, không tự ghép URL |
| Query public với optional auth; enrollment state chỉ giàu hơn khi signed-in | `AutocompleteGlobalSearchResolver` và legacy query hook | Guest vẫn search được; signed-in/signed-out dùng cùng tree, chỉ khác badge |
| Shell mới đã có trigger `PressableInputLike` và action `openSearch`, nhưng connected `ShellNav` chưa mount search overlay | FE `ShellNav/component.tsx` và `ShellNav/index.tsx` | Apply sau Review phải nối đúng shell owner, không đặt modal trên từng page |
| FE mới có `ModalShell`, `SurfaceListCard`, `PressableSurface`, icon/badge/text primitives | FE component inventory | Reuse mechanics và joined-list grammar; không import HeroUI trực tiếp ngoài shell/leaf owner |

### CONTRACT INVENTORY

| Item | Class | Reason |
|---|---|---|
| `ModalShell` | REUSE | Đã sở hữu focus trap, Escape, backdrop, close và scroll lock |
| `PressableInputLike` | REUSE | Navbar trigger hiện tại đã đúng field-looking press target và shortcut |
| `SurfaceListCard` | REUSE | Grouped/filtered results là joined list, không phải nhiều card rời |
| `Badge`, `Icon`, `Text`, `Heading` | REUSE | Đủ diễn đạt kind, enrolled/free/premium, title và metadata |
| Search command field | NEW | `Input` hiện là uncontrolled form field, không thể biểu đạt autofocus, controlled query và roving-list keydown mà không làm rộng API mọi form |
| `global-search-result-row` | NEW | Chưa có row contract kết hợp kind icon, title, highlighted snippet, path context và auth-dependent status |
| `GlobalSearchOverlay` | NEW | Overlay phải tự sở hữu domain query, open reason, fetch states và outcome navigation |
| Scope/rail navigator contract | NEW only if B/C wins | Quan hệ filter-to-one-result-list chưa có owner trung thực trong registry |

### STATE MATRIX

| State | Expected render |
|---|---|
| idle | Search field focused; prompt + popular courses, không phải mặt trắng |
| pending | Giữ query và kết quả cũ; chỉ result region báo đang cập nhật để không nhấp nháy modal |
| ready | Typed groups/scope, match snippets, status và canonical-open action |
| empty | Nói rõ query không khớp, giữ query, đưa cách sửa và popular fallback |
| error | Giữ query, retry tại chỗ, không đóng modal |
| signed-out | Search public; không vẽ enrolled chip |
| signed-in | Course hit có thể vẽ enrolled; content hit vẽ free/premium theo contract |
| keyboard | Autofocus; ↑↓ đổi active row; Enter mở; Escape đóng và trả focus về navbar trigger |
| mobile | Modal full-height; one-column list; scope/rail cuộn ngang; preview detail pane bị loại bỏ |

### DIRECTIONS

| Direction | Product decision | Strength | Cost |
|---|---|---|---|
| `global-search-a-legacy-grouped` | Giữ grouped reading order legacy, sửa interaction và states | Parity cao, nhóm dễ hiểu, ít vocabulary mới | 8 nhóm có thể tạo modal rất dài; người biết scope vẫn phải quét nhiều heading |
| `global-search-b-scope-first` | Một list chính, scope chips thu hẹp bucket trước khi quét | Nhanh, cân bằng desktop/mobile, reuse joined list tốt nhất | Scope thêm một quyết định; thứ tự All là priority cố định chứ không phải ranking toàn cục |
| `global-search-c-navigator` | Rail nhóm + result list + contextual preview pane | Mạnh cho truy vấn dày, breadcrumb và loại nội dung khó phân biệt | Tree nặng nhất; desktop rộng; mobile phải bỏ preview pane |

### PREVIEW TRACKING

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `global-search-modal-r1` | http://127.0.0.1:8086/ | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\global-search-modal-20260815\r1\index.html` | `fb84ee2bfb5d32c0067bd20a410bfc2df8960d8eb4bb1f02d71108d6d5da4bcb` | đang chờ |

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\global-search-modal-20260815\r1`

PID: `39788`

Port: `8086`

| Direction | Tab | Status |
|---|---|---|
| `global-search-a-legacy-grouped` | `A · Legacy tinh gọn` | đang chờ |
| `global-search-b-scope-first` | `B · Scope-first` | đang chờ |
| `global-search-c-navigator` | `C · Navigator` | đang chờ |

### VERIFICATION

| Proof | Result |
|---|---|
| Desktop render | Ba tab chuyển client-side tại một URL; A, B, C đều hiển thị đúng result tree |
| State render | Results, idle, empty và error thay body tại chỗ; empty có recovery và popular fallback |
| Keyboard fixture | ArrowUp/ArrowDown đổi active row; footer nêu Enter/Escape; production Review còn phải freeze focus-return implementation |
| Mobile render | 390×844: C thu rail thành horizontal scope, ẩn context pane và giữ joined list một cột |
| Console | Không có lỗi render được quan sát trong preview |

### OUTPUTS

| Concept | Result |
|---|---|
| Global search brief r1 | Search là overlay cấp shell, public-first, keyboard-first và chỉ dùng 8 bucket backend thật |
| Direction A | Parity-first grouped legacy được hoàn thiện interaction/states |
| Direction B | Scope-first joined list; recommendation hiện tại vì nhanh nhất mà không tăng tree quá nặng |
| Direction C | Two-pane navigator dành cho ưu tiên ngữ cảnh và truy vấn dày |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/global-search-modal-20260815.md` | added — evidence, brief, directions và preview tracking |
| `.workflows/.previews/designs/starci-academy/global-search-modal-20260815/r1/index.html` | added — disposable tabbed preview; không phải production source |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn direction để chuyển sang `starci-fe-design-review` | Khuyến nghị `approve global-search-b-scope-first`; hoặc chọn `global-search-a-legacy-grouped` nếu ưu tiên parity tuyệt đối; hoặc `global-search-c-navigator` nếu ưu tiên context desktop |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend không trả score dùng chung giữa các bucket | Tab All không được gọi là “best match” hay AI-ranked; chỉ dùng priority cố định và group counts |
| Popular courses đến từ query riêng trong legacy | Review phải xác nhận reuse producer tương ứng ở FE mới hoặc giới hạn idle fallback vào dữ liệu courses hiện có |
| FE và BE đang có dirty worktree từ các task khác | Plan không sửa production; Apply sau này phải baseline và preserve các thay đổi đó |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Dùng preview shell cũ ở port 8085 làm legacy evidence | Đọc source legacy thật tại `D:\Repositories\starci-academy` | Port 8085 đang serve proposal account/language, không phải runtime legacy |
| AI ranking, recent search history và suggested query không có contract | Group/scope dựa trên bucket và popular-course fallback có thật | Không biến fixture thành capability giả |
| Chỉ đổi màu/radius để tạo nhiều concept | Ba direction khác hierarchy, disclosure và scan model | Plan yêu cầu product choice thật |

### OWED

| Owed | Cleared by |
|---|---|
| Chọn một direction | Thầy mở `http://127.0.0.1:8086/` và trả lời bằng direction ID |
| Khóa component tree, props, owners và exact source boundary | Chạy `starci-fe-design-review` sau khi direction được chọn |

## plan r2

Selected direction: `global-search-c-search-workspace`

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
| Repo / branch | FE `D:\Repositories\starci-academy-fe @ mtp`; BE `D:\Repositories\starci-academy-backend @ mtp` |
| Purpose | Chốt global search thành một search workspace lớn, chia sidebar, result list và context pane để thao tác dễ hơn |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\global-search-modal-20260815.md |
| Language | vi |
| Phase | plan |
| Touching | Workflow này và `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\global-search-modal-20260815\r1\index.html` |

### FEEDBACK

| User feedback | Consequence |
|---|---|
| “kiểu modal lớn rồi chia làm sidebar đồ ấy, kiểu làm sao mà dễ thao tác ấy chứ ko nhất thiết phỉa modal hẹp” | Chọn causal model Navigator; bỏ giả định modal phải gọn/hẹp; desktop dùng search workspace rộng và ưu tiên thao tác |

### SELECTED DIRECTION

| Decision | Frozen intent |
|---|---|
| Surface | Modal lớn cấp shell, gần full workspace nhưng vẫn giữ overlay topology và trả focus về navbar trigger |
| Left sidebar | 8 backend buckets được gộp thành các scope dễ đọc; mỗi scope có count; keyboard ←→ đổi scope |
| Center | Một `SurfaceListCard` joined list; ↑↓ chọn, Enter mở; query và result state không nhấp nháy |
| Right context | Preview title, kind, enrollment/access status và canonical path context từ hit đã chọn; CTA mở kết quả |
| Mobile | Full-screen overlay; sidebar thành horizontal scope; center list giữ nguyên; right context pane biến mất |
| Width | Desktop max khoảng 1180px; width phục vụ thao tác, không phải decoration |

### ACCEPTANCE STATES

| State | Acceptance |
|---|---|
| results desktop | Ba vùng sidebar/list/context nhìn thấy đồng thời; active scope và active row rõ; list là vùng thao tác chính |
| results mobile | Scope ngang + one-column result list; không ép detail pane vào viewport |
| idle | Workspace vẫn giữ identity; popular-course fallback nằm trong result region |
| empty | Giữ query, recovery copy và popular fallback; sidebar không biến mất |
| error | Giữ query và scope; retry thay result region, modal không đóng |
| keyboard | Autofocus query; ←→ scope; ↑↓ row; Enter open; Escape dismiss + focus return |
| pointer | Toàn row là press target; context CTA là cùng outcome, không tạo route thứ hai |

### PREVIEW TRACKING

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `global-search-modal-r2` | http://127.0.0.1:8086/ | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\global-search-modal-20260815\r1\index.html` | `836d7b81106941343309c2a681f7f487cbf2ac365df5acc9e56b14a330028262` | đã chốt |

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\global-search-modal-20260815\r1`

PID: `39788`

Port: `8086`

| Direction | Tab | Status |
|---|---|---|
| `global-search-a-legacy-grouped` | `A · Legacy tinh gọn` | đã từ chối |
| `global-search-b-scope-first` | `B · Scope-first` | đã từ chối |
| `global-search-c-search-workspace` | `C · Search workspace` | đã chọn |

### OUTPUTS

| Concept | Result |
|---|---|
| Global search selected direction | Search workspace lớn với sidebar, joined results và context pane; width được dùng để giảm thao tác và tăng ngữ cảnh |
| Responsive model | Desktop ba vùng; mobile full-screen một list với horizontal scopes |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/global-search-modal-20260815.md` | modified — append feedback, selected direction và acceptance states |
| `.workflows/.previews/designs/starci-academy/global-search-modal-20260815/r1/index.html` | modified — C trở thành default, modal mở rộng 1180px, sidebar rõ và có keyboard guide |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chuyển sang Design Review để khóa component tree, props và source boundary | Khuyến nghị: chạy `starci-fe-design-review` cho `global-search-c-search-workspace` |

### WARNINGS

| Warning | Impact |
|---|---|
| Sidebar labels gộp 8 bucket backend thành ít scope hơn | Review phải khóa mapping bucket → scope, không để Apply tự quyết |
| Context pane chỉ được dùng fields đã có trên hit | Không thêm mô tả dài, progress hoặc ranking nếu producer không cung cấp |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Giả định modal phải hẹp/gọn | Search workspace lớn có sidebar và context pane | Thầy ưu tiên dễ thao tác, không bắt modal hẹp |
| A/B làm final direction | C · Search workspace | Chưa dùng đủ chiều rộng để đổi nhóm và xem ngữ cảnh đồng thời |

### OWED

| Owed | Cleared by |
|---|---|
| Exact component tree và public props | `starci-fe-design-review` |
| Exact source boundary và integrated state proof | `starci-fe-design-review` trước Apply |

## review r1

Candidate revision: `global-search-c-search-workspace-review-r1`

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
| Repo / branch | FE `D:\Repositories\starci-academy-fe @ main`; BE `D:\Repositories\starci-academy-backend @ mtp` |
| Purpose | Khóa component tree, public APIs, state ownership, source boundary và proof cho Global Search workspace trước Apply |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\global-search-modal-20260815.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; không viết HTML, JSX, CSS hoặc production source |

### REVIEW VERDICT

| Question | Verdict | Evidence |
|---|---|---|
| Surface có đáng là overlay không | Có | Trigger tồn tại ở shell trên mọi route; tác vụ được triệu hồi bằng navbar hoặc `Ctrl/Cmd+K`, cần focus trap, Escape, backdrop và focus return của `ModalShell` |
| Modal hẹp hay workspace | Workspace dùng `ModalShell size="cover"` | HeroUI 3.2.1 chỉ có `xs`, `sm`, `md`, `lg`, `cover`, `full`; `cover` giữ inset/radius desktop và chiếm viewport hữu dụng, còn mobile vẫn gần full-screen |
| Static joined list hay selectable list | `SurfaceSelectionList` mới | `SurfaceListCard` không sở hữu selection, roving focus hay `ListBox` semantics; thêm DOM query/active CSS từ overlay sẽ tạo hai owner cho cùng interaction |
| Sidebar scopes | `All`, `Courses`, `Learning`, `Practice`, `Projects`, `Foundations` | Ánh xạ đúng 8 bucket thật; số cạnh scope là số hit đang trả về và có thể bị cap bởi `size`, không được gọi là tổng toàn hệ thống |
| Idle/empty fallback | CTA `Browse courses`, không giả “Popular courses” | FE không có producer public xếp theo popularity; `SortBy` chỉ có title/createdAt/updatedAt, nên “popular” sẽ là claim không chứng minh được |
| Snippet HTML | Parse `<em>` thành segment an toàn; không `dangerouslySetInnerHTML` | Backend nói `texts` có thể chứa `<em>` từ Elasticsearch; phần còn lại phải thành text, không được tin như HTML |

### SCOPE MAPPING

| Scope | Backend entities sent | Buckets shown | Ordering |
|---|---|---|---|
| `all` | Omit `entities` để dùng backend default | courses, modules, contents, challenges, flashcardDecks, milestones, milestoneTasks, foundations | Bucket priority cố định theo thứ tự này; không gọi là relevance ranking xuyên bucket |
| `courses` | `CourseEntity` | courses | Backend order |
| `learning` | `ModuleEntity`, `ContentEntity` | modules, contents | modules rồi contents |
| `practice` | `ChallengeEntity`, `FlashcardDeckEntity` | challenges, flashcardDecks | challenges rồi flashcardDecks |
| `projects` | `MilestoneEntity` | milestones, milestoneTasks | milestones rồi milestoneTasks; task bucket là projection cùng project domain |
| `foundations` | `FoundationEntity` | foundations | Backend order |

Request size: `6` hit mỗi backend entity group. Scope count là độ dài các bucket đang có trong response, tối đa theo cap này.

### OWNER STATES

| Owner | Frozen states | Ownership |
|---|---|---|
| `ShellNav` | closed; open intent từ navbar; open intent từ `Ctrl/Cmd+K` | Giữ một `GlobalSearchOpenIntent` có `requestId` và `source`, không giữ query/result/domain state |
| `GlobalSearchOverlay` | closed, idle, pending-empty, pending-stale, ready, empty, error | Connected overlay sở hữu query, debounce 200ms, scope, selected result, retry, route outcome và translations |
| `_GlobalSearchOverlay` | Discriminated union cùng năm landing states; pending tách empty/stale bằng dữ liệu, không bằng boolean rời | Pure twin chỉ render state đã quyết và báo named actions |
| `SearchCommandField` | resting, focused, has text, pending | Leaf sở hữu controlled input, autofocus, clear, `aria-activedescendant`, ArrowUp/ArrowDown/Enter translation |
| `SurfaceSelectionList` | selected key hoặc none; disabled/loading | Branch sở hữu HeroUI `ListBox`, single selection, roving focus, activation và fixed surface seam; caller cung cấp typed row contract |
| `ModalShell` | open/closed, cover size | Shell tiếp tục sở hữu backdrop, Escape, close trigger, focus trap, scroll lock và focus return |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| layout | ShellNav connected | MODIFY | `src/components/layouts/ShellNav/index.tsx` | same | `src/app/[lang]/layout.tsx` | Existing shell route/theme/auth/cart contract plus named Global Search intent | Navbar trigger và global shortcut phải summon đúng một overlay cấp shell |
| layout | `_ShellNav` pure | REUSE | `src/components/layouts/ShellNav/component.tsx` | same | `ShellNav` connected | Existing `ShellNavActions.openSearch` | Trigger contract đã tồn tại; chỉ connected owner chưa truyền handler |
| overlay | `GlobalSearchOverlay` connected | ADD | none | `src/components/overlays/search/GlobalSearchOverlay/index.tsx` | `ShellNav` connected | `GlobalSearchOpenIntent`; domain query/state/navigation owner | Overlay phải tự resolve request, words, states và canonical route outcome |
| overlay | `_GlobalSearchOverlay` pure | ADD | none | `src/components/overlays/search/GlobalSearchOverlay/component.tsx` | `GlobalSearchOverlay` connected | Discriminated render state + named actions | Khóa một render tree cho desktop/mobile và mọi landing state |
| shell | `ModalShell` | MODIFY | `src/components/shells/ModalShell/index.tsx` | same | Existing `SignInOverlay`, `CheckoutOverlay`, `CoursePriceOverlay`; new `_GlobalSearchOverlay` | Add vendor-supported `cover` size only | Workspace cần viewport width nhưng vẫn giữ một owner cho covering mechanics |
| branch | `SurfaceSelectionList` | ADD | none | `src/components/branches/SurfaceSelectionList/index.tsx` | `_GlobalSearchOverlay` scope list và result list | Typed `contract + render`, keyed items, single selection/action | Một ListBox branch dùng hai lần giữ roving focus và selection semantics trung thực |
| branch | `Tree` | REUSE | `src/components/branches/Tree/index.tsx` | same | `_GlobalSearchOverlay` row/context/state projections | New Global Search contract keys | Mọi arrangement vẫn đi qua named contract nodes |
| branch | `SurfaceCard` | REUSE | `src/components/branches/SurfaceCard/index.tsx` | same | `_GlobalSearchOverlay` context pane | `global-search-context-card` | Context pane là một bounded static surface, không phải selectable list |
| composite | `EmptyNotice` | REUSE | `src/components/composites/EmptyNotice/index.tsx` | same | `_GlobalSearchOverlay` idle, empty, error result region | Existing `empty-notice-stack` | Giữ một grammar recovery; action là Browse courses hoặc Retry theo state |
| leaf | `SearchCommandField` | ADD | none | `src/components/leaves/SearchCommandField/index.tsx` | `_GlobalSearchOverlay` | Controlled command-field API | Form `Input` và `SearchBox` hiện đều không thể vừa debounce controlled query vừa điều khiển active result trung thực |
| leaf | `Heading`, `Text`, `Icon`, `Badge`, `Button` | REUSE | `src/components/leaves/{Heading,Text,Icon,Badge,Button}/index.tsx` | same | `_GlobalSearchOverlay` contracts | Existing typography/icon/status/action APIs | Đủ vocabulary; không thêm icon chỉ để trang trí bucket |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| `_ShellNav` | `ShellNavActions.openSearch` | KEEP | `openSearch?: () => void` | same | `ShellNav` connected → `_ShellNav`; `PressableInputLike` | Live definition đã có handler; component test sẽ chứng minh press forward một lần |
| ShellNav connected | public props | KEEP | no public props | same | `src/app/[lang]/layout.tsx` | Route layout call site không đổi |
| `GlobalSearchOverlay` | `intent` | ADD | none | `GlobalSearchOpenIntent \| undefined` với `{requestId, source: "navbar" \| "shortcut"}` | `ShellNav` connected | Named intent thay plain `isOpen`; tests mở từ cả hai producer |
| `GlobalSearchOverlay` | `on.dismissed` | ADD | none | optional named dismissal outcome | `ShellNav` connected | Close, Escape và backdrop đều clear cùng intent; no raw reason API |
| `_GlobalSearchOverlay` | state/API | ADD | none | `GlobalSearchOverlayRenderState` discriminated union + actions `queryChange`, `clear`, `scopeSelect`, `resultPreview`, `resultOpen`, `retry`, `browseCourses`, `dismiss` | `GlobalSearchOverlay` connected | Pure tests render từng union member và named outcome |
| `ModalShell` | `ModalShellSize` / `size` | RETYPE | `"xs" \| "sm" \| "md" \| "lg"` | add `"cover"`; default remains `md` | Existing three overlays unchanged; Global Search passes `cover` | Typecheck proves old call sites remain valid; shell test asserts cover reaches vendor class/data |
| `SurfaceSelectionList` | public API | ADD | none | keyed `items`, `selectedKey`, `label`, `contract`, branded row `render`, `isLoading`; actions `select`, `activate` | Two `_GlobalSearchOverlay` call sites | Branch test proves same API serves scope and result fixtures, keyboard selection and activation |
| `SearchCommandField` | public API | ADD | none | data `{id,value,label,placeholder,clearLabel,shortcut?,activeDescendant?,isPending?}`; actions `{change,clear,previous,next,submit}` | `_GlobalSearchOverlay` | Leaf test proves controlled value, autofocus, clear and key translation without leaking DOM events |
| `useQueryAutocompleteGlobalSearchSwr` | hook API | ADD | none | `{query, entities?, size: 6, enabled}`; null SWR key when closed or trimmed query empty | `GlobalSearchOverlay` connected via `@/hooks` | Hook tests prove query/entities/size are in cache key and disabled states make no call |
| `queryAutocompleteGlobalSearch` | query API | ADD | none | typed optional-auth GraphQL query selecting all eight buckets and only live item fields | SWR hook | Query test locks document variables and response type; `withAuth: true` preserves guest optional-auth path |

### SUPPORTING PRODUCTION BOUNDARY

| Path | Action | Proof obligation |
|---|---|---|
| `src/components/layouts/ShellNav/index.tsx` | MODIFY | Mount overlay once, wire navbar press + `Ctrl/Cmd+K`, preserve unrelated dirty source |
| `src/components/layouts/ShellNav/component.test.tsx` | MODIFY | Press forwards `openSearch` exactly once |
| `src/components/layouts/ShellNav/index.test.tsx` | ADD | Navbar and shortcut produce named intents; dismiss restores closed state |
| `src/components/overlays/search/GlobalSearchOverlay/index.tsx` | ADD | Debounce, scope/entity mapping, stale-while-pending, retry, canonical router push |
| `src/components/overlays/search/GlobalSearchOverlay/component.tsx` | ADD | Exact workspace render tree and responsive omission of context pane |
| `src/components/overlays/search/GlobalSearchOverlay/component.test.tsx` | ADD | idle/pending/ready/empty/error, active row/context, actions |
| `src/components/overlays/search/GlobalSearchOverlay/index.test.tsx` | ADD | Hook/router/translation integration and 200ms debounce |
| `src/components/shells/ModalShell/index.tsx` | MODIFY | Admit `cover`, change no default or existing size |
| `src/components/shells/ModalShell/index.test.tsx` | ADD | close routes and cover size |
| `src/components/branches/SurfaceSelectionList/index.tsx` | ADD | One selectable surface owner with typed row render |
| `src/components/branches/SurfaceSelectionList/index.test.tsx` | ADD | Selection, Arrow keys, Enter, disabled/loading |
| `src/components/leaves/SearchCommandField/index.tsx` | ADD | Controlled command input and semantic key actions |
| `src/components/leaves/SearchCommandField/index.test.tsx` | ADD | autofocus, clear, pending and keys |
| `src/components/contracts/index.ts` | MODIFY | Add only rendered keys: `global-search-workspace`, `global-search-body`, `global-search-scope-option`, `global-search-result-option`, `global-search-context-card` |
| `src/modules/api/graphql/queries/query-autocomplete-global-search.ts` | ADD | Optional-auth document with 8 buckets, path/parent/status/snippets |
| `src/modules/api/graphql/queries/query-autocomplete-global-search.test.ts` | ADD | Variables, optional auth and envelope |
| `src/modules/api/graphql/queries/types/global-search.ts` | ADD | Exact selected response/request shape; no backend entity import |
| `src/hooks/swr/useQueryAutocompleteGlobalSearchSwr.ts` | ADD | Stable cache key and disabled/empty query guard |
| `src/hooks/swr/useQueryAutocompleteGlobalSearchSwr.test.ts` | ADD | Key separation, error, empty envelope and disabled states |
| `src/hooks/index.ts` | MODIFY | Export hook only |
| `src/hooks/index.test.ts` | MODIFY | Freeze barrel roster |
| `src/modules/search/global-search.ts` | ADD | Bucket flattening, scope counts, status derivation, safe `<em>` segment parsing, canonical IDs |
| `src/modules/search/global-search.test.ts` | ADD | All six scope mappings, fixed All ordering, capped counts, hostile snippet remains text |
| `src/messages/en.json` | MODIFY | Complete `globalSearch` copy namespace |
| `src/messages/vi.json` | MODIFY | Complete `globalSearch` copy namespace |

No backend source change is approved: the existing `autocompleteGlobalSearch` request/response contract is sufficient.

### ACCEPTANCE EVIDENCE

| Gate | Exact evidence |
|---|---|
| Focus/open | Navbar click and `Ctrl/Cmd+K` open once; query field autofocuses; close/Escape/backdrop return focus to summoner |
| Keyboard | Scope ListBox arrows select scope; command field ArrowUp/ArrowDown changes selected result; Enter opens exactly selected canonical `path`; Tab reaches scope, rows, context CTA and close |
| Data | Guest request succeeds without bearer; signed-in course/content badges reflect only `isEnrolled`, `isFree`, `isPremium`; all eight buckets render through frozen scope map |
| Async | 200ms debounce; pending keeps stale rows; empty/error keep query and scope; retry mutates same key |
| Safety | Snippet parser recognizes `<em>` markers only and renders all other markup as text; no `dangerouslySetInnerHTML` |
| Responsive | Desktop cover modal shows sidebar/list/context; 390×844 shows horizontal primary scopes + one result list and no context pane |
| Source tests | `npx vitest run` over every new/modified focused test in the boundary |
| Static gates | `npm run typecheck`; `npm run lint`; `npm run test`; `npm run test:rules`; `npm run build` |
| Runtime | Browser at `http://localhost:3000/vi/courses`: open, search real seeded term, switch all scopes, open a hit, verify URL; repeat at mobile viewport; console zero errors |
| API | POST `autocompleteGlobalSearch` to local GraphQL as guest and signed-in, verify envelope and eight buckets before browser proof |

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate revision `global-search-c-search-workspace-review-r1` | Search workspace dùng modal `cover`, scope/result ListBox semantics, context pane và canonical navigation |
| State model | Overlay domain owner có idle, pending-empty, pending-stale, ready, empty, error; pure twin không nhận boolean combinations |
| Data model | Sáu scope ánh xạ đủ tám bucket, không invent ranking hoặc total count |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/global-search-modal-20260815.md` | modified — append Review r1 component delta, props delta, production boundary và acceptance evidence |

### NEED APPROVALS

| Question | Options |
|---|---|
| Phê duyệt exact Review revision để chuyển sang `starci-fe-design-apply` | Khuyến nghị `approve global-search-c-search-workspace-review-r1`; hoặc nêu owner/API/boundary cần sửa để append Review r2 |

### WARNINGS

| Warning | Impact |
|---|---|
| FE branch thực tế là `main`, khác Plan ghi `mtp` | Apply phải baseline đúng `main`; không được dùng branch identity cũ |
| FE và BE đều có dirty worktree ngoài task; riêng `CourseDetailPage/index.tsx` đang đổi | Apply phải preserve toàn bộ; baseline commit theo skill chỉ được tạo sau khi xác nhận production boundary và không được gom nhầm unrelated work |
| Scope count bị request `size: 6` cap | Copy chỉ được gọi là số kết quả đang hiển thị, không phải tổng match |
| Full repository workflow validator vẫn đỏ vì records lịch sử khác | Record Global Search không có matching validator error; Apply không được tuyên bố toàn workflow tree clean |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `SurfaceListCard` tĩnh cho result list | `SurfaceSelectionList` dùng chung cho scopes và results | Static card không sở hữu roving focus/selection; giả active row bằng DOM query hoặc paint ngoài branch sẽ sai ownership |
| “Popular courses” ở idle/empty | `Browse courses` CTA tới `/courses` | Không có producer public chứng minh popularity order |
| Raw Elasticsearch snippet HTML | Safe `<em>` segment parser | Backend text có markup; UI không được tin hoặc inject HTML |
| Một `isOpen` boolean không lưu lý do mở | `GlobalSearchOpenIntent` có source và requestId | Focus/outcome cần biết overlay được navbar hay shortcut triệu hồi |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of this exact Review revision | Thầy trả lời `approve global-search-c-search-workspace-review-r1` |
| Production implementation and all focused/static/runtime proof | `starci-fe-design-apply` after approval |

## review r2

Approved revision: `global-search-c-search-workspace-review-r1`

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
| Repo / branch | FE `D:\Repositories\starci-academy-fe @ main`; BE `D:\Repositories\starci-academy-backend @ mtp` |
| Purpose | Ghi nhận phê duyệt exact Review revision và khóa nguyên boundary trước Apply |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\global-search-modal-20260815.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; không viết production source |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| layout | ShellNav connected | MODIFY | `src/components/layouts/ShellNav/index.tsx` | same | `src/app/[lang]/layout.tsx` | Mở một Global Search overlay từ navbar và `Ctrl/Cmd+K` | Shell là global trigger owner |
| layout | `_ShellNav` pure | REUSE | `src/components/layouts/ShellNav/component.tsx` | same | `ShellNav` connected | Giữ `ShellNavActions.openSearch` hiện có | Trigger API đã tồn tại |
| overlay | `GlobalSearchOverlay` connected | ADD | none | `src/components/overlays/search/GlobalSearchOverlay/index.tsx` | `ShellNav` connected | Sở hữu query, scope, request, selection và navigation | Connected owner tách data khỏi render |
| overlay | `_GlobalSearchOverlay` pure | ADD | none | `src/components/overlays/search/GlobalSearchOverlay/component.tsx` | connected twin | Render discriminated workspace states | Một render tree cho mọi state |
| shell | `ModalShell` | MODIFY | `src/components/shells/ModalShell/index.tsx` | same | existing overlays và Global Search | Thêm vendor-supported `cover` size | Giữ một owner cho modal mechanics |
| branch | `SurfaceSelectionList` | ADD | none | `src/components/branches/SurfaceSelectionList/index.tsx` | scope list và result list | HeroUI ListBox single-selection semantics | Static list không đủ keyboard ownership |
| branch | `Tree` | REUSE | `src/components/branches/Tree/index.tsx` | same | Global Search contracts | Named layout contracts | Existing arrangement vocabulary |
| branch | `SurfaceCard` | REUSE | `src/components/branches/SurfaceCard/index.tsx` | same | context pane | Static bounded context surface | Context không phải selectable list |
| composite | `EmptyNotice` | REUSE | `src/components/composites/EmptyNotice/index.tsx` | same | idle, empty, error | Recovery grammar | Existing state vocabulary |
| leaf | `SearchCommandField` | ADD | none | `src/components/leaves/SearchCommandField/index.tsx` | pure overlay | Controlled command field và key translation | Existing search input không controlled |
| leaf | `Heading`, `Text`, `Icon`, `Badge`, `Button` | REUSE | existing paths | same | pure overlay | Existing visual vocabulary | Không tạo leaf trang trí mới |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| `_ShellNav` | `ShellNavActions.openSearch` | KEEP | `openSearch?: () => void` | same | connected `ShellNav` | Component test proves one forward |
| ShellNav connected | public props | KEEP | no public props | same | route layout unchanged | Existing call site compiles unchanged |
| `GlobalSearchOverlay` connected | `intent` | ADD | none | `GlobalSearchOpenIntent \| undefined` với `requestId` và `source` | connected `ShellNav` | Tests cover navbar and shortcut producers |
| `GlobalSearchOverlay` connected | `on.dismissed` | ADD | none | optional named dismissal outcome | connected `ShellNav` | Close paths clear one intent |
| `_GlobalSearchOverlay` pure | state/actions | ADD | none | discriminated render state; named query/scope/result/retry/browse/dismiss actions | connected twin | Pure tests cover every union member |
| `ModalShell` | `ModalShellSize` | RETYPE | `xs`, `sm`, `md`, `lg` | thêm `cover`, giữ default `md` | existing overlays unchanged; Global Search uses cover | Typecheck and shell test |
| `SurfaceSelectionList` | public API | ADD | none | keyed items, selected key, label, contract, branded render, loading; select/activate actions | two pure-overlay call sites | Branch tests both fixture shapes |
| `SearchCommandField` | public API | ADD | none | controlled data và change/clear/previous/next/submit actions | pure overlay | Leaf interaction tests |
| `useQueryAutocompleteGlobalSearchSwr` | hook API | ADD | none | query, entities, size 6, enabled | connected overlay qua `@/hooks` | Cache-key and disabled-state tests |
| `queryAutocompleteGlobalSearch` | query API | ADD | none | optional-auth query cho đủ tám bucket | SWR hook | Query document and envelope tests |

### SUPPORTING PRODUCTION BOUNDARY

Boundary 25 path, owner states, scope mapping và acceptance evidence giữ nguyên chính xác theo `review r1`; không có owner, prop, state hoặc backend source nào được thêm khi duyệt.

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `global-search-c-search-workspace-review-r1` được duyệt để Apply |
| Frozen design | Modal `cover`, sidebar scopes, selectable joined results và context pane |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/global-search-modal-20260815.md` | modified — append explicit Review approval |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Exact Review revision đã được thầy duyệt |

### WARNINGS

| Warning | Impact |
|---|---|
| FE worktree đang có bốn file sửa sẵn ngoài Global Search | Apply phải xác nhận baseline commit trước production write để không gom nhầm ownership |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | Giữ nguyên Review r1 | Không có feedback thay đổi revision |

### OWED

| Owed | Cleared by |
|---|---|
| Baseline commit trước production edit | Xác nhận FE repo/branch, exact Touching và quyền commit hiện trạng dirty worktree |
| Implementation và proof | `starci-fe-design-apply` |

## apply r1

Applied revision: `global-search-c-search-workspace-review-r1`
Baseline commit: `cd7f7ae66de937dd19065af3e1c84c8d866e86c4`
Tracked diff: `cd7f7ae66de937dd19065af3e1c84c8d866e86c4..worktree`

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
| Repo / branch | FE `D:\Repositories\starci-academy-fe @ main`; BE `D:\Repositories\starci-academy-backend @ mtp` |
| Purpose | Triển khai revision Global Search workspace đã duyệt và chứng minh source, runtime và cross-repository lint |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\global-search-modal-20260815.md |
| Language | vi |
| Phase | apply |
| Touching | Workflow này và đúng 25 frontend paths trong `SUPPORTING PRODUCTION BOUNDARY` của Review r1; không sửa backend source |

Baseline hiện trạng FE đã được thầy xác nhận bằng lệnh `tiếp tục`; commit chỉ chứa bốn file dirty đã công bố trước Apply.

### APPLY FINDING 1

| Finding | Evidence | Impact |
|---|---|---|
| `SurfaceSelectionList` branch không được sở hữu HeroUI `ListBox` | Focused ESLint `starci-fe/vendor-boundary` tại `src/components/branches/SurfaceSelectionList/index.tsx:4` | Cần chuyển vendor selection owner sang một leaf đóng kín; không được sửa lint rule hoặc dùng raw DOM để lách |
| Overlay không được lồng `SurfaceCard` | Focused ESLint `starci-fe/no-surface-branch-in-overlay` tại `GlobalSearchOverlay/component.tsx:2` | Context và recovery phải render trực tiếp trong bounded overlay bằng Tree/leaf/composite |

Apply tạm dừng trước mọi path ngoài Review r1 và trả boundary về Review.

### OUTPUTS

| Concept | Result |
|---|---|
| Apply r1 | Baseline `cd7f7ae` đã tạo; data/query/domain và partial overlay trong r1 boundary typecheck pass |
| Boundary finding | Vendor ListBox owner và nested overlay surface phải quay lại Review trước khi tiếp tục |

### CHANGES

| Tree | Details |
|---|---|
| `src/modules/api/graphql/queries/types/global-search.ts` | added — typed request, eight-bucket response và canonical hit fields |
| `src/modules/api/graphql/queries/query-autocomplete-global-search.ts` | added — optional-auth GraphQL document |
| `src/hooks/swr/useQueryAutocompleteGlobalSearchSwr.ts` | added — disabled key, size 6 và stale-data SWR owner |
| `src/hooks/index.ts` | modified — export Global Search hook |
| `src/modules/search/global-search.ts` | added — scope mapping, flattening, counts và safe em parser |
| `src/components/contracts/index.ts` | modified — five reviewed Global Search contracts |
| `src/components/shells/ModalShell/index.tsx` | modified — add cover size |
| `src/components/leaves/SearchCommandField/index.tsx` | added — controlled command input |
| `src/components/branches/SurfaceSelectionList/index.tsx` | added partial — lint finding requires replacement after revised approval |
| `src/components/overlays/search/GlobalSearchOverlay/index.tsx` | added partial — connected search owner |
| `src/components/overlays/search/GlobalSearchOverlay/component.tsx` | added partial — pure workspace; nested SurfaceCard finding pending revision |
| `src/components/layouts/ShellNav/index.tsx` | modified partial — navbar and shortcut intent wiring |
| `src/messages/en.json` | modified — Global Search copy |
| `src/messages/vi.json` | modified — Global Search copy |
| `.workflows/designs/starci-academy/global-search-modal-20260815.md` | modified — Apply baseline, finding and return to Review |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve revised owner/path boundary | Chuyển sang Review r3 ngay dưới đây |

### WARNINGS

| Warning | Impact |
|---|---|
| Apply r1 chưa hoàn tất và partial source chưa có tests | Không được xem là implementation hoàn chỉnh hoặc runtime proof |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Sửa lint rule hoặc suppress vendor errors | Return to Review | Lint canon là boundary evidence, không phải trở ngại để lách |

### OWED

| Owed | Cleared by |
|---|---|
| Revised owner/path approval | Review r3 explicit approval |
| Complete implementation and all proof | Resume Apply after approval |

## review r3

Candidate revision: `global-search-c-search-workspace-review-r2`

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
| Repo / branch | FE `D:\Repositories\starci-academy-fe @ main`; BE `D:\Repositories\starci-academy-backend @ mtp` |
| Purpose | Sửa owner/path mâu thuẫn lint canon mà không đổi thesis, interaction hoặc data contract đã duyệt |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\global-search-modal-20260815.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; Apply chưa được viết path mới ngoài Review r1 |

### REVIEW VERDICT

| Decision | Revised verdict | Reason |
|---|---|---|
| Selectable scope/result owner | `SelectionList` leaf ADD tại `src/components/leaves/SelectionList/index.tsx`; bỏ `SurfaceSelectionList` branch | Leaf là tier được phép sở hữu HeroUI ListBox và đóng kín row anatomy qua typed data variant |
| Context pane | Tree `global-search-context-card` trực tiếp, không `SurfaceCard` | Overlay đã là surface; context là region cùng surface, không phải card lồng card |
| Idle/empty/error | Tree `empty-notice-card` trực tiếp với `EmptyNotice`, không `SurfaceCard` | Giữ bounded recovery region nhưng không thêm vendor surface |
| Product thesis | Giữ nguyên r1 | Modal cover, six scopes, joined results, context pane, keyboard model và backend mapping không đổi |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| layout | ShellNav connected | MODIFY | `src/components/layouts/ShellNav/index.tsx` | same | route layout | Named navbar/shortcut intent và one overlay mount | Global trigger owner |
| layout | `_ShellNav` pure | REUSE | `src/components/layouts/ShellNav/component.tsx` | same | connected shell | Existing `openSearch` | Trigger API đã có |
| overlay | `GlobalSearchOverlay` connected | ADD | none | `src/components/overlays/search/GlobalSearchOverlay/index.tsx` | `ShellNav` | Query, debounce, scope, selection, navigation | Data owner |
| overlay | `_GlobalSearchOverlay` pure | ADD | none | `src/components/overlays/search/GlobalSearchOverlay/component.tsx` | connected twin | Discriminated workspace states | Pure render owner |
| shell | `ModalShell` | MODIFY | `src/components/shells/ModalShell/index.tsx` | same | Global Search và existing overlays | Add `cover` only | Vendor modal mechanics |
| leaf | `SelectionList` | ADD | none | `src/components/leaves/SelectionList/index.tsx` | pure overlay scopes/results | Fixed typed items, `scopes`/`results` variants, selected key, select/activate | HeroUI ListBox belongs to leaf tier |
| leaf | `SearchCommandField` | ADD | none | `src/components/leaves/SearchCommandField/index.tsx` | pure overlay | Controlled query and named key actions | Command input owner |
| branch | `Tree` | REUSE | `src/components/branches/Tree/index.tsx` | same | workspace/body/context/notice | Five approved Global Search contracts | All layout remains registry-owned |
| composite | `EmptyNotice` | REUSE | `src/components/composites/EmptyNotice/index.tsx` | same | idle/empty/error region | Existing recovery grammar | No nested surface |
| leaf | `Heading`, `Text`, `Icon`, `Badge`, `Button` | REUSE | existing paths | same | pure overlay and `SelectionList` internals | Existing vocabulary | No decorative owner |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| ShellNav connected | search intent state | ADD | none | one named `source`/`requestId` intent and dismiss reset | `_ShellNav.openSearch`, global shortcut, `GlobalSearchOverlay` | Integration tests cover navbar, shortcut and dismissal |
| `_ShellNav` | `ShellNavActions.openSearch` | KEEP | optional callback | same | connected shell | Existing component test plus one press assertion |
| `GlobalSearchOverlay` connected | intent/dismiss | ADD | none | named intent with source/requestId; named dismiss | connected shell | Integration tests navbar + shortcut + close |
| `_GlobalSearchOverlay` pure | state/actions | ADD | none | discriminated state and named search actions | connected twin | Pure state tests |
| `ModalShell` | size | RETYPE | `xs`, `sm`, `md`, `lg` | add `cover` | Global Search; old calls unchanged | Typecheck and shell test |
| `SelectionList` | public API | ADD | none | `variant`, fixed typed item data, `selectedKey`, `label`; select/activate | two pure-overlay call sites | Leaf tests cover scope/result anatomy, arrows and Enter |
| `SearchCommandField` | public API | ADD | none | controlled data; change/clear/previous/next/submit | pure overlay | Leaf tests |
| SWR/query/domain APIs | request and projections | ADD | none | r1 signatures unchanged | connected overlay | Query/hook/domain tests |

### SUPPORTING PRODUCTION BOUNDARY DELTA

| Remove from r1 boundary | Add to r2 boundary | Reason |
|---|---|---|
| `src/components/branches/SurfaceSelectionList/index.tsx` | `src/components/leaves/SelectionList/index.tsx` | Move vendor owner to permitted tier |
| `src/components/branches/SurfaceSelectionList/index.test.tsx` | `src/components/leaves/SelectionList/index.test.tsx` | Proof follows owner |

All other 23 paths, state mapping and acceptance evidence remain exactly as Review r1. `SurfaceCard` stays REUSE globally but is no longer a Global Search call site and receives no diff.

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate revision | `global-search-c-search-workspace-review-r2` preserves UX and corrects tier ownership |
| Selection semantics | One closed HeroUI `SelectionList` leaf serves scopes and results |
| Overlay surface model | Context and notices remain regions of one modal surface, not nested cards |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/global-search-modal-20260815.md` | modified — append Apply lint finding and revised Review boundary |

### NEED APPROVALS

| Question | Options |
|---|---|
| Phê duyệt owner/path correction để resume Apply | Khuyến nghị `approve global-search-c-search-workspace-review-r2`; UX và backend contract không đổi |

### WARNINGS

| Warning | Impact |
|---|---|
| Partial Apply hiện chỉ nằm trong r1 boundary và typecheck pass | Sau approval phải xóa branch partial, thêm leaf path mới và chạy lại lint trước tests |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Branch trực tiếp import HeroUI ListBox | Closed `SelectionList` leaf | Canon vendor boundary không cho branch thường sở hữu vendor primitive |
| `SurfaceCard` trong overlay | Tree regions trực tiếp | Overlay là bounded surface, nested card tạo hai surface owners |

### OWED

| Owed | Cleared by |
|---|---|
| Exact approval của Review r2 | Thầy trả lời `approve global-search-c-search-workspace-review-r2` |
| Resume Apply, tests và runtime proof | `starci-fe-design-apply` sau approval |

## review r4

Approved revision: `global-search-c-search-workspace-review-r2`

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
| Repo / branch | FE `D:\Repositories\starci-academy-fe @ main`; BE `D:\Repositories\starci-academy-backend @ mtp` |
| Purpose | Ghi explicit approval cho owner/path correction của Review r3 |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\global-search-modal-20260815.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow; production boundary là Review r3 sau approval |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| layout | ShellNav connected | MODIFY | `src/components/layouts/ShellNav/index.tsx` | same | route layout | Global intent/mount | Shell trigger owner |
| layout | `_ShellNav` pure | REUSE | `src/components/layouts/ShellNav/component.tsx` | same | connected shell | Existing openSearch | API exists |
| overlay | `GlobalSearchOverlay` connected | ADD | none | `src/components/overlays/search/GlobalSearchOverlay/index.tsx` | ShellNav | Query/state/navigation | Data owner |
| overlay | `_GlobalSearchOverlay` pure | ADD | none | `src/components/overlays/search/GlobalSearchOverlay/component.tsx` | connected twin | Workspace render union | Pure owner |
| shell | `ModalShell` | MODIFY | `src/components/shells/ModalShell/index.tsx` | same | overlays | Add cover | Vendor mechanics |
| leaf | `SelectionList` | ADD | none | `src/components/leaves/SelectionList/index.tsx` | pure overlay twice | Closed ListBox variants | Permitted vendor owner |
| leaf | `SearchCommandField` | ADD | none | `src/components/leaves/SearchCommandField/index.tsx` | pure overlay | Controlled command input | Input owner |
| branch | `Tree` | REUSE | `src/components/branches/Tree/index.tsx` | same | overlay contracts | Layout registry | Existing branch |
| composite | `EmptyNotice` | REUSE | `src/components/composites/EmptyNotice/index.tsx` | same | state region | Recovery grammar | Existing composite |
| leaf | Existing visual leaves | REUSE | existing paths | same | overlay | Typography/actions | Existing vocabulary |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| ShellNav connected | search intent state | ADD | none | named source/requestId intent and dismiss reset | `_ShellNav`, shortcut, overlay | Integration test |
| `_ShellNav` | openSearch | KEEP | optional callback | same | connected shell | Component test |
| `GlobalSearchOverlay` connected | intent/dismiss | ADD | none | named open intent and dismiss | ShellNav | Integration test |
| `_GlobalSearchOverlay` pure | state/actions | ADD | none | discriminated state/named actions | connected twin | State tests |
| `ModalShell` | size | RETYPE | four sizes | add cover | Global Search; old calls unchanged | Typecheck/test |
| `SelectionList` | public API | ADD | none | fixed items, variant, selected key, named select/activate | pure overlay scopes/results | Leaf tests |
| `SearchCommandField` | public API | ADD | none | controlled value and named key actions | pure overlay | Leaf tests |
| SWR/query/domain APIs | request/projection | ADD | none | Review r1 signatures | connected overlay | Focused tests |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `global-search-c-search-workspace-review-r2` |
| Boundary correction | ListBox leaf ownership và one overlay surface approved |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/global-search-modal-20260815.md` | modified — append explicit Review r2 approval |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Revision đã được duyệt bằng `tiếp tục` |

### WARNINGS

| Warning | Impact |
|---|---|
| None | Boundary mới giải quyết hai lint findings |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | Giữ Review r3 | Không có feedback mới |

### OWED

| Owed | Cleared by |
|---|---|
| Apply r2 implementation/proof | Resume Apply below |

## apply r2

Applied revision: `global-search-c-search-workspace-review-r2`
Baseline commit: `cd7f7ae66de937dd19065af3e1c84c8d866e86c4`
Tracked diff: `cd7f7ae66de937dd19065af3e1c84c8d866e86c4..worktree`

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
| Repo / branch | FE `D:\Repositories\starci-academy-fe @ main`; BE `D:\Repositories\starci-academy-backend @ mtp` |
| Purpose | Resume implementation trên approved corrected boundary và hoàn thành mọi proof |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\global-search-modal-20260815.md |
| Language | vi |
| Phase | apply |
| Touching | Review r3 corrected 25-path frontend boundary và workflow này; không sửa backend source |

### OUTPUTS

| Concept | Result |
|---|---|
| Implemented concept | Direction C — cover-size Global Search workspace with six scopes, joined result ListBox and responsive context pane |
| Backend integration | Live optional-auth `autocompleteGlobalSearch` query returned 30 results for `system`; Learning scope returned exactly 12 |
| Interaction proof | Navbar click, `Ctrl+K`, 200 ms debounce, scope selection, ArrowDown preview, Enter activation, Escape dismissal and context CTA are wired |
| Safety proof | Backend `<em>` highlights are parsed as safe text segments; no raw HTML injection |
| Baseline/diff | `cd7f7ae66de937dd19065af3e1c84c8d866e86c4..worktree`; exactly the approved 25 FE paths |
| Gates | Focused 33/33 tests, TypeScript, canonical lint, FE build, FE lint and BE `lint:check` pass |

### CHANGES

| Tree | Details |
|---|---|
| `src/modules/api/graphql/queries/{types/global-search.ts,query-autocomplete-global-search.ts,query-autocomplete-global-search.test.ts}` | Added typed eight-bucket optional-auth transport and transport proof |
| `src/hooks/swr/useQueryAutocompleteGlobalSearchSwr.{ts,test.ts}`, `src/hooks/{index.ts,index.test.ts}` | Added disabled/blank-safe SWR hook, full cache identity, previous-data retention and barrel wiring; removed an existing cache-key leak from the hook-only barrel |
| `src/modules/search/global-search.{ts,test.ts}` | Added six-scope entity mapping, canonical route projection, counts, flattening and safe highlight parsing |
| `src/components/leaves/SearchCommandField/*` | Added controlled command input with clear, previous, next and submit outcomes |
| `src/components/leaves/SelectionList/*` | Added closed HeroUI ListBox leaf for scope/result variants, selection and explicit Enter activation |
| `src/components/overlays/search/GlobalSearchOverlay/*` | Added connected data/state/navigation owner and pure one-surface responsive workspace twin |
| `src/components/contracts/index.ts` | Added three live layout contracts: workspace, body and context region; rejected dead row contracts after ListBox ownership moved to the leaf |
| `src/components/shells/ModalShell/{index.tsx,index.test.tsx}` | Added reviewed `cover` size without changing old call sites |
| `src/components/layouts/ShellNav/{index.tsx,index.test.tsx,component.test.tsx}` | Mounted one overlay, wired navbar and Ctrl/Cmd+K intents, and proved forwarding/dismissal |
| `src/messages/{en.json,vi.json}` | Added complete localized Global Search copy |
| `.workflows/designs/starci-academy/global-search-modal-20260815.md` | Recorded revised ownership, baseline, implementation, gates and runtime proof |

### CROSS-REPOSITORY LINT PROOF

| Repository | Working directory | Command | Exit code | Verdict |
|---|---|---|---:|---|
| Frontend | `D:\Repositories\starci-academy-fe` | `npm run lint` | 0 | PASS — canonical mirror gate and ESLint clean |
| Backend | `D:\Repositories\starci-academy-backend` | `npm run lint:check` | 0 | PASS — non-mutating backend lint clean |

### LIVE FLOW PROOF

| Route / state | Proof | Verdict |
|---|---|---|
| `http://localhost:3000/en/courses`, default desktop viewport | Navbar Search opened one dialog with active command field, six scopes and idle recovery | PASS |
| Query `system` | Live backend returned counts All 30, Courses 1, Learning 12, Practice 12, Projects 4, Foundations 1; selected result populated context CTA | PASS |
| Learning scope | Click selected Learning and result ListBox contained exactly 12 rows | PASS |
| Keyboard | ArrowDown moved selected result/context; Escape closed; global Ctrl+K reopened one dialog | PASS |
| Mobile `390x844` | Scope ListBox became horizontal, result rows remained readable, right context pane was hidden, one modal scrollbar remained | PASS |
| Browser console | Zero error-level entries during the same live search window | PASS |
| Backend/asset result | Search results came from the live backend and used canonical paths; no failed request surfaced in UI | PASS |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Approved revision has been applied and proven |

### WARNINGS

| Warning | Impact |
|---|---|
| Full FE suite is 670/682 with 12 failures in unchanged baseline files | Does not expand this approved boundary: four suites cannot resolve `next/navigation`; eight legacy assertions concern dashboard component markers, Apollo link length and `query-courses` fields. None of the failing files differ from baseline. |
| Vite emits its existing native-config warning; Next emits its existing middleware deprecation warning | Non-blocking repository warnings; focused tests, typecheck, lint and build all pass |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `SurfaceSelectionList` branch owning HeroUI | Closed `SelectionList` leaf | Canon permits vendor primitive ownership at the leaf tier |
| Nested `SurfaceCard` inside the modal | Direct Tree context/notice regions | The modal is already the bounded surface |
| Five speculative contracts | Three contracts that have live call sites | Canon forbids dead contract declarations |
| Raw backend highlight HTML | Safe parser and plain React text | Prevent injection and preserve trusted rendering |
| Expanding scope to repair 12 unrelated full-suite failures | Record baseline debt under warning | Apply boundary remains the reviewed Global Search paths |

### OWED

| Owed | Cleared by |
|---|---|
| None inside approved Global Search boundary | Implementation, lint, build, focused tests and live flow all pass |
