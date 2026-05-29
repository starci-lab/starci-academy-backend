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
import {
    DEFAULT_TOP_LIMIT,
} from "./constants"
import type {
    CourseTotalsRow,
    GetMyRankResult,
    LeaderboardRow,
    MyRankRow,
} from "./types"

/**
 * Service for computing and caching per-course leaderboards.
 *
 * Rank is driven by **total XP** per enrollment, summed from three sources:
 *   - challenge score: sum over challenges of max(attempt.score) per submission
 *   - reading:         lessons marked read in the course × 3
 *   - milestones:      milestone tasks with ≥1 passed attempt × 10
 * `totalXp = totalScore + lessonsRead × 3 + milestoneProgress × 10`.
 *
 * `totalScore` (challenge-only) is kept separate so the challenge completion
 * ratio against `maxPossibleScore` stays valid. Only enrollments with
 * `totalXp > 0` are surfaced — fresh enrollments with no activity are not.
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
     * Counts how many enrollments in the course have a strictly higher totalXp than the user.
     * Returns `null` when the user has no enrollment / zero XP (no activity yet).
     */
    async getMyRank(
        courseId: string,
        userId: string,
    ): Promise<GetMyRankResult | null> {
        const rows = await this.entityManager.query<Array<MyRankRow>>(
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
            -- +3 XP per lesson read in the course
            read_per_user AS (
                SELECT uc.user_id,
                       COUNT(*)::bigint AS lessons_read
                FROM user_contents uc
                JOIN contents ct ON ct.id = uc.content_id
                JOIN modules m  ON m.id  = ct.module_id
                WHERE m.course_id = $1
                  AND uc.is_read = true
                GROUP BY uc.user_id
            ),
            -- +10 XP per milestone task with at least one passed attempt
            milestone_per_user AS (
                SELECT e.user_id,
                       COUNT(DISTINCT umt.id)::bigint AS milestone_progress
                FROM enrollments e
                JOIN user_milestone_tasks umt ON umt.enrollment_id = e.id
                JOIN user_milestone_task_attempts umta
                    ON umta.user_milestone_task_id = umt.id
                   AND umta.passed = true
                WHERE e.course_id = $1
                GROUP BY e.user_id
            ),
            -- total XP per enrolled user (built from enrollments so read-only users still rank)
            per_user_xp AS (
                SELECT e.user_id,
                       COALESCE(pu.total_score, 0)          AS total_score,
                       COALESCE(pu.completed_challenges, 0) AS completed_challenges,
                       COALESCE(rpu.lessons_read, 0)        AS lessons_read,
                       COALESCE(mpu.milestone_progress, 0)  AS milestone_progress,
                       (COALESCE(pu.total_score, 0)
                         + COALESCE(rpu.lessons_read, 0) * 3
                         + COALESCE(mpu.milestone_progress, 0) * 10) AS total_xp
                FROM enrollments e
                LEFT JOIN per_user pu          ON pu.user_id  = e.user_id
                LEFT JOIN read_per_user rpu    ON rpu.user_id = e.user_id
                LEFT JOIN milestone_per_user mpu ON mpu.user_id = e.user_id
                WHERE e.course_id = $1
            ),
            me AS (
                SELECT * FROM per_user_xp
                WHERE user_id = $2
            )
            SELECT me.user_id,
                   me.total_score,
                   me.completed_challenges,
                   me.lessons_read,
                   me.milestone_progress,
                   me.total_xp,
                   (
                       SELECT COUNT(*)::bigint
                       FROM per_user_xp p
                       WHERE p.total_xp > me.total_xp
                   ) AS higher_count
            FROM me
            `,
            [courseId,
                userId],
        )

        // no enrollment row for this user in the course → not ranked
        if (rows.length === 0) {
            return null
        }
        const row = rows[0]
        // total_xp gates visibility: enrolled but zero activity should not surface a rank
        const totalXp = Number(row.total_xp) || 0
        if (totalXp <= 0) {
            return null
        }
        // higher_count = users strictly above me → my 1-based rank is that + 1
        const higherCount = Number(row.higher_count) || 0
        return {
            rank: higherCount + 1,
            totalScore: Number(row.total_score) || 0,
            completedChallenges: Number(row.completed_challenges) || 0,
            lessonsRead: Number(row.lessons_read) || 0,
            milestoneProgress: Number(row.milestone_progress) || 0,
            totalXp,
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
            ),
            -- +3 XP per lesson the user marked read inside this course
            read_per_user AS (
                SELECT uc.user_id,
                       COUNT(*)::bigint AS lessons_read
                FROM user_contents uc
                JOIN contents ct ON ct.id = uc.content_id
                JOIN modules m  ON m.id  = ct.module_id
                WHERE m.course_id = $1
                  AND uc.is_read = true
                GROUP BY uc.user_id
            ),
            -- +10 XP per milestone task with at least one passed attempt (count the task once)
            milestone_per_user AS (
                SELECT e.user_id,
                       COUNT(DISTINCT umt.id)::bigint AS milestone_progress
                FROM enrollments e
                JOIN user_milestone_tasks umt ON umt.enrollment_id = e.id
                JOIN user_milestone_task_attempts umta
                    ON umta.user_milestone_task_id = umt.id
                   AND umta.passed = true
                WHERE e.course_id = $1
                GROUP BY e.user_id
            ),
            -- combine all 3 XP sources per enrollment + derive total_xp
            ranked AS (
                SELECT e.id         AS enrollment_id,
                       e.user_id    AS user_id,
                       u.username   AS username,
                       u.avatar     AS avatar,
                       e.created_at AS created_at,
                       COALESCE(pu.total_score, 0)          AS total_score,
                       COALESCE(pu.completed_challenges, 0) AS completed_challenges,
                       COALESCE(rpu.lessons_read, 0)        AS lessons_read,
                       COALESCE(mpu.milestone_progress, 0)  AS milestone_progress,
                       (COALESCE(pu.total_score, 0)
                         + COALESCE(rpu.lessons_read, 0) * 3
                         + COALESCE(mpu.milestone_progress, 0) * 10) AS total_xp
                FROM enrollments e
                JOIN users u ON u.id = e.user_id
                LEFT JOIN per_user pu          ON pu.user_id  = e.user_id
                LEFT JOIN read_per_user rpu    ON rpu.user_id = e.user_id
                LEFT JOIN milestone_per_user mpu ON mpu.user_id = e.user_id
                WHERE e.course_id = $1
            )
            -- only surface enrollments with any XP; rank by total_xp, tie-break earliest enroll
            SELECT * FROM ranked
            WHERE total_xp > 0
            ORDER BY total_xp DESC, created_at ASC
            LIMIT $2
            `,
            [courseId,
                DEFAULT_TOP_LIMIT],
        )

        const entries: Array<CourseLeaderboardEntry> = rows.map(
            (row, index) => ({
                enrollmentId: row.enrollment_id,
                userId: row.user_id,
                username: row.username,
                avatar: row.avatar,
                // challenge score kept separate so the completion ratio (vs maxPossibleScore) stays valid
                totalScore: Number(row.total_score) || 0,
                completedChallenges: Number(row.completed_challenges) || 0,
                lessonsRead: Number(row.lessons_read) || 0,
                milestoneProgress: Number(row.milestone_progress) || 0,
                // total_xp is what the ORDER BY ranked on — surface it as the rank metric
                totalXp: Number(row.total_xp) || 0,
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
