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
    CapstoneCourseProgressObject,
    UserCapstoneProgressResponse,
} from "./graphql-types"

/**
 * Public profile query: a user's per-course capstone roadmap — for each enrolled
 * course, the ordered milestones with totals / passed counts plus every task and the
 * user's pass state. Thin read of the CQRS capstone projection (the nested aggregate
 * runs in the projection's recompute). Maps each stored course id to an opaque global id.
 * Optional auth; a locked profile is withheld by {@link GraphQLProfileVisibilityGuard}.
 */
@Resolver()
export class UserCapstoneProgressResolver {
    constructor(
        private readonly userCapstoneProjectionService: UserCapstoneProjectionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard,
        GraphQLProfileVisibilityGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Capstone progress fetched successfully",
        [Locale.Vi]: "Lấy tiến độ dự án thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserCapstoneProgressResponse,
        {
            name: "userCapstoneProgress",
            description: "A user's per-course capstone roadmap (ordered milestones + tasks), by user id.",
        },
    )
    async execute(
        @Args(
            "userId",
            {
                type: () => ID,
                description: "Id of the user whose capstone roadmap progress to fetch.",
            },
        )
            userId: string,
    ): Promise<Array<CapstoneCourseProgressObject>> {
        // thin projection read; turn each course id into a token, keep the nested ordering
        const courses = await this.userCapstoneProjectionService.getProgress(userId)
        return courses.map((course) => ({
            courseGlobalId: toGlobalId(CourseEntity.name,
                course.courseId),
            courseTitle: course.courseTitle,
            totalMilestones: course.totalMilestones,
            completedMilestones: course.completedMilestones,
            totalTasks: course.totalTasks,
            completedTasks: course.completedTasks,
            milestones: course.milestones.map((milestone) => ({
                title: milestone.title,
                position: milestone.position,
                totalTasks: milestone.totalTasks,
                passedTasks: milestone.passedTasks,
                tasks: milestone.tasks.map((task) => ({
                    title: task.title,
                    passed: task.passed,
                    score: task.score,
                    passedAt: task.passedAt,
                })),
            })),
        }))
    }
}
