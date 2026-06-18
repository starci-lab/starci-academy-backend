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
    StreakFreezeLimitReachedException,
    UnknownRewardException,
} from "@modules/exceptions"
import {
    STREAK_FREEZE_MAX,
} from "../streak/streak.service"
import {
    REWARD_CATALOG,
    STREAK_FREEZE_REWARD_KEY,
} from "./rewards.catalog"
import type {
    LocalizedReward,
    RedeemRewardResult,
    RewardDefinition,
    RewardShippingInput,
    RewardSumRow,
    RewardWalletResult,
} from "./types"

/**
 * Reward-store ("điểm quà") business logic. The spendable balance is DERIVED as
 * `user.reward_points - SUM(non-cancelled redemption cost)` so the reward-points
 * balance that ranks the global leaderboard is NEVER debited by spending here.
 * Digital rewards apply their effect on redeem (status `granted`); physical
 * rewards land `pending` for ops to fulfil.
 */
@Injectable()
export class RewardsService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
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
                user.rewardPoints - spent),
            spent,
            redemptions,
        }
    }

    /**
     * Redeem a catalog reward for the user. Runs the balance check + effect + the
     * ledger insert in one pessimistic-locked transaction so concurrent redeems
     * cannot overspend. Never debits `user.reward_points`.
     *
     * @param userId - the redeemer.
     * @param rewardKey - catalog key to redeem.
     * @returns the refreshed balance + streak-freeze count.
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
            const balance = user.rewardPoints - spent
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
            // to fulfil); digital rewards carry no metadata
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
            // record the redemption (digital → granted, physical → pending)
            await manager.insert(RewardRedemptionEntity,
                {
                    userId,
                    rewardKey,
                    cost: reward.cost,
                    status: reward.kind === "digital"
                        ? RewardRedemptionStatus.Granted
                        : RewardRedemptionStatus.Pending,
                    // cast: TypeORM's DeepPartial of a Record<string, unknown> jsonb
                    // column doesn't accept a concrete object literal directly
                    metadata: metadata as never,
                })
            return {
                // reward_points are never debited — the spendable balance is derived
                balance: balance - reward.cost,
                streakFreezes,
            }
        })
    }
}
