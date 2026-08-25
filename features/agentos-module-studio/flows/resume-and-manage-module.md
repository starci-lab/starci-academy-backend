# Flow · Resume or manage one exact custom module

> ID: `resume-and-manage-module`

## Trigger

The workspace owner selects a draft or published custom module from the module collection.

## Steps

| Step | Actor | Action | Result | Surface | State |
|---|---|---|---|---|---|
| `choose-owned-module` | `workspace-owner` | Choose one module belonging to the exact workspace | The route preserves workspaceId and moduleId and refuses a foreign or absent module | `module-management` | `module-collection-ready` |
| `restore-module-studio` | `workspace-owner` | Open the module studio | Conversation, structured profile, missing fields, attachments, masked secret statuses and current specification are restored | `module-studio` | `intake-awaiting-answer` |
| `continue-module-management` | `workspace-owner` | Continue the interview or update an allowed resource | The backend recomputes readiness without losing previously accepted information | `module-studio` | `intake-incomplete` |

## Outcomes

- Interrupted intake resumes without creating a duplicate draft
- The owner can distinguish incomplete, ready-for-review, publishing, active and refused modules

Evidence: `EV-001`
