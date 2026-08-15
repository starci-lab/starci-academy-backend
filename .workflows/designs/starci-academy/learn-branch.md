<!-- starci-workflow: v2 -->
# learn-branch

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-fe` |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets: frontend and backend supplied by user |
| Frontend | `D:\Repositories\starci-academy-fe` |
| Backend | `D:\Repositories\starci-academy-backend` |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | `starci-academy` |
| Repo / branch | `D:\Repositories\starci-academy-fe` @ `main` |
| Purpose | Plan the complete `/learn` route family while preserving the StarCi Academy legacy product concept, hierarchy, states and interactions exactly unless a later approved decision says otherwise. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md |
| Language | vi |
| Phase | plan |
| Touching | `D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md` only |

### Scope and parity gate

This is a parity-first migration plan. The legacy source is binding evidence for initial render,
content grouping, primitive semantics, route composition, responsive behavior and state branches.
No new card, icon, copy, CTA, interaction, backend promise or visual "improvement" is admitted in
the implementation brief. Any deliberate divergence must be separately approved and recorded.

The route family to cover is:

| Legacy surface | Legacy evidence | FE target status |
|---|---|---|
| `/learn` redirect and `/learn/content` | `src/app/[locale]/courses/[courseId]/learn/page.tsx`, `ContentContents` | shell + content route exist; audit parity |
| content module and content reader | `components/pages/ModulePage`, `components/pages/ContentPage`, `LearnShell` | reader and shell exist; verify all states |
| `/learn/personal-project` | `PersonalProjectPage` and learn blocks | not yet ported as a complete target surface |
| `/learn/flashcards` and quiz/session branches | `FlashcardsPage` and session components | not yet ported as a complete target surface |
| `/learn/mock-interview` and live/session/result branches | `MockInterviewPage` | not yet ported as a complete target surface |
| `/learn/foundations`, category and resource branches | `FoundationsGridPage`, `FoundationsCategoryPage`, `FoundationResourcePage` | not yet ported as a complete target surface |
| `/learn/playground/*` and live setup/session branches | playground pages and session provider | not yet ported as a complete target surface |
| `/learn/mind-map` | `MindMapPage` and `LearnShell` full-bleed behavior | not yet ported as a complete target surface |
| `/learn/leaderboard` | `LeaderboardPage` | not yet ported as a complete target surface |
| `/learn/qa` | `CourseQaPage` | not yet ported as a complete target surface |

Legacy shell evidence is `D:\Repositories\starci-academy\src\components\layouts\LearnShell` and
`D:\Repositories\starci-academy\src\hooks\useSidebarNavItems.ts`. It fixes three groups, the
ordered rows, nested Playground children, enrollment locks, due/rank badges, mobile navigation and
the full-bleed live assessment exceptions. The current FE records
`D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-shell.md` and
`learn-content-page.md` are historical evidence, not permission to skip a fresh whole-branch audit.

### Evidence and implementation boundary

| Claim | Evidence | Consequence |
|---|---|---|
| Legacy owns migration parity | legacy source plus rendered artifacts under `D:\Repositories\starci-academy\.artifacts` | copy structure, order, density, states and interaction before architecture translation |
| The shell is one navigation landmark | `useSidebarNavItems.ts`, legacy `LearnShell`, current `LearnShellLayout` | preserve group order, active state, lock/badge semantics, collapse and mobile behavior |
| Live assessment surfaces are exceptions | legacy `learn/layout.tsx`, mock interview, flashcard quiz, playground and mind-map branches | explicitly model full-bleed ownership; do not leave rails visible by default |
| Backend truth constrains UI | current GraphQL contracts in FE plus backend query/mutation implementations | inventory each surface's loading, empty, locked, error and populated data before design selection |
| Existing FE contracts must be reused first | `src/components/contracts/index.ts`, current learn components and canon | classify every required shape as REUSE, EXTEND or NEW before proposing a contract |

### Directions

| Direction | Product decision | Reuse / contract impact | Acceptance evidence |
|---|---|---|---|
| A — Legacy route-family port (selected parity baseline) | Preserve the legacy shell and each route's own reading order, CTA priority, disclosure, density, responsive branch and live/full-bleed exception. Implement surface by surface, keeping route identity and state semantics intact. | REUSE current shell/reader contracts where behavior matches; EXTEND only for a demonstrated missing legacy state; NEW only where no existing owner can express the legacy relationship. | Legacy source comparison and rendered matrix for every route: signed-out, loading, empty, populated, locked/pending, error, mobile, dark and live/full-bleed where applicable. |
| B — Shared reader frame with mode-owned interiors | Keep one persistent shell and route-owned interiors, but normalize all modes behind a common content frame. | More EXTEND/NEW contract pressure; risks flattening legacy exceptions and ownership boundaries. | Same matrix plus proof that normalized frame does not alter landmarks, primitive roles, or live-surface geometry. |
| C — Mode-first independent surfaces | Port each route as an independent page and share only leaves, while preserving legacy copy and behavior. | Fewer shared contracts but duplicates shell and cross-mode semantics; requires stronger parity audit. | Per-route screenshots and accessibility/interaction comparison, plus proof of identical shared navigation behavior. |

Direction A is selected because the user explicitly requires absolute legacy adherence and the
request names a bounded migration reference. B and C remain rejected alternatives unless review
finds evidence that the legacy source itself has conflicting owners that cannot be translated safely.

### Preview tracking

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `learn-branch/revision-2` | `http://127.0.0.1:8085/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\learn-branch\revision-2\index.html` | `33C08B4105610E8E107F10F2F308A00F623A571AC61918215147ABBC81604D1B` | đang chờ |

### Direction tracking

| Direction | Tab | Status |
|---|---|---|
| A | `A · Legacy parity` | đang chờ |
| B | `B · Shared frame` | đang chờ |
| C | `C · Mode-first` | đang chờ |

### Reuse inventory gate

Before any Apply phase, inventory the current FE owners for: `LearnShellLayout`, `LearnSpine`, route
shell mounting, content map, content reader, pager/tab row, paywall, progress/continue surfaces,
practice/session shells, playground setup/session, mind-map rail, leaderboard board and QA lists.
Each entry must be marked `REUSE`, `EXTEND` or `NEW` with contract `why`, behavior match and state
match. No parallel design tree or proposal JSX is allowed.

### Required review decisions

Review must challenge and approve: the complete route/state matrix; the exact legacy references and
viewport evidence; the full-bleed exception list; backend/GraphQL ownership per state; the reuse
inventory; and the production write boundary. Apply must not begin until the user explicitly approves
the reviewed revision.

### OUTPUTS

| Concept | Result |
|---|---|
| Whole `/learn` design brief | A parity-first route-family plan covering shell, reader, practice, track, commerce/gates and live surfaces. |
| Candidate directions | Three implementation-feasible concepts with Direction A selected as the legacy baseline. |
| Review handoff | A concrete state matrix, reuse gate and evidence list for `starci-fe-design-review`. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md` | added — append-only whole-branch design plan |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve Direction A as the governing baseline for the full `/learn` migration? | A — exact legacy parity (recommended); B — normalized shared reader frame; C — independent mode-first surfaces |

### WARNINGS

| Warning | Impact |
|---|---|
| Current FE worktree is already dirty with learn-related changes | Apply must baseline only after Review approval and must not overwrite unrelated user changes. |
| Existing `learn-shell` and `learn-content-page` records contain historical approvals and owed work | They are evidence, not a complete current whole-branch acceptance record. |
| Some legacy states require authenticated runtime evidence | Static source inspection alone cannot prove redirects, permissions, GraphQL errors or live full-bleed behavior. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Redesigning `/learn` from a generic modern dashboard pattern | Direction A, copied from legacy source first | The user explicitly requires absolute adherence to StarCi Academy legacy. |
| Treating the existing FE shell/content implementation as proof for all `/learn` modes | Audit every legacy route and state before Apply | Existing FE coverage is incomplete and historical records identify owed states. |

### OWED

| Owed | Cleared by |
|---|---|
| Review approval of Direction A and the complete route/state matrix | `$starci-fe-design-review` plus explicit user approval |
| Current GraphQL/backend capability inventory for each mode | Read live contracts, backend resolvers/use cases and realistic fixtures |
| Rendered parity evidence across responsive, gated and live states | Browser capture/runtime comparison at approved target viewports |
| Existing FE reuse classification | Contract/component inventory marked REUSE, EXTEND or NEW |

## plan-outputs

### OUTPUTS

| Concept | Result |
|---|---|
| Plan status | Complete; ready for `starci-fe-design-review`. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md` | appended with plan and canonical output tables |

### NEED APPROVALS

| Question | Options |
|---|---|
| Proceed to Review with Direction A? | Yes — legacy parity baseline (recommended); No — revise direction |

### WARNINGS

| Warning | Impact |
|---|---|
| None beyond the warnings above | No production source was changed. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | None |

### OWED

| Owed | Cleared by |
|---|---|
| Review phase and explicit approval | `$starci-fe-design-review` |

## plan revision 2

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-fe` |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets: frontend and backend supplied by user |
| Frontend | `D:\Repositories\starci-academy-fe` |
| Backend | `D:\Repositories\starci-academy-backend` |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | `starci-academy` |
| Repo / branch | `D:\Repositories\starci-academy-fe` @ `main` |
| Purpose | Chốt preview trực quan cho toàn bộ `/learn`, với Direction A làm baseline parity tuyệt đối với `D:\Repositories\starci-academy`. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md |
| Language | vi |
| Phase | plan |
| Touching | workflow này và `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\learn-branch\revision-2\index.html` |

### Bằng chứng đã đọc

| Nguồn | Kết luận dùng cho preview |
|---|---|
| `D:\Repositories\starci-academy-backend\.claude\skills\starci-fe-design-plan\SKILL.md` | Plan phải có 2–4 tab, serve một `index.html`, ghi URL/PID/SHA-256 và chờ user chọn. |
| `D:\Repositories\starci-academy\src\hooks\useSidebarNavItems.ts` | Shell legacy có ba nhóm, thứ tự row cố định, Playground nested, lock và badge. |
| `D:\Repositories\starci-academy\src\components\layouts\LearnShell` và các `components/pages/*` của `/learn` | Composition, route-owned content, responsive và live/full-bleed là binding evidence. |
| `D:\Repositories\starci-academy-backend\.claude\fe\design\refactor-parity.md` | Primitive semantics, landmark, token, asset và state matrix đều thuộc parity; không được tự ý cải tiến. |
| FE hiện tại `D:\Repositories\starci-academy-fe\src\components\layouts\LearnShellLayout`, `LearnSpine`, `CourseLearnContentPage` | Chỉ là reuse evidence; không dùng implementation hiện tại để ghi đè legacy. |

### Preview tracking

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `learn-branch/revision-2` | `http://127.0.0.1:8085/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\learn-branch\revision-2\index.html` | `33C08B4105610E8E107F10F2F308A00F623A571AC61918215147ABBC81604D1B` | đang chờ |

| Runtime | Giá trị |
|---|---|
| Preview root | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\learn-branch\revision-2` |
| PID | `45504` |
| Port | `8085` |

### Direction tracking

| Direction | Tab | Status |
|---|---|---|
| A | `A · Legacy parity` | đang chờ |
| B | `B · Shared frame` | đang chờ |
| C | `C · Mode-first` | đang chờ |

### Brief và acceptance

| Direction | Quyết định sản phẩm | Acceptance |
|---|---|---|
| A — Legacy parity | Giữ nguyên shell, reading order, CTA priority, disclosure, density, mobile folding, lock/badge semantics và full-bleed exceptions; chỉ dịch ownership sang kiến trúc FE mới. | So sánh từng route với legacy ở signed-out, loading, empty, populated, locked/pending, error, mobile, dark và live/full-bleed. |
| B — Shared frame | Chuẩn hoá một reader frame chung cho các mode nhưng vẫn giữ route-owned interiors. | Phải chứng minh không đổi landmark, primitive role, scroll owner hoặc geometry live state. |
| C — Mode-first | Mỗi mode tự sở hữu surface, chỉ chia sẻ leaves/navigation data. | Phải chứng minh shared navigation vẫn là một landmark và không tạo drift giữa active/lock/badge/mobile states. |

Direction A là lựa chọn parity-first phù hợp yêu cầu của user; tuy nhiên skill yêu cầu user chọn tab
trước khi ghi trạng thái `đã chọn`. Chưa có direction nào được ghi là đã chọn cho đến khi user xác nhận.

### OUTPUTS

| Concept | Result |
|---|---|
| Preview tabbed | Một preview duy nhất có 3 tab chuyển client-side, không reload và không đổi URL. |
| Direction concepts | A parity-first, B shared-frame, C mode-first; mỗi hướng thể hiện khác biệt về composition/ownership. |
| Acceptance brief | Đã ghi state matrix và parity gate cho Review. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md` | appended — revision 2 bằng tiếng Việt, tracking tables và acceptance brief |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\learn-branch\revision-2\index.html` | added — disposable preview evidence, không phải production source |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn direction nào để chuyển sang `starci-fe-design-review`? | A — Legacy parity (khuyến nghị, đúng yêu cầu tuyệt đối); B — Shared frame; C — Mode-first |
| Có giữ preview URL đang chạy để Review mở trực tiếp không? | Có — `http://127.0.0.1:8085/` (khuyến nghị); Không — restart và ghi URL mới |

### WARNINGS

| Warning | Impact |
|---|---|
| FE worktree đang dirty | Preview không thay đổi source, nhưng Apply sau này phải baseline đúng target state và giữ nguyên thay đổi của user. |
| Đây là preview concept, không phải bản sao đầy đủ mọi route | Review vẫn phải đối chiếu source/render legacy cho từng route và state trước Apply. |
| Server đang chạy bằng PID `45504` | Nếu process dừng, phải restart và append PID/port/URL mới; không dùng link stale. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | Chưa có tab nào bị user từ chối. |

### OWED

| Owed | Cleared by |
|---|---|
| User chọn một direction trong 3 tab | Xác nhận A/B/C sau khi mở preview |
| Review challenge/approval | `$starci-fe-design-review` |
| Contract/backend/reuse inventory đầy đủ cho mọi mode | Review đọc live GraphQL, target components và legacy source |

## review

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-fe` |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets: frontend and backend supplied by user |
| Frontend | `D:\Repositories\starci-academy-fe` |
| Backend | `D:\Repositories\starci-academy-backend` |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | `starci-academy` |
| Repo / branch | `D:\Repositories\starci-academy-fe` @ `main` |
| Purpose | Challenge và chốt Direction A thành boundary parity có thể Apply theo từng surface, không phát minh UI ngoài legacy. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md |
| Language | vi |
| Phase | review |
| Touching | workflow này בלבד và review evidence đã khai báo; không chạm FE production source |

### Kết quả challenge

| Hạng mục | Kết luận | Bằng chứng |
|---|---|---|
| Direction | A được giữ; B/C bị loại | User chọn A; yêu cầu là bám tuyệt đối `starci-academy` legacy. |
| Navigation landmark | Giữ một LearnShell với ba nhóm, nested Playground, active/lock/badge và mobile bar | `D:\Repositories\starci-academy\src\hooks\useSidebarNavItems.ts`, legacy `LearnShell`. |
| Route family | Có 29 legacy `page.tsx` dưới `/learn`; FE target mới chỉ có content reader | Inventory route source và target hiện tại. |
| Live exceptions | Quiz, mock interview, playground session và mind map không được giữ rails mặc định | Legacy `learn/layout.tsx` và các page/session owners. |
| Backend promise | Không thêm capability trong review; mỗi surface phải map vào GraphQL/use case hiện có hoặc quay lại backend plan | Backend source và FE query/mutation contracts là authority. |
| Component tier | Không tạo component duplicate theo tên domain; contract/component phải là REUSE, EXTEND hoặc NEW có lý do | `contract.md`, canon layers, current FE registry. |
| Preview proof | Preview `revision-2` trả HTTP 200, có 3 tab và chuyển tab client-side; không phải production source | `http://127.0.0.1:8085/`, `index.html`, PID `45504`. |

### Reuse / ownership verdict

| Owner hoặc shape | Verdict | Điều kiện |
|---|---|---|
| `LearnShellLayout`, `LearnSpine`, route shell mounting | REUSE / EXTEND | Giữ geometry, group order, collapse, mobile và full-bleed switch theo legacy; chỉ EXTEND khi state legacy chưa có owner. |
| Content map, content reader, tab/pager, paywall | REUSE / EXTEND | `content` là entity; markdown, locked/premium, loading/error và footer behavior phải khớp legacy. |
| Practice/session surfaces | NEW theo surface, không copy chung một page | Mỗi page/session owner giữ primitive và interaction của legacy; shared mechanics chỉ qua admitted shell/leaf. |
| Playground setup/session | EXTEND hoặc NEW theo contract evidence | Không gộp setup, readiness, connect sheet và live session thành một surface nếu legacy tách chúng. |
| Mind-map rail/fullscreen | REUSE / EXTEND | Full-bleed ownership và rail semantics phải được chứng minh ở runtime. |
| Leaderboard/QA lists | REUSE nếu contract/state match; NEW nếu quan hệ không biểu đạt được | Không dùng visual similarity làm lý do reuse. |
| GraphQL entries | REUSE trước, EXTEND additive sau, NEW chỉ khi backend capability đã tồn tại | Không mock data để vượt qua backend boundary. |

### Approved revision: learn-branch-A-legacy-parity-r1

Direction A được approve với các ràng buộc sau:

1. Legacy source quyết định composition, order, density, primitive role, copy, responsive branch,
   gated state, loading/error state và live/full-bleed behavior.
2. Apply đi theo surface waves; mỗi wave chỉ viết các file đã inventory trong boundary của wave đó,
   ghi baseline commit riêng và prove state matrix tương ứng.
3. Không thêm icon, card, CTA, interaction, backend field, route hoặc responsive behavior không có
   trong legacy evidence. Divergence phải quay lại Review/Fidelity với lý do cụ thể.
4. Target route root là
   `D:\Repositories\starci-academy-fe\src\app\[lang]\courses\[displayId]\learn`; target component
   ownership chỉ được mở rộng vào các path dưới đây khi wave đó ghi rõ file:

| Wave | Exact target boundary |
|---|---|
| Shell/content parity | `src/app/[lang]/courses/[displayId]/learn/layout.tsx`; `src/app/[lang]/courses/[displayId]/learn/content/**`; `src/components/layouts/LearnShellLayout/**`; `src/components/blocks/learn/LearnSpine/**`; `src/components/pages/CourseLearnContentPage/**`; corresponding existing contract/query/hook/message files only when named in the wave |
| Personal project | `src/app/[lang]/courses/[displayId]/learn/personal-project/**`; named page/block/contract/query/hook/message files mapped from legacy `PersonalProjectPage` |
| Flashcards | `src/app/[lang]/courses/[displayId]/learn/flashcards/**`; named page/block/contract/query/mutation/hook/message files mapped from legacy `FlashcardsPage` |
| Mock interview | `src/app/[lang]/courses/[displayId]/learn/mock-interview/**`; named page/block/contract/query/mutation/hook/message files mapped from legacy `MockInterviewPage` |
| Foundations | `src/app/[lang]/courses/[displayId]/learn/foundations/**`; named page/block/contract/query/hook/message files mapped from legacy foundation pages |
| Playground | `src/app/[lang]/courses/[displayId]/learn/playground/**`; named page/block/provider/contract/query/mutation/hook/message files mapped from legacy playground pages |
| Mind map | `src/app/[lang]/courses/[displayId]/learn/mind-map/**`; named page/block/contract/query/hook/message files mapped from legacy `MindMapPage` |
| Leaderboard + QA | `src/app/[lang]/courses/[displayId]/learn/leaderboard/**`, `src/app/[lang]/courses/[displayId]/learn/qa/**`; named page/block/contract/query/hook/message files mapped from legacy owners |
| Cross-cutting | Existing `src/components/contracts/index.ts`, `src/messages/en.json`, `src/messages/vi.json`, and existing GraphQL files only when the wave records REUSE/EXTEND/NEW and the exact entry. |

5. Required proof per wave: `npx tsc --noEmit`, targeted ESLint, relevant tests, production build
   when route wiring changes, and browser render comparison for legacy states at desktop/mobile.
   Authenticated/live states must be proven with runtime data or explicitly recorded as owed.

### OUTPUTS

| Concept | Result |
|---|---|
| Approved concept | `learn-branch-A-legacy-parity-r1`: port the entire `/learn` family as legacy-first surfaces. |
| Approved meaning | Existing legacy interface is the product baseline; architecture may change, observed interface may not. |
| Apply handoff | Apply may proceed only by named surface wave, with baseline commit, exact files and state proof. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md` | appended — Review revision and approved boundary |

### NEED APPROVALS

| Question | Options |
|---|---|
| Proceed to `starci-fe-design-apply` with approved revision `learn-branch-A-legacy-parity-r1`? | Yes — apply by surface wave (recommended); No — return to Review with a boundary change |

### WARNINGS

| Warning | Impact |
|---|---|
| FE target currently covers only one learn page plus shell/content components | Apply must implement missing surfaces incrementally; one giant unverified diff is not approved. |
| Authenticated/live states are not all render-proven in this Review | Those states remain acceptance gates for their respective Apply wave. |
| Worktree has pre-existing user changes | Apply must not reset, clean or overwrite unrelated paths. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Direction B — shared reader frame | Direction A — route-owned legacy composition | Shared normalization risks changing landmark, disclosure, scroll ownership and full-bleed exceptions. |
| Direction C — independent mode-first surfaces | Direction A — one legacy navigation landmark with mode-owned internals | Independent shells duplicate active/lock/badge/mobile semantics and create parity drift. |
| One all-at-once Apply diff for every `/learn` route | Surface waves with exact boundaries and proofs | The current target is incomplete and the user requires absolute legacy adherence. |

### OWED

| Owed | Cleared by |
|---|---|
| User confirmation to start Apply | Explicit `Yes` for `learn-branch-A-legacy-parity-r1` |
| Per-wave exact file inventory | Apply records each wave before production writes |
| Authenticated/live render proof | Browser/runtime evidence for each applicable state |

## review revision 2

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-fe` |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets: frontend and backend supplied by user |
| Frontend | `D:\Repositories\starci-academy-fe` |
| Backend | `D:\Repositories\starci-academy-backend` |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | `starci-academy` |
| Repo / branch | `D:\Repositories\starci-academy-fe` @ `main` |
| Purpose | Ghi nhận finding trong Apply: Direction A đúng, nhưng boundary hiện tại chưa đủ exact để apply toàn bộ `/learn` mà không tạo parity giả. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md |
| Language | vi |
| Phase | review |
| Touching | workflow này בלבד; không chạm FE production source |

### Finding từ Apply

| Kiểm tra | Kết quả | Hệ quả |
|---|---|---|
| Baseline | `f001f9dbf1f489fc4e0c56596f664d0309a255d2` đã commit trước mọi production edit | Current target state được bảo toàn; không reset/clean. |
| Typecheck | `npx tsc --noEmit` — pass | Nền code hiện tại compile được. |
| Build | `npm run build` — pass | Build pass nhưng route table chỉ có content reader dưới `/learn`. |
| Route parity | Legacy có 29 `page.tsx`; target mới có 1 content reader route | Không thể claim whole-branch parity từ shell/content hiện tại. |
| Missing ownership | personal-project, flashcards, mock-interview, foundations, playground, mind-map, leaderboard, qa và module/content landing chưa có target owners đầy đủ | Tạo redirect/stub sẽ vi phạm “không phát minh behavior”. |
| Mobile/full-bleed | Target shell chưa có legacy overlay/mobile state machine và live session route owners | Không đủ evidence để Apply exact parity. |

### Điều chỉnh boundary bắt buộc

Direction A vẫn giữ nguyên. Tuy nhiên phải chia thành các review-approved waves:

| Wave | Scope cần Review trước Apply |
|---|---|
| A1 | Shell + content landing/module/reader, gồm mobile contents/lesson/outline states và shell full-bleed switch contract. |
| A2 | Personal project + challenge/result, gồm enrollment gate và milestone rail. |
| A3 | Flashcards review/quiz/session/result và live work surfaces. |
| A4 | Mock interview setup/session/result và live work surface. |
| A5 | Foundations, playground setup/session, mind-map. |
| A6 | Leaderboard, QA, redirects/legacy compatibility routes và cross-cutting message/contract cleanup. |

Mỗi wave phải có exact file inventory, GraphQL ownership, fixture identity và render matrix riêng.
Không được viết wave tiếp theo trong cùng một diff khi wave trước chưa pass proof.

### OUTPUTS

| Concept | Result |
|---|---|
| Review finding | Direction A hợp lệ; Apply bị dừng trước production edit vì whole-branch boundary chưa đủ exact. |
| Safe baseline | Target source đã được commit tại `f001f9dbf1f489fc4e0c56596f664d0309a255d2`. |
| Required next brief | A1 shell/content cần được tách và inventory trước khi Apply tiếp tục. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md` | appended — Apply finding và boundary split; không có production source change |

### NEED APPROVALS

| Question | Options |
|---|---|
| Cho phép tiếp tục bằng wave A1 sau khi Review inventory exact files/states? | Yes — A1 shell/content (khuyến nghị); No — giữ nguyên baseline và dừng |

### WARNINGS

| Warning | Impact |
|---|---|
| Baseline commit chứa toàn bộ target source state đang có trước Apply | Đây là snapshot theo yêu cầu skill; các thay đổi có sẵn của user vẫn được giữ nguyên trong commit. |
| Không có production diff sau baseline | Chưa có feature mới nào được claim là đã apply. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Tạo stub/redirect cho các route `/learn` còn thiếu | Tách A1–A6 và port từng legacy owner thật | Stub làm route “xanh” nhưng sai product behavior và vi phạm parity. |

### OWED

| Owed | Cleared by |
|---|---|
| Exact inventory cho A1 | `starci-fe-design-review` revision tiếp theo |
| Production implementation | `starci-fe-design-apply` sau khi A1 boundary được approve |

## review revision 3

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-fe` |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets: frontend and backend supplied by user |
| Frontend | `D:\Repositories\starci-academy-fe` |
| Backend | `D:\Repositories\starci-academy-backend` |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | `starci-academy` |
| Repo / branch | `D:\Repositories\starci-academy-fe` @ `main` |
| Purpose | Ghi nhận user đã approve A1 nhưng source audit vẫn chưa đủ để viết landing/module/mobile parity an toàn. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md |
| Language | vi |
| Phase | review |
| Touching | workflow này בלבד; không chạm FE production source |

### Quyết định

| Item | Result |
|---|---|
| User approval | A1 đã được approve. |
| Safe Apply result | Chưa có production diff sau baseline `f001f9d`. |
| Blocking evidence | FE chưa có content landing/module page owners, mobile contents/lesson/outline state machine hoặc exact contracts/fixtures cho chúng. |
| Next action | Cần một A1 implementation brief bổ sung exact owners/contracts trước khi Apply tiếp tục. |

### OUTPUTS

| Concept | Result |
|---|---|
| A1 status | Đã nhận approval, chưa apply vì thiếu evidence cần thiết để giữ parity. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md` | appended — A1 approval finding |

### NEED APPROVALS

| Question | Options |
|---|---|
| Có cho phép tạo A1 implementation brief riêng để chốt contracts/owners/fixtures trước Apply không? | Yes — tiếp tục A1 review (khuyến nghị); No — giữ baseline hiện tại |

### WARNINGS

| Warning | Impact |
|---|---|
| Không có source change sau baseline | Không thể claim A1 đã implemented. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Tạo landing/module/mobile UI bằng shape gần giống | Chốt exact contracts/owners/fixtures rồi mới viết | Legacy parity yêu cầu đúng anatomy và state, không chỉ route tồn tại. |

### OWED

| Owed | Cleared by |
|---|---|
| A1 implementation brief | `starci-fe-design-review` revision tiếp theo |

## apply

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-fe` |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets: frontend and backend supplied by user |
| Frontend | `D:\Repositories\starci-academy-fe` |
| Backend | `D:\Repositories\starci-academy-backend` |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | `starci-academy` |
| Repo / branch | `D:\Repositories\starci-academy-fe` @ `main` |
| Purpose | Apply phần A1 có binding evidence, track diff và không tạo anatomy giả cho landing/module/mobile states còn thiếu owner. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md |
| Language | vi |
| Phase | apply |
| Touching | `src/app/[lang]/courses/[displayId]/learn/page.tsx` và workflow này |

### Apply record

Applied revision: `learn-branch-A-legacy-parity-r1` (A1 safe subset)

Baseline commit: `f001f9dbf1f489fc4e0c56596f664d0309a255d2`

Tracked diff: `f001f9dbf1f489fc4e0c56596f664d0309a255d2..worktree`

| Proof | Result |
|---|---|
| `npx tsc --noEmit` | pass |
| `npx eslint src/app/[lang]/courses/[displayId]/learn/page.tsx` | pass; React config warning only |
| `npm run build` | pass; route `/[lang]/courses/[displayId]/learn` appears in route table |
| Legacy redirect parity | `/learn` now redirects to `/learn/content` using the locale/displayId route shape. |

### OUTPUTS

| Concept | Result |
|---|---|
| Applied concept | Legacy `/learn` entry point is preserved and now lands on `/learn/content`. |
| Proof | Typecheck, targeted lint and production build are green. |
| Scope status | A1 is partial; landing/module/mobile view owners remain unimplemented and explicitly owed. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-fe\src\app\[lang]\courses\[displayId]\learn\page.tsx` | added — binding legacy `/learn` redirect |
| `D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md` | appended — Apply record, proof and remaining owed work |

### NEED APPROVALS

| Question | Options |
|---|---|
| Continue with a follow-up Review for the remaining A1 page/contracts? | Yes — create the next exact implementation brief (recommended); No — keep the safe redirect subset only |

### WARNINGS

| Warning | Impact |
|---|---|
| A1 was not fully materialized | Content landing/module/mobile parity is not complete and must not be represented as complete. |
| Existing `.artifacts` remain untracked | They were not touched or included in the baseline/diff. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Generic landing/module/mobile replacements | Keep only the binding redirect and return remaining anatomy to Review | Approximate UI would violate absolute legacy parity. |

### OWED

| Owed | Cleared by |
|---|---|
| `CourseLearnContentHomePage` and `/learn/content` route | A follow-up reviewed implementation brief with exact legacy contract mapping |
| `CourseLearnModulePage` and module route | A follow-up reviewed implementation brief with exact legacy data/owner mapping |
| Legacy mobile contents/lesson/outline state machine | A follow-up reviewed implementation brief and runtime state matrix |

## review revision 4

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-fe` |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets: frontend and backend supplied by user |
| Frontend | `D:\Repositories\starci-academy-fe` |
| Backend | `D:\Repositories\starci-academy-backend` |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | `starci-academy` |
| Repo / branch | `D:\Repositories\starci-academy-fe` @ `main` |
| Purpose | Chốt exact A1 owners, contracts, routes và proof để Apply shell/content parity mà không mở scope A2–A6. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md |
| Language | vi |
| Phase | review |
| Touching | workflow này; A1 production paths chỉ là approved boundary cho Apply kế tiếp |

### A1 exact source boundary

| Path | Owner / action |
|---|---|
| `src/app/[lang]/courses/[displayId]/learn/layout.tsx` | REUSE/EXTEND route mounting; preserve `RouteShell`, no domain layout logic. |
| `src/app/[lang]/courses/[displayId]/learn/page.tsx` | NEW legacy-compatible `/learn` redirect to `/learn/content`. |
| `src/app/[lang]/courses/[displayId]/learn/content/page.tsx` | NEW connected course-content landing route. |
| `src/app/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/page.tsx` | NEW connected module route. |
| `src/app/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]/page.tsx` | REUSE current route mounting; no route behavior change beyond A1 parity wiring. |
| `src/components/layouts/LearnShellLayout/component.tsx` | EXTEND frame only for approved mobile/full-bleed mechanics. |
| `src/components/layouts/LearnShellLayout/index.tsx` | EXTEND connected navigation only; no course data ownership. |
| `src/components/blocks/learn/LearnSpine/component.tsx` | EXTEND only if legacy row/group contract requires it. |
| `src/components/blocks/learn/LearnMobileTabBar/component.tsx` | NEW branch for three legacy mobile views: contents, lesson, on-this-page. |
| `src/components/blocks/learn/LearnMobileTabBar/index.tsx` | NEW public export. |
| `src/components/pages/CourseLearnContentHomePage/component.tsx` | NEW pure landing page, based on legacy `CourseContents`. |
| `src/components/pages/CourseLearnContentHomePage/index.tsx` | NEW connected landing page. |
| `src/components/pages/CourseLearnModulePage/component.tsx` | NEW pure module page, based on legacy `ModulePage`. |
| `src/components/pages/CourseLearnModulePage/index.tsx` | NEW connected module page using `useQueryModuleSwr`. |
| `src/components/pages/CourseLearnContentPage/component.tsx` | REUSE current pure reader; only parity corrections found in A1 proof may change it. |
| `src/components/pages/CourseLearnContentPage/index.tsx` | REUSE current connected reader; only A1 query/state wiring may change it. |
| `src/components/contracts/index.ts` | EXTEND/NEW exact A1 contract entries only; no unrelated registry edits. |
| `src/components/contracts/props.ts` | Modify only if the approved A1 contract requires an existing typed helper extension. |
| `src/hooks/swr/useQueryCourseSwr.ts` | REUSE existing course capability for landing. |
| `src/hooks/swr/useQueryModuleSwr.ts` | REUSE existing module capability for module/reader. |
| `src/modules/api/graphql/queries/query-course.ts` | No change unless the landing needs a field already proven by backend but missing from the selected document; then additive EXTEND only. |
| `src/modules/api/graphql/queries/query-module.ts` | REUSE existing module contract; no new backend capability. |
| `src/messages/en.json` | EXTEND only `learn.contentHome`, `learn.module`, `learn.mobile` keys. |
| `src/messages/vi.json` | EXTEND only `learn.contentHome`, `learn.module`, `learn.mobile` keys. |

### Contract inventory

| Contract | Verdict | Why |
|---|---|---|
| `learn-shell-frame` | REUSE | Existing frame already owns spine/body/mobile bar seam. |
| `learn-spine-column`, `learn-nav-group`, `learn-nav-row` | REUSE | Existing shapes match legacy three-group navigation. |
| `learn-mobile-tab-bar` | EXTEND | Existing registry admits three tabs; A1 adds actual mobile view ownership, not a second nav system. |
| `content-reader-frame`, `content-reading-paper`, `content-map-panel`, `content-outline-rail` | REUSE | Current reader already names the three-column reader grammar. |
| `course-content-home-page` | NEW | The landing composition is a distinct route-owned arrangement not expressed by the reader frame. |
| `course-module-page` | NEW | Module identity, continue band, lesson list and challenge list are a distinct legacy page shape. |
| `module-lesson-list`, `module-challenge-list` | REUSE if existing registry shape matches; otherwise NEW with evidence from legacy blocks. |

### A1 acceptance matrix

| State | Route / viewport | Required proof |
|---|---|---|
| Redirect | `/vi/courses/<displayId>/learn` | Redirects to `/learn/content`, no blank shell. |
| Home ready/loading/failed | `/learn/content`, desktop + mobile | Course/module data states match legacy; no invented content titles. |
| Module ready/loading/failed | `/learn/content/modules/<moduleId>`, desktop + mobile | Module header, continue band, lesson/challenge lists, empty/error behavior. |
| Reader ready/pending/locked/failed | `/learn/content/modules/<moduleId>/contents/<contentId>`, desktop + mobile | Existing reader state matrix remains green; map/outline/mobile views match legacy. |
| Full-bleed guard | A1 routes only | Reader shell does not incorrectly force full-bleed; live A2–A5 routes remain explicitly out of A1. |
| Build gates | FE repository | `npx tsc --noEmit`, targeted ESLint, relevant tests, `npm run build`. |

### OUTPUTS

| Concept | Result |
|---|---|
| A1 implementation brief | Exact route, page, block, contract, query/message boundary for shell/content parity. |
| Backend verdict | No backend enabler approved; reuse existing course/module/content queries. |
| Apply handoff | A1 is ready for Apply after explicit confirmation of this exact boundary. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md` | appended — A1 exact implementation brief |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve exact A1 boundary and contract verdicts for Apply? | Yes — apply A1 exactly as listed (recommended); No — revise boundary |

### WARNINGS

| Warning | Impact |
|---|---|
| A1 adds new page/contract owners | They must be built from legacy `CourseContents`/`ModulePage`, not generic dashboard patterns. |
| A1 does not implement A2–A6 | Those routes remain out of scope and must not be stubbed or silently added. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Reuse `CourseDetailPage` as `/learn/content` landing | `CourseLearnContentHomePage` | Course purchase/detail anatomy is not the legacy learning dashboard. |
| Redirect module routes directly to the reader | `CourseLearnModulePage` | Legacy module page owns its own header, continue band and lesson/challenge lists. |
| Use simple route links as mobile tabs | `LearnMobileTabBar` view owner | Legacy mobile tabs switch contents, lesson and outline views without changing route. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of this exact A1 brief | User confirmation, then `starci-fe-design-apply` |

## plan revision 3

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-fe` |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets: frontend and backend supplied by user |
| Frontend | `D:\Repositories\starci-academy-fe` |
| Backend | `D:\Repositories\starci-academy-backend` |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | `starci-academy` |
| Repo / branch | `D:\Repositories\starci-academy-fe` @ `main` |
| Purpose | Chạy lại design-plan toàn bộ `/learn` sau feedback A2-A6 và content, khóa legacy parity, contract ownership, live backend proof và state matrix. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md |
| Language | vi |
| Phase | plan |
| Touching | workflow này; `.workflows/.previews/designs/starci-academy/learn-branch/revision-3/index.html` |

### Evidence and feedback

| Area | Evidence đã đọc | Feedback bắt buộc |
|---|---|---|
| A2 personal-project | Legacy route tree; backend course/outline/attempt/feedback contracts | Shell dashboard/task/result và typecheck xanh; strict lint vẫn yêu cầu tách component/query khỏi `app`; challenge/result cần owner rõ. |
| A3 flashcards | Legacy `/flashcards` → `/review`; deck/stats contracts | Flow functional; cần contract owners và strict lint cleanup. |
| A4 mock-interview | Legacy setup → live → grading → result; start/grade/resume/sync contracts | Còn local shell, chưa nối live GraphQL/socket; chưa gọi là hoàn tất. |
| A5 foundations/playground/mind-map | Legacy hierarchy và responsive surfaces | Route shells có rồi; cần page owners ngoài `app` và contract tree. |
| A6 leaderboard/QA | Legacy course leaderboard; entries/myRank/computedAt | Data shape đúng; route-local data/helper và native structural JSX chưa đạt canon. |
| learn/content | Existing reader and route | Còn gap reactions, next steps, challenge/AI tabs, discussion và desktop rail. |
| Build gate | FE `npx tsc --noEmit`, `git diff --check` | Typecheck/diff sạch; strict lint và browser proof còn owed. |

### Direction proposals

| Direction | Product decision | Feasibility | Legacy parity |
|---|---|---|---|
| `learn-branch-A-legacy-parity-r2` | Giữ route/anatomy legacy; owner/contract canonical; chỉ mở live CTA khi backend đã chứng minh. | Cao | Cao nhất; khuyến nghị. |
| `learn-branch-B-contract-first-r2` | Ưu tiên registry/owner/lint rồi ghép từng surface vào route legacy. | Trung bình | Cao, nhưng visual chậm hơn. |
| `learn-branch-C-progressive-live-r2` | Giữ shell, thay local state bằng query/mutation/socket và chốt từng capability bằng live proof. | Trung bình | Trung bình-cao; có rủi ro shell tạm. |

### Preview tracking

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `learn-branch-r3-feedback` | `http://127.0.0.1:8092/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\learn-branch\revision-3\index.html` | `FCC2A3AF15E12F2491E37A077DEB29A0B07FBF745DEFF5A75BFA4E6F187382AA` | đang chờ |

| Direction | Tab | Status |
|---|---|---|
| `learn-branch-A-legacy-parity-r2` | A — Legacy parity | đang chờ |
| `learn-branch-B-contract-first-r2` | B — Contract-first | đang chờ |
| `learn-branch-C-progressive-live-r2` | C — Progressive states | đang chờ |

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\learn-branch\revision-3`; PID `38604`; port `8092`.

### OUTPUTS

| Concept | Result |
|---|---|
| Feedback-informed learn brief | A2-A6 và `learn/content` cùng nằm trong plan; lint/live/backend/legacy gaps là acceptance evidence, không coi shell là done. |
| Recommended direction | `learn-branch-A-legacy-parity-r2`, parity-first với contract ownership và live proof. |
| Disposable preview | Một HTML tabbed preview có ba hướng và responsive mobile state. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md` | appended — plan revision 3 |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\learn-branch\revision-3\index.html` | added — disposable tabbed preview |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn hướng cho vòng review toàn bộ `/learn`? | `learn-branch-A-legacy-parity-r2` — legacy chuẩn, contract/lint/live proof bắt buộc (khuyến nghị); B contract-first; C progressive-live |

### WARNINGS

| Warning | Impact |
|---|---|
| Route shell/typecheck đã có nhưng strict canonical lint còn fail | Chưa được coi là legacy parity để merge/apply. |
| A4 chưa nối live backend/socket | Completion/resume/grading chưa có runtime proof. |
| Content reader còn thiếu các surface legacy nêu trên | Acceptance content chưa đóng. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Gọi A2-A6 đã hoàn tất chỉ vì route/typecheck đã có | Chọn direction rồi review với lint/live/browser evidence | Feedback agent xác nhận còn gap. |

### OWED

| Owed | Cleared by |
|---|---|
| User chọn một tab direction | Ghi selection ở plan revision kế tiếp |
| Strict canonical lint A2-A6/content | Owner extraction + contract review/apply + canonical lint |
| A4 live proof | Query/mutation/socket + browser fixtures |
| Content reader legacy states | Fidelity/feature evidence và browser proof |
| Design review toàn nhánh | `$starci-fe-design-review` sau khi chọn direction |

## plan revision 4

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
| Purpose | Làm lại Plan cho toàn bộ `/learn` bằng model Sol, dùng legacy làm binding evidence và khóa product direction trước Review. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md |
| Language | vi |
| Phase | plan |
| Touching | workflow này; `.workflows/.previews/designs/starci-academy/learn-branch/revision-4/index.html` |

### Evidence khóa bởi Sol

| Source | Kết luận |
|---|---|
| Legacy `D:\Repositories\starci-academy` | Ba nhóm course navigation, content map–paper–outline, route-specific CTA và full-bleed chỉ cho live session là binding anatomy. |
| Current FE `D:\Repositories\starci-academy-fe` | A1–A6 đã có nhiều shell trong dirty worktree; typecheck xanh nhưng route-local component/query và native structural JSX chưa đạt canonical ownership. |
| Live backend GraphQL/Redis/Socket.IO | Course/module/content, personal task, flashcard, leaderboard và mock-interview capability có contract thật; A4 shell hiện chưa nối start/resume/sync/grade live flow. |
| Content reader hiện tại | Đã có `content-reader-frame` và `learn-content-page`; reactions, next steps, challenge/AI, discussion và desktop rails vẫn là acceptance gaps. |

### Contract inventory

| Owner / key | Verdict | Lý do |
|---|---|---|
| `learn-shell-frame`, `learn-spine-column`, `learn-nav-group`, `learn-nav-row`, `learn-resume-card` | REUSE | Registry/source hiện tại đã sở hữu course shell, spine và ba nhóm navigation. |
| `learn-mobile-tab-bar` | EXTEND | Key đã tồn tại; cần owner thực thi ba view Contents / Lesson / On this page mà không đổi route. |
| `content-reader-frame`, `learn-content-page`, `content-reader-footer` | EXTEND | Anatomy đọc đã tồn tại; cần thêm đúng legacy surfaces còn thiếu, không tạo reader thứ hai. |
| `leaderboard-card`, `leaderboard-standing-row`, `ranked-user-list` | REUSE | Existing owners diễn đạt course ranking; A6 cần connected page/query đúng tầng. |
| Content home và module page contracts | NEW | Landing/module hierarchy là route-owned composition riêng, không phải `course-detail-page`. |
| Personal project dashboard/task/result owners | NEW | Milestone, task attempt và feedback/result không biểu đạt được bằng owner hiện có. |
| Flashcard overview/session/result owners | NEW | Study/Quiz, due queue, session và result có state machine riêng. |
| Mock interview setup/live/result owners | NEW | Socket turn stream, resume, grading và result cần live-session boundary riêng. |
| Foundations/playground/mind-map owners | NEW | Resource browser, lab session và map workspace là ba composition khác nhau. |
| QA page owner | NEW | Redirect về content không thể biểu đạt Q&A surface legacy. |

### Direction proposals

| Direction | Tab | Quyết định sản phẩm |
|---|---|---|
| `learn-r4-a-legacy-parity` | A · Legacy parity | Giữ route identity, reading order, CTA và disclosure theo từng legacy surface; canonical extraction không được thay anatomy. Hướng parity-first được khuyến nghị. |
| `learn-r4-b-guided-resume` | B · Guided resume | Mỗi route thường mở bằng next-best action từ progress/resume data; inventory và rails thu gọn sau CTA. |
| `learn-r4-c-workspace-clusters` | C · Workspace clusters | Learn / Practice / Track thành top-level modes, gom A1–A6 theo intent và hạ route identity xuống cấp hai. |

### Acceptance states

| Area | Desktop | Mobile | Backend/runtime proof |
|---|---|---|---|
| A1 content | Map–paper–outline, reactions, next step, challenge/AI, discussion | Contents / Lesson / On this page tại chỗ | Course/module/content pending, ready, locked, failed |
| A2 personal project | Dashboard → task → attempt result/feedback | Stacked milestones và task action | Outline, attempts và feedback live queries |
| A3 flashcards | Study/Quiz, due today, session, result/history | One-card session và resume | Deck/stats/session sync contracts |
| A4 mock interview | Setup → live full-bleed → grading → result | Live turn stream và leave/retry | start/resume/sync/socket/grade fixtures |
| A5 tools | Foundation browser, playground session, mind-map workspace | Stacked/searchable owners | Live data/session contracts; static shell không phải proof |
| A6 tracking | Course leaderboard và QA owner thật | Responsive rank/Q&A states | entries/myRank/computedAt; redirect chỉ compatibility |

### Preview tracking

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `learn-branch-sol-r4` | `http://127.0.0.1:8093/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\learn-branch\revision-4\index.html` | `E61E5342EB5BC191AE8C1EE41AD2206197460C7A845080F52BE10188A76267C9` | đang chờ |

| Direction | Tab | Status |
|---|---|---|
| `learn-r4-a-legacy-parity` | A · Legacy parity | đang chờ |
| `learn-r4-b-guided-resume` | B · Guided resume | đang chờ |
| `learn-r4-c-workspace-clusters` | C · Workspace clusters | đang chờ |

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\learn-branch\revision-4`; PID `50508`; port `8093`.

### OUTPUTS

| Concept | Result |
|---|---|
| Sol Plan revision 4 | Ba hướng implementation-feasible cho A1–A6, với parity-first và acceptance states desktop/mobile/live. |
| Khuyến nghị | `learn-r4-a-legacy-parity` giữ legacy làm binding decision, đồng thời bắt buộc canonical ownership và live backend proof. |
| Review handoff | Contract inventory và state matrix đủ để Review khóa `COMPONENT DELTA`, `PROPS DELTA` và production boundary. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/.previews/designs/starci-academy/learn-branch/revision-4/index.html` | added — Sol tabbed preview với ba product directions và responsive states |
| `.workflows/designs/starci-academy/learn-branch.md` | appended — Plan revision 4 |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn direction để chuyển sang `$starci-fe-design-review`? | `learn-r4-a-legacy-parity` — khuyến nghị; `learn-r4-b-guided-resume`; `learn-r4-c-workspace-clusters` |

### WARNINGS

| Warning | Impact |
|---|---|
| Dirty FE shells không phải Apply baseline và còn strict lint failures | Review phải MOVE/ADD owners chính xác; không hợp thức hóa route-local components hiện tại. |
| A4 chưa nối backend/socket và A5 còn static shells | Preview không chứng minh runtime capability. |
| QA hiện redirect và content còn thiếu legacy surfaces | A6/A1 chưa đạt parity dù routes resolve. |
| Historical `review[2]` thiếu `COMPONENT DELTA` và `PROPS DELTA` | Validator toàn root vẫn có thể fail; lịch sử không được rewrite trong Plan. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | Chưa có direction revision 4 nào bị từ chối. |

### OWED

| Owed | Cleared by |
|---|---|
| Chọn một direction revision 4 | User xác nhận stable direction ID |
| Khóa exact source boundary | `$starci-fe-design-review` với `COMPONENT DELTA` và `PROPS DELTA` |
| Strict lint, browser và live backend evidence | Apply revision được duyệt rồi chạy canonical lint, responsive browser states và live calls |

## plan revision 4

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
| Purpose | Chạy lại phase Plan cho toàn bộ `/learn`, biến feedback của A1–A6 thành các lựa chọn product có thể review và không coi các shell typecheck xanh là legacy parity hoàn tất. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md |
| Language | vi |
| Phase | plan |
| Touching | `D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md`; `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\learn-branch\revision-4\index.html` |

### Mục tiêu và boundary

Revision này là Plan evidence append-only. Production source tại `D:\Repositories\starci-academy-fe` đang dirty từ lần thử trước và chỉ được đọc; không file production nào được sửa, commit, clean, reset hoặc stage. `.artifacts` không được chạm. Legacy tại `D:\Repositories\starci-academy` là binding reference cho route identity, reading order, CTA priority, disclosure, density, responsive behavior và live/full-bleed exceptions.

App phụ thuộc PostgreSQL primary qua GraphQL; `courseLeaderboard` đọc snapshot cache Redis; mock interview và các live playground flows dùng Socket.IO bên cạnh GraphQL. Preview không hứa dữ liệu hoặc hành vi ngoài các capability đã đọc.

### Evidence đã khóa

| Area | Live evidence | Kết luận Plan |
|---|---|---|
| Canon ownership | `.claude/sources/fe/contract.mjs`, `file-layout.mjs`, `landmark.mjs`, `props-and-slots.mjs`, `loading.mjs`, `the-split.mjs`, `translation.mjs`, `type-safety.mjs` | Route tree chỉ giữ framework route slots; page/block owners sống dưới `src/components`; structural host, classes và child slots phải đi qua contract registry. |
| Current FE gate | `npx tsc --noEmit` pass; `git diff --check` pass; targeted ESLint trên dirty `/learn` files báo `384 problems (384 errors, 0 warnings)` | Typecheck chứng minh shape TypeScript, không chứng minh canonical ownership hoặc legacy parity. |
| A1 content | Current content reader và registry đã có content frame/map/paper/outline/reaction/next-step vocabulary; connected page chưa cấp đủ runtime data | Reactions, next steps, challenge/AI faces, discussion và desktop rails vẫn là acceptance gaps thật. Legacy challenge và challenge-result routes chưa có trong current FE route tree. |
| A2 personal project | Current shell có dashboard/task/result và dùng `myCourseOutline`, `userPersonalTaskAttempts`, `userPersonalTaskAttemptFeedbacks` | Giữ route tree legacy; chuyển query/component ownership ra khỏi `app`; submission/review mutations phải được Review khóa trước khi claim end-to-end. |
| A3 flashcards | Backend có deck/stats và start/resume/sync/complete/history flows cho review, due-review và quiz | Current FE chỉ có `/review` và `/quiz` shells; legacy session/result routes và live lifecycle chưa được port đầy đủ. |
| A4 mock interview | GraphQL có `startMockInterviewSession`, `myInProgressMockInterviewSession`, `syncMockInterviewSessionTurns`, `gradeMockInterviewSession`; Socket.IO có ask/abort turn stream | Current setup/live/result shell dùng local state; chưa có live GraphQL/socket proof và chưa được gọi là hoàn tất. |
| A5 foundations/playground/mind-map | Backend có foundation category/list/detail; playground GraphQL và Socket.IO/RAG capabilities; legacy có dedicated hub/setup/session/map owners | Current shells phần lớn dùng route-local/static composition; cần live client owners, state branches và full-bleed session boundary theo legacy. |
| A6 leaderboard/QA/routes | `courseLeaderboard` trả top entries, `myRank`, `computedAt`; legacy có `CourseQaPage` | Leaderboard data promise là khả thi nhưng owner chưa canonical. Current `/qa` chỉ redirect về content, nên compatibility có nhưng QA product surface chưa parity. |
| Legacy shell | Legacy `LearnShellLayout` và `useSidebarNavItems.ts` | Giữ ba nhóm nav, lock/due/rank facts, Playground children, mobile navigation và chỉ full-bleed cho live assessment/session hoặc mind-map canvas. |

### Route compatibility inventory

| Scope | Binding legacy identity | Current finding | Plan obligation |
|---|---|---|---|
| A1 | `/learn` → `/learn/content`; module, content, challenge và challenge-result | Redirect/home/module/reader có source; challenge branches thiếu | Giữ toàn bộ route identity và reader state matrix. |
| A2 | personal-project dashboard, task, result | Ba route có shell | Giữ identity; canonicalize owner/data/action boundary. |
| A3 | flashcards entry, review/quiz, session và result | Chỉ review/quiz overview routes có source | Bổ sung compatibility cho entry/session/result theo live lifecycle. |
| A4 | setup, interview session, result | Đủ route identity | Nối live start/resume/sync/socket/grade; giữ grading/result states. |
| A5 | foundations hub/category/resource; playground hub/setup/session; mind-map | Đủ route identity chính | Thay static shells bằng live capability owners và đúng full-bleed boundaries. |
| A6 | leaderboard, QA và mọi redirect cũ | Leaderboard route có source; QA redirect tạm | Giữ leaderboard category/rank semantics; QA cần owner thật hoặc quyết định deprecation riêng. |

### Live contract capability matrix

| Surface | Backend capability đã đọc | UI promise được phép | Gap phải Review |
|---|---|---|---|
| Content | course/module/content; `contentReactions`; `contentComments`; progress/challenge mutation families | Reader, reactions, comments, challenge/AI faces khi producer được nối | Exact producer/actions cho reaction, discussion, challenge result và AI session. |
| Personal project | `myCourseOutline`; `userPersonalTaskAttempts`; `userPersonalTaskAttemptFeedbacks` | Dashboard/task/history/result có dữ liệu thật | Submission/sync/review mutation set và loading/error ownership. |
| Flashcards | `flashcardDecksByCourse`; `myFlashcardStats`; start/in-progress/sync/complete/history operations | Study/quiz overview, resumable sessions và results | Exact route-to-operation matrix cho due-review, review và quiz. |
| Mock interview | start/resume/sync/grade GraphQL; ask/abort Socket.IO stream | Setup → live → grading → result | Socket lifecycle, stale sync, abandon/expired/error và grading polling/result handoff. |
| Foundations/playground | foundation category/list/detail; playground/RAG query, mutation và stream capabilities | Browse/read và setup/live workspace | Mind-map exact producer; per-slug playground capability and pairing/readiness states. |
| Leaderboard | `courseLeaderboard` với `entries`, `myRank`, `computedAt` | Course-level categories, viewer rank và cache timestamp | Canonical page/list contracts và empty/enrollment/error states. |

### Contract key inventory

| Verdict | Keys / candidate owner | Lý do |
|---|---|---|
| REUSE | `learn-shell-frame`, `learn-spine-column`, `learn-nav-group`, `learn-nav-row`, `learn-resume-card`, `learn-mobile-tab-bar` | Registry hiện tại đã diễn đạt course spine, three-group navigation, badge/lock fact và mobile entry seam. |
| REUSE | `content-reader-frame`, `content-map-panel`, `content-map-module`, `content-reading-column`, `content-reading-paper`, `content-outline-rail`, `content-reaction-card`, `content-next-list`, `content-next-row` | Đúng anatomy map–paper–outline, reaction và next-step của legacy; Apply phải cấp producer thay vì vẽ shape thứ hai. |
| REUSE | `page-header-stack`, `dual-tabs-toolbar`, `course-module-list`, `course-module-row`, `leaderboard-card`, ranked-user list family, empty/error composites | Những quan hệ generic đã có owner và không cần key mới chỉ để đổi copy. |
| EXTEND | `learn-content-page` | Body union hiện chỉ nhận reading/empty; challenge, AI và discussion faces cần exact body owners nếu Review xác nhận cùng route page. |
| EXTEND | `content-reader-footer` | Registry đã có reactions/next/pager nhưng chưa sở hữu discussion block trong child contract. |
| NEW | `course-content-home-page`, `course-module-page` | Landing và module dashboard là route compositions riêng, không phải reader hoặc catalog. |
| NEW | personal-project dashboard/task/result page owners | Milestone path, submission và attempt feedback tạo quan hệ riêng không thể biểu đạt bằng content reader. |
| NEW | flashcards overview/session/result page owners | Study inventory, focused review/quiz session và result/history có reading order khác nhau. |
| NEW | mock-interview setup/live/result owners | Setup form, streamed two-pane workspace và scorecard là ba compositions riêng. |
| NEW | foundations hub/category/resource; playground hub/setup/session; mind-map workspace owners | Browse, guided setup, live terminal/canvas và graph exploration không chia sẻ một structural relationship. |
| NEW | course leaderboard page và course QA page owners | Course ranking/category composition và threaded QA là route-owned meanings, không phải generic global leaderboard hoặc content discussion footer. |

### Direction proposals

| Direction | Product decision | CTA / disclosure / composition | Feasibility và parity |
|---|---|---|---|
| `learn-branch-A-legacy-parity-r3` | Giữ route-specific reading order và hierarchy legacy; canonical ownership là translation, không redesign. | CTA theo từng route; content map và outline mở theo legacy; chỉ live sessions/mind-map full-bleed. | Khả thi với backend đã đọc; parity cao nhất và là hướng khuyến nghị. |
| `learn-branch-B-guided-resume-r3` | Đưa next-best action lên đầu mọi route thường để người quay lại biết tiếp tục gì trước khi thấy inventory. | Một resume CTA toàn cục; rails/history thu gọn mặc định; progress data quyết định ưu tiên. | Khả thi nhưng cần ranking rule giữa content, flashcards, project và interview; lệch legacy ở CTA priority/disclosure. |
| `learn-branch-C-workspace-clusters-r3` | Biến ba nhóm legacy thành top-level `Learn / Practice / Track`, mỗi capability thành workspace cấp hai. | Cluster switch thay course spine dài; density cao hơn; live capability mở workspace riêng. | Khả thi về route compatibility nhưng lệch legacy nhiều nhất về hierarchy, analytics và composition. |

### Acceptance evidence cho Review

| State | Required proof |
|---|---|
| Navigation/compatibility | Mọi legacy URL trong A1–A6 resolve đúng; redirect nào là tạm thời phải được nêu rõ; active/lock/due/rank/Playground-child semantics đúng desktop và mobile. |
| Canon ownership | Route files chỉ mount page/layout; targeted strict ESLint pass; mọi structural host/classes/children có REUSE/EXTEND/NEW owner được Review khóa. |
| A1 content | Home/module/reader/challenge/result; pending/ready/locked/failed; reactions/next/discussion/AI; desktop rails và mobile Contents/Lesson/On-this-page. |
| A2/A3 | Project task/submission/result/history và flashcard overview/session/resume/sync/complete/result được chứng minh bằng fixtures/live calls. |
| A4 | Start, resume, streamed turns, periodic sync, stale/expired/abort, grade và result có GraphQL/Socket.IO/browser proof. |
| A5 | Foundation data states; playground readiness/pairing/session/stream; mind-map data/search/selection; full-bleed behavior ở đúng route. |
| A6 | Leaderboard loading/empty/error/enrollment/categories/myRank/computedAt; QA owner hoặc explicit approved deprecation; route matrix không có dead end. |
| Responsive | Desktop, tablet và mobile preserve selected direction's reading order; full-bleed surfaces không thừa shell padding/rails. |

### Preview tracking

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `learn-branch-r4-whole-branch` | `http://127.0.0.1:8093/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\learn-branch\revision-4\index.html` | `E61E5342EB5BC191AE8C1EE41AD2206197460C7A845080F52BE10188A76267C9` | đang chờ |

| Direction | Tab | Status |
|---|---|---|
| `learn-branch-A-legacy-parity-r3` | `A · Legacy parity` | đang chờ |
| `learn-branch-B-guided-resume-r3` | `B · Guided resume` | đang chờ |
| `learn-branch-C-workspace-clusters-r3` | `C · Workspace clusters` | đang chờ |

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\learn-branch\revision-4`; PID `50508`; selected port `8093`; URL `http://127.0.0.1:8093/`; HTTP `200`.

### OUTPUTS

| Concept | Result |
|---|---|
| Whole-branch Plan revision 4 | A1–A6 được đặt trong một brief chung với route, live backend, ownership và responsive acceptance evidence. |
| Parity-first direction | `learn-branch-A-legacy-parity-r3` giữ sản phẩm legacy và dùng canon như architecture translation; đây là hướng khuyến nghị. |
| Alternative decisions | B ưu tiên resume CTA và progressive disclosure; C chuyển hierarchy sang workspace clusters. |
| Disposable comparison | Một URL live chứa đúng một HTML với ba tab client-side và desktop/mobile states. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md` | modified — append-only `plan revision 4` |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\learn-branch\revision-4\index.html` | added — disposable tabbed preview duy nhất của revision 4 |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn direction để `$starci-fe-design-review` challenge và khóa exact production boundary? | `learn-branch-A-legacy-parity-r3` — legacy parity, canonical owners, live proof bắt buộc (khuyến nghị); `learn-branch-B-guided-resume-r3` — resume-first; `learn-branch-C-workspace-clusters-r3` — Learn/Practice/Track clusters. Xem cùng một preview tại `http://127.0.0.1:8093/`. |

### WARNINGS

| Warning | Impact |
|---|---|
| Current shells typecheck nhưng targeted strict ESLint báo 384 errors | Không được dùng typecheck để claim canonical ownership hoặc merge readiness. |
| A4 chưa nối live GraphQL/Socket.IO và A1 content còn reaction/next/challenge/AI/discussion/desktop-rail gaps | Setup hoặc reader shell hiện tại chưa chứng minh end-to-end parity. |
| Current route tree thiếu challenge/result và flashcard session/result branches; QA chỉ redirect | Route compatibility chưa hoàn tất dù các entry chính tồn tại. |
| Validator hiện báo historical `review[2]` thiếu `COMPONENT DELTA` heading/table và `PROPS DELTA` heading/table | Revision 4 không được rewrite history; toàn workflow vẫn có thể fail gate dù phase Plan mới đúng boundary. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | Chưa có direction nào bị user từ chối trong revision này. |

### OWED

| Owed | Cleared by |
|---|---|
| User chọn một direction | Trả lời bằng direction ID sau khi xem `http://127.0.0.1:8093/`. |
| Exact component/props/source boundary | `$starci-fe-design-review` với `COMPONENT DELTA`, `PROPS DELTA`, state matrix và live proof per A1–A6. |
| Production implementation | Chỉ `$starci-fe-design-apply` sau Review approval; Plan revision này không cấp quyền sửa FE source. |
| Validator green cho historical `review[2]` | Append-only workflow migration hoặc validator compatibility được trust owner phê duyệt; không rewrite phase cũ. |

## plan revision 5

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
| Purpose | Ghi lựa chọn direction A của người dùng và đóng Plan revision 4 để bàn giao sang Design Review. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md; existing preview D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\learn-branch\revision-4 |

Selected direction: `learn-branch-A-legacy-parity-r3`.

Lý do ghi nhận: người dùng chọn tab A. Direction này giữ legacy làm binding reference cho route identity, reading order, CTA priority, disclosure, responsive behavior và full-bleed exceptions; canonical ownership chỉ là architecture translation, không phải redesign.

### Acceptance states đã chốt cho Review

| State group | Acceptance |
|---|---|
| Navigation và compatibility | Mọi legacy URL A1–A6 resolve đúng; active/lock/due/rank/Playground-child semantics giữ nguyên trên desktop và mobile. |
| A1 content | Home/module/reader/challenge/result; pending/ready/locked/failed; reactions, next steps, challenge/AI, discussion, desktop rails và ba mobile views. |
| A2 personal project | Dashboard/task/submission/result/history dùng live outline, attempts và feedback producers; route file chỉ mount canonical owners. |
| A3 flashcards | Overview/review/quiz/session/resume/sync/complete/result/history giữ route và lifecycle legacy. |
| A4 mock interview | Setup → live full-bleed → grading → result; GraphQL start/resume/sync/grade và Socket.IO ask/abort có browser/live proof. |
| A5 tools | Foundations, playground và mind-map có live owners, đúng disclosure và chỉ full-bleed tại legacy session/canvas boundaries. |
| A6 tracking | Leaderboard loading/empty/error/enrollment/categories/myRank/computedAt; QA có owner thật hoặc deprecation riêng được duyệt, không dùng redirect ngầm làm parity. |
| Canon và proof | Route-only mounting, strict ESLint pass, contract inventory được Review chuyển thành exact `COMPONENT DELTA`/`PROPS DELTA`, responsive browser proof và live calls. |

### Preview tracking

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `learn-branch-r4-whole-branch` | `http://127.0.0.1:8093/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\learn-branch\revision-4\index.html` | `E61E5342EB5BC191AE8C1EE41AD2206197460C7A845080F52BE10188A76267C9` | đã chốt |

| Direction | Tab | Status |
|---|---|---|
| `learn-branch-A-legacy-parity-r3` | A · Legacy parity | đã chọn |
| `learn-branch-B-guided-resume-r3` | B · Guided resume | đã từ chối |
| `learn-branch-C-workspace-clusters-r3` | C · Workspace clusters | đã từ chối |

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\learn-branch\revision-4`; PID `50508`; selected port `8093`.

### OUTPUTS

| Concept | Result |
|---|---|
| Selected direction | `learn-branch-A-legacy-parity-r3` được chốt cho toàn bộ `/learn`. |
| Product boundary | Legacy route/anatomy/CTA/disclosure/responsive behavior là binding; architecture cleanup không được làm thay đổi sản phẩm. |
| Review handoff | Acceptance states A1–A6 và contract inventory của revision 4 sẵn sàng cho `$starci-fe-design-review`. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/learn-branch.md` | appended — ghi lựa chọn A, acceptance states và rejections |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| Historical `review[2]` vẫn thiếu `COMPONENT DELTA` và `PROPS DELTA` | Workflow validator toàn root chưa xanh; Review mới phải append đầy đủ hai bảng và không rewrite history. |
| Dirty FE shells hiện tại không phải Apply baseline | Không production source nào được coi là approved chỉ vì đã typecheck. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `learn-branch-B-guided-resume-r3` | `learn-branch-A-legacy-parity-r3` | Người dùng chọn A; resume-first thay CTA priority và disclosure so với legacy. |
| `learn-branch-C-workspace-clusters-r3` | `learn-branch-A-legacy-parity-r3` | Người dùng chọn A; Learn/Practice/Track thay hierarchy ba nhóm và route composition legacy. |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge và khóa exact source/API boundary | `$starci-fe-design-review` append `COMPONENT DELTA`, `PROPS DELTA`, state matrix và production write boundary |
| Production implementation | Chỉ `$starci-fe-design-apply` sau explicit Review approval |

## review revision 5

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
| Purpose | Challenge direction A và khóa exact source/API boundary cho legacy parity của toàn bộ `/learn`. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md |
| Language | vi |
| Phase | review |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md |

Candidate revision: `learn-branch-A-legacy-parity-review-r1`.

Revision này chưa được approve. Nó challenge `learn-branch-A-legacy-parity-r3` bằng source hiện tại, legacy route tree, canon layer/contract và live backend GraphQL/Socket.IO. Hai route legacy bị Plan bỏ sót — `headhuntings` và `headhunting-companies/[companyId]` — được đưa vào A6 compatibility; bỏ chúng sẽ làm claim “toàn bộ `/learn`” sai.

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| shell | `RouteShell` | REUSE | `src/components/shells/RouteShell/index.tsx` | same | `src/app/[lang]/courses/[displayId]/learn/layout.tsx` | existing shell API | Next `children` vẫn chỉ được brand tại framework boundary. |
| layout | `LearnShellLayout` | MODIFY | `src/components/layouts/LearnShellLayout/index.tsx` | same | learn segment layout; every learn route | `learn-shell-frame` | Giữ ba nav groups, thêm đúng lock/due/rank/Playground-child facts và full-bleed route policy. |
| layout | `_LearnShellLayout` | MODIFY | `src/components/layouts/LearnShellLayout/component.tsx` | same | `LearnShellLayout` | `learn-shell-frame`, `learn-mobile-tab-bar` | Mobile bar phải báo `openTab`, không gửi tab ids vào `openRow`; chỉ reader cung cấp ba view. |
| block | `LearnSpine` | MODIFY | `src/components/blocks/learn/LearnSpine/component.tsx` | same | `_LearnShellLayout` | `learn-spine-column`, `learn-nav-group`, `learn-nav-row`, `learn-resume-card` | Giữ owner hiện có nhưng cấp live fact/locked/children states từ layout. |
| block | `ContentTabRow` | MODIFY | `src/components/blocks/learn/ContentTabRow/component.tsx` | same | `_CourseLearnContentPage` | existing content tab contracts | Face tabs phải có reading/challenge/AI producers và disabled/locked states thật. |
| route | `LearnIndexRoute` | REUSE | `src/app/[lang]/courses/[displayId]/learn/page.tsx` | same | Next router | none | Redirect `/learn` → `/learn/content` đã đúng identity. |
| route | `ContentHomeRoute` | REUSE | `src/app/[lang]/courses/[displayId]/learn/content/page.tsx` | same | Next router → `CourseLearnContentHomePage` | none | Route chỉ mount page. |
| page | `CourseLearnContentHomePage` twins | MODIFY | `src/components/pages/CourseLearnContentHomePage/index.tsx`; `component.tsx` | same | content home route | `course-content-home-page` ADD | Thay native structural shell bằng connected/pure page, loading/failed/empty/ready và module navigation legacy. |
| route | `ModuleRoute` | REUSE | `src/app/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/page.tsx` | same | Next router → `CourseLearnModulePage` | none | Route chỉ mount page. |
| page | `CourseLearnModulePage` twins | MODIFY | `src/components/pages/CourseLearnModulePage/index.tsx`; `component.tsx` | same | module route | `course-module-page`, `module-lesson-list`, `module-challenge-list` ADD | Header, continue band, lesson/challenge order và states phải khớp legacy. |
| route | `ContentReaderRoute` | REUSE | `src/app/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]/page.tsx` | same | Next router → `CourseLearnContentPage` | none | Route identity đã đúng. |
| page | `CourseLearnContentPage` twins | MODIFY | `src/components/pages/CourseLearnContentPage/index.tsx`; `component.tsx` | same | reader route | `content-reader-frame`, `learn-content-page`, `content-reader-footer` | Nối reactions, next step, discussion, challenge/AI faces, rails và mobile views; giữ pending/ready/locked/failed. |
| route | `ContentChallengeRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]/challenges/[challengeId]/page.tsx` | Next router → `CourseLearnChallengePage` | none | Legacy route identity còn thiếu. |
| route | `ContentChallengeResultRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]/challenges/[challengeId]/result/page.tsx` | Next router → `CourseLearnChallengeResultPage` | none | Legacy result identity còn thiếu. |
| page | `CourseLearnChallengePage` twins | ADD | absent | `src/components/pages/CourseLearnChallengePage/index.tsx`; `component.tsx` | challenge route | `course-learn-challenge-page` ADD | Challenge brief/editor/submission states là page riêng, không phải reader boolean. |
| page | `CourseLearnChallengeResultPage` twins | ADD | absent | `src/components/pages/CourseLearnChallengeResultPage/index.tsx`; `component.tsx` | challenge result route | `course-learn-challenge-result-page` ADD | Score/feedback/retry/next state có reading order riêng. |
| layout | `PersonalProjectWorkspaceLayout` twins | ADD | absent | `src/components/layouts/PersonalProjectWorkspaceLayout/index.tsx`; `component.tsx` | personal-project segment layout and three A2 routes | `personal-project-workspace-frame` ADD | Milestone chrome/request sống qua dashboard/task/result navigation. |
| route | `PersonalProjectLayoutRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/personal-project/layout.tsx` | Next router → `RouteShell` + `PersonalProjectWorkspaceLayout` | none | Legacy workspace layout bị thiếu. |
| route | `PersonalProjectRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/personal-project/page.tsx` | same | Next router → `CoursePersonalProjectPage` | none | Chỉ mount canonical page. |
| page | `CoursePersonalProjectPage` twins | MOVE | `src/app/[lang]/courses/[displayId]/learn/personal-project/component.tsx` | `src/components/pages/CoursePersonalProjectPage/component.tsx`; connected half `index.tsx` ADD | personal-project route | `course-personal-project-page` ADD | Route-local fetching/state/structural JSX vi phạm PAGE-1/PAGE-8. |
| route | `PersonalProjectTaskRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/personal-project/tasks/[taskId]/page.tsx` | same | Next router → `CoursePersonalProjectTaskPage` | none | Chỉ mount canonical page. |
| page | `CoursePersonalProjectTaskPage` twins | MOVE | `src/app/[lang]/courses/[displayId]/learn/personal-project/tasks/[taskId]/component.tsx` | `src/components/pages/CoursePersonalProjectTaskPage/component.tsx`; connected half `index.tsx` ADD | task route | `course-personal-project-task-page` ADD | Task load/submission/action cần split connected/pure. |
| route | `PersonalProjectResultRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/personal-project/tasks/[taskId]/result/page.tsx` | same | Next router → `CoursePersonalProjectResultPage` | none | Chỉ mount canonical page. |
| page | `CoursePersonalProjectResultPage` twins | MOVE | `src/app/[lang]/courses/[displayId]/learn/personal-project/tasks/[taskId]/result/component.tsx` | `src/components/pages/CoursePersonalProjectResultPage/component.tsx`; connected half `index.tsx` ADD | result route | `course-personal-project-result-page` ADD | Attempt history/feedback/result states phải là page owner. |
| route | `FlashcardsIndexRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/flashcards/page.tsx` | Next router redirect → review | none | Legacy entry redirect còn thiếu. |
| route | `FlashcardsReviewRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/flashcards/review/page.tsx` | same | Next router → `CourseFlashcardsReviewPage` | none | Bỏ route-local drawing. |
| route | `FlashcardsQuizRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/flashcards/quiz/page.tsx` | same | Next router → `CourseFlashcardsQuizPage` | none | Bỏ route-local drawing. |
| page | `CourseFlashcardsReviewPage` twins | MOVE | `src/app/[lang]/courses/[displayId]/learn/flashcards/_components.tsx` | `src/components/pages/CourseFlashcardsReviewPage/index.tsx`; `component.tsx` | review route | `course-flashcards-review-page` ADD | Review overview/due/stats/decks cần connected/pure owner. |
| page | `CourseFlashcardsQuizPage` twins | ADD | shared route-local `_components.tsx` | `src/components/pages/CourseFlashcardsQuizPage/index.tsx`; `component.tsx` | quiz route | `course-flashcards-quiz-page` ADD | Quiz overview khác review CTA/data contract. |
| route | `FlashcardReviewSessionRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/flashcards/review/sessions/[sessionId]/page.tsx` | Next router → `CourseFlashcardSessionPage` mode review | none | Legacy resumable session route. |
| route | `FlashcardReviewResultRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/flashcards/review/sessions/[sessionId]/result/page.tsx` | Next router → `CourseFlashcardResultPage` mode review | none | Legacy review result route. |
| route | `FlashcardQuizSessionRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/flashcards/quiz/sessions/[sessionId]/page.tsx` | Next router → `CourseFlashcardSessionPage` mode quiz | none | Legacy quiz session route. |
| route | `FlashcardQuizResultRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/flashcards/quiz/sessions/[sessionId]/result/page.tsx` | Next router → `CourseFlashcardResultPage` mode quiz | none | Legacy quiz result route. |
| page | `CourseFlashcardSessionPage` twins | ADD | absent | `src/components/pages/CourseFlashcardSessionPage/index.tsx`; `component.tsx` | review/quiz session routes | `course-flashcard-session-page` ADD | Focused card lifecycle/start-resume-sync-complete. |
| page | `CourseFlashcardResultPage` twins | ADD | absent | `src/components/pages/CourseFlashcardResultPage/index.tsx`; `component.tsx` | review/quiz result routes | `course-flashcard-result-page` ADD | Result/history/retry actions có page state riêng. |
| route | `MockInterviewSetupRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/mock-interview/page.tsx` | same | Next router → `CourseMockInterviewSetupPage` | none | Chỉ mount setup page. |
| route | `MockInterviewSessionRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/mock-interview/interview/[sessionId]/page.tsx` | same | Next router → `CourseMockInterviewSessionPage` | none | Chỉ mount live page. |
| route | `MockInterviewResultRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/mock-interview/interview/[sessionId]/result/page.tsx` | same | Next router → `CourseMockInterviewResultPage` | none | Chỉ mount result page. |
| page | `MockInterviewPage` local-state shell | REMOVE | `src/components/pages/MockInterviewPage/index.tsx` | absent | three mock-interview routes migrated to three owners | none | Một component local state giả setup/live/result, không có pure twin hoặc live transport. |
| page | `CourseMockInterviewSetupPage` twins | ADD | absent | `src/components/pages/CourseMockInterviewSetupPage/index.tsx`; `component.tsx` | setup route | `course-mock-interview-setup-page` ADD | Start/resume choice và configuration có screen state riêng. |
| page | `CourseMockInterviewSessionPage` twins | ADD | absent | `src/components/pages/CourseMockInterviewSessionPage/index.tsx`; `component.tsx` | session route | `course-mock-interview-session-page` ADD | Full-bleed Socket.IO turns, periodic sync, abort/expired/error. |
| page | `CourseMockInterviewResultPage` twins | ADD | absent | `src/components/pages/CourseMockInterviewResultPage/index.tsx`; `component.tsx` | result route | `course-mock-interview-result-page` ADD | Grade polling/result/ retry có composition riêng. |
| page | `CourseFoundationsPage` twins | MOVE | `src/app/[lang]/courses/[displayId]/learn/foundations/_components.tsx` | `src/components/pages/CourseFoundationsPage/index.tsx`; `component.tsx` | foundations route | `course-foundations-page` ADD | Static route-local CATEGORIES phải thay bằng live block/page owners. |
| page | `CourseFoundationCategoryPage` twins | ADD | shared `_components.tsx` | `src/components/pages/CourseFoundationCategoryPage/index.tsx`; `component.tsx` | category route | `course-foundation-category-page` ADD | Search/list/loading/empty/error theo backend. |
| page | `CourseFoundationResourcePage` twins | ADD | shared `_components.tsx` | `src/components/pages/CourseFoundationResourcePage/index.tsx`; `component.tsx` | resource route | `course-foundation-resource-page` ADD | Resource reader không được dùng hard-coded copy shell. |
| layout | `PlaygroundSessionLayout` twins | ADD | absent | `src/components/layouts/PlaygroundSessionLayout/index.tsx`; `component.tsx` | playground `[slug]/layout.tsx` | `playground-session-frame` ADD | Pairing/socket/session phải sống qua setup → live navigation. |
| route | `PlaygroundSlugLayoutRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/playground/[slug]/layout.tsx` | Next router → `RouteShell` + `PlaygroundSessionLayout` | none | Legacy persistent session boundary còn thiếu. |
| page | `CoursePlaygroundPage` twins | MOVE | `src/app/[lang]/courses/[displayId]/learn/playground/_components.tsx` | `src/components/pages/CoursePlaygroundPage/index.tsx`; `component.tsx` | playground hub route | `course-playground-page` ADD | Hub data/copy/state ra khỏi route. |
| page | `CoursePlaygroundSetupPage` twins | ADD | shared `_components.tsx` | `src/components/pages/CoursePlaygroundSetupPage/index.tsx`; `component.tsx` | `[slug]` route | `course-playground-setup-page` ADD | Pairing/readiness/start states theo live provider. |
| page | `CoursePlaygroundSessionPage` twins | ADD | shared `_components.tsx` | `src/components/pages/CoursePlaygroundSessionPage/index.tsx`; `component.tsx` | `[slug]/session` route | `course-playground-session-page` ADD | Full-bleed live session, stream/reconnect/finish. |
| page | `CourseMindMapPage` twins | MOVE | `src/app/[lang]/courses/[displayId]/learn/mind-map/_components.tsx` | `src/components/pages/CourseMindMapPage/index.tsx`; `component.tsx` | mind-map route | `course-mind-map-page` ADD | Search/selection/canvas data phải có canonical page owner. |
| page | `CourseLeaderboardPage` twins | MOVE | `src/app/[lang]/courses/[displayId]/learn/leaderboard/page.tsx` | `src/components/pages/CourseLeaderboardPage/index.tsx`; `component.tsx` | leaderboard route | `course-leaderboard-page`; existing leaderboard family REUSE | Route đang fetch/draw; page phải own states, block own request. |
| page | `CourseQaPage` twins | ADD | absent; route redirects | `src/components/pages/CourseQaPage/index.tsx`; `component.tsx` | QA route | `course-qa-page` ADD | Legacy QA là product surface thật, không phải content redirect. |
| route | `CourseQaRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/qa/page.tsx` | same | Next router → `CourseQaPage` | none | Bỏ redirect compatibility tạm. |
| route | `CourseHeadhuntingsRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/headhuntings/page.tsx` | Next router → `CourseHeadhuntingsPage` | none | Legacy whole-branch route bị Plan bỏ sót. |
| route | `CourseHeadhuntingCompanyRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/headhunting-companies/[companyId]/page.tsx` | Next router → `CourseHeadhuntingCompanyPage` | none | Legacy detail identity bị Plan bỏ sót. |
| page | `CourseHeadhuntingsPage` twins | ADD | absent | `src/components/pages/CourseHeadhuntingsPage/index.tsx`; `component.tsx` | headhuntings route | `course-headhuntings-page` ADD | Whole-branch parity phải giữ career discovery surface. |
| page | `CourseHeadhuntingCompanyPage` twins | ADD | absent | `src/components/pages/CourseHeadhuntingCompanyPage/index.tsx`; `component.tsx` | company route | `course-headhunting-company-page` ADD | Company detail/action states có route-owned composition. |
| branch | `Tree` | REUSE | `src/components/branches/Tree/index.tsx` | same | every pure owner | contract registry | Một frame tiếp tục là nơi duy nhất materialize host. |
| branch | surface branch family | REUSE | `src/components/branches/SurfaceCard/index.tsx`; `SurfaceListCard/index.tsx`; `SurfaceFormCard/index.tsx`; `SurfaceAccordionCard/index.tsx` | same | page/block pure twins | existing branch APIs | Không dựng card/list/form bằng native structural JSX. |
| leaf | existing vocabulary leaves | REUSE | `src/components/leaves` | same | all pure twins through contract slots | existing leaf metadata | Không thêm domain leaf hoặc vendor import ở page/block. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| `LearnShellLayout` | connected props | ADD | `{ displayId, surface }` | thêm route-derived `mode`, live spine facts và reader mobile-tab contribution resolved internally; không nhận fetched page payload | learn segment layout only | Typecheck plus no page imports/call sites outside route layout. |
| `_LearnShellLayout` | `LearnShellLayoutData` | RETYPE | `{ spine, tabs? }` với static tabs | `{ spine, mobileTabs?, isFullBleed }`; tabs chỉ có trên reader/mobile state | `LearnShellLayout` | Pure fixtures prove ordinary/full-bleed/reader variants. |
| `_LearnShellLayout` | actions | ADD | `openRow` only | `openRow`, `openMobileTab` | connected layout | Clicking all three mobile tabs changes view without URL change. |
| `LearnSpine` | row/group data | RETYPE | optional `fact`, `isLocked`, `children` shape chưa có live producers | typed lock/due/rank/child facts with resolved labels and destinations | connected learn layout | Legacy nav fixture asserts order/groups/facts and no fabricated values. |
| `ContentTabRow` | face actions | RETYPE | generic `selectFace(id)` | finite `selectReading`, `selectChallenge`, `selectAi`; disabled/locked state in data | `CourseLearnContentPage` | Impossible face/action combinations do not typecheck. |
| `CourseLearnContentHomePage` | connected props | KEEP | `{ displayId }` | same | content home route | Route call remains one exact prop. |
| `_CourseLearnContentHomePage` | state/data/actions | RETYPE | `pending|ready|failed`, loose title/modules, unused retry/module actions | discriminated `pending|ready|empty|failed`; resolved module rows; `openModule`, `retry` | connected twin | Fixture render for four states and module click route. |
| `CourseLearnModulePage` | connected props | RETYPE | `{ moduleId }` | `{ displayId, moduleId }` | module route | Navigation/progress producers have both route identities. |
| `_CourseLearnModulePage` | state/data/actions | RETYPE | loose `{ state,title,module,label }` | discriminated pending/ready/empty/failed with header, continue target, lesson/challenge rows; named actions | connected twin | Fixtures cover no-content/no-challenge and continue navigation. |
| `CourseLearnContentPage` | connected props | KEEP | `{ displayId,moduleId,contentId }` | same | reader route | Route call unchanged. |
| `_CourseLearnContentPage` | data/actions | RETYPE | reader basics and face/tab actions | add reactions, next targets, discussion summary/actions, challenge/AI availability, mobile view selection | connected twin and content blocks | Ready/locked/failed fixtures plus live producers for every non-copy value. |
| `CourseLearnChallengePage` | twin API | ADD | absent | connected `{ displayId,moduleId,contentId,challengeId }`; pure discriminated pending/ready/submitting/passed/failed with submit/retry actions | challenge route | Query/mutation twin specs and route fixture. |
| `CourseLearnChallengeResultPage` | twin API | ADD | absent | same route ids; pure pending/ready/failed with feedback/retry/next actions | result route | Result live-call fixture and no invented score. |
| `PersonalProjectWorkspaceLayout` | twin API | ADD | absent | connected `{ displayId, surface }`; pure settled milestone spine + workspace surface | segment layout | Navigation preserves provider/request across child routes. |
| `CoursePersonalProjectPage` | twin API | RETYPE | route-local `{ lang,displayId }`, local effects/state | connected `{ displayId }`; pure pending/ready/empty/failed with progress/milestones and `openTask/retry` | dashboard route | Remove all imports from old route-local component/query/types. |
| `CoursePersonalProjectTaskPage` | twin API | RETYPE | inline `{ lang,displayId,taskId }`, local effects | connected `{ displayId,taskId }`; pure pending/ready/submitting/failed with `submit/retry` | task route | Live attempt mutation and task fixtures. |
| `CoursePersonalProjectResultPage` | twin API | RETYPE | route-local params/state | connected `{ displayId,taskId }`; pure pending/ready/empty/failed with attempts/feedback and `retryTask` | result route | Attempts/feedback queries and call-site search remove old component. |
| `CourseFlashcardsReviewPage` | twin API | ADD | route-local overview props | connected `{ displayId }`; pure pending/ready/empty/failed with due/stats/decks and `start/resume/openQuiz` | review route | Deck/stats fixtures and lifecycle call assertions. |
| `CourseFlashcardsQuizPage` | twin API | ADD | route-local overview props | connected `{ displayId }`; pure pending/ready/empty/failed with quiz configuration and `start/resume/openReview` | quiz route | Quiz start/resume fixtures. |
| `CourseFlashcardSessionPage` | twin API | ADD | absent | connected `{ displayId,sessionId,mode }`; pure pending/active/syncing/completing/expired/failed with answer/rate/next/complete/abort | two session routes | Start/in-progress/sync/complete live calls and browser resume proof. |
| `CourseFlashcardResultPage` | twin API | ADD | absent | connected `{ displayId,sessionId,mode }`; pure pending/ready/failed with score/history/retry | two result routes | Result/history query fixture per mode. |
| `MockInterviewPage` | public API | REMOVE | `{ displayId,sessionId?,resultSessionId? }` and local `InterviewState` | removed | setup/session/result routes | `rg MockInterviewPage` returns no consumers after migration. |
| `CourseMockInterviewSetupPage` | twin API | ADD | absent | connected `{ displayId }`; pure pending/ready/resumable/starting/failed with configure/start/resume/retry | setup route | Start and in-progress query tests. |
| `CourseMockInterviewSessionPage` | twin API | ADD | absent | connected `{ displayId,sessionId }`; pure connecting/live/syncing/expired/failed with answer/ask/abort/leave/finish | session route | Socket ask/abort plus sync cadence/reconnect browser proof. |
| `CourseMockInterviewResultPage` | twin API | ADD | absent | connected `{ displayId,sessionId }`; pure grading/ready/failed with retry/newSession | result route | Grade mutation and attempt-by-session polling fixture. |
| `CourseFoundationsPage` | twin API | ADD | static `{ displayId,isVi }` | connected `{ displayId }`; pure pending/ready/empty/failed with query/category actions | foundations route | foundationCategories localized live fixture. |
| `CourseFoundationCategoryPage` | twin API | ADD | static `{ displayId,categoryId,isVi }` | connected `{ displayId,categoryId }`; pure pending/ready/empty/failed with search/openResource | category route | List/search query fixture. |
| `CourseFoundationResourcePage` | twin API | ADD | static `{ displayId,categoryId,foundationId,isVi }` | connected exact ids; pure pending/ready/not-found/failed with back/openPlayground | resource route | Detail live call and not-found fixture. |
| `PlaygroundSessionLayout` | twin API | ADD | absent | connected `{ displayId,slug,surface }`; provider-owned pairing/socket/session; pure frame/full-bleed state | slug layout | Pairing code/socket identity stays stable from setup to session. |
| `CoursePlaygroundPage` | twin API | ADD | static `{ displayId,isVi }` | connected `{ displayId }`; pure pending/ready/empty/failed with openSetup | hub route | Live catalog fixture. |
| `CoursePlaygroundSetupPage` | twin API | ADD | static `{ displayId,slug,isVi }` | connected `{ displayId,slug }`; pure loading/unpaired/paired/ready/starting/failed | setup route/provider | Pair/readiness/start integration proof. |
| `CoursePlaygroundSessionPage` | twin API | ADD | static `{ displayId,slug,isVi }` | connected exact ids; pure connecting/live/reconnecting/completed/failed with step/submit/leave | session route/provider | Socket/RAG stream and reconnect proof. |
| `CourseMindMapPage` | twin API | ADD | static `{ displayId,isVi }` | connected `{ displayId }`; pure pending/ready/empty/failed with search/select/openContent | mind-map route | Live producer and canvas/mobile fixtures. |
| `CourseLeaderboardPage` | twin API | ADD | route-local params/query/render | connected `{ displayId }`; pure pending/ready/empty/failed with category/retry and viewer standing | leaderboard route | courseLeaderboard variables/data fixtures. |
| `CourseQaPage` | twin API | ADD | absent | connected `{ displayId }`; pure pending/ready/empty/failed with search/ask/openThread/retry | QA route | QA live contract must be named before Apply; no redirect remains. |
| `CourseHeadhuntingsPage` | twin API | ADD | absent | connected `{ displayId }`; pure pending/ready/empty/failed with filters/openCompany | headhuntings route | Legacy route fixture and live producer evidence. |
| `CourseHeadhuntingCompanyPage` | twin API | ADD | absent | connected `{ displayId,companyId }`; pure pending/ready/not-found/failed with apply/back | company route | Detail/action fixture. |
| `CONTRACTS` registry | keys/slots | ADD | keys above absent except explicitly reused families | add every `ADD` contract named in COMPONENT DELTA; modify only listed content/shell keys | all pure twins through `Tree` | `rg` proves every new key has a renderer and no unused key remains. |
| `CourseLearnContentHomePage` twins | connected/pure twin boundary | KEEP | existing two-file owner | same two-file owner; detailed state/API migration in `CourseLearnContentHomePage` row above | content home route | Both exact files remain and connected twin renders exact pure twin on every state. |
| `CourseLearnModulePage` twins | connected/pure twin boundary | KEEP | existing two-file owner | same; detailed API migration above | module route | Call-site and twin-render search. |
| `CourseLearnContentPage` twins | connected/pure twin boundary | KEEP | existing two-file owner | same; detailed API migration above | reader route | Call-site and twin-render search. |
| `ContentChallengeRoute` | route params/mount | ADD | absent | params `{ displayId,moduleId,contentId,challengeId }`; mounts `CourseLearnChallengePage` only | Next router | Route render spec. |
| `ContentChallengeResultRoute` | route params/mount | ADD | absent | same ids; mounts result page only | Next router | Route render spec. |
| `CourseLearnChallengePage` twins | connected/pure twin boundary | ADD | absent | exact two-file owner; detailed state/API above | challenge route | Twin spec. |
| `CourseLearnChallengeResultPage` twins | connected/pure twin boundary | ADD | absent | exact two-file owner; detailed state/API above | result route | Twin spec. |
| `PersonalProjectWorkspaceLayout` twins | connected/pure twin boundary | ADD | absent | exact two-file layout owner | personal-project segment layout | Layout persistence fixture. |
| `PersonalProjectLayoutRoute` | route params/mount | ADD | absent | params `{ displayId }`; `RouteShell` mounts workspace layout | Next router | Route layout spec. |
| `PersonalProjectRoute` | route params/mount | KEEP | params `{ lang,displayId }` | resolve `displayId`; mount page only | Next router | No drawing/imports beyond page. |
| `CoursePersonalProjectPage` twins | connected/pure twin boundary | ADD | route-local component only | exact two-file page owner; detailed API above | dashboard route | Twin spec and old-path removal search. |
| `PersonalProjectTaskRoute` | route params/mount | KEEP | params `{ lang,displayId,taskId }` | resolve ids; mount page only | Next router | Route spec. |
| `CoursePersonalProjectTaskPage` twins | connected/pure twin boundary | ADD | route-local component only | exact two-file page owner; detailed API above | task route | Twin spec and old-path removal search. |
| `PersonalProjectResultRoute` | route params/mount | KEEP | params `{ lang,displayId,taskId }` | resolve ids; mount result page only | Next router | Route spec. |
| `CoursePersonalProjectResultPage` twins | connected/pure twin boundary | ADD | route-local component only | exact two-file page owner; detailed API above | result route | Twin spec and old-path removal search. |
| `FlashcardsIndexRoute` | redirect contract | ADD | absent | redirect to `/learn/flashcards/review` preserving locale/course | Next router | Redirect spec. |
| `FlashcardsReviewRoute` | route params/mount | KEEP | route-local overview mount | page-only mount `{ displayId }` | Next router | Route spec. |
| `FlashcardsQuizRoute` | route params/mount | KEEP | route-local overview mount | page-only mount `{ displayId }` | Next router | Route spec. |
| `CourseFlashcardsReviewPage` twins | connected/pure twin boundary | ADD | shared route-local file | exact two-file page owner; detailed API above | review route | Twin spec and `_components.tsx` removal search. |
| `CourseFlashcardsQuizPage` twins | connected/pure twin boundary | ADD | shared route-local file | exact two-file page owner; detailed API above | quiz route | Twin spec and `_components.tsx` removal search. |
| `FlashcardReviewSessionRoute` | route params/mount | ADD | absent | `{ displayId,sessionId,mode:"review" }` mount only | Next router | Route spec. |
| `FlashcardReviewResultRoute` | route params/mount | ADD | absent | `{ displayId,sessionId,mode:"review" }` result mount only | Next router | Route spec. |
| `FlashcardQuizSessionRoute` | route params/mount | ADD | absent | `{ displayId,sessionId,mode:"quiz" }` mount only | Next router | Route spec. |
| `FlashcardQuizResultRoute` | route params/mount | ADD | absent | `{ displayId,sessionId,mode:"quiz" }` result mount only | Next router | Route spec. |
| `CourseFlashcardSessionPage` twins | connected/pure twin boundary | ADD | absent | exact two-file page owner; detailed API above | two session routes | Twin/live lifecycle specs. |
| `CourseFlashcardResultPage` twins | connected/pure twin boundary | ADD | absent | exact two-file page owner; detailed API above | two result routes | Twin/result specs. |
| `MockInterviewSetupRoute` | route params/mount | KEEP | mounts local-state multipage owner | mounts setup owner `{ displayId }` only | Next router | Route spec. |
| `MockInterviewSessionRoute` | route params/mount | KEEP | mounts local-state multipage owner | mounts session owner `{ displayId,sessionId }` only | Next router | Route spec. |
| `MockInterviewResultRoute` | route params/mount | KEEP | mounts local-state multipage owner | mounts result owner `{ displayId,sessionId }` only | Next router | Route spec. |
| `MockInterviewPage` local-state shell | public API removal | REMOVE | `{ displayId,sessionId?,resultSessionId? }` | component removed | three routes | `rg MockInterviewPage` has no consumers. |
| `CourseMockInterviewSetupPage` twins | connected/pure twin boundary | ADD | absent | exact two-file owner; detailed API above | setup route | Twin/live start specs. |
| `CourseMockInterviewSessionPage` twins | connected/pure twin boundary | ADD | absent | exact two-file owner; detailed API above | session route | Twin/socket specs. |
| `CourseMockInterviewResultPage` twins | connected/pure twin boundary | ADD | absent | exact two-file owner; detailed API above | result route | Twin/grade specs. |
| `CourseFoundationsPage` twins | connected/pure twin boundary | ADD | route-local static owner | exact two-file owner; detailed API above | hub route | Twin/live query specs. |
| `CourseFoundationCategoryPage` twins | connected/pure twin boundary | ADD | shared route-local static owner | exact two-file owner; detailed API above | category route | Twin/search specs. |
| `CourseFoundationResourcePage` twins | connected/pure twin boundary | ADD | shared route-local static owner | exact two-file owner; detailed API above | resource route | Twin/detail specs. |
| `PlaygroundSessionLayout` twins | connected/pure twin boundary | ADD | absent | exact two-file layout owner; detailed API above | slug layout | Provider/socket persistence spec. |
| `PlaygroundSlugLayoutRoute` | route params/mount | ADD | absent | `{ displayId,slug }`; `RouteShell` mounts session layout | Next router | Route layout spec. |
| `CoursePlaygroundPage` twins | connected/pure twin boundary | ADD | route-local static owner | exact two-file owner; detailed API above | hub route | Twin/catalog specs. |
| `CoursePlaygroundSetupPage` twins | connected/pure twin boundary | ADD | shared route-local owner | exact two-file owner; detailed API above | setup route | Twin/pairing specs. |
| `CoursePlaygroundSessionPage` twins | connected/pure twin boundary | ADD | shared route-local owner | exact two-file owner; detailed API above | session route | Twin/socket specs. |
| `CourseMindMapPage` twins | connected/pure twin boundary | ADD | route-local static owner | exact two-file owner; detailed API above | mind-map route | Twin/data/canvas specs. |
| `CourseLeaderboardPage` twins | connected/pure twin boundary | ADD | route-local query/drawing | exact two-file owner; detailed API above | leaderboard route | Twin/query specs. |
| `CourseQaPage` twins | connected/pure twin boundary | ADD | absent | exact two-file owner; detailed API above | QA route | Twin/thread specs. |
| `CourseQaRoute` | route params/mount | RETYPE | redirect params | resolve `{ displayId }`; mount QA page only | Next router | No redirect assertion. |
| `CourseHeadhuntingsRoute` | route params/mount | ADD | absent | `{ displayId }`; mount list page only | Next router | Legacy route spec. |
| `CourseHeadhuntingCompanyRoute` | route params/mount | ADD | absent | `{ displayId,companyId }`; mount detail page only | Next router | Legacy route spec. |
| `CourseHeadhuntingsPage` twins | connected/pure twin boundary | ADD | absent | exact two-file owner; detailed API above | headhuntings route | Twin/list specs. |
| `CourseHeadhuntingCompanyPage` twins | connected/pure twin boundary | ADD | absent | exact two-file owner; detailed API above | company route | Twin/detail/action specs. |

### Supporting production boundary

| Owner family | Exact paths |
|---|---|
| Contract/type registry | `src/components/contracts/index.ts`; `src/components/contracts/props.ts` only if existing helpers cannot type the approved slots |
| A1 queries/hooks | `src/modules/api/graphql/queries/query-course.ts`; `query-module.ts`; `query-content.ts`; `src/hooks/swr/useQueryCourseSwr.ts`; `useQueryModuleSwr.ts`; `useQueryContentSwr.ts` |
| A1 reactions/discussion/challenge | `src/modules/api/graphql/queries/query-content-reactions.ts`; `query-content-comments.ts`; `src/modules/api/graphql/mutations/mutation-react-content.ts`; `mutation-submit-content-comment.ts`; `mutation-submit-content-challenge.ts`; matching SWR hooks under `src/hooks/swr` |
| A2 transport | MOVE `src/app/[lang]/courses/[displayId]/learn/personal-project/query.ts` → `src/modules/api/graphql/queries/query-course-personal-project.ts`; MOVE `types.ts` → `src/modules/api/graphql/queries/types/course-personal-project.ts`; add `src/hooks/swr/useQueryCoursePersonalProjectSwr.ts`, `useQueryPersonalTaskAttemptsSwr.ts`, `useQueryPersonalTaskAttemptFeedbacksSwr.ts`, `useMutateSubmitPersonalTaskAttemptSwr.ts` |
| A3 transport | `src/modules/api/graphql/queries/query-flashcard-decks-by-course.ts`; `query-my-flashcard-stats.ts`; `query-my-in-progress-flashcard-session.ts`; `query-flashcard-session-result.ts`; `src/modules/api/graphql/mutations/mutation-start-flashcard-session.ts`; `mutation-sync-flashcard-session.ts`; `mutation-complete-flashcard-session.ts`; matching SWR hooks |
| A4 transport | `src/modules/api/graphql/queries/query-my-in-progress-mock-interview-session.ts`; `query-mock-interview-attempt-by-session.ts`; `src/modules/api/graphql/mutations/mutation-start-mock-interview-session.ts`; `mutation-sync-mock-interview-session-turns.ts`; `mutation-grade-mock-interview-session.ts`; `src/hooks/socketio/useMockInterviewSocketIo.ts`; matching SWR hooks |
| A5 transport | `src/modules/api/graphql/queries/query-foundation-categories.ts`; `query-foundations.ts`; `query-foundation.ts`; `query-playgrounds.ts`; `query-playground.ts`; `query-course-mind-map.ts`; `src/modules/api/graphql/mutations/mutation-start-playground-session.ts`; `mutation-complete-playground-step.ts`; `src/hooks/socketio/usePlaygroundSocketIo.ts`; matching SWR hooks |
| A6 transport | MOVE `src/app/[lang]/courses/[displayId]/learn/leaderboard/_data.ts` → `src/modules/api/graphql/queries/query-course-leaderboard.ts`; add `src/hooks/swr/useQueryCourseLeaderboardSwr.ts`; QA/headhunting query/mutation/hook files must use exact capability names proven by backend before Apply; absence returns this Review to revision, not invention in Apply |
| Messages | `src/messages/en.json`; `src/messages/vi.json` under exact `learn` namespaces for every approved page/block state |
| Fixtures/tests | exact twin specs beside each new/modified page/block/hook/query; route render specs for every legacy URL; browser fixture identities `enrolled-ready`, `locked`, `empty`, `failed`, `resume`, `expired`, `mobile-reader`, `full-bleed-live` |

### Acceptance commands and evidence

| Proof | Command / state |
|---|---|
| Type boundary | `npx tsc --noEmit` |
| Canon adoption | `npx eslint "src/app/[lang]/courses/[displayId]/learn/**/*.{ts,tsx}" "src/components/{pages,layouts,blocks}/**/*.{ts,tsx}" "src/hooks/{swr,socketio}/**/*.{ts,tsx}" "src/modules/api/graphql/**/*.{ts,tsx}" --max-warnings 0` |
| Unit/contract | `npm test -- --runInBand` with page twin, hook, query/mutation and contract-slot specs named above |
| Build | `npm run build` |
| Route parity | Browser-open every legacy URL in the Route compatibility inventory at desktop and mobile; no dead end, blank shell or unexpected redirect |
| Live A2/A3 | Enrolled fixtures prove task submission/result and flashcard start/resume/sync/complete/result |
| Live A4/A5 | GraphQL + Socket.IO fixtures prove interview and playground connect/reconnect/abort/expired/finish; only approved live routes are full-bleed |
| Reader | pending/ready/locked/failed plus reactions, next steps, challenge/AI, discussion, desktop rails and three mobile views |
| A6 | Leaderboard categories/myRank/computedAt; QA thread/ask; headhunting list/detail/action or explicit Review revision if backend capability is absent |

