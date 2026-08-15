<!-- starci-workflow: v2 -->

# Global Search modal spacing and native ListBox fidelity

## start

Session id: `global-search-modal-spacing-listbox-20260815-01`

Session status: open

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
| Repo / branch | FE D:\Repositories\starci-academy-fe on `main` at `cd7f7ae66de937dd19065af3e1c84c8d866e86c4`; BE D:\Repositories\starci-academy-backend on `mtp` |
| Purpose | Khôi phục Global Search modal về một lớp `p-4`, HeroUI ListBox native và empty result chiếm đúng vùng còn lại. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\global-search-modal-spacing-listbox-20260815-01.md |
| Language | vi |
| Phase | start |
| Touching | Workflow này; FE `src/components/shells/ModalShell/index.tsx`, `src/components/shells/ModalShell/index.test.tsx`, `src/components/leaves/SelectionList/index.tsx`, `src/components/leaves/SelectionList/index.test.tsx`, `src/components/overlays/search/GlobalSearchOverlay/component.tsx`, `src/components/overlays/search/GlobalSearchOverlay/component.test.tsx`, `src/components/contracts/index.ts` |

### Binding evidence

| Evidence | Frozen expected result |
|---|---|
| User screenshots `codex-clipboard-a829f74b-1afe-44ea-9aa9-4ba4503929c1.png` and `codex-clipboard-2116a06f-f33f-4994-936a-b48fa4dabc23.png` | Modal must not have nested padding; scope region must read as a real ListBox; empty center must expand instead of inheriting context-column width. |
| Explicit instruction | Modal uses one `p-4`; no self-invented scope-tab component; visual refinement follows StarCi/legacy vocabulary. |
| Live route | `http://localhost:3000/vi/courses/1ab239c8-ebb5-53ee-b255-dc7839a6b959`, authenticated persona shown in supplied Chrome capture, desktop and narrow viewport. |
| HeroUI source | `.modal__dialog` owns default `p-6`; `.list-box`/`.list-box-item` provide native chrome and `ListBox.ItemIndicator`. |
| FE source | Workspace also owns `p-4`; `global-search-body` styles `last-child` as context, so the empty/result region becomes `w-72` whenever optional context is absent. |

Baseline identity: FE `cd7f7ae66de937dd19065af3e1c84c8d866e86c4` plus the existing dirty worktree recorded at session start; no baseline commit is created by Fidelity Start.

### OUTPUTS

| Concept | Result |
|---|---|
| Active correction | One-padding Global Search modal, native ListBox scopes/results and stable optional-context layout. |
| Session | `global-search-modal-spacing-listbox-20260815-01` is open for immediate correction and feedback. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/global-search-modal-spacing-listbox-20260815-01.md` | `added` — session context, binding screenshots, baseline and bounded source paths. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User explicitly authorized the bounded visual correction. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE worktree already contains the uncommitted approved Global Search implementation and unrelated concurrent files. | This session must preserve them and report only its bounded diff. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | Initial correction follows explicit feedback. | No direction has been refused in this session yet. |

### OWED

| Owed | Cleared by |
|---|---|
| Production correction and focused visual/runtime proof | Patch bounded FE owners, run tests/lint/typecheck and capture desktop/mobile states. |
| User acceptance | User confirms the corrected render is satisfactory. |

## feedback

Session id: `global-search-modal-spacing-listbox-20260815-01`

Session status: open

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
| Repo / branch | FE `main` at baseline HEAD `cd7f7ae66de937dd19065af3e1c84c8d866e86c4` plus preserved current worktree; BE `mtp` |
| Purpose | Apply the user's one-layer `p-4`, native HeroUI ListBox and flexible no-context layout correction. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\global-search-modal-spacing-listbox-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | This workflow; FE `ModalShell`, `SelectionList`, Global Search tests and the Global Search contract rows in `src/components/contracts/index.ts`. |

### OUTPUTS

| Concept | Result |
|---|---|
| Desktop idle, 1280x720 | Dialog padding `16px`; body/workspace padding `0px`; scope ListBox `288px`; empty region expands to `839px`. |
| Mobile, 390x844 | Scope and empty states stack at `317px`; modal remains one `16px` inset; Global Search body reports no horizontal overflow. |
| Populated query `system` | Native results ListBox renders 21 items at `508px`, selected context rail remains `288px`; no browser console errors. |
| Runtime structure | HeroUI emits one native `data-slot=list-box` and six `ListBox.ItemIndicator` slots for scopes. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/shells/ModalShell/index.tsx` | Cover dialogs explicitly own `p-4`; body remains `p-0`, removing the vendor-dialog plus workspace double inset. |
| `src/components/leaves/SelectionList/index.tsx` | Scope and result collections now retain HeroUI native ListBox/ListBox.Item chrome and indicator instead of bespoke tab-like layout styling. |
| `src/components/contracts/index.ts` | Workspace drops its second `p-4`; body widths bind to stable `data-component`/`data-variant`/`data-node` identities so React Aria FocusScope siblings and optional context cannot collapse the center. |
| Focused tests | Modal spacing, native ListBox structure/keyboard action and identity selector behavior are asserted. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Visual acceptance | User reviews the corrected desktop/mobile/search-result render; acceptance keeps this session ready for Fidelity End. |

