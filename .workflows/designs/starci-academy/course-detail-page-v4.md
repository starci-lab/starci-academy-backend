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
| Repo / branch | D:\Repositories\starci-academy-fe / main |
| Purpose | Chọn concept mới cho stats và pricing rail trên course detail, trong khi Tabs, SurfaceListCard và card sticky là invariant. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-detail-page-v4.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-detail-page-v4.md và D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\course-detail-page-v4\revision-1\index.html |

### Evidence

| Source | Binding result |
|---|---|
| Feedback ảnh có khoanh đỏ/cam/xanh dương/xanh lá | Đỏ phải là Tabs; cam phải giữ `SurfaceListCard`; xanh lá phải có card + sticky như legacy; xanh dương và xanh lá cần concept mới hút người dùng. |
| Legacy `starci-academy` @ `9a193423128efa1dc83f23ab0f79fb4ae66db847` | `CoursePricingRail` là HeroUI Card trong wrapper sticky; narrative vẫn ở cột chính. |
| FE hiện tại | `ChoiceTabs`, `SurfaceListCard`, `SurfaceCard`, `main-then-rail`, pricing phase ladder và toàn bộ data cần thiết đã tồn tại. |
| GraphQL course detail | Có title, description, cover, original price, pricing phases, enrollment count, modules, contents, hours, challenges, value propositions, prerequisites và reviews; preview không hứa data mới. |

### Invariants

| Decision | Classification | Reason |
|---|---|---|
| Tabs thay breadcrumb | REUSE `ChoiceTabs` hoặc tabs owner được Review chốt | User đã chốt concept; behavior anchor/panel còn phải Review khóa trước Apply. |
| Benefits/prerequisites | REUSE `SurfaceListCard` | Source đã có đúng branch; không tạo card/list wrapper tay. |
| Pricing rail | REUSE `SurfaceCard` + sticky mechanics | Legacy và feedback cùng binding; fidelity small patch đã khôi phục nền tảng này. |
| Stats composition | EXTEND/NEW theo direction được chọn | Badge run hiện tại không diễn đạt hierarchy mới. |
| Pricing composition | EXTEND current rail contract theo direction được chọn | Data tồn tại nhưng reading order và CTA emphasis khác nhau giữa các hướng. |

### Directions

| Direction | Product decision | Reading order / composition | Trade-off |
|---|---|---|---|
| `direction-evidence-ribbon` | A · Thanh bằng chứng | Tabs → heading → 5 metric cells → SurfaceListCard; rail card dùng phase list thẳng, sticky. | Gần legacy và dễ triển khai nhất; ít bất ngờ nhưng mức “wow” vừa phải. |
| `direction-decision-stair` | B · Bậc thang quyết định | Hero tối gom identity + proof mosaic; SurfaceListCard theo sau; rail card biến phase thành staircase và CTA giữ phase hiện tại. | Hút mắt và kể câu chuyện giá tốt; hero có trọng lượng thị giác lớn hơn. |
| `direction-conversion-signals` | C · Tín hiệu chuyển đổi | Heading + rating, signal board nhiều nhịp; SurfaceListCard; rail card nhấn scarcity và phase compact. | Mạnh nhất về conversion; cần Review kỹ để không biến evidence thành dashboard trang trí. |

### Responsive states

| State | Expected |
|---|---|
| Desktop ≥ 900px | Main + rail hai cột; pricing card sticky dưới navbar; Tabs và stats không tranh cùng một baseline. |
| Tablet/mobile < 900px | Một cột; rail trở về document flow; stats tự tái bố cục; Tabs cuộn ngang thay vì wrap. |
| Narrow mobile < 560px | Metric/grid về một cột; phase compact không tràn; CTA toàn chiều rộng. |

### Preview tracking

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `course-detail-page-v4-r1` | http://127.0.0.1:8096/ | D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\course-detail-page-v4\revision-1\index.html | `b8773ee8630ffe19743f37b0283582fe4da862577509ea72033a20881179f5bf` | đang chờ |

Preview root: D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\course-detail-page-v4\revision-1
Preview PID: 54784
Preview port: 8096

| Direction | Tab | Status |
|---|---|---|
| `direction-evidence-ribbon` | A · Thanh bằng chứng | đang chờ |
| `direction-decision-stair` | B · Bậc thang quyết định | đang chờ |
| `direction-conversion-signals` | C · Tín hiệu chuyển đổi | đang chờ |

### OUTPUTS

