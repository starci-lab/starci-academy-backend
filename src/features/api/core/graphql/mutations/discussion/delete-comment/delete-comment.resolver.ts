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
    DeletedCommentObject,
} from "../../../shared/discussion/object-types/comments-page.object"
import {
    DeleteCommentRequest,
} from "./graphql-types/request"
import {
    DeleteCommentResponse,
} from "./graphql-types/response"
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
        [Locale.Vi]: "Xóa bình luận thành công", // vn-ok: vi-locale string emitted to clients
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
