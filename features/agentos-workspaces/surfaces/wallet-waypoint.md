# Surface · Wallet payment waypoint

> ID: `wallet-waypoint` · Route: `/[locale]/wallet`

## Job

Settle the invoice linked to the exact AgentOS order, then resume that order context.

## Navigation

- billing / Wallet — active
- agentos-workspaces / Return to AgentOS order — available

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `linked-invoice` | summary | Invoice; AgentOS order; Payment status | wallet-awaiting-payment, wallet-paying, wallet-paid, wallet-refused | Pay linked invoice, Resume exact order | `EV-001`, `EV-004` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
