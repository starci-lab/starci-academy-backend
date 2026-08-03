# Transactions — business state map

Source: `src/modules/bussiness/transactions/` (`TransactionActionService`,
`TransactionReconcileQueryService`) + `TransactionEntity`
(`src/modules/databases/postgresql/primary/entities/transaction.entity.ts`) +
the five payment-gateway webhook handlers under `src/features/api/core/http/{sepay,payos,stripe,paypal,nowpayments}/webhook/`
+ `ReconcileTransactionWorker` (`src/features/api/processors/reconcile-transaction/`)
+ `EnrollStepService` (`src/features/api/processors/enroll/steps/`) + the checkout
mutations (`courses-checkout`, `course-enroll-*`, `purchase-membership`,
`purchase-ai-subscription`, `pay-next-installment`).

A `TransactionEntity` is the one row every paid action in the platform funnels
through: buying a course (single or cart), an AI subscription, a community
membership, or one cycle of an installment plan. Nothing is granted to a user
until a transaction reaches its terminal paid state.

## Entity

**TransactionEntity** (`transactions`) — `userId`, `courseId` (null for a
multi-course cart order or a non-course purchase), `referenceId` (gateway
order code / invoice number), `providerPaymentId` (native gateway id — Stripe
session, PayPal order, NOWPayments invoice; null for PayOS/Sepay, which are
looked up by `referenceId` instead), `amount` (VND, already discounted),
`discountPercent`, `voucherCode`, `pricingPhase`, `checkoutUrl`, `status`,
`paymentType` (PayOS/Sepay/Stripe/Paypal/Crypto), `actionType`
(`Enroll` / `AiSubscriptionPurchase` / `MembershipPurchase` /
`InstallmentPayment`), plus a block of installment-intent fields
(`installmentPlanId`, `installmentMonths`, `installmentMarkupPercent`,
`installmentTotalVnd`) that carry a first-cycle checkout's installment choice
through to the worker that creates the plan.

A **cart order** (`courses-checkout`) has `course: null` on the transaction
and fans out into one `TransactionItemEntity` row per course line instead —
the transaction is the order, the items are the lines.

## States and transitions

```
Pending --(gateway confirms paid)--> Succeeded   [terminal, grants effect]
Pending --(gateway terminal non-paid, or reconcile exhausts retries)--> Unpaid  [terminal]
Cancelled, Failed                                 [declared in the enum, never
                                                    reached by any real code path]
```

- **create** — a checkout mutation (`courses-checkout`, `course-enroll-{sepay,payos,stripe,paypal,crypto}`,
  `purchase-membership`, `purchase-ai-subscription`, `pay-next-installment`)
  prices the order (loyalty discount + optional voucher + optional bundle
  bonus), opens a gateway checkout, and inserts the row as `Pending`. A
  **reuse window** (`envConfig().services.api.transaction.timeSinceCreationMs`)
  lets a repeat call within that window hand back the SAME pending
  transaction + a freshly signed checkout instead of opening a second one.
