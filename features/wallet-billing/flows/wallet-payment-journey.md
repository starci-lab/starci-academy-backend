# Flow · Top up and manage account payments

> ID: `wallet-payment-journey` · Trigger: Open Wallet

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `account-owner` | `wallet-payment` | Open Wallet and review balance, recent transactions and invoices | The account owner can top up, inspect money movement or settle an invoice |
| 2 | `account-owner` | `wallet-payment` | Choose Top up and enter a positive VND amount with SePay selected | The amount is ready for pay-link creation |
| 3 | `account-owner` | `wallet-payment` | Create the SePay top-up checkout | A pending payment, reference, external checkout URL and signed form fields are returned |
| 4 | `account-owner` | `wallet-payment` | Continue to the signed SePay checkout | SePay owns payment collection and redirects to the supplied success or cancellation URL |
| 5 | `account-owner` | `wallet-payment` | Return to Wallet after provider success or cancellation | The wallet and transaction ledger refresh without inventing a settlement result |
| 6 | `account-owner` | `wallet-payment` | Inspect a transaction or invoice and pay an owned unpaid invoice when funds are sufficient | Money movement, invoice state and the resulting provisioning consequence remain traceable |

## Outcomes

- A confirmed SePay top-up credits the wallet exactly once and appears in the transaction ledger
- A cancelled or unresolved checkout does not claim that funds arrived
- An owned unpaid invoice can be settled from wallet balance and starts linked provisioning

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-009`, `EV-010`, `EV-011`
