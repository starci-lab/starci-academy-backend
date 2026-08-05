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
    Locale,
} from "@modules/databases"
import {
    GraphQLProfileVisibilityGuard,
    UserPinnedProjectsProjectionService,
} from "@modules/bussiness"
import {
    UserPinnedProjectItemData,
    UserPinnedProjectsResponse,
} from "./graphql-types"

@Resolver()
/**
 * Public profile query: the pinned projects of the user named in the route,
 * ordered by `orderIndex`. Optional auth -- anonymous viewers may call it; a
 * locked profile is withheld from non-owners by {@link GraphQLProfileVisibilityGuard}.
 *
 * The list is served from the CQRS projection (eager-maintained by CDC on
 * `user_pinned_projects`, `enrollments`, and `courses`), consistent with the
 * other profile reads and ready for richer per-pin "project state" later.
 */
export class UserPinnedProjectsResolver {
    constructor(
        private readonly userPinnedProjectsProjectionService: UserPinnedProjectsProjectionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard,
        GraphQLProfileVisibilityGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Pinned projects fetched successfully",
        [Locale.Vi]: "Lấy danh sách dự án đã ghim thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserPinnedProjectsResponse,
        {
            name: "userPinnedProjects",
            description: "The named user's pinned projects, ordered by orderIndex.",
        },
    )
    async execute(
        @Args(
            "userId",
            {
                type: () => ID,
                description: "Id of the user whose pinned projects to fetch.",
            },
        )
            userId: string,
    ): Promise<Array<UserPinnedProjectItemData>> {
        // one projection-backed read: pins already ordered by orderIndex ascending
        // with title + isVerified resolved inside the projector (course title
        // fallback + completed-task verification)
        const pins = await this.userPinnedProjectsProjectionService.getByUser(userId)

        // map the projection view onto the API item (identical field shape)
        return pins.map((pin) => ({
            id: pin.id,
            type: pin.type,
            title: pin.title,
            description: pin.description,
            url: pin.url,
            techStack: pin.techStack,
            orderIndex: pin.orderIndex,
            isVerified: pin.isVerified,
        }))
    }
}
