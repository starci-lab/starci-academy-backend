# Surface · Wallet and payments

> ID: `wallet-payment` · Route: `/:locale/wallet`

## Job

Top up account funds, trace every wallet movement and settle service invoices without losing the payment consequence.

## Navigation

- account / Wallet — active

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `balance-summary` | summary | Available balance; Nearest unpaid invoice | wallet-loading, wallet-empty, wallet-ready, wallet-refused, reconciling, top-up-succeeded | Top up | `EV-001`, `EV-002`, `EV-011` |
| `top-up` | form | Top-up amount in VND; SePay; Payment reference; Wallet is credited only after provider confirmation | top-up-entry, checkout-creating, checkout-handoff, reconciling, top-up-succeeded, checkout-cancelled, checkout-failed, checkout-unresolved | Continue to SePay, Cancel, Try again | `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-010`, `EV-011` |
| `transactions` | collection | Deposit or spend; Amount; Note; Created date | wallet-loading, wallet-empty, history-ready, wallet-refused, top-up-succeeded | View transaction | `EV-001`, `EV-002`, `EV-003`, `EV-008`, `EV-011` |
| `invoices` | collection | Product and tier; Amount; Paid, unpaid or cancelled; Due or paid date | wallet-loading, wallet-empty, history-ready, invoice-paying, invoice-paid, invoice-refused, wallet-refused | View invoice, Pay invoice, Top up wallet | `EV-001`, `EV-002`, `EV-009`, `EV-011` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
