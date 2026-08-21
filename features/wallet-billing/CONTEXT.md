# Wallet, SePay top-up and billing management

> Business identity: `nivo/wallet-billing@157cfe622695ef39445ddbe5aee97bad553f62981b877ff0bcf44b12cbb6b9a1`
>
> Source heads: authority `pending` · base `241107b6d73a43cf24ecef222036bfb5d25aa3a816d38b04d5917fc62177e042` · `fe@3102d35bfa73`, `be@947c6f4a117e`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** An authenticated account owner reviews the wallet, starts a real SePay top-up, returns to reconcile the credited balance and transaction ledger, and manages wallet transactions and service invoices from one coherent payment flow.

**Primary actor.** Authenticated account owner

**Primary outcome.** A confirmed SePay top-up credits the wallet exactly once and appears in the transaction ledger

**Never does.** Frontend or backend source implementation in this business-analysis run

## Invariants

- `BR-01` — A first wallet read creates a real zero-balance wallet; zero is an answered value, not an absent wallet.
- `BR-02` — A SePay top-up accepts a positive VND amount, records a pending wallet-top-up payment and returns a reference, checkout endpoint and signed checkout fields before any wallet credit is claimed.
- `BR-03` — Wallet credit occurs only after the authenticated SePay webhook retrieves a paid provider order and routes the matching wallet-top-up settlement.
- `BR-04` — Wallet transactions are viewer-scoped and returned newest first with deposit or spend direction, amount, optional note and creation time.
- `BR-05` — Invoice settlement is restricted to an owned unpaid invoice and starts provisioning for its linked service after payment.

## Primary flow

```text
wallet-ready → top-up-entry → checkout-creating → checkout-handoff → reconciling → history-ready
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `wallet-payment` | `/:locale/wallet` | Top up account funds, trace every wallet movement and settle service invoices without losing the payment consequence. | [surface](surfaces/wallet-payment.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `myWallet` | backend | none | viewer-owned auto-provisioned wallet |
| `myWalletTransactions` | backend | none | viewer-owned wallet transactions newest first |
| `myInvoices` | backend | none | viewer-owned invoice ledger with product labels |
| `createWalletTopUpPayLink` | backend | amountVnd, gateway, returnUrl, cancelUrl | pending payment id, gateway reference, checkout URL, signed SePay checkout fields, credit and charged amounts |
| `SePay signed checkout handoff` | provider | checkoutUrl, checkoutFields | provider payment collection, success or cancellation redirect |
| `SePay payment webhook settlement` | backend | provider order reference | authenticated paid order routed to wallet-top-up settlement |
| `payInvoice` | backend | invoiceId | paid invoice, linked provisioning start |

## Explicit unknowns

- `payment-status-read` — Which authenticated operation returns the payment ledger status and expiry after the browser returns from SePay? Impact: The current contract can prove wallet credit by refreshing balance and transactions, but it cannot distinguish authoritative pending, failed and expired payment states in the UI.
- `provider-error-disposition` — How should the frontend distinguish a buyer cancellation from a SePay provider error when both currently return through the cancellation URL? Impact: The design can render honest cancelled-or-unresolved recovery, but separate final error copy needs a stronger redirect or payment-status contract.

## LOADS

| Need | Read |
|---|---|
| Scope, terminology and exclusions | [overview.md](overview.md) |
| Actor permissions and ownership | [actors.md](actors.md) |
| One user journey | `flows/<flow-id>.md` |
| One renderable screen | `surfaces/<surface-id>.md` |
| Business invariants | [rules.md](rules.md) |
| State transitions | [states.md](states.md) |
| Entities, inputs, outputs and failures | [contracts.md](contracts.md) |
| Completion and regression proof | [acceptance.md](acceptance.md) |
| Machine rendering/query | [model.json](model.json) |
| Exact source provenance | [evidence.json](evidence.json) |

## Context rule

Do not load every module by default. `CONTEXT.md` plus the one flow or surface being changed is the normal prompt. `model.json` is authoritative for machines; Markdown files are generated projections. Unknowns remain unknown until routed source or an explicit owner decision resolves them.
