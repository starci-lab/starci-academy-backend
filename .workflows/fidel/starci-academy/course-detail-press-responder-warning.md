<!-- starci-workflow: v2 -->

# course-detail-press-responder-warning

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
| Repo / branch | D:\Repositories\starci-academy-fe / main @ bdc816b..worktree |
| Purpose | Cô lập và sửa cảnh báo `PressResponder` trên Course Detail mà không đổi hành vi hoặc thiết kế đã duyệt. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-press-responder-warning.md |
| Language | vi |
| Phase | start |
| Touching | Workflow record này; chỉ mở rộng sang exact FE owner sau khi bằng chứng runtime khóa được component. |

Session id: fidel-course-detail-press-responder-warning-20260815-01

Session status: open

### BINDING EVIDENCE

| Field | Value |
|---|---|
| Origin | `http://localhost:3000/vi/courses/fullstack-mastery` |
| Frozen state | Course Detail tải dữ liệu thật; console phát năm cảnh báo `A PressResponder was rendered without a pressable child`. |
| Comparison identity | Cùng route, cùng viewport desktop và source FE tại `bdc816b..worktree`. |
| Success | Reload route không còn cảnh báo; các CTA, tabs và disclosure giữ nguyên tương tác. |

### OUTPUTS

| Concept | Result |
|---|---|
| Session boundary | Runtime warning bounded; chưa giả định owner trước khi trace. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/course-detail-press-responder-warning.md` | added — mở fidelity session và khóa runtime evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã yêu cầu giải quyết toàn bộ blocker; correction chỉ được viết sau khi owner được chứng minh. |

### WARNINGS

| Warning | Impact |
|---|---|
| Warning có thể phát từ shared leaf | Nếu owner dùng ngoài Course Detail, patch phải giữ parity ở mọi call site và proof mở rộng tương ứng. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Đoán pricing rail là owner | Trace runtime và source trước | Cảnh báo không chỉ ra component trong thông báo console. |

### OWED

| Owed | Cleared by |
|---|---|
| Exact owner và correction proof | Source trace, focused test, ESLint, TypeScript và localhost console reload. |

