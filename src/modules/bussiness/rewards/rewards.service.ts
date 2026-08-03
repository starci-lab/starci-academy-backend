import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    RewardRedemptionEntity,
    RewardRedemptionStatus,
    UserEntity,
} from "@modules/databases"
import type {
    RewardRedemptionMetadata,
} from "@modules/databases"
import {
    InsufficientRewardPointsException,
    RewardRedemptionAlreadyCancelledException,
    RewardRedemptionNotFoundException,
    RewardRedemptionNotFulfillableException,
    StreakFreezeLimitReachedException,
    UnknownRewardException,
} from "@modules/exceptions"
import {
    AiEntitlementService,
} from "@modules/ai"
import {
    STREAK_FREEZE_MAX,
} from "../streak/streak.service"
import {
    REWARD_CATALOG,
    STREAK_FREEZE_REWARD_KEY,
} from "./rewards.catalog"
import {
    VoucherService,
} from "./voucher.service"
import type {
    LocalizedReward,
    RedeemRewardResult,
    RewardDefinition,
    RewardShippingInput,
    RewardSumRow,
    RewardWalletResult,
} from "./types"

/**
 * Reward-store (the Coin shop) business logic. The spendable balance is DERIVED as
 * `user.coin_balance - SUM(non-cancelled redemption cost)` so the Coin
 * balance that ranks the global leaderboard is NEVER debited by spending here.
 * Digital rewards apply their effect on redeem (status `granted`); physical
 * rewards land `pending` for ops to fulfil; `voucher`/`aiCredit` rewards are
 * digital effects too (mint a checkout code / top up the AI credit window).
 */
