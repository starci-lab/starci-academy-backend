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
    UpdateCommunityPostCommentRequest,
} from "./graphql-types/request"
import {
    UpdateCommunityPostCommentResponse,
} from "./graphql-types/response"
import {
    UpdateCommunityPostCommentService,
} from "./update-community-post-comment.service"

@Resolver()
/** GraphQL resolver for the `updateCommunityPostComment` mutation. */
export class UpdateCommunityPostCommentResolver {
    constructor(
        private readonly updateCommunityPostCommentService: UpdateCommunityPostCommentService,
    ) {}

    /**
     * Edits a community post comment's body (author-only).
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Comment updated successfully",
        [Locale.Vi]: "Cập nhật bình luận thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => UpdateCommunityPostCommentResponse,
        {
            name: "updateCommunityPostComment",
            description: "Edits a community post comment's body (author-only).",
        },
    )
    async execute(
        @Args("request")
            request: UpdateCommunityPostCommentRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<CommunityCommentNodeObject> {
        return this.updateCommunityPostCommentService.execute({
            request,
            user,
        })
    }
}
