<!-- starci-workflow: v2 -->

## plan r1

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
| Repo / branch | D:\Repositories\starci-academy-fe / main; D:\Repositories\starci-academy-backend / mtp |
| Purpose | So sánh bốn composition cho pricing rail gọn và thoáng hơn trong khi giữ nguyên nội dung và ba luồng mua, giỏ hàng, học thử. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-pricing-rail-density-r1.md |
| Language | vi |
| Phase | plan |
| Touching | Workflow này và D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\course-pricing-rail-density-r1\r1\index.html |

### EVIDENCE

| Evidence | Result |
|---|---|
| User request | `cảm giác gap bị chật chứ nội dung ok rồi, thay cách render cho gọn, gửi 3-4 html` |
| Live component | `CoursePricingRail` hiện giữ cover, active phase, price/list/discount, savings, price detail, scarcity, purchase copy, enroll, cart, trial copy/action, phase disclosure và enrolment proof. |
| Governing contracts | `course-pricing-rail` dùng một `SurfaceCard`; `course-pricing-purchase-intent` và `course-pricing-exploration-intent` đều là stack `gap-2`; `course-price-block` giữ price facts `gap-1`. |
| Existing decision | Buy và Try là hai intent khác nhau; ba secondary buttons xếp chồng đã bị từ chối. Enroll giữ primary và trailing arrow; cart/trial subordinate. |
| Backend / database | PostgreSQL pricing phases và server quote cung cấp list, charged price, discount, scarcity/phase; checkout quote còn hỗ trợ installment options. Elasticsearch không sở hữu quyết định commerce này. Preview không hứa dữ liệu mới. |
| Responsive boundary | Rail là cột sticky `w-80` trên desktop và thành một card theo flow trên mobile. |

### COMPONENT INVENTORY

| Owner | Classification | Reason |
|---|---|---|
| `SurfaceCard` | REUSE | Cả bốn hướng vẫn là một pricing surface duy nhất. |
| `CoursePricingRail` | EXTEND | Composition nội bộ thay đổi nhưng data/actions hiện có đủ cho cả bốn hướng. |
| `PricingPhaseDisclosure` / HeroUI Accordion | REUSE | Phase comparison tiếp tục là disclosure, không dựng control mới. |
| `Button`, `Badge`, `Text`, `TextLink`, `CoverImage` | REUSE | Không hướng nào cần leaf mới. |
| Buy/Try segmented mode ở hướng C | REUSE | Có thể dùng `ChoiceTabs variant="primary"`; không cần contract primitive mới. |
| Joined intent rows/bands | EXTEND | Có thể diễn đạt bằng contract composition mới nếu hướng A/B/D được chọn; Review phải khóa exact key. |

### DIRECTIONS

| Direction | Product decision | Main trade-off |
|---|---|---|
| `pricing-density-a` — Joined bands | Buy và Try là hai band có divider trong cùng surface; phase comparison ở footer. | Đủ copy, reading order rõ; vẫn dài hơn B/C. |
| `pricing-density-b` — Intent rows | Buy và Try là hai decision rows, copy trái và action phải; cart/phase là utility links. | Ngắn nhất khi cả hai intent cùng visible; CTA không còn full-width trên desktop. |
| `pricing-density-c` — Buy / Try switch | Segmented choice đổi giữa hai intent panels. | Card rất gọn; một intent bị ẩn sau thao tác. |
| `pricing-density-d` — Action dock | Copy đọc thành joined stack, ba actions gom ở dock cuối; enroll primary, cart/trial cùng utility row. | Kết thúc quyết định mạnh; actions xa phần copy tương ứng hơn. |

### PREVIEW TRACKING

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `course-pricing-rail-density-r1-r1` | `http://127.0.0.1:8081/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\course-pricing-rail-density-r1\r1\index.html` | `3ba68868180fec1a9a489e595528e5da10a288fb34efca60e1749f68900e6797` | đang chờ |

Preview root: D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\course-pricing-rail-density-r1\r1

PID: 55840

Port: 8081

### DIRECTION TRACKING

| Direction | Tab | Status |
|---|---|---|
| `pricing-density-a` | `A · Joined bands` | đang chờ |
| `pricing-density-b` | `B · Intent rows` | đang chờ |
| `pricing-density-c` | `C · Buy / Try switch` | đang chờ |
| `pricing-density-d` | `D · Action dock` | đang chờ |

