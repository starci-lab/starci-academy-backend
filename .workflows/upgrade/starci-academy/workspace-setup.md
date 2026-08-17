<!-- starci-workflow: v2 -->

# Workspace project rename: starci-academy

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | C:\Repositories\ac\starci-academy-backend |
| Source | C:\Repositories\ac\starci-academy-backend |
| Project | starci-academy |
| Frontend | C:\Repositories\starci-academy-fe |
| Backend | C:\Repositories\ac\starci-academy-backend |
| Trust | C:\Repositories\ac\starci-academy-backend\.claude |
| Skills | C:\Repositories\ac\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | Source mtp; Frontend main; FE legacy mtp |
| Purpose | Đổi project route cục bộ từ starci-academy-fe thành starci-academy mà không đổi repository target. |
| Workflow root | C:\Repositories\ac\starci-academy-backend\.workflows |
| Workflow | C:\Repositories\ac\starci-academy-backend\.workflows\upgrade\starci-academy\workspace-setup.md |
| Language | vi |
| Phase | plan |
| Touching | .workspace\starci-academy-fe; .workspace\starci-academy; workflow này |

### EVIDENCE

| Claim | Result |
|---|---|
| Source route | `.workspace/starci-academy-fe/` tồn tại với `fe`, `be`, `fe-legacy` |
| Destination collision | `.workspace/starci-academy/` chưa tồn tại |
| Privacy | `.workspace/` đang được Source Git ignore |
| Target identity | Giữ nguyên disk path, Git origin và contract route của cả ba role |

### OUTPUTS

| Concept | Result |
|---|---|
| Project route rename | Chuẩn bị đổi lookup key từ `starci-academy-fe` sang `starci-academy` |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/workspace-setup.md` | added — ghi Plan và evidence |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Yêu cầu trực tiếp đã chỉ rõ tên cũ và tên mới |

### WARNINGS

| Warning | Impact |
|---|---|
| None | Destination không collision |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Chỉ sửa field `project` nhưng giữ folder cũ | Đổi cả folder và identity | `start` tra cứu theo folder project |

### OWED

| Owed | Cleared by |
|---|---|
| Review và Apply | Freeze boundary, migrate folder, refresh configs và chạy `--check` |

## review

Approved revision: workspace-project-rename-v1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | C:\Repositories\ac\starci-academy-backend |
| Source | C:\Repositories\ac\starci-academy-backend |
| Project | starci-academy |
| Frontend | C:\Repositories\starci-academy-fe |
| Backend | C:\Repositories\ac\starci-academy-backend |
| Trust | C:\Repositories\ac\starci-academy-backend\.claude |
| Skills | C:\Repositories\ac\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | Source mtp; Frontend main; FE legacy mtp |
| Purpose | Khóa tên project mới và giữ nguyên ba repository role. |
| Workflow root | C:\Repositories\ac\starci-academy-backend\.workflows |
| Workflow | C:\Repositories\ac\starci-academy-backend\.workflows\upgrade\starci-academy\workspace-setup.md |
| Language | vi |
| Phase | review |
| Touching | .workspace\starci-academy-fe; .workspace\starci-academy; workflow này |

### APPROVED ROUTES

| Role | Disk path | Git repository | Contract |
|---|---|---|---|
| fe | C:\Repositories\starci-academy-fe | https://github.com/starci-lab/starci-academy-fe.git | C:\Repositories\starci-academy-fe\src\components\contracts\index.ts |
| be | C:\Repositories\ac\starci-academy-backend | https://github.com/starci-lab/starci-academy-backend | None |
| fe-legacy | C:\Repositories\starci-academy | https://github.com/starci-lab/starci-academy | None |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved routing revision | `workspace-project-rename-v1` giữ nguyên role targets và đổi project key thành `starci-academy` |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/workspace-setup.md` | modified — append Review |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Direct requirement đã phê duyệt exact rename boundary |

### WARNINGS

| Warning | Impact |
|---|---|
| None | Không có target hoặc collision chưa giải quyết |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Tạo project thứ hai song song | Move route cũ sang route mới | Không để duplicate lookup identity |

### OWED

| Owed | Cleared by |
|---|---|
| Apply | Move folder, refresh config identities và chạy workspace verification |

## apply

Applied revision: workspace-project-rename-v1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | C:\Repositories\ac\starci-academy-backend |
| Source | C:\Repositories\ac\starci-academy-backend |
| Project | starci-academy |
| Frontend | C:\Repositories\starci-academy-fe |
| Backend | C:\Repositories\ac\starci-academy-backend |
| Trust | C:\Repositories\ac\starci-academy-backend\.claude |
| Skills | C:\Repositories\ac\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | Source mtp; Frontend main; FE legacy mtp |
| Purpose | Kích hoạt project route `starci-academy` và loại bỏ lookup folder cũ. |
| Workflow root | C:\Repositories\ac\starci-academy-backend\.workflows |
| Workflow | C:\Repositories\ac\starci-academy-backend\.workflows\upgrade\starci-academy\workspace-setup.md |
| Language | vi |
| Phase | apply |
| Touching | .workspace\starci-academy-fe; .workspace\starci-academy; .claude\common\config\workspace.md; workflow này |

### PROOF

| Check | Result |
|---|---|
| Folder identity | `.workspace/starci-academy-fe` absent; `.workspace/starci-academy` present |
| Role configs | `starci-academy/fe`, `starci-academy/be`, `starci-academy/fe-legacy` written |
| Contract | FE route giữ `C:\Repositories\starci-academy-fe\src\components\contracts\index.ts` |
| Full local check | 5 configs pass: `miamia/{fe,be}` và `starci-academy/{fe,be,fe-legacy}` |
| Alias/privacy | Không tạo `repo`; `.workspace/` vẫn ignored |

### OUTPUTS

| Concept | Result |
|---|---|
| Active project identity | `start starci-academy fe be fe-legacy` là lookup canonical mới |

### CHANGES

| Tree | Details |
|---|---|
| `.workspace/starci-academy-fe/` → `.workspace/starci-academy/` | renamed — refresh ba role config với project `starci-academy` |
| `.claude/common/config/workspace.md` | modified — đổi ví dụ start và config paths sang project mới |
| `.workflows/upgrade/starci-academy/workspace-setup.md` | modified — append Apply và proof |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Exact rename đã hoàn tất |

### WARNINGS

| Warning | Impact |
|---|---|
| BE và FE legacy không có primary contract | Giữ `null`; không bịa contract route |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Giữ duplicate folder cũ | Chỉ giữ `.workspace/starci-academy` | Một project chỉ có một lookup identity |

### OWED

| Owed | Cleared by |
|---|---|
| None | Workspace verification đã pass |
