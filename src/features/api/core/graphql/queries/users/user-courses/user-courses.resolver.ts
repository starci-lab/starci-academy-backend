import {
    Args,
    Context,
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
    ProgressProjectionService,
} from "@modules/bussiness"
import {
    toGlobalId,
} from "@modules/routing"
import {
    MyCourseItemData,
} from "../../dashboard/my-courses/graphql-types"
import {
    isProfileHiddenFromViewer,
} from "../utils"
import {
    UserCoursesResponse,
} from "./graphql-types"

/**
 * Public profile query: every course a given user has joined with its milestone
 * progress. Mirrors `myCourses` but reads for the user named in the route (id
 * from args), so a profile page can show anyone's enrolled courses. Optional
 * auth — anonymous viewers may call it. Progress comes from the CQRS projection
 * (eager-maintained, never stale); `total` is counted live from milestone tasks.
 */
@Resolver()
export class UserCoursesResolver {
    constructor(
        private readonly progressProjectionService: ProgressProjectionService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Courses fetched successfully",
        [Locale.Vi]: "Lấy danh sách khóa học thành công",
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
        @Context()
            context: { req?: { user?: { id?: string } } },
    ): Promise<Array<MyCourseItemData>> {
        // locked profile → withhold the joined-courses list from non-owners
        if (await isProfileHiddenFromViewer({
            entityManager: this.entityManager,
            userId,
            viewerId: context.req?.user?.id,
        })) {
            return []
        }
        // one projection-backed read for every course the named user enrolled in
        const rows = await this.progressProjectionService.getMyCourseProgress(userId)
        // map each course to a clickable token + its completed/total counts
        return rows.map((row) => ({
            globalId: toGlobalId(CourseEntity.name,
                row.courseId),
            label: row.title,
            contentCompleted: row.contentCompleted,
            contentTotal: row.contentTotal,
            challengeCompleted: row.challengeCompleted,
            challengeTotal: row.challengeTotal,
            completed: row.completed,
            total: row.total,
        }))
    }
}