### RESPONSIVE PROOF

| State | Result |
|---|---|
| Desktop | Main narrative + fixed 340px rail cho thấy density trong đúng two-column context. |
| Mobile | Nút `Mobile` thu stage về một card 380px; ghost narrative bị bỏ và decision rows chuyển thành stack khi cần. |
| Interaction | Bốn direction tabs đổi client-side không reload; hướng C có Buy/Try switch; disclosure dùng native preview interaction để mô phỏng HeroUI Accordion. |

### OUTPUTS

| Concept | Result |
|---|---|
| Pricing rail density brief | Bốn hướng khác nhau ở reading order, CTA composition và disclosure; tất cả giữ đủ dữ liệu và ba journey hiện có. |
| Recommended starting point | `pricing-density-a` nếu ưu tiên clarity và parity; `pricing-density-b` nếu ưu tiên chiều cao ngắn nhất mà vẫn luôn thấy Buy và Try. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-pricing-rail-density-r1.md` | added — design evidence, four directions và tracking. |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\course-pricing-rail-density-r1\r1\index.html` | added — một tabbed HTML preview với Desktop/Mobile state. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn composition cho pricing rail | `A · Joined bands` — an toàn và rõ nhất; `B · Intent rows` — gọn nhất khi cả Buy/Try cùng visible; `C · Buy / Try switch` — ngắn nhất nhưng có hidden intent; `D · Action dock` — action ending mạnh. Mở `http://127.0.0.1:8081/`. |

### WARNINGS

| Warning | Impact |
|---|---|
| Preview là disposable HTML, không phải production source. | Typography và spacing mô phỏng token hiện có; Review mới khóa exact contract/component delta. |
| Hướng C ẩn một intent sau tab. | Có thể giảm discoverability của học thử hoặc mua nếu người dùng không đổi mode. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Chỉ giảm `gap-4` thành một spacing nhỏ hơn. | Thay composition/reading order qua bốn hướng. | User nói nội dung ổn nhưng muốn `thay cách render cho gọn`, không chỉ ép spacing. |
| Ba secondary buttons xếp chồng. | Enroll primary; cart và trial có ownership phụ rõ theo từng hướng. | Quyết định Buy vs Try đã được chốt trước đó. |

### OWED

| Owed | Cleared by |
|---|---|
| Selected direction và lý do. | Thầy chọn A, B, C hoặc D sau khi xem preview. |
| Design Review | Chạy `$starci-fe-design-review` để khóa component/props delta sau khi chọn. |

## plan r2

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
| Repo / branch | D:\Repositories\starci-academy-fe / main; D:\Repositories\starci-academy-backend / mtp |
| Purpose | Ghi lựa chọn C làm direction duy nhất chuyển sang Design Review. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-pricing-rail-density-r1.md |
| Language | vi |
| Phase | plan |
| Touching | Workflow này; không sửa preview hoặc production source. |

Selected direction: `pricing-density-c`

Selection instruction: `C đi`

### SELECTED DIRECTION

| Field | Frozen result |
|---|---|
| Identity | `pricing-density-c` — Buy / Try switch |
| Persistent facts | Cover, active phase, payable/list price, discount, savings, price detail và scarcity luôn visible. |
| Intent control | Primary segmented choice có hai mode `Mua khóa học` và `Học thử`. |
| Buy panel | Purchase title/description, primary trailing-arrow enroll CTA và secondary cart action. |
| Try panel | Trial title/description và trial action; không lặp price facts. |
| Supporting disclosure | HeroUI Accordion `So sánh các phase` nằm sau intent panel; enrolment proof ở cuối rail. |
| Responsive acceptance | Desktop rail giữ fixed width; mobile thành full-flow card; segmented choice và panel không horizontal overflow. |
| State acceptance | Ready, price-pending, adding, checking-out và trialing vẫn giữ action-specific pending ownership hiện có. |

### PREVIEW TRACKING

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `course-pricing-rail-density-r1-r1` | `http://127.0.0.1:8081/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\course-pricing-rail-density-r1\r1\index.html` | `3ba68868180fec1a9a489e595528e5da10a288fb34efca60e1749f68900e6797` | đã chốt |

### DIRECTION TRACKING

