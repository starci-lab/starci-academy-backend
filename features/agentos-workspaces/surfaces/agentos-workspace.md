# Surface · AgentOS workspace

> ID: `agentos-workspace` · Route: `/[locale]/agentos/workspaces/[workspaceId]`

## Job

Manage one exact owned workspace across its product and runtime areas.

## Navigation

- none

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `workspace-tabs` | navigation | Overview; Solutions; Applications; Infrastructure; Operations; Access | request, submitting, awaiting-payment, accepted, preparing, ready, failed, launch-opening, launch-connected, launch-expired | none | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007` |
| `workspace-body` | content | Status; Plan; Hostname; Runtime snapshot; Installed solutions | request, submitting, awaiting-payment, accepted, preparing, ready, failed, launch-opening, launch-connected, launch-expired | Install solution, Open OpenClaw | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
