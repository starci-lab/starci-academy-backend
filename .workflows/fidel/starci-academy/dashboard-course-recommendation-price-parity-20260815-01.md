# Dashboard course recommendation price parity

## start

### CONTEXT

| Field | Value |
|---|---|
| Session | `fidel-dashboard-course-price-parity-20260815-01` |
| Status | `open` |
| Source | `D:\Repositories\starci-academy-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |
| Project | `starci-academy` |
| Frontend | `D:\Repositories\starci-academy-fe` (`main`) |
| Backend | `D:\Repositories\starci-academy-backend` (`mtp`) |
| Route | `http://localhost:3000/vi/dashboard?tab=courses` |
| Locale / theme / auth | `vi` / light / signed in |
| Linked session | `course-pricing-rail-trial-phase-density-20260815-01` |

### BINDING EVIDENCE

| Evidence | Binding decision |
|---|---|
| `codex-clipboard-09553540-4e97-4a9f-b225-78a58b0b1f5e.png` | Course detail shows the complete real-price presentation: payable price, list price, discount, savings and price explanation. |
| `codex-clipboard-8c489069-6877-4558-99de-313119509b34.png` | Dashboard recommendations incorrectly show local checkout test amounts such as `12.500 ₫` and omit the comparison facts. |
| `RecommendedCourses/index.tsx` | FE already accepts and formats the full recommendation pricing contract; no deliberate compact-price variant is authorized. |
| `CoursePriceCalculatorService` | The local `/100` payment-test divisor currently leaks into discovery quotes and is the measured source of the bad display values. |

### OUTPUTS

| Output | Status | Evidence |
|---|---|---|
| Restore recommendation display-price parity | Corrected | Discovery now returns full VND list/charge values; checkout alone retains the local payment-test divisor. |

### CHANGES

| File | Intended correction |
|---|---|
| Backend canonical pricing calculator / quote path | Separate real display amounts from local test charge amounts without duplicating discount arithmetic. |
| Focused backend specs | Prove discovery returns full prices and local checkout keeps its test charge behavior. |
| FE only if required by proof | Preserve the already-full price row; do not introduce a compact variant. |
| `course-price-calculator.service.ts` | Added explicit full-value display resolvers while preserving the existing checkout resolver behavior. |
| `course-price-quote.service.ts` | Routes `Discovery` through full-value resolvers and `Checkout` through local payment-test resolvers. |
| `recommended-courses.service.ts` | Maps list price and computes the displayed total discount from the canonical list-to-charge pair. |
| Three focused specs | Cover full discovery amounts, cheap checkout amounts and `2.000.000 → 1.750.000 → 13%` recommendation mapping. |

### NEED APPROVALS

| Item | Status |
|---|---|
| Small runtime parity patch | Approved by direct feedback: restore the full price rather than simplify it. |

### WARNINGS

| Warning | Detail |
|---|---|
| Dirty worktrees | Preserve every unrelated frontend and backend change. |
| Payment safety | Local checkout must remain cheap; only discovery/display values become real amounts. |
| Full typecheck | The repository typecheck remains blocked by pre-existing missing `bullmq` declarations in unrelated worker files; none of the touched pricing files appears in its errors. |
| Live browser proof | The isolated in-app browser reaches the login modal and has no signed-in session; no cookie or token inspection was attempted. |

### REJECTED

| Rejected option | Reason |
|---|---|
| Multiply recommendation prices by 100 in FE | Duplicates backend environment policy and corrupts production semantics. |
| Keep a compact dashboard price | Explicitly rejected by founder feedback; pricing must be complete and consistent. |

### OWED

| Item | Proof required |
|---|---|
| Backend amount boundary | Focused unit tests for discovery and checkout in non-production. |
| Dashboard rendering | Live localhost proof that recommendation rows show full VND price facts. |
| Session evidence | Append commands, results and target workflow validation while leaving the session open. |

## proof