| Direction | Tab | Status |
|---|---|---|
| `pricing-density-a` | `A · Joined bands` | đã từ chối |
| `pricing-density-b` | `B · Intent rows` | đã từ chối |
| `pricing-density-c` | `C · Buy / Try switch` | đã chọn |
| `pricing-density-d` | `D · Action dock` | đã từ chối |

### OUTPUTS

| Concept | Result |
|---|---|
| Selected pricing composition | `pricing-density-c`: giá và commerce evidence luôn visible; Buy/Try chuyển thành một primary segmented intent control với một panel tại một thời điểm. |
| Review handoff | Review phải khóa ownership của selected intent key, panel rendering, state persistence, component delta và props delta trước Apply. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-pricing-rail-density-r1.md` | modified — ghi selected direction C, acceptance states và rejected alternatives. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Direction C đã được thầy chọn. |

### WARNINGS

| Warning | Impact |
|---|---|
| Hướng C chỉ hiện một intent panel tại một thời điểm. | Design Review phải chứng minh default Buy, accessible tab semantics và không làm mất discoverability của Học thử. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `pricing-density-a` — Joined bands | `pricing-density-c` | Thầy chọn `C đi`. |
| `pricing-density-b` — Intent rows | `pricing-density-c` | Thầy chọn `C đi`. |
| `pricing-density-d` — Action dock | `pricing-density-c` | Thầy chọn `C đi`. |

### OWED

| Owed | Cleared by |
|---|---|
| Exact COMPONENT DELTA và PROPS DELTA | `$starci-fe-design-review` đọc source và append reviewed revision. |
| Explicit Review approval trước production edit | Thầy phê duyệt một revision của Design Review. |

## review r1

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
| Repo / branch | D:\Repositories\starci-academy-fe / main; D:\Repositories\starci-academy-backend / mtp |
| Purpose | Khóa source boundary, state ownership và public props cho direction C trước khi Apply. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-pricing-rail-density-r1.md |
| Language | vi |
| Phase | review |
| Touching | Workflow này; không sửa HTML preview hoặc production source. |

Approved revision: `pricing-density-c-r1`

Approval instruction: `tiếp tục 2 bước luôn đi, dễ khỏi cần confirm`

### REVIEW VERDICT

| Decision | Frozen result |
|---|---|
| State owner | `_CoursePricingRail` sở hữu local intent key, mặc định `purchase`; đây là presentation state, không thay đổi commerce request hoặc page route state. |
| Control | Reuse `ChoiceTabs variant="primary"`, text-only, controlled bằng local intent key và accessible group label đã dịch. |
| Persistent evidence | Active phase, cover, price/list/discount, savings, price detail và scarcity đứng trước intent control và luôn visible. |
| Panel rule | Khi có trial, chỉ selected purchase hoặc exploration contract render; khi không có trial, selector bị bỏ và purchase panel render trực tiếp. |
| Actions | Purchase panel giữ enroll primary trailing arrow và cart secondary; exploration giữ trial ghost. `act`, `addToCart`, `trial`, `openPriceDetail` không đổi chữ ký. |
| Pending ownership | `checking-out`, `adding`, `trialing`, `price-pending` tiếp tục chỉ nghỉ đúng control/fact đang xử lý, kể cả panel hiện đang ẩn. |
| Disclosure | Reuse `PricingPhaseDisclosure` sau selected panel; không thêm accordion hoặc phase model mới. |
| Responsive | Reuse rail width/sticky boundary và ChoiceTabs primary; không thêm horizontal layout hoặc overflow owner. |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | Course detail route | REUSE | `src/app/[lang]/courses/[displayId]/page.tsx` | same | Next route | route page | Không đổi display-id resolution. |
| page | `_CourseDetailPage` | REUSE | `src/components/pages/CourseDetailPage/component.tsx` | same | Course detail route | `main-then-rail` | Page tiếp tục project rail và không sở hữu selected intent. |
| page | `CourseDetailPage` | MODIFY | `src/components/pages/CourseDetailPage/index.tsx` | same | Course detail route; `_CourseDetailPage` | connected page boundary | Resolve ba translation strings mới cho rail intent. |
| block | `_CoursePricingRail` | MODIFY | `src/components/blocks/courses/CoursePricingRail/component.tsx` | same | `_CourseDetailPage`; unit test | `course-pricing-rail`, `course-price-block`, `course-pricing-purchase-intent`, `course-pricing-exploration-intent` | Sở hữu local intent, persistent price, primary ChoiceTabs và một visible panel. |
| leaf | `ChoiceTabs` | REUSE | `src/components/leaves/ChoiceTabs/index.tsx` | same | `_CoursePricingRail` | leaf `choice-tabs` | Existing controlled primary segmented choice đúng semantics. |
| leaf | `PricingPhaseDisclosure` | REUSE | `src/components/leaves/PricingPhaseDisclosure/index.tsx` | same | `_CoursePricingRail` | leaf `pricing-phase-disclosure` | Existing HeroUI Accordion tiếp tục sở hữu disclosure. |
| branch | `SurfaceCard` | REUSE | `src/components/branches/SurfaceCard/index.tsx` | same | `_CoursePricingRail` | `course-pricing-rail` | Rail vẫn là đúng một default HeroUI card surface. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| `CourseDetailPage` | `rail.intent` producer | ADD | 5 localized fields | 8 localized fields | `src/components/pages/CourseDetailPage/index.tsx`; rail unit fixture | Connected page migration plus focused rail test. |
| `_CoursePricingRail` | `CoursePricingRailIntentCopy.intentTabsLabel` | ADD | absent | required `string` | connected page; rail unit fixture | Type contract rejects every unmigrated producer. |
| `_CoursePricingRail` | `CoursePricingRailIntentCopy.purchaseModeLabel` | ADD | absent | required `string` | connected page; rail unit fixture | Focused test queries Buy tab by accessible name. |
| `_CoursePricingRail` | `CoursePricingRailIntentCopy.trialModeLabel` | ADD | absent | required `string` | connected page; rail unit fixture | Focused test queries Try tab by accessible name. |
| `_CoursePricingRail` | `CoursePricingRailActions` | KEEP | `act`, `trial`, `addToCart`, `openPriceDetail` | unchanged | connected page and unit tests | Existing action assertions plus switch-flow assertions. |
| `_CoursePricingRail` | `CoursePricingRailState` | KEEP | five-state union | unchanged | connected page and unit tests | Existing parameterized pending-owner test. |

### ACCEPTANCE EVIDENCE

| Gate | Exact proof |
|---|---|
| Focused render | `npm exec vitest run src/components/blocks/courses/CoursePricingRail/component.test.tsx src/components/pages/CourseDetailPage/component.test.tsx` |
| Types | `npm run typecheck` in frontend. |
| Frontend lint | `npm run lint` in frontend. |
| Backend lint | `npm run lint:check` in backend; backend source boundary remains empty. |
| Live interaction | On localhost course detail: price facts remain visible; default Buy shows enroll/cart only; selecting Try shows trial only; selecting Buy restores purchase; phase accordion still opens; no horizontal overflow at desktop/mobile. |
| Diff reconciliation | Every modified production path must match COMPONENT DELTA / PROPS DELTA; any new owner returns to Review. |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved design revision | `pricing-density-c-r1`: persistent pricing evidence plus one primary Buy/Try intent switch and one visible panel. |
| Ownership decision | UI-only selected intent belongs to the pure pricing block; connected page remains owner of data, translations and commerce requests. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-pricing-rail-density-r1.md` | modified — append approved Review revision, exact component/props delta and gates. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Thầy đã cho phép Review → Apply liên tục không confirm trung gian. |

