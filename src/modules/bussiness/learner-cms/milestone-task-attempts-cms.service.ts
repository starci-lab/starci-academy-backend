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
    ListLearnerCmsParams,
    PaginatedLearnerCmsResult,
    MilestoneTaskAttemptResult,
    MilestoneTaskAttemptRow,
    CountRow,
} from "./types"

@Injectable()
/**
 * Learner-CMS read service for the current user's milestone-task review attempts.
 *
 * Plain paginated list keyed by the viewer (the LIST exception) — reads the live
 * tables directly via the primary {@link EntityManager}, no CQRS projection. The
 * join chain mirrors the capstone projection's recompute:
 *
 *   user_milestone_task_attempts (mta)
 *     → user_milestone_tasks (umt, mta.user_milestone_task_id)
 *     → milestone_tasks (mt, umt.milestone_task_id)
 *     → milestones (m, mt.milestone_id)
 *     → enrollments (e, umt.enrollment_id)  → courses (c, e.course_id)
 *
 * Both passed and failed attempts are included; ordering is newest-first by the
 * attempt's `created_at`.
 */
export class MilestoneTaskAttemptsCmsService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Page over the user's milestone-task review attempts (newest first).
     *
     * @param params - {@link ListLearnerCmsParams}
     * @returns the page of attempts plus the user's total attempt count.
     */
    async list(
        {
            userId,
            limit,
            offset,
        }: ListLearnerCmsParams,
    ): Promise<PaginatedLearnerCmsResult<MilestoneTaskAttemptResult>> {
        // run the page query and the total count together — both hit the same
        // enrollment.user_id scope, so parallelising halves the round-trip cost
        const [
            rows,
            countRows,
        ] = await Promise.all([
            // page: flatten the attempt with its task / milestone / course titles,
            // newest-first, windowed by limit/offset
            this.entityManager.query(
                this.buildPageSql(),
                [
                    userId,
                    limit,
                    offset,
                ],
            ) as Promise<Array<MilestoneTaskAttemptRow>>,
            // total: count every attempt the user owns (ignores the page window)
            this.entityManager.query(
                this.buildCountSql(),
                [
                    userId,
                ],
            ) as Promise<Array<CountRow>>,
        ])
        return {
            // map each raw SQL row into the typed result the resolver expects
            items: rows.map((row) => ({
                id: row.id,
                taskTitle: row.task_title,
                milestoneTitle: row.milestone_title,
                courseTitle: row.course_title,
                courseId: row.course_id,
                passed: row.passed,
                score: row.score,
                attemptedAt: row.attempted_at,
            })),
            // single-row count, text-encoded bigint → number
            total: Number(countRows[0]?.total ?? 0),
        }
    }

    /**
     * Build the page SQL — one row per attempt with task / milestone / course
     * titles, newest-first, windowed by `$2` (limit) / `$3` (offset) for the
     * enrollments owned by user `$1`.
     *
     * @returns the parameterised page SQL.
     */
    private buildPageSql(): string {
        return `
            SELECT
                mta.id          AS id,
                mt.title        AS task_title,
                m.title         AS milestone_title,
                c.title         AS course_title,
                c.id            AS course_id,
                mta.passed      AS passed,
                mta.score       AS score,
                mta.created_at  AS attempted_at
            FROM user_milestone_task_attempts mta
            JOIN user_milestone_tasks umt ON umt.id = mta.user_milestone_task_id
            JOIN milestone_tasks mt ON mt.id = umt.milestone_task_id
            JOIN milestones m ON m.id = mt.milestone_id
            JOIN enrollments e ON e.id = umt.enrollment_id
            JOIN courses c ON c.id = e.course_id
            WHERE e.user_id = $1
            ORDER BY mta.created_at DESC
            LIMIT $2 OFFSET $3
        `
    }

    /**
     * Build the count SQL — every attempt under enrollments owned by user `$1`
     * (no page window).
     *
     * @returns the parameterised count SQL.
     */
    private buildCountSql(): string {
        return `
            SELECT COUNT(*) AS total
            FROM user_milestone_task_attempts mta
            JOIN user_milestone_tasks umt ON umt.id = mta.user_milestone_task_id
            JOIN enrollments e ON e.id = umt.enrollment_id
            WHERE e.user_id = $1
        `
    }
}
