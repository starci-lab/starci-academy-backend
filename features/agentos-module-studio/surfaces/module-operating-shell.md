# Surface · Module workspace

> ID: `module-operating-shell` · Route: `/[locale]/agentos/workspaces/[workspaceId]/modules/[moduleId]/operate`

## Job

Operate one exact module through its primary proactive Operations feed, additional collaborative chats and kind-resolved Workbench.

## Navigation

- breadcrumbs / Workspace — available
- breadcrumbs / Modules — available
- breadcrumbs / Current module — active
- module / Setup — available
- module / Settings — available
- module / Diagnostics — available

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `module-context-navigation` | navigation | Module; Kind; Setup; Operations; additional Chats | module-shell-loading, module-shell-ready, module-shell-refused | New chat | `EV-011`, `EV-018` |
| `persistent-module-chat` | flow | Conversation; trusted MessageTree; task widget; attachment; context binding; composer | module-shell-ready, chat-sending, chat-refused, widget-ready, widget-refused, module-event-ingested, module-task-queued, module-task-processing, module-task-action-required, module-task-completed, module-task-refused | Send | `EV-011`, `EV-013`, `EV-018` |
| `adaptive-kind-workbench` | workbench | Workbench content; Workbench status; focused task; task evidence; allowed actions | workbench-loading, workbench-ready, workbench-unavailable | kind-declared actions | `EV-011`, `EV-012`, `EV-018` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