### WARNINGS

| Warning | Impact |
|---|---|
| Frontend worktree chứa thay đổi song song ngoài pricing rail. | Apply phải baseline theo exact approved boundary và không stage/commit global search, Sentry hoặc source ngoài delta. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Page/URL sở hữu selected Buy/Try intent | Local state trong `_CoursePricingRail` | Intent chỉ đổi presentation panel, không phải navigation hoặc server state. |
| Thêm component switch mới | Reuse `ChoiceTabs primary` | Existing leaf đã đúng semantics và paint cho bounded peer choice. |
| Giữ price bên trong purchase panel | Price thành persistent rail slot | Direction C yêu cầu commerce evidence luôn visible kể cả khi xem Try. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply `pricing-density-c-r1` | `$starci-fe-design-apply` commit safe baseline, sửa đúng boundary và chạy acceptance evidence. |

## apply r1

Applied revision: `pricing-density-c-r1`

Baseline commit: `95aff126ee9e0521fbac034546891242aa55b866`

Tracked diff: `95aff126ee9e0521fbac034546891242aa55b866..worktree`

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
| Repo / branch | D:\Repositories\starci-academy-fe / main; D:\Repositories\starci-academy-backend / mtp |
| Purpose | Apply approved direction C: persistent pricing evidence plus one Buy/Try intent panel. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\course-pricing-rail-density-r1.md |
| Language | vi |
| Phase | apply |
| Baseline | `95aff126ee9e0521fbac034546891242aa55b866` at `refs/codex/baselines/course-pricing-rail-density-r1` |
| Touching | Six approved FE files plus this workflow; backend production boundary empty. |

