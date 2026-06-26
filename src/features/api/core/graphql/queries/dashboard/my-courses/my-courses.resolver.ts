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
} from "@modules/api"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    CourseEntity,
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    ProgressProjectionService,
} from "@modules/bussiness"
import {
    toGlobalId,
} from "@modules/routing"
import {
    MyCourseItemData,
    MyCoursesResponse,
} from "./graphql-types"
import {
    computeCompletionPercent,
} from "./utils"

/**
 * Rail query: every course the viewer has joined, each with its milestone
 * progress. Reads the CQRS progress projection (`completed` is eager-maintained
 * via inline recompute + CDC — no read-time Redis cache, so it never goes stale
 * the way the old cache-aside did); the `total` denominator is counted live from
 * the course's milestone tasks. The list doubles as the rail's "my courses" list.
 */
@Resolver()
export class MyCoursesResolver {
    constructor(
        private readonly progressProjectionService: ProgressProjectionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Courses fetched successfully",
        [Locale.Vi]: "Lấy danh sách khóa học thành công",
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
