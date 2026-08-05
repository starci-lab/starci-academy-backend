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
    DeletedCommentObject,
} from "../../../shared/discussion"
import {
    DeleteCommentRequest,
    DeleteCommentResponse,
} from "./graphql-types"
import {
    DeleteCommentService,
} from "./delete-comment.service"

@Resolver()
/** GraphQL resolver for the `deleteComment` mutation. */
export class DeleteCommentResolver {
    constructor(
        private readonly deleteCommentService: DeleteCommentService,
    ) {}

    /**
     * Soft-deletes a comment (author only).
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Comment deleted successfully",
        [Locale.Vi]: "Xóa bình luận thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => DeleteCommentResponse,
        {
            name: "deleteComment",
            description: "Soft-deletes a comment (author only).",
        },
    )
    async execute(
        @Args("request")
            request: DeleteCommentRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<DeletedCommentObject> {
        return this.deleteCommentService.execute({
            request,
            user,
        })
    }
}