| Concept | Result |
|---|---|
| Course detail v4 | Ba concept khác nhau về reading order, stats hierarchy và pricing decision flow; không chỉ đổi màu/spacing. |
| Shared correction | Cả ba đều dùng Tabs, `SurfaceListCard` và pricing card sticky làm invariant. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/course-detail-page-v4.md` | added — brief, evidence, direction tracking và selection gate. |
| `.workflows/.previews/designs/starci-academy/course-detail-page-v4/revision-1/index.html` | added — một preview ba tab, responsive và switch client-side. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn concept để chuyển sang Design Review | A · Thanh bằng chứng (khuyến nghị vì giữ parity nhưng vẫn nâng hierarchy); B · Bậc thang quyết định; C · Tín hiệu chuyển đổi; hoặc feedback kết hợp cụ thể giữa các tab. |

### WARNINGS

| Warning | Impact |
|---|---|
| Tabs hiện mới chốt visual role, chưa chốt anchor navigation hay tab panels. | Review phải chốt behavior trước Apply; production không được tạo control không hoạt động. |
| FE worktree có nhiều learn-route changes ngoài scope. | Baseline/Apply sau này phải tách course-detail diff và giữ nguyên work khác. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Breadcrumb trong vùng đỏ | Tabs | User: “1 bên là tabs”. |
| Rail phẳng, không card | `SurfaceCard` + sticky như legacy | User: “xanh lá phải có card và stick như legacy”. |
| Stats chỉ là dãy badge nhỏ | Một trong ba composition có hierarchy rõ | User yêu cầu xanh dương sáng tạo layout để hút người dùng. |

### OWED

| Owed | Cleared by |
|---|---|
| Selected direction | User chọn A/B/C hoặc ghi combination cụ thể. |
| Exact component and props delta | `starci-fe-design-review` sau selection. |

## plan revision-2

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
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 22da90047b8dfe2154d0b996209026b768c48063 |
| Purpose | Ghi lựa chọn direction C từ feedback render và chuyển brief sang Design Review. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-detail-page-v4.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-detail-page-v4.md |

Selected direction: `direction-conversion-signals`
Selection evidence: user gửi lại render tab C và hỏi “sao không follow render kiểu này”.

### Preview tracking

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `course-detail-page-v4-r1` | http://127.0.0.1:8096/ | D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\course-detail-page-v4\revision-1\index.html | `b8773ee8630ffe19743f37b0283582fe4da862577509ea72033a20881179f5bf` | đã chốt |

| Direction | Tab | Status |
|---|---|---|
| `direction-evidence-ribbon` | A · Thanh bằng chứng | đã từ chối |
| `direction-decision-stair` | B · Bậc thang quyết định | đã từ chối |
| `direction-conversion-signals` | C · Tín hiệu chuyển đổi | đã chọn |

### Acceptance states

| State | Binding result |
|---|---|
| Desktop ready | Tabs ở trên hero; title + review summary; signal board 3 primary + 2 secondary; `SurfaceListCard`; rail `SurfaceCard` sticky. |
| Mobile ready | Một cột; tabs cuộn ngang; signal board tái bố cục; rail về document flow và mobile enroll bar giữ nguyên. |
| Pending/late data | Skeleton giữ kích thước signal board; rating và giá settle độc lập, không làm tabs lệch. |
| Empty review | Không bịa rating; review section vẫn dùng trạng thái `unrated`. |

### OUTPUTS

| Concept | Result |
|---|---|
| Selected concept | `direction-conversion-signals` là binding render duy nhất cho Review; không mở thêm direction. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/course-detail-page-v4.md` | modified — ghi selection, rejection và acceptance states. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Direction C đã được user chọn bằng feedback render. |

### WARNINGS

| Warning | Impact |
|---|---|
| Preview có career-track line và FAQ nhưng GraphQL/source không có dữ liệu tương ứng. | Review phải bỏ hai promise không có owner/data thay vì hard-code nội dung Fullstack vào mọi course. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Direction A và B | Direction C | User yêu cầu production follow đúng render C. |

### OWED

| Owed | Cleared by |
|---|---|
| Exact owner tree, prop migration và behavior tabs | `starci-fe-design-review`. |

## review revision-1

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
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 22da90047b8dfe2154d0b996209026b768c48063 |
| Purpose | Khóa exact production tree cho direction C trước source write. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-detail-page-v4.md |
| Language | vi |
| Phase | review |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-detail-page-v4.md |

Candidate revision: `course-detail-conversion-signals-r1`
Review status: awaiting explicit approval

### Review decisions

| Decision | Frozen result | Evidence |
|---|---|---|
| Tabs behavior | Anchor navigation trên cùng page; chọn tab scroll tới `overview`, `curriculum` hoặc `reviews`, không ẩn content thành panel. | Preview vẫn hiển thị toàn bộ narrative; source đã có ba section thật. |
| FAQ | Không render tab FAQ trong r1. | Không có FAQ data/section trong live query; tab rỗng là control nói dối. |
| Career track | Không render dòng hard-code của preview. | Course schema không cung cấp career track; không dùng copy Fullstack cho System Design/AI/DevOps. |
| Signal board | 5 facts hiện có được tách `label` và `value`: learners, modules, hours là primary; contents, challenges là secondary. | Connected page đã tính đủ 5 facts từ course/modules. |
| Rating | Đặt summary cạnh hero title chỉ khi review projection có dữ liệu; section reviews vẫn là owner chi tiết. | `averageScore` và `reviewTotal` đã tồn tại, resolve độc lập. |
| Lists | Value propositions và prerequisites tiếp tục dùng `SurfaceListCard`; curriculum/reviews giữ owner hiện tại. | Không tạo list/card wrapper mới. |
| Rail | `SurfaceCard` + sticky giữ nguyên; compact phase treatment và active-phase emphasis nằm trong `CoursePricingRail`. | Fidelity patch và legacy đều binding. |
| Mobile | Rail trở về flow; `CourseMobileEnrollBar` giữ nguyên. | `main-then-rail` và mobile action đã sở hữu behavior này. |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | `CourseDetailRoute` | REUSE | `src/app/[lang]/courses/[displayId]/page.tsx` | same | Next route | page call | Route identity không đổi. |
| page | `CourseDetailPage` connected | MODIFY | `src/components/pages/CourseDetailPage/index.tsx` | same | `CourseDetailRoute` | connected/pure twin | Resolve tab labels, split stat values/labels và giữ selected anchor state. |
| page | `_CourseDetailPage` pure | MODIFY | `src/components/pages/CourseDetailPage/component.tsx` | same | `CourseDetailPage`; new focused test | `course-detail-page`, `course-hero`, new course signal contracts | Thay breadcrumb/chip run bằng tabs + signal hierarchy của direction C. |
| block | `CoursePricingRail` | MODIFY | `src/components/blocks/courses/CoursePricingRail/component.tsx` | same | `_CourseDetailPage` | `course-pricing-rail`, `course-price-block`, `ordered-step-ladder` | Compact phase emphasis và scarcity reading order trong card sticky hiện có. |
| block | `CourseMobileEnrollBar` | REUSE | `src/components/blocks/courses/CourseMobileEnrollBar/component.tsx` | same | `_CourseDetailPage` | `course-mobile-action-bar` | Mobile commerce action đã đúng owner. |
| block | `CoursePrerequisiteList` | REUSE | `src/components/blocks/courses/CoursePrerequisiteList/component.tsx` | same | `_CourseDetailPage` | `course-prerequisite-list` | Ordered prerequisites không đổi. |
| block | `CourseReviewBlock` | REUSE | `src/components/blocks/courses/CourseReviewBlock/component.tsx` | same | `_CourseDetailPage` | `course-review-block` | Review detail/unrated state đã tồn tại. |
| branch | `SurfaceListCard` | REUSE | `src/components/branches/SurfaceListCard/index.tsx` | same | value props, prerequisites, curriculum | joined-list contracts | User binding yêu cầu đúng owner này. |
| branch | `SurfaceCard` | REUSE | `src/components/branches/SurfaceCard/index.tsx` | same | pricing rail và signal cards | contract-specific surfaces | Card mechanics đã tồn tại, không duplicate branch. |
| leaf | `ChoiceTabs` | REUSE | `src/components/leaves/ChoiceTabs/index.tsx` | same | `_CourseDetailPage` | `choice-tabs` | Underline tabs đúng visual role; caller sở hữu selected key/action. |
| leaf | `CurriculumModuleRow` | REUSE | `src/components/leaves/CurriculumModuleRow/index.tsx` | same | course module list | `course-module-row` | Disclosure curriculum không đổi. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| `CourseDetailPage` | `displayId` | KEEP | `string` | `string` | route | Route call unchanged. |
| `_CourseDetailPage` | `CourseStat` | RETYPE | `{ id, label }` | `{ id, label, value, emphasis }` | connected page; pending fixtures | No combined stat string remains after focused typecheck/test. |
| `_CourseDetailPage` | `CourseDetailLabels.navHome/navCourses` | REMOVE | breadcrumb copy | absent | connected labels object | `rg` proves no remaining producer/consumer. |
| `_CourseDetailPage` | `CourseDetailLabels.sectionTabsLabel/overviewTab/curriculumTab/reviewsTab` | ADD | absent | required resolved strings | connected page + `messages/en.json`, `messages/vi.json` | Both locales compile and focused render finds all three tabs. |
| `_CourseDetailPage` | `CourseDetailPageData.selectedSection` | ADD | absent | `"overview" | "curriculum" | "reviews"` | connected page owns state; pending/not-found use `overview`. |
| `_CourseDetailPage` | `CourseDetailPageActions.selectSection` | ADD | absent | `(section) => void` | connected page → pure page → `ChoiceTabs` | Click test verifies callback and live browser verifies scroll target. |
| `_CourseDetailPage` | `state`, `title`, `tagline`, lists, rating, rail | KEEP | current unions/data | same semantics | connected page | Existing pending/ready/not-found/failed fixtures retained. |
| `CoursePricingRail` | `CoursePricingRailData` | KEEP | current cover/price/discount/scarcity/phases/action/proof | same | connected page | Direction C derives active emphasis from existing `phases[].isActive`; no new transport promise. |
| `CoursePricingRail` | `state`, `on.act` | KEEP | current | current | `_CourseDetailPage` | Existing action path unchanged. |

