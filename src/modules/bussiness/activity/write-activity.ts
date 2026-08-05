import {
    ActivityEntity,
    ActivityMetadata,
    ActivityType,
} from "@modules/databases"
import type {
    EntityManager,
} from "typeorm"

/** Params for {@link writeActivity}. */
export interface WriteActivityParams {
    /** Transaction manager -- the activity row is written in the SAME tx as its source effect. */
    entityManager: EntityManager
    /** User who performed the activity (the feed actor). */
    userId: string
    /** Kind of activity. */
    type: ActivityType
    /**
     * Scalar dedup key -- a natural row id, or a synthesized `dedupeKey(...)`.
     * Combined with `type` it is unique, so the activity is idempotent.
     */
    idempotencyKey: string
    /** Denormalised snapshot for rendering the feed without deep joins. */
    metadata?: ActivityMetadata | null
}

/**
 * Append one activity event to the home-feed ledger, idempotently and in the
 * caller's transaction. Guards on the `(type, idempotencyKey)` unique key: if the
 * event was already recorded (re-read lesson, re-graded attempt, re-follow),
 * NOTHING happens -- no duplicate feed row. Mirrors `writeXpHistory`.
 *
 * @param params - See {@link WriteActivityParams}.
 */
export const writeActivity = async (
    {
        entityManager,
        userId,
        type,
        idempotencyKey,
        metadata = null,
    }: WriteActivityParams,
): Promise<void> => {
    // idempotency gate: the same (type, idempotencyKey) must never produce a second
    // feed row; the unique constraint is the hard backstop against races
    const existing = await entityManager.findOne(
        ActivityEntity,
        {
            where: {
                type,
                idempotencyKey,
            },
            select: {
                id: true,
            },
        },
    )
    if (existing) {
        return
    }
    // append the ledger row (the actor relation is set by id)
    await entityManager.save(
        ActivityEntity,
        {
            user: {
                id: userId,
            },
            type,
            idempotencyKey,
            // helper param stays `metadata`; the column is `payload`
            payload: metadata,
        },
    )
}
