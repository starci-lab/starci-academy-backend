# FE setup worktrees skill

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | C:/Repositories/ac/starci-academy-backend |
| Source | C:/Repositories/ac/starci-academy-backend |
| Project | starci-academy-fe |
| Frontend | C:/Repositories/starci-academy-fe |
| Backend | C:/Repositories/ac/starci-academy-backend |
| Trust | C:/Repositories/ac/starci-academy-backend/.claude |
| Skills | C:/Repositories/ac/starci-academy-backend/.claude/skills |
| App | starci-academy-fe |
| Repo / branch | Source mtp; Trust main; registry codex/fe-design-registry |
| Purpose | Add deterministic project-scoped FE worktree installation and verification. |
| Workflow root | C:/Repositories/ac/starci-academy-backend/.workflows |
| Workflow | C:/Repositories/ac/starci-academy-backend/.workflows/upgrade/starci-academy-fe/fe-setup-worktrees-skill.md |
| Language | vi |
| Phase | plan |
| Touching | This workflow; Trust skill/index/tests; Source `.worktrees/starci-academy-fe/` linked worktree mount and ignored local directories. |

Required layout:

```text
<Source>/.worktrees/<project>/
├── registries/  # locked linked Git worktree
├── sessions/    # ignored progress
└── cache/       # ignored rebuildable data
```

The skill must refuse `.claude/worktrees`, `.worktrees/registries` without `<project>`, inferred
project identity, mismatched branch/worktree ownership and unignored local state.

### OUTPUTS

| Concept | Result |
|---|---|
| Setup contract | Project-scoped Source-local worktrees with one durable linked registry. |

### CHANGES

| Tree | Details |
|---|---|
| This workflow | Added Plan. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User explicitly requested the skill and `<project>` boundary. |

### WARNINGS

| Warning | Impact |
|---|---|
| Existing registry mount lacks `<project>`. | Apply must move it safely and preserve its commit. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `<Source>/.claude/worktrees` | `<Source>/.worktrees/<project>` | Runtime/project state does not belong in tracked Trust. |
| `<Source>/.worktrees/registries` | `<Source>/.worktrees/<project>/registries` | Global path cannot separate projects. |

### OWED

| Owed | Cleared by |
|---|---|
| Freeze and apply script behavior | Review and focused tests below. |

## review

Approved revision: `fe-setup-worktrees-r1`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | C:/Repositories/ac/starci-academy-backend |
| Source | C:/Repositories/ac/starci-academy-backend |
| Project | starci-academy-fe |
| Frontend | C:/Repositories/starci-academy-fe |
| Backend | C:/Repositories/ac/starci-academy-backend |
| Trust | C:/Repositories/ac/starci-academy-backend/.claude |
| Skills | C:/Repositories/ac/starci-academy-backend/.claude/skills |
| App | starci-academy-fe |
| Repo / branch | Source mtp; Trust main |
| Purpose | Freeze deterministic install/check and current-registry migration. |
| Workflow root | C:/Repositories/ac/starci-academy-backend/.workflows |
| Workflow | C:/Repositories/ac/starci-academy-backend/.workflows/upgrade/starci-academy-fe/fe-setup-worktrees-skill.md |
| Language | vi |
| Phase | review |
| Touching | Exact Plan boundary above. |

Install creates or reopens `<Source>/.worktrees/<project>/registries` on
`codex/fe-design-registry/<project>`, locks it, creates ignored `sessions` and `cache`, seeds an
empty registry only when the branch is new, and never pushes. Check mode is read-only. Legacy
migration uses `git worktree move` and branch rename only after exact path/commit verification.

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `fe-setup-worktrees-r1` |

### CHANGES

| Tree | Details |
|---|---|
| This workflow | Added approved Review. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User instruction authorizes the bounded setup and migration. |

### WARNINGS

| Warning | Impact |
|---|---|
| Registry branch is local until explicitly pushed. | Setup must report this without pushing silently. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Clone/mirror registry | Linked worktree owned by Source Git common dir | One canonical object database and inspectable branch. |

### OWED

| Owed | Cleared by |
|---|---|
| Implement and validate | Apply. |

## review revision 2

Approved revision: `source-local-setup-pair-r2`

Founder correction freezes two canonical skills and two disjoint roots:

| Skill | Sole write root |
|---|---|
| `starci-set-workspace` | `<Source>/.workspace/<project>/<role>/config.json` |
| `starci-setup-worktrees` | `<Source>/.worktrees/<project>/{registries,sessions,cache}` |

`starci-workspace-setup` is renamed to `starci-set-workspace`. The provisional
`starci-fe-setup-worktrees` scaffold is rejected and replaced by `starci-setup-worktrees`. Neither
skill may write runtime state under `.claude`; `.claude/skills/**` contains procedure and scripts
only. Project identity is mandatory and appears as the first directory below each Source-local root.

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `source-local-setup-pair-r2` |

