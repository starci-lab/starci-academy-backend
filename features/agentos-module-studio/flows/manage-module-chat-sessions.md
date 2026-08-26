# Flow · Operate one primary Operations feed and additional collaborative chats separately from Setup

> ID: `manage-module-chat-sessions`

## Trigger

An authorized collaborator opens an active module with an applied context or the controller accepts the first operational event.

## Steps

| Step | Actor | Action | Result | Surface | State |
|---|---|---|---|---|---|
| `list-chat-sessions` | `workspace-owner` | Inspect the fixed Setup entry and the operational chat session collection | Setup remains separate; one primary Operations session is created once and remains non-archivable while zero-to-many additional Execute sessions expose title, activity and archive state | `module-operating-shell` | `execute-session-active` |
| `create-execute-session` | `workspace-owner` | Choose New chat | A new additional collaborative Execute session is created without creating or replacing Setup or the primary Operations session | `module-operating-shell` | `execute-session-empty` |
| `resume-execute-session` | `workspace-owner` | Choose an existing execute session | Its ordered message and widget history resumes beside the same kind workbench | `module-operating-shell` | `execute-session-active` |
| `archive-execute-session` | `workspace-owner` | Archive one additional execute session | That session leaves the active collection without changing Setup, the primary Operations feed, context, Workbench or other sessions | `module-operating-shell` | `execute-session-archived` |

## Outcomes

- Every operational module owns exactly one primary Operations session and any number of additional Execute sessions
- Controller-originated proactive messages always have one predictable durable destination
- Session lifecycle failures remain isolated from context, task and Workbench state

Evidence: `EV-015`, `EV-018`
