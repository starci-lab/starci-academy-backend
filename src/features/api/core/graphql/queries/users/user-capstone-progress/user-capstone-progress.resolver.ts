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
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-optional-auth-graphql.guard"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    GraphQLProfileVisibilityGuard,
} from "@modules/bussiness/guards/graphql-profile-visibility.guard"
import {
    UserCapstoneProjectionService,
} from "@modules/bussiness/projections/user-capstone/user-capstone-projection.service"
import {
    toGlobalId,
} from "@modules/platform/routing/utils/global-id"
import {
    CapstoneCourseProgressObject,
    UserCapstoneProgressResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Public profile query: a user's per-course capstone roadmap -- for each enrolled
 * course, the ordered milestones with totals / passed counts plus every task and the
 * user's pass state. Thin read of the CQRS capstone projection (the nested aggregate
 * runs in the projection's recompute). Maps each stored course/milestone/task id to an
 * opaque global id (milestone/task ids let the FE key rows and deep-link a single
 * milestone later; no enrolled-only criteria/code is exposed here -- see the
 * viewer-gated `milestone`/`task` queries for that).
 * Optional auth; a locked profile is withheld by {@link GraphQLProfileVisibilityGuard}.
 */
export class UserCapstoneProgressResolver {
    constructor(
        private readonly userCapstoneProjectionService: UserCapstoneProjectionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard,
        GraphQLProfileVisibilityGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Capstone progress fetched successfully",
        [Locale.Vi]: "Lấy tiến độ dự án thành công", // vn-ok: vi-locale string emitted to clients
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
                milestoneGlobalId: toGlobalId(MilestoneEntity.name,
                    milestone.id),
                title: milestone.title,
                position: milestone.position,
                totalTasks: milestone.totalTasks,
                passedTasks: milestone.passedTasks,
                tasks: milestone.tasks.map((task) => ({
                    taskGlobalId: toGlobalId(MilestoneTaskEntity.name,
                        task.id),
                    title: task.title,
                    passed: task.passed,
                    score: task.score,
                    passedAt: task.passedAt,
                })),
            })),
        }))
    }
}
