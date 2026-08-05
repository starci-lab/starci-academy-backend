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
    LearningFeedbackResult,
    LearningFeedbackRow,
    CountRow,
} from "./types"

@Injectable()
/**
 * Learner-CMS read service for the current user's learning feedback, merged from
 * the three feedback sources that exist for a user:
 *
 *   - "challenge": `user_challenge_submission_feedbacks` (structured feedback
 *     items attached to a challenge-submission attempt) → challenge + course.
 *   - "task": `user_milestone_task_attempt_feedbacks` (structured feedback items
 *     attached to a milestone-task review attempt) → task + course.
 *
 * (A third "cv" source — `cv_submission_attempts.detail_feedback` — was dropped
 * along with the legacy `cv_submissions`/`cv_submission_attempts` tables; the
 * unified `cv_generations.feedback` is jsonb-shaped differently, so it wasn't a
 * drop-in replacement. Re-add as a new UNION branch if CV feedback needs to
 * resurface here.)
 *
 * Plain paginated list keyed by the viewer (the LIST exception) — the source
 * SELECTs are merged with `UNION ALL` in a single normalised CTE, then ordered
 * newest-first and windowed in SQL so paging stays correct across all sources
 * without fetch-merge-slice in memory.
 */
export class LearningFeedbacksCmsService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Page over the user's merged learning feedback (newest first across sources).
     *
     * @param params - {@link ListLearnerCmsParams}
     * @returns the page of feedback rows plus the user's total feedback count.
     */
    async list(
        {
            userId,
            limit,
            offset,
        }: ListLearnerCmsParams,
    ): Promise<PaginatedLearnerCmsResult<LearningFeedbackResult>> {
        // run the merged page query and the merged total count together — both
        // share the same three-source union, so parallelising saves a round trip
        const [
            rows,
            countRows,
        ] = await Promise.all([
            // page: the union of all three sources, ordered newest-first and windowed
            this.entityManager.query(
                this.buildPageSql(),
                [
                    userId,
                    limit,
                    offset,
                ],
            ) as Promise<Array<LearningFeedbackRow>>,
            // total: the count of the same union (ignores the page window)
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
                source: row.source,
                title: row.title,
                courseTitle: row.course_title ?? null,
                summary: row.summary,
                createdAt: row.created_at,
            })),
            // single-row count, text-encoded bigint → number
            total: Number(countRows[0]?.total ?? 0),
        }
    }

    /**
     * The three-source UNION ALL body, normalised to `(source, title,
     * course_title, summary, created_at)`. Shared verbatim by the page and count
     * queries so they always page over exactly the same set. The owning user is
     * always bound to `$1`.
     *
     * @returns the union SQL fragment (no ORDER BY / LIMIT).
     */
    private buildUnionSql(): string {
        return `
            -- challenge-submission feedback items → challenge title + course
            SELECT
                'challenge'::text AS source,
                COALESCE(ch.title, cs.title) AS title,
                c.title AS course_title,
                cf.message AS summary,
                cf.created_at AS created_at
            FROM user_challenge_submission_feedbacks cf
            JOIN user_challenge_submission_attempts ucsa ON ucsa.id = cf.user_challenge_submission_attempt_id
            JOIN user_challenge_submissions ucs ON ucs.id = ucsa.user_challenge_submission_id
            JOIN challenge_submissions cs ON cs.id = ucs.submission_id
            LEFT JOIN challenges ch ON ch.id = cs.challenge_id
            LEFT JOIN contents co ON co.id = ch.content_id
            LEFT JOIN modules mo ON mo.id = co.module_id
            LEFT JOIN courses c ON c.id = mo.course_id
            WHERE ucs.user_id = $1

            UNION ALL

            -- milestone-task feedback items → task title + course (via enrollment)
            SELECT
                'task'::text AS source,
                mt.title AS title,
                c.title AS course_title,
                tf.message AS summary,
                tf.created_at AS created_at
            FROM user_milestone_task_attempt_feedbacks tf
            JOIN user_milestone_task_attempts mta ON mta.id = tf.user_milestone_task_attempt_id
            JOIN user_milestone_tasks umt ON umt.id = mta.user_milestone_task_id
            JOIN milestone_tasks mt ON mt.id = umt.milestone_task_id
            JOIN enrollments e ON e.id = umt.enrollment_id
            JOIN courses c ON c.id = e.course_id
            WHERE e.user_id = $1
        `
    }

    /**
     * Build the page SQL — the three-source union, ordered newest-first and
     * windowed by `$2` (limit) / `$3` (offset).
     *
     * @returns the parameterised page SQL.
     */
    private buildPageSql(): string {
        return `
            SELECT source, title, course_title, summary, created_at
            FROM (
                ${this.buildUnionSql()}
            ) feedback
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `
    }

    /**
     * Build the count SQL — total rows across the same three-source union for
     * user `$1` (no page window).
     *
     * @returns the parameterised count SQL.
     */
    private buildCountSql(): string {
        return `
            SELECT COUNT(*) AS total
            FROM (
                ${this.buildUnionSql()}
            ) feedback
        `
    }
}
