import {
    Args,
    ID,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    GraphQLProfileVisibilityGuard,
} from "@modules/bussiness"
import {
    toGlobalId,
} from "@modules/routing"
import {
    UserCapstoneTaskItemData,
    UserCapstoneTasksResponse,
} from "./graphql-types"
import {
    UserCapstoneTaskRow,
} from "./types"

/**
 * Public profile query: a user's PASSED capstone (personal-project milestone)
 * tasks across all their courses — the "projects" / portfolio tab. Reads the
 * attempts ledger joined up to the course; deduped to one row per task (latest
 * passing attempt) via `DISTINCT ON`. Optional auth — anonymous viewers may call
 * it; a locked profile is withheld from non-owners by
 * {@link GraphQLProfileVisibilityGuard}. Raw SQL (no service aggregates this).
 */
@Resolver()
export class UserCapstoneTasksResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard,
        GraphQLProfileVisibilityGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Capstone tasks fetched successfully",
        [Locale.Vi]: "Lấy dự án đã hoàn thành thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserCapstoneTasksResponse,
        {
            name: "userCapstoneTasks",
            description: "A user's passed capstone (milestone) tasks across courses, by user id.",
        },
    )
    async execute(
        @Args(
            "userId",
            {
                type: () => ID,
                description: "Id of the user whose passed capstone tasks to fetch.",
            },
        )
            userId: string,
    ): Promise<Array<UserCapstoneTaskItemData>> {
        // one row per passed task (the latest passing attempt) joined up to its
        // course; DISTINCT ON dedupes multiple passing attempts of the same task
        const rows = await this.entityManager.query<Array<UserCapstoneTaskRow>>(
            `
            SELECT DISTINCT ON (mt.id)
                   mt.id           AS "taskId",
                   mt.title        AS "taskTitle",
                   m.title         AS "milestoneTitle",
                   c.id            AS "courseId",
                   c.title         AS "courseTitle",
                   mta.score       AS "score",
                   mta.processed_at AS "passedAt"
            FROM user_milestone_task_attempts mta
            JOIN user_milestone_tasks umt ON umt.id = mta.user_milestone_task_id
            JOIN milestone_tasks mt ON mt.id = umt.milestone_task_id
            JOIN milestones m ON m.id = mt.milestone_id
            JOIN enrollments e ON e.id = umt.enrollment_id
            JOIN courses c ON c.id = e.course_id
            WHERE e.user_id = $1 AND mta.passed = true
            ORDER BY mt.id, mta.processed_at DESC NULLS LAST
            `,
            [
                userId,
            ],
        )

        // re-sort newest-first (DISTINCT ON forces an mt.id ordering first) and map
        // each row to a clickable course token + the task details
        return rows
            .sort((prev, next) => {
                // null passedAt sinks to the bottom
                const prevTime = prev.passedAt ? new Date(prev.passedAt).getTime() : 0
                const nextTime = next.passedAt ? new Date(next.passedAt).getTime() : 0
                return nextTime - prevTime
            })
            .map((row) => ({
                courseGlobalId: toGlobalId(CourseEntity.name,
                    row.courseId),
                courseTitle: row.courseTitle,
                milestoneTitle: row.milestoneTitle,
                taskTitle: row.taskTitle,
                score: row.score,
                passedAt: row.passedAt,
            }))
    }
}
