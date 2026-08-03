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
    DeletedCommunityCommentObject,
} from "../../../shared/community"
import {
    DeleteCommunityPostCommentRequest,
    DeleteCommunityPostCommentResponse,
} from "./graphql-types"
import {
    DeleteCommunityPostCommentService,
} from "./delete-community-post-comment.service"

/** GraphQL resolver for the `deleteCommunityPostComment` mutation. */
@Resolver()
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
        [Locale.Vi]: "Xoá bình luận thành công",
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