### OUTPUTS

| Concept | Result |
|---|---|
| Review draft | `learn-branch-A-legacy-parity-review-r1` freezes route/page/layout/block ownership, public interfaces, transport boundary and acceptance proof for whole-branch legacy parity. |
| Challenge finding | `headhuntings` and `headhunting-companies/[companyId]` were missing from Plan but are binding legacy routes, so they are included in A6 compatibility. |
| Apply invariant | Dirty route-local/static shells are migration inputs, never approved owners or baseline proof. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/learn-branch.md` | appended — review revision 5 draft with COMPONENT DELTA, PROPS DELTA and exact boundary |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve exact Review identity `learn-branch-A-legacy-parity-review-r1` for Apply? | Yes — approve this exact component/props/transport boundary including headhuntings compatibility (recommended); No — provide corrections and append Review revision 6 |

### WARNINGS

| Warning | Impact |
|---|---|
| QA/headhunting live FE operations are not present in current target source | Apply may proceed only if backend capability names are proven inside this boundary; otherwise Review must revise before source edits. |
| Scope is whole `/learn`, not the earlier A1 safe subset | Apply is a large migration and must reconcile every delta row; partial shells cannot be reported as completion. |
| Historical `review[2]` lacks canonical delta tables | Root validator remains red even if this draft is structurally valid; history is not rewritten here. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Keep route-local `_components.tsx`, `component.tsx`, `query.ts`, `_data.ts` | MOVE to canonical page/hook/query owners listed above | PAGE-1/PAGE-8 and contract canon forbid drawing/fetching in route tree. |
| Keep one local-state `MockInterviewPage` for setup/live/result | Three page twins with live GraphQL/Socket.IO boundary | Local state shell cannot prove resume/sync/grade or route-specific page states. |
| Keep `/qa` redirect as parity | `CourseQaPage` real owner | Legacy QA is a product surface; redirect changes meaning. |
| Omit headhuntings because Plan A1–A6 did not name it | Include both legacy career routes under A6 compatibility | User scope is entire `/learn`; legacy route inventory is binding. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of `learn-branch-A-legacy-parity-review-r1` | User approves exact identity after reading this draft |
| Approved revision marker | Append Review revision 6 with `Approved revision: learn-branch-A-legacy-parity-review-r1` only after approval |
| Production implementation | `$starci-fe-design-apply` after approved marker and production write-boundary confirmation |

## review revision 6

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
| Purpose | Ghi nhận explicit approval và đóng băng exact source/API boundary cho legacy parity của toàn bộ `/learn`. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md |
| Language | vi |
| Phase | review |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md |

Approved revision: learn-branch-A-legacy-parity-review-r1

User đã explicit approve exact identity này. Revision giữ nguyên challenge của `learn-branch-A-legacy-parity-r3` bằng source hiện tại, legacy route tree, canon layer/contract và live backend GraphQL/Socket.IO. Hai route legacy bị Plan bỏ sót — `headhuntings` và `headhunting-companies/[companyId]` — được đưa vào A6 compatibility; bỏ chúng sẽ làm claim “toàn bộ `/learn`” sai.

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| shell | `RouteShell` | REUSE | `src/components/shells/RouteShell/index.tsx` | same | `src/app/[lang]/courses/[displayId]/learn/layout.tsx` | existing shell API | Next `children` vẫn chỉ được brand tại framework boundary. |
| layout | `LearnShellLayout` | MODIFY | `src/components/layouts/LearnShellLayout/index.tsx` | same | learn segment layout; every learn route | `learn-shell-frame` | Giữ ba nav groups, thêm đúng lock/due/rank/Playground-child facts và full-bleed route policy. |
| layout | `_LearnShellLayout` | MODIFY | `src/components/layouts/LearnShellLayout/component.tsx` | same | `LearnShellLayout` | `learn-shell-frame`, `learn-mobile-tab-bar` | Mobile bar phải báo `openTab`, không gửi tab ids vào `openRow`; chỉ reader cung cấp ba view. |
| block | `LearnSpine` | MODIFY | `src/components/blocks/learn/LearnSpine/component.tsx` | same | `_LearnShellLayout` | `learn-spine-column`, `learn-nav-group`, `learn-nav-row`, `learn-resume-card` | Giữ owner hiện có nhưng cấp live fact/locked/children states từ layout. |
| block | `ContentTabRow` | MODIFY | `src/components/blocks/learn/ContentTabRow/component.tsx` | same | `_CourseLearnContentPage` | existing content tab contracts | Face tabs phải có reading/challenge/AI producers và disabled/locked states thật. |
| route | `LearnIndexRoute` | REUSE | `src/app/[lang]/courses/[displayId]/learn/page.tsx` | same | Next router | none | Redirect `/learn` → `/learn/content` đã đúng identity. |
| route | `ContentHomeRoute` | REUSE | `src/app/[lang]/courses/[displayId]/learn/content/page.tsx` | same | Next router → `CourseLearnContentHomePage` | none | Route chỉ mount page. |
| page | `CourseLearnContentHomePage` twins | MODIFY | `src/components/pages/CourseLearnContentHomePage/index.tsx`; `component.tsx` | same | content home route | `course-content-home-page` ADD | Thay native structural shell bằng connected/pure page, loading/failed/empty/ready và module navigation legacy. |
| route | `ModuleRoute` | REUSE | `src/app/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/page.tsx` | same | Next router → `CourseLearnModulePage` | none | Route chỉ mount page. |
| page | `CourseLearnModulePage` twins | MODIFY | `src/components/pages/CourseLearnModulePage/index.tsx`; `component.tsx` | same | module route | `course-module-page`, `module-lesson-list`, `module-challenge-list` ADD | Header, continue band, lesson/challenge order và states phải khớp legacy. |
| route | `ContentReaderRoute` | REUSE | `src/app/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]/page.tsx` | same | Next router → `CourseLearnContentPage` | none | Route identity đã đúng. |
| page | `CourseLearnContentPage` twins | MODIFY | `src/components/pages/CourseLearnContentPage/index.tsx`; `component.tsx` | same | reader route | `content-reader-frame`, `learn-content-page`, `content-reader-footer` | Nối reactions, next step, discussion, challenge/AI faces, rails và mobile views; giữ pending/ready/locked/failed. |
| route | `ContentChallengeRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]/challenges/[challengeId]/page.tsx` | Next router → `CourseLearnChallengePage` | none | Legacy route identity còn thiếu. |
| route | `ContentChallengeResultRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]/challenges/[challengeId]/result/page.tsx` | Next router → `CourseLearnChallengeResultPage` | none | Legacy result identity còn thiếu. |
| page | `CourseLearnChallengePage` twins | ADD | absent | `src/components/pages/CourseLearnChallengePage/index.tsx`; `component.tsx` | challenge route | `course-learn-challenge-page` ADD | Challenge brief/editor/submission states là page riêng, không phải reader boolean. |
| page | `CourseLearnChallengeResultPage` twins | ADD | absent | `src/components/pages/CourseLearnChallengeResultPage/index.tsx`; `component.tsx` | challenge result route | `course-learn-challenge-result-page` ADD | Score/feedback/retry/next state có reading order riêng. |
| layout | `PersonalProjectWorkspaceLayout` twins | ADD | absent | `src/components/layouts/PersonalProjectWorkspaceLayout/index.tsx`; `component.tsx` | personal-project segment layout and three A2 routes | `personal-project-workspace-frame` ADD | Milestone chrome/request sống qua dashboard/task/result navigation. |
| route | `PersonalProjectLayoutRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/personal-project/layout.tsx` | Next router → `RouteShell` + `PersonalProjectWorkspaceLayout` | none | Legacy workspace layout bị thiếu. |
| route | `PersonalProjectRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/personal-project/page.tsx` | same | Next router → `CoursePersonalProjectPage` | none | Chỉ mount canonical page. |
| page | `CoursePersonalProjectPage` twins | MOVE | `src/app/[lang]/courses/[displayId]/learn/personal-project/component.tsx` | `src/components/pages/CoursePersonalProjectPage/component.tsx`; connected half `index.tsx` ADD | personal-project route | `course-personal-project-page` ADD | Route-local fetching/state/structural JSX vi phạm PAGE-1/PAGE-8. |
| route | `PersonalProjectTaskRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/personal-project/tasks/[taskId]/page.tsx` | same | Next router → `CoursePersonalProjectTaskPage` | none | Chỉ mount canonical page. |
| page | `CoursePersonalProjectTaskPage` twins | MOVE | `src/app/[lang]/courses/[displayId]/learn/personal-project/tasks/[taskId]/component.tsx` | `src/components/pages/CoursePersonalProjectTaskPage/component.tsx`; connected half `index.tsx` ADD | task route | `course-personal-project-task-page` ADD | Task load/submission/action cần split connected/pure. |
| route | `PersonalProjectResultRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/personal-project/tasks/[taskId]/result/page.tsx` | same | Next router → `CoursePersonalProjectResultPage` | none | Chỉ mount canonical page. |
| page | `CoursePersonalProjectResultPage` twins | MOVE | `src/app/[lang]/courses/[displayId]/learn/personal-project/tasks/[taskId]/result/component.tsx` | `src/components/pages/CoursePersonalProjectResultPage/component.tsx`; connected half `index.tsx` ADD | result route | `course-personal-project-result-page` ADD | Attempt history/feedback/result states phải là page owner. |
| route | `FlashcardsIndexRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/flashcards/page.tsx` | Next router redirect → review | none | Legacy entry redirect còn thiếu. |
| route | `FlashcardsReviewRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/flashcards/review/page.tsx` | same | Next router → `CourseFlashcardsReviewPage` | none | Bỏ route-local drawing. |
| route | `FlashcardsQuizRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/flashcards/quiz/page.tsx` | same | Next router → `CourseFlashcardsQuizPage` | none | Bỏ route-local drawing. |
| page | `CourseFlashcardsReviewPage` twins | MOVE | `src/app/[lang]/courses/[displayId]/learn/flashcards/_components.tsx` | `src/components/pages/CourseFlashcardsReviewPage/index.tsx`; `component.tsx` | review route | `course-flashcards-review-page` ADD | Review overview/due/stats/decks cần connected/pure owner. |
| page | `CourseFlashcardsQuizPage` twins | ADD | shared route-local `_components.tsx` | `src/components/pages/CourseFlashcardsQuizPage/index.tsx`; `component.tsx` | quiz route | `course-flashcards-quiz-page` ADD | Quiz overview khác review CTA/data contract. |
| route | `FlashcardReviewSessionRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/flashcards/review/sessions/[sessionId]/page.tsx` | Next router → `CourseFlashcardSessionPage` mode review | none | Legacy resumable session route. |
| route | `FlashcardReviewResultRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/flashcards/review/sessions/[sessionId]/result/page.tsx` | Next router → `CourseFlashcardResultPage` mode review | none | Legacy review result route. |
| route | `FlashcardQuizSessionRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/flashcards/quiz/sessions/[sessionId]/page.tsx` | Next router → `CourseFlashcardSessionPage` mode quiz | none | Legacy quiz session route. |
| route | `FlashcardQuizResultRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/flashcards/quiz/sessions/[sessionId]/result/page.tsx` | Next router → `CourseFlashcardResultPage` mode quiz | none | Legacy quiz result route. |
| page | `CourseFlashcardSessionPage` twins | ADD | absent | `src/components/pages/CourseFlashcardSessionPage/index.tsx`; `component.tsx` | review/quiz session routes | `course-flashcard-session-page` ADD | Focused card lifecycle/start-resume-sync-complete. |
| page | `CourseFlashcardResultPage` twins | ADD | absent | `src/components/pages/CourseFlashcardResultPage/index.tsx`; `component.tsx` | review/quiz result routes | `course-flashcard-result-page` ADD | Result/history/retry actions có page state riêng. |
| route | `MockInterviewSetupRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/mock-interview/page.tsx` | same | Next router → `CourseMockInterviewSetupPage` | none | Chỉ mount setup page. |
| route | `MockInterviewSessionRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/mock-interview/interview/[sessionId]/page.tsx` | same | Next router → `CourseMockInterviewSessionPage` | none | Chỉ mount live page. |
| route | `MockInterviewResultRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/mock-interview/interview/[sessionId]/result/page.tsx` | same | Next router → `CourseMockInterviewResultPage` | none | Chỉ mount result page. |
| page | `MockInterviewPage` local-state shell | REMOVE | `src/components/pages/MockInterviewPage/index.tsx` | absent | three mock-interview routes migrated to three owners | none | Một component local state giả setup/live/result, không có pure twin hoặc live transport. |
| page | `CourseMockInterviewSetupPage` twins | ADD | absent | `src/components/pages/CourseMockInterviewSetupPage/index.tsx`; `component.tsx` | setup route | `course-mock-interview-setup-page` ADD | Start/resume choice và configuration có screen state riêng. |
| page | `CourseMockInterviewSessionPage` twins | ADD | absent | `src/components/pages/CourseMockInterviewSessionPage/index.tsx`; `component.tsx` | session route | `course-mock-interview-session-page` ADD | Full-bleed Socket.IO turns, periodic sync, abort/expired/error. |
| page | `CourseMockInterviewResultPage` twins | ADD | absent | `src/components/pages/CourseMockInterviewResultPage/index.tsx`; `component.tsx` | result route | `course-mock-interview-result-page` ADD | Grade polling/result/ retry có composition riêng. |
| page | `CourseFoundationsPage` twins | MOVE | `src/app/[lang]/courses/[displayId]/learn/foundations/_components.tsx` | `src/components/pages/CourseFoundationsPage/index.tsx`; `component.tsx` | foundations route | `course-foundations-page` ADD | Static route-local CATEGORIES phải thay bằng live block/page owners. |
| page | `CourseFoundationCategoryPage` twins | ADD | shared `_components.tsx` | `src/components/pages/CourseFoundationCategoryPage/index.tsx`; `component.tsx` | category route | `course-foundation-category-page` ADD | Search/list/loading/empty/error theo backend. |
| page | `CourseFoundationResourcePage` twins | ADD | shared `_components.tsx` | `src/components/pages/CourseFoundationResourcePage/index.tsx`; `component.tsx` | resource route | `course-foundation-resource-page` ADD | Resource reader không được dùng hard-coded copy shell. |
| layout | `PlaygroundSessionLayout` twins | ADD | absent | `src/components/layouts/PlaygroundSessionLayout/index.tsx`; `component.tsx` | playground `[slug]/layout.tsx` | `playground-session-frame` ADD | Pairing/socket/session phải sống qua setup → live navigation. |
| route | `PlaygroundSlugLayoutRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/playground/[slug]/layout.tsx` | Next router → `RouteShell` + `PlaygroundSessionLayout` | none | Legacy persistent session boundary còn thiếu. |
| page | `CoursePlaygroundPage` twins | MOVE | `src/app/[lang]/courses/[displayId]/learn/playground/_components.tsx` | `src/components/pages/CoursePlaygroundPage/index.tsx`; `component.tsx` | playground hub route | `course-playground-page` ADD | Hub data/copy/state ra khỏi route. |
| page | `CoursePlaygroundSetupPage` twins | ADD | shared `_components.tsx` | `src/components/pages/CoursePlaygroundSetupPage/index.tsx`; `component.tsx` | `[slug]` route | `course-playground-setup-page` ADD | Pairing/readiness/start states theo live provider. |
| page | `CoursePlaygroundSessionPage` twins | ADD | shared `_components.tsx` | `src/components/pages/CoursePlaygroundSessionPage/index.tsx`; `component.tsx` | `[slug]/session` route | `course-playground-session-page` ADD | Full-bleed live session, stream/reconnect/finish. |
| page | `CourseMindMapPage` twins | MOVE | `src/app/[lang]/courses/[displayId]/learn/mind-map/_components.tsx` | `src/components/pages/CourseMindMapPage/index.tsx`; `component.tsx` | mind-map route | `course-mind-map-page` ADD | Search/selection/canvas data phải có canonical page owner. |
| page | `CourseLeaderboardPage` twins | MOVE | `src/app/[lang]/courses/[displayId]/learn/leaderboard/page.tsx` | `src/components/pages/CourseLeaderboardPage/index.tsx`; `component.tsx` | leaderboard route | `course-leaderboard-page`; existing leaderboard family REUSE | Route đang fetch/draw; page phải own states, block own request. |
| page | `CourseQaPage` twins | ADD | absent; route redirects | `src/components/pages/CourseQaPage/index.tsx`; `component.tsx` | QA route | `course-qa-page` ADD | Legacy QA là product surface thật, không phải content redirect. |
| route | `CourseQaRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/qa/page.tsx` | same | Next router → `CourseQaPage` | none | Bỏ redirect compatibility tạm. |
| route | `CourseHeadhuntingsRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/headhuntings/page.tsx` | Next router → `CourseHeadhuntingsPage` | none | Legacy whole-branch route bị Plan bỏ sót. |
| route | `CourseHeadhuntingCompanyRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/headhunting-companies/[companyId]/page.tsx` | Next router → `CourseHeadhuntingCompanyPage` | none | Legacy detail identity bị Plan bỏ sót. |
| page | `CourseHeadhuntingsPage` twins | ADD | absent | `src/components/pages/CourseHeadhuntingsPage/index.tsx`; `component.tsx` | headhuntings route | `course-headhuntings-page` ADD | Whole-branch parity phải giữ career discovery surface. |
| page | `CourseHeadhuntingCompanyPage` twins | ADD | absent | `src/components/pages/CourseHeadhuntingCompanyPage/index.tsx`; `component.tsx` | company route | `course-headhunting-company-page` ADD | Company detail/action states có route-owned composition. |
| branch | `Tree` | REUSE | `src/components/branches/Tree/index.tsx` | same | every pure owner | contract registry | Một frame tiếp tục là nơi duy nhất materialize host. |
| branch | surface branch family | REUSE | `src/components/branches/SurfaceCard/index.tsx`; `SurfaceListCard/index.tsx`; `SurfaceFormCard/index.tsx`; `SurfaceAccordionCard/index.tsx` | same | page/block pure twins | existing branch APIs | Không dựng card/list/form bằng native structural JSX. |
| leaf | existing vocabulary leaves | REUSE | `src/components/leaves` | same | all pure twins through contract slots | existing leaf metadata | Không thêm domain leaf hoặc vendor import ở page/block. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| `LearnShellLayout` | connected props | ADD | `{ displayId, surface }` | thêm route-derived `mode`, live spine facts và reader mobile-tab contribution resolved internally; không nhận fetched page payload | learn segment layout only | Typecheck plus no page imports/call sites outside route layout. |
| `_LearnShellLayout` | `LearnShellLayoutData` | RETYPE | `{ spine, tabs? }` với static tabs | `{ spine, mobileTabs?, isFullBleed }`; tabs chỉ có trên reader/mobile state | `LearnShellLayout` | Pure fixtures prove ordinary/full-bleed/reader variants. |
| `_LearnShellLayout` | actions | ADD | `openRow` only | `openRow`, `openMobileTab` | connected layout | Clicking all three mobile tabs changes view without URL change. |
| `LearnSpine` | row/group data | RETYPE | optional `fact`, `isLocked`, `children` shape chưa có live producers | typed lock/due/rank/child facts with resolved labels and destinations | connected learn layout | Legacy nav fixture asserts order/groups/facts and no fabricated values. |
| `ContentTabRow` | face actions | RETYPE | generic `selectFace(id)` | finite `selectReading`, `selectChallenge`, `selectAi`; disabled/locked state in data | `CourseLearnContentPage` | Impossible face/action combinations do not typecheck. |
| `CourseLearnContentHomePage` | connected props | KEEP | `{ displayId }` | same | content home route | Route call remains one exact prop. |
| `_CourseLearnContentHomePage` | state/data/actions | RETYPE | `pending|ready|failed`, loose title/modules, unused retry/module actions | discriminated `pending|ready|empty|failed`; resolved module rows; `openModule`, `retry` | connected twin | Fixture render for four states and module click route. |
| `CourseLearnModulePage` | connected props | RETYPE | `{ moduleId }` | `{ displayId, moduleId }` | module route | Navigation/progress producers have both route identities. |
| `_CourseLearnModulePage` | state/data/actions | RETYPE | loose `{ state,title,module,label }` | discriminated pending/ready/empty/failed with header, continue target, lesson/challenge rows; named actions | connected twin | Fixtures cover no-content/no-challenge and continue navigation. |
| `CourseLearnContentPage` | connected props | KEEP | `{ displayId,moduleId,contentId }` | same | reader route | Route call unchanged. |
| `_CourseLearnContentPage` | data/actions | RETYPE | reader basics and face/tab actions | add reactions, next targets, discussion su…606 tokens truncated…t/in-progress/sync/complete live calls and browser resume proof. |
| `CourseFlashcardResultPage` | twin API | ADD | absent | connected `{ displayId,sessionId,mode }`; pure pending/ready/failed with score/history/retry | two result routes | Result/history query fixture per mode. |
| `MockInterviewPage` | public API | REMOVE | `{ displayId,sessionId?,resultSessionId? }` and local `InterviewState` | removed | setup/session/result routes | `rg MockInterviewPage` returns no consumers after migration. |
| `CourseMockInterviewSetupPage` | twin API | ADD | absent | connected `{ displayId }`; pure pending/ready/resumable/starting/failed with configure/start/resume/retry | setup route | Start and in-progress query tests. |
| `CourseMockInterviewSessionPage` | twin API | ADD | absent | connected `{ displayId,sessionId }`; pure connecting/live/syncing/expired/failed with answer/ask/abort/leave/finish | session route | Socket ask/abort plus sync cadence/reconnect browser proof. |
| `CourseMockInterviewResultPage` | twin API | ADD | absent | connected `{ displayId,sessionId }`; pure grading/ready/failed with retry/newSession | result route | Grade mutation and attempt-by-session polling fixture. |
| `CourseFoundationsPage` | twin API | ADD | static `{ displayId,isVi }` | connected `{ displayId }`; pure pending/ready/empty/failed with query/category actions | foundations route | foundationCategories localized live fixture. |
| `CourseFoundationCategoryPage` | twin API | ADD | static `{ displayId,categoryId,isVi }` | connected `{ displayId,categoryId }`; pure pending/ready/empty/failed with search/openResource | category route | List/search query fixture. |
| `CourseFoundationResourcePage` | twin API | ADD | static `{ displayId,categoryId,foundationId,isVi }` | connected exact ids; pure pending/ready/not-found/failed with back/openPlayground | resource route | Detail live call and not-found fixture. |
| `PlaygroundSessionLayout` | twin API | ADD | absent | connected `{ displayId,slug,surface }`; provider-owned pairing/socket/session; pure frame/full-bleed state | slug layout | Pairing code/socket identity stays stable from setup to session. |
| `CoursePlaygroundPage` | twin API | ADD | static `{ displayId,isVi }` | connected `{ displayId }`; pure pending/ready/empty/failed with openSetup | hub route | Live catalog fixture. |
| `CoursePlaygroundSetupPage` | twin API | ADD | static `{ displayId,slug,isVi }` | connected `{ displayId,slug }`; pure loading/unpaired/paired/ready/starting/failed | setup route/provider | Pair/readiness/start integration proof. |
| `CoursePlaygroundSessionPage` | twin API | ADD | static `{ displayId,slug,isVi }` | connected exact ids; pure connecting/live/reconnecting/completed/failed with step/submit/leave | session route/provider | Socket/RAG stream and reconnect proof. |
| `CourseMindMapPage` | twin API | ADD | static `{ displayId,isVi }` | connected `{ displayId }`; pure pending/ready/empty/failed with search/select/openContent | mind-map route | Live producer and canvas/mobile fixtures. |
| `CourseLeaderboardPage` | twin API | ADD | route-local params/query/render | connected `{ displayId }`; pure pending/ready/empty/failed with category/retry and viewer standing | leaderboard route | courseLeaderboard variables/data fixtures. |
| `CourseQaPage` | twin API | ADD | absent | connected `{ displayId }`; pure pending/ready/empty/failed with search/ask/openThread/retry | QA route | QA live contract must be named before Apply; no redirect remains. |
| `CourseHeadhuntingsPage` | twin API | ADD | absent | connected `{ displayId }`; pure pending/ready/empty/failed with filters/openCompany | headhuntings route | Legacy route fixture and live producer evidence. |
| `CourseHeadhuntingCompanyPage` | twin API | ADD | absent | connected `{ displayId,companyId }`; pure pending/ready/not-found/failed with apply/back | company route | Detail/action fixture. |
| `CONTRACTS` registry | keys/slots | ADD | keys above absent except explicitly reused families | add every `ADD` contract named in COMPONENT DELTA; modify only listed content/shell keys | all pure twins through `Tree` | `rg` proves every new key has a renderer and no unused key remains. |
| `CourseLearnContentHomePage` twins | connected/pure twin boundary | KEEP | existing two-file owner | same two-file owner; detailed state/API migration in `CourseLearnContentHomePage` row above | content home route | Both exact files remain and connected twin renders exact pure twin on every state. |
| `CourseLearnModulePage` twins | connected/pure twin boundary | KEEP | existing two-file owner | same; detailed API migration above | module route | Call-site and twin-render search. |
| `CourseLearnContentPage` twins | connected/pure twin boundary | KEEP | existing two-file owner | same; detailed API migration above | reader route | Call-site and twin-render search. |
| `ContentChallengeRoute` | route params/mount | ADD | absent | params `{ displayId,moduleId,contentId,challengeId }`; mounts `CourseLearnChallengePage` only | Next router | Route render spec. |
| `ContentChallengeResultRoute` | route params/mount | ADD | absent | same ids; mounts result page only | Next router | Route render spec. |
| `CourseLearnChallengePage` twins | connected/pure twin boundary | ADD | absent | exact two-file owner; detailed state/API above | challenge route | Twin spec. |
| `CourseLearnChallengeResultPage` twins | connected/pure twin boundary | ADD | absent | exact two-file owner; detailed state/API above | result route | Twin spec. |
| `PersonalProjectWorkspaceLayout` twins | connected/pure twin boundary | ADD | absent | exact two-file layout owner | personal-project segment layout | Layout persistence fixture. |
| `PersonalProjectLayoutRoute` | route params/mount | ADD | absent | params `{ displayId }`; `RouteShell` mounts workspace layout | Next router | Route layout spec. |
| `PersonalProjectRoute` | route params/mount | KEEP | params `{ lang,displayId }` | resolve `displayId`; mount page only | Next router | No drawing/imports beyond page. |
| `CoursePersonalProjectPage` twins | connected/pure twin boundary | ADD | route-local component only | exact two-file page owner; detailed API above | dashboard route | Twin spec and old-path removal search. |
| `PersonalProjectTaskRoute` | route params/mount | KEEP | params `{ lang,displayId,taskId }` | resolve ids; mount page only | Next router | Route spec. |
| `CoursePersonalProjectTaskPage` twins | connected/pure twin boundary | ADD | route-local component only | exact two-file page owner; detailed API above | task route | Twin spec and old-path removal search. |
| `PersonalProjectResultRoute` | route params/mount | KEEP | params `{ lang,displayId,taskId }` | resolve ids; mount result page only | Next router | Route spec. |
| `CoursePersonalProjectResultPage` twins | connected/pure twin boundary | ADD | route-local component only | exact two-file page owner; detailed API above | result route | Twin spec and old-path removal search. |
| `FlashcardsIndexRoute` | redirect contract | ADD | absent | redirect to `/learn/flashcards/review` preserving locale/course | Next router | Redirect spec. |
| `FlashcardsReviewRoute` | route params/mount | KEEP | route-local overview mount | page-only mount `{ displayId }` | Next router | Route spec. |
| `FlashcardsQuizRoute` | route params/mount | KEEP | route-local overview mount | page-only mount `{ displayId }` | Next router | Route spec. |
| `CourseFlashcardsReviewPage` twins | connected/pure twin boundary | ADD | shared route-local file | exact two-file page owner; detailed API above | review route | Twin spec and `_components.tsx` removal search. |
| `CourseFlashcardsQuizPage` twins | connected/pure twin boundary | ADD | shared route-local file | exact two-file page owner; detailed API above | quiz route | Twin spec and `_components.tsx` removal search. |
| `FlashcardReviewSessionRoute` | route params/mount | ADD | absent | `{ displayId,sessionId,mode:"review" }` mount only | Next router | Route spec. |
| `FlashcardReviewResultRoute` | route params/mount | ADD | absent | `{ displayId,sessionId,mode:"review" }` result mount only | Next router | Route spec. |
| `FlashcardQuizSessionRoute` | route params/mount | ADD | absent | `{ displayId,sessionId,mode:"quiz" }` mount only | Next router | Route spec. |
| `FlashcardQuizResultRoute` | route params/mount | ADD | absent | `{ displayId,sessionId,mode:"quiz" }` result mount only | Next router | Route spec. |
| `CourseFlashcardSessionPage` twins | connected/pure twin boundary | ADD | absent | exact two-file page owner; detailed API above | two session routes | Twin/live lifecycle specs. |
| `CourseFlashcardResultPage` twins | connected/pure twin boundary | ADD | absent | exact two-file page owner; detailed API above | two result routes | Twin/result specs. |
| `MockInterviewSetupRoute` | route params/mount | KEEP | mounts local-state multipage owner | mounts setup owner `{ displayId }` only | Next router | Route spec. |
| `MockInterviewSessionRoute` | route params/mount | KEEP | mounts local-state multipage owner | mounts session owner `{ displayId,sessionId }` only | Next router | Route spec. |
| `MockInterviewResultRoute` | route params/mount | KEEP | mounts local-state multipage owner | mounts result owner `{ displayId,sessionId }` only | Next router | Route spec. |
| `MockInterviewPage` local-state shell | public API removal | REMOVE | `{ displayId,sessionId?,resultSessionId? }` | component removed | three routes | `rg MockInterviewPage` has no consumers. |
| `CourseMockInterviewSetupPage` twins | connected/pure twin boundary | ADD | absent | exact two-file owner; detailed API above | setup route | Twin/live start specs. |
| `CourseMockInterviewSessionPage` twins | connected/pure twin boundary | ADD | absent | exact two-file owner; detailed API above | session route | Twin/socket specs. |
| `CourseMockInterviewResultPage` twins | connected/pure twin boundary | ADD | absent | exact two-file owner; detailed API above | result route | Twin/grade specs. |
| `CourseFoundationsPage` twins | connected/pure twin boundary | ADD | route-local static owner | exact two-file owner; detailed API above | hub route | Twin/live query specs. |
| `CourseFoundationCategoryPage` twins | connected/pure twin boundary | ADD | shared route-local static owner | exact two-file owner; detailed API above | category route | Twin/search specs. |
| `CourseFoundationResourcePage` twins | connected/pure twin boundary | ADD | shared route-local static owner | exact two-file owner; detailed API above | resource route | Twin/detail specs. |
| `PlaygroundSessionLayout` twins | connected/pure twin boundary | ADD | absent | exact two-file layout owner; detailed API above | slug layout | Provider/socket persistence spec. |
| `PlaygroundSlugLayoutRoute` | route params/mount | ADD | absent | `{ displayId,slug }`; `RouteShell` mounts session layout | Next router | Route layout spec. |
| `CoursePlaygroundPage` twins | connected/pure twin boundary | ADD | route-local static owner | exact two-file owner; detailed API above | hub route | Twin/catalog specs. |
| `CoursePlaygroundSetupPage` twins | connected/pure twin boundary | ADD | shared route-local owner | exact two-file owner; detailed API above | setup route | Twin/pairing specs. |
| `CoursePlaygroundSessionPage` twins | connected/pure twin boundary | ADD | shared route-local owner | exact two-file owner; detailed API above | session route | Twin/socket specs. |
| `CourseMindMapPage` twins | connected/pure twin boundary | ADD | route-local static owner | exact two-file owner; detailed API above | mind-map route | Twin/data/canvas specs. |
| `CourseLeaderboardPage` twins | connected/pure twin boundary | ADD | route-local query/drawing | exact two-file owner; detailed API above | leaderboard route | Twin/query specs. |
| `CourseQaPage` twins | connected/pure twin boundary | ADD | absent | exact two-file owner; detailed API above | QA route | Twin/thread specs. |
| `CourseQaRoute` | route params/mount | RETYPE | redirect params | resolve `{ displayId }`; mount QA page only | Next router | No redirect assertion. |
| `CourseHeadhuntingsRoute` | route params/mount | ADD | absent | `{ displayId }`; mount list page only | Next router | Legacy route spec. |
| `CourseHeadhuntingCompanyRoute` | route params/mount | ADD | absent | `{ displayId,companyId }`; mount detail page only | Next router | Legacy route spec. |
| `CourseHeadhuntingsPage` twins | connected/pure twin boundary | ADD | absent | exact two-file owner; detailed API above | headhuntings route | Twin/list specs. |
| `CourseHeadhuntingCompanyPage` twins | connected/pure twin boundary | ADD | absent | exact two-file owner; detailed API above | company route | Twin/detail/action specs. |

### Supporting production boundary

| Owner family | Exact paths |
|---|---|
| Contract/type registry | `src/components/contracts/index.ts`; `src/components/contracts/props.ts` only if existing helpers cannot type the approved slots |
| A1 queries/hooks | `src/modules/api/graphql/queries/query-course.ts`; `query-module.ts`; `query-content.ts`; `src/hooks/swr/useQueryCourseSwr.ts`; `useQueryModuleSwr.ts`; `useQueryContentSwr.ts` |
| A1 reactions/discussion/challenge | `src/modules/api/graphql/queries/query-content-reactions.ts`; `query-content-comments.ts`; `src/modules/api/graphql/mutations/mutation-react-content.ts`; `mutation-submit-content-comment.ts`; `mutation-submit-content-challenge.ts`; matching SWR hooks under `src/hooks/swr` |
| A2 transport | MOVE `src/app/[lang]/courses/[displayId]/learn/personal-project/query.ts` → `src/modules/api/graphql/queries/query-course-personal-project.ts`; MOVE `types.ts` → `src/modules/api/graphql/queries/types/course-personal-project.ts`; add `src/hooks/swr/useQueryCoursePersonalProjectSwr.ts`, `useQueryPersonalTaskAttemptsSwr.ts`, `useQueryPersonalTaskAttemptFeedbacksSwr.ts`, `useMutateSubmitPersonalTaskAttemptSwr.ts` |
| A3 transport | `src/modules/api/graphql/queries/query-flashcard-decks-by-course.ts`; `query-my-flashcard-stats.ts`; `query-my-in-progress-flashcard-session.ts`; `query-flashcard-session-result.ts`; `src/modules/api/graphql/mutations/mutation-start-flashcard-session.ts`; `mutation-sync-flashcard-session.ts`; `mutation-complete-flashcard-session.ts`; matching SWR hooks |
| A4 transport | `src/modules/api/graphql/queries/query-my-in-progress-mock-interview-session.ts`; `query-mock-interview-attempt-by-session.ts`; `src/modules/api/graphql/mutations/mutation-start-mock-interview-session.ts`; `mutation-sync-mock-interview-session-turns.ts`; `mutation-grade-mock-interview-session.ts`; `src/hooks/socketio/useMockInterviewSocketIo.ts`; matching SWR hooks |
| A5 transport | `src/modules/api/graphql/queries/query-foundation-categories.ts`; `query-foundations.ts`; `query-foundation.ts`; `query-playgrounds.ts`; `query-playground.ts`; `query-course-mind-map.ts`; `src/modules/api/graphql/mutations/mutation-start-playground-session.ts`; `mutation-complete-playground-step.ts`; `src/hooks/socketio/usePlaygroundSocketIo.ts`; matching SWR hooks |
| A6 transport | MOVE `src/app/[lang]/courses/[displayId]/learn/leaderboard/_data.ts` → `src/modules/api/graphql/queries/query-course-leaderboard.ts`; add `src/hooks/swr/useQueryCourseLeaderboardSwr.ts`; QA/headhunting query/mutation/hook files must use exact capability names proven by backend before Apply; absence returns this Review to revision, not invention in Apply |
| Messages | `src/messages/en.json`; `src/messages/vi.json` under exact `learn` namespaces for every approved page/block state |
| Fixtures/tests | exact twin specs beside each new/modified page/block/hook/query; route render specs for every legacy URL; browser fixture identities `enrolled-ready`, `locked`, `empty`, `failed`, `resume`, `expired`, `mobile-reader`, `full-bleed-live` |

### Acceptance commands and evidence

| Proof | Command / state |
|---|---|
| Type boundary | `npx tsc --noEmit` |
| Canon adoption | `npx eslint "src/app/[lang]/courses/[displayId]/learn/**/*.{ts,tsx}" "src/components/{pages,layouts,blocks}/**/*.{ts,tsx}" "src/hooks/{swr,socketio}/**/*.{ts,tsx}" "src/modules/api/graphql/**/*.{ts,tsx}" --max-warnings 0` |
| Unit/contract | `npm test -- --runInBand` with page twin, hook, query/mutation and contract-slot specs named above |
| Build | `npm run build` |
| Route parity | Browser-open every legacy URL in the Route compatibility inventory at desktop and mobile; no dead end, blank shell or unexpected redirect |
| Live A2/A3 | Enrolled fixtures prove task submission/result and flashcard start/resume/sync/complete/result |
| Live A4/A5 | GraphQL + Socket.IO fixtures prove interview and playground connect/reconnect/abort/expired/finish; only approved live routes are full-bleed |
| Reader | pending/ready/locked/failed plus reactions, next steps, challenge/AI, discussion, desktop rails and three mobile views |
| A6 | Leaderboard categories/myRank/computedAt; QA thread/ask; headhunting list/detail/action or explicit Review revision if backend capability is absent |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved Review | `learn-branch-A-legacy-parity-review-r1` freezes route/page/layout/block ownership, public interfaces, transport boundary and acceptance proof for whole-branch legacy parity. |
| Challenge finding | `headhuntings` and `headhunting-companies/[companyId]` were missing from Plan but are binding legacy routes, so they are included in A6 compatibility. |
| Apply invariant | Dirty route-local/static shells are migration inputs, never approved owners or baseline proof. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/learn-branch.md` | appended — review revision 6 records explicit approval with the unchanged COMPONENT DELTA, PROPS DELTA and exact boundary |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Exact Review identity đã được user approve. |
### WARNINGS

