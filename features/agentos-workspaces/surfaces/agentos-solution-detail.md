# Surface · Solution module

> ID: `agentos-solution-detail` · Route: `/[locale]/agentos/workspaces/[workspaceId]/modules/[installationId]`

## Job

Inspect one owned immutable module installation and its generated bindings.

## Navigation

- none

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `module-summary` | summary | Module; Version; Status; Failure code | request, submitting, awaiting-payment, accepted, preparing, ready, failed, launch-opening, launch-connected, launch-expired | none | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007` |
| `module-bindings` | collection | Generated agents; Channel accounts; Shared knowledge sources | request, submitting, awaiting-payment, accepted, preparing, ready, failed, launch-opening, launch-connected, launch-expired | none | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
