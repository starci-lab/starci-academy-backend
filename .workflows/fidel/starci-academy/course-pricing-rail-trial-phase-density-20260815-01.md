<!-- starci-workflow: v2 -->

# Course pricing rail trial action and phase density

## start

Session id: `fidel-course-pricing-trial-phase-20260815-01`

Session status: open

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
| Purpose | Sửa đúng priority của nút Học thử và mật độ/typography của phase disclosure theo feedback trực tiếp của thầy. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-pricing-rail-trial-phase-density-20260815-01.md |
| Language | vi |
| Phase | start |
| Touching | `src/components/leaves/Button/index.tsx`, `src/components/leaves/Button/index.test.tsx`, `src/components/blocks/courses/CoursePricingRail/component.tsx`, `src/components/blocks/courses/CoursePricingRail/component.test.tsx`, `src/components/leaves/PricingPhaseDisclosure/index.tsx`, `src/components/leaves/PricingPhaseDisclosure/index.test.tsx`, `src/components/contracts/index.ts`, workflow này. |

### BINDING EVIDENCE

| Field | Frozen value |
|---|---|
| Request | `học thử để là button territary`; phase list không có offset; `Sớm` dùng `text-xs`; `Tiên phong` và `Tiêu chuẩn` dùng `text-base`. |
| Reference | Hai ảnh feedback `codex-clipboard-b049c84f-9f31-483c-a57b-1e16faf302b4.png` và `codex-clipboard-9561a559-5350-4e43-b69b-ff8d9f0e1939.png`. |
| Live route | `http://localhost:3000/vi/courses/1ab239c8-ebb5-53ee-b255-dc7839a6b959` |
| Frozen state | Desktop, locale `vi`, light theme, System Design Mastery, trial intent selected, phase accordion expanded. |
| Baseline identity | FE `HEAD cd7f7ae66de937dd19065af3e1c84c8d866e86c4`; worktree hashes: rail `FAF7DCC3832D190597315C...`, disclosure `333122C98DF71706EBFDD5...`. |

### OUTPUTS

| Concept | Result |
|---|---|
| Active correction | Giữ composition C; chỉ sửa priority nút Học thử và visual recipe của phase disclosure. |
| Session | Mở và đang sửa ngay trong cùng fidelity session. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-pricing-rail-trial-phase-density-20260815-01.md` | added — freeze request, render identity và write boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Feedback đã xác định đầy đủ expected result và owner. |

### WARNINGS

| Warning | Impact |
|---|---|
| `Button` leaf hiện chưa khai báo variant `tertiary`, dù HeroUI vendor và các leaf khác đã dùng trực tiếp. | Patch phải bổ sung variant vào shared Button thay vì giả lập bằng class hoặc tiếp tục dùng `ghost`. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Giữ nút Học thử là `ghost` | `tertiary` | Thầy chốt priority cụ thể là tertiary. |
| Giữ list offset mặc định của Accordion panel | Danh sách thẳng hàng với trigger | Thầy xác nhận phần xanh không được có offset. |

### OWED

| Owed | Cleared by |
|---|---|
| Production patch và focused proof | Sửa đúng boundary, chạy Button/Rail/Disclosure tests, lint và kiểm tra localhost. |
| User acceptance | Feedback tiếp theo hoặc `$starci-fe-fidelity-end`. |

## feedback r5

Session id: `fidel-course-pricing-trial-phase-20260815-01`

Session status: open

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
| Purpose | Chuyển vùng cuộn pricing rail từ ScrollShadow bọc ngoài sang nội dung cuộn thật bên trong một Card. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-pricing-rail-trial-phase-density-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | `SurfaceCard`, `CoursePricingRail` call site/focused test, `globals.css` và workflow hiện tại. |

### OUTPUTS

| Concept | Result |
|---|---|
| Classification | `within-boundary` — sửa đúng scroll host của pricing rail, không đổi hierarchy hay CTA. |
| Binding evidence | Feedback và ảnh chỉ rõ Card phải giữ nguyên khung; nội dung cuộn bên trong Card; không dùng ScrollShadow/fade wrapper. |
| Expected result | Một Card có `max-height`; Card clip boundary; Card.Content sở hữu `overflow-y-auto`; scrollbar ẩn nhưng wheel/touch/keyboard vẫn cuộn nội bộ. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-pricing-rail-trial-phase-density-20260815-01.md` | modified — append feedback r5 trước production correction. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Expected scroll ownership đã được thầy chỉ rõ. |