| Warning | Impact |
|---|---|
| QA/headhunting live FE operations are not present in current target source | Apply may proceed only if backend capability names are proven inside this boundary; otherwise Review must revise before source edits. |
| Scope is whole `/learn`, not the earlier A1 safe subset | Apply is a large migration and must reconcile every delta row; partial shells cannot be reported as completion. |
| Historical `review[2]` lacks canonical delta tables | Root validator remains red even if this draft is structurally valid; history is not rewritten here. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Keep route-local `_components.tsx`, `component.tsx`, `query.ts`, `_data.ts` | MOVE to canonical page/hook/query owners listed above | PAGE-1/PAGE-8 and contract canon forbid drawing/fetching in route tree. |
| Keep one local-state `MockInterviewPage` for setup/live/result | Three page twins with live GraphQL/Socket.IO boundary | Local state shell cannot prove resume/sync/grade or route-specific page states. |
| Keep `/qa` redirect as parity | `CourseQaPage` real owner | Legacy QA is a product surface; redirect changes meaning. |
| Omit headhuntings because Plan A1–A6 did not name it | Include both legacy career routes under A6 compatibility | User scope is entire `/learn`; legacy route inventory is binding. |

### OWED

| Owed | Cleared by |
|---|---|
| Production implementation | `$starci-fe-design-apply` after production Repo / branch and exact Touching confirmation |

