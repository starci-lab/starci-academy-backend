# Installment plan — business state map

Source: `src/modules/bussiness/installment-plan/` (InstallmentPlanService, InstallmentPlanEnforcementCronService) + InstallmentPlanEntity + pay-next-installment mutation + ReconcileTransactionWorker.finalize().

Trả góp lets a buyer pay a course order in cycles. Two flavours share one lifecycle + one enforcement cron.

## Entity
**InstallmentPlanEntity** (`installment_plans`) — userId, originTransaction (null=backfilled legacy), lockedCourseIds (jsonb snapshot of every course this plan gates), planType (Fixed|FlexiblePool), status; Fixed block (months, monthlyAmountVnd, totalAmountVnd, markupPercent, installmentsPaid); FlexiblePool block (remainingVnd, minPaymentFloorVnd=500,000đ, minPaymentPercent=10%); shared (nextDueAt, secondReminderAfterDays=7, lockoutAfterDays=14, dueRemindedAt, secondRemindedAt).
- **Fixed** — a NEW purchase paying in 3/6/12 months; markup frozen at checkout. Min/cycle = fixed monthly amount.
- **FlexiblePool** — legacy Pioneer arrears backfilled, no markup/schedule. Min/cycle = max(remainingVnd × minPaymentPercent%, minPaymentFloorVnd), recomputed each cycle.

## States and transitions
```
Active --(nextDueAt passes)--> Overdue --(catches up)--> Active
Overdue --(lockoutAfterDays unpaid)--> Defaulted (enrollments locked)
Defaulted --(pays enough)--> Active/Completed (enrollments unlocked)
Active/Overdue --(schedule/balance finished)--> Completed  [terminal]
```
- **create** — createFixedPlan runs when the FIRST cycle's checkout tx succeeds (reconcile worker → Enroll → reads installment fields off the tx); createFlexiblePoolPlan only by one-off backfill script.
- **pay a cycle** — pay-next-installment charges computeMinPaymentVnd(plan) (FlexiblePool: caller amount ≥ min) via a fresh PayOS/Sepay checkout (VND-only; rejects Stripe/PayPal/Crypto). Plan advances only when that tx is CONFIRMED → applyPaymentForTransaction → recordPayment. Mutation never mutates the plan directly.
- **recordPayment** — Fixed: installmentsPaid+=1, completes at >=months. FlexiblePool: remainingVnd-=paid (floor 0), completes at <=0. Under-min FlexiblePool payment still reduces balance but leaves status/nextDueAt.
- **enforcement cron** (01:00 Asia/Ho_Chi_Minh) sweeps Active/Overdue plans past nextDueAt in 3 stages each guarded by its *RemindedAt so a re-run never double-sends: day0 → first reminder + Active→Overdue; secondReminderAfterDays → final warning; lockoutAfterDays → Defaulted + lock every lockedCourseIds (is_enrolled=false). No late fee (2026-07-05 decision).
- Defaulted plans drop out of the cron query; only a real payment (recordPayment wasDefaulted branch) unlocks + clears reminders.

## Invariants
1. A plan gates a WHOLE checkout's courses together (lockedCourseIds), never one independently.
2. Fixed markup frozen at purchase; never moves.
3. FlexiblePool min always recomputed against CURRENT balance, never below floor.
4. A payment applied at most once per funding tx — INTENDED via check-then-act, NOT proven under concurrency (findings #1).
5. Reminders at most once per cycle; recordPayment clears both timestamps each payment.

## Cross-domain
- pay-next-installment.handler collapses "not found" and "not yours" to one InstallmentPlanNotFoundException — IDOR-safe.
- Shares TransactionEntity ActionType.InstallmentPayment + installmentPlanId with transactions.
- **VND-only is the correct half of the payment-modifier capability model** (transactions/business.md "Payment-modifier capability model"): installment is capability-gated like BNPL — later cycles need a domestic recurring collection, so USD gateways are rejected loudly (course-enroll.handler.ts:86, pay-next-installment.handler.ts:314). This is the pattern the voucher modifier should mirror; unlike voucher, installment already rejects rather than silently dropping.
