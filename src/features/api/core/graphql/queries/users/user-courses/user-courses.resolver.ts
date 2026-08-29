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
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    GraphQLProfileVisibilityGuard,
} from "@modules/bussiness/guards/graphql-profile-visibility.guard"
import {
    ProgressProjectionService,
} from "@modules/bussiness/projections/progress/progress-projection.service"
import {
    toGlobalId,
} from "@modules/platform/routing/utils/global-id"
import {
    MyCourseItemData,
} from "../../dashboard/my-courses/graphql-types/response"
import {
    computeCompletionPercent,
} from "../../dashboard/my-courses/utils/compute-completion-percent"
import {
    UserCoursesResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Public profile query: every course a given user has joined with its milestone
 * progress. Mirrors `myCourses` but reads for the user named in the route (id
 * from args), so a profile page can show anyone's enrolled courses. Optional
 * auth -- anonymous viewers may call it; a locked profile is withheld from
 * non-owners by {@link GraphQLProfileVisibilityGuard}. Progress comes from the
 * CQRS projection (eager-maintained); `total` is counted live from milestone tasks.
 */
export class UserCoursesResolver {
    constructor(
        private readonly progressProjectionService: ProgressProjectionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard,
        GraphQLProfileVisibilityGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Courses fetched successfully",
        [Locale.Vi]: "Lấy danh sách khóa học thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserCoursesResponse,
        {
            name: "userCourses",
            description: "Every joined course with its milestone progress, by user id.",
        },
    )
    async execute(
        @Args(
            "userId",
            {
                type: () => ID,
                description: "Id of the user whose joined courses to fetch.",
            },
        )
            userId: string,
    ): Promise<Array<MyCourseItemData>> {
        // one projection-backed read for every course the named user enrolled in
        const rows = await this.progressProjectionService.getMyCourseProgress(userId)
        // map each course to a clickable token + its completed/total counts
        return rows.map((row) => ({
            globalId: toGlobalId(CourseEntity.name,
                row.courseId),
            path: row.path,
            label: row.title,
            thumbnailUrl: row.thumbnailUrl,
            contentCompleted: row.contentCompleted,
            contentTotal: row.contentTotal,
            challengeCompleted: row.challengeCompleted,
            challengeTotal: row.challengeTotal,
            completed: row.completed,
            total: row.total,
            completionPercent: computeCompletionPercent(row),
            isEnrolled: row.isEnrolled,
        }))
    }
}
