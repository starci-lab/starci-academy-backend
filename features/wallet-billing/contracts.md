# Contracts · Wallet, SePay top-up and billing management

## Entity · Wallet (`wallet`)

Fields: `id`, `balanceVnd`

Evidence: `EV-002`, `EV-003`

## Entity · Wallet transaction (`wallet-transaction`)

Fields: `id`, `type`, `amountVnd`, `note`, `createdAt`

Evidence: `EV-003`, `EV-008`

## Entity · Invoice (`invoice`)

Fields: `id`, `amountVnd`, `status`, `dueAt`, `paidAt`, `catalog item`, `catalog tier`

Evidence: `EV-001`, `EV-002`, `EV-009`

## Entity · Wallet top-up pay link (`wallet-top-up-pay-link`)

Fields: `paymentId`, `gateway`, `referenceId`, `checkoutUrl`, `checkoutFields`, `amountVnd`, `chargedAmountVnd`

Evidence: `EV-005`, `EV-006`

## Operation · myWallet

- Kind/owner: `query` / `backend`
- Inputs: none
- Outputs: viewer-owned auto-provisioned wallet
- Failures: read refusal
- Evidence: `EV-002`

## Operation · myWalletTransactions

- Kind/owner: `query` / `backend`
- Inputs: none
- Outputs: viewer-owned wallet transactions newest first
- Failures: read refusal
- Evidence: `EV-003`, `EV-008`

## Operation · myInvoices

- Kind/owner: `query` / `backend`
- Inputs: none
- Outputs: viewer-owned invoice ledger with product labels
- Failures: read refusal
- Evidence: `EV-001`, `EV-002`

## Operation · createWalletTopUpPayLink

- Kind/owner: `mutation` / `backend`
- Inputs: amountVnd, gateway, returnUrl, cancelUrl
- Outputs: pending payment id, gateway reference, checkout URL, signed SePay checkout fields, credit and charged amounts
- Failures: invalid amount, unsupported gateway, payment gateway not configured, gateway refusal
- Evidence: `EV-004`, `EV-005`, `EV-006`

## Operation · SePay signed checkout handoff

- Kind/owner: `redirect` / `provider`
- Inputs: checkoutUrl, checkoutFields
- Outputs: provider payment collection, success or cancellation redirect
- Failures: provider cancellation, provider error
- Evidence: `EV-005`, `EV-006`, `EV-011`

## Operation · SePay payment webhook settlement

- Kind/owner: `event` / `backend`
- Inputs: provider order reference
- Outputs: authenticated paid order routed to wallet-top-up settlement
- Failures: gateway unavailable, order not paid, reference unrecognised, settlement refusal
- Evidence: `EV-007`, `EV-010`

## Operation · payInvoice

- Kind/owner: `mutation` / `backend`
- Inputs: invoiceId
- Outputs: paid invoice, linked provisioning start
- Failures: invoice missing, invoice not owned, invoice not unpaid, insufficient wallet balance
- Evidence: `EV-001`, `EV-009`

No field, failure or operation may appear here without routed source evidence.