### Supporting production boundary

| Path | Planned action | Reason |
|---|---|---|
| `src/components/contracts/index.ts` | MODIFY | Replace breadcrumb/chip anatomy and add exact course signal-board/card contracts; preserve unrelated learn-contract diff. |
| `src/messages/en.json` | MODIFY | Add three tab labels/group label and separated stat labels; preserve unrelated learn messages. |
| `src/messages/vi.json` | MODIFY | Same Vietnamese copy boundary. |
| `src/components/pages/CourseDetailPage/component.test.tsx` | ADD | Prove ready/pending, tabs, signal hierarchy, SurfaceListCard ownership and callback. |
| `src/components/blocks/courses/CoursePricingRail/component.test.tsx` | ADD | Prove active phase, scarcity, price-pending and action without changing public API. |
| `src/app/globals.css` | REUSE | Existing `--spacing-rail` fix already proves `top: 88px`; no new design token required unless Apply evidence disproves this. |

### State coverage

| Owner | State | Coverage | Evidence required |
|---|---|---|---|
| `_CourseDetailPage` | pending | rendered | Signal cells preserve count/height; static tabs labels remain visible. |
| `_CourseDetailPage` | ready with 0 reviews | rendered | No hero rating claim; unrated review state remains. |
| `_CourseDetailPage` | ready with reviews | rendered | Rating summary and reviews detail agree on projection. |
| `_CourseDetailPage` | failed/not-found | covered-by existing | `EmptyNotice` path unchanged. |
| `CoursePricingRail` | ready | rendered | Card, phase emphasis, scarcity, action and proof. |
| `CoursePricingRail` | price-pending | rendered | Price skeleton only; labels/scarcity do not jump. |
| layout | desktop light/dark | rendered | Two-column sticky rail and token contrast. |
| layout | mobile light/dark | rendered | One column, horizontal tabs, flow rail, mobile action. |
| data volume | uneven titles/value propositions/modules | rendered | Long System Design content does not break signal cards or rail. |
| late arrival | course/reviews/price settle independently | rendered | Tabs indicator and sticky offset remain aligned after hydration. |

### Acceptance evidence

