---
{"schema":"work/node@1","id":"nivo.maintenance.claude-worktree-retirement-batch-1","kind":"operations","required":false,"state":"done","assertions":["three-worktrees-proven-safe","three-worktrees-removed","branch-recovery-retained","unsafe-material-protected"],"completion":{"inputDigest":"f0b805350bca7f7cb429e580e0885798995386ccf07dbf688a38e9f655cce04f","evidence":["nivo.maintenance.claude-worktree-retirement-batch-1.20260908"]}}
---
# Retire Claude worktrees batch 1

## Scope

Retire exactly three clean, fully integrated Claude worktrees after confirming that they contain no untracked, ignored, unique-commit, art-direction, or durable evidence material.

## Safety boundary

Branch refs remain available for recovery. No locked authority, dirty checkout, unique-commit checkout, or legacy UAT directory was changed in this operation.
