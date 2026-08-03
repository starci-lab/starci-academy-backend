# Transactions — findings

Ranked most severe first. Axes: naming, jsdoc, business-logic, edge-case, security, gate-middleware, test-tier.

## 1. [business-logic] "Already granted" idempotency guard is check-then-act, not atomic — a genuine double-grant race
Every terminal-grant path: read tx by id, compare `status === Succeeded` in app code, THEN apply effect and write `status: Succeeded` with unconditional `update` — no `SELECT ... FOR UPDATE`, no conditional `UPDATE ... WHERE status='pending'` (that pattern exists — `updateTransactionStatusIfExpected` — but is used only for Pending→Unpaid, never for grants). Webhook and ReconcileTransactionWorker's delayed poll race finalizing the same tx; both read status!=Succeeded, both grant, both mark Succeeded. AI/membership: duplicate email+notification (state idempotent). Installment: SAME race double-applies `recordPayment` (NOT idempotent) → corrupts installmentsPaid/remainingVnd. Existing e2e idempotency tests only prove SEQUENTIAL replay — false confidence.
- src/features/api/processors/reconcile-transaction/reconcile-transaction.worker.ts:98-185
- src/features/api/core/http/sepay/webhook/webhook.handler.ts:102-116
- src/features/api/core/http/stripe/webhook/webhook.handler.ts:130-143
- root cause: src/modules/ai/ai-entitlement.service.ts:326-376 · src/modules/bussiness/installment-plan/installment-plan.service.ts:302-346

## 2. [validation] Money-mutation request DTOs carry zero class-validator decorators
`PayNextInstallmentRequest` declares planId/paymentType/amountVnd with only `@Field` — no `@IsUUID`, no `@IsEnum(PaymentType)`, no `@IsInt`/`@Min(0)` on amountVnd (buyer-chosen top-up). Malformed/NaN amountVnd reaches the gateway with no declared contract. Same gap on RedeemRewardRequest.
- src/features/api/core/graphql/mutations/installment-plans/pay-next-installment/graphql-types/request.ts:21-74

## 3. [business-logic] Two VND-only checkout modifiers, OPPOSITE failure modes — voucher drops silently, installment throws
`voucherCode` and `installmentMonths` are both optional modifiers on the SAME course-enroll request, and both only actually work on the domestic VND gateways. But when the buyer picks an unsupported gateway they fail in opposite ways:
- `installmentMonths` → the dispatcher throws `InstallmentCurrencyNotSupportedException` before creating anything (course-enroll.handler.ts:86). **Loud, correct.**
- `voucherCode` → no guard anywhere; stripe/paypal/crypto services simply never read the field → buyer types a voucher, pays with Stripe, gets **no discount and no error**. **Silent drop — the buyer overpays.**

The fix is NOT "make voucher throw like installment everywhere" — voucher portability is `discountType`-dependent (voucher.service.ts:346 `applyToAmount`):
- **Percent** (`amount × (1 − value/100)`) is currency-agnostic → CAN and should apply to the USD gateways' `priceUsd`. This is the industry norm (Stripe/Shopify recommend percent for cross-currency promos).
- **Flat** (`amount − value`, value denominated in VND) is currency-bound → must reject loud on USD gateways, never FX-convert (Stripe script-coupons: "currency check … if currencies don't match, return a zero discount"; codebase's own "no runtime FX" rule).

Secondary drift on the same surface:
- **Cart checkout has NO `voucherCode` field at all** (courses-checkout/graphql-types/request.ts) yet DOES carry `installmentMonths` — single-enroll vs cart inconsistent.
- **Stale JSDoc**: request DTO says voucher "honoured by the Sepay gateway only" and CourseEnrollSepayService class-doc says "the ONLY gateway wired" — but PayOS honours it too now (course-enroll-payos.service.ts:176). Docs contradict code.

**Target (design decision 2026-08-04, see business.md "Payment-modifier capability model")**: one capability matrix per `PaymentType` as SSOT + one failure mode (reject loud before any row/checkout) — Percent voucher portable to all gateways, Flat voucher VND-scoped (reject on USD), installment capability-gated like BNPL.
- course-enroll-stripe.service.ts / course-enroll-paypal.service.ts / course-enroll-crypto.service.ts (never read voucherCode)
- course-enroll.handler.ts:86 (installment loud-reject — the pattern voucher should mirror) · voucher.service.ts:339-355 (percent vs flat math)
- course-enroll-sepay.service.ts:57-60 · graphql-types/request.ts:55 (stale claims) · courses-checkout/graphql-types/request.ts (no voucherCode field)

## 4. [jsdoc] TransactionStatus enum — no per-member JSDoc, 2 members dead
transaction-status.ts:11-17 declares Pending/Succeeded/Cancelled/Failed/Unpaid with zero inline JSDoc (canon comments §3 requires it; sibling enums comply). Cancelled/Failed never assigned by production code — every real failure uses Unpaid. FE would build UI for states that never occur.
- src/modules/databases/postgresql/primary/enums/transaction-status.ts:11-17

## 5. [naming] The one unguarded status-write method is the one used to mark a paid tx Succeeded
`updateTransactionStatus` is plain read-then-save no precondition; sibling `updateTransactionStatusIfExpected` exists to close that exact race but is used only for Unpaid. Every Succeeded-write (EnrollStepService) calls the UNGUARDED method — nothing explains why Succeeded-writes are exempt.
- src/modules/bussiness/transactions/atomic/transaction-action.service.ts:40-66 (unguarded) · :77-95 (guarded) · enroll-step.service.ts:196-202,292-298
