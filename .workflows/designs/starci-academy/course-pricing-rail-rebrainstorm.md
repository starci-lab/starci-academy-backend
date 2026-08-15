<!-- starci-workflow: v2 -->

# course-pricing-rail-rebrainstorm

## plan r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree |
| Purpose | Rebrainstorm pricing rail bên phải Course Detail bằng bốn quyết định bố cục khả thi trước khi chọn production direction. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-pricing-rail-rebrainstorm.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-pricing-rail-rebrainstorm.md và D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\course-pricing-rail-rebrainstorm\r1\index.html |

Database: PostgreSQL qua StarCi Academy GraphQL backend.

### BINDING EVIDENCE

| Evidence | Kết luận |
|---|---|
| Screenshot `codex-clipboard-4f4dbf49-58b9-4f6c-a807-e3ae338f5260.png` | Rail hiện tại đúng vị trí sticky nhưng hierarchy giữa cover, phase, giá và ba action còn thiếu chủ đích. |
| `CoursePricingRail/component.tsx` | Backend hiện đã phục vụ cover, payable/original price, discount, savings, scarcity, phase list, enrolment proof và ba action Enrol/Cart/Trial. |
| `course-pricing-rail` contract | Rail là một complementary sticky decision surface; không được nhân thêm shadow/radius owner. |
| Legacy feedback đã duyệt | Phải giữ đủ Enrol, Add/Remove Cart và Trial; cart action mới nhất là text-only. |
| Canon vendor/surface | HeroUI Card chỉ do `SurfaceCard` sở hữu; contract bên trong chỉ sắp xếp nội dung. |

### CONTRACT INVENTORY

| Owner / key | Verdict | Lý do |
|---|---|---|
| `CoursePricingRail` block | REUSE | Đã sở hữu toàn bộ commerce state và handlers cần cho bốn direction. |
| `SurfaceCard` + `course-pricing-rail` | REUSE | Một sticky card là đúng surface boundary; redesign không tạo card ngoài card. |
| `course-price-block` + `price-discount-line` | REUSE | Đã biểu diễn payable price, original price, discount, savings và scarcity. |
| `course-pricing-action-stack` | EXTEND candidate | Direction được chọn có thể đổi thứ tự/nhóm intent nhưng không đổi public actions. |
| `course-pricing-phase-grid` / `course-pricing-phase-card` | EXTEND candidate | Direction B cần list comparison; C/D cần disclosure. Chỉ Review mới freeze owner sau khi chọn direction. |
| New backend fields | REJECT | Không direction nào được hứa dữ liệu ngoài GraphQL hiện có. |

### DIRECTIONS

| Direction | Product decision | Reading order | Responsive behavior |
|---|---|---|---|
| `rail-a-decision-stack` | Một stack chuyển đổi trực tiếp, phase là bằng chứng hỗ trợ | phase badge → cover → price/scarcity → phase grid → Enrol → Cart → Trial | Cùng stack co xuống mobile; không đổi ownership. |
| `rail-b-phase-compare` | Phase là quyết định trung tâm | cover → joined phase comparison → active price → CTA | Phase rows giữ scan dọc ở narrow viewport. |
| `rail-c-progressive` | Giảm tải lần đọc đầu, phase ladder theo disclosure | current offer → price/scarcity → actions → disclosure | Rail ngắn nhất; disclosure mở tại chỗ. |
| `rail-d-buy-vs-try` | Tách intent mua và intent khám phá | purchase intent → trial intent → phase disclosure | Hai intent xếp dọc, không để ba nút đồng hạng. |

