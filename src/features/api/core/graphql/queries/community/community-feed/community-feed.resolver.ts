import {
    Args,
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
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-optional-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    CommunityFeedPageObject,
} from "../../../shared/community/object-types/community-feed-page.object"
import {
    CommunityFeedRequest,
} from "./graphql-types/request"
import {
    CommunityFeedResponse,
} from "./graphql-types/response"
import {
    CommunityFeedService,
} from "./community-feed.service"

@Resolver()
/** GraphQL resolver for the `communityFeed` query. */
export class CommunityFeedResolver {
    constructor(
        private readonly communityFeedService: CommunityFeedService,
    ) {}

    /**
     * Lists a cursor-paginated page of the community feed. Open to everyone; the
     * viewer's own reaction + `isMine` are only populated when authenticated.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Community feed fetched successfully",
        [Locale.Vi]: "Lấy bảng tin cộng đồng thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakOptionalAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => CommunityFeedResponse,
        {
            name: "communityFeed",
            description: "Cursor-paginated community feed (optionally scoped to a channel).",
        },
    )
    async execute(
        @Args("request")
            request: CommunityFeedRequest,
        @KeycloakGraphQLUser()
            user?: UserEntity,
    ): Promise<CommunityFeedPageObject> {
        return this.communityFeedService.execute({
            request,
            user,
        })
    }
}
