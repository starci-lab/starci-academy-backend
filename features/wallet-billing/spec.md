# Wallet and invoice settlement

> Business head: `dd906033d14e74ebc0c2197e81e813a521eb2a664ff887a67d42963da20d56b5`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

An authenticated account owner reads a real auto-provisioned wallet balance, transaction ledger and invoice ledger, then pays the newest unpaid invoice and refreshes all three views.

Included:
- Wallet balance
- Wallet transaction ledger
- Invoice ledger
- Paying an unpaid invoice and starting linked provisioning

Excluded:
- A wired wallet top-up flow
- Invented ledger totals

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/nivo-fe.git | `97eec8c5bb4c8f4b9e4bb7c59ea771ed829841d9` |
| be | https://github.com/starci-lab/nivo-backend.git | `947c6f4a117e1677e37ad98ba03f3dac0bca148e` |

## 3. Actors and access

### Authenticated account owner

- Review account money and settle an unpaid service invoice

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 4. Entry points and surfaces

### Wallet

- ID: `wallet`
- Route: `/[locale]/wallet`
- Purpose: Understand the account's available funds and settle service invoices.
- Regions: `balance`, `transactions`, `invoices`
- Navigation: Wallet (active)

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 5. Business flows

### Wallet and invoice settlement

Trigger: Open Wallet

1. **account-actor** — Open Wallet → Review balance, transactions and invoices
2. **account-actor** — Review balance, transactions and invoices → Pay the newest unpaid invoice
3. **account-actor** — Pay the newest unpaid invoice → Refresh money and service-fulfillment facts
4. **account-actor** — Refresh money and service-fulfillment facts → The invoice becomes paid and linked provisioning starts

Outcomes:
- The invoice becomes paid and linked provisioning starts
- Each ledger retains its own resting, empty, answered or refused state

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 6. Business rules

### BR-01

A first wallet read creates a real wallet row, so zero balance is an answer rather than an absent state.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

### BR-02

Invoice payment is restricted to an unpaid invoice owned by the viewer and starts provisioning for the linked service.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 7. State model

- **resting** (`resting`, initial) → empty — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **empty** (`empty`, empty) → answered — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **answered** (`answered`, success) → refused — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **refused** (`refused`, error) → paying — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **paying** (`paying`, pending) → paid — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **paid** (`paid`, success) → terminal — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 8. Entities and data

- **Wallet**: id, balanceVnd — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **Invoice**: id, amountVnd, status, dueAt, catalog item, catalog tier — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **Wallet transaction**: id, type, amountVnd, createdAt — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 9. Operations and APIs

- **myWallet** (query, backend) — input: none; output: auto-provisioned wallet; failures: read refusal — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **myWalletTransactions** (query, backend) — input: none; output: complete transaction ledger; failures: read refusal — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **myInvoices** (query, backend) — input: none; output: invoice ledger with product labels; failures: read refusal — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **payInvoice** (mutation, backend) — input: invoiceId; output: paid invoice and provisioning start; failures: invoice missing, not owned or not unpaid — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 10. Acceptance conditions

- **AC-01** The invoice becomes paid and linked provisioning starts — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **AC-02** The Wallet and invoice settlement surface renders only the states, identities and actions proven by current routed source. — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 11. Explicit unknowns

- **What flow should the visible Top up action open?** — The surface labels the action, but the current connected page supplies no top-up callback.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `apps/app/src/components/pages/WalletPage/component.tsx:11` | ui | The wallet surface defines balance, transaction and invoice sections with independent states and pay/top-up action slots. |
| EV-002 | fe | `apps/app/src/components/pages/WalletPage/index.tsx:24` | ui | The connected wallet reads wallet, invoices and transactions, pays the newest unpaid invoice and refreshes every ledger. |
| EV-003 | be | `src/features/core/api/core/graphql/queries/wallet/my-wallet/my-wallet.resolver.ts:38` | api | myWallet returns a viewer-owned wallet and auto-provisions it on first read. |
| EV-004 | be | `src/features/core/api/core/graphql/queries/invoices/my-invoices/my-invoices.resolver.ts:38` | api | myInvoices returns the authenticated user's invoices with linked product information. |
| EV-005 | be | `src/features/core/api/core/graphql/mutations/invoices/pay-invoice/pay-invoice.resolver.ts:42` | api | payInvoice pays one viewer-owned unpaid invoice and starts linked service provisioning. |
| EV-006 | be | `src/features/core/api/core/graphql/mutations/invoices/pay-invoice/pay-invoice.service.spec.ts:147` | test | Service tests cover payment behavior and refusal when the viewer has no matching invoice. |
