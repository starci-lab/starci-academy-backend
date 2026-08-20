# Surface · Wallet

> ID: `wallet` · Route: `/[locale]/wallet`

## Job

Understand the account's available funds and settle service invoices.

## Navigation

- wallet-billing / Wallet — active

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `balance` | summary | Balance; Unpaid invoice | resting, empty, answered, refused, paying, paid | Top up | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `transactions` | collection | Top-up or charge; Amount; Date | resting, empty, answered, refused, paying, paid | none | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |
| `invoices` | collection | Product and tier; Amount; Paid / Unpaid / Cancelled | resting, empty, answered, refused, paying, paid | Pay | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
