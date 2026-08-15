<!-- starci-workflow: v2 -->

## start

Session id: `catalog-card-typography-20260815-01`

Session status: open

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
| Repo / branch | D:\Repositories\starci-academy-fe / main @ `1392cdcd15cde00b1662f7e1d449ae908789e2b2` |
| Purpose | Đồng bộ toàn bộ typography của course catalog card theo scale đã chốt, không thay hierarchy hoặc CTA. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\catalog-card-typography-20260815-01.md |
| Language | vi |
| Phase | start |
| Touching | `src/components/blocks/courses/CourseCatalogCard/component.tsx`, focused catalog tests nếu cần, workflow file này. |

### BINDING EVIDENCE

| Evidence | Frozen value |
|---|---|
| User instruction | “sửa hết đi” trên ảnh crop toàn bộ course-card fact cluster. |
| Screenshot | `C:\Users\Hi\AppData\Local\Temp\codex-clipboard-031cd2e7-7409-4d48-ac32-0f1671fcc441.png` |
| Existing typography decision | Dominant large-card title giữ `text-base`; compact peer title `text-sm font-medium`; body/metadata/value `text-sm`; restricted `text-xs` chỉ dùng cho supporting caption. |
| Frozen runtime | `http://localhost:3000/vi/courses`, desktop, light theme, catalog fixture `System Design Mastery`, grid state. |
| Measured before | title 16/600; enrolment 12/400 muted; current price 14/600; original price 12/400 muted; savings 12/400 muted; price-detail 12/500; highlights 14/500; promise 14/400. |

### OUTPUTS

| Concept | Result |
|---|---|
| Active correction | Course-card fact cluster will use one coherent body scale while preserving title/KPI/highlight hierarchy. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/catalog-card-typography-20260815-01.md` | added — opened bounded fidelity session and froze comparison state. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | The explicit screenshot and prior typography rule settle this small patch. |

### WARNINGS

| Warning | Impact |
|---|---|
| Semantic course title is an actual level-2 heading whose weight is owned globally by `Heading` | This bounded patch will not break the document outline or silently change every H2 in the application. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | No feedback revision yet. |

### OWED

| Owed | Cleared by |
|---|---|
| Production correction and same-state after proof | Patch owner, run focused gates, reload localhost and measure the same nodes. |
| User acceptance | User confirms the corrected card. |

## feedback

Session id: `catalog-card-typography-20260815-01`

Session status: open

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
| Repo / branch | D:\Repositories\starci-academy-fe / main @ `1392cdcd15cde00b1662f7e1d449ae908789e2b2` |
| Purpose | Phân biệt lỗi typography thật với ảnh crop/phóng lớn trước khi thay shared pricing contracts. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\catalog-card-typography-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | Workflow evidence only; production experiment đã được thu hồi hoàn toàn. |

### MEASURED FINDING

| Node | Runtime metric | Current canonical role |
|---|---|---|
| Course title | 16px / 600, semantic H2 | Level-2 heading; size/weight owned together. |
| Learner count | 12px / 400 muted | Secondary fact qualifying the title. |
| Payable price | 14px / 600 | Primary commerce fact. |
| Original price | 12px / 400 muted + superseded | Supporting qualifier of payable price. |
| Savings + price detail | 12px / 400 and 12px / 500 | Joined supporting caption beneath price. |
| Highlights title | 14px / 500 | Compact peer title. |
| Promise content | 14px / 400 | Ordinary content. |

### OUTPUTS

| Concept | Result |
|---|---|
| Fidelity diagnosis | The measured live card already matches the current shared typography contracts; the crop alone does not identify which semantic rank the user wants changed. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/catalog-card-typography-20260815-01.md` | modified — recorded exact live metrics and blocked interpretation. |

### NEED APPROVALS

| Question | Options |
|---|---|
| “Sửa hết” refers to which boundary? | Specify the visual target for the card typography, or confirm it means the three prior Apply OWED items: FE lint, BE lint and live Sign out. |

### WARNINGS

| Warning | Impact |
|---|---|
| `price-discount-line` and `price-note-row` are shared by catalog, recommended rows, cart, mobile enroll bar and pricing rail | Changing the crop's small facts without a precise intended rank silently changes multiple products. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Promote every 12px supporting fact in the crop to 14px | Preserve the current source until the intended semantic rank is explicit. | It conflicts with `TYPE-5`, `TYPE-7` and the shared contract `why`, and the screenshot has no annotation naming this change. |

### OWED

| Owed | Cleared by |
|---|---|
| Exact correction boundary | User identifies whether this is card typography or the prior Apply's three blockers; if typography, name the line(s) that should change or the desired scale. |