| Gate | Result |
|---|---|
| Focused Jest | `3/3` suites and `9/9` tests passed. |
| Focused ESLint | Passed with zero findings across the six touched source/spec files. |
| Diff check | Passed; no whitespace errors in the pricing and recommendation boundary. |
| FE source | No change required: the existing recommendation row already renders payable price, list price, discount, savings and the price-detail action when the backend contract supplies them. |

### remaining

| Item | Status |
|---|---|
| Signed-in localhost visual confirmation | Owed because the isolated browser session is unauthenticated. |
| Fidelity End / Finality | Not run; this session remains open for founder feedback. |

## feedback — canonical discovery discount

Session id: `fidel-dashboard-course-price-parity-20260815-01`

Session status: open

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-backend` |
| Source | `D:\Repositories\starci-academy-backend` |
| Project | `starci-academy` |
| Frontend | `D:\Repositories\starci-academy-fe` |
| Backend | `D:\Repositories\starci-academy-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Skills | `D:\Repositories\starci-academy-backend\.claude\skills` |
| App | `starci-academy` |
| Repo / branch | Backend `D:\Repositories\starci-academy-backend` / `mtp`; Frontend `D:\Repositories\starci-academy-fe` / `main` |
| Purpose | Sửa related bug cùng cơ chế để mọi discovery adapter dùng một phần trăm giảm list-to-charge canonical. |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |
| Workflow | `D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\dashboard-course-recommendation-price-parity-20260815-01.md` |
| Language | `vi` |
| Phase | `feedback` |
| Touching | Canonical quote, recommendation adapter, focused specs và workflow record. |

### OUTPUTS

| Concept | Result |
|---|---|
| Discovery discount authority | `CoursePriceQuoteService` trả phần trăm giảm tổng từ `listVnd` đến `chargedVnd`; các adapter không tự diễn giải lại. |

### CHANGES

| Tree | Details |
|---|---|
| `src/modules/bussiness/course-pricing/course-price-quote.service.ts` | modified — canonical hóa `displayDiscountPercent` cho intent `Discovery`. |
| `src/features/api/core/graphql/queries/dashboard/recommended-courses/recommended-courses.service.ts` | modified — dùng trực tiếp phần trăm canonical. |
| `src/modules/bussiness/course-pricing/course-price-quote.service.spec.ts` | modified — chứng minh phase discount và loyalty discount hợp thành phần trăm hiển thị. |
| `src/features/api/core/graphql/queries/dashboard/recommended-courses/recommended-courses.service.spec.ts` | added — chứng minh adapter giữ `2.000.000 → 1.750.000 → 13%`. |
| `.workflows/fidel/starci-academy/dashboard-course-recommendation-price-parity-20260815-01.md` | modified — ghi feedback cùng session. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Không có quyết định sản phẩm mới. |

### WARNINGS

| Warning | Impact |
|---|---|
| Signed-in browser unavailable | Chưa thể chụp after-render dashboard trong browser điều khiển được. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Mỗi adapter tự tính phần trăm | Canonical quote trả một kết quả chung | Tránh dashboard và detail lệch nhau lần nữa. |

### OWED

| Owed | Cleared by |
|---|---|
| Signed-in dashboard render | Mở session đã đăng nhập trong browser điều khiển được và chụp `/vi/dashboard?tab=courses`. |

## end

Session id: `fidel-dashboard-course-price-parity-20260815-01`

Session status: open

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-backend` |
| Source | `D:\Repositories\starci-academy-backend` |
| Project | `starci-academy` |
| Frontend | `D:\Repositories\starci-academy-fe` |
| Backend | `D:\Repositories\starci-academy-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Skills | `D:\Repositories\starci-academy-backend\.claude\skills` |
| App | `starci-academy` |
| Repo / branch | Backend `D:\Repositories\starci-academy-backend` / `mtp`; Frontend `D:\Repositories\starci-academy-fe` / `main` |
| Purpose | Chạy End proof và quét related bugs cho parity giá dashboard. |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |
| Workflow | `D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\dashboard-course-recommendation-price-parity-20260815-01.md` |
| Language | `vi` |
| Phase | `end` |
| Touching | Workflow record và evidence; related bug cùng boundary đã quay lại feedback trước End. |