### PREVIEW TRACKING

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `course-pricing-rail-rebrainstorm-r1` | http://localhost:8084/ | D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\course-pricing-rail-rebrainstorm\r1\index.html | ccf103a05aec4898a56515205c47233bad055248eb2ecd9e783c9bad15a1d14f | đang chờ |

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\course-pricing-rail-rebrainstorm\r1`

Preview PID: `47156`

Preview port: `8084`

| Direction | Tab | Status |
|---|---|---|
| `rail-a-decision-stack` | `A · Decision stack` | đang chờ |
| `rail-b-phase-compare` | `B · Phase compare` | đang chờ |
| `rail-c-progressive` | `C · Progressive` | đang chờ |
| `rail-d-buy-vs-try` | `D · Buy vs try` | đang chờ |

### OUTPUTS

| Concept | Result |
|---|---|
| Pricing rail brief r1 | Bốn direction khác nhau về CTA priority, phase disclosure và composition; không khác nhau chỉ vì màu/spacing. |
| Data feasibility | Bốn direction dùng đúng dữ liệu và ba action backend/FE đã có. |
| Cart visual | Cart action text-only trong cả bốn direction, theo feedback fidelity mới nhất. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/course-pricing-rail-rebrainstorm.md` | added — evidence, inventory, directions và preview tracking. |
| `.workflows/.previews/designs/starci-academy/course-pricing-rail-rebrainstorm/r1/index.html` | added — một tabbed HTML preview với bốn direction và responsive state. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn direction cho Design Review | Mặc định đề xuất `D · Buy vs try` vì giải quyết trực tiếp việc ba action đang xếp chồng thiếu hierarchy; hoặc chọn A/B/C tại http://localhost:8084/. |

### WARNINGS

| Warning | Impact |
|---|---|
| Cover image trên live screenshot đang không tải | Preview dùng abstract cover để đánh giá layout; asset URL là fidelity/runtime concern riêng, không được che bằng concept. |
| Signed-in Cart/Trial mutation chưa được user chạy live | Directions chỉ thay composition, không thay handlers hoặc loading ownership đã có test. |
| FE worktree có nhiều concurrent changes | Plan không viết production JSX/CSS; Review phải freeze exact boundary sau khi user chọn. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Cart icon trong action | Text-only Cart action | User yêu cầu xóa icon cart. |
| Chỉ đổi màu/radius của card hiện tại | Bốn direction đổi reading order, CTA priority hoặc disclosure | Design Plan phải tạo lựa chọn sản phẩm thật. |
| Dữ liệu hoặc promise backend mới | Chỉ dùng pricing response hiện có | Preview phải implementation-feasible. |

### OWED

| Owed | Cleared by |
|---|---|
| User chọn một direction | Chọn tab A/B/C/D trên preview đang chạy. |
| Component/props delta chính xác | `starci-fe-design-review` sau khi direction được chọn. |
| Production implementation | Chỉ `starci-fe-design-apply` sau Approved Review revision. |

## plan r2

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree |
| Purpose | Ghi lựa chọn cuối cùng cho pricing rail và bàn giao direction D sang Design Review. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-pricing-rail-rebrainstorm.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-pricing-rail-rebrainstorm.md only. |

### PREVIEW TRACKING

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `course-pricing-rail-rebrainstorm-r1` | http://localhost:8084/ | D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\course-pricing-rail-rebrainstorm\r1\index.html | ccf103a05aec4898a56515205c47233bad055248eb2ecd9e783c9bad15a1d14f | `đã chốt` |

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\course-pricing-rail-rebrainstorm\r1`

Preview PID: `47156`

Preview port: `8084`

| Direction | Tab | Status |
|---|---|---|
| `rail-a-decision-stack` | `A · Decision stack` | `đã từ chối` |
| `rail-b-phase-compare` | `B · Phase compare` | `đã từ chối` |
| `rail-c-progressive` | `C · Progressive` | `đã từ chối` |
| `rail-d-buy-vs-try` | `D · Buy vs try` | `đã chọn` |

Selected direction: `rail-d-buy-vs-try`

Selection reason: Tách rõ intent mua và intent khám phá, giảm cảm giác ba nút secondary xếp chồng vô nghĩa.

### ACCEPTANCE STATES

| State | Expected behavior |
|---|---|
| Purchase intent | Phase hiện tại, scarcity, payable/original price, Enrol và text-only Add/Remove Cart nằm trong cùng purchase group. |
| Trial intent | Học thử là một exploration group riêng, không bị hiểu là lựa chọn thanh toán đồng hạng. |
| Phase detail | Ba phase vẫn truy cập được qua disclosure, không mất thông tin giá. |
| Desktop | Rail tiếp tục là một sticky complementary `SurfaceCard`; không tạo thêm outer card/shadow owner. |
| Narrow viewport | Purchase và trial intent xếp dọc trong cùng rail, không tràn ngang. |
| Runtime ownership | Giữ nguyên handlers, loading ownership và dữ liệu GraphQL hiện có cho Enrol, Cart và Trial. |

### OUTPUTS

| Concept | Result |
|---|---|
| Pricing rail direction | Đã chọn `D · Buy vs try`. |
| Product hierarchy | Mua/giữ trong giỏ thuộc purchase intent; học thử thuộc exploration intent độc lập. |
| Review handoff | Direction, lý do và sáu acceptance states đã đủ để Design Review phản biện source boundary. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/course-pricing-rail-rebrainstorm.md` | modified — ghi direction D được chọn, acceptance states và rejected directions. |
| Production source | None — Design Plan không sửa JSX/CSS. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã chốt direction D. |

