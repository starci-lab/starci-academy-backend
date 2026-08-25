# Surface · Set up module

> ID: `module-setup` · Route: `/[locale]/agentos/workspaces/[workspaceId]/modules/[moduleId]/setup`

## Job

Teach and revise one module through its single private resumable setup chat, then explicitly apply a versioned effective context.

## Navigation

- module / Back to module — available
- module / Setup — active

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `private-setup-chat` | flow | Setup conversation; Current question; Answer | context-setup-required, setup-session-ready, context-draft | Send | `EV-015` |
| `live-business-context` | summary | Active version; Draft version; Module overrides; Still needed | context-draft, context-review-ready, context-publishing, context-active, context-publish-refused | Apply context | `EV-015` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
