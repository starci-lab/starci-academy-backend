# Surface · Modules

> ID: `module-management` · Route: `/[locale]/agentos/workspaces/[workspaceId]/modules`

## Job

Manage custom module drafts and published module identities for one exact ready workspace.

## Navigation

- agentos-workspace / Back to workspace — available
- workspace-modules / Modules — active
- workspace-modules / Catalogue installations — available

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `module-collection-header` | summary | Workspace | module-collection-loading, module-collection-empty, module-collection-ready, module-collection-refused | Create module | `EV-001` |
| `custom-module-collection` | collection | Module; Status; Profile progress; Last updated | module-collection-loading, module-collection-empty, module-collection-ready, module-collection-refused | Continue, Open installation | `EV-001`, `EV-002`, `EV-004` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
