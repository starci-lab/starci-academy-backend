# Flow · Operate one module through shared chat and its adaptive workbench

> ID: `operate-kind-module`

## Trigger

The workspace owner opens an installed or published module from the exact workspace module collection.

## Steps

| Step | Actor | Action | Result | Surface | State |
|---|---|---|---|---|---|
| `open-module-shell` | `workspace-owner` | Open the exact module identity | Responsive breadcrumbs, module identity, lifecycle status, persistent chat and the kind-resolved workbench load without exposing raw diagnostics | `module-operating-shell` | `module-shell-loading` |
| `resume-shared-chat` | `workspace-owner` | Continue the selected execute chat session | The exact operational session resumes for every kind and new messages remain ordered, attributable and bound to the effective context version used | `module-operating-shell` | `module-shell-ready` |
| `use-kind-workbench` | `workspace-owner` | Inspect or manipulate the workbench appropriate to the module kind | Chatbot shows an inbox, document shows a document surface, accounting may show a spreadsheet and scheduling may show a calendar without changing the shared shell | `module-operating-shell` | `workbench-ready` |
| `interact-with-chat-widget` | `workspace-owner` | Interact with a trusted widget emitted in chat | A typed widget action is validated, attributed and routed to the exact module operation; unsupported or unsafe payloads are refused | `module-operating-shell` | `widget-ready` |

## Outcomes

- The owner works in one stable module home instead of a package-inspection page
- Adding a kind changes only its registered workbench and capabilities, not shared chat or shell

Evidence: `EV-011`, `EV-012`, `EV-013`, `EV-014`