### WARNINGS

| Warning | Impact |
|---|---|
| Component tree và prop delta chưa được freeze | Design Review phải đối chiếu source thật trước Apply. |
| Cover image live từng không tải | Asset runtime không được concept D che lấp; Review phải giữ concern này ngoài layout promise nếu chưa có binding fix. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `A · Decision stack` | `D · Buy vs try` | A vẫn để ba action trong một stack nên intent chưa tách đủ rõ. |
| `B · Phase compare` | `D · Buy vs try` | B ưu tiên phase comparison hơn vấn đề hierarchy giữa mua và khám phá. |
| `C · Progressive` | `D · Buy vs try` | C giảm density nhưng vẫn chưa diễn đạt hai intent thành hai nhóm rõ ràng. |

### OWED

| Owed | Cleared by |
|---|---|
| Exact `COMPONENT DELTA` và `PROPS DELTA` | `$starci-fe-design-review` đối chiếu route/page/block/composite/contract/call sites. |
| Production implementation | `$starci-fe-design-apply` sau một Approved Review revision. |

## review r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree |
| Purpose | Phản biện direction D và freeze exact component, prop, contract, message, test và render boundary trước Apply. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-pricing-rail-rebrainstorm.md |
| Language | vi |
| Phase | review |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-pricing-rail-rebrainstorm.md only; read-only evidence từ target FE. |

Revision identity: `course-pricing-rail-buy-vs-try-r1`

Approved revision: `course-pricing-rail-buy-vs-try-r1`

Approval evidence: User phê duyệt nguyên văn `PHÊ DUYỆT` trước Apply.

### REVIEW VERDICT

