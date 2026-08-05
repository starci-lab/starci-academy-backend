import {
    Args,
    Mutation,
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
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    CommunityCommentNodeObject,
} from "../../../shared/community/object-types/community-comment-node.object"
import {
    CreateCommunityPostCommentRequest,
} from "./graphql-types/request"
import {
    CreateCommunityPostCommentResponse,
} from "./graphql-types/response"
import {
    CreateCommunityPostCommentService,
} from "./create-community-post-comment.service"

@Resolver()
/** GraphQL resolver for the `createCommunityPostComment` mutation. */
export class CreateCommunityPostCommentResolver {
    constructor(
        private readonly createCommunityPostCommentService: CreateCommunityPostCommentService,
    ) {}

    /**
     * Creates a comment (top-level or reply) on a community post.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Comment posted successfully",
        [Locale.Vi]: "Đăng bình luận thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => CreateCommunityPostCommentResponse,
        {
            name: "createCommunityPostComment",
            description: "Creates a comment (top-level or reply) on a community post.",
        },
    )
    async execute(
        @Args("request")
            request: CreateCommunityPostCommentRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<CommunityCommentNodeObject> {
        return this.createCommunityPostCommentService.execute({
            request,
            user,
        })
    }
}