- **Pending → Succeeded** happens from TWO independent paths that race each
  other and are meant to converge on the same outcome:
  1. The gateway's **webhook** (`sepay`/`payos`/`stripe`/`paypal`/`nowpayments`
     `webhook.handler.ts`) re-verifies payment server-to-server (never trusts
     the inbound payload alone), then re-queries the transaction
     `WHERE referenceId = X AND status = Pending` — a row already advanced by
     the OTHER path is simply not found, and the webhook throws
     `TransactionNotFoundException` (safe no-op from the gateway's point of
     view; it just re-delivers).
  2. `ReconcileTransactionWorker`, enqueued on a delay at checkout time,
     independently polls the gateway (`TransactionReconcileQueryService.resolve`)
     and reaches the SAME grant path (`finalize()`) if the gateway confirms
     paid before the webhook arrives.
  Both paths dispatch on `actionType`: `Enroll` hands off to the enroll job
  queue (`EnrollStepService`, one job per course line); `AiSubscriptionPurchase`
  / `MembershipPurchase` grant directly inline; `InstallmentPayment` calls
  `InstallmentPlanService.applyPaymentForTransaction`. Every one of these grant
  paths ALSO marks the transaction `Succeeded` as its last step (see
  `findings.md` #1 for how that guard is implemented).
- **Pending → Unpaid**: only `ReconcileTransactionWorker` sets this, and only
  through `updateTransactionStatusIfExpected` (a single guarded
  `UPDATE ... WHERE status = 'pending'`) — never a plain
  read-then-write — specifically so a webhook that lands in the same instant
  the reconcile poll decides "unpaid" cannot be clobbered back to `Pending`'s
  opposite. Three ways to reach it: the gateway reports a terminal non-paid
  state (cancelled/expired/voided), or the poll budget
  (`maxAttempts`) is exhausted for a non-crypto gateway. **Crypto is the
  exception**: a not-yet-confirmed crypto invoice is NEVER marked `Unpaid` by
  the poll loop (settlement can arrive well after the poll budget) — it just
  stops polling and leaves the row `Pending` forever, waiting on a late
  NOWPayments IPN.
- **Cancelled / Failed are dead states** — declared in `TransactionStatus`
  but no production code path ever assigns them (see `findings.md` #4).
  A FE should not build UI for these.

## Invariants

1. **A transaction is granted at most once.** Every terminal-grant path reads
   the transaction, checks it is not already `Succeeded`, applies its effect,
   and marks it `Succeeded` — all meant to run as one guard. This guard is
   check-then-act, not atomic (see `findings.md` #1) — the invariant is the
   INTENT, not a proven guarantee under concurrency.
2. **The webhook never trusts the inbound payload as proof of payment.**
   Every gateway handler re-queries (Sepay: order-detail API; Stripe: the
   `payment_status` field on the verified event's session; PayPal: order
   status, capturing an `APPROVED`-but-uncaptured order itself if needed)
   before granting anything.
3. **Amount is re-derived server-side, never trusted from the client** — the
   loyalty percent, voucher discount, and bundle bonus are all recomputed at
   checkout from the SAME services that price the preview, so "what the buyer
   was shown" always equals "what is charged" (see the `loyalty` and
   `rewards` business maps for the discount math itself).
4. **A stale checkout expires.** `envConfig().services.api.transaction.timeSinceCreationMs`
   gates both the reuse window (a fresh-enough `Pending` row is handed back
   instead of opening a duplicate checkout) and the webhook's own staleness
   check (`TransactionExpiredError` when a callback arrives too late).
5. **A voucher/installment intent is snapshotted onto the transaction at
   creation**, never re-evaluated at grant time — `voucherCode`,
   `installmentMonths`/`installmentMarkupPercent`/`installmentTotalVnd` are
   read back by the grant path (voucher settle, or the enroll worker creating
   the `Fixed` installment plan) exactly as priced at checkout.
6. **Checkout modifiers are gateway-capability-gated** — see the capability
   model below and `findings.md` #3. As-built this is only half-true (installment
   rejects loudly, voucher drops silently); the model is the agreed target.

## Payment-modifier capability model (design decision 2026-08-04)

The two optional checkout modifiers (`voucherCode`, `installmentMonths`) are not
uniformly supportable across the five gateways, because the gateways split on a
**currency axis**: PayOS/Sepay charge **VND** (`amount`), Stripe/PayPal/Crypto
charge an explicit **USD** price (`priceUsd`, no runtime FX). The agreed model —
grounded in how Stripe/Shopify/Udemy handle cross-currency promotions and how
BNPL (Klarna/Affirm/Afterpay) gates installments by region — is:

| Modifier | International (USD gateways) | Domestic (VND gateways) |
| --- | --- | --- |
| Voucher **Percent** | honoured — applies to `priceUsd` (currency-agnostic) | honoured — applies to VND |
| Voucher **Flat** | **rejected** (a flat-VND value can't be charged in USD without FX; future: issue a separate flat-USD voucher, per-currency like Stripe coupons) | honoured — applies to VND |
| **Installment** (trả góp) | **rejected** — later cycles need a domestic recurring collection (`pay-next-installment` is PayOS/Sepay only); FE should hide the option per selected gateway, exactly like BNPL eligibility | honoured — PayOS/Sepay |

Two rules make this consistent:

1. **One SSOT capability matrix per `PaymentType`** — `{ currency, supportsVoucherPercent, supportsVoucherFlat, supportsInstallment }` — instead of each service deciding ad hoc.
2. **One failure mode: reject loud, before any row or checkout is created.** An unsupported modifier throws a typed exception — never the current silent drop (a Percent/Flat voucher ignored by Stripe/PayPal/Crypto) and never a runtime FX conversion.

As-built gap (see `findings.md` #3): installment already rejects loudly
(course-enroll.handler.ts:86); voucher is honoured only by PayOS+Sepay and is
**silently ignored** by Stripe/PayPal/Crypto; cart checkout carries
`installmentMonths` but has **no `voucherCode` field at all**. Bringing the code
to this model means wiring Percent-voucher into the USD gateways, rejecting Flat
vouchers there loudly, and reconciling the cart surface.

## Cross-domain notes

- Grant effects live in OTHER domains' services (`AiEntitlementService.grantTier`,
  `MembershipService.grantMembership`, `EnrollStepService`,
  `InstallmentPlanService.applyPaymentForTransaction`) but all follow the SAME
  "read transaction, check not-already-succeeded, apply effect, mark
  succeeded" shape — the concurrency risk documented here (`findings.md` #1)
  applies to every one of them, not just installment payments.
- `VoucherService.reserve`/`markUsed`/`release` (rewards domain) is threaded
  through the SAME db transaction that inserts/settles the `TransactionEntity`
  row — see the `rewards` business map for the voucher's own lifecycle.