| Proof | Command/state |
|---|---|
| Focused unit | Vitest for new page and rail tests. |
| Type/lint | `npm run typecheck`, `npm run lint`, with unrelated pre-existing failures classified, never suppressed. |
| Build | `npm run build`. |
| Live visual | `http://localhost:3000/vi/courses/1ab239c8-ebb5-53ee-b255-dc7839a6b959` at desktop/mobile, light/dark; compare hierarchy to direction C, not its Fullstack fixture text. |
| Runtime behavior | Click each tab and verify exact section scroll target; rail remains sticky at desktop and returns to flow on mobile. |

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate revision `course-detail-conversion-signals-r1` | Production follows direction C hierarchy while refusing preview-only promises with no source data. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/course-detail-page-v4.md` | modified — append exact component/props delta and acceptance boundary; no production source written. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve `course-detail-conversion-signals-r1` for Apply? | Recommended: approve anchor tabs + 5-signal board + compact sticky rail, while omitting unsupported FAQ/career-track copy; or send one exact revision. |

### WARNINGS

| Warning | Impact |
|---|---|
| `contracts/index.ts` and both message files contain unrelated learn work. | Apply must patch only named course-detail hunks and prove unrelated diffs remain byte-for-byte owned by prior work. |
| Current live fixture is System Design while preview text is Fullstack. | Visual comparison binds composition/hierarchy, never hard-coded fixture copy. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Hard-coded `Career track · Fullstack engineering` | No career-track line in r1 | Backend does not serve that fact for every course. |
| FAQ tab with no FAQ owner/data | Three real anchor tabs | An interactive control cannot point to absent content. |
| Copying preview HTML/CSS into production | Existing Tree/contracts/branches/leaves | Preview is disposable Plan evidence, not source architecture. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of `course-detail-conversion-signals-r1` | User says approve/ưng or provides one exact revision. |
| Production implementation and live proof | `starci-fe-design-apply` after approval. |

## review revision-2

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
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 22da90047b8dfe2154d0b996209026b768c48063 |
| Purpose | Ghi explicit approval cho exact revision direction C. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-detail-page-v4.md |
| Language | vi |
| Phase | review |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-detail-page-v4.md |

Approved revision: `course-detail-conversion-signals-r1`
Approval evidence: user trả lời “chốt” sau khi được yêu cầu xác nhận revision r1 để Apply.

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | `CourseDetailRoute` | REUSE | `src/app/[lang]/courses/[displayId]/page.tsx` | same | Next route | page call | Route identity không đổi. |
| page | `CourseDetailPage` | MODIFY | `src/components/pages/CourseDetailPage/index.tsx` | same | route | connected/pure twin | Resolve labels/stats và anchor state. |
| page | `_CourseDetailPage` | MODIFY | `src/components/pages/CourseDetailPage/component.tsx` | same | connected page; focused test | course detail/signal contracts | Render direction C. |
| block | `CoursePricingRail` | MODIFY | `src/components/blocks/courses/CoursePricingRail/component.tsx` | same | pure page; focused test | pricing rail contracts | Compact active phase/scarcity hierarchy. |
| block | `CourseMobileEnrollBar` | REUSE | `src/components/blocks/courses/CourseMobileEnrollBar/component.tsx` | same | pure page | `course-mobile-action-bar` | Existing mobile owner. |
| block | `CoursePrerequisiteList` | REUSE | `src/components/blocks/courses/CoursePrerequisiteList/component.tsx` | same | pure page | prerequisite contracts | Existing ordered list owner. |
| block | `CourseReviewBlock` | REUSE | `src/components/blocks/courses/CourseReviewBlock/component.tsx` | same | pure page | review contracts | Existing detail/unrated owner. |
| branch | `SurfaceListCard` | REUSE | `src/components/branches/SurfaceListCard/index.tsx` | same | page lists | joined-list contracts | Binding owner from user feedback. |
| branch | `SurfaceCard` | REUSE | `src/components/branches/SurfaceCard/index.tsx` | same | pricing rail/signal surfaces | branch projection | Existing card mechanics. |
| leaf | `ChoiceTabs` | REUSE | `src/components/leaves/ChoiceTabs/index.tsx` | same | pure page | `choice-tabs` | Existing underline tab leaf. |
| leaf | `CurriculumModuleRow` | REUSE | `src/components/leaves/CurriculumModuleRow/index.tsx` | same | module list | course module contracts | Existing disclosure owner. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| `CourseDetailPage` | `displayId` | KEEP | `string` | `string` | route | No route diff. |
| `_CourseDetailPage` | `CourseStat` | RETYPE | `{ id, label }` | `{ id, label, value, emphasis }` | connected page; pending fixture | Focused test/typecheck. |
| `_CourseDetailPage` | `navHome/navCourses` | REMOVE | breadcrumb labels | absent | connected labels/pure page | `rg` no stale names. |
| `_CourseDetailPage` | tab labels | ADD | absent | group + overview/curriculum/reviews labels | messages → connected → pure | Locale compile/render proof. |
| `_CourseDetailPage` | `selectedSection` | ADD | absent | `overview | curriculum | reviews` | connected → pure | Tab selected-state proof. |
| `_CourseDetailPage` | `selectSection` | ADD | absent | anchor selection callback | pure → connected | Click + live scroll proof. |
| `_CourseDetailPage` | existing state/content/rating/rail APIs | KEEP | current | current | connected/pure | Existing states retained. |
| `CoursePricingRail` | data/state/actions | KEEP | current | current | connected/pure | Derive treatment from current fields. |

### Supporting production boundary

| Path | Action |
|---|---|
| `src/components/pages/CourseDetailPage/index.tsx` | MODIFY |
| `src/components/pages/CourseDetailPage/component.tsx` | MODIFY |
| `src/components/blocks/courses/CoursePricingRail/component.tsx` | MODIFY |
| `src/components/contracts/index.ts` | MODIFY |
| `src/messages/en.json` | MODIFY |
| `src/messages/vi.json` | MODIFY |
| `src/components/pages/CourseDetailPage/component.test.tsx` | ADD |
| `src/components/blocks/courses/CoursePricingRail/component.test.tsx` | ADD |
| `src/app/globals.css` | REUSE |

### Acceptance evidence

| Proof | Required result |
|---|---|
| Focused tests | Page and rail ready/pending/actions pass. |
| Typecheck/lint/build | Run unsuppressed; classify only unrelated pre-existing failures. |
| Live page | `localhost:3000` desktop/mobile, light/dark follows direction C hierarchy. |
| Interaction | Three tabs scroll to real sections; rail sticky desktop and flow mobile. |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `course-detail-conversion-signals-r1` may enter Design Apply. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/course-detail-page-v4.md` | modified — append explicit approval and frozen deltas. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã chốt r1. |

### WARNINGS

