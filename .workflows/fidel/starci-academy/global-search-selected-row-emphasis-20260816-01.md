<!-- starci-workflow: v2 -->

# Global Search selected row emphasis repair

## start

Session id: global-search-selected-row-emphasis-20260816-01

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
| Repo / branch | FE `D:\Repositories\starci-academy-fe` / `main` at `38d19d2c0b5bd529713718a8284df25ff0039224`; BE `D:\Repositories\starci-academy-backend` / `mtp` |
| Purpose | Giữ selected scope row ổn định khi hover và đồng bộ màu label/fact với icon. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\global-search-selected-row-emphasis-20260816-01.md |
| Language | vi |
| Phase | start |
| Touching | FE `src/components/leaves/Text/index.tsx`, `src/components/leaves/Text/index.test.tsx`, `src/components/leaves/SelectionList/index.tsx`, `src/components/leaves/SelectionList/index.test.tsx`; workflow evidence. |

User feedback: “click vào không có hover effect, text = màu icon chứ”.

Binding evidence: ảnh desktop light tại `http://localhost:3000/vi/dashboard` cho thấy selected scope icon lấy `text-accent-soft-foreground` từ interaction host nhưng label/fact bị `Text.parentEmphasis` ghi đè thành `text-accent-soft`; selected row vẫn có hover recipe riêng.

### REFERENCE OWNER CLOSURE

| Reference | Concrete owner / contract | Same-purpose candidates | Verdict | Interaction-host difference |
|---|---|---|---|---|
| Selected scope row | `SelectionList` variant `scopes` | Không tạo row riêng trong `GlobalSearchOverlay` | reuse | `SelectionList` tiếp tục sở hữu selected/hover host. |
| Icon-label-fact color response | `Text.parentEmphasis="accent-soft"` qua `IconLabelFactRow` recipe `compact-action` | Icon dùng `currentColor` từ cùng host | alter-generic | Parent emphasis phải giữ hover cho unselected nhưng selected text phải dùng đúng selected foreground như icon. |

### OUTPUTS

| Concept | Result |
|---|---|
| Active correction | Selected row không đổi visual khi hover; label và trailing fact cùng selected foreground với icon. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/global-search-selected-row-emphasis-20260816-01.md` | `added` — continuation context, binding screenshot và exact owner boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Feedback trực tiếp khóa expected result. |

### WARNINGS

| Warning | Impact |
|---|---|
| GraphQL requests trong ảnh đang fail/pending. | Không ảnh hưởng proof cho local interaction styling; data-path không nằm trong correction này. |
| Source backend có concurrent changes ngoài task. | Chỉ workflow này được ghi tại Source. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Style riêng trong `GlobalSearchOverlay` | Sửa generic Text/SelectionList owner | Overlay chỉ truyền data, không sở hữu row visual contract. |

### OWED

| Owed | Cleared by |
|---|---|
| Production correction | Exact bounded edit tại Text và SelectionList owners. |
| Focused proof | Text + SelectionList + GlobalSearchOverlay tests, focused lint/typecheck và live render. |
| User acceptance | User xác nhận correction đạt trước End/Finality. |

## feedback

Session id: global-search-selected-row-emphasis-20260816-01

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
| Purpose | Ghi correction và proof cho selected scope row emphasis. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\global-search-selected-row-emphasis-20260816-01.md |
| Language | vi |
| Phase | feedback |
| Touching | FE `src/components/leaves/Text/index.tsx`, `src/components/leaves/Text/index.test.tsx`, `src/components/leaves/SelectionList/index.tsx`, `src/components/leaves/SelectionList/index.test.tsx`; workflow evidence. |

Correction: `parentEmphasis="accent-soft"` vẫn đổi unselected copy sang `text-accent-soft` khi hover, nhưng selected và selected+hover đều khóa `text-accent-soft-foreground`. Scope interaction host đồng thời khóa selected+hover background về `bg-accent-soft`. Vì icon dùng `currentColor` của cùng host, icon, label và fact nay đồng màu ở selected state.

### REFERENCE OWNER CLOSURE

| Reference | Concrete owner / contract | Same-purpose candidates | Verdict | Interaction-host difference |
|---|---|---|---|---|
| Selected scope host | `SelectionList` variant `scopes` | Global Search overlay caller | reuse | Host khóa selected+hover background; overlay không nhận styling prop. |
| Parent-responsive text | `Text.parentEmphasis="accent-soft"` | `IconLabelFactRow` compact-action consumers | alter-generic | Unselected hover và selected emphasis là hai states của cùng generic response, không phải hai row components. |

### OUTPUTS

| Concept | Result |
|---|---|
| Selected visual stability | Selected background và copy không đổi khi hover. |
| Shared color | Selected label/fact dùng `accent-soft-foreground`, đúng token icon đang kế thừa. |
| Regression boundary | Unselected hover vẫn dùng `accent-soft`; không làm mất hover affordance của row chưa chọn. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/leaves/Text/index.tsx` | `modified` — phân biệt unselected-hover với selected/selected-hover parent emphasis. |
| `src/components/leaves/Text/index.test.tsx` | `modified` — khóa selected và selected-hover foreground classes. |
| `src/components/leaves/SelectionList/index.tsx` | `modified` — selected+hover giữ `bg-accent-soft`. |
| `src/components/leaves/SelectionList/index.test.tsx` | `modified` — khóa background và text state contract. |
| `.workflows/fidel/starci-academy/global-search-selected-row-emphasis-20260816-01.md` | `modified` — correction và proof evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Không còn quyết định implementation. |

### WARNINGS

| Warning | Impact |
|---|---|
| In-app browser local bị chuyển sang auth screen sau hydration; Chrome session trong ảnh không kết nối được với browser controller. | Không có authenticated after screenshot trong turn này; exact CSS emission và component state tests thay thế proof path, user acceptance vẫn OWED. |
| Next build cảnh báo convention `middleware` deprecated. | Không liên quan correction, build vẫn pass. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Bỏ toàn bộ hover behavior | Chỉ selected state triệt hover delta | Row chưa chọn vẫn cần hover affordance; feedback nhắm row sau khi click. |
| Cho label dùng `text-accent-soft` khi selected | Dùng `text-accent-soft-foreground` | Phải bằng màu icon trong selected host. |

### OWED

| Owed | Cleared by |
|---|---|
| Focused tests | Cleared: 4 files, 14/14 pass. |
| Focused lint | Cleared: exit 0; chỉ repo-level React-version warning. |
| Full typecheck | Cleared: `npm run typecheck` exit 0. |
| Full production build | Cleared: `npm run build` exit 0; generated CSS chứa selected+hover background và selected+hover foreground selectors. |
| Authenticated visual acceptance | User reload signed-in Chrome state và xác nhận; chỉ mở correction tiếp nếu render còn lệch. |
