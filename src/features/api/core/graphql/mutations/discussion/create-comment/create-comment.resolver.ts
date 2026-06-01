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
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"
import {
    CommentNodeObject,
} from "../../../shared/discussion"
import {
    CreateCommentRequest,
    CreateCommentResponse,
} from "./graphql-types"
import {
    CreateCommentService,
} from "./create-comment.service"

@Resolver()
export class CreateCommentResolver {
    constructor(
        private readonly createCommentService: CreateCommentService,
    ) {}

    /**
     * Creates a comment (top-level or reply) on a content.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Comment posted successfully",
        [Locale.Vi]: "Đăng bình luận thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => CreateCommentResponse,
        {
            name: "createComment",
            description: "Creates a comment (top-level or reply) on a content.",
        },
    )
    async execute(
        @Args("request")
            request: CreateCommentRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<CommentNodeObject> {
        return this.createCommentService.execute({
            request,
            user,
        })
    }
}
