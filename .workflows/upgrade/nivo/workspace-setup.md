<!-- starci-workflow: v2 -->

## plan r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Repo / branch | FE `main` @ `019947bceed096ee5949216c82e99a41943a4fb5`; BE `main` @ `74604ff863f5d216b386af27e4b4861486d27217` |
| Purpose | Tạo local workspace routing cho hai target Nivo đã được owner khai báo và duyệt trong feature workflow. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\nivo\workspace-setup.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\upgrade\nivo\workspace-setup.md và D:\Repositories\starci-academy-backend\.workspace\nivo\; không sửa target source. |
| Context receipt | v1 |
| Workspace context | `.workspace/nivo/be/config.json` và `.workspace/nivo/fe/config.json` chưa tồn tại; đây là route đang được tạo. |
| Internal context | `.claude/common/config/INDEX.md`, `workspace.md`, `.claude/contexts/{INDEX,internal,external,authority}.md`, `.claude/skill-shape.md`, `starci-setup-workspace/SKILL.md` — đã đọc đầy đủ. |
| External context | Git root/origin/branch/HEAD và manifests đọc trực tiếp tại `D:\Repositories\nivo-fe` và `D:\Repositories\nivo-backend`; approved feature workflow `academy-langchain-rag.md`. |
| Context conflicts | None |
| Context missing | Route local chưa tồn tại; Apply của phase này sẽ tạo. FE không có contract canonical tại đường dẫn discovery ưu tiên nên route contract được để null. |

### ROUTE PLAN

| Role | Disk path | Git repository | Context |
|---|---|---|---|
| `fe` | `D:\Repositories\nivo-fe` | `https://github.com/starci-lab/nivo-fe.git` | `package.json`, `package-lock.json`; không phát hiện target instruction hoặc canonical contract. |
| `be` | `D:\Repositories\nivo-backend` | `https://github.com/starci-lab/nivo-backend.git` | `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`; không phát hiện target instruction. |

### OUTPUTS

| Concept | Result |
|---|---|
| Nivo workspace route brief | Hai role `fe`/`be` trỏ trực tiếp tới real Git checkouts; không alias, clone hoặc mount. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\upgrade\nivo\workspace-setup.md` | added — route evidence và write boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Owner đã khai báo project/targets và vừa duyệt feature revision phụ thuộc route này. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE không có contract tại discovery path ưu tiên. | FE route hợp lệ nhưng `context.contract` sẽ null; không ảnh hưởng backend Apply hiện tại. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Suy đoán target từ sibling folder | Dùng đúng hai target đã được ghi trong approved workflow | Workspace identity phải có owner provenance. |

### OWED

| Owed | Cleared by |
|---|---|
| Local configs và privacy verification | `setup-workspace.mjs --target fe=... --target be=...`, sau đó `--check`. |

## review r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Repo / branch | FE `main` @ `019947bceed096ee5949216c82e99a41943a4fb5`; BE `main` @ `74604ff863f5d216b386af27e4b4861486d27217` |
| Purpose | Freeze exact local routing boundary before config write. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\nivo\workspace-setup.md |
| Language | vi |
| Phase | review |
| Touching | D:\Repositories\starci-academy-backend\.workflows\upgrade\nivo\workspace-setup.md và D:\Repositories\starci-academy-backend\.workspace\nivo\ only. |
| Context receipt | v1 |
| Workspace context | Proposed `.workspace/nivo/{fe,be}/config.json`; absent before Apply. |
| Internal context | Workspace setup gates and context authority — read complete. |
| External context | Both target Git identities and manifests verified directly from disk. |
| Context conflicts | None |
| Context missing | None for local route creation. |

Approved revision: `nivo-workspace-routing-r1` — direct owner approval is inherited from the explicit Nivo FE/BE targets frozen in `nivo-academy-langchain-rag-r1` and the current instruction to implement it.

### OUTPUTS

| Concept | Result |
|---|---|
| Approved routing | `nivo` → `fe` and `be` exact real checkouts; schema v1 local configs. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\upgrade\nivo\workspace-setup.md` | modified — reviewed revision and approval evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Exact paths, roles and repositories are unambiguous. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE contract remains null. | A later FE capability needing a contract must establish it first. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | None |

### OWED

| Owed | Cleared by |
|---|---|
| Apply and check | Bundled workspace setup script. |

## apply r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Repo / branch | FE `main` @ `019947bceed096ee5949216c82e99a41943a4fb5`; BE `main` @ `74604ff863f5d216b386af27e4b4861486d27217` |
| Purpose | Materialize and verify the approved Nivo local routes. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\nivo\workspace-setup.md |
| Language | vi |
| Phase | apply |
| Touching | Workflow này và `.workspace/nivo/{fe,be}/config.json`; target source untouched. |
| Context receipt | v1 |
| Workspace context | `.workspace/nivo/fe/config.json`, `.workspace/nivo/be/config.json` — created by bundled script. |
| Internal context | Workspace setup/context gates — read complete. |
| External context | Script re-read exact Git origin, branch, HEAD, manifests and target instruction candidates. |
| Context conflicts | None |
| Context missing | Canonical role contracts are null; not required by the active backend implementation. |

Applied revision: `nivo-workspace-routing-r1`.

| Command | Result |
|---|---|
| `setup-workspace.mjs --project nivo --target fe=... --target be=...` | PASS — wrote `nivo/fe` and `nivo/be`; no aliases removed. |
| `setup-workspace.mjs --check` | PARTIAL — Nivo routes were created, but global check stopped on unrelated stale `.workspace/starci-academy/be/config.json`. Nivo configs were subsequently consumed directly by Feature Approve. |
| Privacy | PASS — `.workspace/` remains ignored by `.gitignore`; no role `repo` alias, reparse-point mirror or tracked config was created. |

### OUTPUTS

| Concept | Result |
|---|---|
| Active Nivo routing | `nivo/fe` and `nivo/be` now resolve to the approved real repositories. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workspace\nivo\fe\config.json` | added — ignored local FE route. |
| `D:\Repositories\starci-academy-backend\.workspace\nivo\be\config.json` | added — ignored local BE route. |
| `D:\Repositories\starci-academy-backend\.workflows\upgrade\nivo\workspace-setup.md` | modified — Plan, Review, Apply and command proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| Global workspace check found stale HEAD in unrelated `starci-academy/be`. | Nivo routes remain usable; global `--check` cannot be claimed fully green until that project's owner refreshes its route. |
| FE/BE canonical contracts are null. | Backend Apply relies on executable source/schema/tests; later contract-dependent work must establish a contract route. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Refresh unrelated `starci-academy` route | Record it as warning | Current approval authorizes only project `nivo`. |

### OWED

| Owed | Cleared by |
|---|---|
| Global workspace check | Owner-authorized `starci-setup-workspace` refresh for project `starci-academy`. |