### WARNINGS

| Warning | Impact |
|---|---|
| Existing FE worktree có thay đổi không liên quan ở SelectionList và Text. | Patch phải giữ nguyên và không chạm các file đó. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| ScrollShadow bọc ngoài Card | Card cố định với Card.Content cuộn nội bộ | “Nội dung được cuộn trong card”, không phải shadow/fade bao quanh Card. |

### OWED

| Owed | Cleared by |
|---|---|
| Implement và focused proof | Component test, lint và localhost DOM/render proof. |
| User acceptance | Feedback tiếp theo hoặc Fidelity End. |

## feedback r5

Session id: `fidel-course-pricing-trial-phase-20260815-01`

Session status: open

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
| Purpose | Chuẩn hóa phase label và chuyển pricing rail sang ScrollShadow cao tối đa 80% viewport, không lộ native scrollbar. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-pricing-rail-trial-phase-density-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | Giữ nguyên pricing-rail boundary; `CoursePricingRail`, `SurfaceCard`, `PricingPhaseDisclosure`, contract/token, focused tests và workflow. |

### OUTPUTS

| Concept | Result |
|---|---|
| Phase labels | `Tiên phong`, `Sớm`, `Tiêu chuẩn` đều `text-sm font-normal`; active `Sớm` dùng accent-soft foreground, không dùng chip. |
| Scroll ownership | `SurfaceCard` sở hữu HeroUI `ScrollShadow`; pricing rail dùng token `max-h-pricing-rail = 80dvh`, vertical scrolling và `hideScrollBar`. |
| Layout seam | `main-then-rail` chỉ giữ width/sticky/top/self-start; bỏ max-height và overflow cũ để không tạo nested native scroll. |
| Live proof | Viewport 720px cho max-height 576px; khi mở phase, `scrollHeight 670 > clientHeight 576`, `overflow-y: auto`, class có `scroll-shadow--hide-scrollbar`. |
| Automated proof | 4 focused files / 18 tests pass; focused ESLint pass; `git diff --check` pass. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-fe\src\components\blocks\courses\CoursePricingRail\component.tsx` | modified — yêu cầu pricing-rail ScrollShadow qua SurfaceCard. |
| `D:\Repositories\starci-academy-fe\src\components\branches\SurfaceCard\index.tsx` | modified — đúng vendor owner cho ScrollShadow và hidden scrollbar. |
| `D:\Repositories\starci-academy-fe\src\components\leaves\PricingPhaseDisclosure\index.tsx` | modified — phase labels `text-sm font-normal`, active accent-soft text. |
| `D:\Repositories\starci-academy-fe\src\components\contracts\index.ts` | modified — rail layout không còn nested overflow owner. |
| `D:\Repositories\starci-academy-fe\src\app\globals.css` | modified — thêm named token `--max-height-pricing-rail: 80dvh`. |
| Focused tests | modified — khóa typography, ScrollShadow token và hidden scrollbar. |
| Workflow | modified — append feedback r5 cùng render proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Feedback đã đủ cụ thể và correction đã được prove. |

### WARNINGS

| Warning | Impact |
|---|---|
| Rail chỉ overflow sau khi nội dung disclosure dài hơn 80dvh. | Đúng mong đợi; ScrollShadow không tạo thanh cuộn giả khi nội dung ngắn. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `overflow-y-auto` trực tiếp trên sticky layout child | ScrollShadow bên trong SurfaceCard | Tránh native scrollbar và giữ vendor ownership đúng tier. |
| Arbitrary `max-h-[80vh]` tại block | Named token `max-h-pricing-rail` | Tuân thủ spacing vocabulary và vẫn đúng 80% viewport. |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance | Feedback tiếp theo trong session mở. |
| Fidelity End | Chỉ chạy khi thầy yêu cầu. |

## feedback r6

Session id: `fidel-course-pricing-trial-phase-20260815-01`

Session status: open

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
| Purpose | Tính sticky offset và pricing-rail max-height từ toàn bộ chiều cao navbar thật. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-pricing-rail-trial-phase-density-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | Giữ nguyên rail boundary; chỉ token navbar/rail, `main-then-rail` và workflow. |

### OUTPUTS

| Concept | Result |
|---|---|
| Measured navbar | Primary 64px, course navbar 33.6px; sau one-pixel overlap, bottom thực là 97.6px = 6.1rem. |
| Sticky offset | `main-then-rail` dùng `top-course-rail`; computed top 97.6px. Sau scroll, rail top 97.6px đúng bằng navbar bottom. |
| Height formula | `max-h-pricing-rail = calc((100dvh - var(--spacing-course-rail)) * 0.8)`. Với viewport 720px, computed max-height 497.92px. |
| Automated proof | 4 focused files / 18 tests pass; focused ESLint pass; `git diff --check` pass. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-fe\src\app\globals.css` | modified — thêm measured `--spacing-course-rail: 6.1rem` và công thức remaining-height × 80%. |
| `D:\Repositories\starci-academy-fe\src\components\contracts\index.ts` | modified — course right rail dùng `top-course-rail`; các rail khác giữ `top-rail`. |
| Workflow | modified — append feedback r6 và computed proof trước/sau scroll. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Công thức và navbar boundary đã được thầy chỉ rõ. |

