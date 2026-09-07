---
{"schema":"work/node@1","id":"nivo.maintenance.fe-worktree-retirement","kind":"operations","required":false,"state":"done","refs":["design.accounting-workbench","design.agentos-shared-ui","design.chatbot-workbench","repo.nivo-frontend"],"assertions":["art-direction-preserved","retirement-candidates-safe","fe-worktrees-removed","branch-recovery-retained","unsafe-worktrees-protected"],"completion":{"inputDigest":"43ff04db3caebc4c8d53adfa0df6c23ede62083cbb0e43a991e9613afe6924b4","evidence":["nivo.maintenance.fe-worktree-retirement.20260908"]}}
---
# Retire the first Nivo frontend worktree batch

## Scope

Preserve the Chatbot, Accounting, and Shared module-studio visual-direction inputs, then retire only their clean frontend source worktrees after proving the commits are integrated directly or by patch equivalence.

## Safety boundary

Branch refs remain available for recovery. The frontend integration worktree, every backend worktree, and every dirty or not-proven-integrated checkout are excluded from this batch.