| Question | Verdict | Evidence |
|---|---|---|
| Một hay nhiều outer surfaces? | Một `SurfaceCard` duy nhất | `course-pricing-rail` hiện là complementary `aside`; SurfaceCard đang là sole radius/shadow owner. |
| Hai intent có phải card con? | Không | Intent là hai semantic groups trong cùng decision surface; nested border/radius/shadow sẽ hồi sinh group-card ownership đã bị bác. |
| Cart có icon không? | Không | Fidelity proof khóa Add/Remove Cart text-only với 0 descendant SVG. |
| Phase detail đặt ở đâu? | Sau purchase và exploration intent, trong native disclosure | Direction D giảm tải lần đọc đầu nhưng không được làm mất ba phase. |
| Có dùng `CurriculumModuleRow` làm phase disclosure không? | Không | Leaf đó sở hữu module title, tier và lesson list; dùng lại sẽ trộn domain và prop semantics. |
| Có cần backend field mới không? | Không | `pricingPhases`, `currentPhase`, prices và slot availability đã đủ; chỉ thêm localized intent copy. |
| Connected handlers có đổi không? | Không | Checkout, Add/Remove Cart và Trial đã có ownership + success gates độc lập. |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | `CourseDetailRoute` | REUSE | `src/app/[lang]/courses/[displayId]/page.tsx` | same | Next route `/[lang]/courses/[displayId]` → `CourseDetailPage` | route mount only | Route chỉ truyền `displayId`; không sở hữu rail composition. |
| layout | `CoursesLayout` | REUSE | `src/app/[lang]/courses/layout.tsx` | same | Courses route family | `nav-over-body-page`, `double-navbar`, `routed-page-main` | Navbar/main shell không đổi. |
| shell | `ShellNav` | REUSE | `src/components/layouts/ShellNav` | same | `CoursesLayout` | `double-navbar` projection | Design chỉ thay complementary pricing decision. |
| page | `CourseDetailPage` | MODIFY | `src/components/pages/CourseDetailPage/index.tsx` | same | `CourseDetailRoute` | produces `_CourseDetailPage.props.rail` | Thêm localized Buy-vs-Try intent copy; giữ nguyên queries, mutations và handlers. |
| page | pure `_CourseDetailPage` | REUSE | `src/components/pages/CourseDetailPage/component.tsx` | same | connected `CourseDetailPage`; pure tests | `course-detail-page` → `main-then-rail` | Page đã truyền nguyên `rail`, `railState` và ba actions; không được reach vào block để rearrange. |
| block | `CoursePricingRail` | MODIFY | `src/components/blocks/courses/CoursePricingRail/component.tsx` | same | `_CourseDetailPage` only | `course-pricing-rail` | Đổi internal tree của pure half `_CoursePricingRail` thành purchase intent → exploration intent → phase disclosure; outer surface và state ownership giữ nguyên. |
| block | `CourseMobileEnrollBar` | REUSE | `src/components/blocks/courses/CourseMobileEnrollBar/component.tsx` | same | `_CourseDetailPage.action` | `course-mobile-action-bar` | Narrow pinned bar vẫn chỉ price + primary CTA; không nhân đôi Cart/Trial. |
| branch | `SurfaceCard` | REUSE | `src/components/branches/SurfaceCard/index.tsx` | same | `CoursePricingRail` | `course-pricing-rail` projection | Tiếp tục sole HeroUI Card/radius/shadow owner. |
| branch | `Tree` | REUSE | `src/components/branches/Tree/index.tsx` | same | rail, disclosure support | all named contracts | Contract host hiện đủ; không thêm class/host escape. |
| leaf | `PricingPhaseDisclosure` | ADD | None | `src/components/leaves/PricingPhaseDisclosure/index.tsx` | `_CoursePricingRail` only | leaf name `pricing-phase-disclosure` | Native details element owns open/closed intrinsic behavior và resolved phase rows; không dùng sai curriculum leaf. |
| leaf | `Button` | REUSE | `src/components/leaves/Button/index.tsx` | same | purchase primary/cart, exploration trial | button slots | Primary giữ `primary`; Cart giữ text-only `secondary`; Trial đổi call-site variant thành `ghost`. |
| leaf | `Badge`, `CoverImage`, `Text` | REUSE | `src/components/leaves/{Badge,CoverImage,Text}` | same | `CoursePricingRail`, disclosure | existing leaf slots | Đủ để render phase, artwork, price/copy và proof; không tạo visual duplicate. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| `CourseDetailPage` | connected output API | KEEP | Produces `CourseDetailPageData` and actions | Same output shape with nested optional `rail.intent` data only | `CourseDetailRoute` → `_CourseDetailPage` | Connected tests prove intent copy while existing action tests remain unchanged. |
| `CoursePricingRail` | `CoursePricingRailProps` | KEEP | `state`, `props`, `on` | Same public prop lanes; only nested data contract expands | `_CourseDetailPage` only | Typecheck and focused rail tests prove no call-site API migration. |
| `CoursePricingRailData` | `intent` | ADD | absent | optional `CoursePricingRailIntentCopy` chứa `purchaseTitle`, `purchaseDescription`, `trialTitle`, `trialDescription`, `phaseDisclosureLabel` | producer: connected `CourseDetailPage`; consumer: `_CoursePricingRail` | Connected ready fixture cung cấp đủ 5 localized strings; optional giữ pending/fallback tree tương thích. |
| `CoursePricingRailIntentCopy` | type API | ADD | absent | one readonly resolved-copy object | `CoursePricingRailData.intent` only | TypeScript data fence chứng minh không chứa handlers hoặc fetched payload. |
| `CoursePricingRailData` | commerce fields | KEEP | `coverUrl`, `title`, prices, savings, scarcity, phases, labels, proof | unchanged | connected `CourseDetailPage`; block tests | Existing fixture and connected mapping remain source of truth. |
| `CoursePricingRailActions` | `act`, `trial`, `addToCart` | KEEP | three optional handlers | unchanged | `_CourseDetailPage` forwards connected page handlers | Connected tests keep guest/success/rejection/cart cache proofs. |
| `CoursePricingRailState` | state union | KEEP | `ready | price-pending | adding | trialing | checking-out` | unchanged | connected mutation ownership → rail | Existing pending-owner matrix remains exhaustive. |
| `PricingPhase` | phase data | KEEP | `id`, `name`, `value`, `isActive?` | unchanged | connected page maps backend phases; rail passes to disclosure | No backend or mapping migration. |
| `PricingPhaseDisclosure` | `props` | ADD | absent | `{ label: string; phases: readonly PricingPhase array; isOpen?: boolean }` | `_CoursePricingRail` only | New leaf test proves closed/open rendering, native disclosure semantics and all rows. |
| `CourseDetailPageProps` | `displayId` | KEEP | required string | unchanged | dynamic route only | Route source has one call site. |
| `CourseDetailPageData` | `rail` | KEEP | optional `CoursePricingRailData` | same symbol, expanded optional field | connected page → pure page | Pure page remains pass-through; TypeScript proves no call-site migration beyond fixtures opting into intent copy. |
| `course-pricing-rail` | slot API | RETYPE | `phase, cover, price, ladder, action, proof` | `phase, cover, purchase, exploration?, ladder?, proof?` | `CoursePricingRail` only | The typed `ChildrenOf` rail contract rejects old slots after migration. |
| `course-pricing-purchase-intent` | slot API | ADD | absent | `price, heading?, description?, primary, cart?` | `CoursePricingRail` only | Typed contract slots fix purchase hierarchy without nested card. |
| `course-pricing-exploration-intent` | slot API | ADD | absent | `heading, description?, action` | `CoursePricingRail` only | Typed contract slots keep Trial independent of checkout/cart. |
| `course-pricing-action-stack` | contract API | REMOVE | `primary, cart?, trial?` | absent | sole consumer `CoursePricingRail` migrates | `rg` must return zero references before key deletion. |
| `course-pricing-phase-grid` | contract API | REMOVE | repeated phase-card slots | absent | sole consumer `CoursePricingRail` migrates | `rg` must return zero references before key deletion. |
| `course-pricing-phase-card` | contract API | REMOVE | `name, value` | absent | only child of removed phase grid | `rg` must return zero references before key deletion. |
| `courses.detail` messages | intent keys | ADD | absent | five parity keys in `vi.json` and `en.json` | connected `CourseDetailPage` via `useTranslations("courses.detail")` | Locale parity test/typecheck and exact connected fixture values. |