## plan revision 6

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe @ main |
| Purpose | Ghi nhận clarification A+B: `/learn` là Today mặc định, còn mọi deep route giữ Direction A legacy parity. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md; D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\learn-branch\revision-6\index.html |

Selected direction: `learn-branch-AB-today-legacy-parity-r1`.

User clarification: “A+B được không? Trang hôm nay là ở route `/learn` default”. Hybrid này áp dụng guided-resume composition của B đúng tại course learn index; `/learn/content` vẫn là Modules home và mọi route A1–A6 sâu tiếp tục dùng route-specific hierarchy, CTA, disclosure, rails và full-bleed behavior của A. Nó không áp global resume CTA lên mọi route.

### Evidence

| Evidence | Finding |
|---|---|
| Approved Review r1 | `LearnIndexRoute` đang bị freeze `REUSE` redirect `/learn` → `/learn/content`; claim này không còn đúng sau clarification. |
| Existing B preview | B đã có Today/resume composition nhưng đặt tại `/learn/content` và áp next-best action toàn nhánh; user đã sửa route identity và phạm vi. |
| Current frontend | `src/app/[lang]/courses/[displayId]/learn/page.tsx` chỉ redirect; chưa có Today page owner hoặc Today data contract. |
| Existing live facts | Course progress, learned lessons/challenges, flashcard due/session, project task, interview resume và leaderboard đều có hoặc đang được Apply nối bằng live operations; Today chỉ được xếp hạng từ các facts có thật. |

