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
    CommentNodeObject,
} from "../../../shared/discussion"
import {
    UpdateCommentRequest,
    UpdateCommentResponse,
} from "./graphql-types"
import {
    UpdateCommentService,
} from "./update-comment.service"

/** GraphQL resolver for the `updateComment` mutation. */
@Resolver()
export class UpdateCommentResolver {
    constructor(
        private readonly updateCommentService: UpdateCommentService,
    ) {}

    /**
     * Edits a comment's body (author only).
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Comment updated successfully",
        [Locale.Vi]: "Cập nhật bình luận thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => UpdateCommentResponse,
        {
            name: "updateComment",
            description: "Edits a comment's body (author only).",
        },
    )
    async execute(
        @Args("request")
            request: UpdateCommentRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<CommentNodeObject> {
        return this.updateCommentService.execute({
            request,
            user,
        })
    }
}