### WARNINGS

| Warning | Impact |
|---|---|
| `npm run typecheck -- --pretty false` is red from preserved concurrent `src/components/contracts/index.ts:2164`: unsupported `flex-nowrap` and `[&>*]:whitespace-nowrap`. | Those out-of-boundary price-row edits collapse contract inference and create the large downstream `never` cascade. This fidelity session did not rewrite them. |
| Focused ESLint emits only the repository configuration warning that React version is unspecified. | No bounded lint error. |
| FE worktree remains broadly dirty from other approved/concurrent work. | No unrelated file was reverted, staged or committed. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Positional `first-child`/`last-child` width selectors | Stable region identity selectors | Live DOM shows React Aria inserts hidden FocusScope siblings around ListBox, so child position is not component identity. |
| Fixing the unrelated price-row contract classes during this session | Record exact external blocker | The user requested a bounded Global Search fidelity correction and concurrent source must be preserved. |

### OWED

| Owed | Cleared by |
|---|---|
| Focused tests | Cleared: 3 files, 7 tests passed. |
| Focused lint | Cleared: zero errors on seven bounded files. |
| Desktop/mobile/idle/populated runtime proof | Cleared with measured layout and zero browser console errors. |
| Repository-wide typecheck | Owed outside this session: repair or complete the concurrent price-row contract change at line 2164, then rerun. |
| User acceptance | User confirms the corrected render is satisfactory. |

## feedback

Session id: `global-search-modal-spacing-listbox-20260815-01`

Session status: open

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
| Repo / branch | FE `main` at baseline HEAD `cd7f7ae66de937dd19065af3e1c84c8d866e86c4` plus preserved current worktree; BE `mtp` |
| Purpose | Xuất HTML độc lập để người dùng xem trước correction Global Search đã triển khai. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\global-search-modal-spacing-listbox-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | Workflow này và `.workflows/.previews/fidel/starci-academy/global-search-modal-spacing-listbox-20260815-01/index.html`; không đổi thêm production source. |

Preview URL: `http://127.0.0.1:8087/`

Preview SHA-256: `0036AD4EEF4D4B903B9B07C865315C6CB4151031B24A01B306996C38F7CD28BF`

### OUTPUTS

| Concept | Result |
|---|---|
| HTML fidelity preview | Một preview tương tác thể hiện đúng one-layer `p-4`, native ListBox và center region co giãn. |
| State coverage | Ba tab `Desktop · Rỗng`, `Desktop · Kết quả`, `Mobile` đều đã mở và kiểm tra trực tiếp. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/.previews/fidel/starci-academy/global-search-modal-spacing-listbox-20260815-01/index.html` | `added` — HTML/CSS/JS độc lập với ba trạng thái fidelity. |
| `.workflows/fidel/starci-academy/global-search-modal-spacing-listbox-20260815-01.md` | `modified` — ghi URL, hash và proof của preview. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Visual acceptance | Người dùng xem preview và phản hồi correction tiếp theo hoặc xác nhận đạt. |

### WARNINGS

| Warning | Impact |
|---|---|
| Preview là disposable workflow evidence, không phải production owner. | Mọi thay đổi production tiếp theo vẫn phải đi qua component/contract hiện hữu. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | Preview phản ánh đúng correction hiện tại. | Chưa có direction mới bị từ chối trong feedback này. |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance | Người dùng xác nhận preview đạt hoặc chỉ rõ chi tiết cần sửa. |

## feedback

Session id: `global-search-modal-spacing-listbox-20260815-01`

Session status: open

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
| Repo / branch | FE `main` at baseline HEAD `cd7f7ae66de937dd19065af3e1c84c8d866e86c4` plus preserved current worktree; BE `mtp` |
| Purpose | Sửa ownership cột giữa thành label-less nested SurfaceListCard khi có kết quả và EmptyNotice khi rỗng. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\global-search-modal-spacing-listbox-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | Workflow, preview, `GlobalSearchOverlay`, `GlobalSearchResults`, contracts và focused tests. |

Preview URL: `http://127.0.0.1:8087/`

