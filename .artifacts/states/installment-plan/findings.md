# Installment plan — findings

Ranked most severe first. Axes: naming, jsdoc, business-logic, edge-case, security, gate-middleware, test-tier.

## 1. [business-logic] applyPaymentForTransaction idempotency guard is check-then-act — concurrent double-fire double-applies a NON-idempotent payment
Reads tx, checks status===Succeeded in app code, THEN recordPayment (mutates installmentsPaid/remainingVnd — NOT idempotent), THEN unconditional update status:Succeeded — no row lock, no conditional WHERE. Reconcile worker fires from the SAME race window as transactions #1 (poll vs webhook). A double-fire credits the plan for TWICE the amount paid → understates what the buyer owes. No concurrent (or any) test exists.
- src/modules/bussiness/installment-plan/installment-plan.service.ts:302-346 · :222-289 (recordPayment not idempotent)

## 2. [edge-case] recordPayment throws a raw ORM error instead of a typed exception on a plan-id miss
recordPayment calls `findOneByOrFail` → TypeORM EntityNotFoundError, not a typed AbstractException (InstallmentPlanNotFoundException already used one file over). Per error-handling §3 the driver error crosses straight into the queue worker unfiltered → BullMQ retry/dead-letter decided against a driver exception.
- src/modules/bussiness/installment-plan/installment-plan.service.ts:230-235

## 3. [test-tier] Zero unit + e2e coverage for the entire installment-plan business logic
No *.spec.ts under the domain — computeMinPaymentVnd (charge formula), recordPayment (ledger mutation), applyPaymentForTransaction (finding #1 guard), lock/unlockGatedEnrollments all unverified. Sibling transactions + loyalty both have unit coverage. No e2e for pay-next-installment or the reconcile InstallmentPayment branch.
- src/modules/bussiness/installment-plan/installment-plan.service.ts · installment-plan-enforcement.cron.ts

## 4. [jsdoc] Enforcement cron stage-ordering is undocumented as load-bearing
enforceOne relies on stage-3/stage-2 `if` blocks each unconditionally `return`-ing so stage-1 only runs when daysPastDue < secondReminderAfterDays. Correct today, but nothing states the stages are mutually exclusive BY the early returns; a 4th stage or a removed return would silently double-fire a reminder.
- src/modules/bussiness/installment-plan/installment-plan-enforcement.cron.ts:117-195
