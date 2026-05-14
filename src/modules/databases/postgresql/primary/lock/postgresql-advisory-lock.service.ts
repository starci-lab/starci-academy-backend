import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"

/**
 * PostgreSQL transaction-scoped advisory locks (`pg_advisory_xact_lock`).
 * Use the **same** {@link EntityManager} as the active transaction when calling these methods.
 */
@Injectable()
export class PostgreSqlAdvisoryLockService {
    /**
     * Blocks until this session holds an exclusive advisory lock for `lockKey`,
     * released automatically at transaction end.
     */
    async acquireXactLockByKey(
        entityManager: EntityManager,
        lockKey: string,
    ): Promise<void> {
        await entityManager.query(
            "SELECT pg_advisory_xact_lock(hashtext($1::text))",
            [lockKey],
        )
    }

    /**
     * Serializes `syncSubmission` vs `submitChallengeSubmission` for one learner + challenge submission row.
     */
    async acquireUserChallengeSubmissionXactLock(
        entityManager: EntityManager,
        userId: string,
        challengeSubmissionId: string,
    ): Promise<void> {
        await this.acquireXactLockByKey(
            entityManager,
            `${userId}:${challengeSubmissionId}`,
        )
    }
}
