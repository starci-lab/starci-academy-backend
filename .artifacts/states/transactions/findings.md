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

## 3. [business-logic] Voucher-code support silently inconsistent across the 5 gateways
`voucherCode` accepted on every course-enroll-* variant, but only sepay + payos call VoucherService. Stripe/paypal/crypto never reference voucherCode → buyer types a voucher, pays with Stripe, gets no error and no discount. Contrast installmentMonths on the SAME request which throws for unsupported gateways. Cart checkout has no voucherCode field at all. sepay doc "ONLY gateway wired" vs payos doc "Second gateway wired" — stale/contradictory.
- course-enroll-stripe.service.ts / course-enroll-paypal.service.ts / course-enroll-crypto.service.ts (no reference)
- course-enroll-sepay.service.ts:57-60 (stale claim) · courses-checkout.handler.ts (no field)

## 4. [jsdoc] TransactionStatus enum — no per-member JSDoc, 2 members dead
transaction-status.ts:11-17 declares Pending/Succeeded/Cancelled/Failed/Unpaid with zero inline JSDoc (canon comments §3 requires it; sibling enums comply). Cancelled/Failed never assigned by production code — every real failure uses Unpaid. FE would build UI for states that never occur.
- src/modules/databases/postgresql/primary/enums/transaction-status.ts:11-17

## 5. [naming] The one unguarded status-write method is the one used to mark a paid tx Succeeded
`updateTransactionStatus` is plain read-then-save no precondition; sibling `updateTransactionStatusIfExpected` exists to close that exact race but is used only for Unpaid. Every Succeeded-write (EnrollStepService) calls the UNGUARDED method — nothing explains why Succeeded-writes are exempt.
- src/modules/bussiness/transactions/atomic/transaction-action.service.ts:40-66 (unguarded) · :77-95 (guarded) · enroll-step.service.ts:196-202,292-298
