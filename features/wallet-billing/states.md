# States · Wallet, SePay top-up and billing management

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `wallet-loading` | pending | Wallet sections loading independently | wallet-ready, wallet-empty, wallet-refused | `EV-001`, `EV-002` |
| `wallet-empty` | empty | Zero balance with no transactions or invoices | top-up-entry | `EV-001`, `EV-002` |
| `wallet-ready` | initial | Balance and ledgers available | top-up-entry, history-ready, invoice-paying | `EV-001`, `EV-002`, `EV-003` |
| `wallet-refused` | partial | One or more wallet sections refused | wallet-loading | `EV-001`, `EV-002` |
| `top-up-entry` | initial | Enter a positive VND top-up amount | checkout-creating, wallet-ready | `EV-004`, `EV-011` |
| `checkout-creating` | pending | Creating the SePay checkout | checkout-handoff, checkout-failed | `EV-004`, `EV-005`, `EV-006`, `EV-011` |
| `checkout-handoff` | pending | External SePay checkout owns payment collection | reconciling, checkout-cancelled | `EV-005`, `EV-006`, `EV-011` |
| `reconciling` | pending | Refreshing wallet facts after provider return | top-up-succeeded, checkout-unresolved | `EV-002`, `EV-003`, `EV-010`, `EV-011` |
| `top-up-succeeded` | success | Wallet credit confirmed by refreshed facts | history-ready | `EV-003`, `EV-007`, `EV-008`, `EV-010`, `EV-011` |
| `checkout-cancelled` | error | Checkout cancelled without claiming wallet credit | top-up-entry, wallet-ready | `EV-004`, `EV-006`, `EV-011` |
| `checkout-failed` | error | Checkout creation refused | top-up-entry, wallet-ready | `EV-004`, `EV-006`, `EV-011` |
| `checkout-unresolved` | partial | Payment result cannot yet be proven | reconciling, top-up-entry, wallet-ready | `EV-003`, `EV-011` |
| `history-ready` | success | Transactions and invoices available for inspection | invoice-paying, top-up-entry | `EV-001`, `EV-002`, `EV-003` |
| `invoice-paying` | pending | Paying an owned unpaid invoice | invoice-paid, invoice-refused | `EV-001`, `EV-009` |
| `invoice-paid` | success | Invoice paid and linked provisioning started | history-ready | `EV-001`, `EV-009` |
| `invoice-refused` | error | Invoice settlement refused | history-ready, top-up-entry | `EV-001`, `EV-009` |
