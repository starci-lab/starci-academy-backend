# Surface · Module workspace

> ID: `module-operating-shell` · Route: `/[locale]/agentos/workspaces/[workspaceId]/modules/[moduleId]/operate`

## Job

Operate one exact module through persistent chat and its kind-resolved workbench.

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
| `module-context-navigation` | navigation | Module; Kind; Setup; Chats | module-shell-loading, module-shell-ready, module-shell-refused | New chat | `EV-011` |
| `persistent-module-chat` | flow | Conversation; Interactive widget; Message | module-shell-ready, chat-sending, chat-refused, widget-ready, widget-refused | Send | `EV-011`, `EV-013` |
| `adaptive-kind-workbench` | workbench | Workbench content; Workbench status | workbench-loading, workbench-ready, workbench-unavailable |  | `EV-011`, `EV-012` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
