# Flow · Resume or manage one exact custom module

> ID: `resume-and-manage-module` · Trigger: The workspace owner selects a draft or published custom module from the module collection.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `workspace-owner` | `module-management` | Choose one module belonging to the exact workspace | The route preserves workspaceId and moduleId and refuses a foreign or absent module |
| 2 | `workspace-owner` | `module-studio` | Open the module studio | Conversation, structured profile, missing fields, attachments, masked secret statuses and current specification are restored |
| 3 | `workspace-owner` | `module-studio` | Continue the interview or update an allowed resource | The backend recomputes readiness without losing previously accepted information |

## Outcomes

- Interrupted intake resumes without creating a duplicate draft
- The owner can distinguish incomplete, ready-for-review, publishing, active and refused modules

Evidence: `EV-001`