### WARNINGS

| Warning | Impact |
|---|---|
| Navbar height là token từ geometry đã đo của hai contract rows. | Nếu navbar recipe đổi height, token course rail phải đổi cùng contract revision. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `80dvh` không trừ navbar | `(100dvh - navbar) * 0.8` | Rail sticky chỉ được dùng 80% vùng viewport còn lại. |
| Dùng generic `top-rail` 5.5rem | Course-specific `top-course-rail` 6.1rem | Generic offset khiến rail chui lên dưới course navbar. |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance | Feedback tiếp theo trong session mở. |
| Fidelity End | Chỉ chạy khi thầy yêu cầu. |

## feedback r2

Session id: `fidel-course-pricing-trial-phase-20260815-01`

Session status: open

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
| Purpose | Áp dụng và chứng minh tertiary trial action cùng disclosure phase expand nội bộ theo density/typography đã chốt. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-pricing-rail-trial-phase-density-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | Boundary của Start: shared Button, CoursePricingRail, PricingPhaseDisclosure, tests, contract wording và workflow này. |

### OUTPUTS

| Concept | Result |
|---|---|
| Classification | `within-boundary` — toàn bộ correction bám đúng feedback đã freeze. |
| Trial priority | Nút `Học thử` render qua shared Button variant `tertiary`; không giả lập bằng class hay `ghost`. |
| Expand trigger | Native button chỉ có text + chevron, `p-0`, `aria-expanded`, `aria-controls`; panel có `role=region` và `aria-labelledby`. |
| Expanded content | Danh sách dùng `gap-3 px-4`: khoảng dòng 12px, inset trái 16px. |
| Phase typography | `Tiên phong` và `Tiêu chuẩn` 16px/500; chip `Sớm` 12px/500. |
| Live identity | `http://localhost:3000/vi/courses/1ab239c8-ebb5-53ee-b255-dc7839a6b959`, locale `vi`, light theme, trial intent, disclosure expanded. |
| Proof | 3 focused files / 11 tests pass; focused ESLint pass; `git diff --check` pass; localhost computed-style and ARIA inspection pass. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-fe\src\components\leaves\Button\index.tsx` | modified — expose canonical `tertiary` shared-button variant. |
| `D:\Repositories\starci-academy-fe\src\components\leaves\Button\index.test.tsx` | modified — prove tertiary variant forwarding. |
| `D:\Repositories\starci-academy-fe\src\components\blocks\courses\CoursePricingRail\component.tsx` | modified — trial action uses tertiary. |
| `D:\Repositories\starci-academy-fe\src\components\blocks\courses\CoursePricingRail\component.test.tsx` | modified — lock trial action priority. |
| `D:\Repositories\starci-academy-fe\src\components\leaves\PricingPhaseDisclosure\index.tsx` | modified — replace vendor Accordion with accessible native disclosure; apply p-0 trigger, gap-3 content, inset and phase typography. |
| `D:\Repositories\starci-academy-fe\src\components\leaves\PricingPhaseDisclosure\index.test.tsx` | modified — prove native disclosure semantics, spacing and typography. |
| `D:\Repositories\starci-academy-fe\src\components\contracts\index.ts` | modified — align contract rationale with tertiary trial action. |
| `D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-pricing-rail-trial-phase-density-20260815-01.md` | modified — append feedback correction and proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Patch đã được áp dụng và chứng minh; session vẫn mở để nhận feedback tiếp. |

### WARNINGS

| Warning | Impact |
|---|---|
| Full TypeScript gate vẫn đỏ tại các contract slot inference của `CoursePricingRail` và `CourseReviewBlock`, tồn tại ngoài correction semantics này. | Không có lỗi TypeScript trỏ vào Button hoặc PricingPhaseDisclosure mới; focused tests và lint của boundary đều xanh. Không mở rộng fidelity patch sang audit contract. |
| Dev console có lỗi concurrent ở GlobalSearch (`status` undefined, thiếu `globalSearch.detail.loading/error`) và Turbopack CSS HMR. | Không liên quan pricing rail; ghi nhận làm related finding, chưa sửa trong session này. |
| FE worktree đang có nhiều thay đổi concurrent ngoài boundary. | Chỉ các file được liệt kê trong CHANGES được chạm; không reset hay ghi đè phần việc khác. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| HeroUI Accordion cho phase comparison | Disclosure expand nội bộ | Giảm chrome/spacing thừa nhưng vẫn giữ keyboard và ARIA semantics. |
| Trial action `ghost` | Shared Button `tertiary` | Đúng priority đã chốt, tránh secondary/ghost giả. |
| Phase rows sát nhau và không inset | `gap-3 px-4` | Nội dung expand dễ quét và đúng feedback về density. |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance của render mới | Feedback tiếp theo trong cùng session. |
| Fidelity End | Chỉ chạy `$starci-fe-fidelity-end` sau khi thầy xác nhận render đạt. |
| Contract/typecheck debt và GlobalSearch runtime errors | Một audit/fidelity session riêng nếu thầy yêu cầu; không trộn vào patch này. |

## feedback r3

Session id: `fidel-course-pricing-trial-phase-20260815-01`

Session status: open

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
| Purpose | Đồng bộ chevron với foreground, khóa quy tắc vị trí chevron và chuyển phase labels sang text recipe thuần. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-pricing-rail-trial-phase-density-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | Giữ nguyên boundary; correction nằm ở PricingPhaseDisclosure và focused test. |

### OUTPUTS

| Concept | Result |
|---|---|
| Classification | `within-boundary` — refinement trực tiếp của disclosure vừa sửa. |
| Chevron recipe | Heroicons `ChevronRightIcon` qua Icon leaf; màu kế thừa `text-foreground`; mở xoay 90 độ. |
| Chevron placement | Nếu cuối hàng đã có data thì chevron đứng đầu; nếu không có trailing data thì chevron đứng cuối. Trigger phase không có trailing data nên chevron ở cuối. |
| Phase labels | `Tiên phong` và `Tiêu chuẩn`: `text-sm font-medium text-foreground`; `Sớm`: text thuần `text-sm font-medium text-accent-soft-foreground`, không Badge/chip. |
| Live proof | Expanded true; trigger children là text rồi chevron; chevron và foreground labels cùng computed color; cả ba labels 14px; content gap 12px và inset 16px. |
| Automated proof | 3 focused files / 11 tests pass; focused ESLint pass; diff check pass. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-fe\src\components\leaves\PricingPhaseDisclosure\index.tsx` | modified — foreground rotating chevron; remove active Badge; apply text-only phase recipes. |
| `D:\Repositories\starci-academy-fe\src\components\leaves\PricingPhaseDisclosure\index.test.tsx` | modified — lock phase typography, accent-soft active text and trailing rotated foreground chevron. |
| `D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-pricing-rail-trial-phase-density-20260815-01.md` | modified — append latest feedback and proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Feedback đã đủ cụ thể và đã được áp dụng. |

