# Surface · Module studio

> ID: `module-studio` · Route: `/[locale]/agentos/workspaces/[workspaceId]/modules/studio/[moduleId]`

## Job

Complete and review one exact workspace-owned custom module through an adaptive conversation and live structured profile.

## Navigation

- workspace-modules / Back to modules — available
- workspace-modules / Module studio — active

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `adaptive-module-interview` | flow | Conversation; Current question; Your answer; Add image; Attach document | intake-awaiting-answer, intake-submitting, intake-incomplete, intake-complete, intake-refused | Send; Correct answer | `EV-001` |
| `live-module-profile` | summary | Progress; Purpose; Behaviors; Data sources; Integrations; Still needed | intake-awaiting-answer, intake-incomplete, intake-complete, intake-refused |  | `EV-001` |
| `module-resources` | form | Attachment status; Provider; Key label; Secret value; Configured status | attachment-uploading, attachment-scanning, attachment-ready, attachment-refused, secret-saving, secret-configured, secret-refused | Retry upload; Remove file; Save key; Remove key | `EV-001` |
| `module-readiness` | summary | Specification version; Readiness; Publish status | intake-incomplete, specification-ready, module-publishing, module-active, module-publish-refused | Publish module; Open installation | `EV-001`, `EV-002`, `EV-004`, `EV-006`, `EV-008` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