| Warning | Impact |
|---|---|
| Target có nhiều source changes song song. | Apply baseline phải capture source hiện tại, loại generated artifacts/secrets, rồi chỉ track r1 diff. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| FAQ/career-track hard-code | Ba tabs có owner/data thật | Giữ đúng approved r1. |

### OWED

| Owed | Cleared by |
|---|---|
| Baseline, implementation và proof | `starci-fe-design-apply`. |

## apply revision-1

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
| Repo / branch | D:\Repositories\starci-academy-fe / main |
| Purpose | Apply production direction C đã được chốt cho Course Detail. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-detail-page-v4.md |
| Language | vi |
| Phase | apply |
| Touching | 6 production paths và 2 focused tests trong approved boundary; workflow record này. |

Applied revision: `course-detail-conversion-signals-r1`

Baseline commit: `6a3b07295a1b6ef2eb7b080b39cde034c5ea1be1`

Tracked diff: `6a3b07295a1b6ef2eb7b080b39cde034c5ea1be1..worktree`, restricted to approved Course Detail hunks in the named production boundary; concurrent user-owned hunks in shared files remain excluded from Apply ownership.

### Implementation reconciliation

| Approved item | Applied result |
|---|---|
| Three real tabs | `ChoiceTabs` owns Overview, Curriculum and Reviews anchor selection; the connected page scrolls to real sections and keeps narrative in document flow. |
| Five-signal board | Learners, modules and hours render as primary accent/success/warning `SurfaceCard`s; contents and challenges are neutral secondary cards. |
| Rating without invention | Hero rating renders only when review data exists; the live System Design fixture correctly omits it. |
| Existing list ownership | Value propositions, prerequisites and curriculum remain `SurfaceListCard` compositions. |
| Sticky pricing rail | Existing `SurfaceCard` and `top: 88px` sticky mechanics remain; scarcity and active phase use compact existing badges/cards. |
| Mobile | Signals become one column, rail returns to flow, tabs remain horizontally available and the existing mobile enroll bar remains the commerce owner. |
| Unsupported preview copy | FAQ and hard-coded Fullstack career-track copy were not introduced. |

### Proof

| Proof | Result |
|---|---|
| Focused Vitest | PASS — 2 files, 5 tests. |
| Focused ESLint | PASS — all 6 production paths and 2 focused tests; only the repository React-version warning. |
| TypeScript | PASS — `npx tsc --noEmit --pretty false`. |
| Canon/rule gate | PASS — mirror matches trust tree; rule command exits 0. |
| Production build | PASS — Next.js 16.1.6 compiled, typechecked and generated routes. |
| Desktop live | PASS — `http://localhost:3000/vi/courses/1ab239c8-ebb5-53ee-b255-dc7839a6b959`; 3+2 signals, three list surfaces and sticky rail observed. |
| Tab behavior | PASS — selecting `Nội dung` changed selected state and scrolled to curriculum. |
| Mobile live | PASS — Chrome at 390×844 after a 12-second settle; single-column signals and bottom mobile enroll action observed. |
| Diff whitespace | PASS — `git diff --check` reports no whitespace errors. |

### OUTPUTS

