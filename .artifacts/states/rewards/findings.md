# Rewards (Coin shop) — findings

Ranked most severe first. Axes: naming, jsdoc, business-logic, edge-case, security, gate-middleware, test-tier.

## 1. [business-logic] Two of four declared redemption states are unreachable — a physical reward has no fulfillment path anywhere
RewardRedemptionStatus.Fulfilled and .Cancelled are declared+documented ("physical shipped", "voided — refunds balance") but NOTHING in src/ or apps/ ever writes either. No ops mutation, no resolver, no script transitions a Pending physical redemption to Fulfilled, and no way to Cancelled/refund spent Coin. A T-shirt redemption (11,000 Coin) leaves a Pending row changeable only by a direct DB edit; the spent total that gates the balance can never be refunded through the product.
- src/modules/databases/postgresql/primary/enums/reward-redemption-status.ts:14-23 · rewards.service.ts (only inserts Granted/Pending)

## 2. [validation] RedeemRewardRequest carries zero class-validator decorators, incl. unbounded shipping free-text
Declares rewardKey/recipientName?/phone?/address? with only @Field — no @IsString, no @MaxLength. Shipping fields snapshotted verbatim into metadata (jsonb) have no upper bound at the boundary. Same class as PayNextInstallmentRequest.
- src/features/api/core/graphql/mutations/rewards/redeem-reward/graphql-types/request.ts:14-49

## 3. [test-tier] Zero coverage for RewardsService and VoucherService — the only untested money-mutation services of the four domains
No *.spec.ts for rewards.service.ts or voucher.service.ts, no e2e for redeemReward/myVouchers/reserve-settle. Pessimistic-locked balance-check-and-spend, STREAK_FREEZE_MAX cap, reserve/release/markUsed idempotency all unverified.
- src/modules/bussiness/rewards/rewards.service.ts · voucher.service.ts

## 4. [naming] RewardsService.redeem breaks the codebase named-params convention
redeem(userId, rewardKey, shipping?) takes 3 positional args while every other service destructures a params object — incl. RedeemRewardParams (defined types/index.ts:101-107 but never used as the signature).
- src/modules/bussiness/rewards/rewards.service.ts:158-162 · types/index.ts:101-107 (dead type)