### CONTRACT DELTA

| Key | Action | Final anatomy / classes | Constraint |
|---|---|---|---|
| `course-pricing-rail` | MODIFY | same `aside`, `flex flex-col gap-4 p-4`; slots become phase → cover → purchase → exploration? → ladder? → proof? | Một outer SurfaceCard; no nested surface. |
| `course-pricing-purchase-intent` | ADD | `flex flex-col gap-2`; price, optional `text-sm font-medium` heading, optional `text-sm` description, primary, optional cart; actions full width | Enrol primary, Cart secondary text-only. |
| `course-pricing-exploration-intent` | ADD | `flex flex-col gap-2`; `text-sm font-medium` heading, optional `text-sm` description, ghost Trial action; full width | Exploration không được nhìn như payment peer. |
| `course-pricing-action-stack` | REMOVE | None | Direction D bác sibling stack ba action. |
| `course-pricing-phase-grid` | REMOVE | None | Phase không còn là ba nested peer cards ở first read. |
| `course-pricing-phase-card` | REMOVE | None | Disclosure leaf owns intrinsic phase comparison. |

### SUPPORTING PRODUCTION BOUNDARY

| Path | Predicted action | Proof obligation |
|---|---|---|
| `src/components/contracts/index.ts` | MODIFY | New/changed keys typecheck; removed keys have zero consumers. |
| `src/components/blocks/courses/CoursePricingRail/component.tsx` | MODIFY | Exact D reading order, one surface, text-only Cart, independent pending buttons. |
| `src/components/blocks/courses/CoursePricingRail/component.test.tsx` | MODIFY | DOM order, intent groups, variants, disclosure, empty optional branches and pending matrix. |
| `src/components/leaves/PricingPhaseDisclosure/index.tsx` | ADD | Native details control, resolved rows, no domain fetch/translation. |
| `src/components/leaves/PricingPhaseDisclosure/index.test.tsx` | ADD | Closed/open and phase cardinality/accessibility proof. |
| `src/components/pages/CourseDetailPage/index.tsx` | MODIFY | Produces five localized intent strings only; mutations untouched. |
| `src/components/pages/CourseDetailPage/index.test.tsx` | MODIFY | Connected fixture captures intent copy while preserving six commerce action tests. |
| `src/messages/vi.json` | MODIFY | Vietnamese intent/disclosure copy. |
| `src/messages/en.json` | MODIFY | English parity for the same five keys. |