| Concept | Result |
|---|---|
| Course Detail direction C | Implemented in final production paths using existing contract/branch/leaf architecture. |
| Baseline | Clean source baseline committed before Apply as `6a3b07295a1b6ef2eb7b080b39cde034c5ea1be1`. |
| Runtime origin | Proof uses canonical `http://localhost:3000`; `127.0.0.1` is not used for the live application. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/pages/CourseDetailPage/component.tsx` | modified — tabs, conditional rating and signal-board render. |
| `src/components/pages/CourseDetailPage/index.tsx` | modified — anchor state, localized labels, split stats and scroll behavior. |
| `src/components/blocks/courses/CoursePricingRail/component.tsx` | modified — compact active phase, scarcity and card hierarchy. |
| `src/components/contracts/index.ts` | modified — navigation, signal and pricing composition contracts. |
| `src/messages/en.json`, `src/messages/vi.json` | modified — tab and signal labels. |
| Two focused test files | added — page and rail states/actions. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Visual acceptance of the production render | Approve current localhost render; or send one bounded correction to continue this session. |

### WARNINGS

| Warning | Impact |
|---|---|
| Full repository lint reports 199 errors in existing artifacts and unrelated Learn source. | Approved Course Detail boundary is clean under focused ESLint; no unrelated file was repaired or suppressed. |
| Full repository test reports 12 failed files / 15 failed tests, with 119 files / 488 tests passing. | Failures are in auth/dashboard/hooks/Apollo/query-courses and environment setup; both new Course Detail suites pass 5/5. |
| Concurrent Learn/Playground edits appeared after baseline, including shared contracts/messages. | They remain user-owned and uncommitted; this Apply records only approved Course Detail hunks and does not revert or stage concurrent work. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Preview-only FAQ and career-track promises | Three data-backed anchors and five data-backed signals | Production must not invent unsupported course facts. |
| Flat pricing region | Existing sticky `SurfaceCard` rail | User and legacy both bind card plus sticky ownership. |
| Decorative badge strip | Signal hierarchy with primary and secondary cards | Direction C requires a conversion-oriented reading order. |

### OWED

| Owed | Cleared by |
|---|---|
| User visual acceptance | User approves the localhost production render. |
| Final implementation commit | After visual acceptance and concurrent shared-file changes are reconciled by their owners. |

## review revision-3

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
| Repo / branch | D:\Repositories\starci-academy-fe / main |
| Purpose | Supersede the stale FAQ rejection with the real backend `course.data.qnas` capability. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-detail-page-v4.md |
| Language | vi |
| Phase | review |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-detail-page-v4.md và D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\course-detail-faq.md |

Candidate revision: `course-detail-conversion-signals-faq-r2`

Review status: awaiting explicit approval

### Binding evidence update

| Previous claim | Live evidence | Revised verdict |
|---|---|---|
| FAQ had no owner/data | Live schema exposes `CourseEntity.qnas`; live Fullstack call returns two Vietnamese rows. | Previous FAQ rejection is stale. Add a fourth real anchor and section. |
| Preview FAQ tab was a visual-only control | Production can select `id`, `question`, `answer`, `orderIndex` from the existing course query. | FAQ tab becomes a real same-page anchor. |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | `CourseDetailRoute` | REUSE | `src/app/[lang]/courses/[displayId]/page.tsx` | same | Next route | page call | Route identity does not change. |
| page | `CourseDetailPage` | MODIFY | `src/components/pages/CourseDetailPage/index.tsx` | same | route → connected page | connected/pure twin | Resolve ordered FAQ data, labels and fourth anchor target. |
| page | `_CourseDetailPage` | MODIFY | `src/components/pages/CourseDetailPage/component.tsx` | same | connected page; focused test | `course-section-navigation`, `course-faq-list`, `course-faq-row` | Draw fourth tab and real FAQ section through the existing list surface. |
| branch | `SurfaceListCard` | REUSE | `src/components/branches/SurfaceListCard/index.tsx` | same | `_CourseDetailPage` FAQ section | `course-faq-list` | Existing joined-list surface already owns label, surface and dividers. |
| leaf | `ChoiceTabs` | REUSE | `src/components/leaves/ChoiceTabs/index.tsx` | same | `_CourseDetailPage` | `choice-tabs` | Existing tab leaf supports a fourth key. |
| leaf | `Heading` | REUSE | `src/components/leaves/Heading/index.tsx` | same | FAQ section/rows | leaf slots | Question copy needs no new primitive. |
| leaf | `Text` | REUSE | `src/components/leaves/Text/index.tsx` | same | FAQ answers/empty copy | leaf slots | Answer and empty copy need no new primitive. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| `CourseDetailPage` | `displayId` | KEEP | `string` | `string` | route | Route call unchanged. |
| `_CourseDetailPage` | `CourseDetailSection` | RETYPE | `overview | curriculum | reviews` | `overview | curriculum | reviews | faq` | connected selected state, `ChoiceTabs`, anchor callback | Typecheck plus tab-click test. |
| `_CourseDetailPage` | `CourseDetailLabels` | ADD | no FAQ labels | required `faqTab`, `faqTitle`, `faqEmpty` | en/vi messages → connected → pure | Both locales compile; focused render finds tab/title/empty copy. |
| `_CourseDetailPage` | `CourseDetailPageData.faqs` | ADD | absent | optional ordered `ReadonlyArray<{ id, question, answer }>` | `CourseDetailPage` maps `CourseDetail.qnas` | Ready fixture renders live rows; pending/empty fixtures remain honest. |
| `_CourseDetailPage` | `CourseDetailPageActions.selectSection` | RETYPE | callback excludes FAQ | callback accepts FAQ | `ChoiceTabs` → pure → connected | Click FAQ test proves `faq`; live browser proves scroll. |
| `_CourseDetailPage` | existing stats/lists/reviews/rail props | KEEP | current r1 shape | same | existing connected/pure call | Existing focused tests remain green. |

### Supporting production boundary

| Path | Action | Reason |
|---|---|---|
| `src/modules/api/graphql/queries/query-course.ts` | MODIFY | Select real `qnas { id question answer orderIndex }` from existing BE query. |
| `src/modules/api/graphql/queries/types/course.ts` | MODIFY | Add exact selected FAQ row type and `CourseDetail.qnas`. |
| `src/modules/api/graphql/queries/query-course.test.ts` | ADD | Prove the detail document selects FAQ fields and does not reach into course/translations. |
| `src/components/contracts/index.ts` | MODIFY | Add exact FAQ joined-list and question-over-answer row contracts. |
| `src/messages/en.json` | MODIFY | Add FAQ tab/title/empty copy. |
| `src/messages/vi.json` | MODIFY | Add Vietnamese FAQ tab/title/empty copy. |
| `src/components/pages/CourseDetailPage/component.test.tsx` | MODIFY | Prove fourth tab, populated rows, empty state and callback. |
| Backend production source | REUSE | Live capability already exists; no duplicate source write. |

### State coverage

| State | Frozen result |
|---|---|
| pending | Fourth tab remains stable; FAQ list rests at contract-owned count. |
| ready with FAQ | Rows sort by `orderIndex`; question stands above answer inside one `SurfaceListCard`. |
| ready without FAQ | Fourth tab targets a real FAQ section showing localized empty copy. |
| long answer/mobile | One-column list wraps answer naturally; no horizontal overflow or rail change. |
| locale | BE request locale controls authored FAQ; FE controls only section chrome copy. |

### Acceptance evidence

| Proof | Required result |
|---|---|
| BE schema/live | `CourseEntity.qnas` introspection and live Fullstack Vietnamese FAQ call pass. |
| FE focused tests | Query document and Course Detail page tests pass. |
| Type/lint/build | Run unsuppressed and classify unrelated failures only. |
| Live localhost | `http://localhost:3000/vi/courses/fullstack-mastery` shows four tabs and two real FAQ rows. |
| Interaction | Clicking FAQ selects it and scrolls to the FAQ section. |
| Responsive | Desktop and 390px mobile remain readable; pricing rail behavior unchanged. |

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate `course-detail-conversion-signals-faq-r2` | Direction C gains a fourth real FAQ anchor and a backend-authored FAQ section without a duplicate BE operation or a new FE component family. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/course-detail-page-v4.md` | modified — append revised FAQ component/props boundary. |
| `.workflows/feature/starci-academy/course-detail-faq.md` | added — backend schema evidence and reuse review. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve exact FAQ revision and production boundary? | Recommended: approve `course-detail-conversion-signals-faq-r2` plus zero-BE-write reuse `course-detail-faq-reuse-r1`; or revise row interaction/content ownership. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE has concurrent Learn/Playground edits and shared-file changes. | Apply must commit a fresh baseline only after owner confirmation, then track only the approved FAQ hunks. |
| FAQ rows are expanded question-over-answer rows, not accordion controls. | This keeps the patch within existing `SurfaceListCard` ownership; accordion would require a new interaction owner and another Review. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Historical “FAQ has no data” verdict | Live `course.data.qnas` | User supplied the real Fullstack render and live backend disproves the old assumption. |
| New `courseFaqs` BE query | Existing `course` selection | One course detail request already owns the payload. |
| Fake/dead FAQ tab | Real anchor plus populated/empty section | Every tab must point to content that exists. |
| New accordion component | Expanded rows in existing list surface | User asked for a small real patch; no interaction requirement was stated. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of both exact revisions and FE write boundary | User confirms “approve FAQ r2 / apply”. |
| Production implementation and localhost proof | `starci-fe-design-apply` after approval. |

## review revision-4

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
| Repo / branch | D:\Repositories\starci-academy-fe / main |
| Purpose | Ghi explicit approval cho Course Detail FAQ r2 và exact FE production boundary. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-detail-page-v4.md |
| Language | vi |
| Phase | review |
| Touching | 9 FE FAQ production/test paths đã liệt kê trong review revision-3; workflow design và backend feature records. |

Approved revision: `course-detail-conversion-signals-faq-r2`

Approval evidence: user trả lời `approve FAQ r2, apply`.

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | `CourseDetailRoute` | REUSE | `src/app/[lang]/courses/[displayId]/page.tsx` | same | Next route | page call | Route unchanged. |
| page | `CourseDetailPage` | MODIFY | `src/components/pages/CourseDetailPage/index.tsx` | same | route | connected/pure twin | Resolve FAQ data, labels and anchor. |
| page | `_CourseDetailPage` | MODIFY | `src/components/pages/CourseDetailPage/component.tsx` | same | connected page/test | FAQ list contracts | Draw fourth tab and section. |
| branch | `SurfaceListCard` | REUSE | `src/components/branches/SurfaceListCard/index.tsx` | same | pure page | `course-faq-list` | Existing surface owner. |
| leaf | `ChoiceTabs` | REUSE | `src/components/leaves/ChoiceTabs/index.tsx` | same | pure page | `choice-tabs` | Existing tab owner. |
| leaf | `Heading` | REUSE | `src/components/leaves/Heading/index.tsx` | same | FAQ rows | leaf slots | Existing question primitive. |
| leaf | `Text` | REUSE | `src/components/leaves/Text/index.tsx` | same | FAQ rows/empty | leaf slots | Existing answer primitive. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| `CourseDetailPage` | `displayId` | KEEP | `string` | `string` | route | Route unchanged. |
| `_CourseDetailPage` | `CourseDetailSection` | RETYPE | three members | add `faq` | connected state, tabs, callback | Typecheck/test/live click. |
| `_CourseDetailPage` | FAQ labels | ADD | absent | `faqTab`, `faqTitle`, `faqEmpty` | messages → connected → pure | Locale/test proof. |
| `_CourseDetailPage` | `faqs` | ADD | absent | ordered FAQ rows | GraphQL type/query → connected → pure | Query/page tests. |
| `_CourseDetailPage` | `selectSection` | RETYPE | three members | includes `faq` | pure → connected | Click/live scroll proof. |
| `_CourseDetailPage` | existing API | KEEP | current | current | existing calls | Existing tests. |

### Supporting production boundary

| Path | Action |
|---|---|
| `src/modules/api/graphql/queries/query-course.ts` | MODIFY |
| `src/modules/api/graphql/queries/types/course.ts` | MODIFY |
| `src/modules/api/graphql/queries/query-course.test.ts` | ADD |
| `src/components/contracts/index.ts` | MODIFY |
| `src/messages/en.json` | MODIFY |
| `src/messages/vi.json` | MODIFY |
| `src/components/pages/CourseDetailPage/component.tsx` | MODIFY |
| `src/components/pages/CourseDetailPage/index.tsx` | MODIFY |
| `src/components/pages/CourseDetailPage/component.test.tsx` | MODIFY |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved FAQ revision | `course-detail-conversion-signals-faq-r2` may enter Design Apply. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/course-detail-page-v4.md` | modified — append explicit approval and frozen boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Repo `starci-academy-fe/main` and exact 9-path boundary approved. |

