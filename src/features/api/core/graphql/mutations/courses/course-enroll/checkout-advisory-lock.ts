import type {
    EntityManager,
} from "typeorm"

/**
 * Serializes one logical checkout across pods before a provider order exists.
 * A uniqueness error after the gateway call is too late because the duplicate
 * external order is already chargeable.
 */
export const withCheckoutAdvisoryLock = async <Result>(
    entityManager: EntityManager,
    key: string,
    action: (manager: EntityManager) => Promise<Result>,
): Promise<Result> => {
    const queryRunner = entityManager.connection.createQueryRunner()
    await queryRunner.connect()
    try {
        await queryRunner.query(
            "SELECT pg_advisory_lock(hashtextextended($1, 0))",
            [key],
        )
        // The action uses this exact session's manager. Followers may occupy
        // other sessions while waiting, but the lock owner never needs a second
        // pool connection to finish and release the lock.
        return await action(queryRunner.manager)
    } finally {
        await queryRunner.query(
            "SELECT pg_advisory_unlock(hashtextextended($1, 0))",
            [key],
        ).catch(() => undefined)
        await queryRunner.release()
    }
}