Tracked diff identity: `43d6140f11ba8a1d4c036bc7cc1c667cb1ab4cac`

### PROOF

| Gate | Result |
|---|---|
| Focused Jest | pass — `3/3` suites, `9/9` tests. |
| Focused ESLint | pass — zero findings trên sáu file source/spec. |
| Diff check | pass — không có whitespace error. |
| Typecheck | blocked ngoài boundary — dependency `bullmq` đang thiếu ở worker/e2e không liên quan; không có touched pricing path trong lỗi. |
| Controlled browser | blocked — in-app browser mở đúng route nhưng hiện login modal; Chrome browser binding không khả dụng. |

### RELATED BUGS

| Finding | Evidence | Classification | Route |
|---|---|---|---|
| `course-price-preview` dùng `line.displayDiscountPercent`; trước feedback này giá trị chỉ biểu diễn loyalty, không gồm phase discount. | Direct caller scan và source `course-price-preview.service.ts`; canonical quote spec hiện chứng minh full list-to-charge percentage. | `same-boundary` | Đã sửa trong feedback `canonical discovery discount`, rồi rerun End. |
| Checkout handlers dùng `chargedVnd` và checkout-only discount semantics. | Direct call-site scan; checkout quote spec chứng minh resolver test-price vẫn được gọi và discovery resolver không được gọi. | `not-a-bug` | None |

### OUTPUTS

| Concept | Result |
|---|---|
| End-pass | Giá discovery đầy đủ và phần trăm list-to-charge đã được canonical hóa; focused proof xanh. |
| Related-bug verdict | Một finding cùng boundary đã sửa; checkout test-price được xác nhận là hành vi riêng, không phải bug. |

### CHANGES

| Tree | Details |
|---|---|
| `src/modules/bussiness/course-pricing/course-price-calculator.service.ts` | modified — tách full discovery amount khỏi local checkout divisor. |
| `src/modules/bussiness/course-pricing/course-price-quote.service.ts` | modified — route theo intent và canonical hóa discovery discount. |
| `src/features/api/core/graphql/queries/dashboard/recommended-courses/recommended-courses.service.ts` | modified — map list/charged/canonical discount. |
| `src/modules/bussiness/course-pricing/course-price-calculator.service.spec.ts` | modified — proof full discovery amount. |
| `src/modules/bussiness/course-pricing/course-price-quote.service.spec.ts` | modified — proof discovery/checkout separation và total display discount. |
| `src/features/api/core/graphql/queries/dashboard/recommended-courses/recommended-courses.service.spec.ts` | added — proof recommendation mapping. |
| `.workflows/fidel/starci-academy/dashboard-course-recommendation-price-parity-20260815-01.md` | modified — End evidence và related-bug scan. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Không có approval sản phẩm còn chờ. |

### WARNINGS

| Warning | Impact |
|---|---|
| Typecheck dependency drift | Full repository typecheck chưa xanh vì `bullmq` ngoài boundary. |
| Render authentication | Không thể xác nhận after-render signed-in trong browser hiện có. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| FE nhân giá `100` hoặc compact-price variant | Backend discovery quote đầy đủ | FE workaround sẽ sai production semantics. |
| Adapter-specific discount arithmetic | Canonical list-to-charge percentage | Tránh lệch giữa các surface. |

### OWED

| Owed | Cleared by |
|---|---|
| Signed-in localhost render proof | Đăng nhập trong in-app browser hoặc kết nối Chrome rồi chụp dashboard recommendations sau refresh. |
| Full typecheck | Khôi phục dependency `bullmq`, sau đó chạy `npm run typecheck`. |
| Finality | Chỉ chạy sau khi signed-in render proof không còn owed. |