### Direction proposals

| Direction | Product decision | CTA / disclosure / composition | Status |
|---|---|---|---|
| `learn-branch-AB-today-legacy-parity-r1` | `/learn` là Today; deep routes giữ A | Today xếp continue + due/open/resumable work; deep routes không đổi CTA priority | đã chọn |
| `learn-branch-B-global-guided-resume-r3` | B áp trên mọi route | Resume CTA đứng trước inventory ở content/project/practice | đã từ chối |

### Today acceptance states

| State | Required result |
|---|---|
| pending | Today skeleton giữ đúng reading order và không fabricates resume/due/rank. |
| ready | Một primary resume CTA; secondary cards chỉ hiện khi có live fact; mỗi card mở route family thật. |
| empty | Không giả “today task”; CTA dẫn vào `/learn/content` Modules home. |
| failed | Failure sentence + retry; course navigation vẫn dùng được. |
| mobile | Today / Course / Progress là ba local views; Today là mặc định ở `/learn`. |
| deep route | `/learn/content` và A2–A6 giữ approved Direction A anatomy; không nhận global resume header. |

### Contract inventory

| Relationship | Verdict | Reason |
|---|---|---|
| `CourseLearnTodayPage` connected/pure owner | NEW | Không có page hiện tại sở hữu ranking giữa resume, due cards, project task và interview session. |
| Today primary resume + secondary work cards | NEW contract required | Existing `learn-resume-card` là rail card một action, không biểu đạt page-level priority + heterogeneous route cards. |
| Learn shell/spine | EXTEND | Thêm Today nav destination/current state; không tạo shell thứ hai. |
| Deep route pages/contracts | REUSE approved Direction A boundary | Hybrid không thay anatomy hoặc public API của các route sâu. |
| Reader mobile view coordination | EXTEND unresolved API | Apply evidence cho thấy layout giữ tab state nhưng reader cần một exact context/API để đổi Contents/Lesson/Outline không đổi URL; Review phải freeze API trước write. |