Preview SHA-256: `BFD0105E63785CA9C53429EFF696D2604349B86F4F8C7F7866ECB723AE2A74C9`

### OUTPUTS

| Concept | Result |
|---|---|
| Three-region ownership | Trái giữ SelectionList scopes; giữa dùng nested SurfaceListCard không label hoặc thay bằng EmptyNotice; phải render selected detail. |
| Nested surface paint | `isNested: true` đổi joined result surface sang một token border và bỏ shadow. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/blocks/search/GlobalSearchResults/component.tsx` | `added` — owner mỏng chọn SurfaceListCard/EmptyNotice và tái dụng SelectionList. |
| `src/components/blocks/search/GlobalSearchResults/component.test.tsx` | `added` — chứng minh nested border mode, hidden label và empty replacement. |
| `src/components/overlays/search/GlobalSearchOverlay/component.tsx` | `modified` — giao cột giữa cho block thay vì tự ráp list/empty. |
| `src/components/overlays/search/GlobalSearchOverlay/component.test.tsx` | `modified` — khóa SurfaceListCard nested trong populated state. |
| `src/components/contracts/index.ts` | `modified` — thêm result-region và joined-list contract có identity ổn định. |
| `.workflows/.previews/fidel/starci-academy/global-search-modal-spacing-listbox-20260815-01/index.html` | `modified` — preview thể hiện nested border/no-shadow và component ownership. |
| `.workflows/fidel/starci-academy/global-search-modal-spacing-listbox-20260815-01.md` | `modified` — ghi feedback và proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Chỉ dẫn SurfaceListCard của người dùng đã khóa owner cột giữa. |

### WARNINGS

| Warning | Impact |
|---|---|
| Full typecheck vẫn cascade từ concurrent `src/components/contracts/index.ts:2166` với `flex-nowrap` và `[&>*]:whitespace-nowrap`. | Focused tests/lint xanh nhưng repository-wide typecheck chưa thể chứng minh cho tới khi owner khác sửa hai class. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Direct SelectionList/Tree region không có joined surface ở cột giữa | Label-less `SurfaceListCard` với `isNested: true` | User: “trò render SurfaceListCard ở giữa chứ”. |
| Hiểu mọi surface-in-surface là shadow/elevation cạnh tranh | Nested mode giữ boundary bằng border và bỏ shadow | User chỉ rõ nested surface là trường hợp border và yêu cầu family-wide `isNested`. |

### OWED

| Owed | Cleared by |
|---|---|
| Live browser proof sau SurfaceListCard correction | Reload route thật, kiểm `data-surface-context=nested`, populated/empty và screenshot. |
| Family-wide `isNested` API/canon | Upgrade Plan → Review → Apply riêng. |
| User acceptance | Người dùng xác nhận preview đạt. |

## feedback

Session id: `global-search-modal-spacing-listbox-20260815-01`

Session status: open

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
| Repo / branch | FE `main` at baseline HEAD `cd7f7ae66de937dd19065af3e1c84c8d866e86c4` plus preserved current worktree; BE `mtp` |
| Purpose | Sửa scope trái theo QuickActions, bỏ tick và chỉ render panel phải sau khi API detail của result được gọi. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\global-search-modal-spacing-listbox-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | Workflow, preview, `SelectionList`, `GlobalSearchResults`, `GlobalSearchOverlay`, detail query/hook, messages, hook export và focused tests. |

Binding evidence: user instruction and QuickActions render supplied in `codex-clipboard-da17b4bb-0001-49ff-9b2d-b8acbce3302a.png`.

Live schema evidence: unfiltered query introspection at `http://localhost:3001/graphql` exposes all eight canonical roots: `course`, `module`, `content`, `challenge`, `flashcardDeck`, `milestone`, `task`, `foundation`.

Preview URL: `http://127.0.0.1:8087/`

Preview SHA-256: `0747D61D43B1ABF726ED545E569609BA7E40F7CBE08CC9C4917DC0BC43B479EB`

### OUTPUTS