@Injectable()
export class RewardsService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly voucherService: VoucherService,
        private readonly aiEntitlementService: AiEntitlementService,
    ) {}

    /** Resolve a catalog reward's copy to one locale. */
    private localize(
        reward: RewardDefinition,
        locale: Locale,
    ): LocalizedReward {
        const isVi = locale === Locale.Vi
        return {
            key: reward.key,
            title: isVi ? reward.titleVi : reward.titleEn,
            description: isVi ? reward.descVi : reward.descEn,
            cost: reward.cost,
            kind: reward.kind,
            voucher: reward.voucher,
            aiCredit: reward.aiCredit,
        }
    }

    /** The full catalog, localized to the request locale. */
    getCatalog(locale: Locale): Array<LocalizedReward> {
        return REWARD_CATALOG.map((reward) => this.localize(reward,
            locale))
    }

    /** Look up a single catalog reward by key (undefined when unknown). */
    getReward(key: string): RewardDefinition | undefined {
        return REWARD_CATALOG.find((reward) => reward.key === key)
    }

    /** Localized title for a stored redemption's reward key (key itself as fallback). */
    titleFor(key: string, locale: Locale): string {
        const reward = this.getReward(key)
        if (!reward) {
            return key
        }
        return locale === Locale.Vi ? reward.titleVi : reward.titleEn
    }

    /** Sum the cost of a user's non-cancelled redemptions (the "spent" total). */
    private async computeSpent(
        manager: EntityManager,
        userId: string,
    ): Promise<number> {
        const row = await manager
            .createQueryBuilder(RewardRedemptionEntity,
                "redemption")
            .select("COALESCE(SUM(redemption.cost), 0)",
                "sum")
            .where("redemption.user_id = :userId",
                {
                    userId,
                })
            .andWhere("redemption.status != :cancelled",
                {
                    cancelled: RewardRedemptionStatus.Cancelled,
                })
            .getRawOne<RewardSumRow>()
        return Number(row?.sum) || 0
    }

    /** Read the viewer's wallet: derived balance + spent + redemption history. */
    async getWallet(userId: string): Promise<RewardWalletResult> {
        const user = await this.entityManager.findOneOrFail(UserEntity,
            {
                where: {
                    id: userId,
                },
            })
        const spent = await this.computeSpent(this.entityManager,
            userId)
        const redemptions = await this.entityManager.find(RewardRedemptionEntity,
            {
                where: {
                    userId,
                },
                order: {
                    createdAt: "DESC",
                },
            })
        return {
            // clamp: a balance can never go negative (spend always checks first)
            balance: Math.max(0,
                user.coinBalance - spent),
            spent,
            redemptions,
        }
    }

    /**
     * Redeem a catalog reward for the user. Runs the balance check + effect + the
     * ledger insert in one pessimistic-locked transaction so concurrent redeems
     * cannot overspend. Never debits `user.coin_balance`.
     *
     * @param userId - the redeemer.
     * @param rewardKey - catalog key to redeem.
     * @returns the refreshed balance + streak-freeze count (+ voucher code /
     * granted AI credit when the redeemed reward mints one).
     */
    async redeem(
        userId: string,
        rewardKey: string,
        shipping?: RewardShippingInput,
    ): Promise<RedeemRewardResult> {
        const reward = this.getReward(rewardKey)
        if (!reward) {
            throw new UnknownRewardException({
                rewardKey,
            })
        }
        return this.entityManager.transaction(async (manager) => {
            // lock the user row so the balance/cap check + writes are atomic
            const user = await manager.findOneOrFail(UserEntity,
                {
                    where: {
                        id: userId,
                    },
                    lock: {
                        mode: "pessimistic_write",
                    },
                })
            const spent = await this.computeSpent(manager,
                userId)
            const balance = user.coinBalance - spent
            if (balance < reward.cost) {
                throw new InsufficientRewardPointsException({
                    balance,
                    cost: reward.cost,
                })
            }
            let streakFreezes = user.streakFreezes
            // streak-freeze reward: enforce the inventory cap + credit one freeze
            if (rewardKey === STREAK_FREEZE_REWARD_KEY) {
                if (streakFreezes >= STREAK_FREEZE_MAX) {
                    throw new StreakFreezeLimitReachedException({
                        max: STREAK_FREEZE_MAX,
                    })
                }
                streakFreezes += 1
                await manager.update(UserEntity,
                    {
                        id: userId,
                    },
                    {
                        streakFreezes,
                    })
            }
            // snapshot shipping onto the metadata for physical rewards (ops uses it
            // to fulfil); digital/voucher/aiCredit rewards carry no metadata
            const hasShipping = Boolean(
                shipping
                && (shipping.recipientName || shipping.phone || shipping.address),
            )
            // jsonb metadata: `undefined` (→ column null) when absent + plain strings
            // for present fields — TypeORM's DeepPartial of a Record<string, unknown>
            // jsonb column rejects null/unknown values
            const metadata: RewardRedemptionMetadata | undefined =
                reward.kind === "physical" && hasShipping
                    ? {
                        recipientName: shipping?.recipientName ?? "",
                        phone: shipping?.phone ?? "",
                        address: shipping?.address ?? "",
                    }
                    : undefined
            // record the redemption (digital/voucher/aiCredit → granted, physical → pending)
            const inserted = await manager.insert(RewardRedemptionEntity,
                {
                    userId,
                    rewardKey,
                    cost: reward.cost,
                    status: reward.kind === "physical"
                        ? RewardRedemptionStatus.Pending
                        : RewardRedemptionStatus.Granted,
                    // cast: TypeORM's DeepPartial of a Record<string, unknown> jsonb
                    // column doesn't accept a concrete object literal directly
                    metadata: metadata as never,
                })
            const redemptionId = inserted.identifiers[0]?.id as string
            // voucher-kind: mint a redeemable checkout code, echo it in the result
            let voucherCode: string | undefined
            if (reward.kind === "voucher" && reward.voucher) {
                const voucher = await this.voucherService.mint({
                    entityManager: manager,
                    userId,
                    redemptionId,
                    config: reward.voucher,
                })
                voucherCode = voucher.code
            }
            // aiCredit-kind: top up the CURRENT 5h + weekly window's allowance
            let aiCreditGranted: RedeemRewardResult["aiCreditGranted"]
            if (reward.kind === "aiCredit" && reward.aiCredit) {
                await this.aiEntitlementService.grantBonusCredit({
                    userId,
                    amount5h: reward.aiCredit.amount5h,
                    amountWeek: reward.aiCredit.amountWeek,
                    entityManager: manager,
                })
                aiCreditGranted = reward.aiCredit
            }
            return {
                // coin_balance is never debited — the spendable balance is derived
                balance: balance - reward.cost,
                streakFreezes,
                voucherCode,
                aiCreditGranted,
            }
        })
    }

    /**
     * Ops-only: mark a `pending` physical redemption `fulfilled` (the gift has
     * shipped). Rejects any redemption that isn't currently `pending` — a
     * digital reward is already `granted` on redeem, and an already
     * `fulfilled`/`cancelled` row has nothing left to transition.
     *
     * @param redemptionId - the redemption to fulfil.
     * @returns the redemption row after the transition.
     */
    async fulfillRedemption(redemptionId: string): Promise<RewardRedemptionEntity> {
        return this.entityManager.transaction(async (manager) => {
            // lock the row so a concurrent fulfil/cancel can't race the same redemption
            const redemption = await manager.findOne(RewardRedemptionEntity,
                {
                    where: {
                        id: redemptionId,
                    },
                    lock: {
                        mode: "pessimistic_write",
                    },
                })
            if (!redemption) {
                throw new RewardRedemptionNotFoundException({
                    redemptionId,
                })
            }
            if (redemption.status !== RewardRedemptionStatus.Pending) {
                throw new RewardRedemptionNotFulfillableException({
                    redemptionId,
                    status: redemption.status,
                })
            }
            redemption.status = RewardRedemptionStatus.Fulfilled
            return manager.save(redemption)
        })
    }

    /**
     * Ops-only: void a redemption — sets it `cancelled`. `computeSpent` EXCLUDES
     * `cancelled` rows from the spent sum, so flipping the status alone IS the
     * refund; this never touches `user.coin_balance` (same never-debit invariant
     * as {@link redeem}, so the double-refund a direct coin credit would cause
     * cannot happen).
     *
     * @param redemptionId - the redemption to cancel/refund.
     * @returns the redemption row after the transition.
     */
    async cancelRedemption(redemptionId: string): Promise<RewardRedemptionEntity> {
        return this.entityManager.transaction(async (manager) => {
            // lock the row so a concurrent fulfil/cancel can't race the same redemption
            const redemption = await manager.findOne(RewardRedemptionEntity,
                {
                    where: {
                        id: redemptionId,
                    },
                    lock: {
                        mode: "pessimistic_write",
                    },
                })
            if (!redemption) {
                throw new RewardRedemptionNotFoundException({
                    redemptionId,
                })
            }
            if (redemption.status === RewardRedemptionStatus.Cancelled) {
                throw new RewardRedemptionAlreadyCancelledException({
                    redemptionId,
                })
            }
            redemption.status = RewardRedemptionStatus.Cancelled
            return manager.save(redemption)
        })
    }
}