### Preview tracking

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `learn-branch-ab-today-r1` | `http://127.0.0.1:8096/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\learn-branch\revision-6\index.html` | `DD111FC2E96F9C07F4A632D0B9C254E76855C2590CDA39125B773931959736CA` | đã chốt |

| Direction | Tab | Status |
|---|---|---|
| `learn-branch-AB-today-legacy-parity-r1` | `A+B · Today default` | đã chọn |
| `learn-branch-B-global-guided-resume-r3` | `B · Global guided resume` | đã từ chối |

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\learn-branch\revision-6`; PID `11336`; port `8096`; URL `http://127.0.0.1:8096/`; HTTP `200`.

### OUTPUTS

| Concept | Result |
|---|---|
| Selected hybrid | `learn-branch-AB-today-legacy-parity-r1`: Today ở `/learn`, legacy parity A ở mọi deep route. |
| Route correction | `/learn` không còn redirect; `/learn/content` giữ Modules home. |
| Apply continuity | Các source slice A1–A6 không phụ thuộc default index tiếp tục; Today owner và reader mobile API chờ Review delta mới. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/.previews/designs/starci-academy/learn-branch/revision-6/index.html` | added — tabbed A+B Today preview với desktop/mobile states |
| `.workflows/designs/starci-academy/learn-branch.md` | appended — Plan revision 6 selection, evidence, contract inventory và acceptance states |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã chọn A+B và xác nhận Today ở `/learn` default. |

### WARNINGS

| Warning | Impact |
|---|---|
| Approved Review r1 nói `LearnIndexRoute` là redirect REUSE | Apply không được sửa default route cho tới khi Review revision mới đổi action/boundary. |
| Today ranking cần exact rule và live producers | Review phải khóa priority, fallback và producer list; Apply không tự xếp hạng. |
| Reader mobile context chưa có trong PROPS DELTA cũ | Ba view hiện chỉ đổi selected tab, chưa đổi reader composition thật. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| B global guided resume trên mọi route | B chỉ tại `/learn` Today; A tại deep routes | User xác nhận Today là default route, không yêu cầu thay anatomy legacy của từng surface. |
| `/learn` redirect sang `/learn/content` | `/learn` có Today page owner thật | “Trang hôm nay là ở route `/learn` default”. |

### OWED

| Owed | Cleared by |
|---|---|
| Exact COMPONENT DELTA / PROPS DELTA cho Today route/page, ranking producers và reader mobile context | `$starci-fe-design-review` revision mới |
| Production Today implementation | `$starci-fe-design-apply` sau explicit approval của Review revision mới |

## review revision 7

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
| Purpose | Challenge hybrid A+B và khóa Today default route, ranking producers, reader mobile context cùng các backend mismatch tìm thấy trong Apply. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md |
| Language | vi |
| Phase | review |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md |

Candidate revision: `learn-branch-AB-today-legacy-parity-review-r1`.

Revision này chưa được approve. Nó supersede `learn-branch-A-legacy-parity-review-r1` ở default route, mobile-view coordination, playground completion transport và headhunting detail action; mọi delta row khác giữ nguyên exact boundary đã duyệt.

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| page | `CourseLearnTodayPage` twins | ADD | absent | `src/components/pages/CourseLearnTodayPage/index.tsx`; `component.tsx` | `LearnIndexRoute` | `course-learn-today-page` ADD | Today xếp live resume và secondary work facts tại default route; không thay CTA của deep routes. |
| layout | `LearnMobileViewProvider` | ADD | absent | `src/components/layouts/LearnShellLayout/view-context.tsx` | `LearnShellLayout`; `CourseLearnTodayPage`; `CourseLearnContentPage` | finite context API | Layout đang own mobile tab state; provider là exact bridge để routed surface đổi composition không đổi URL. |
| shell | `RouteShell` | REUSE | `src/components/shells/RouteShell/index.tsx` | same | `src/app/[lang]/courses/[displayId]/learn/layout.tsx` | existing shell API | Next `children` vẫn chỉ được brand tại framework boundary. |
| layout | `LearnShellLayout` | MODIFY | `src/components/layouts/LearnShellLayout/index.tsx` | same | learn segment layout; every learn route | `learn-shell-frame` | Giữ ba nav groups, thêm đúng lock/due/rank/Playground-child facts và full-bleed route policy. |
| layout | `_LearnShellLayout` | MODIFY | `src/components/layouts/LearnShellLayout/component.tsx` | same | `LearnShellLayout` | `learn-shell-frame`, `learn-mobile-tab-bar` | Mobile bar phải báo `openTab`, không gửi tab ids vào `openRow`; chỉ reader cung cấp ba view. |
| block | `LearnSpine` | MODIFY | `src/components/blocks/learn/LearnSpine/component.tsx` | same | `_LearnShellLayout` | `learn-spine-column`, `learn-nav-group`, `learn-nav-row`, `learn-resume-card` | Giữ owner hiện có nhưng cấp live fact/locked/children states từ layout. |
| block | `ContentTabRow` | MODIFY | `src/components/blocks/learn/ContentTabRow/component.tsx` | same | `_CourseLearnContentPage` | existing content tab contracts | Face tabs phải có reading/challenge/AI producers và disabled/locked states thật. |
| route | `LearnIndexRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/page.tsx` | same | Next router → `CourseLearnTodayPage` | none | Bỏ redirect `/learn` → `/learn/content`; default route mount Today owner theo user clarification. |
| route | `ContentHomeRoute` | REUSE | `src/app/[lang]/courses/[displayId]/learn/content/page.tsx` | same | Next router → `CourseLearnContentHomePage` | none | Route chỉ mount page. |
| page | `CourseLearnContentHomePage` twins | MODIFY | `src/components/pages/CourseLearnContentHomePage/index.tsx`; `component.tsx` | same | content home route | `course-content-home-page` ADD | Thay native structural shell bằng connected/pure page, loading/failed/empty/ready và module navigation legacy. |
| route | `ModuleRoute` | REUSE | `src/app/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/page.tsx` | same | Next router → `CourseLearnModulePage` | none | Route chỉ mount page. |
| page | `CourseLearnModulePage` twins | MODIFY | `src/components/pages/CourseLearnModulePage/index.tsx`; `component.tsx` | same | module route | `course-module-page`, `module-lesson-list`, `module-challenge-list` ADD | Header, continue band, lesson/challenge order và states phải khớp legacy. |
| route | `ContentReaderRoute` | REUSE | `src/app/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]/page.tsx` | same | Next router → `CourseLearnContentPage` | none | Route identity đã đúng. |
| page | `CourseLearnContentPage` twins | MODIFY | `src/components/pages/CourseLearnContentPage/index.tsx`; `component.tsx` | same | reader route | `content-reader-frame`, `learn-content-page`, `content-reader-footer` | Nối reactions, next step, discussion, challenge/AI faces, rails và mobile views; giữ pending/ready/locked/failed. |
| route | `ContentChallengeRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]/challenges/[challengeId]/page.tsx` | Next router → `CourseLearnChallengePage` | none | Legacy route identity còn thiếu. |
| route | `ContentChallengeResultRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]/challenges/[challengeId]/result/page.tsx` | Next router → `CourseLearnChallengeResultPage` | none | Legacy result identity còn thiếu. |
| page | `CourseLearnChallengePage` twins | ADD | absent | `src/components/pages/CourseLearnChallengePage/index.tsx`; `component.tsx` | challenge route | `course-learn-challenge-page` ADD | Challenge brief/editor/submission states là page riêng, không phải reader boolean. |
| page | `CourseLearnChallengeResultPage` twins | ADD | absent | `src/components/pages/CourseLearnChallengeResultPage/index.tsx`; `component.tsx` | challenge result route | `course-learn-challenge-result-page` ADD | Score/feedback/retry/next state có reading order riêng. |
| layout | `PersonalProjectWorkspaceLayout` twins | ADD | absent | `src/components/layouts/PersonalProjectWorkspaceLayout/index.tsx`; `component.tsx` | personal-project segment layout and three A2 routes | `personal-project-workspace-frame` ADD | Milestone chrome/request sống qua dashboard/task/result navigation. |
| route | `PersonalProjectLayoutRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/personal-project/layout.tsx` | Next router → `RouteShell` + `PersonalProjectWorkspaceLayout` | none | Legacy workspace layout bị thiếu. |
| route | `PersonalProjectRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/personal-project/page.tsx` | same | Next router → `CoursePersonalProjectPage` | none | Chỉ mount canonical page. |
| page | `CoursePersonalProjectPage` twins | MOVE | `src/app/[lang]/courses/[displayId]/learn/personal-project/component.tsx` | `src/components/pages/CoursePersonalProjectPage/component.tsx`; connected half `index.tsx` ADD | personal-project route | `course-personal-project-page` ADD | Route-local fetching/state/structural JSX vi phạm PAGE-1/PAGE-8. |
| route | `PersonalProjectTaskRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/personal-project/tasks/[taskId]/page.tsx` | same | Next router → `CoursePersonalProjectTaskPage` | none | Chỉ mount canonical page. |
| page | `CoursePersonalProjectTaskPage` twins | MOVE | `src/app/[lang]/courses/[displayId]/learn/personal-project/tasks/[taskId]/component.tsx` | `src/components/pages/CoursePersonalProjectTaskPage/component.tsx`; connected half `index.tsx` ADD | task route | `course-personal-project-task-page` ADD | Task load/submission/action cần split connected/pure. |
| route | `PersonalProjectResultRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/personal-project/tasks/[taskId]/result/page.tsx` | same | Next router → `CoursePersonalProjectResultPage` | none | Chỉ mount canonical page. |
| page | `CoursePersonalProjectResultPage` twins | MOVE | `src/app/[lang]/courses/[displayId]/learn/personal-project/tasks/[taskId]/result/component.tsx` | `src/components/pages/CoursePersonalProjectResultPage/component.tsx`; connected half `index.tsx` ADD | result route | `course-personal-project-result-page` ADD | Attempt history/feedback/result states phải là page owner. |
| route | `FlashcardsIndexRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/flashcards/page.tsx` | Next router redirect → review | none | Legacy entry redirect còn thiếu. |
| route | `FlashcardsReviewRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/flashcards/review/page.tsx` | same | Next router → `CourseFlashcardsReviewPage` | none | Bỏ route-local drawing. |
| route | `FlashcardsQuizRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/flashcards/quiz/page.tsx` | same | Next router → `CourseFlashcardsQuizPage` | none | Bỏ route-local drawing. |
| page | `CourseFlashcardsReviewPage` twins | MOVE | `src/app/[lang]/courses/[displayId]/learn/flashcards/_components.tsx` | `src/components/pages/CourseFlashcardsReviewPage/index.tsx`; `component.tsx` | review route | `course-flashcards-review-page` ADD | Review overview/due/stats/decks cần connected/pure owner. |
| page | `CourseFlashcardsQuizPage` twins | ADD | shared route-local `_components.tsx` | `src/components/pages/CourseFlashcardsQuizPage/index.tsx`; `component.tsx` | quiz route | `course-flashcards-quiz-page` ADD | Quiz overview khác review CTA/data contract. |
| route | `FlashcardReviewSessionRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/flashcards/review/sessions/[sessionId]/page.tsx` | Next router → `CourseFlashcardSessionPage` mode review | none | Legacy resumable session route. |
| route | `FlashcardReviewResultRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/flashcards/review/sessions/[sessionId]/result/page.tsx` | Next router → `CourseFlashcardResultPage` mode review | none | Legacy review result route. |
| route | `FlashcardQuizSessionRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/flashcards/quiz/sessions/[sessionId]/page.tsx` | Next router → `CourseFlashcardSessionPage` mode quiz | none | Legacy quiz session route. |
| route | `FlashcardQuizResultRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/flashcards/quiz/sessions/[sessionId]/result/page.tsx` | Next router → `CourseFlashcardResultPage` mode quiz | none | Legacy quiz result route. |
| page | `CourseFlashcardSessionPage` twins | ADD | absent | `src/components/pages/CourseFlashcardSessionPage/index.tsx`; `component.tsx` | review/quiz session routes | `course-flashcard-session-page` ADD | Focused card lifecycle/start-resume-sync-complete. |
| page | `CourseFlashcardResultPage` twins | ADD | absent | `src/components/pages/CourseFlashcardResultPage/index.tsx`; `component.tsx` | review/quiz result routes | `course-flashcard-result-page` ADD | Result/history/retry actions có page state riêng. |
| route | `MockInterviewSetupRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/mock-interview/page.tsx` | same | Next router → `CourseMockInterviewSetupPage` | none | Chỉ mount setup page. |
| route | `MockInterviewSessionRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/mock-interview/interview/[sessionId]/page.tsx` | same | Next router → `CourseMockInterviewSessionPage` | none | Chỉ mount live page. |
| route | `MockInterviewResultRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/mock-interview/interview/[sessionId]/result/page.tsx` | same | Next router → `CourseMockInterviewResultPage` | none | Chỉ mount result page. |
| page | `MockInterviewPage` local-state shell | REMOVE | `src/components/pages/MockInterviewPage/index.tsx` | absent | three mock-interview routes migrated to three owners | none | Một component local state giả setup/live/result, không có pure twin hoặc live transport. |
| page | `CourseMockInterviewSetupPage` twins | ADD | absent | `src/components/pages/CourseMockInterviewSetupPage/index.tsx`; `component.tsx` | setup route | `course-mock-interview-setup-page` ADD | Start/resume choice và configuration có screen state riêng. |
| page | `CourseMockInterviewSessionPage` twins | ADD | absent | `src/components/pages/CourseMockInterviewSessionPage/index.tsx`; `component.tsx` | session route | `course-mock-interview-session-page` ADD | Full-bleed Socket.IO turns, periodic sync, abort/expired/error. |
| page | `CourseMockInterviewResultPage` twins | ADD | absent | `src/components/pages/CourseMockInterviewResultPage/index.tsx`; `component.tsx` | result route | `course-mock-interview-result-page` ADD | Grade polling/result/ retry có composition riêng. |
| page | `CourseFoundationsPage` twins | MOVE | `src/app/[lang]/courses/[displayId]/learn/foundations/_components.tsx` | `src/components/pages/CourseFoundationsPage/index.tsx`; `component.tsx` | foundations route | `course-foundations-page` ADD | Static route-local CATEGORIES phải thay bằng live block/page owners. |
| page | `CourseFoundationCategoryPage` twins | ADD | shared `_components.tsx` | `src/components/pages/CourseFoundationCategoryPage/index.tsx`; `component.tsx` | category route | `course-foundation-category-page` ADD | Search/list/loading/empty/error theo backend. |
| page | `CourseFoundationResourcePage` twins | ADD | shared `_components.tsx` | `src/components/pages/CourseFoundationResourcePage/index.tsx`; `component.tsx` | resource route | `course-foundation-resource-page` ADD | Resource reader không được dùng hard-coded copy shell. |
| layout | `PlaygroundSessionLayout` twins | ADD | absent | `src/components/layouts/PlaygroundSessionLayout/index.tsx`; `component.tsx` | playground `[slug]/layout.tsx` | `playground-session-frame` ADD | Pairing/socket/session phải sống qua setup → live navigation. |
| route | `PlaygroundSlugLayoutRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/playground/[slug]/layout.tsx` | Next router → `RouteShell` + `PlaygroundSessionLayout` | none | Legacy persistent session boundary còn thiếu. |
| page | `CoursePlaygroundPage` twins | MOVE | `src/app/[lang]/courses/[displayId]/learn/playground/_components.tsx` | `src/components/pages/CoursePlaygroundPage/index.tsx`; `component.tsx` | playground hub route | `course-playground-page` ADD | Hub data/copy/state ra khỏi route. |
| page | `CoursePlaygroundSetupPage` twins | ADD | shared `_components.tsx` | `src/components/pages/CoursePlaygroundSetupPage/index.tsx`; `component.tsx` | `[slug]` route | `course-playground-setup-page` ADD | Pairing/readiness/start states theo live provider. |
| page | `CoursePlaygroundSessionPage` twins | ADD | shared `_components.tsx` | `src/components/pages/CoursePlaygroundSessionPage/index.tsx`; `component.tsx` | `[slug]/session` route | `course-playground-session-page` ADD | Full-bleed live session, stream/reconnect/finish. |
| page | `CourseMindMapPage` twins | MOVE | `src/app/[lang]/courses/[displayId]/learn/mind-map/_components.tsx` | `src/components/pages/CourseMindMapPage/index.tsx`; `component.tsx` | mind-map route | `course-mind-map-page` ADD | Search/selection/canvas data phải có canonical page owner. |
| page | `CourseLeaderboardPage` twins | MOVE | `src/app/[lang]/courses/[displayId]/learn/leaderboard/page.tsx` | `src/components/pages/CourseLeaderboardPage/index.tsx`; `component.tsx` | leaderboard route | `course-leaderboard-page`; existing leaderboard family REUSE | Route đang fetch/draw; page phải own states, block own request. |
| page | `CourseQaPage` twins | ADD | absent; route redirects | `src/components/pages/CourseQaPage/index.tsx`; `component.tsx` | QA route | `course-qa-page` ADD | Legacy QA là product surface thật, không phải content redirect. |
| route | `CourseQaRoute` | MODIFY | `src/app/[lang]/courses/[displayId]/learn/qa/page.tsx` | same | Next router → `CourseQaPage` | none | Bỏ redirect compatibility tạm. |
| route | `CourseHeadhuntingsRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/headhuntings/page.tsx` | Next router → `CourseHeadhuntingsPage` | none | Legacy whole-branch route bị Plan bỏ sót. |
| route | `CourseHeadhuntingCompanyRoute` | ADD | absent | `src/app/[lang]/courses/[displayId]/learn/headhunting-companies/[companyId]/page.tsx` | Next router → `CourseHeadhuntingCompanyPage` | none | Legacy detail identity bị Plan bỏ sót. |
| page | `CourseHeadhuntingsPage` twins | ADD | absent | `src/components/pages/CourseHeadhuntingsPage/index.tsx`; `component.tsx` | headhuntings route | `course-headhuntings-page` ADD | Whole-branch parity phải giữ career discovery surface. |
| page | `CourseHeadhuntingCompanyPage` twins | ADD | absent | `src/components/pages/CourseHeadhuntingCompanyPage/index.tsx`; `component.tsx` | company route | `course-headhunting-company-page` ADD | Company detail/action states có route-owned composition. |
| branch | `Tree` | REUSE | `src/components/branches/Tree/index.tsx` | same | every pure owner | contract registry | Một frame tiếp tục là nơi duy nhất materialize host. |
| branch | surface branch family | REUSE | `src/components/branches/SurfaceCard/index.tsx`; `SurfaceListCard/index.tsx`; `SurfaceFormCard/index.tsx`; `SurfaceAccordionCard/index.tsx` | same | page/block pure twins | existing branch APIs | Không dựng card/list/form bằng native structural JSX. |
| leaf | existing vocabulary leaves | REUSE | `src/components/leaves` | same | all pure twins through contract slots | existing leaf metadata | Không thêm domain leaf hoặc vendor import ở page/block. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| `LearnIndexRoute` | route mount | RETYPE | redirect to `/learn/content` | resolve `displayId`; mount `CourseLearnTodayPage` only | Next router | Route render spec proves no redirect and no structural JSX. |
| `CourseLearnTodayPage` twins | connected/pure twin API | ADD | absent | connected `{ displayId }`; pure `pending|ready|empty|failed` with `mobileView`, primary resume, ordered secondary cards, progress and retry/open actions | default learn route; live hooks below | Twin fixtures prove every state and fixed ranking without fabricated cards. |
| `LearnMobileViewProvider` | `LearnMobileViewContextValue` | ADD | absent | `{ view: "today"|"course"|"progress"|"contents"|"lesson"|"outline"; openView(view) }`; provider resets invalid view to route default | connected Learn layout produces; Today/reader connected pages consume | Component tests switch all route-valid tabs without pathname/search/hash change. |
| `LearnShellLayout` | mobile view ownership | RETYPE | local selected tab changes only underline | owns finite context state, route-valid tabs and default view; wraps routed surface with provider | learn segment layout | Browser proof shows tab press changes visible composition while URL stays byte-identical. |
| `CourseLearnContentPage` twins | mobile view consumption | ADD | selected shell tab does not change reader composition | connected page reads context; pure page receives `mobileView: "contents"|"lesson"|"outline"` and renders exactly one mobile panel while desktop keeps map–paper–outline | reader route; provider | Three viewport fixtures and URL identity assertion. |
| `LearnShellLayout` | connected props | ADD | `{ displayId, surface }` | thêm route-derived `mode`, live spine facts và reader mobile-tab contribution resolved internally; không nhận fetched page payload | learn segment layout only | Typecheck plus no page imports/call sites outside route layout. |
| `_LearnShellLayout` | `LearnShellLayoutData` | RETYPE | `{ spine, tabs? }` với static tabs | `{ spine, mobileTabs?, isFullBleed }`; tabs chỉ có trên reader/mobile state | `LearnShellLayout` | Pure fixtures prove ordinary/full-bleed/reader variants. |
| `_LearnShellLayout` | actions | ADD | `openRow` only | `openRow`, `openMobileTab` | connected layout | Clicking all three mobile tabs changes view without URL change. |
| `LearnSpine` | row/group data | RETYPE | optional `fact`, `isLocked`, `children` shape chưa có live producers | typed lock/due/rank/child facts with resolved labels and destinations | connected learn layout | Legacy nav fixture asserts order/groups/facts and no fabricated values. |
| `ContentTabRow` | face actions | RETYPE | generic `selectFace(id)` | finite `selectReading`, `selectChallenge`, `selectAi`; disabled/locked state in data | `CourseLearnContentPage` | Impossible face/action combinations do not typecheck. |
| `CourseLearnContentHomePage` | connected props | KEEP | `{ displayId }` | same | content home route | Route call remains one exact prop. |
| `_CourseLearnContentHomePage` | state/data/actions | RETYPE | `pending|ready|failed`, loose title/modules, unused retry/module actions | discriminated `pending|ready|empty|failed`; resolved module rows; `openModule`, `retry` | connected twin | Fixture render for four states and module click route. |
| `CourseLearnModulePage` | connected props | RETYPE | `{ moduleId }` | `{ displayId, moduleId }` | module route | Navigation/progress producers have both route identities. |
| `_CourseLearnModulePage` | state/data/actions | RETYPE | loose `{ state,title,module,label }` | discriminated pending/ready/empty/failed with header, continue target, lesson/challenge rows; named actions | connected twin | Fixtures cover no-content/no-challenge and continue navigation. |
| `CourseLearnContentPage` | connected props | KEEP | `{ displayId,moduleId,contentId }` | same | reader route | Route call unchanged. |
| `_CourseLearnContentPage` | data/actions | RETYPE | reader basics and face/tab actions | add reactions, next targets, discussion su…606 tokens truncated…t/in-progress/sync/complete live calls and browser resume proof. |
| `CourseFlashcardResultPage` | twin API | ADD | absent | connected `{ displayId,sessionId,mode }`; pure pending/ready/failed with score/history/retry | two result routes | Result/history query fixture per mode. |
| `MockInterviewPage` | public API | REMOVE | `{ displayId,sessionId?,resultSessionId? }` and local `InterviewState` | removed | setup/session/result routes | `rg MockInterviewPage` returns no consumers after migration. |
| `CourseMockInterviewSetupPage` | twin API | ADD | absent | connected `{ displayId }`; pure pending/ready/resumable/starting/failed with configure/start/resume/retry | setup route | Start and in-progress query tests. |
| `CourseMockInterviewSessionPage` | twin API | ADD | absent | connected `{ displayId,sessionId }`; pure connecting/live/syncing/expired/failed with answer/ask/abort/leave/finish | session route | Socket ask/abort plus sync cadence/reconnect browser proof. |
| `CourseMockInterviewResultPage` | twin API | ADD | absent | connected `{ displayId,sessionId }`; pure grading/ready/failed with retry/newSession | result route | Grade mutation and attempt-by-session polling fixture. |
| `CourseFoundationsPage` | twin API | ADD | static `{ displayId,isVi }` | connected `{ displayId }`; pure pending/ready/empty/failed with query/category actions | foundations route | foundationCategories localized live fixture. |
| `CourseFoundationCategoryPage` | twin API | ADD | static `{ displayId,categoryId,isVi }` | connected `{ displayId,categoryId }`; pure pending/ready/empty/failed with search/openResource | category route | List/search query fixture. |
| `CourseFoundationResourcePage` | twin API | ADD | static `{ displayId,categoryId,foundationId,isVi }` | connected exact ids; pure pending/ready/not-found/failed with back/openPlayground | resource route | Detail live call and not-found fixture. |
| `PlaygroundSessionLayout` | twin API | ADD | absent | connected `{ displayId,slug,surface }`; provider-owned pairing/socket/session; pure frame/full-bleed state | slug layout | Pairing code/socket identity stays stable from setup to session. |
| `CoursePlaygroundPage` | twin API | ADD | static `{ displayId,isVi }` | connected `{ displayId }`; pure pending/ready/empty/failed with openSetup | hub route | Live catalog fixture. |
| `CoursePlaygroundSetupPage` | twin API | ADD | static `{ displayId,slug,isVi }` | connected `{ displayId,slug }`; pure loading/unpaired/paired/ready/starting/failed | setup route/provider | Pair/readiness/start integration proof. |
| `CoursePlaygroundSessionPage` | twin API | ADD | static `{ displayId,slug,isVi }` | connected exact ids; pure connecting/live/reconnecting/completed/failed with step/submit/leave | session route/provider | Socket/RAG stream and reconnect proof. |
| `CourseMindMapPage` | twin API | ADD | static `{ displayId,isVi }` | connected `{ displayId }`; pure pending/ready/empty/failed with search/select/openContent | mind-map route | Live producer and canvas/mobile fixtures. |
| `CourseLeaderboardPage` | twin API | ADD | route-local params/query/render | connected `{ displayId }`; pure pending/ready/empty/failed with category/retry and viewer standing | leaderboard route | courseLeaderboard variables/data fixtures. |
| `CourseQaPage` | twin API | ADD | absent | connected `{ displayId }`; pure pending/ready/empty/failed with search/ask/openThread/retry | QA route | QA live contract must be named before Apply; no redirect remains. |
| `CourseHeadhuntingsPage` | twin API | ADD | absent | connected `{ displayId }`; pure pending/ready/empty/failed with filters/openCompany | headhuntings route | Legacy route fixture and live producer evidence. |
| `CourseHeadhuntingCompanyPage` | twin API | ADD | absent | connected `{ displayId,companyId }`; pure pending/ready/not-found/failed with apply/back | company route | Detail/action fixture. |
| `CONTRACTS` registry | keys/slots | ADD | keys above absent except explicitly reused families | add every `ADD` contract named in COMPONENT DELTA; modify only listed content/shell keys | all pure twins through `Tree` | `rg` proves every new key has a renderer and no unused key remains. |
| `CourseLearnContentHomePage` twins | connected/pure twin boundary | KEEP | existing two-file owner | same two-file owner; detailed state/API migration in `CourseLearnContentHomePage` row above | content home route | Both exact files remain and connected twin renders exact pure twin on every state. |
| `CourseLearnModulePage` twins | connected/pure twin boundary | KEEP | existing two-file owner | same; detailed API migration above | module route | Call-site and twin-render search. |
| `CourseLearnContentPage` twins | connected/pure twin boundary | KEEP | existing two-file owner | same; detailed API migration above | reader route | Call-site and twin-render search. |
| `ContentChallengeRoute` | route params/mount | ADD | absent | params `{ displayId,moduleId,contentId,challengeId }`; mounts `CourseLearnChallengePage` only | Next router | Route render spec. |
| `ContentChallengeResultRoute` | route params/mount | ADD | absent | same ids; mounts result page only | Next router | Route render spec. |
| `CourseLearnChallengePage` twins | connected/pure twin boundary | ADD | absent | exact two-file owner; detailed state/API above | challenge route | Twin spec. |
| `CourseLearnChallengeResultPage` twins | connected/pure twin boundary | ADD | absent | exact two-file owner; detailed state/API above | result route | Twin spec. |
| `PersonalProjectWorkspaceLayout` twins | connected/pure twin boundary | ADD | absent | exact two-file layout owner | personal-project segment layout | Layout persistence fixture. |
| `PersonalProjectLayoutRoute` | route params/mount | ADD | absent | params `{ displayId }`; `RouteShell` mounts workspace layout | Next router | Route layout spec. |
| `PersonalProjectRoute` | route params/mount | KEEP | params `{ lang,displayId }` | resolve `displayId`; mount page only | Next router | No drawing/imports beyond page. |
| `CoursePersonalProjectPage` twins | connected/pure twin boundary | ADD | route-local component only | exact two-file page owner; detailed API above | dashboard route | Twin spec and old-path removal search. |
| `PersonalProjectTaskRoute` | route params/mount | KEEP | params `{ lang,displayId,taskId }` | resolve ids; mount page only | Next router | Route spec. |
| `CoursePersonalProjectTaskPage` twins | connected/pure twin boundary | ADD | route-local component only | exact two-file page owner; detailed API above | task route | Twin spec and old-path removal search. |
| `PersonalProjectResultRoute` | route params/mount | KEEP | params `{ lang,displayId,taskId }` | resolve ids; mount result page only | Next router | Route spec. |
| `CoursePersonalProjectResultPage` twins | connected/pure twin boundary | ADD | route-local component only | exact two-file page owner; detailed API above | result route | Twin spec and old-path removal search. |
| `FlashcardsIndexRoute` | redirect contract | ADD | absent | redirect to `/learn/flashcards/review` preserving locale/course | Next router | Redirect spec. |
| `FlashcardsReviewRoute` | route params/mount | KEEP | route-local overview mount | page-only mount `{ displayId }` | Next router | Route spec. |
| `FlashcardsQuizRoute` | route params/mount | KEEP | route-local overview mount | page-only mount `{ displayId }` | Next router | Route spec. |
| `CourseFlashcardsReviewPage` twins | connected/pure twin boundary | ADD | shared route-local file | exact two-file page owner; detailed API above | review route | Twin spec and `_components.tsx` removal search. |
| `CourseFlashcardsQuizPage` twins | connected/pure twin boundary | ADD | shared route-local file | exact two-file page owner; detailed API above | quiz route | Twin spec and `_components.tsx` removal search. |
| `FlashcardReviewSessionRoute` | route params/mount | ADD | absent | `{ displayId,sessionId,mode:"review" }` mount only | Next router | Route spec. |
| `FlashcardReviewResultRoute` | route params/mount | ADD | absent | `{ displayId,sessionId,mode:"review" }` result mount only | Next router | Route spec. |
| `FlashcardQuizSessionRoute` | route params/mount | ADD | absent | `{ displayId,sessionId,mode:"quiz" }` mount only | Next router | Route spec. |
| `FlashcardQuizResultRoute` | route params/mount | ADD | absent | `{ displayId,sessionId,mode:"quiz" }` result mount only | Next router | Route spec. |
| `CourseFlashcardSessionPage` twins | connected/pure twin boundary | ADD | absent | exact two-file page owner; detailed API above | two session routes | Twin/live lifecycle specs. |
| `CourseFlashcardResultPage` twins | connected/pure twin boundary | ADD | absent | exact two-file page owner; detailed API above | two result routes | Twin/result specs. |
| `MockInterviewSetupRoute` | route params/mount | KEEP | mounts local-state multipage owner | mounts setup owner `{ displayId }` only | Next router | Route spec. |
| `MockInterviewSessionRoute` | route params/mount | KEEP | mounts local-state multipage owner | mounts session owner `{ displayId,sessionId }` only | Next router | Route spec. |
| `MockInterviewResultRoute` | route params/mount | KEEP | mounts local-state multipage owner | mounts result owner `{ displayId,sessionId }` only | Next router | Route spec. |
| `MockInterviewPage` local-state shell | public API removal | REMOVE | `{ displayId,sessionId?,resultSessionId? }` | component removed | three routes | `rg MockInterviewPage` has no consumers. |
| `CourseMockInterviewSetupPage` twins | connected/pure twin boundary | ADD | absent | exact two-file owner; detailed API above | setup route | Twin/live start specs. |
| `CourseMockInterviewSessionPage` twins | connected/pure twin boundary | ADD | absent | exact two-file owner; detailed API above | session route | Twin/socket specs. |
| `CourseMockInterviewResultPage` twins | connected/pure twin boundary | ADD | absent | exact two-file owner; detailed API above | result route | Twin/grade specs. |
| `CourseFoundationsPage` twins | connected/pure twin boundary | ADD | route-local static owner | exact two-file owner; detailed API above | hub route | Twin/live query specs. |
| `CourseFoundationCategoryPage` twins | connected/pure twin boundary | ADD | shared route-local static owner | exact two-file owner; detailed API above | category route | Twin/search specs. |
| `CourseFoundationResourcePage` twins | connected/pure twin boundary | ADD | shared route-local static owner | exact two-file owner; detailed API above | resource route | Twin/detail specs. |
| `PlaygroundSessionLayout` twins | connected/pure twin boundary | ADD | absent | exact two-file layout owner; detailed API above | slug layout | Provider/socket persistence spec. |
| `PlaygroundSlugLayoutRoute` | route params/mount | ADD | absent | `{ displayId,slug }`; `RouteShell` mounts session layout | Next router | Route layout spec. |
| `CoursePlaygroundPage` twins | connected/pure twin boundary | ADD | route-local static owner | exact two-file owner; detailed API above | hub route | Twin/catalog specs. |
| `CoursePlaygroundSetupPage` twins | connected/pure twin boundary | ADD | shared route-local owner | exact two-file owner; detailed API above | setup route | Twin/pairing specs. |
| `CoursePlaygroundSessionPage` twins | connected/pure twin boundary | ADD | shared route-local owner | exact two-file owner; detailed API above | session route | Twin/socket specs. |
| `CourseMindMapPage` twins | connected/pure twin boundary | ADD | route-local static owner | exact two-file owner; detailed API above | mind-map route | Twin/data/canvas specs. |
| `CourseLeaderboardPage` twins | connected/pure twin boundary | ADD | route-local query/drawing | exact two-file owner; detailed API above | leaderboard route | Twin/query specs. |
| `CourseQaPage` twins | connected/pure twin boundary | ADD | absent | exact two-file owner; detailed API above | QA route | Twin/thread specs. |
| `CourseQaRoute` | route params/mount | RETYPE | redirect params | resolve `{ displayId }`; mount QA page only | Next router | No redirect assertion. |
| `CourseHeadhuntingsRoute` | route params/mount | ADD | absent | `{ displayId }`; mount list page only | Next router | Legacy route spec. |
| `CourseHeadhuntingCompanyRoute` | route params/mount | ADD | absent | `{ displayId,companyId }`; mount detail page only | Next router | Legacy route spec. |
| `CourseHeadhuntingsPage` twins | connected/pure twin boundary | ADD | absent | exact two-file owner; detailed API above | headhuntings route | Twin/list specs. |
| `CourseHeadhuntingCompanyPage` twins | connected/pure twin boundary | ADD | absent | exact two-file owner; detailed API above | company route | Twin/detail/action specs. |

### Supporting production boundary

| Owner family | Exact paths |
|---|---|
| Today route/page/context | `src/app/[lang]/courses/[displayId]/learn/page.tsx`; `src/components/pages/CourseLearnTodayPage/index.tsx`; `component.tsx`; `src/components/layouts/LearnShellLayout/view-context.tsx`; existing live hooks `useQueryCourseSwr`, `useQueryMyCoursesSwr`, `useQueryMyLearnedLessonsSwr`, `useQueryMyInProgressChallengesSwr`, `useQueryFlashcardDecksByCourseSwr`, `useQueryCoursePersonalProjectSwr`, `useQueryMyInProgressMockInterviewSessionSwr`, and `useQueryResolveRouteSwr` REUSE |
| Contract/type registry | `src/components/contracts/index.ts`; `src/components/contracts/props.ts` only if existing helpers cannot type the approved slots |
| A1 queries/hooks | `src/modules/api/graphql/queries/query-course.ts`; `query-module.ts`; `query-content.ts`; `src/hooks/swr/useQueryCourseSwr.ts`; `useQueryModuleSwr.ts`; `useQueryContentSwr.ts` |
| A1 reactions/discussion/challenge | `src/modules/api/graphql/queries/query-content-reactions.ts`; `query-content-comments.ts`; `src/modules/api/graphql/mutations/mutation-react-content.ts`; `mutation-submit-content-comment.ts`; `mutation-submit-content-challenge.ts`; matching SWR hooks under `src/hooks/swr` |
| A2 transport | MOVE `src/app/[lang]/courses/[displayId]/learn/personal-project/query.ts` → `src/modules/api/graphql/queries/query-course-personal-project.ts`; MOVE `types.ts` → `src/modules/api/graphql/queries/types/course-personal-project.ts`; add `src/hooks/swr/useQueryCoursePersonalProjectSwr.ts`, `useQueryPersonalTaskAttemptsSwr.ts`, `useQueryPersonalTaskAttemptFeedbacksSwr.ts`, `useMutateSubmitPersonalTaskAttemptSwr.ts` |
| A3 transport | `src/modules/api/graphql/queries/query-flashcard-decks-by-course.ts`; `query-my-flashcard-stats.ts`; `query-my-in-progress-flashcard-session.ts`; `query-flashcard-session-result.ts`; `src/modules/api/graphql/mutations/mutation-start-flashcard-session.ts`; `mutation-sync-flashcard-session.ts`; `mutation-complete-flashcard-session.ts`; matching SWR hooks |
| A4 transport | `src/modules/api/graphql/queries/query-my-in-progress-mock-interview-session.ts`; `query-mock-interview-attempt-by-session.ts`; `src/modules/api/graphql/mutations/mutation-start-mock-interview-session.ts`; `mutation-sync-mock-interview-session-turns.ts`; `mutation-grade-mock-interview-session.ts`; `src/hooks/socketio/useMockInterviewSocketIo.ts`; matching SWR hooks |
| A5 transport | `src/modules/api/graphql/queries/query-foundation-categories.ts`; `query-foundations.ts`; `query-foundation.ts`; `query-playgrounds.ts`; `query-playground.ts`; `query-course-mind-map.ts`; `src/modules/api/graphql/mutations/mutation-start-playground-session.ts`; `src/hooks/socketio/usePlaygroundSocketIo.ts`; matching SWR hooks. Playground step completion is Socket.IO `step:verified`; do not add nonexistent `mutation-complete-playground-step.ts`. |
| A6 transport | MOVE `src/app/[lang]/courses/[displayId]/learn/leaderboard/_data.ts` → `src/modules/api/graphql/queries/query-course-leaderboard.ts`; add `useQueryCourseLeaderboardSwr.ts`; QA uses backend-proven `contentComments({ courseId })` and `createComment({ courseId, body })`; headhunting uses `headhuntingCompanies`, `headhuntingCompany`, `consultants` and suggestion queries. Company page exposes `openJob(jobId)`/consultant contact, not nonexistent company-level apply; `applyToJob(jobId)` remains owned by job detail flow. |
| Messages | `src/messages/en.json`; `src/messages/vi.json` under exact `learn` namespaces for every approved page/block state |
| Fixtures/tests | exact twin specs beside each new/modified page/block/hook/query; route render specs for every legacy URL; browser fixture identities `enrolled-ready`, `locked`, `empty`, `failed`, `resume`, `expired`, `mobile-reader`, `full-bleed-live` |

### Acceptance commands and evidence

| Proof | Command / state |
|---|---|
| Today default | `/learn` pending/ready/empty/failed; fixed primary priority `unexpired interview session > in-progress challenge > latest learned lesson > /learn/content`; secondary order `due flashcards > current project task > interview setup`; absent facts render no card. |
| Mobile context | Today tabs `today/course/progress`; reader tabs `contents/lesson/outline`; every press changes visible panel with identical pathname, search and hash. |
| Type boundary | `npx tsc --noEmit` |
| Canon adoption | `npx eslint "src/app/[lang]/courses/[displayId]/learn/**/*.{ts,tsx}" "src/components/{pages,layouts,blocks}/**/*.{ts,tsx}" "src/hooks/{swr,socketio}/**/*.{ts,tsx}" "src/modules/api/graphql/**/*.{ts,tsx}" --max-warnings 0` |
| Unit/contract | `npm test -- --runInBand` with page twin, hook, query/mutation and contract-slot specs named above |
| Build | `npm run build` |
| Route parity | Browser-open every legacy URL in the Route compatibility inventory at desktop and mobile; no dead end, blank shell or unexpected redirect |
| Live A2/A3 | Enrolled fixtures prove task submission/result and flashcard start/resume/sync/complete/result |
| Live A4/A5 | GraphQL + Socket.IO fixtures prove interview and playground connect/reconnect/abort/expired/finish; only approved live routes are full-bleed |
| Reader | pending/ready/locked/failed plus reactions, next steps, challenge/AI, discussion, desktop rails and three mobile views |
| A6 | Leaderboard categories/myRank/computedAt; QA thread/ask; headhunting list/detail/action or explicit Review revision if backend capability is absent |

### OUTPUTS

| Concept | Result |
|---|---|
| Review draft | `learn-branch-AB-today-legacy-parity-review-r1` freezes Today default route/page, deterministic live ranking and one layout-owned mobile view context while retaining all prior deep-route parity rows. |
| Backend corrections | Playground completion is Socket.IO `step:verified`; headhunting company has no company-level apply and exposes proven job/consultant actions only. |
| Apply invariant | No Today card may be fabricated; no mobile tab may only change its underline; no global resume header enters deep routes. |
### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/learn-branch.md` | appended — review revision 7 draft with complete inherited delta tables plus exact A+B/mobile/backend corrections |
### NEED APPROVALS

