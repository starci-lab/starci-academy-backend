# Wallet, SePay top-up and billing management

> Business head: `7addf0b44e299e15e0bbe441069ee2ae2a7d131df2066324c35003666cb1891e`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

An authenticated account owner reviews the wallet, starts a real SePay top-up, returns to reconcile the credited balance and transaction ledger, and manages wallet transactions and service invoices from one coherent payment flow.

Included:
- Wallet balance with correct independent surface states
- SePay wallet top-up amount entry and signed external checkout handoff
- Return, cancellation and reconciliation states after checkout
- Wallet transaction history with direction, amount, note and date
- Invoice history, invoice detail and settlement from wallet balance
- Desktop and mobile payment flow under the strict StarCi visual grammar

Excluded:
- Frontend or backend source implementation in this business-analysis run
- An in-app SePay QR payload that the current API does not return
- Fabricated payment status, expiry or ledger totals absent from the current contract
- Changing or removing the backend's existing PayOS capability

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/nivo-fe.git | `3102d35bfa73e51c52d087352c68ee106b4a5a46` |
| be | https://github.com/starci-lab/nivo-backend.git | `947c6f4a117e1677e37ad98ba03f3dac0bca148e` |

## 3. Actors and access

### Authenticated account owner

- Review available wallet funds
- Start a SePay top-up and return for reconciliation
- Inspect wallet transactions and invoices
- Pay an owned unpaid invoice from wallet balance

Evidence: `EV-001`, `EV-002`, `EV-004`, `EV-006`, `EV-010`, `EV-011`

## 4. Entry points and surfaces

### Wallet and payments

- ID: `wallet-payment`
- Route: `/:locale/wallet`
- Purpose: Top up account funds, trace every wallet movement and settle service invoices without losing the payment consequence.
- Regions: `balance-summary`, `top-up`, `transactions`, `invoices`
- Navigation: Wallet (active)

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-009`, `EV-010`, `EV-011`

## 5. Business flows

### Top up and manage account payments

Trigger: Open Wallet

1. **account-owner** — Open Wallet and review balance, recent transactions and invoices → The account owner can top up, inspect money movement or settle an invoice
2. **account-owner** — Choose Top up and enter a positive VND amount with SePay selected → The amount is ready for pay-link creation
3. **account-owner** — Create the SePay top-up checkout → A pending payment, reference, external checkout URL and signed form fields are returned
4. **account-owner** — Continue to the signed SePay checkout → SePay owns payment collection and redirects to the supplied success or cancellation URL
5. **account-owner** — Return to Wallet after provider success or cancellation → The wallet and transaction ledger refresh without inventing a settlement result
6. **account-owner** — Inspect a transaction or invoice and pay an owned unpaid invoice when funds are sufficient → Money movement, invoice state and the resulting provisioning consequence remain traceable

Outcomes:
- A confirmed SePay top-up credits the wallet exactly once and appears in the transaction ledger
- A cancelled or unresolved checkout does not claim that funds arrived
- An owned unpaid invoice can be settled from wallet balance and starts linked provisioning

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-009`, `EV-010`, `EV-011`

## 6. Business rules

### BR-01