### CHANGES

| Tree | Details |
|---|---|
| This workflow | Recorded corrected skill names and root ownership before implementation. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Founder supplied exact names and roots. |

### WARNINGS

| Warning | Impact |
|---|---|
| Current `.worktrees/registries` lacks `<project>`. | Apply migrates it to `.worktrees/starci-academy-fe/registries`. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `starci-workspace-setup` | `starci-set-workspace` | Founder fixed the canonical capability name. |
| `starci-fe-setup-worktrees` | `starci-setup-worktrees` | Worktree setup is Source/project infrastructure, not an FE-prefixed procedure. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply corrected pair | Rename, implement, migrate and test. |

## review revision 3

Approved revision: `source-local-setup-pair-r3`

Final founder naming correction: the pair is `starci-setup-workspace` and
`starci-setup-worktrees`. The provisional verb `set` is removed. Storage ownership remains exactly
`<Source>/.workspace/<project>` versus `<Source>/.worktrees/<project>`.

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `source-local-setup-pair-r3` |

### CHANGES

| Tree | Details |
|---|---|
| This workflow | Corrected final workspace skill name before Apply. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Founder supplied final name. |

### WARNINGS

| Warning | Impact |
|---|---|
| None | Naming is now unambiguous. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `starci-set-workspace` | `starci-setup-workspace` | Founder corrected the verb. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply final pair | Implement, migrate and test. |

## apply

Applied revision: `source-local-setup-pair-r3`
Baseline commit: `9dc6155c25b322501c3bf79617e63c8910be372a`
Tracked diff: `9dc6155c25b322501c3bf79617e63c8910be372a..worktree`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | C:/Repositories/ac/starci-academy-backend |
| Source | C:/Repositories/ac/starci-academy-backend |
| Project | starci-academy-fe |
| Frontend | C:/Repositories/starci-academy-fe |
| Backend | C:/Repositories/ac/starci-academy-backend |
| Trust | C:/Repositories/ac/starci-academy-backend/.claude |
| Skills | C:/Repositories/ac/starci-academy-backend/.claude/skills |
| App | starci-academy-fe |
| Repo / branch | Source mtp; Trust main |
| Purpose | Cài đúng hai setup skill và migrate registry vào root project-scoped. |
| Workflow root | C:/Repositories/ac/starci-academy-backend/.workflows |
| Workflow | C:/Repositories/ac/starci-academy-backend/.workflows/upgrade/starci-academy-fe/fe-setup-worktrees-skill.md |
| Language | vi |
| Phase | apply |
| Touching | Hai setup skill, trust routing/tests, Source .gitignore, workflow và `.worktrees/starci-academy-fe/`. |

Đã cài `starci-setup-workspace` và `starci-setup-worktrees`. Registry legacy được move bằng Git từ
`.worktrees/registries` sang `.worktrees/starci-academy-fe/registries`; HEAD vẫn là
`00e1b7e84ad57aa2765b15e34f0ff24f7ae94698`, branch đổi thành
`codex/fe-design-registry/starci-academy-fe`, worktree sạch và đã lock lại. Không push registry.

Focused script tests: 4/4 pass. Skill Creator `quick_validate.py`: 2/2 valid. Trust tests liên quan
setup pass; bộ `sources/skills.test.mjs` còn một lỗi có sẵn ngoài boundary tại
`starci-be-audit-apply` thiếu `## PROCESS`.

### OUTPUTS

| Concept | Result |
|---|---|
| Source-local setup pair | Workspace routes và worktree state có hai owner riêng, đều bắt buộc project segment. |
| Registry migration | Dữ liệu và commit được giữ nguyên tại root mới của `starci-academy-fe`. |

### CHANGES

| Tree | Details |
|---|---|
| `.claude/skills/starci-setup-workspace/` | Added canonical workspace setup skill, script, metadata and tests. |
| `.claude/skills/starci-setup-worktrees/` | Added install/check/migrate skill, script, metadata and tests. |
| `.claude/{INDEX.md,skill-shape.md,common/config/,sources/}` | Updated names, root ownership and automated contracts. |
| `.worktrees/starci-academy-fe/` | Migrated registry; added ignored sessions and cache roots. |
| `.gitignore` | Documented Source-local project worktree shape. |
| This workflow | Added Apply evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Approved revision was applied exactly. |

### WARNINGS

| Warning | Impact |
|---|---|
| Registry branch remains local. | It will not exist remotely until explicitly pushed. |
| Unrelated trust test failure in `starci-be-audit-apply`. | Full trust suite is not green, but both new setup capabilities and focused tests pass. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Legacy capability names and global worktree root | Final two canonical names and project-scoped roots | Founder corrections in Review revisions 2–3. |

### OWED

| Owed | Cleared by |
|---|---|
| None | Apply, migration and focused proof are complete. |
