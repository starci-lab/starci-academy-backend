# Flow · Manage many execute chat sessions separately from Setup

> ID: `manage-module-chat-sessions`

## Trigger

An authorized collaborator opens an active module with an applied context.

## Steps

| Step | Actor | Action | Result | Surface | State |
|---|---|---|---|---|---|
| `list-chat-sessions` | `workspace-owner` | Inspect the fixed Setup entry and the operational chat session collection | Setup remains separate while zero-to-many execute sessions expose title, activity and archive state | `module-operating-shell` | `execute-session-active` |
| `create-execute-session` | `workspace-owner` | Choose New chat | A new independent execute session is created without creating or replacing Setup | `module-operating-shell` | `execute-session-empty` |
| `resume-execute-session` | `workspace-owner` | Choose an existing execute session | Its ordered message and widget history resumes beside the same kind workbench | `module-operating-shell` | `execute-session-active` |
| `archive-execute-session` | `workspace-owner` | Archive one execute session | That session leaves the active collection without changing Setup, context, workbench or other sessions | `module-operating-shell` | `execute-session-archived` |

## Outcomes

- Every module owns exactly one setup session and any number of execute sessions
- Session lifecycle failures remain isolated from context and workbench state

Evidence: `EV-015`