### WARNINGS

| Warning | Impact |
|---|---|
| Concurrent FE work remains in the baseline. | Apply must preserve it and only own FAQ diff after baseline. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Accordion expansion | Expanded question-over-answer rows | Approved small-patch concept. |

### OWED

| Owed | Cleared by |
|---|---|
| Baseline, implementation and proof | `starci-fe-design-apply`. |

## apply revision-2

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
| Repo / branch | D:\Repositories\starci-academy-fe / main |
| Purpose | Apply the approved real FAQ tab and section to Course Detail, backed by the existing course query. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-detail-page-v4.md |
| Language | vi |
| Phase | apply |
| Touching | The approved 9 FE FAQ paths and this workflow record only. |

Applied revision: `course-detail-conversion-signals-faq-r2`

Baseline commit: `1bc591b73b0ad0fce8114d9d7f1c19e52bca6e9b` (`chore: capture course faq baseline`).

Tracked comparison: FE baseline commit to current worktree. The FAQ implementation remains uncommitted for founder visual feedback.

### IMPLEMENTATION RECONCILIATION

| Approved owner | Implemented result | Diff proof |
|---|---|---|
| `CourseDetailPage` connected page | Selects localized `qnas`, sorts by `orderIndex`, supplies FAQ labels/data, and maps the fourth anchor. | `src/components/pages/CourseDetailPage/index.tsx` |
| `_CourseDetailPage` pure page | Draws the fourth FAQ tab and a real FAQ section after student reviews. | `src/components/pages/CourseDetailPage/component.tsx` |
| `SurfaceListCard` | Reused as one joined FAQ list; no new branch or accordion family. | Existing branch plus `course-faq-list` contract |
| `ChoiceTabs` | Reused with `faq`; click selects and scrolls to section item 4. | focused test and localhost browser proof |
| GraphQL course query | Selects `qnas { id question answer orderIndex }` from the existing operation. | query/type diff plus live backend response |
| Locale and state coverage | EN/VI chrome, populated FAQ, pending rows, and honest empty row are implemented. | messages, pure page, focused test |

