# Surface · AgentOS order

> ID: `agentos-order` · Route: `/[locale]/agentos | /[locale]/agentos/orders/[orderId]`

## Job

Create an AgentOS order or resume one exact order through payment and provisioning.

## Navigation

- agentos-workspaces / AgentOS — active
- billing / Wallet — available

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `order-progress` | flow | Request; Payment; Create workspace; Manage exact workspace | order-request, order-submitting, order-awaiting-payment, order-accepted, workspace-preparing, workspace-ready, workspace-failed | Request AgentOS, Open Wallet, Open exact workspace | `EV-001`, `EV-002`, `EV-003`, `EV-005` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