### WARNINGS

| Warning | Impact |
|---|---|
| Full TypeScript và concurrent GlobalSearch warnings giữ nguyên như feedback r2. | Không phát sinh lỗi mới trong disclosure patch; focused boundary vẫn xanh. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Active phase Badge/chip | Accent-soft text thuần | Phase comparison cần typography đồng cấp, không cần chip chrome. |
| Chevron màu muted hoặc đứng đầu vô điều kiện | Foreground; vị trí theo trailing-data rule | Icon phải cùng màu label và không tranh chỗ với dữ liệu cuối hàng. |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance | Feedback tiếp theo trong session mở. |
| Fidelity End | Chỉ chạy sau khi thầy xác nhận đạt. |

## feedback r4

Session id: `fidel-course-pricing-trial-phase-20260815-01`

Session status: open

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
| Purpose | Tách hierarchy spacing giữa cụm giá và scarcity signal. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-pricing-rail-trial-phase-density-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | Giữ nguyên boundary; correction ở CoursePricingRail, contracts, focused test và workflow. |

### OUTPUTS

| Concept | Result |
|---|---|
| Classification | `within-boundary` — spacing correction của cùng price block. |
| Price group | Giá/giá gốc/discount cùng dòng và dòng tiết kiệm/giải thích tạo một `course-price-primary-group` với `gap-1` (4px). |
| Scarcity separation | Scarcity là tín hiệu thời điểm độc lập, nằm sau primary group trong `course-price-block` với `gap-2` (8px). |
| Live proof | Primary là child đầu; scarcity là child kế; computed gaps lần lượt 4px và 8px trên localhost canonical. |
| Automated proof | 3 focused files / 11 tests pass; focused ESLint pass; diff check pass. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-fe\src\components\blocks\courses\CoursePricingRail\component.tsx` | modified — tạo primary price group và tách scarcity ra ngoài. |
| `D:\Repositories\starci-academy-fe\src\components\blocks\courses\CoursePricingRail\component.test.tsx` | modified — khóa `gap-1` trong cụm và `gap-2` giữa cụm với scarcity. |
| `D:\Repositories\starci-academy-fe\src\components\contracts\index.ts` | modified — thêm contract `course-price-primary-group`, đổi outer block sang gap-2 và cập nhật rationale. |
| `D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-pricing-rail-trial-phase-density-20260815-01.md` | modified — append feedback r4 và proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Hierarchy và spacing đã được thầy chỉ rõ. |

### WARNINGS

| Warning | Impact |
|---|---|
| Full TypeScript và concurrent GlobalSearch warnings giữ nguyên như r2. | Không phát sinh focused failure từ spacing patch. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Một `gap-1` phẳng cho cả price, note và scarcity | Nested `gap-1` primary + outer `gap-2` | Scarcity không thuộc cùng thought group với phép tính giá. |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance | Feedback tiếp theo trong session mở. |
| Fidelity End | Chỉ chạy sau khi thầy xác nhận đạt. |

## feedback r1

Session id: `fidel-course-pricing-trial-phase-20260815-01`

Session status: open

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
| Purpose | Thay HeroUI Accordion bằng disclosure expand nội bộ gọn hơn mà vẫn giữ keyboard và expanded semantics. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-pricing-rail-trial-phase-density-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | Giữ nguyên boundary của Start; correction tập trung ở `PricingPhaseDisclosure` và test. |

### OUTPUTS

| Concept | Result |
|---|---|
| Classification | `within-boundary` — trigger/disclosure recipe đã được thầy chốt cụ thể. |
| Expected result | Trigger chỉ gồm text + chevron, `p-0`; nội dung expand bên dưới có `gap-3`, phase offset/typography tiếp tục theo feedback trước. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-pricing-rail-trial-phase-density-20260815-01.md` | modified — append feedback và expected disclosure semantics. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Exact interaction và spacing đã rõ. |