### OWNER STATES

| State | Required render |
|---|---|
| `ready`, paid/unowned | Purchase group with Enrol + Cart; exploration group with Trial; phase disclosure if phases exist. |
| `ready`, in cart | Cart label changes to Remove; no icon and no other hierarchy change. |
| `ready`, free or enrolled | Cart absent; enrolled also omits Trial; purchase intent remains authoritative. |
| `price-pending` | Only payable price rests; intent labels, scarcity and phase disclosure remain stable. |
| `checking-out` | Only Enrol button pending. |
| `adding` | Only Add/Remove Cart pending. |
| `trialing` | Only Trial pending. |
| no phases | Active badge and disclosure absent; list price/CTA remain. |
| narrow viewport | Rail stacks in `main-then-rail`; pinned mobile bar remains price + primary CTA only. |

### ACCEPTANCE EVIDENCE

| Evidence | Command / assertion |
|---|---|
| Focused component tests | `npx vitest run src/components/leaves/PricingPhaseDisclosure/index.test.tsx src/components/blocks/courses/CoursePricingRail/component.test.tsx src/components/pages/CourseDetailPage/component.test.tsx src/components/pages/CourseDetailPage/index.test.tsx` |
| Focused lint | `npx eslint` on the five modified/added TSX test/source files. |
| Type gate | `npx tsc --noEmit --pretty false` |
| Contract cleanup | `rg "course-pricing-action-stack|course-pricing-phase-grid|course-pricing-phase-card" src` returns zero matches after migration. |
| Desktop localhost | One `SurfaceCardSurface`; order purchase → exploration → phase disclosure; Cart has 0 SVG. |
| Disclosure interaction | Click summary on `localhost:3000/vi/courses/fullstack-mastery`; all phase rows appear without URL reload. |
| Narrow localhost | 390px viewport has no horizontal overflow; rail groups stack; mobile action bar remains single primary action. |

### OUTPUTS