A first wallet read creates a real zero-balance wallet; zero is an answered value, not an absent wallet.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`

### BR-02

A SePay top-up accepts a positive VND amount, records a pending wallet-top-up payment and returns a reference, checkout endpoint and signed checkout fields before any wallet credit is claimed.

Strength: **confirmed** · Evidence: `EV-004`, `EV-005`, `EV-006`

### BR-03

Wallet credit occurs only after the authenticated SePay webhook retrieves a paid provider order and routes the matching wallet-top-up settlement.

Strength: **confirmed** · Evidence: `EV-007`, `EV-010`

### BR-04

Wallet transactions are viewer-scoped and returned newest first with deposit or spend direction, amount, optional note and creation time.

Strength: **confirmed** · Evidence: `EV-003`, `EV-008`

### BR-05

Invoice settlement is restricted to an owned unpaid invoice and starts provisioning for its linked service after payment.

Strength: **confirmed** · Evidence: `EV-001`, `EV-009`

### BR-06

Wallet, top-up, transaction and invoice states form one StarCi-themed payment journey on desktop and mobile; a project-local visual theme is not permitted.

Strength: **confirmed** · Evidence: `EV-011`

### BR-07

After checkout return, the frontend refreshes wallet and transaction facts and must not label the payment successful, failed or expired without an authoritative contract result.

Strength: **partial** · Evidence: `EV-002`, `EV-003`, `EV-011`

## 7. State model

- **Wallet sections loading independently** (`wallet-loading`, pending) → wallet-ready, wallet-empty, wallet-refused — `EV-001`, `EV-002`
- **Zero balance with no transactions or invoices** (`wallet-empty`, empty) → top-up-entry — `EV-001`, `EV-002`
- **Balance and ledgers available** (`wallet-ready`, initial) → top-up-entry, history-ready, invoice-paying — `EV-001`, `EV-002`, `EV-003`
- **One or more wallet sections refused** (`wallet-refused`, partial) → wallet-loading — `EV-001`, `EV-002`
- **Enter a positive VND top-up amount** (`top-up-entry`, initial) → checkout-creating, wallet-ready — `EV-004`, `EV-011`
- **Creating the SePay checkout** (`checkout-creating`, pending) → checkout-handoff, checkout-failed — `EV-004`, `EV-005`, `EV-006`, `EV-011`
- **External SePay checkout owns payment collection** (`checkout-handoff`, pending) → reconciling, checkout-cancelled — `EV-005`, `EV-006`, `EV-011`
- **Refreshing wallet facts after provider return** (`reconciling`, pending) → top-up-succeeded, checkout-unresolved — `EV-002`, `EV-003`, `EV-010`, `EV-011`
- **Wallet credit confirmed by refreshed facts** (`top-up-succeeded`, success) → history-ready — `EV-003`, `EV-007`, `EV-008`, `EV-010`, `EV-011`
- **Checkout cancelled without claiming wallet credit** (`checkout-cancelled`, error) → top-up-entry, wallet-ready — `EV-004`, `EV-006`, `EV-011`
- **Checkout creation refused** (`checkout-failed`, error) → top-up-entry, wallet-ready — `EV-004`, `EV-006`, `EV-011`
- **Payment result cannot yet be proven** (`checkout-unresolved`, partial) → reconciling, top-up-entry, wallet-ready — `EV-003`, `EV-011`
- **Transactions and invoices available for inspection** (`history-ready`, success) → invoice-paying, top-up-entry — `EV-001`, `EV-002`, `EV-003`
- **Paying an owned unpaid invoice** (`invoice-paying`, pending) → invoice-paid, invoice-refused — `EV-001`, `EV-009`
- **Invoice paid and linked provisioning started** (`invoice-paid`, success) → history-ready — `EV-001`, `EV-009`
- **Invoice settlement refused** (`invoice-refused`, error) → history-ready, top-up-entry — `EV-001`, `EV-009`

## 8. Entities and data

- **Wallet**: id, balanceVnd — `EV-002`, `EV-003`
- **Wallet transaction**: id, type, amountVnd, note, createdAt — `EV-003`, `EV-008`
- **Invoice**: id, amountVnd, status, dueAt, paidAt, catalog item, catalog tier — `EV-001`, `EV-002`, `EV-009`
- **Wallet top-up pay link**: paymentId, gateway, referenceId, checkoutUrl, checkoutFields, amountVnd, chargedAmountVnd — `EV-005`, `EV-006`

## 9. Operations and APIs

- **myWallet** (query, backend) — input: none; output: viewer-owned auto-provisioned wallet; failures: read refusal — `EV-002`
- **myWalletTransactions** (query, backend) — input: none; output: viewer-owned wallet transactions newest first; failures: read refusal — `EV-003`, `EV-008`
- **myInvoices** (query, backend) — input: none; output: viewer-owned invoice ledger with product labels; failures: read refusal — `EV-001`, `EV-002`
- **createWalletTopUpPayLink** (mutation, backend) — input: amountVnd, gateway, returnUrl, cancelUrl; output: pending payment id, gateway reference, checkout URL, signed SePay checkout fields, credit and charged amounts; failures: invalid amount, unsupported gateway, payment gateway not configured, gateway refusal — `EV-004`, `EV-005`, `EV-006`
- **SePay signed checkout handoff** (redirect, provider) — input: checkoutUrl, checkoutFields; output: provider payment collection, success or cancellation redirect; failures: provider cancellation, provider error — `EV-005`, `EV-006`, `EV-011`
- **SePay payment webhook settlement** (event, backend) — input: provider order reference; output: authenticated paid order routed to wallet-top-up settlement; failures: gateway unavailable, order not paid, reference unrecognised, settlement refusal — `EV-007`, `EV-010`
- **payInvoice** (mutation, backend) — input: invoiceId; output: paid invoice, linked provisioning start; failures: invoice missing, invoice not owned, invoice not unpaid, insufficient wallet balance — `EV-001`, `EV-009`

## 10. Acceptance conditions

- **AC-01** Wallet balance, transactions and invoices render as complete independent surfaces whose loading, empty, answered and refused states retain the same anatomy and recovery ownership. — `EV-001`, `EV-002`, `EV-011`
- **AC-02** A positive VND amount can create a SePay wallet-top-up pay link and submit its signed fields to the returned external checkout endpoint. — `EV-004`, `EV-005`, `EV-006`, `EV-011`
- **AC-03** The UI claims top-up success only after refreshed wallet or transaction evidence confirms the provider-settled credit; cancellation or an unresolved return never claims success. — `EV-003`, `EV-007`, `EV-008`, `EV-010`, `EV-011`
- **AC-04** Transaction and invoice management preserves real identities, statuses, dates, notes, amounts and actions at production-like density without fabricated totals. — `EV-001`, `EV-002`, `EV-003`, `EV-008`, `EV-009`, `EV-011`
- **AC-05** An owned unpaid invoice can be paid from wallet balance, after which every ledger refreshes and linked provisioning starts. — `EV-001`, `EV-002`, `EV-009`
- **AC-06** Every desktop, collapsed-navigation, mobile and overlay state uses the one grammar-locked StarCi visual theme. — `EV-011`

## 11. Explicit unknowns

- **Which authenticated operation returns the payment ledger status and expiry after the browser returns from SePay?** — The current contract can prove wallet credit by refreshing balance and transactions, but it cannot distinguish authoritative pending, failed and expired payment states in the UI.
- **How should the frontend distinguish a buyer cancellation from a SePay provider error when both currently return through the cancellation URL?** — The design can render honest cancelled-or-unresolved recovery, but separate final error copy needs a stronger redirect or payment-status contract.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `apps/app/src/components/pages/WalletPage/component.tsx:11` | ui | The Wallet drawing defines independent balance, transaction and invoice sections, top-up and invoice actions, and resting, empty, answered and refused states. |
| EV-002 | fe | `apps/app/src/components/pages/WalletPage/index.tsx:24` | ui | The connected Wallet loads balance, invoices and transactions independently, pays an unpaid invoice and refreshes all three ledgers, while currently omitting the top-up callback. |
| EV-003 | fe | `apps/app/src/modules/api/console.ts:115` | contract | The frontend console contract exposes wallet, transaction and invoice identities and reads, but no wallet-top-up pay-link or payment-status operation yet. |
| EV-004 | be | `src/features/core/api/core/graphql/mutations/wallet/create-wallet-top-up-pay-link/graphql-types/input.ts:17` | api | The wallet top-up mutation accepts a positive integer VND amount, gateway, success URL and cancellation URL. |
| EV-005 | be | `src/features/core/api/core/graphql/mutations/wallet/create-wallet-top-up-pay-link/graphql-types/wallet-top-up-pay-link.ts:19` | api | The top-up result returns payment and gateway references, checkout URL, optional PayOS QR, optional SePay signed fields, and credited and charged amounts. |
| EV-006 | be | `src/features/core/api/core/graphql/mutations/wallet/create-wallet-top-up-pay-link/create-wallet-top-up-pay-link.service.ts:52` | api | The service creates a pending wallet-top-up payment and implements distinct PayOS and signed SePay checkout branches without crediting the wallet early. |
| EV-007 | be | `src/features/core/api/core/http/payment-gateway/sepay-webhook.controller.ts:60` | api | The SePay webhook authenticates payment by retrieving the provider order, acknowledges unpaid or unrecognised references without settlement, and routes paid references to settlement. |
| EV-008 | be | `src/features/core/api/core/graphql/queries/wallet/my-wallet-transactions/my-wallet-transactions.service.ts:1` | api | Wallet transactions are loaded for the viewer's wallet newest first. |
| EV-009 | be | `src/features/core/api/core/graphql/mutations/invoices/pay-invoice/pay-invoice.resolver.ts:42` | api | The payInvoice mutation settles one viewer-owned unpaid invoice and returns the resulting invoice after service logic starts the linked consequence. |
| EV-010 | be | `src/tests/helpers/flow-money.ts:147` | test | The shared money-flow helper creates a real SePay wallet-top-up pay link, simulates provider-paid retrieval, delivers the webhook and proves the wallet-credit path rather than a direct deposit shortcut. |
| EV-011 | owner | `decision:70291b8b8e607f84c809331f613b4e1ff3b48d961e9522c6ed3c7e0320b2d809` | owner-decision | The owner requires the Nivo payment flow to correct Wallet surface patterns and cover SePay wallet top-up, return or cancellation reconciliation, transaction management and invoice management under the one strict StarCi visual grammar, across the full desktop and mobile journey. |
