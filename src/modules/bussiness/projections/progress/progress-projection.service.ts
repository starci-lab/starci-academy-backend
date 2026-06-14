import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import type {
    CourseLeaderboardCacheResult,
    CourseLeaderboardEntry,
} from "@modules/cache"
import {
    DEFAULT_TOP_LIMIT,
} from "../../progress/constants"
import type {
    CourseTotalsRow,
    GetMyRankResult,
    LeaderboardRow,
    MyRankRow,
    RecomputeProgressParams,
} from "./types"

/**
 * CQRS read-model service for per-course progress (Kiểu B — composite key
 * `(user_id, course_id)`, aggregate stored as a jsonb `value`).
 *
 * The heavy XP aggregation runs ONLY in {@link recompute} / {@link recomputeCourse}
 * (the projector, triggered on XP-changing events + CDC), building the aggregate
 * jsonb. Reads ({@link getMyRank} / {@link getLeaderboard}) extract the metrics
 * from `value->>'...'` — no multi-CTE scan per request. The leaderboard ordering
 * is backed by a functional index on `(course_id, ((value->>'totalXp')::int))`
 * (created out-of-band; see the backfill script). Reads are eager-maintained
 * (inline + CDC) — no read-time TTL refresh here.
 */
@Injectable()
export class ProgressProjectionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Recompute + upsert the projection row for ONE user in a course. Call this
     * on every XP-changing event (challenge passed / lesson read / milestone
     * passed / enroll). Idempotent (UPSERT).
     *
     * @param params - the user + course to recompute
     */
    async recompute(
        {
            userId,
            courseId,
            entityManager,
        }: RecomputeProgressParams,
    ): Promise<void> {
        // run inside the caller's transaction when given (atomic + fresh), else
        // on the service's own connection
        const manager = entityManager ?? this.entityManager
        // scoped to a single enrollment row → cheap on the write path
        await manager.query(
            this.buildUpsertSql(true),
            [
                courseId,
                userId,
            ],
        )
    }

    /**
     * Recompute + upsert the projection for EVERY enrolled user in a course.
     * Used for the initial backfill and any full rebuild.
     *
     * @param courseId - the course to rebuild
     */
    async recomputeCourse(courseId: string): Promise<void> {
        await this.entityManager.query(
            this.buildUpsertSql(false),
            [
                courseId,
            ],
        )
    }

    /**
     * Viewer's rank in a course, read from the projection. `null` when the user
     * is not enrolled / has zero XP (not surfaced).
     *
     * @param courseId - the course
     * @param userId - the viewer
     * @returns rank + XP breakdown, or null
     */
    async getMyRank(
        courseId: string,
        userId: string,
    ): Promise<GetMyRankResult | null> {
        // flat read: my row (metrics extracted from jsonb) + peers strictly above me
        const rows = await this.entityManager.query<Array<MyRankRow>>(
            `
            SELECT p.user_id,
                   (p.value->>'totalScore')::int          AS total_score,
                   (p.value->>'completedChallenges')::int AS completed_challenges,
                   (p.value->>'lessonsRead')::int         AS lessons_read,
                   (p.value->>'milestoneProgress')::int   AS milestone_progress,
                   (p.value->>'totalXp')::int             AS total_xp,
                   (
                       SELECT COUNT(*)::bigint
                       FROM user_course_progress_projections higher
                       WHERE higher.course_id = $1
                         AND (higher.value->>'totalXp')::int > (p.value->>'totalXp')::int
                   ) AS higher_count
            FROM user_course_progress_projections p
            WHERE p.course_id = $1
              AND p.user_id = $2
            `,
            [
                courseId,
                userId,
            ],
        )
        if (rows.length === 0) {
            return null
        }
        const row = rows[0]
        // zero-XP enrollment should not surface a rank
        const totalXp = Number(row.total_xp) || 0
        if (totalXp <= 0) {
            return null
        }
        return {
            rank: (Number(row.higher_count) || 0) + 1,
            totalScore: Number(row.total_score) || 0,
            completedChallenges: Number(row.completed_challenges) || 0,
            lessonsRead: Number(row.lessons_read) || 0,
            milestoneProgress: Number(row.milestone_progress) || 0,
            totalXp,
        }
    }

    /**
     * Top-N leaderboard of a course, read from the projection (joined to users
     * for display + enrollments for the entry id).
     *
     * @param courseId - the course
     * @returns leaderboard payload (totals + ranked entries)
     */
    async getLeaderboard(courseId: string): Promise<CourseLeaderboardCacheResult> {
        // course-level denominators (cheap; small challenge set per course)
        const totalsRows = await this.entityManager.query<Array<CourseTotalsRow>>(
            `
            SELECT COUNT(c.id)::bigint               AS total_challenges,
                   COALESCE(SUM(c.score), 0)::bigint AS max_possible_score
            FROM challenges c
            JOIN contents ct ON ct.id = c.content_id
            JOIN modules m  ON m.id  = ct.module_id
            WHERE m.course_id = $1
            `,
            [
                courseId,
            ],
        )
        const totalChallenges = Number(totalsRows[0]?.total_challenges ?? 0)
        const maxPossibleScore = Number(totalsRows[0]?.max_possible_score ?? 0)

        // ranked entries off the projection — metrics extracted from the jsonb value,
        // ordered by total_xp (functional index on (course_id, (value->>'totalXp')::int))
        const rows = await this.entityManager.query<Array<LeaderboardRow>>(
            `
            SELECT e.id         AS enrollment_id,
                   p.user_id    AS user_id,
                   u.username   AS username,
                   u.avatar     AS avatar,
                   (p.value->>'totalScore')::int          AS total_score,
                   (p.value->>'completedChallenges')::int AS completed_challenges,
                   (p.value->>'lessonsRead')::int         AS lessons_read,
                   (p.value->>'milestoneProgress')::int   AS milestone_progress,
                   (p.value->>'totalXp')::int             AS total_xp
            FROM user_course_progress_projections p
            JOIN users u       ON u.id = p.user_id
            JOIN enrollments e ON e.user_id = p.user_id AND e.course_id = p.course_id
            WHERE p.course_id = $1
              AND (p.value->>'totalXp')::int > 0
            ORDER BY (p.value->>'totalXp')::int DESC, e.created_at ASC
            LIMIT $2
            `,
            [
                courseId,
                DEFAULT_TOP_LIMIT,
            ],
        )
        const entries: Array<CourseLeaderboardEntry> = rows.map((row, index) => ({
            enrollmentId: row.enrollment_id,
            userId: row.user_id,
            username: row.username,
            avatar: row.avatar,
            totalScore: Number(row.total_score) || 0,
            completedChallenges: Number(row.completed_challenges) || 0,
            lessonsRead: Number(row.lessons_read) || 0,
            milestoneProgress: Number(row.milestone_progress) || 0,
            totalXp: Number(row.total_xp) || 0,
            rank: index + 1,
        }))

        return {
            courseId,
            totalChallenges,
            maxPossibleScore,
            entries,
            computedAt: new Date(),
        }
    }

    /**
     * Build the projector UPSERT — the heavy XP aggregation assembled into one
     * jsonb `value`. `scoped` adds a single-user filter for the hot write path;
     * unscoped recomputes the whole course (backfill).
     *
     * @param scoped - true → filter to `$2` (one user); false → whole course (`$1`)
     * @returns the parameterised INSERT … ON CONFLICT SQL
     */
    private buildUpsertSql(scoped: boolean): string {
        // only the final SELECT changes (single user vs all enrollments)
        const userFilter = scoped ? "AND e.user_id = $2" : ""
        return `
            INSERT INTO user_course_progress_projections (user_id, course_id, value)
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
                SELECT user_id, challenge_id, SUM(max_score) AS challenge_score
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
            read_per_user AS (
                SELECT uc.user_id, COUNT(*)::bigint AS lessons_read
                FROM user_contents uc
                JOIN contents ct ON ct.id = uc.content_id
                JOIN modules m  ON m.id  = ct.module_id
                WHERE m.course_id = $1 AND uc.is_read = true
                GROUP BY uc.user_id
            ),
            milestone_per_user AS (
                SELECT e.user_id, COUNT(DISTINCT umt.id)::bigint AS milestone_progress
                FROM enrollments e
                JOIN user_milestone_tasks umt ON umt.enrollment_id = e.id
                JOIN user_milestone_task_attempts umta
                    ON umta.user_milestone_task_id = umt.id AND umta.passed = true
                WHERE e.course_id = $1
                GROUP BY e.user_id
            )
            SELECT e.user_id,
                   e.course_id,
                   jsonb_build_object(
                       'totalScore',          COALESCE(pu.total_score, 0)::int,
                       'completedChallenges', COALESCE(pu.completed_challenges, 0)::int,
                       'lessonsRead',         COALESCE(rpu.lessons_read, 0)::int,
                       'milestoneProgress',   COALESCE(mpu.milestone_progress, 0)::int,
                       'totalXp',             (COALESCE(pu.total_score, 0)
                                                + COALESCE(rpu.lessons_read, 0) * 3
                                                + COALESCE(mpu.milestone_progress, 0) * 10)::int
                   ) AS value
            FROM enrollments e
            LEFT JOIN per_user pu            ON pu.user_id  = e.user_id
            LEFT JOIN read_per_user rpu      ON rpu.user_id = e.user_id
            LEFT JOIN milestone_per_user mpu ON mpu.user_id = e.user_id
            WHERE e.course_id = $1 ${userFilter}
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                value      = EXCLUDED.value,
                updated_at = now()
        `
    }
}
