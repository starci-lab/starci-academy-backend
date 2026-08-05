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
    CommunityCommentsPageObject,
} from "../../../shared/community/object-types/community-comments-page.object"
import {
    CommunityPostCommentsRequest,
} from "./graphql-types/request"
import {
    CommunityPostCommentsResponse,
} from "./graphql-types/response"
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
        [Locale.Vi]: "Lấy bình luận thành công", // vn-ok: vi-locale string emitted to clients
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
