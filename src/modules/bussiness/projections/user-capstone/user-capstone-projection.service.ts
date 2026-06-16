import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserCapstoneProjectionEntity,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import type {
    RecomputeUserCapstoneParams,
    UserCapstoneProgressCourseResult,
    UserCapstoneProgressCourseValue,
    UserCapstoneTaskResult,
    UserCapstoneTaskValue,
} from "./types"

/**
 * CQRS projection service for a user's passed capstone (milestone) tasks. The
 * 6-table DISTINCT-ON join over `user_milestone_task_attempts` runs ONLY in
 * {@link recompute}, folding `{ tasks: [...] }` (newest-first) into the jsonb
 * `value` keyed by user. {@link getTasks} reads the flat row with a TTL
 * lazy-refresh; the CDC listener keeps it fresh on new passing attempts.
 */
@Injectable()
export class UserCapstoneProjectionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Recompute + upsert the capstone aggregate for one user (idempotent UPSERT).
     *
     * @param params - {@link RecomputeUserCapstoneParams}
     */
    async recompute(
        {
            userId,
            entityManager,
        }: RecomputeUserCapstoneParams,
    ): Promise<void> {
        const manager = entityManager ?? this.entityManager
        await manager.query(
            this.buildUpsertSql(),
            [
                userId,
            ],
        )
    }

    /**
     * Read a user's passed capstone tasks (newest first), TTL lazy-refreshed.
     *
     * @param userId - the user to read.
     * @returns the passed capstone tasks.
     */
    async getTasks(userId: string): Promise<Array<UserCapstoneTaskResult>> {
        let row = await this.entityManager.findOne(
            UserCapstoneProjectionEntity,
            {
                where: {
                    userId,
                },
            },
        )
        // missing / past freshness window → recompute + re-read
        if (!row || this.isStale(row.updatedAt)) {
            await this.recompute({
                userId,
            })
            row = await this.entityManager.findOne(
                UserCapstoneProjectionEntity,
                {
                    where: {
                        userId,
                    },
                },
            )
        }
        const tasks = (row?.value?.tasks as Array<UserCapstoneTaskValue> | undefined) ?? []
        // map the stored ISO string back to a Date (already newest-first in jsonb)
        return tasks.map((task) => ({
            courseId: task.courseId,
            courseTitle: task.courseTitle,
            milestoneTitle: task.milestoneTitle,
            taskTitle: task.taskTitle,
            score: Number(task.score) || 0,
            passedAt: task.passedAt ? new Date(task.passedAt) : null,
        }))
    }

    /**
     * Read a user's per-course capstone roadmap progress, TTL lazy-refreshed.
     * Each course carries its ordered milestones and, per milestone, every task with
     * the user's pass/score state. Shares the same projection row as {@link getTasks}.
     *
     * @param userId - the user to read.
     * @returns the per-course capstone progress (course title ascending).
     */
    async getProgress(userId: string): Promise<Array<UserCapstoneProgressCourseResult>> {
        let row = await this.entityManager.findOne(
            UserCapstoneProjectionEntity,
            {
                where: {
                    userId,
                },
            },
        )
        // missing / past freshness window → recompute + re-read
        if (!row || this.isStale(row.updatedAt)) {
            await this.recompute({
                userId,
            })
            row = await this.entityManager.findOne(
                UserCapstoneProjectionEntity,
                {
                    where: {
                        userId,
                    },
                },
            )
        }
        const courses = (row?.value?.courses as Array<UserCapstoneProgressCourseValue> | undefined) ?? []
        // map the stored ISO strings back to Date; ordering is already baked into the jsonb
        return courses.map((course) => ({
            courseId: course.courseId,
            courseTitle: course.courseTitle,
            totalMilestones: Number(course.totalMilestones) || 0,
            completedMilestones: Number(course.completedMilestones) || 0,
            totalTasks: Number(course.totalTasks) || 0,
            completedTasks: Number(course.completedTasks) || 0,
            milestones: (course.milestones ?? []).map((milestone) => ({
                title: milestone.title,
                position: Number(milestone.position) || 0,
                totalTasks: Number(milestone.totalTasks) || 0,
                passedTasks: Number(milestone.passedTasks) || 0,
                tasks: (milestone.tasks ?? []).map((task) => ({
                    title: task.title,
                    position: Number(task.position) || 0,
                    passed: Boolean(task.passed),
                    score: Number(task.score) || 0,
                    passedAt: task.passedAt ? new Date(task.passedAt) : null,
                })),
            })),
        }))
    }

    /**
     * Whether a projection row is past its freshness window.
     *
     * @param updatedAt - the row's last write time.
     * @returns true when older than the configured TTL.
     */
    private isStale(updatedAt: Date): boolean {
        return Date.now() - updatedAt.getTime() > envConfig().projection.staleAfterMs
    }

    /**
     * Build the capstone UPSERT for the single user `$1`, folding TWO aggregates into the
     * jsonb `value`:
     *   - `tasks`: one row per passed milestone task (latest passing attempt via DISTINCT ON),
     *     newest-first — powers `userCapstoneTasks`.
     *   - `courses`: the full per-course roadmap for every course the user is enrolled in,
     *     built from the STATIC milestone/milestone_task structure LEFT JOINed with the user's
     *     latest passing attempt per task — powers `userCapstoneProgress`. Courses with no
     *     milestones are excluded; courses are ordered by title, milestones by `sort_index`,
     *     and tasks by `sort_index`.
     *
     * Milestone → course linkage: `milestones.course_id` (direct FK), so totals come straight
     * from `milestones m JOIN milestone_tasks mt ON mt.milestone_id = m.id`, scoped to the
     * courses in `enrollments e WHERE e.user_id = $1`.
     *
     * @returns the parameterised UPSERT SQL.
     */
    private buildUpsertSql(): string {
        return `
            INSERT INTO user_capstone_projections (user_id, value)
            SELECT $1::uuid, jsonb_build_object(
                'tasks', COALESCE((
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'courseId',       t.course_id,
                            'courseTitle',    t.course_title,
                            'milestoneTitle', t.milestone_title,
                            'taskTitle',      t.task_title,
                            'score',          t.score,
                            'passedAt',       t.passed_at
                        ) ORDER BY t.passed_at DESC NULLS LAST
                    )
                    FROM (
                        SELECT DISTINCT ON (mt.id)
                               c.id            AS course_id,
                               c.title         AS course_title,
                               m.title         AS milestone_title,
                               mt.title        AS task_title,
                               mta.score       AS score,
                               mta.processed_at AS passed_at
                        FROM user_milestone_task_attempts mta
                        JOIN user_milestone_tasks umt ON umt.id = mta.user_milestone_task_id
                        JOIN milestone_tasks mt ON mt.id = umt.milestone_task_id
                        JOIN milestones m ON m.id = mt.milestone_id
                        JOIN enrollments e ON e.id = umt.enrollment_id
                        JOIN courses c ON c.id = e.course_id
                        WHERE e.user_id = $1 AND mta.passed = true
                        ORDER BY mt.id, mta.processed_at DESC NULLS LAST
                    ) t
                ), '[]'::jsonb),
                'courses', COALESCE((
                    -- per-course roadmap: nest milestones, then tasks, with the user's pass state
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'courseId',            course_row.course_id,
                            'courseTitle',         course_row.course_title,
                            'totalMilestones',     course_row.total_milestones,
                            'completedMilestones', course_row.completed_milestones,
                            'totalTasks',          course_row.total_tasks,
                            'completedTasks',      course_row.completed_tasks,
                            'milestones',          course_row.milestones
                        ) ORDER BY course_row.course_title ASC, course_row.course_id ASC
                    )
                    FROM (
                        SELECT
                            c.id    AS course_id,
                            c.title AS course_title,
                            COUNT(milestone_row.milestone_id) AS total_milestones,
                            COUNT(*) FILTER (
                                WHERE milestone_row.total_tasks > 0
                                  AND milestone_row.passed_tasks = milestone_row.total_tasks
                            ) AS completed_milestones,
                            COALESCE(SUM(milestone_row.total_tasks), 0) AS total_tasks,
                            COALESCE(SUM(milestone_row.passed_tasks), 0) AS completed_tasks,
                            COALESCE(jsonb_agg(
                                jsonb_build_object(
                                    'title',       milestone_row.milestone_title,
                                    'position',    milestone_row.milestone_position,
                                    'totalTasks',  milestone_row.total_tasks,
                                    'passedTasks', milestone_row.passed_tasks,
                                    'tasks',       milestone_row.tasks
                                ) ORDER BY milestone_row.milestone_position ASC, milestone_row.milestone_id ASC
                            ), '[]'::jsonb) AS milestones
                        FROM courses c
                        JOIN enrollments e ON e.course_id = c.id AND e.user_id = $1
                        JOIN (
                            -- one row per milestone the user is enrolled in, with its task list
                            SELECT
                                m.id         AS milestone_id,
                                m.course_id  AS course_id,
                                m.title      AS milestone_title,
                                m.sort_index AS milestone_position,
                                COUNT(task_row.task_id) AS total_tasks,
                                COUNT(*) FILTER (WHERE task_row.passed) AS passed_tasks,
                                COALESCE(jsonb_agg(
                                    jsonb_build_object(
                                        'title',    task_row.task_title,
                                        'position', task_row.task_position,
                                        'passed',   task_row.passed,
                                        'score',    task_row.score,
                                        'passedAt', task_row.passed_at
                                    ) ORDER BY task_row.task_position ASC, task_row.task_id ASC
                                ) FILTER (WHERE task_row.task_id IS NOT NULL), '[]'::jsonb) AS tasks
                            FROM milestones m
                            LEFT JOIN (
                                -- every task of every milestone, with the user's latest passing attempt
                                SELECT
                                    mt.id           AS task_id,
                                    mt.milestone_id AS milestone_id,
                                    mt.title        AS task_title,
                                    mt.sort_index   AS task_position,
                                    (best.score IS NOT NULL) AS passed,
                                    COALESCE(best.score, 0)  AS score,
                                    best.processed_at        AS passed_at
                                FROM milestone_tasks mt
                                LEFT JOIN LATERAL (
                                    SELECT mta.score, mta.processed_at
                                    FROM user_milestone_task_attempts mta
                                    JOIN user_milestone_tasks umt ON umt.id = mta.user_milestone_task_id
                                    JOIN enrollments e2 ON e2.id = umt.enrollment_id
                                    WHERE umt.milestone_task_id = mt.id
                                      AND e2.user_id = $1
                                      AND mta.passed = true
                                    ORDER BY mta.processed_at DESC NULLS LAST
                                    LIMIT 1
                                ) best ON true
                            ) task_row ON task_row.milestone_id = m.id
                            GROUP BY m.id, m.course_id, m.title, m.sort_index
                        ) milestone_row ON milestone_row.course_id = c.id
                        GROUP BY c.id, c.title
                    ) course_row
                ), '[]'::jsonb)
            )
            ON CONFLICT (user_id) DO UPDATE SET
                value      = EXCLUDED.value,
                updated_at = now()
        `
    }
}
