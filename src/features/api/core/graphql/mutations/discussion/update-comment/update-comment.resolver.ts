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
    UpdateCommentRequest,
} from "./graphql-types/request"
import {
    UpdateCommentResponse,
} from "./graphql-types/response"
import {
    UpdateCommentService,
} from "./update-comment.service"

@Resolver()
/** GraphQL resolver for the `updateComment` mutation. */
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
        [Locale.Vi]: "Cập nhật bình luận thành công", // vn-ok: vi-locale string emitted to clients
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
