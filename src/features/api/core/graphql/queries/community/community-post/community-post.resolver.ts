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
    CommunityPostNodeObject,
} from "../../../shared/community/object-types/community-post-node.object"
import {
    CommunityPostRequest,
} from "./graphql-types/request"
import {
    CommunityPostResponse,
} from "./graphql-types/response"
import {
    CommunityPostQueryService,
} from "./community-post.service"

@Resolver()
/** GraphQL resolver for the `communityPost` query. */
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
        [Locale.Vi]: "Lấy bài đăng cộng đồng thành công", // vn-ok: vi-locale string emitted to clients
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
