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
    CreateCommunityPostCommentRequest,
    CreateCommunityPostCommentResponse,
} from "./graphql-types"
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