| Concept | Result |
|---|---|
| Scope selection | Scope active dùng `bg-accent text-accent-foreground`; scope không render `ListBox.ItemIndicator`; result vẫn giữ indicator riêng. |
| Result ownership | Cột giữa vẫn là label-less nested `SurfaceListCard`; click row chọn identity thay vì dùng autocomplete snippet làm detail. |
| Detail request | Một FE adapter dispatch đúng canonical detail root theo đủ tám bucket; course dùng `displayId`, các bucket còn lại dùng primary `id`, riêng flashcard dùng `flashcardDeckId`. |
| Detail states | Panel phải là discriminated state `idle`, `pending`, `error`, `ready`; chỉ `ready` render title/description từ API detail. |
| Interaction proof | Preview chứng minh chưa click thì không có detail, click hiện loading, sau response hiện nội dung detail và CTA. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/leaves/SelectionList/index.tsx` | `modified` — scope active accent/foreground và bỏ indicator; result giữ indicator. |
| `src/components/leaves/SelectionList/index.test.tsx` | `modified` — khóa scope không tick và selected accent class. |
| `src/components/overlays/search/GlobalSearchOverlay/index.tsx` | `modified` — bỏ auto-select, chọn result mới kích hoạt detail hook, map pending/error/ready và retry đúng request. |
| `src/components/overlays/search/GlobalSearchOverlay/component.tsx` | `modified` — panel phải render detail state, không đọc snippet autocomplete làm detail. |
| `src/components/overlays/search/GlobalSearchOverlay/component.test.tsx` | `modified` — chứng minh detail loading/error/ready và CTA canonical. |
| `src/components/overlays/search/GlobalSearchOverlay/index.test.tsx` | `modified` — chứng minh detail hook chưa gọi trước selection và nhận đúng bucket/id/displayId sau click. |
| `src/modules/api/graphql/queries/query-global-search-detail.ts` | `added` — adapter mỏng cho tám canonical detail operations. |
| `src/modules/api/graphql/queries/query-global-search-detail.test.ts` | `added` — khóa root, variables, auth client và normalization cho tám bucket. |
| `src/hooks/swr/useQueryGlobalSearchDetailSwr.ts` | `added` — conditional SWR owner theo selected identity. |
| `src/hooks/swr/useQueryGlobalSearchDetailSwr.test.ts` | `added` — khóa no-selection/no-request và selected request. |
| `src/hooks/index.ts` | `modified` — export detail hook. |
| `src/messages/vi.json` | `modified` — copy loading/error detail tiếng Việt. |
| `src/messages/en.json` | `modified` — copy loading/error detail tiếng Anh. |
| `.workflows/.previews/fidel/starci-academy/global-search-modal-spacing-listbox-20260815-01/index.html` | `modified` — active scope không tick và mô phỏng click → loading → detail. |
| `.workflows/fidel/starci-academy/global-search-modal-spacing-listbox-20260815-01.md` | `modified` — ghi feedback, evidence và proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Feedback đã đủ rõ để sửa trong fidelity boundary hiện tại. |

### WARNINGS

| Warning | Impact |
|---|---|
| Live UI proof tại `http://localhost:3000/vi` bị auth middleware chuyển sang `/vi/authentication`. | Chưa chứng minh được request detail bằng browser production; không tự truyền credential nhạy cảm để vượt auth. |
| Full typecheck vẫn cascade từ concurrent `src/components/contracts/index.ts` với unsupported `flex-nowrap` và `[&>*]:whitespace-nowrap`. | Focused tests/lint xanh; lỗi filtered Global Search chỉ là cùng `ChildrenOf<...> = never` cascade, không có lỗi riêng ở query/hook/state mới. |
| Detail APIs có auth/entitlement khác nhau theo business hiện hữu. | Challenge/content/flashcard/milestone/task có thể trả error cho guest hoặc learner chưa enroll; panel error + retry phản ánh đúng transport thay vì dùng snippet giả detail. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Scope active có dấu tick | QuickActions-style accent row, không indicator | User: “không có dấu tick”. |
| Scope row chrome tự chế | Dùng chính HeroUI `SelectionList` với selected-state token | User yêu cầu bên trái “như truy cập nhanh” và tận dụng component có sẵn. |
| Panel phải lấy title/snippet ngay từ autocomplete | Click gọi canonical detail API; panel render loading/error/ready từ detail response | User: “click vào thì call api details rồi render sang bên phải”. |
| Tạo thêm backend `globalSearchDetail` | Dispatch tám detail roots đã có qua FE adapter | Live schema đã có đầy đủ operation; thêm endpoint sẽ trùng business contract. |

### OWED

| Owed | Cleared by |
|---|---|
| Focused unit proof | Cleared: 6 files, 22 tests passed. |
| Focused lint | Cleared: zero errors trên bounded source/tests; chỉ còn warning React version của repo config. |
| Preview interaction proof | Cleared: idle-with-results → pending → ready đã kiểm bằng browser tại `http://127.0.0.1:8087/`. |
| Production authenticated browser proof | Đăng nhập sẵn trong local app rồi reload Global Search, click ít nhất một public/course result và một gated result, xác nhận ready/error đúng API. |
| Repository-wide typecheck | Sửa concurrent contract registry classes rồi chạy lại `npx tsc --noEmit --pretty false`. |
| User acceptance | Người dùng xác nhận correction đạt; session vẫn open cho tới Fidelity Finality. |

