# Loyalty — business state map

Source: loyalty-discount.service.ts + callers (course-enroll-*, courses-checkout-pricing, course-price-preview, recommended-courses).

Loyalty is PURE derived pricing — no entity, no lifecycle, no persistence. Computes a discount percent from the user history (enrolled courses + diligence) at read time, every time.

## Computation (no persisted state)
- Engagement bonus: +5% per already-owned course (real enrollment count), capped with diligence at MAX_DISCOUNT_PERCENT=30.
- Diligent bonus: flat +5% when current streak >= 7 OR lifetime XP >= 1000.
- Bundle bonus (order-wide): 0% for 1, +5% for exactly 2, +10% for 3+ in the SAME order (tiered, not cumulative).
- Combine: min(MAX_COMBINED_DISCOUNT_PERCENT=40, loyaltyPercent + bundleBonusPercent).
- Progressive cart pricing: line N priced as if the N earlier lines were already owned (extraOwnedCount).

## Invariants
1. Computed fresh from CURRENT DB state every time — nothing to go stale/reconcile.
2. Same service computes preview AND charge price — "shown" == "charged" by construction.
3. Diligence + owned-count fetched ONCE per user per pricing pass, reused across cart lines.
4. 30% engagement cap and 40% combined cap are independent ceilings at different stages.

## Cross-domain
- Feeds transactions at checkout (snapshotted onto TransactionEntity.discountPercent) and rewards voucher discount, which applies ON TOP of the loyalty-discounted price (never reverse).
