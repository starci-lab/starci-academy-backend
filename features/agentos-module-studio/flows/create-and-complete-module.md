# Flow · Create a custom module through adaptive follow-up questions

> ID: `create-and-complete-module` · Trigger: The workspace owner chooses Create module from the exact workspace module collection.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `workspace-owner` | `module-create` | Open the separate module-create route without creating a blank persisted module | The owner sees the first assistant prompt and a composer scoped to the exact workspace |
| 2 | `workspace-owner` | `module-create` | Submit the opening module goal | The backend creates one idempotent custom-module draft and intake session, then returns the exact persistent studio identity |
| 3 | `workspace-owner` | `module-studio` | Answer the current backend-selected question or correct a prior answer | The answer is persisted, the structured profile and missing fields are recomputed, and the next unresolved question is returned |
| 4 | `workspace-owner` | `module-studio` | Attach relevant images or documents and configure required integration keys | Only scan-ready attachments and masked configured-secret statuses contribute to module readiness |
| 5 | `workspace-owner` | `module-studio` | Resolve every backend-declared missing field | The backend marks the intake complete and generates a versioned reviewable module specification |

## Outcomes

- One exact workspace-owned draft and intake session remain resumable
- The owner reaches a reviewable specification only after backend-owned completion

Evidence: `EV-001`