## feedback

Session id: `global-search-modal-spacing-listbox-20260815-01`

Session status: open

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
| Repo / branch | FE `main` at baseline HEAD `cd7f7ae66de937dd19065af3e1c84c8d866e86c4` plus preserved current worktree; BE `mtp` |
| Purpose | Khôi phục detail panel bên phải khi click và bỏ brief/snippet khỏi list giữa. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\global-search-modal-spacing-listbox-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | Workflow, preview, `SelectionList`, `GlobalSearchResults`, `GlobalSearchOverlay` và focused tests. |

Preview SHA-256: `654E99CED4261213EBFB66954B8BF68721A097E41E65DB746A6FF43B4BD97B5D`

### OUTPUTS

| Concept | Result |
|---|---|
| Middle list density | Result row chỉ còn title và kind/status; không render autocomplete brief/snippet. |
| Click semantics | HeroUI result `onAction` được chuyển thành detail selection; không điều hướng khỏi modal. |
| Right detail | Sau click, panel phải xuất hiện ở loading rồi ready/error; CTA bên phải mới là action mở canonical route. |
| Browser proof | Năm preview rows không chứa brief; trước click detail hidden, sau click loading visible, sau response description detail visible. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/leaves/SelectionList/index.tsx` | `modified` — result action gọi `select`; scope activation giữ riêng; result không gọi navigation action. |
| `src/components/leaves/SelectionList/index.test.tsx` | `modified` — khóa result click select-only và scope keyboard activation. |
| `src/components/blocks/search/GlobalSearchResults/component.tsx` | `modified` — block không còn nhận hoặc forward row activation. |
| `src/components/blocks/search/GlobalSearchResults/component.test.tsx` | `modified` — chứng minh click nested row báo selected identity. |
| `src/components/overlays/search/GlobalSearchOverlay/component.tsx` | `modified` — bỏ `description: result.snippet` khỏi middle rows. |
| `src/components/overlays/search/GlobalSearchOverlay/component.test.tsx` | `modified` — khóa snippet không xuất hiện trong result list ở loading/ready. |
| `.workflows/.previews/fidel/starci-academy/global-search-modal-spacing-listbox-20260815-01/index.html` | `modified` — middle list không brief và click vẫn mô phỏng detail states. |
| `.workflows/fidel/starci-academy/global-search-modal-spacing-listbox-20260815-01.md` | `modified` — ghi correction và proof mới. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã nêu rõ list không brief nhưng panel phải có detail. |

### WARNINGS

| Warning | Impact |
|---|---|
| Production browser vẫn cần authenticated local session để chứng minh transport thật. | Preview và unit proof đã pass, nhưng live API click proof còn owed. |
| Repository-wide typecheck vẫn bị concurrent contract-registry cascade. | Không thay đổi kết luận focused proof. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Ẩn detail cho tới khi một selection event ngầm xảy ra nhưng row click không tạo selection trong nested surface | Result `onAction` gọi `select` trực tiếp | User: “sao mất cái trang details rồi?”. |
| Render autocomplete brief trong middle list | Middle chỉ title + kind/status; detail description nằm ở panel phải | User: “không render briefs ở list nhưng ở bên phải phải có details”. |
| Click row mở route ngay | Click fetch/render detail; CTA phải mở route | Nếu điều hướng ngay thì người dùng không thể đọc detail panel. |

### OWED

| Owed | Cleared by |
|---|---|
| Focused tests | Cleared: 6 files, 24 tests passed. |
| Preview click proof | Cleared: rows compact, detail hidden-before-click, loading-after-click, ready-after-response. |
| Production authenticated proof | Đăng nhập local rồi click result trong Global Search và kiểm GraphQL detail request + right panel. |
| User acceptance | Người dùng xác nhận render đạt. |

## feedback

Session id: `global-search-modal-spacing-listbox-20260815-01`

Session status: open

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
| Repo / branch | FE `main` at baseline HEAD `cd7f7ae66de937dd19065af3e1c84c8d866e86c4` plus preserved current worktree; BE `mtp` |
| Purpose | Đồng bộ scope list bên trái theo anatomy Truy cập nhanh với icon và semantic active token. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\global-search-modal-spacing-listbox-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | Workflow, preview, `SelectionList`, `GlobalSearchOverlay` owner/view và focused tests. |

User feedback: “bên trái render cái list ntn, với text-accent-soft và bg-accent-soft-foreground khi click vào dc không?”

Token evidence: `globals.css` ghi HeroUI derive `--accent-soft` và `--accent-soft-foreground`; các canonical selected owners (`TextLink`, `IconTile`, `NavLink`, `ContentMapRow`) đều dùng `bg-accent-soft text-accent-soft-foreground`. Cặp user nêu bị đảo vai trò nền/chữ nên correction dùng semantic pair canonical.

Preview SHA-256: `12E419C07EED56B7E5A7BB04BE4EA642469E5FCAC9246595935EF370E3D8AE63`

### OUTPUTS

| Concept | Result |
|---|---|
| Scope-list anatomy | Sáu scope dùng đúng nhịp Quick Actions: leading icon, label, count và rounded active pill; không có tick. |
| Active semantics | Selected row dùng `bg-accent-soft text-accent-soft-foreground`, không đảo token nền và foreground. |
| Browser proof | Click “Khóa học” đổi active row; computed background `rgb(255, 240, 247)`, foreground `rgb(180, 45, 112)`, 6/6 icon hiện diện và 0 tick. |
| Focused proof | 3 test files, 11 tests pass; focused ESLint pass, chỉ còn warning React version từ repo config. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/leaves/SelectionList/index.tsx` | `modified` — thêm optional closed `icon` slot cho scope row, reuse `Icon`, đổi gap theo Quick Actions và active sang canonical soft pair. |
| `src/components/leaves/SelectionList/index.test.tsx` | `modified` — khóa icon, absence of scope indicator và exact active token classes. |
| `src/components/overlays/search/GlobalSearchOverlay/index.tsx` | `modified` — map sáu search scopes sang sáu semantic `IconName` đã có. |
| `src/components/overlays/search/GlobalSearchOverlay/component.tsx` | `modified` — pure scope view nhận/forward icon vào `SelectionList`. |
| `src/components/overlays/search/GlobalSearchOverlay/component.test.tsx` | `modified` — fixture scope mang closed icon identity. |
| `.workflows/.previews/fidel/starci-academy/global-search-modal-spacing-listbox-20260815-01/index.html` | `modified` — render scope icons và soft selected state để kiểm trước. |
| `.workflows/fidel/starci-academy/global-search-modal-spacing-listbox-20260815-01.md` | `modified` — append feedback và proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Đây là correction within-boundary theo reference người dùng cung cấp. |