### WARNINGS

| Warning | Impact |
|---|---|
| Bỏ vendor Accordion nghĩa là component phải tự giữ expanded state. | Patch vẫn phải giữ native button, `aria-expanded`, `aria-controls` và hidden panel; không hạ accessibility. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| HeroUI Accordion cho phase comparison | Disclosure expand nội bộ | Thầy nói không nhất thiết dùng accordion; trigger và spacing cần gọn hơn. |

### OWED

| Owed | Cleared by |
|---|---|
| Implement và prove disclosure mới | Focused tests, lint và localhost interaction. |
| User acceptance | Feedback tiếp theo hoặc `$starci-fe-fidelity-end`. |

## feedback r6

Session id: `fidel-course-pricing-trial-phase-20260815-01`

Session status: open

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
| Purpose | Ghi proof cho Card-owned viewport và content-owned internal scroll của pricing rail. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-pricing-rail-trial-phase-density-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | `SurfaceCard`, `CoursePricingRail` call site/focused test, `globals.css` và workflow hiện tại. |

### OUTPUTS

| Concept | Result |
|---|---|
| Internal scroll | Một `SurfaceCardSurface` giữ max-height 497.92px và clip boundary; `SurfaceCardBody` có `overflow-y:auto`, scrollbar ẩn. |
| Scroll ownership proof | Wheel trong rail đổi body `scrollTop` từ 0 thành 76.8 trong khi page `scrollY` giữ 0; nội dung cuộn trong Card. |
| Removed wrapper | Live DOM có 0 `CoursePricingRailScroll`; source không còn import/render HeroUI `ScrollShadow`. |
| Automated proof | CoursePricingRail 7/7 tests pass; focused ESLint pass; TypeScript pass. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-fe\src\components\branches\SurfaceCard\index.tsx` | modified — thay `scrollShadow` bằng `scrollInside`; Card và Card.Content nhận marker sở hữu viewport/scroll region. |
| `D:\Repositories\starci-academy-fe\src\components\blocks\courses\CoursePricingRail\component.tsx` | modified — pricing rail yêu cầu `scrollInside: pricing-rail`. |
| `D:\Repositories\starci-academy-fe\src\components\blocks\courses\CoursePricingRail\component.test.tsx` | modified — khóa một Card, không ScrollShadow và scroll region nằm trong Card. |
| `D:\Repositories\starci-academy-fe\src\app\globals.css` | modified — max-height/clip trên Card; overflow-y/overscroll/hidden scrollbar trên Card.Content. |
| `D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-pricing-rail-trial-phase-density-20260815-01.md` | modified — append correction và proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Small patch đã được chỉ rõ và proof đủ. |

### WARNINGS

| Warning | Impact |
|---|---|
| Existing FE worktree có thay đổi không liên quan ở SelectionList và Text. | Không file nào trong số đó bị patch này chạm. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| ScrollShadow/fade wrapper | Native internal overflow region trong một Card | Card phải là khung cố định và nội dung cuộn bên trong. |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance | Thầy xác nhận render đúng ý. |
| Fidelity End | Chạy khi thầy yêu cầu closing proof. |

## feedback r7

Session id: `fidel-course-pricing-trial-phase-20260815-01`

Session status: open

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
| Purpose | Fork cơ học scrollbar mảnh của HeroUI thành component chính thức cho viewport cuộn bên trong pricing card. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-pricing-rail-trial-phase-density-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | `ScrollViewport`, `SurfaceCard`, contract registry, pricing rail test/call site, `globals.css` và workflow hiện tại. |

### OUTPUTS

| Concept | Result |
|---|---|
| HeroUI source identity | HeroUI modal uses its `scrollbar` utility; the installed theme resolves it to `scrollbar-width: thin`, themed thumb and transparent track. It is not a standalone public component. |
| Component boundary | Added branch `ScrollViewport`; the initial new-shell attempt was rejected by the canonical shell gate and was not kept. |
| Live style proof | Pricing viewport computes `overflow-y:auto`, `scrollbar-width:thin`, themed `scrollbar-color`, max-height 497.92px; scrollHeight 568 exceeds clientHeight 498. |
| Scroll ownership proof | Wheel inside the viewport moved its scrollTop to 70.4 while page scrollY remained 0. |
| Automated proof | CoursePricingRail 7/7 tests pass; focused ESLint pass; TypeScript pass. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-fe\src\components\branches\ScrollViewport\index.tsx` | added — contract-backed viewport component using HeroUI scrollbar mechanics without fade or painted scrollbar. |
| `D:\Repositories\starci-academy-fe\src\components\branches\SurfaceCard\index.tsx` | modified — card remains the outer clipped surface and no longer owns scroll-region mechanics directly. |
| `D:\Repositories\starci-academy-fe\src\components\contracts\index.ts` | modified — registered `pricing-rail-scroll-viewport` and its closed structural class set. |
| `D:\Repositories\starci-academy-fe\src\components\blocks\courses\CoursePricingRail\component.tsx` | modified — routes pricing content through `ScrollViewport`. |
| `D:\Repositories\starci-academy-fe\src\components\blocks\courses\CoursePricingRail\component.test.tsx` | modified — locks viewport contract, HeroUI scrollbar utility and Card containment. |
| `D:\Repositories\starci-academy-fe\src\app\globals.css` | modified — retains only pricing max-height boundary; scrollbar appearance comes from HeroUI theme tokens. |
| `D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-pricing-rail-trial-phase-density-20260815-01.md` | modified — appended scrollbar-component correction and proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Settled fidelity patch is implemented and proved. |

