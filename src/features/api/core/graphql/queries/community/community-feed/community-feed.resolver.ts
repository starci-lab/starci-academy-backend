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
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakGraphQLUser,
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    CommunityFeedPageObject,
} from "../../../shared/community"
import {
    CommunityFeedRequest,
    CommunityFeedResponse,
} from "./graphql-types"
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