### WARNINGS

| Warning | Impact |
|---|---|
| Production authenticated proof vẫn bị chặn bởi local sign-in state. | Preview + component proof pass; request/response thật trong modal production vẫn còn owed từ feedback trước. |
| Repository-wide typecheck vẫn đỏ bởi concurrent contract-registry cascade ngoài boundary. | Không thay đổi focused test/lint result của correction này. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `text-accent-soft bg-accent-soft-foreground` | `bg-accent-soft text-accent-soft-foreground` | Token source và các selected owners hiện hữu chứng minh cặp user nêu đảo background/foreground. |
| Scope list chỉ có chữ và count | Thêm leading icon từ closed `IconName` registry | User yêu cầu render bên trái giống list Truy cập nhanh. |

### OWED

| Owed | Cleared by |
|---|---|
| Focused tests và lint | Cleared: 3 files, 11 tests pass; ESLint zero errors. |
| Preview visual/interaction proof | Cleared: six icons, selected soft pair, click changes active, no tick. |
| Production authenticated proof | Đăng nhập local rồi kiểm scope row thật và detail request trong Global Search. |
| User acceptance | Người dùng xác nhận list trái đạt. |

## feedback

Session id: `global-search-modal-spacing-listbox-20260815-01`

Session status: open

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
| Repo / branch | FE `main` at baseline HEAD `cd7f7ae66de937dd19065af3e1c84c8d866e86c4` plus preserved current worktree; BE `mtp` |
| Purpose | Biến scope count thành text metadata thuần và cho nó nhận accent-soft khi row hover. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\global-search-modal-spacing-listbox-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | Workflow, preview, `SelectionList` và focused test. |

User feedback: “cái số 0 bển render text only text-xs text-muted, khi hover vào thành text-accent-soft thôi, không cần bọc hình tròn”.

Preview SHA-256: `4BBDA256E5A201AB331DB36DD1484EEC26A15E3644D23B78BD261187AD7EFCCD`

### OUTPUTS

