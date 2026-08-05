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
    CommentNodeObject,
} from "../../../shared/discussion/object-types/comment-node.object"
import {
    CreateCommentRequest,
} from "./graphql-types/request"
import {
    CreateCommentResponse,
} from "./graphql-types/response"
import {
    CreateCommentService,
} from "./create-comment.service"

@Resolver()
/** GraphQL resolver for the `createComment` mutation. */
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
        [Locale.Vi]: "Đăng bình luận thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
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
