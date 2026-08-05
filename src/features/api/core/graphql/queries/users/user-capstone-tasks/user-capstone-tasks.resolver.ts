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
    Locale,
} from "@modules/databases"
import {
    GraphQLProfileVisibilityGuard,
    UserCapstoneProjectionService,
} from "@modules/bussiness"
import {
    toGlobalId,
} from "@modules/routing"
import {
    UserCapstoneTaskItemData,
    UserCapstoneTasksResponse,
} from "./graphql-types"

@Resolver()
/**
 * Public profile query: a user's passed capstone (milestone) tasks across courses.
 * Thin read of the CQRS capstone projection (the DISTINCT-ON join runs in the
 * projection's recompute). Maps each stored course id to an opaque global id.
 * Optional auth; a locked profile is withheld by {@link GraphQLProfileVisibilityGuard}.
 */
export class UserCapstoneTasksResolver {
    constructor(
        private readonly userCapstoneProjectionService: UserCapstoneProjectionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard,
        GraphQLProfileVisibilityGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Capstone tasks fetched successfully",
        [Locale.Vi]: "Lấy dự án đã hoàn thành thành công", // vn-ok: vi-locale string emitted to clients
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
        // thin projection read (newest-first); turn each course id into a token
        const tasks = await this.userCapstoneProjectionService.getTasks(userId)
        return tasks.map((task) => ({
            courseGlobalId: toGlobalId(CourseEntity.name,
                task.courseId),
            courseTitle: task.courseTitle,
            milestoneTitle: task.milestoneTitle,
            taskTitle: task.taskTitle,
            score: task.score,
            passedAt: task.passedAt,
        }))
    }
}