### WARNINGS

| Warning | Impact |
|---|---|
| Canon permits only Modal/Drawer/Dropdown/Route as shells. | The requested reusable scroll mechanics are correctly housed in a contract-backed branch rather than weakening the gate. |
| Existing FE worktree has unrelated SelectionList and Text changes. | This correction did not touch them. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Hidden scrollbar | HeroUI themed thin scrollbar | The visible native rail is the approved reference. |
| ScrollShadow fade | Internal overflow viewport | The card must remain solid while only its content moves. |
| New `ScrollShell` tier | Contract-backed `ScrollViewport` branch | A fifth shell violates the canonical vendor boundary and arbitrary-children fence. |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance | Thầy confirms the thin HeroUI scrollbar render. |
| Fidelity End | Run when thầy requests closing proof. |

## feedback r8

Session id: `fidel-course-pricing-trial-phase-20260815-01`

Session status: open

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
| Purpose | Khóa spacing theo semantic block thay vì áp một gap phẳng cho mọi phần tử con. |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-pricing-rail-trial-phase-density-20260815-01.md |
| Phase | feedback |

### OUTPUTS

| Concept | Result |
|---|---|
| Disclosure hierarchy | Trigger/title và panel content là hai khối nên giữ `gap-3`; các phase row cùng cấp trong panel dùng `gap-2`. |
| Purchase hierarchy | Copy block và action block là hai sibling nên outer dùng `gap-3`. |
| Intra-block spacing | Title + description và primary + secondary action đều dùng `gap-2`. |
| Automated proof | 2 test files, 9 tests pass; focused ESLint pass; TypeScript pass. |

