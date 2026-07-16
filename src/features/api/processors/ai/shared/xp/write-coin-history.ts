import {
    CoinHistoryEntity,
    CoinSource,
    UserEntity,
} from "@modules/databases"
import type {
    EntityManager,
} from "typeorm"

/** Params for {@link writeCoinHistory}. */
export interface WriteCoinHistoryParams {
    /** Transaction manager — the Coin row is written in the SAME tx as its source effect. */
    entityManager: EntityManager
    /** User who was granted the Coin. */
    userId: string
    /** Where the Coin came from. */
    source: CoinSource
    /** Coin amount granted (credited to `users.coin_balance`). */
    points: number
    /**
     * Stable id of the originating grant (e.g. a claim's `key:weekStart`).
     * Combined with `source` it is unique, so the whole grant is idempotent.
     */
    refId: string
}

/**
 * Append one Coin-earning event to the audit ledger AND credit
 * `users.coin_balance` — idempotently and in the caller's transaction. Guards
 * on the `(source, refId)` unique key: if the event was already recorded,
 * NOTHING happens — no duplicate ledger row and no double credit. Coin-only
 * counterpart of {@link writeXpHistory} — use THIS for a grant that never
 * earns XP (daily quest, streak bonus, KPI reward, weekly-challenge reward);
 * use `writeXpHistory` for anything that also earns weighted, per-course XP.
 *
 * @param params - See {@link WriteCoinHistoryParams}.
 */
export const writeCoinHistory = async (
    {
        entityManager,
        userId,
        source,
        points,
        refId,
    }: WriteCoinHistoryParams,
): Promise<void> => {
    // idempotency gate: a re-claimed/re-triggered grant must not re-credit.
    // The (source, refId) unique constraint is the hard backstop for races.
    const existing = await entityManager.findOne(
        CoinHistoryEntity,
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
    // ledger row (audit) — append-only
    await entityManager.save(
        CoinHistoryEntity,
        {
            user: {
                id: userId,
            },
            source,
            points,
            refId,
        },
    )
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
