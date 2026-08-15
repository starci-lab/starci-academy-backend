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
| Repo / branch | D:\Repositories\starci-academy-backend / mtp |
| Purpose | Khóa canonical local origin trước live Fidelity proof. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\fidelity-canonical-local-origin.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow upgrade này. |

Window: hai Fidelity records StarCi có live-origin rejection.

### Witnesses

| Refusal | Rule gap | Proposed home |
|---|---|---|
| `fidel/starci-academy/courses-auth-redirect-and-nav-icon.md`: từ chối sửa catalog fallback; dùng canonical local origin vì localhost trả 5 courses. | Fidelity Start chưa bắt resolve exact local origin từ runtime contract trước browser proof. | Fidelity Start PROCESS. |
| `fidel/starci-academy/course-detail-ownership-and-rail.md`: từ chối `127.0.0.1:3000`, thay bằng `localhost:3000` sau user correction và live proof. | Skill không nói `localhost` và `127.0.0.1` là hai origins khác nhau đối với CORS/auth/storage. | Fidelity Start PROCESS. |

### OUTPUTS

| Concept | Result |
|---|---|
| Local-origin rule | Resolve và dùng exact app origin trước live proof; không đổi hostname theo tiện tay. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/fidelity-canonical-local-origin.md` | added — Plan witnesses. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User correction trực tiếp đã chốt localhost cho app này. |

### WARNINGS

| Warning | Impact |
|---|---|
| Rule phải generic, không hardcode StarCi localhost cho mọi project. | Resolve từ runtime/config/HANDOFF của từng Project. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Hardcode `localhost` globally | Resolve exact canonical origin per Project | Shared skill phục vụ nhiều app/runtime. |

### OWED

| Owed | Cleared by |
|---|---|
| Review exact wording/test/boundary | Review dưới đây. |

## review

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
| Repo / branch | D:\Repositories\starci-academy-backend / mtp |
| Purpose | Approve generic exact-origin rule và test obligation. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\fidelity-canonical-local-origin.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow upgrade này. |

Approved revision: fidelity-canonical-origin-v1
Approval evidence: User correction “không chạy localhost lỗi cors đó”.

### Review verdict

| Approved wording | Home | Test | Write boundary | Status |
|---|---|---|---|---|
| Before live local proof, resolve the Project's canonical app origin from runtime/config evidence and use that exact scheme, hostname and port. Never treat `localhost` and `127.0.0.1` as interchangeable for CORS, auth, cookies or storage. A static proposal URL is not app-origin evidence. | Fidelity Start PROCESS | Skill test asserts canonical origin and hostname distinction. | Fidelity Start SKILL + skill test | APPROVED |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `fidelity-canonical-origin-v1`. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/fidelity-canonical-local-origin.md` | modified — approved Review. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User explicitly corrected runtime origin. |

### WARNINGS

| Warning | Impact |
|---|---|
| None | None |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Static preview host as live app proof | Runtime-declared app origin | Preview may not exercise CORS/auth. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply and tests | Upgrade Apply. |

## apply

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
| Repo / branch | D:\Repositories\starci-academy-backend / mtp |
| Purpose | Apply exact-origin rule và prove trust/live browser. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\fidelity-canonical-local-origin.md |
| Language | vi |
| Phase | apply |
| Touching | Fidelity Start SKILL, skill test và workflow upgrade này. |

Applied revision: fidelity-canonical-origin-v1

### Verification

| Gate | Result |
|---|---|
| Browser | `http://localhost:3000/vi/courses` tải 5 courses; failure text absent. |
| Skill validation | UTF-8 quick validation pass. |
| Focused skill tests | 13/13 pass. |
| Full trust tests | 188/188 pass. |
| Diff check | pass. |

### OUTPUTS

| Concept | Result |
|---|---|
| Canonical local origin | Fidelity Start bắt buộc resolve exact scheme/hostname/port; localhost và 127 không interchangeable. |
| Static preview distinction | Preview host không được dùng làm bằng chứng cho app CORS/auth origin. |

### CHANGES

| Tree | Details |
|---|---|
| `.claude/skills/starci-fe-fidelity-start/SKILL.md` | modified — thêm canonical local-origin rule. |
| `.claude/sources/skills.test.mjs` | modified — thêm regression assertions cho hostname distinction. |
| `.workflows/upgrade/starci-academy/fidelity-canonical-local-origin.md` | modified — Plan, Review, Apply evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Rule và browser correction đã applied. |

### WARNINGS

| Warning | Impact |
|---|---|
| None | None |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `127.0.0.1` live app origin | Runtime-declared `localhost` | CORS/auth/storage origin mismatch. |

### OWED

| Owed | Cleared by |
|---|---|
| None | None |
