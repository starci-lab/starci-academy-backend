---
{"schema":"work/node@1","id":"nivo.maintenance.claude-worktree-retirement-batch-2","kind":"operations","required":false,"state":"done","assertions":["nine-worktrees-proven-and-removed","remaining-worktrees-proven-and-removed","branch-recovery-retained","unsafe-worktrees-protected"],"completion":{"inputDigest":"f66b0a51a04ced9fafb902670daf99707f9b40bb5491251f983c276572458b34","evidence":["nivo.maintenance.claude-worktree-retirement-batch-2.20260908"]}}
---
# Retire remaining stale Claude worktrees

## Scope

Retire the remaining stale `.claude/worktrees` checkouts whose shared HEAD is already integrated and whose tracked, untracked, ignored, process, and durable-artifact audits are empty.

## Safety boundary

Branch refs remain available for recovery. Dirty checkouts, active process paths, unique commits, unique artifacts, locked authorities, and non-Claude worktrees are excluded.