### CHANGES

| File | Change |
|---|---|
| `D:\Repositories\starci-academy-fe\src\components\leaves\PricingPhaseDisclosure\index.tsx` | Phase peers changed from `gap-3` to `gap-2`; outer disclosure remains `gap-3`. |
| `D:\Repositories\starci-academy-fe\src\components\contracts\index.ts` | Split purchase intent into outer, copy and actions contracts with `3 -> 2 + 2` hierarchy. |
| `D:\Repositories\starci-academy-fe\src\components\blocks\courses\CoursePricingRail\component.tsx` | Renders purchase copy and actions as explicit semantic blocks. |
| Focused tests | Lock outer/inner gap classes and block containment. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Feedback is settled and implemented immediately. |

### WARNINGS

| Warning | Impact |
|---|---|
| Existing unrelated SelectionList/Text changes remain in the FE worktree. | Patch did not touch those files. |
| In-app browser tab handle became stale during reload proof. | Structural DOM is locked by connected component tests; no product gate failed. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| One flat `gap-2` or `gap-3` over all descendants | Explicit copy/actions and trigger/content groups | Spacing follows semantic relationship, not container convenience. |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance | Thầy confirms the semantic spacing render. |
| Fidelity End | Run only when requested; session remains open for feedback. |

## feedback r9

