# Flow · Wallet and invoice settlement

> ID: `wallet-billing-journey` · Trigger: Open Wallet

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `account-actor` | `wallet` | Open Wallet | Review balance, transactions and invoices |
| 2 | `account-actor` | `wallet` | Review balance, transactions and invoices | Pay the newest unpaid invoice |
| 3 | `account-actor` | `wallet` | Pay the newest unpaid invoice | Refresh money and service-fulfillment facts |
| 4 | `account-actor` | `wallet` | Refresh money and service-fulfillment facts | The invoice becomes paid and linked provisioning starts |

## Outcomes

- The invoice becomes paid and linked provisioning starts
- Each ledger retains its own resting, empty, answered or refused state

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
