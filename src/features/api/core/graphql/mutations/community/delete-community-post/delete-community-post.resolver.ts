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
    DeletedCommunityPostObject,
} from "../../../shared/community/object-types/community-comments-page.object"
import {
    DeleteCommunityPostRequest,
} from "./graphql-types/request"
import {
    DeleteCommunityPostResponse,
} from "./graphql-types/response"
import {
    DeleteCommunityPostService,
} from "./delete-community-post.service"

@Resolver()
/** GraphQL resolver for the `deleteCommunityPost` mutation. */
export class DeleteCommunityPostResolver {
    constructor(
        private readonly deleteCommunityPostService: DeleteCommunityPostService,
    ) {}

    /**
     * Soft-deletes a community post (author-only).
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Post deleted successfully",
        [Locale.Vi]: "Xoá bài thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => DeleteCommunityPostResponse,
        {
            name: "deleteCommunityPost",
            description: "Soft-deletes a community post (author-only).",
        },
    )
    async execute(
        @Args("request")
            request: DeleteCommunityPostRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<DeletedCommunityPostObject> {
        return this.deleteCommunityPostService.execute({
            request,
            user,
        })
    }
}