| Concept | Result |
|---|---|
| Scope count anatomy | Count là text metadata thuần `text-xs text-muted`; không còn badge background, radius hay padding. |
| Row hover ownership | Scope row là `group`; count dùng `group-hover:text-accent-soft`, không tự tạo hover surface. |
| Result metadata | Kind/status badge ở middle result list vẫn giữ badge anatomy; correction chỉ áp dụng scope count. |
| Proof | 2 test files, 7 tests pass; focused ESLint pass. Preview computed style: transparent background, 0px radius, 0px padding, 12px font. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/leaves/SelectionList/index.tsx` | `modified` — scope row thêm `group`; scope count dùng text-only classes; result badge giữ chrome riêng. |
| `src/components/leaves/SelectionList/index.test.tsx` | `modified` — khóa exact count classes và absence của `rounded`/`bg-*`. |
| `.workflows/.previews/fidel/starci-academy/global-search-modal-spacing-listbox-20260815-01/index.html` | `modified` — bỏ circle count và mô phỏng row-hover text token. |
| `.workflows/fidel/starci-academy/global-search-modal-spacing-listbox-20260815-01.md` | `modified` — append feedback và proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã khóa exact count anatomy và hover token. |

### WARNINGS

| Warning | Impact |
|---|---|
| Browser surface hiện tại không expose hover action. | Static visual/computed style đã pass; hover được chứng minh bằng exact class assertion thay cho browser interaction capture. |
| Production authenticated proof vẫn chưa có. | Không ảnh hưởng component/preview correction; live modal proof vẫn owed. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Scope count bọc `rounded-full bg-default px-2 py-1` | `text-xs text-muted group-hover:text-accent-soft` | User: “không cần bọc hình tròn số 0 làm gì, đấy là rules của row rồi”. |

### OWED

| Owed | Cleared by |
|---|---|
| Focused tests/lint | Cleared: 2 files, 7 tests pass; ESLint zero errors. |
| Static visual proof | Cleared: transparent background, no radius/padding, 12px muted count. |
| Hover browser interaction capture | Browser surface hỗ trợ hover hoặc authenticated production manual inspection; exact class proof hiện đã pass. |
| User acceptance | Người dùng xác nhận count row đạt. |

## end

Session id: `global-search-modal-spacing-listbox-20260815-01`

Session status: open

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
| Repo / branch | FE `main`, baseline `16f172e`; BE `mtp`; trust `main`, baseline `12b43a2` |
| Purpose | Rerun frozen Global Search proof, map toàn bộ feedback và scan related bugs trước Finality. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\global-search-modal-spacing-listbox-20260815-01.md |
| Language | vi |
| Phase | end |
| Touching | Existing Global Search fidelity boundary plus approved generic row consolidation; End chỉ ghi evidence. |

### FEEDBACK SUMMARY

| Feedback | Correction | Proof |
|---|---|---|
| Modal padding bị lặp | Shell/overlay giữ một padding owner. | Existing focused modal tests và preview. |
| Trái/middle phải dùng list contracts | Scope dùng SelectionList; middle dùng nested SurfaceListCard/SelectionList; empty thay whole middle. | Preview empty/results + component tests. |
| Click result phải gọi detail và render phải | Selection chọn identity; detail hook/API owner render pending/error/ready; CTA mới điều hướng. | Preview click → detail; GlobalSearch focused tests. |
| Scope như Quick Actions, không tick | Shared compact visual row trong hai ListBox host riêng. | `IconLabelFactRow` tests + no indicator assertion. |
| Count text-only, xs muted, hover accent | Optional `endText` fact qua compact recipe; no badge chrome. | Computed preview không circle; exact Text parent-emphasis assertion. |
| Chuỗi ngày học cũng phải reuse | Generalize proven `StatRow` thành `IconLabelFactRow`; migrate toàn bộ standing facts/profile/price. | Import graph + peer/label-led tests. |
| Tự giác tìm/alter contract generic | Trust rule `REFERENCE OWNER CLOSURE` + twin regression. | Focused trust test 1/1 pass. |

### RELATED BUGS

| Finding | Evidence | Classification | Route |
|---|---|---|---|
| Không còn production `QuickActionRow`/`StatRow` import hoặc cùng cơ chế hover-count inline trong touched owners. | `rg` chỉ còn generic owner/callers; các `StatRow` tên còn lại là domain block names hoặc negative test prose. | not-a-bug | None |
| `stacked-stat-rows` contract vẫn giữ tên theo purpose standing-stat nhưng child owner đã generic. | Contract chỉ dùng để stack standing figures; không được dùng làm visual row owner cho ListBox. | not-a-bug | None |

### PROOF

| Gate | Result |
|---|---|
| Focused tests | PASS — 9 files, 23 tests. |
| Focused ESLint | PASS — 0 errors. |
| Preview render | PASS — empty/result states; 6 scopes; 0 circular counts; click result renders right detail from detail-state copy. |
| Production compile | PASS — Next compile + post-compile hook. |
| TypeScript/build completion | BASELINE RED — `plugins/type-tests/surface-list.tsx` begins `ChildrenOf = never` cascade from contract-registry baseline. |
| Production authenticated render | BLOCKED — canonical origin redirects to authentication. |

### OUTPUTS

| Concept | Result |
|---|---|
| End pass | Mọi feedback đã có correction/proof hoặc explicit owed route; không có related same-boundary bug mới. |
| Acceptance | User đã yêu cầu “xong cái này tiến hành end và finality” rồi “tiếp tục”; coi là acceptance để đóng correction, không coi là proof thay thế. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/{contracts,composites,leaves,blocks,overlays}/**` within recorded Global Search + generic-row boundary | `modified/renamed/deleted` — final correction tree đã ghi ở feedback và consolidation Apply. |
| `.claude/skills/starci-fe-fidelity-start/SKILL.md`, `.claude/sources/skills.test.mjs` | `modified` — future reference-owner closure. |
| `.workflows/fidel/starci-academy/global-search-modal-spacing-listbox-20260815-01.md` | `modified` — End proof và related-bug scan. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã yêu cầu End + Finality. |

