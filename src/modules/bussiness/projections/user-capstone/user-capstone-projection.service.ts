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
     * Whether a projection row is past its freshness window.
     *
     * @param updatedAt - the row's last write time.
     * @returns true when older than the configured TTL.
     */
    private isStale(updatedAt: Date): boolean {
        return Date.now() - updatedAt.getTime() > envConfig().projection.staleAfterMs
    }

    /**
     * Build the capstone UPSERT — one row per passed milestone task (latest passing
     * attempt via DISTINCT ON), joined up to its course, folded newest-first into
     * `value.tasks` for the single user `$1`.
     *
     * @returns the parameterised UPSERT SQL.
     */
    private buildUpsertSql(): string {
        return `
            INSERT INTO user_capstone_projections (user_id, value)
            SELECT $1::uuid, jsonb_build_object('tasks', COALESCE((
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
            ), '[]'::jsonb))
            ON CONFLICT (user_id) DO UPDATE SET
                value      = EXCLUDED.value,
                updated_at = now()
        `
    }
}
