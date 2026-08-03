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
    CommunityPostNodeObject,
} from "../../../shared/community"
import {
    CommunityPostRequest,
    CommunityPostResponse,
} from "./graphql-types"
import {
    CommunityPostQueryService,
} from "./community-post.service"

/** GraphQL resolver for the `communityPost` query. */
@Resolver()
export class CommunityPostResolver {
    constructor(
        private readonly communityPostQueryService: CommunityPostQueryService,
    ) {}

    /**
     * Fetches a single community post by id. Open to everyone; the viewer's own
     * reaction + `isMine` are only populated when authenticated.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Community post fetched successfully",
        [Locale.Vi]: "Lấy bài đăng cộng đồng thành công",
    })
    @UseGuards(
        KeycloakOptionalAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => CommunityPostResponse,
        {
            name: "communityPost",
            description: "Fetches a single community post by id.",
        },
    )
    async execute(
        @Args("request")
            request: CommunityPostRequest,
        @KeycloakGraphQLUser()
            user?: UserEntity,
    ): Promise<CommunityPostNodeObject> {
        return this.communityPostQueryService.execute({
            request,
            user,
        })
    }
}
