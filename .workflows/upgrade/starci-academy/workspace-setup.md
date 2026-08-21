<!-- starci-workflow: v2 -->

# Workspace setup — starci-academy

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | C:/Repositories/ac/starci-academy-backend |
| Source | C:/Repositories/ac/starci-academy-backend |
| Project | starci-academy |
| Frontend | C:/Repositories/starci-academy-fe |
| Backend | C:/Repositories/ac/starci-academy-backend |
| Trust | C:/Repositories/ac/starci-academy-backend/.claude |
| Skills | C:/Repositories/ac/starci-academy-backend/.claude/skills |
| App | starci-academy |
| Repo / branch | FE main; BE mtp |
| Purpose | Refresh FE và BE workspace metadata sau khi pull. |
| Workflow root | C:/Repositories/ac/starci-academy-backend/.workflows |
| Workflow | C:/Repositories/ac/starci-academy-backend/.workflows/upgrade/starci-academy/workspace-setup.md |
| Language | vi |
| Phase | plan |
| Touching | Workflow này và .workspace/starci-academy/{fe,be}/config.json. |

Hai route đã tồn tại và trỏ đúng checkout/origin. Chỉ `repository.head` cũ: FE đang
`d73d5ccb0053d6bf8d630c1fbd56ddf002ef6f0f`, BE đang
`0ed7b7bc8e1bcd8c7dc684856f2a15ed798ad57b`. FE contract tồn tại tại
`src/components/contracts/index.ts`; `.workspace/` đã được Source ignore.

### OUTPUTS

| Concept | Result |
|---|---|
| Refresh plan | Giữ nguyên hai route, refresh Git evidence và kiểm tra lại toàn workspace. |

### CHANGES

| Tree | Details |
|---|---|
| This workflow | Added Plan evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Lệnh `start fe be starci` trực tiếp cho phép refresh hai route local đã khai báo. |

### WARNINGS

| Warning | Impact |
|---|---|
| Config HEAD cũ sau pull | Context Git không chính xác nếu không refresh. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | Không có collision hoặc route suy đoán. |

### OWED

| Owed | Cleared by |
|---|---|
| Refresh và verify | Review rồi Apply deterministic script. |

## review

Approved revision: `workspace-refresh-20260821`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | C:/Repositories/ac/starci-academy-backend |
| Source | C:/Repositories/ac/starci-academy-backend |
| Project | starci-academy |
| Frontend | C:/Repositories/starci-academy-fe |
| Backend | C:/Repositories/ac/starci-academy-backend |
| Trust | C:/Repositories/ac/starci-academy-backend/.claude |
| Skills | C:/Repositories/ac/starci-academy-backend/.claude/skills |
| App | starci-academy |
| Repo / branch | FE main; BE mtp |
| Purpose | Freeze exact existing routes and current Git evidence. |
| Workflow root | C:/Repositories/ac/starci-academy-backend/.workflows |
| Workflow | C:/Repositories/ac/starci-academy-backend/.workflows/upgrade/starci-academy/workspace-setup.md |
| Language | vi |
| Phase | review |
| Touching | Workflow này và .workspace/starci-academy/{fe,be}/config.json. |

Revision giữ nguyên project, roles, disk paths, origins, instruction routes, manifests và FE
contract. Apply chỉ refresh schema-valid metadata trong ignored `.workspace`.

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `workspace-refresh-20260821` |

### CHANGES

| Tree | Details |
|---|---|
| This workflow | Added Review evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Boundary không mở rộng ngoài hai route local. |

### WARNINGS

| Warning | Impact |
|---|---|
| None | Paths, origins, branches, manifest và contract đều tồn tại. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | Không có proposal bị từ chối. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply và check | Chạy bundled setup script. |

## apply

Applied revision: `workspace-refresh-20260821`
Baseline commit: `0ed7b7bc8e1bcd8c7dc684856f2a15ed798ad57b`
Tracked diff: `0ed7b7bc8e1bcd8c7dc684856f2a15ed798ad57b..worktree`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | C:/Repositories/ac/starci-academy-backend |
| Source | C:/Repositories/ac/starci-academy-backend |
| Project | starci-academy |
| Frontend | C:/Repositories/starci-academy-fe |
| Backend | C:/Repositories/ac/starci-academy-backend |
| Trust | C:/Repositories/ac/starci-academy-backend/.claude |
| Skills | C:/Repositories/ac/starci-academy-backend/.claude/skills |
| App | starci-academy |
| Repo / branch | FE main; BE mtp |
| Purpose | Apply và xác minh context FE+BE hiện hành. |
| Workflow root | C:/Repositories/ac/starci-academy-backend/.workflows |
| Workflow | C:/Repositories/ac/starci-academy-backend/.workflows/upgrade/starci-academy/workspace-setup.md |
| Language | vi |
| Phase | apply |
| Touching | Workflow này và .workspace/starci-academy/{fe,be}/config.json. |

Bundled script đã ghi thành công `starci-academy/fe` và `starci-academy/be`. FE route giữ contract
explicit, phát hiện target `AGENTS.md`/`CLAUDE.md`, và ghi HEAD `d73d5ccb0053`; BE route ghi HEAD
`0ed7b7bc8e1b`. Cả hai instruction sets, manifests và FE contract đã được load. Global check dừng ở
route ngoài phạm vi `miamia/be` vì metadata HEAD cũ; không sửa MiA trong task StarCi này.

### OUTPUTS

| Concept | Result |
|---|---|
| Active context | `starci-academy` FE+BE đã resolve và load theo đúng bootstrap. |
| Route freshness | Hai StarCi role phản ánh đúng checkout sau pull. |

### CHANGES

| Tree | Details |
|---|---|
| `.workspace/starci-academy/fe/config.json` | Modified — refreshed Git evidence and discovered target instructions. |
| `.workspace/starci-academy/be/config.json` | Modified — refreshed Git evidence. |
| This workflow | Added Plan, Review and Apply evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | StarCi context sẵn sàng. |

### WARNINGS

| Warning | Impact |
|---|---|
| Global workspace check gặp stale `miamia/be` | Không ảnh hưởng hai route StarCi; chỉ làm check toàn bộ workspace chưa xanh. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Tự sửa route MiA | Giữ nguyên MiA và báo warning | Nó nằm ngoài project/roles được yêu cầu. |

### OWED

| Owed | Cleared by |
|---|---|
| Refresh `miamia/be` nếu cần global check xanh | Chạy `starci-setup-workspace` riêng cho project `miamia`. |
