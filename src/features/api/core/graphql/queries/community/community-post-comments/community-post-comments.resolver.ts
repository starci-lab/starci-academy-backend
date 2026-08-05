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
    CommunityCommentsPageObject,
} from "../../../shared/community"
import {
    CommunityPostCommentsRequest,
    CommunityPostCommentsResponse,
} from "./graphql-types"
import {
    CommunityPostCommentsService,
} from "./community-post-comments.service"

@Resolver()
/** GraphQL resolver for the `communityPostComments` query. */
export class CommunityPostCommentsResolver {
    constructor(
        private readonly communityPostCommentsService: CommunityPostCommentsService,
    ) {}

    /**
     * Lists comments (top-level or one parent's replies) for a community post.
     * Open to everyone; the viewer's own reaction is only set when authenticated.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Comments fetched successfully",
        [Locale.Vi]: "Lấy bình luận thành công",
    })
    @UseGuards(
        KeycloakOptionalAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => CommunityPostCommentsResponse,
        {
            name: "communityPostComments",
            description: "Lists comments of a community post (top-level, or replies of one parent).",
        },
    )
    async execute(
        @Args("request")
            request: CommunityPostCommentsRequest,
        @KeycloakGraphQLUser()
            user?: UserEntity,
    ): Promise<CommunityCommentsPageObject> {
        return this.communityPostCommentsService.execute({
            request,
            user,
        })
    }
}
