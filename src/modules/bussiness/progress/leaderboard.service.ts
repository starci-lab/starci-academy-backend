import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    CacheKey,
    CacheService,
} from "@modules/cache"
import type {
    CourseLeaderboardCacheResult,
    CourseLeaderboardEntry,
} from "@modules/cache"

/** Max number of entries we keep in the cached leaderboard window. */
const DEFAULT_TOP_LIMIT = 100

/** Raw row shape returned from the leaderboard aggregate query. */
interface LeaderboardRow {
    enrollment_id: string
    user_id: string
    username: string | null
    avatar: string | null
    total_score: string | number
    completed_challenges: string | number
}

/** Raw row for course-level totals (denominators). */
interface CourseTotalsRow {
    total_challenges: string | number
    max_possible_score: string | number | null
}

/**
 * Service for computing and caching per-course leaderboards.
 *
 * Total score per enrollment follows the same rule as `ChallengeProgressService`:
 *   sum over challenges in course of:
 *     sum over submissions of:
 *       max(attempt.score) for that user's submission
 *
 * Only enrollments with `totalScore > 0` or at least one completed challenge are
 * included in the cached window — fresh enrollments are not surfaced.
 */
@Injectable()
export class LeaderboardService {
    constructor(
        private readonly cacheService: CacheService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Recompute the leaderboard from DB and overwrite the cache entry.
     */
    async updateLeaderboard(courseId: string): Promise<CourseLeaderboardCacheResult> {
        const result = await this.computeLeaderboard(courseId)
        await this.cacheService.set({
            key: CacheKey.CourseLeaderboard,
            args: [courseId],
            cacheResult: result,
        })
        return result
    }

    /**
     * Return the cached leaderboard, computing on miss.
     */
    async getLeaderboard(courseId: string): Promise<CourseLeaderboardCacheResult> {
        const cached = await this.cacheService.get({
            key: CacheKey.CourseLeaderboard,
            args: [courseId],
        })
        if (cached && Array.isArray(cached.entries)) {
            return cached
        }
        return this.updateLeaderboard(courseId)
    }

    /**
     * Drop the cached leaderboard for a course (next read recomputes).
     */
    async invalidateLeaderboard(courseId: string): Promise<void> {
        await this.cacheService.del({
            key: CacheKey.CourseLeaderboard,
            args: [courseId],
        })
    }

    /**
     * Rank of a specific user within the course, even when outside the cached top window.
     *
     * Counts how many enrollments in the course have a strictly higher totalScore than the user.
     * Returns `null` when the user has no enrollment / no scored attempts.
     */
    async getMyRank(
        courseId: string,
        userId: string,
    ): Promise<{ rank: number; totalScore: number; completedChallenges: number } | null> {
        const rows = await this.entityManager.query<Array<{
            user_id: string
            total_score: string | number
            completed_challenges: string | number
            higher_count: string | number
        }>>(
            `
            WITH per_submission_max AS (
                SELECT ucs.user_id,
                       cs.challenge_id,
                       cs.id AS submission_id,
                       COALESCE(MAX(a.score), 0) AS max_score
                FROM user_challenge_submissions ucs
                JOIN challenge_submissions cs ON cs.id = ucs.submission_id
                LEFT JOIN user_challenge_submission_attempts a
                    ON a.user_challenge_submission_id = ucs.id
                WHERE cs.challenge_id IN (
                    SELECT c.id FROM challenges c
                    JOIN contents ct ON ct.id = c.content_id
                    JOIN modules m ON m.id = ct.module_id
                    WHERE m.course_id = $1
                )
                GROUP BY ucs.user_id, cs.challenge_id, cs.id
            ),
            per_challenge AS (
                SELECT user_id,
                       challenge_id,
                       SUM(max_score) AS challenge_score
                FROM per_submission_max
                GROUP BY user_id, challenge_id
            ),
            per_user AS (
                SELECT pc.user_id,
                       SUM(pc.challenge_score)::bigint AS total_score,
                       SUM(CASE WHEN pc.challenge_score >= c.score AND c.score > 0 THEN 1 ELSE 0 END)::bigint
                           AS completed_challenges
                FROM per_challenge pc
                JOIN challenges c ON c.id = pc.challenge_id
                GROUP BY pc.user_id
            ),
            me AS (
                SELECT user_id, total_score, completed_challenges
                FROM per_user
                WHERE user_id = $2
            )
            SELECT me.user_id,
                   me.total_score,
                   me.completed_challenges,
                   (
                       SELECT COUNT(*)::bigint
                       FROM per_user pu
                       WHERE pu.total_score > me.total_score
                   ) AS higher_count
            FROM me
            `,
            [courseId, userId],
        )

        if (rows.length === 0) {
            return null
        }
        const row = rows[0]
        const totalScore = Number(row.total_score) || 0
        const completedChallenges = Number(row.completed_challenges) || 0
        if (totalScore <= 0 && completedChallenges <= 0) {
            return null
        }
        const higherCount = Number(row.higher_count) || 0
        return {
            rank: higherCount + 1,
            totalScore,
            completedChallenges,
        }
    }

    /**
     * Heavy lifting — single aggregate query over the course.
     */
    private async computeLeaderboard(
        courseId: string,
    ): Promise<CourseLeaderboardCacheResult> {
        const totalsRows = await this.entityManager.query<Array<CourseTotalsRow>>(
            `
            SELECT COUNT(c.id)::bigint            AS total_challenges,
                   COALESCE(SUM(c.score), 0)::bigint AS max_possible_score
            FROM challenges c
            JOIN contents ct ON ct.id = c.content_id
            JOIN modules m  ON m.id  = ct.module_id
            WHERE m.course_id = $1
            `,
            [courseId],
        )
        const totalChallenges = Number(totalsRows[0]?.total_challenges ?? 0)
        const maxPossibleScore = Number(totalsRows[0]?.max_possible_score ?? 0)

        if (totalChallenges === 0) {
            return {
                courseId,
                totalChallenges: 0,
                maxPossibleScore: 0,
                entries: [],
                computedAt: new Date(),
            }
        }

        const rows = await this.entityManager.query<Array<LeaderboardRow>>(
            `
            WITH per_submission_max AS (
                SELECT ucs.user_id,
                       cs.challenge_id,
                       cs.id AS submission_id,
                       COALESCE(MAX(a.score), 0) AS max_score
                FROM user_challenge_submissions ucs
                JOIN challenge_submissions cs ON cs.id = ucs.submission_id
                LEFT JOIN user_challenge_submission_attempts a
                    ON a.user_challenge_submission_id = ucs.id
                WHERE cs.challenge_id IN (
                    SELECT c.id FROM challenges c
                    JOIN contents ct ON ct.id = c.content_id
                    JOIN modules m  ON m.id  = ct.module_id
                    WHERE m.course_id = $1
                )
                GROUP BY ucs.user_id, cs.challenge_id, cs.id
            ),
            per_challenge AS (
                SELECT user_id,
                       challenge_id,
                       SUM(max_score) AS challenge_score
                FROM per_submission_max
                GROUP BY user_id, challenge_id
            ),
            per_user AS (
                SELECT pc.user_id,
                       SUM(pc.challenge_score)::bigint AS total_score,
                       SUM(CASE WHEN pc.challenge_score >= c.score AND c.score > 0 THEN 1 ELSE 0 END)::bigint
                           AS completed_challenges
                FROM per_challenge pc
                JOIN challenges c ON c.id = pc.challenge_id
                GROUP BY pc.user_id
            )
            SELECT e.id        AS enrollment_id,
                   e.user_id   AS user_id,
                   u.username  AS username,
                   u.avatar    AS avatar,
                   COALESCE(pu.total_score, 0)         AS total_score,
                   COALESCE(pu.completed_challenges, 0) AS completed_challenges
            FROM enrollments e
            JOIN users u ON u.id = e.user_id
            LEFT JOIN per_user pu ON pu.user_id = e.user_id
            WHERE e.course_id = $1
              AND (COALESCE(pu.total_score, 0) > 0 OR COALESCE(pu.completed_challenges, 0) > 0)
            ORDER BY total_score DESC, e.created_at ASC
            LIMIT $2
            `,
            [courseId, DEFAULT_TOP_LIMIT],
        )

        const entries: Array<CourseLeaderboardEntry> = rows.map(
            (row, index) => ({
                enrollmentId: row.enrollment_id,
                userId: row.user_id,
                username: row.username,
                avatar: row.avatar,
                totalScore: Number(row.total_score) || 0,
                completedChallenges: Number(row.completed_challenges) || 0,
                rank: index + 1,
            }),
        )

        return {
            courseId,
            totalChallenges,
            maxPossibleScore,
            entries,
            computedAt: new Date(),
        }
    }
}