### OUTPUTS

| Concept | Result |
|---|---|
| Applied revision | `pricing-density-c-r1` implemented in the production pricing rail. |
| Intent composition | Price evidence persists; `Mua khóa học` is the default primary tab; only the selected purchase or trial panel renders. |
| Existing behavior | Enrol, cart, trial, price-detail, phase accordion and action-specific pending ownership remain on their existing handlers. |
| Localization | Added accessible intent group and Buy/Try labels in Vietnamese and English. |
| Live proof | Desktop Buy → Try → Buy passed; price stayed visible, hidden-panel actions disappeared, phase accordion reopened and browser console remained clean. |
| Responsive proof | Rail measured `327px` inside a `375px` client width with no overflowing descendant. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/blocks/courses/CoursePricingRail/component.tsx` | modified — local intent owner, persistent price block, primary `ChoiceTabs`, one visible intent panel. |
| `src/components/blocks/courses/CoursePricingRail/component.test.tsx` | modified — switch-flow, persistent-price, optional-trial and pending-owner coverage. |
| `src/components/pages/CourseDetailPage/index.tsx` | modified — supplies three localized intent labels. |
| `src/components/contracts/index.ts` | modified — rail contract now exposes persistent price and optional selector/panels; purchase panel no longer owns price. |
| `src/messages/en.json` | modified — English intent labels. |
| `src/messages/vi.json` | modified — Vietnamese intent labels. |
| Baseline reconciliation | `git diff --name-only 95aff126ee9e0521fbac034546891242aa55b866` returns exactly the six files above; `git diff --check` passes. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Review and Apply were explicitly pre-approved in one instruction. |

### WARNINGS

| Warning | Impact |
|---|---|
| Full FE typecheck remains red from baseline contract debt, including pre-existing invalid `LayoutClassName` values `flex-nowrap` and `[&>*]:whitespace-nowrap` in `src/components/contracts/index.ts`. | These baseline errors collapse downstream contract overloads; this approved diff did not introduce those values. Focused tests and lint for the changed boundary pass. |
| Full mobile page width is `470px` on a `375px` client because the pre-existing secondary course ShellNav tablist is `446px` wide. | The new pricing rail itself is responsive and has no overflowing descendant; ShellNav is outside this approved component delta and needs a separate bounded fidelity continuation. |
| Frontend worktree contains unrelated concurrent changes. | The hidden baseline ref and exact six-file reconciliation prevent this Apply from claiming or overwriting them. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Render Buy and Try actions together | One selected intent panel | Direction C requires reduced density and explicit intent. |
| Move selected intent into page or URL state | Local `_CoursePricingRail` state | It is presentation state and does not change routing or commerce requests. |
| Repair ShellNav overflow inside this Apply | Record bounded related defect | ShellNav was not in the approved component/props delta. |
| Suppress or weaken type errors | Preserve strict gates and record baseline debt | Apply cannot hide unrelated failures. |

### OWED

| Owed | Cleared by |
|---|---|
| Pre-existing mobile ShellNav tablist overflow | Open a linked fidelity session for the course-detail ShellNav mobile width. |
| Pre-existing FE contract/typecheck debt | Run the owning audit or fidelity workflow for the invalid layout class contract values and re-run full typecheck. |

### PROOF

| Gate | Result |
|---|---|
| Focused tests | PASS — 2 files, 12 tests. |
| Focused ESLint | PASS. |
| Frontend lint | PASS — `npm run lint`. |
| Backend lint | PASS — `npm run lint:check`; no backend product source changed. |
| Typecheck | FAIL from recorded baseline contract debt; no suppression added. |
| Live desktop | PASS — default Buy, Try switch, restored Buy, persistent price, phase accordion and zero console errors. |
| Live mobile rail | PASS — `327px` rail within `375px`, zero rail descendants overflow. |
