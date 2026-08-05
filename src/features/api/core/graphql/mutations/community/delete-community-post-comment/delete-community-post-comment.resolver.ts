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
    DeletedCommunityCommentObject,
} from "../../../shared/community/object-types/community-comments-page.object"
import {
    DeleteCommunityPostCommentRequest,
} from "./graphql-types/request"
import {
    DeleteCommunityPostCommentResponse,
} from "./graphql-types/response"
import {
    DeleteCommunityPostCommentService,
} from "./delete-community-post-comment.service"

@Resolver()
/** GraphQL resolver for the `deleteCommunityPostComment` mutation. */
export class DeleteCommunityPostCommentResolver {
    constructor(
        private readonly deleteCommunityPostCommentService: DeleteCommunityPostCommentService,
    ) {}

    /**
     * Soft-deletes a community post comment (author-only).
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Comment deleted successfully",
        [Locale.Vi]: "Xoá bình luận thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => DeleteCommunityPostCommentResponse,
        {
            name: "deleteCommunityPostComment",
            description: "Soft-deletes a community post comment (author-only).",
        },
    )
    async execute(
        @Args("request")
            request: DeleteCommunityPostCommentRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<DeletedCommunityCommentObject> {
        return this.deleteCommunityPostCommentService.execute({
            request,
            user,
        })
    }
}
