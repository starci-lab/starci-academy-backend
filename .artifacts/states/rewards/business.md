# Rewards (Coin shop) — business state map

Source: rewards/ (RewardsService, VoucherService, rewards.catalog.ts) + RewardRedemptionEntity + CourseVoucherEntity + redeemReward mutation + myRewardWallet/myVouchers queries.

Spend accumulated Coin on a fixed code-defined catalog: streak freeze, AI-credit top-up, 10%-off course voucher, or physical merch (sticker, T-shirt).

## Entities
- RewardRedemptionEntity — userId, rewardKey, cost, status, metadata (jsonb shipping snapshot for physical only).
- CourseVoucherEntity — userId, redemption, course (null=any), code, discountType (percent/flat), value, status, expiresAt, usedAt, reservedTransactionId.
Spendable Coin is NEVER stored — DERIVED as user.coinBalance - SUM(cost of non-cancelled redemptions) at read time.

## States and transitions
Redemption: (redeem) digital/voucher/aiCredit -> Granted [terminal in practice]; physical -> Pending [terminal in practice]. Fulfilled/Cancelled declared but NO code path assigns them (findings #1).
- redeem — one pessimistic-locked tx: lock user row, derive balance (coinBalance - computeSpent), reject if short, apply effect (streak-freeze increment + STREAK_FREEZE_MAX cap; aiCredit grantBonusCredit; voucher mint), insert redemption (Granted digital / Pending physical). Lock makes check+writes atomic — concurrent redeems cannot overspend (the ONE money-race correctly closed with a row lock).

Voucher: Unused -reserve()-> Reserved -markUsed()-> Used [terminal]; Reserved -release()-> Unused (failed checkout); Unused -(past expiresAt, read-time)-> displayed Expired.
- mint inside the SAME tx as redemption insert. reserve claims a voucher for a PENDING checkout under a row lock in the SAME tx that persists TransactionEntity. markUsed settles Reserved->Used on tx success (idempotent). release settles Reserved->Unused on failure. No cron flips stale Unused->Expired; resolver derives displayed status from expiresAt; checkout re-validates so a stale row can never be spent.

## Invariants
1. user.coinBalance NEVER debited directly — spendable = coinBalance - SUM(non-cancelled cost), floored 0.
2. A voucher code claimed by at most one in-flight checkout (Reserved + row lock).
3. "Not found" and "not yours" collapse to InvalidVoucherException(unknown) — enumeration-safe.
4. Streak-freeze redemption can never exceed STREAK_FREEZE_MAX (shared with streak domain).
5. Voucher discount applies ON TOP of the loyalty-discounted price, never reverse.

## Cross-domain
- aiCredit path uses grantBonusCredit inside redeem own locked tx — does NOT share the transactions #1 check-then-act race.
