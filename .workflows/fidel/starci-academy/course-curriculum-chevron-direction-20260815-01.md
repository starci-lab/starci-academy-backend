<!-- starci-workflow: v2 -->

# Course curriculum disclosure chevron direction

## start

Session id: `fidel-course-curriculum-chevron-20260815-01`

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
| Purpose | Sửa chevron curriculum module cùng màu foreground với title và xoay đúng 90 độ khi mở. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-curriculum-chevron-direction-20260815-01.md |
| Language | vi |
| Phase | start |
| Touching | `src/components/leaves/CurriculumModuleRow/index.tsx`, `src/components/leaves/CurriculumModuleRow/index.test.tsx`, workflow này. |

### BINDING EVIDENCE

| Field | Frozen value |
|---|---|
| Request | Chevron màu cam không cùng màu text và đang quay ngược; phải dùng foreground và mở xoay 90 độ. |
| Reference | `codex-clipboard-4e4ba0b8-31a6-4f38-8939-418cc198c96a.png`. |
| Live route | `http://localhost:3000/vi/courses/1ab239c8-ebb5-53ee-b255-dc7839a6b959` |
| Frozen state | Desktop, locale `vi`, light theme, System Design Mastery, curriculum module đầu tiên expanded. |
| Baseline identity | FE `HEAD cd7f7ae66de937dd19065af3e1c84c8d866e86c4`; CurriculumModuleRow source và test clean trước correction. |
| Related session | `fidel-course-pricing-trial-phase-20260815-01` — phase label correction tiếp tục ở session đó; curriculum chevron có owner riêng. |

### OUTPUTS

| Concept | Result |
|---|---|
| Active correction | ChevronRight của module kế thừa foreground; closed hướng phải, open xoay 90 độ hướng xuống. |
| Session | Mở và sửa ngay theo feedback binding. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-curriculum-chevron-direction-20260815-01.md` | added — freeze comparison identity và exact write boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Màu và hướng đã được chỉ rõ. |

### WARNINGS

| Warning | Impact |
|---|---|
| Existing implementation uses `group-open:rotate-180` and `text-muted`. | Đây là measured delta cần sửa; không thay disclosure ownership. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Muted chevron xoay 180 độ | Foreground chevron xoay 90 độ | Thầy chỉ rõ icon lệch màu và quay ngược. |

### OWED

| Owed | Cleared by |
|---|---|
| Production correction và focused proof | Patch CurriculumModuleRow, test, lint và localhost computed style. |
| User acceptance | Feedback tiếp theo hoặc Fidelity End sau khi thầy xác nhận. |

## feedback r1

Session id: `fidel-course-curriculum-chevron-20260815-01`

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
| Purpose | Prove curriculum chevron foreground parity và đúng hướng mở. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-curriculum-chevron-direction-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | Chỉ `CurriculumModuleRow`, focused test và workflow này. |

### OUTPUTS

| Concept | Result |
|---|---|
| Closed | Heroicons ChevronRight dùng `text-foreground`, `rotate: none/0deg`. |
| Open | Native details vẫn giữ semantics; state đồng bộ qua `onToggle`, chevron nhận `rotate: 90deg`. |
| Color proof | Computed icon color và title color cùng `lab(8.37524 0.504933 -0.0534832)`. |
| Automated proof | Curriculum tests nằm trong gate 4 files / 18 tests pass; focused ESLint pass. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-fe\src\components\leaves\CurriculumModuleRow\index.tsx` | modified — controlled open state, foreground chevron và 90-degree rotation. |
| `D:\Repositories\starci-academy-fe\src\components\leaves\CurriculumModuleRow\index.test.tsx` | modified — khóa closed/open classes và icon presence. |
| Workflow | modified — append feedback r1 cùng computed-style proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Màu và hướng đã đúng binding. |

### WARNINGS

| Warning | Impact |
|---|---|
| CSS Transform Level 2 báo góc ở property `rotate`, còn `transform` là `none`. | Live proof đọc đúng `rotate: 90deg`; đây không phải lỗi render. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Chỉ dùng `group-open` mà không đối chiếu computed style | State-driven `rotate-90` và live proof | Variant cũ không cho bằng chứng render đáng tin cậy trong lần kiểm tra đầu. |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance | Feedback tiếp theo trong session mở. |
| Fidelity End | Chỉ chạy khi thầy yêu cầu. |
