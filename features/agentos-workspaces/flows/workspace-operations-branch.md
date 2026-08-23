# Flow · Operate one exact ready workspace safely

> ID: `workspace-operations-branch` · Trigger: The owner chooses one action in the Operations tab

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `account-owner` | `agentos-workspace` | Choose update, plan change, backup, restart or rebuild | The action is evaluated against exact-workspace ownership and operation-specific preconditions |
| 2 | `account-owner` | `agentos-workspace` | Confirm only actions whose consequences require confirmation | The backend accepts one auditable asynchronous operation or returns an explicit refusal |
| 3 | `account-owner` | `agentos-workspace` | Observe completion or refusal without leaving the workspace | The operation settles independently from page anatomy and launch state |

## Outcomes

- Every workspace action is real, owner-scoped, stateful and truthful about preconditions
- Restart preserves persistent data; rebuild requires confirmation plus a fresh verified backup
- Plan change applies only after its linked Wallet invoice is paid

Evidence: `EV-018`, `EV-021`, `EV-025`
