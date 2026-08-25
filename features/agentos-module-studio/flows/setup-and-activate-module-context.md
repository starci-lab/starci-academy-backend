# Flow · Teach one module through its single private setup chat

> ID: `setup-and-activate-module-context`

## Trigger

A module has no active business context or an authorized owner chooses Setup to revise it.

## Steps

| Step | Actor | Action | Result | Surface | State |
|---|---|---|---|---|---|
| `open-single-setup-session` | `workspace-owner` | Open Setup for the exact module | The same private setup session is created once or resumed with its accepted history, draft context and active version | `module-setup` | `setup-session-ready` |
| `answer-setup-question` | `workspace-owner` | Answer, correct or extend the module business context | The setup turn is persisted and the versioned draft context is recomputed without changing the active context | `module-setup` | `context-draft` |
| `review-setup-context` | `workspace-owner` | Review inherited workspace defaults, module overrides and unresolved requirements | The exact draft version becomes explicitly reviewable only after backend-owned minimum setup requirements are complete | `module-setup` | `context-review-ready` |
| `apply-setup-context` | `workspace-owner` | Explicitly apply the exact draft context version | One immutable effective context snapshot becomes active; existing execute history remains unchanged | `module-setup` | `context-active` |

## Outcomes

- First operation is gated until the single setup session produces an active effective context
- Later setup drafts do not interrupt execute sessions that continue using the last active context

Evidence: `EV-015`
