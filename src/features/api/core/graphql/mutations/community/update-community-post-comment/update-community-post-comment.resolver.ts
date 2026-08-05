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
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    CommunityCommentNodeObject,
} from "../../../shared/community"
import {
    UpdateCommunityPostCommentRequest,
    UpdateCommunityPostCommentResponse,
} from "./graphql-types"
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
