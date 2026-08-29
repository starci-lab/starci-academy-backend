import {
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
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
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
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ProgressProjectionService,
} from "@modules/bussiness/projections/progress/progress-projection.service"
import {
    toGlobalId,
} from "@modules/platform/routing/utils/global-id"
import {
    MyCourseItemData,
    MyCoursesResponse,
} from "./graphql-types/response"
import {
    computeCompletionPercent,
} from "./utils/compute-completion-percent"

@Resolver()
/**
 * Rail query: every course the viewer has joined, each with its milestone
 * progress. Reads the CQRS progress projection (`completed` is eager-maintained
 * via inline recompute + CDC -- no read-time Redis cache, so it never goes stale
 * the way the old cache-aside did); the `total` denominator is counted live from
 * the course's milestone tasks. The list doubles as the rail's "my courses" list.
 */
export class MyCoursesResolver {
    constructor(
        private readonly progressProjectionService: ProgressProjectionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Courses fetched successfully",
        [Locale.Vi]: "Lấy danh sách khóa học thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyCoursesResponse,
        {
            name: "myCourses",
            description: "Every joined course with its milestone progress (rail list).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<Array<MyCourseItemData>> {
        // one projection-backed read for every enrolled course (completed/total)
        const rows = await this.progressProjectionService.getMyCourseProgress(user.id)
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