| Concept | Result |
|---|---|
| Review revision | `course-pricing-rail-buy-vs-try-r1` freezes direction D as one surface with two semantic intent groups and one phase disclosure. |
| Ownership | Business API remains in connected Course Detail; composition remains in `CoursePricingRail`; intrinsic disclosure receives one new leaf owner. |
| Visual rule | Không tạo card con; không thêm radius/shadow; Cart text-only; Trial ghost. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/course-pricing-rail-rebrainstorm.md` | modified — appended Review r1, component/props/contract deltas, states and proof boundary. |
| Production source | None — Review is read-only. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Phê duyệt Review revision để Apply? | Khuyến nghị phê duyệt `course-pricing-rail-buy-vs-try-r1`: một SurfaceCard, hai intent group không có card con, native phase disclosure, Cart text-only, Trial ghost. Nếu cần đổi hierarchy/copy/variant, feedback trước khi approve. |

### WARNINGS

| Warning | Impact |
|---|---|
| Preview D đã vẽ border/radius quanh intent groups | Review thay bằng semantic groups không surface để tuân feedback “bỏ group card”; product decision D vẫn giữ nguyên. |
| `PricingPhaseDisclosure` là leaf mới | Apply phải chứng minh intrinsic behavior/accessibility; nếu cần generic slot container thì phải quay lại Review, không tự phát minh branch. |
| Cover URL runtime từng hỏng | Không thuộc redesign boundary; Apply không được che bằng placeholder mới ngoài hành vi `CoverImage` hiện có. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Hai nested intent cards như preview HTML | Hai named semantic groups trong cùng SurfaceCard | Group card/radius owner đã bị feedback trước bác; intent separation đến từ hierarchy, không từ card lồng card. |
| Tái dụng `CurriculumModuleRow` cho phase | Add `PricingPhaseDisclosure` intrinsic leaf | Curriculum props và lesson semantics không đại diện price phases. |
| Giữ ba CTA trong `course-pricing-action-stack` | Purchase group + exploration group | User chọn D để bỏ cảm giác ba secondary actions xếp chồng vô nghĩa. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit Review approval | User phê duyệt exact revision `course-pricing-rail-buy-vs-try-r1`. |
| Baseline commit và implementation | `$starci-fe-design-apply` sau approval. |

## apply r1

Applied revision: `course-pricing-rail-buy-vs-try-r1`

Baseline commit: `bdc816b`

Tracked diff: `bdc816b..worktree`

Apply status: `open — implementation complete, repository-wide proof blocked outside approved boundary`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe / main @ bdc816b..worktree |
| Purpose | Áp dụng Buy vs Try trực tiếp vào pricing rail và chứng minh source, runtime cùng cross-repository gates. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-pricing-rail-rebrainstorm.md |
| Language | vi |
| Phase | apply |
| Touching | Workflow; `src/components/contracts/index.ts`; `src/components/blocks/courses/CoursePricingRail/component.tsx`; `src/components/blocks/courses/CoursePricingRail/component.test.tsx`; `src/components/leaves/PricingPhaseDisclosure/index.tsx`; `src/components/leaves/PricingPhaseDisclosure/index.test.tsx`; `src/components/pages/CourseDetailPage/index.tsx`; `src/components/pages/CourseDetailPage/index.test.tsx`; `src/messages/vi.json`; `src/messages/en.json`. |

### IMPLEMENTATION PROOF

| Proof | Result |
|---|---|
| Baseline | `bdc816b` captures current FE source/config before this design; `.artifacts` excluded. |
| Boundary | `git diff bdc816b --name-status` contains exactly nine approved production paths. |
| Focused tests | 4 files, 21 tests passed. |
| Typecheck | `npx tsc --noEmit --pretty false` passed. |
| Focused lint | Six changed/added TSX files passed. |
| Source lint | `npx eslint src` passed. |
| Build | `npm run build` passed. |
| Removed contracts | `rg "course-pricing-action-stack|course-pricing-phase-grid|course-pricing-phase-card" src` returned zero matches. |
| Diff check | `git diff --cached --check` passed. |

### COMPONENT DELTA RECONCILIATION

| Approved row | Diff proof |
|---|---|
| connected `CourseDetailPage` MODIFY | Produces only five localized intent strings; handlers and queries unchanged. |
| pure `_CourseDetailPage` REUSE | No baseline diff. |
| `CoursePricingRail` MODIFY | One purchase group, one exploration group and one disclosure in the existing SurfaceCard. |
| `PricingPhaseDisclosure` ADD | Native details/summary leaf plus focused tests added. |
| `SurfaceCard`, `Tree`, `Button`, `Badge`, `CoverImage`, `Text` REUSE | No owner implementation changed; rail changes only their approved call sites. |
| Route, layout, shell, mobile bar REUSE | No baseline diff. |

### PROPS DELTA RECONCILIATION

| Approved API | Diff proof |
|---|---|
| `CoursePricingRailData.intent` ADD | Optional resolved copy object with exactly five fields. |
| Commerce fields/actions/state/phase KEEP | Existing fields, handlers and union remain unchanged. |
| `PricingPhaseDisclosure` props ADD | Label, structural phase list and optional initial open state; no fetch/translation. |
| Rail contract RETYPE | Final slots are phase, cover, purchase, exploration, ladder and proof. |
| Intent contracts ADD | Purchase and exploration own the exact approved slots and no nested surface. |
| Old action/phase contracts REMOVE | Zero references remain. |
| Message keys ADD | Five keys added with Vietnamese/English parity. |

### CROSS-REPOSITORY LINT PROOF

| Repository | Working directory | Command | Exit code | Verdict |
|---|---|---|---|---|
| Frontend | D:\Repositories\starci-academy-fe | `npm run lint` | 1 | failed — errors are in pre-existing `.artifacts/design-plan/**`; `npx eslint src` separately passes. |
| Backend | D:\Repositories\starci-academy-backend | `npm run lint:check` | 1 | failed — 176 pre-existing errors in course-review/CV/other session files; backend was not changed by this revision. |

### LIVE FLOW PROOF

| Flow | Persona | Steps | UI | Network | Console | Terminal | Verdict | Evidence |
|---|---|---|---|---|---|---|---|---|
| Desktop Buy vs Try render | public guest | Open `/vi/courses/fullstack-mastery`, wait for runtime data, inspect rail, open phase disclosure | passed — one rail SurfaceCard; order purchase → exploration → disclosure; Cart 0 SVG; Trial ghost; 3 phase rows | passed by resolved live GraphQL-backed course data; status instrumentation unavailable in selected browser | failed — five pre-existing `PressResponder was rendered without a pressable child` warnings remain unexplained | blocked — no app terminal attached to this thread | blocked | Browser DOM proof at localhost:3000, 2026-08-15 15:09–15:12 Asia/Bangkok. |
| Narrow 390px layout | public guest | Set viewport 390×844 and inspect document/rail/mobile bar | failed — rail stacks and mobile bar has one primary action, but document scroll width is 582 for client width 375 | same loaded fixture | same warnings | blocked | failed | Overflow owners are four course section tabs under the reused sticky section nav; rail has zero nested surfaces and is not the overflowing node. |

### OUTPUTS

| Concept | Result |
|---|---|
| Buy vs Try rail | Implemented as one SurfaceCard with clearly separated purchase and exploration intent. |
| Phase comparison | Moved behind one native disclosure that reveals all resolved phases. |
| Commerce ownership | Checkout, Cart and Trial handlers/loading ownership remain unchanged; Cart stays text-only and Trial is ghost. |
| Apply closure | Held open because mandatory repository-wide lint and narrow/live-flow gates are not all green. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/contracts/index.ts` | modified — retyped rail, added purchase/exploration intent contracts, removed action stack and phase card/grid contracts. |
| `src/components/blocks/courses/CoursePricingRail/component.tsx` | modified — assembled Buy vs Try hierarchy and phase disclosure. |
| `src/components/blocks/courses/CoursePricingRail/component.test.tsx` | modified — proves hierarchy, variants, no Cart SVG, disclosure and pending ownership. |
| `src/components/leaves/PricingPhaseDisclosure/index.tsx` | added — native intrinsic disclosure. |
| `src/components/leaves/PricingPhaseDisclosure/index.test.tsx` | added — proves open/closed behavior and phase cardinality. |
| `src/components/pages/CourseDetailPage/index.tsx` | modified — produces five localized intent strings. |
| `src/components/pages/CourseDetailPage/index.test.tsx` | modified — proves connected copy while preserving commerce action tests. |
| `src/messages/vi.json` | modified — Vietnamese intent copy. |
| `src/messages/en.json` | modified — English intent copy parity. |
| `.workflows/designs/starci-academy/course-pricing-rail-rebrainstorm.md` | modified — approval, baseline, reconciliation and proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Có mở Design Review r2 để thêm owner `course-section-nav` vào boundary và xử lý mobile overflow không? | Khuyến nghị có: freeze đúng nav contract/overflow behavior rồi Apply tiếp; hoặc sửa acceptance state để thừa nhận horizontal tab scrolling nếu đó là chủ ý. |

### WARNINGS

| Warning | Impact |
|---|---|
| Repository-wide lint đang đỏ ngoài pricing rail | Apply không thể đóng dù focused/source gates của revision đều xanh. |
| Console có năm cảnh báo PressResponder | Live proof chưa sạch; chưa có bằng chứng chúng thuộc rail hay một owner khác. |
| Không có app terminal gắn với thread | Không thể kiểm tra đồng thời FE/BE terminal trong cửa sổ live flow. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Sửa lén section nav trong Apply | Giữ nguyên và trả finding về Review | `ShellNav`/section nav là REUSE owner; mở rộng contract delta cần phê duyệt mới. |
| Báo Apply sạch dựa chỉ trên focused gates | Giữ Apply mở và ghi blockers | Cross-repository lint và live-flow proof bắt buộc chưa xanh. |

### OWED

| Owed | Cleared by |
|---|---|
| Frontend repository lint | Loại/di chuyển disposable `.artifacts` khỏi lint scope bằng capability sở hữu artifact, rồi `npm run lint` exit 0. |
| Backend repository lint | Route sang `$starci-be-audit-plan` và hoàn tất audit lifecycle đến `npm run lint:check` exit 0. |
| Mobile horizontal overflow | Design Review r2 freeze owner/contract delta cho course section nav, sau đó Apply và prove viewport 390px. |
| Console PressResponder warnings | Bounded fidelity diagnosis xác định owner và đưa console về không còn warning không giải thích. |
| Terminal proof | Gắn observable FE/BE terminal hoặc khởi động declared stack với output trong thread rồi lặp live flow. |