Session id: `fidel-course-pricing-trial-phase-20260815-01`

Session status: open

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
| Purpose | Chốt group-first: phải tạo semantic container trước rồi mới chọn gap cho direct children của từng container. |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-pricing-rail-trial-phase-density-20260815-01.md |
| Phase | feedback |

### OUTPUTS

| Concept | Result |
|---|---|
| Grouping law | `gap` là kết quả của quan hệ giữa direct children; không phải thuộc tính chọn trước cho một cây con phẳng. |
| Container ownership | Mỗi semantic container chỉ sở hữu một seam. Cần hai seam thì tách thành hai nested containers. |
| Current source | Purchase copy/actions và disclosure trigger/content đã là các named contract containers riêng; không cần thêm product delta. |
| Regression proof | Connected tests đã khóa DOM containment cùng outer/inner gap classes. |

### CHANGES

| File | Change |
|---|---|
| Workflow hiện tại | Ghi nhận explicit group-first correction và route recurrence sang Upgrade Plan. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Product source already conforms to the corrected grouping hierarchy. |

### WARNINGS

| Warning | Impact |
|---|---|
| Canon đã nói one seam per container nhưng feedback vẫn lặp lại. | Vấn đề là thiếu bước bắt buộc chứng minh grouping trước spacing; cần Upgrade Review thay vì thêm một con số gap mới. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Chọn `gap` trên một `div` phẳng rồi giải thích quan hệ sau | Nhóm direct children thành các semantic containers trước, sau đó gán đúng một gap cho mỗi container | Container boundary quyết định quan hệ; spacing không được thay thế cấu trúc. |

### OWED

| Owed | Cleared by |
|---|---|
| Upgrade Review | Khóa cách buộc fidelity ghi group/seam evidence trước mọi spacing patch. |
| Fidelity End | Run only when requested; session remains open for feedback. |
