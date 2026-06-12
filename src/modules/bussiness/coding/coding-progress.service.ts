import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    CodingVerdict,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    CacheKey,
    CacheService,
} from "@modules/cache"
import type {
    CodingProblemProgressCacheResult,
} from "@modules/cache"

/**
 * Read-side per-user coding-practice progress/status, decoupled from the shared
 * problem catalog (the catalog is served from Elasticsearch by
 * {@link CodingProblemService}). Mirrors the challenge-submission-progress
 * pattern: a Redis cache keyed by userId, computed on miss and invalidated when
 * the user submits. Carries solved/attempted/revealed problem ids + total points.
 */
@Injectable()
export class CodingProgressService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly cacheService: CacheService,
    ) {}

    /**
     * Return the user's cached progress, computing + caching it on a miss.
     *
     * @param params - the requesting user's id
     * @returns the user's solved/attempted/revealed ids + total points
     */
    async getProgress({
        userId,
    }: {
        /** The requesting user's id. */
        userId: string
    }): Promise<CodingProblemProgressCacheResult> {
        const cached = await this.cacheService.get({
            key: CacheKey.CodingProblemProgress,
            args: [userId],
        })
        // a populated cache entry has the array shape; the empty default does not
        if (cached && Array.isArray(cached.solvedProblemIds)) {
            return cached
        }
        return this.updateProgress({
            userId,
        })
    }

    /**
     * Recompute the user's progress from the DB and overwrite the cache.
     *
     * @param params - the requesting user's id
     * @returns the freshly computed progress
     */
    async updateProgress({
        userId,
    }: {
        /** The requesting user's id. */
        userId: string
    }): Promise<CodingProblemProgressCacheResult> {
        const result = await this.compute(userId)
        await this.cacheService.set({
            key: CacheKey.CodingProblemProgress,
            args: [userId],
            cacheResult: result,
        })
        return result
    }

    /**
     * Drop the user's cached progress (next read recomputes). Called after a
     * submission is judged, since solved/attempted/points may have changed.
     *
     * @param params - the requesting user's id
     */
    async invalidate({
        userId,
    }: {
        /** The user whose progress cache to drop. */
        userId: string
    }): Promise<void> {
        await this.cacheService.del({
            key: CacheKey.CodingProblemProgress,
            args: [userId],
        })
    }

    /** Compute the progress from coding_submissions + reveals + users.coding_points. */
    private async compute(userId: string): Promise<CodingProblemProgressCacheResult> {
        // distinct problems with an Accepted submission
        const solvedRows = await this.entityManager.query(
            `SELECT DISTINCT coding_problem_id AS "id"
             FROM coding_submissions
             WHERE user_id = $1 AND verdict = $2`,
            [userId,
                CodingVerdict.Accepted],
        ) as Array<{ id: string }>
        // distinct problems the user has submitted to (any verdict)
        const attemptedRows = await this.entityManager.query(
            `SELECT DISTINCT coding_problem_id AS "id"
             FROM coding_submissions
             WHERE user_id = $1`,
            [userId],
        ) as Array<{ id: string }>
        // distinct problems whose solution the user revealed
        const revealedRows = await this.entityManager.query(
            `SELECT DISTINCT coding_problem_id AS "id"
             FROM coding_solution_reveals
             WHERE user_id = $1`,
            [userId],
        ) as Array<{ id: string }>
        // the user's cumulative coding score
        const pointsRows = await this.entityManager.query(
            "SELECT coding_points AS \"points\" FROM users WHERE id = $1",
            [userId],
        ) as Array<{ points: number | string }>
        return {
            solvedProblemIds: solvedRows.map((row) => row.id),
            attemptedProblemIds: attemptedRows.map((row) => row.id),
            revealedProblemIds: revealedRows.map((row) => row.id),
            totalPoints: Number(pointsRows[0]?.points ?? 0),
        }
    }
}
