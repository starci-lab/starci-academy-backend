# Surface · AgentOS

> ID: `agentos-order` · Route: `/[locale]/agentos | /[locale]/agentos/orders/[orderId]`

## Job

Request or resume one AgentOS order until a workspace is ready.

## Navigation

- agentos-workspaces / AgentOS — active
- agentos-workspaces / AgentOS workspace — available
- agentos-workspaces / Solution module — available

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `agentos-progress` | flow | Request; Payment; Create workspace; Manage | request, submitting, awaiting-payment, accepted, preparing, ready, failed, launch-opening, launch-connected, launch-expired | Request AgentOS, Open Wallet, Manage AgentOS | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
