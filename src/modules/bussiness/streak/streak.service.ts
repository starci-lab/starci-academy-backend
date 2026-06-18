import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
import {
    StreakFreezeInsufficientPointsException,
    StreakFreezeLimitReachedException,
} from "@modules/exceptions"
import type {
    BuyStreakFreezeResult,
} from "./types"

/** Points cost of a single streak freeze. */
export const STREAK_FREEZE_COST = 100

/** Maximum number of streak freezes a user may hold at once. */
export const STREAK_FREEZE_MAX = 3

/**
 * Streak-freeze inventory business logic: buying a freeze (spending points) and
 * the daily auto-protect consumption are owned here. The auto-protect cron lives
 * in {@link StreakFreezeCronService}; this service holds the transactional spend
 * + the candidate query so both paths share one connection.
 */
@Injectable()
export class StreakService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Buy one streak freeze for a user, spending {@link STREAK_FREEZE_COST}
     * reward points. Throws when the user lacks the points or already holds the
     * max. The read-check-write runs in a single transaction with a row re-read so
     * a concurrent buy cannot overspend.
     *
     * @param userId - the buyer.
     * @returns the refreshed freeze count + reward-points balance.
     */
    async buyStreakFreeze(userId: string): Promise<BuyStreakFreezeResult> {
        return this.entityManager.transaction(async (manager) => {
            // re-read inside the txn (pessimistic write lock) so the balance/cap
            // check and the debit are atomic against concurrent purchases
            const user = await manager.findOneOrFail(
                UserEntity,
                {
                    where: {
                        id: userId,
                    },
                    lock: {
                        mode: "pessimistic_write",
                    },
                },
            )
            // cap check first: a maxed-out inventory is a hard stop regardless of points
            if (user.streakFreezes >= STREAK_FREEZE_MAX) {
                throw new StreakFreezeLimitReachedException({
                    max: STREAK_FREEZE_MAX,
                })
            }
            // affordability check against the live (locked) reward-points balance
            if (user.rewardPoints < STREAK_FREEZE_COST) {
                throw new StreakFreezeInsufficientPointsException({
                    points: user.rewardPoints,
                    cost: STREAK_FREEZE_COST,
                })
            }
            // atomic spend: debit reward points, credit one freeze
            const points = user.rewardPoints - STREAK_FREEZE_COST
            const streakFreezes = user.streakFreezes + 1
            await manager.update(
                UserEntity,
                {
                    id: userId,
                },
                {
                    rewardPoints: points,
                    streakFreezes,
                },
            )
            return {
                streakFreezes,
                points,
            }
        })
    }
}
