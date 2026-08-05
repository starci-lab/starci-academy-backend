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
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    GraphQLProfileVisibilityGuard,
} from "@modules/bussiness/guards/graphql-profile-visibility.guard"
import {
    UserPinnedProjectsProjectionService,
} from "@modules/bussiness/projections/user-pinned-projects/user-pinned-projects-projection.service"
import {
    UserPinnedProjectItemData,
} from "./graphql-types/item"
import {
    UserPinnedProjectsResponse,
} from "./graphql-types/response"

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
