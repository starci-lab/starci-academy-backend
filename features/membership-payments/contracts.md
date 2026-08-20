# Contracts · Membership, gói tải đề và thanh toán

## Entity · Ưu đãi membership (`membership-offer`)

Fields: `enabled`, `monthlyPriceVnd`, `yearlyPriceVnd`, `demoPaperLimit`, `aiCreditsPerDay`, `entitlements`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

## Entity · Gói tải đề (`exam-download-package`)

Fields: `packageId`, `priceVnd`, `continuousUpdates`, `zaloSupport`, `commercialTeaching`, `brandPromotionMonths`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

## Entity · Giao dịch (`payment-transaction`)

Fields: `transactionId`, `referenceId`, `amount`, `status`, `checkoutUrl`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

## Operation · pricingCatalog

- Kind/owner: `query` / `backend`
- Inputs: none
- Outputs: membership offer, exam download packages
- Failures: Catalog disabled, GraphQL error
- Evidence: `EV-002`, `EV-003`, `EV-004`

## Operation · purchaseMembership

- Kind/owner: `mutation` / `backend`
- Inputs: membership request, authenticated customer
- Outputs: checkoutUrl, referenceId, transactionId, amount, checkoutFields
- Failures: Offer disabled, Provider initiation failure
- Evidence: `EV-002`, `EV-003`, `EV-004`

## Operation · reconcile transaction poll

- Kind/owner: `event` / `backend`
- Inputs: transaction id, provider status
- Outputs: Succeeded/Unpaid/Pending, membership or entitlement grant
- Failures: Provider unknown, Amount mismatch
- Evidence: `EV-002`, `EV-003`, `EV-004`

No field, failure or operation may appear here without routed source evidence.
