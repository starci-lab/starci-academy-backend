import type {
    EntityManager,
} from "typeorm"

/**
 * Serialize grading for one learner/session across requests and application
 * replicas. The lock covers the external model call because locking only the
 * final INSERT would still allow a duplicate request to consume model capacity
 * and learner credit before the uniqueness constraint rejected its attempt.
 */
export const withMockInterviewGradeAdvisoryLock = async <Result>(
    entityManager: EntityManager,
    key: string,
    action: () => Promise<Result>,
): Promise<Result> => {
    const queryRunner = entityManager.connection.createQueryRunner()
    await queryRunner.connect()
    try {
        await queryRunner.query(
            "SELECT pg_advisory_lock(hashtextextended($1, 0))",
            [key],
        )
        return await action()
    } finally {
        await queryRunner.query(
            "SELECT pg_advisory_unlock(hashtextextended($1, 0))",
            [key],
        ).catch(() => undefined)
        await queryRunner.release()
    }
}
