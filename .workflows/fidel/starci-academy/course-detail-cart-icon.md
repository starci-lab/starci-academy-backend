<!-- starci-workflow: v2 -->

# course-detail-cart-icon

## start

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
| Purpose | Linked continuation để bỏ decorative icon khỏi Add/Remove Cart trong pricing rail. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-cart-icon.md |
| Language | vi |
| Phase | start |
| Touching | CoursePricingRail component/test và workflow record này. |

Session id: fidel-course-detail-cart-icon-20260815-01

Session status: open

Continuation of: fidel-course-detail-ownership-20260815-01

### OUTPUTS

| Concept | Result |
|---|---|
| Frozen correction | Add/Remove Cart giữ nguyên text, state và handler; decorative cart/close icon bị loại bỏ. |
| Comparison identity | Live Course Detail pricing rail tại `http://localhost:3000/vi/courses/fullstack-mastery`. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/blocks/courses/CoursePricingRail/component.tsx` | Cart action không còn truyền icon. |
| `src/components/blocks/courses/CoursePricingRail/component.test.tsx` | Khóa invariant Add/Remove Cart không render SVG. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã chỉ định exact bounded correction. |

### WARNINGS

| Warning | Impact |
|---|---|
| Pricing rail creative redesign là Design Plan riêng | Continuation này không chọn trước layout/CTA concept. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Append feedback vào finalized session cũ | Linked continuation workflow | Finality của session cũ là bất biến. |

### OWED

| Owed | Cleared by |
|---|---|
| Fidelity End / Finality | Chỉ khi user yêu cầu đóng linked continuation này. |

## feedback

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
| Purpose | Ghi proof cho text-only Cart action sau bounded correction. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-cart-icon.md |
| Language | vi |
| Phase | feedback |
| Touching | Evidence only sau production patch đã freeze. |

Session id: fidel-course-detail-cart-icon-20260815-01

Session status: open

Continuation of: fidel-course-detail-ownership-20260815-01

### OUTPUTS

| Concept | Result |
|---|---|
| Focused tests | CoursePricingRail + CourseDetailPage: 12 tests pass. |
| Static gates | Focused ESLint pass; TypeScript `--noEmit` pass. |
| Localhost render | `Thêm vào giỏ hàng` found on Course Detail with 0 descendant SVG. |

### CHANGES

| Tree | Details |
|---|---|
| Production | No further write after proof. |
| Workflow | Recorded linked continuation identity and localhost evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Cart icon removal is implemented and proved. |

### WARNINGS

| Warning | Impact |
|---|---|
| Creative rail composition remains undecided | User must select Design Plan direction before Review/Apply. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Clicking live cart mutation during visual proof | Read-only DOM assertion | User asked for visual removal, not a cart state mutation. |

### OWED

| Owed | Cleared by |
|---|---|
| Session closure | Fidelity End then Finality only when requested. |
