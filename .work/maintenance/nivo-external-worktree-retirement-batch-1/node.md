---
{"schema":"work/node@1","id":"nivo.maintenance.external-worktree-retirement-batch-1","kind":"operations","required":false,"state":"done","refs":["repo.nivo-backend","repo.nivo-frontend"],"assertions":["stale-frontend-worktrees-classified","stale-backend-worktrees-classified","safe-worktrees-removed","unique-runtime-and-dirty-worktrees-protected","branch-recovery-retained"],"completion":{"inputDigest":"9f865bd58b4f26c4c6bc99fbe8b0b28f7711f001ef79b360e1d54e4b5857bd34","evidence":["nivo.maintenance.external-worktree-retirement-batch-1.20260908"]}}
---
# Retire stale external Nivo worktrees batch 1

## Scope

Classify older Nivo frontend and backend worktrees against current repository main and integration heads, preserve any unique art or evidence, and remove every candidate proved clean, redundant, inactive, and recoverable.

## Safety boundary

Integration and runtime worktrees, dirty paths, unique artifacts, active processes, locked authorities, incomplete evidence, and commits without retained or equivalent reachable history remain protected. Removing a checkout does not delete its branch ref.