| Question | Options |
|---|---|
| Approve exact Review identity `learn-branch-AB-today-legacy-parity-review-r1` for resumed Apply? | Yes — approve Today at `/learn`, A parity on deep routes, finite mobile context and backend-proven A5/A6 corrections (recommended); No — provide corrections and append next Review revision |
### WARNINGS

| Warning | Impact |
|---|---|
| Current Apply baseline already exists at `22da900` and safe deep-route edits are in progress | Approval resumes the same tracked diff; it must not create a second baseline. |
| Full Vitest command prescribed with `--runInBand` is invalid for Vitest | Apply must record that failed command and use `npm test`; existing non-learn failures remain classified separately. |
| Historical `review[2]` lacks canonical delta tables | Workflow validator remains red on historical evidence; this revision is structurally complete and history is not rewritten. |
### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `/learn` redirect to `/learn/content` | Real `CourseLearnTodayPage` at default route | User: “Trang hôm nay là ở route `/learn` default”. |
| Global B resume header on every route | B composition only at Today index; A composition on deep routes | A+B clarification preserves legacy parity where capability work happens. |
| Mobile tabs that only update selected underline | Layout-owned finite context consumed by Today and reader pages | Visible panel must change without URL mutation. |
| GraphQL `mutation-complete-playground-step.ts` | Socket.IO `step:verified` | Backend exposes completion through the live gateway, not that mutation. |
| Company-level `apply` action | `openJob(jobId)` and consultant contact; `applyToJob(jobId)` stays in job flow | Backend has no company-level apply operation. |
### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of `learn-branch-AB-today-legacy-parity-review-r1` | User approves exact identity after reading this draft |
| Approved revision marker | Append next Review revision with `Approved revision: learn-branch-AB-today-legacy-parity-review-r1` only after approval |
| Resumed production implementation and full live proof | `$starci-fe-design-apply` on existing baseline `22da900` after approval |

