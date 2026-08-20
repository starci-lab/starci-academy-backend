# Contracts · Wallet and invoice settlement

## Entity · Wallet (`entity-1`)

Fields: `id`, `balanceVnd`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## Entity · Invoice (`entity-2`)

Fields: `id`, `amountVnd`, `status`, `dueAt`, `catalog item`, `catalog tier`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## Entity · Wallet transaction (`entity-3`)

Fields: `id`, `type`, `amountVnd`, `createdAt`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## Operation · myWallet

- Kind/owner: `query` / `backend`
- Inputs: none
- Outputs: auto-provisioned wallet
- Failures: read refusal
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## Operation · myWalletTransactions

- Kind/owner: `query` / `backend`
- Inputs: none
- Outputs: complete transaction ledger
- Failures: read refusal
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## Operation · myInvoices

- Kind/owner: `query` / `backend`
- Inputs: none
- Outputs: invoice ledger with product labels
- Failures: read refusal
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## Operation · payInvoice

- Kind/owner: `mutation` / `backend`
- Inputs: invoiceId
- Outputs: paid invoice and provisioning start
- Failures: invoice missing, not owned or not unpaid
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

No field, failure or operation may appear here without routed source evidence.
