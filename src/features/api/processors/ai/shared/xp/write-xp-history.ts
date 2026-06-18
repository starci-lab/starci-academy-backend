import {
    UserEntity,
    XpHistoryEntity,
    XpSource,
} from "@modules/databases"
import type {
    EntityManager,
} from "typeorm"

/** Params for {@link writeXpHistory}. */
export interface WriteXpHistoryParams {
    /** Transaction manager — the XP row is written in the SAME tx as its source effect. */
    entityManager: EntityManager
    /** User who earned the XP. */
    userId: string
    /** Course the XP belongs to (null for course-agnostic). */
    courseId: string | null
    /** Where the XP came from. */
    source: XpSource
    /** XP amount earned (drives the leaderboard signal). */
    amount: number
    /** Reward points granted by the same event (credited to `users.reward_points`). */
    points: number
    /**
     * Stable id of the originating row (attempt / user-content / user-milestone-task).
     * Combined with `source` it is unique, so the whole grant is idempotent.
     */
    refId: string
}

/**
 * Append one XP-earning event to the audit ledger AND credit the user's balances —
 * `users.total_points` by the XP `amount` and `users.reward_points` by the flat
 * `points` reward — idempotently and in the caller's transaction. Guards on the
 * `(source, refId)` unique key: if the event was already recorded, NOTHING happens —
 * no duplicate ledger row and, crucially, no double credit on either balance.
 *
 * @param params - See {@link WriteXpHistoryParams}.
 */
export const writeXpHistory = async (
    {
        entityManager,
        userId,
        courseId,
        source,
        amount,
        points,
        refId,
    }: WriteXpHistoryParams,
): Promise<void> => {
    // idempotency gate: a re-graded attempt / re-read lesson / re-passed task must not
    // re-credit. The (source, refId) unique constraint is the hard backstop for races.
    const existing = await entityManager.findOne(
        XpHistoryEntity,
        {
            where: {
                source,
                refId,
            },
            select: {
                id: true,
            },
        },
    )
    if (existing) {
        return
    }
    // ledger row (audit) — kept even if the user later un-reads, so it is append-only
    await entityManager.save(
        XpHistoryEntity,
        {
            user: {
                id: userId,
            },
            course: courseId ? {
                id: courseId,
            } : null,
            source,
            amount,
            points,
            refId,
        },
    )
    // credit the total lifetime XP balance by the weighted amount (only it tracks XP)
    if (amount !== 0) {
        await entityManager.increment(
            UserEntity,
            {
                id: userId,
            },
            "totalPoints",
            amount,
        )
    }
    // credit the spendable reward-points balance by the flat reward exactly once
    if (points !== 0) {
        await entityManager.increment(
            UserEntity,
            {
                id: userId,
            },
            "rewardPoints",
            points,
        )
    }
}