## approval decision 8

Approved revision: `learn-branch-AB-today-legacy-parity-review-r1`.

### OUTPUTS

| Concept | Result |
|---|---|
| User decision | User replied `ok chốt` while reviewing revision 7; this explicitly approves its sole named candidate revision. |
| Frozen product boundary | `/learn` owns Today; `/learn/content` owns Modules; all deep routes retain direction A legacy parity. |
| Apply handoff | Resume `$starci-fe-design-apply` on existing baseline `22da900`; do not create a second baseline. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/learn-branch.md` | appended — review revision 8 approval marker only |

### NEED APPROVALS

None.

### WARNINGS

| Warning | Impact |
|---|---|
| Historical `review[2]` lacks canonical delta tables | Preserve history; current approved revision is structurally complete. |

### REJECTED

None beyond review revision 7.

### OWED

| Owed | Cleared by |
|---|---|
| Production implementation and live proof | `$starci-fe-design-apply` on baseline `22da900` |

## apply

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-fe` |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets: frontend and backend supplied by user |
| Frontend | `D:\Repositories\starci-academy-fe` |
| Backend | `D:\Repositories\starci-academy-backend` |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | `starci-academy` |
| Repo / branch | `D:\Repositories\starci-academy-fe` @ `main` |
| Purpose | Apply approved hybrid A+B: Today at `/learn`, Modules at `/learn/content`, and A1-A6 legacy parity on every deep route. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\learn-branch.md |
| Language | vi |
| Phase | apply |
| Touching | Approved frontend production boundary plus this workflow record |

Applied revision: `learn-branch-AB-today-legacy-parity-review-r1`

Baseline commit: `22da900`

Tracked diff: `22da900..worktree`

### OUTPUTS

| Concept | Result |
|---|---|
| A+B route split | `/learn` mounts live `CourseLearnTodayPage`; `/learn/content` owns the module collection; all legacy deep-route identities remain real routes. |
| Today priority | Live ranking is interview session > in-progress challenge > learned lesson > modules fallback; secondary work is due flashcards > project task > interview setup; absent facts create no card. |
| Mobile ownership | `LearnShellLayout` owns the finite Today and reader view context. Live 390x844 proof changed Today -> Course -> Progress composition while the complete URL stayed byte-identical. |
| A1 | Reader reactions, discussion, mobile panels, challenge and challenge-result routes use live GraphQL owners and exact page twins. AI remains disabled because no approved transport boundary exists. |
| A2 | Personal-project workspace, dashboard, task, result and submission/feedback transports are canonical page/layout twins. |
| A3 | Flashcard review/quiz entry, resumable session and result routes use start/sync/complete/result transports. |
| A4 | Mock-interview setup/session/result use live start, Socket.IO turn sync and grading owners. |
| A5 | Foundations, Playground and Mind Map use live transports; Playground completion remains Socket.IO `step:verified`. |
| A6 | Leaderboard, Q&A and headhunting list/company routes use backend-proven operations; no company-level apply action was invented. |
| Final source gates | Strict ESLint passed all 713 `src` TS/TSX files; `npx tsc --noEmit`, `git diff --check`, message JSON parse and `npm run build` passed. Final scoped Learn run passed 23 files / 42 tests. |
| Full suite classification | `npx vitest run --reporter=dot`: 121/133 files and 495/510 tests passed. The 12 failed files are pre-existing/concurrent non-Learn failures: Next test resolver, dashboard DOM assertions/ResizeObserver, hooks barrel, Apollo link chain and course-list query expectation. |

### LIVE FLOW PROOF

| Flow | Persona | Steps | UI | Network | Console | Terminal | Verdict | Evidence |
|---|---|---|---|---|---|---|---|---|
| Real authentication and Today | dedicated local `StarCi Test Learner` | Seed account; submit email/password through `/en/authentication`; complete real local OTP challenge; open `/en/courses/fullstack-mastery/learn` | Redirected to dashboard, then Today rendered live course, flashcard, project and interview facts | Authorized `Course` GraphQL POST returned HTTP 200, zero GraphQL errors and `success:true`; no secret was recorded | Fresh Learn tab had no uncaught error | Existing FE `:3000`, API `:3001` and healthy compose services served the same 02:16-02:20 ICT window | passed | Localhost runtime; redacted dedicated account; Today heading and backend-derived cards visible. |
| Today mobile context | same test learner | Set viewport 390x844; press Today, Course, Progress | Each press replaced the visible page composition; active state followed content | No navigation request; pathname/search/hash remained exactly `/en/courses/fullstack-mastery/learn` | No route error or hydration failure on the proof tab | Runtime remained responsive throughout presses | passed | Captured URL before/after all presses was identical. |
| A1 Modules | same test learner | Open `/learn/content`; reload after live correction | Real Fullstack Mastery module run rendered and heading resolved to `Modules` | Course payload loaded from API; direct authorized probe was HTTP 200 with zero GraphQL errors | New clean tab reported zero errors; no raw `learn.contentHome` key remained | FE hot reload and API remained responsive | passed | Live-discovered missing namespace and missing `count` formatting argument were corrected, linted, typechecked and reloaded. |
| A2-A4 route families | same test learner | Open personal project, flashcards and mock interview roots | H1s `Personal Project`, `Flashcards`, `Mock interview`; live task/deck/setup facts rendered; no alert | Runtime-backed pages completed their query states without a GraphQL error surface | No per-route alert or uncaught route failure | API modules and services were running; routes returned within the proof window | passed | Routes: `/learn/personal-project`, `/learn/flashcards/review`, `/learn/mock-interview`. |
| A5 route families | same test learner | Open foundations, playground and mind-map roots | H1s `Foundations`, `Playground`, `Concept map`; 186 live map connections rendered; no alert | Runtime-backed catalogs/maps completed without an error surface | No per-route alert or uncaught route failure | API remained healthy; Socket.IO completion contract is source/test-proven as `step:verified` | passed | Routes: `/learn/foundations`, `/learn/playground`, `/learn/mind-map`. |
| A6 route families | same test learner | Open leaderboard, Q&A and headhunting roots | H1s `Course leaderboard`, `Course Q&A`, `Headhunting partners`; empty states were truthful; no dead end | Runtime-backed queries completed without an error surface | No per-route alert or uncaught route failure | API remained responsive throughout route sweep | passed | Routes: `/learn/leaderboard`, `/learn/qa`, `/learn/headhuntings`; no fabricated company apply. |

### CHANGES

| Tree | Details |
|---|---|
| Learn routes | Added/modified every approved path below `src/app/[lang]/courses/[displayId]/learn`: Today, content challenge/result, personal-project workspace/task/result, flashcard review/quiz/session/result, mock-interview setup/session/result, foundations, playground setup/session, mind-map, leaderboard, Q&A and headhunting list/company. Removed only the route-local owners replaced by canonical twins. |
| Learn blocks/layouts | Added `ContentDiscussionPanel`; modified `ContentTabRow`; modified `LearnShellLayout`; added `PersonalProjectWorkspaceLayout` and `PlaygroundSessionLayout`, each with exact adjacent specs. |
| Learn pages | Added/modified the complete `src/components/pages/Course{LearnToday,LearnContentHome,LearnModule,LearnContent,LearnChallenge,LearnChallengeResult,PersonalProject,PersonalProjectTask,PersonalProjectResult,FlashcardsReview,FlashcardsQuiz,FlashcardSession,FlashcardResult,MockInterviewSetup,MockInterviewSession,MockInterviewResult,Foundations,FoundationCategory,FoundationResource,Playground,PlaygroundSetup,PlaygroundSession,MindMap,Leaderboard,Qa,Headhuntings,HeadhuntingCompany}Page` twin families and their specs; removed obsolete `MockInterviewPage`. |
| Contracts and messages | Modified `src/components/contracts/index.ts`, `src/messages/en.json`, and `src/messages/vi.json`; the live-discovered Modules namespace/count correction is included. |
| Hooks | Added exact approved owners below `src/hooks/swr` for A1-A6 queries/mutations and below `src/hooks/socketio` for mock interview and Playground, including lifecycle specs. |
| GraphQL transport | Added/modified exact A1-A6 query/mutation/type owners below `src/modules/api/graphql`; moved personal-project and leaderboard route-local transport to this canonical tree. |
| Workflow | Appended this Apply record to `.workflows/designs/starci-academy/learn-branch.md`. |
| Concurrent non-Apply paths preserved | `HANDOFF.md`, `package.json`, `src/app/globals.css`, `CourseDetailPage`, `CoursePricingRail`, and later course query/detail test edits were committed concurrently as `6a3b072` and `1bc591b`; they remain in `22da900..worktree` but are not claimed as Learn Apply output. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Apply used the exact approved boundary. |

### WARNINGS

| Warning | Impact |
|---|---|
| Prescribed ESLint bracket glob is not resolvable on Windows | Equivalent strict batching over all 713 `src` TS/TSX files passed with zero errors. |
| `npm test -- --runInBand` is invalid for Vitest | The command reports unknown option; `npx vitest run --reporter=dot` supplied the full-suite result and scoped Learn tests passed 23/23 files. |
| Full suite retains 12 non-Learn failed files | Classified above; no failed file is in the approved Learn route/page/layout/hook/transport boundary. |
| A duplicate API watcher started during proof found the existing `:3001` runtime and reported `EADDRINUSE` | The duplicate watcher was terminated; the pre-existing API process continued serving HTTP 200. This is not an application request failure. |
| `view-context.tsx` was canon-incompatible as a third layout surface file | The approved finite context API was integrated into the two allowed `LearnShellLayout` twins without changing its behavior or public ownership. |
| Historical `review[2]` lacks canonical delta tables | Workflow validation continues to report only those four preserved historical errors; the approved revision and this Apply record are structurally complete. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Fabricated Today work | Omit absent cards and use modules fallback | Approved deterministic live priority. |
| Mobile underline-only state | Replace visible composition without URL change | Approved finite context behavior. |
| Nonexistent Playground completion mutation | Socket.IO `step:verified` | Backend gateway is the production owner. |
| Company-level apply | Job-owned apply and consultant/company contact only | Backend has no company-level apply operation or company-to-job producer. |
| Unfrozen reader AI transport | Disabled AI face | Apply cannot invent a transport outside Review. |

### OWED

| Owed | Cleared by |
|---|---|
| None for approved Learn Apply | Full-repository historical test debt remains outside this revision and is recorded under WARNINGS. |