### WARNINGS

| Warning | Impact |
|---|---|
| Authenticated live render chưa capture. | Production visual proof phụ thuộc local sign-in state; preview/component evidence vẫn đầy đủ cho correction. |
| Repository contract typecheck baseline đang đỏ. | Build không thể hoàn tất TypeScript phase dù production compile pass. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Custom scope/list row và duplicate generic row | Reuse SelectionList/SurfaceListCard và alter proven StatRow owner | User yêu cầu tận dụng component/contract đã có. |
| Count badge circle | Text-only optional fact | User nói đây là rule của row, không cần chrome. |

### OWED

| Owed | Cleared by |
|---|---|
| Authenticated production screenshot | Sign in local tại `http://localhost:3000`, mở Global Search và capture empty/result/detail + dashboard standing rows. |
| Repository-wide typecheck/build | Repair approved contract-registry baseline then run `npm run typecheck && npm run build`. |

## finality

Session id: `global-search-modal-spacing-listbox-20260815-01`

Session status: finalized

Session finalized: `global-search-modal-spacing-listbox-20260815-01`

Final diff identity: FE `16f172e..worktree`; trust `12b43a2..worktree`; workflow Source `f4921f20..worktree`.

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
| Repo / branch | FE `main`; BE `mtp`; trust `main` |
| Purpose | Đóng session sau End evidence, giữ external/baseline proof debt thành explicit routes. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\global-search-modal-spacing-listbox-20260815-01.md |
| Language | vi |
| Phase | finality |
| Touching | Chỉ workflow record và final evidence; không production correction mới. |

### FINAL OUTCOMES

| Outcome | Classification | Evidence / route |
|---|---|---|
| Global Search structure, selection/detail behavior và row typography | accepted | User acceptance + focused tests/lint + preview state matrix. |
| Generic row consolidation including Chuỗi ngày học | accepted | Approved consolidation revision; 23 tests và import graph. |
| Reference-owner trust upgrade | accepted | Approved upgrade revision; focused twin regression pass. |
| Authenticated production capture | owed-external-state | Requires signed-in local browser; không mở lại correction trừ khi render lệch. |
| Repository-wide contract typecheck | owed-new-boundary | Route to owning contract/audit workflow; không thuộc fidelity correction boundary. |

Continuation rule: feedback mới phải mở Fidelity Start mới với `Continuation of: global-search-modal-spacing-listbox-20260815-01`.

### OUTPUTS

| Concept | Result |
|---|---|
| Finalized session | `global-search-modal-spacing-listbox-20260815-01` đóng với accepted product correction và hai explicit proof-debt routes. |
| Future ownership | Global Search scope/dashboard action/standing facts dùng `IconLabelFactRow`; Fidelity Start bắt buộc reference-owner closure. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/global-search-modal-spacing-listbox-20260815-01.md` | `modified` — Finality closure; không production write mới. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Không còn approval pending trong correction boundary. |

### WARNINGS

| Warning | Impact |
|---|---|
| Live authenticated proof và full typecheck chưa xanh. | Không được diễn giải Finality thành “toàn repo không còn lỗi”; exact debt vẫn ở OWED. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | Không có proposal mới ở Finality. |

### OWED

| Owed | Cleared by |
|---|---|
| Authenticated production capture | Signed-in local state + linked continuation only if discrepancy appears. |
| Contract registry/typecheck debt | Owning Plan/Review/Apply hoặc audit lane; then `npm run typecheck && npm run build`. |