### COMPONENT DELTA

| Layer | Owner | Result |
|---|---|---|
| route | `CourseDetailRoute` | Reused unchanged. |
| page | `CourseDetailPage` | Modified within approved path. |
| page | `_CourseDetailPage` | Modified within approved path. |
| branch | `SurfaceListCard` | Reused unchanged. |
| leaf | `ChoiceTabs`, `Heading`, `Text` | Reused unchanged. |

### PROPS DELTA

| Owner | Prop / API | Result | Proof |
|---|---|---|---|
| `_CourseDetailPage` | `CourseDetailSection` | Includes `faq`. | Typecheck and callback test pass. |
| `_CourseDetailPage` | FAQ labels | Required EN/VI values supplied. | Build and render pass. |
| `_CourseDetailPage` | `faqs` | Ordered `id/question/answer` rows supplied. | Live page renders two BE rows. |
| `_CourseDetailPage` | `selectSection` | Accepts and maps `faq`. | Browser click selected FAQ and scrolled to `scrollY=1664.8`. |
| Existing page API | all other props | Preserved. | Existing focused page tests remain green. |

### PROOF

| Gate | Result | Evidence |
|---|---|---|
| Backend schema/live | passed | Existing `CourseEntity.qnas`/`QnaEntity`; live `fullstack-mastery` VI call returned two ordered FAQ rows and no GraphQL errors. |
| Focused tests | passed | 2 files, 6 tests. |
| TypeScript | passed | `npx tsc --noEmit --pretty false`. |
| Focused ESLint | passed | Seven FAQ production/test paths; React settings warning only. |
| Production build | passed | Next.js build compiled, typed and generated routes successfully. |
| Diff hygiene | passed | `git diff --check 1bc591b` returned no whitespace errors. |
| Full repository lint | unrelated failure | 105 existing errors in `.artifacts`, synchronized `plugins/eslint-canon`, and `mutation-submit-coding-solution.ts`; no approved FAQ path was named. |
| Workflow validator | unrelated failure | Current FAQ design/feature records are clean; reported only pre-existing `learn-branch.md` and Nivo workflow records. |
| Responsive visual | passed with observation | 390x1600 render remains readable; tabs use the existing horizontal mobile strip, so FAQ is reached by strip scroll or anchor interaction. |

### LIVE FLOW PROOF

| Surface | Evidence | Verdict |
|---|---|---|
| Flow | Public Course Detail FAQ at `http://localhost:3000/vi/courses/fullstack-mastery`. | passed |
| Steps | Open localhost page; select FAQ; observe selected tab, anchor scroll and two expanded rows. | passed |
| UI | Four tabs exist; FAQ click selected `FAQ`; FAQ heading top was `483.2` after scroll and two real rows were visible. | passed |
| Network | Direct live POST to `http://localhost:3001/graphql` returned the same two VI FAQ rows with no GraphQL errors. | passed |
| Console | Browser interaction showed no Next.js runtime error overlay or page alert. Independent DevTools console export was unavailable in the in-app browser client. | partial |
| Terminal | Focused tests, typecheck and production build exited 0; direct backend live call returned two rows. | passed |
| Verdict | Implementation is usable and ready for founder visual feedback; Apply remains visually open until that feedback is accepted. | passed |

### OUTPUTS

| Concept | Result |
|---|---|
| Real Course Detail FAQ | Fourth tab and expanded question-over-answer list now render production backend data on localhost. |
| Backend reuse | No backend production source was added because the live course capability already owns FAQ data. |

### CHANGES

| Tree | Details |
|---|---|
| `src/modules/api/graphql/queries/query-course.ts` | modified - select FAQ rows. |
| `src/modules/api/graphql/queries/types/course.ts` | modified - type FAQ rows. |
| `src/modules/api/graphql/queries/query-course.test.ts` | added - freeze query ownership. |
| `src/components/contracts/index.ts` | modified - FAQ list/row contracts and four-control navigation wording. |
| `src/messages/en.json`, `src/messages/vi.json` | modified - FAQ tab/title/empty copy. |
| `src/components/pages/CourseDetailPage/component.tsx` | modified - fourth tab and real FAQ section. |
| `src/components/pages/CourseDetailPage/index.tsx` | modified - map backend FAQ and anchor. |
| `src/components/pages/CourseDetailPage/component.test.tsx` | modified - populated, empty and click proof. |
| `.workflows/designs/starci-academy/course-detail-page-v4.md` | modified - append Apply evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Visual acceptance of the localhost FAQ | Founder may accept as rendered or provide a bounded small-patch correction in the same open Apply feedback cycle. |

### WARNINGS

| Warning | Impact |
|---|---|
| Concurrent FE edits exist outside the approved FAQ paths, including Learn and Headhunting/QA pages plus artifacts. | They were preserved and are not claimed by this Apply. |
| Full repository lint is not green. | FAQ-focused lint is green; 105 reported errors are outside this approved production boundary. |
| Mobile tab labels exceed 390px as a group. | Existing `ChoiceTabs` horizontal-strip behavior keeps all four controls reachable without changing the approved component family. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Duplicate backend FAQ operation | Existing `course.data.qnas` | Live capability already owns the data. |
| New accordion component | Expanded rows in `SurfaceListCard` | Matches approved r2 small-patch boundary. |
| Commit FAQ implementation before feedback | Baseline commit plus visible worktree diff | Keeps founder feedback easy to inspect and revise. |

### OWED

| Owed | Cleared by |
|---|---|
| Founder visual feedback/acceptance | Inspect localhost Course Detail FAQ and respond with acceptance or a bounded correction. |
| Independent DevTools console export | Optional capture if strict console artifact is required before final implementation commit. |
