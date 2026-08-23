# Flow · Review and explicitly publish one complete custom module

> ID: `review-and-publish-module` · Trigger: The backend has generated a complete versioned module specification.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `workspace-owner` | `module-studio` | Review the generated specification, its source attachments and masked integration requirements | The owner can return to the interview or proceed with the exact specification version |
| 2 | `workspace-owner` | `module-studio` | Explicitly confirm Publish or Install with an idempotency identity | The backend accepts one asynchronous publish operation and never treats chat completion as consent |
| 3 | `workspace-owner` | `module-studio` | Observe the publish result | Success returns the existing installation identity; refusal preserves the reviewable specification and exposes a safe retry |

## Outcomes

- A complete custom specification enters the existing installation lifecycle only through explicit owner confirmation
- The existing owner-scoped installation-detail route remains the terminal runtime inspection surface

Evidence: `EV-001`, `EV-002`, `EV-004`, `EV-006`, `EV-008`
