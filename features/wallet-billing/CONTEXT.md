# Wallet and invoice settlement

> Business identity: `nivo/wallet-billing@dd906033d14e74ebc0c2197e81e813a521eb2a664ff887a67d42963da20d56b5`
>
> Source heads: `fe@97eec8c5bb4c`, `be@947c6f4a117e`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** An authenticated account owner reads a real auto-provisioned wallet balance, transaction ledger and invoice ledger, then pays the newest unpaid invoice and refreshes all three views.

**Primary actor.** Authenticated account owner

**Primary outcome.** The invoice becomes paid and linked provisioning starts

**Never does.** A wired wallet top-up flow

## Invariants

- `BR-01` — A first wallet read creates a real wallet row, so zero balance is an answer rather than an absent state.
- `BR-02` — Invoice payment is restricted to an unpaid invoice owned by the viewer and starts provisioning for the linked service.

## Primary flow

```text
resting → empty → answered → refused
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `wallet` | `/[locale]/wallet` | Understand the account's available funds and settle service invoices. | [surface](surfaces/wallet.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `myWallet` | backend | none | auto-provisioned wallet |
| `myWalletTransactions` | backend | none | complete transaction ledger |
| `myInvoices` | backend | none | invoice ledger with product labels |
| `payInvoice` | backend | invoiceId | paid invoice and provisioning start |

## Explicit unknowns

- `wallet-top-up-entry` — What flow should the visible Top up action open? Impact: The surface labels the action, but the current connected page supplies no top-up callback.

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
