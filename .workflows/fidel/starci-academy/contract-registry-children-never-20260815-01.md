<!-- starci-workflow: v2 -->

# Contract registry ChildrenOf never repair

## start

Session id: contract-registry-children-never-20260815-01

Session status: open

Continuation of: global-search-modal-spacing-listbox-20260815-01

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
| Repo / branch | FE `D:\Repositories\starci-academy-fe` / `main`; BE `D:\Repositories\starci-academy-backend` / `mtp` |
| Purpose | Khôi phục contract inference để `ChildrenOf` không còn rơi về `never`, rồi chứng minh full typecheck/build. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\contract-registry-children-never-20260815-01.md |
| Language | vi |
| Phase | start |
| Touching | Candidate FE `src/components/contracts/index.ts` và focused contract/type tests; workflow evidence. Không mở sang callers trước root-cause scan. |

User request: “Sửa lỗi nền contract registry khiến ChildrenOf = never, rồi chạy full typecheck/build.”

Binding evidence: full `tsc/build` hiện thất bại đầu tiên tại `plugins/type-tests/surface-list.tsx` vì contract key/children suy ra `never` và cascade qua toàn bộ `defineContractComponent` callers.

### REFERENCE OWNER CLOSURE

| Reference | Concrete owner / contract | Same-purpose candidates | Verdict | Interaction-host difference |
|---|---|---|---|---|
| Type-safe contract registry | `src/components/contracts/index.ts` / `LayoutClassName`, `buildContracts`, `ChildrenOf` | Contract callers chỉ là consumers của registry | reuse | Không có interaction-host difference; sửa owner registry, không patch hàng trăm caller. |

### OUTPUTS

| Concept | Result |
|---|---|
| Active correction | Đo và sửa root contract-registry inference thay vì cast/suppress hoặc sửa cascade callers. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/contract-registry-children-never-20260815-01.md` | `added` — continuation context, binding evidence và candidate boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã trực tiếp yêu cầu sửa và chạy full gates. |

### WARNINGS

| Warning | Impact |
|---|---|
| Source backend có concurrent changes ngoài task. | Chỉ workflow mới được ghi ở Source; không stage/commit concurrent files. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Cast `never`, `any` hoặc sửa từng caller | Repair registry owner | Cascade callers không phải root cause. |

### OWED

| Owed | Cleared by |
|---|---|
| Exact root cause | Full typecheck diagnostics + registry class/contract scan. |
| Full proof | `npm run typecheck` và `npm run build` pass without suppression. |
| User acceptance | User xác nhận correction đạt trước End/Finality. |

## feedback

Session id: contract-registry-children-never-20260815-01

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
| Repo / branch | FE `D:\Repositories\starci-academy-fe` / `main`; BE `D:\Repositories\starci-academy-backend` / `mtp` |
| Purpose | Ghi root cause, correction và full proof cho lỗi `ChildrenOf = never`. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\contract-registry-children-never-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | FE `src/components/contracts/index.ts`, `src/components/blocks/courses/CoursePricingRail/component.test.tsx`; workflow evidence. |

Root cause: contract `price-note-row` đã dùng hai class có chủ đích là `flex-nowrap` và `[&>*]:whitespace-nowrap`, nhưng closed vocabulary `LayoutClassName` chưa khai báo chúng. Vì toàn bộ literal table được self-check qua generic `buildContracts`, một entry sai làm inference của registry sụp và khiến `ChildrenOf<K>` cascade thành `never` ở consumers.

### REFERENCE OWNER CLOSURE

| Reference | Concrete owner / contract | Same-purpose candidates | Verdict | Interaction-host difference |
|---|---|---|---|---|
| Allowed layout vocabulary | `src/components/contracts/index.ts` / `LayoutClassName` | `price-note-row` và mọi `defineContractComponent` consumer | alter-contract | Hai class là layout contract hợp lệ đã được production contract dùng; bổ sung vào vocabulary, không cast hoặc nới thành `string`. |
| Price-note render proof | `CoursePricingRail/component.test.tsx` | Không tạo test harness mới | reuse | Existing render test là owner gần nhất và nay khóa cả `flex-nowrap` lẫn child nowrap. |

### OUTPUTS

| Concept | Result |
|---|---|
| Registry inference | Restored; full TypeScript graph không còn cascade `ChildrenOf = never`. |
| Contract strictness | Preserved; `LayoutClassName` vẫn là closed union, chỉ thêm đúng hai giá trị production đang dùng. |
| Caller boundary | Không caller nào bị cast, suppress hoặc sửa workaround. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/contracts/index.ts` | `updated` — thêm `flex-nowrap` và `[&>*]:whitespace-nowrap` vào closed `LayoutClassName`. |
| `src/components/blocks/courses/CoursePricingRail/component.test.tsx` | `updated` — khóa render contract cho child nowrap cùng existing no-wrap assertion. |
| `.workflows/fidel/starci-academy/contract-registry-children-never-20260815-01.md` | `updated` — ghi root cause, exact boundary và proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Correction đã được user yêu cầu trực tiếp; session vẫn mở để nhận acceptance trước End/Finality. |

### WARNINGS

| Warning | Impact |
|---|---|
| Next build cảnh báo convention `middleware` deprecated, nên chuyển sang `proxy`. | Không liên quan correction và không làm fail build. |
| Source backend có concurrent changes ngoài task. | Không stage/commit bất kỳ file concurrent nào. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Đổi `LayoutClassName` thành `string` | Thêm hai literal hợp lệ | Giữ compile-time contract gate. |
| Cast contract table hoặc patch `ChildrenOf` | Sửa invalid registry entry vocabulary | Cast chỉ che root cause và làm mất trust. |
| Sửa cascade callers | Không chạm callers | Consumers không sai. |

### OWED

| Owed | Cleared by |
|---|---|
| Exact root cause | Cleared: diagnostics quy về hai class thiếu trong `LayoutClassName`. |
| Focused render proof | Cleared: CoursePricingRail 7/7 assertions/tests pass. |
| Focused lint | Cleared: ESLint pass; chỉ có repo-level React-version warning. |
| Full typecheck | Cleared: `npm run typecheck` exit 0. |
| Full build | Cleared: `npm run build` exit 0, static generation và post-compile hook pass. |
| User acceptance | User xác nhận correction đạt trước End/Finality. |
