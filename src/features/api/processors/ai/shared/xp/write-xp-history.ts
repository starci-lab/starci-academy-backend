import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    XpHistoryEntity,
} from "@modules/databases/postgresql/primary/entities/xp-history.entity"
import {
    XpSource,
} from "@modules/databases/postgresql/primary/enums/xp-source"
import type {
    EntityManager,
} from "typeorm"

/** Params for {@link writeXpHistory}. */
export interface WriteXpHistoryParams {
    /** Transaction manager -- the XP row is written in the SAME tx as its source effect. */
    entityManager: EntityManager
    /** User who earned the XP. */
    userId: string
    /** Course the XP belongs to (null for course-agnostic). */
    courseId: string | null
    /** Where the XP came from. */
    source: XpSource
    /** XP amount earned (drives the leaderboard signal). */
    amount: number
    /** Coin granted by the same event (credited to `users.coin_balance`). */
    points: number
    /**
     * Stable id of the originating row (attempt / user-content / user-milestone-task).
     * Combined with `source` it is unique, so the whole grant is idempotent.
     */
    refId: string
}

/**
 * Append one XP-earning event to the audit ledger AND credit `users.coin_balance`
 * by the flat `points` reward -- idempotently and in the caller's transaction.
 * Guards on the `(source, refId)` unique key: if the event was already recorded,
 * NOTHING happens -- no duplicate ledger row and, crucially, no double credit.
 *
 * The global "Points" figure (total XP summed across every course + coding) is
 * NOT a separately-maintained counter -- it's `SUM(amount) FROM xp_histories`,
 * computed live by {@link UserXpProjectionService} (single source of truth,
 * ledger-derived, same as the per-course/per-source breakdowns). This function
 * intentionally does NOT increment any XP counter on the user row.
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
    // ledger row (audit) -- kept even if the user later un-reads, so it is append-only
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
    // XP itself is never counter-maintained -- the ledger row above IS the
    // source of truth; UserXpProjectionService derives every XP figure
    // (per-source + global "Points") from `SUM(amount) FROM xp_histories`.
    // credit the spendable Coin balance by the flat reward exactly once
    if (points !== 0) {
        await entityManager.increment(
            UserEntity,
            {
                id: userId,
            },
            "coinBalance",
            points,
        )
    }
}
