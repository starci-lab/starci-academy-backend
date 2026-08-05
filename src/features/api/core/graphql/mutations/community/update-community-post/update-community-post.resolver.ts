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
    CommunityPostNodeObject,
} from "../../../shared/community/object-types/community-post-node.object"
import {
    UpdateCommunityPostRequest,
} from "./graphql-types/request"
import {
    UpdateCommunityPostResponse,
} from "./graphql-types/response"
import {
    UpdateCommunityPostService,
} from "./update-community-post.service"

@Resolver()
/** GraphQL resolver for the `updateCommunityPost` mutation. */
export class UpdateCommunityPostResolver {
    constructor(
        private readonly updateCommunityPostService: UpdateCommunityPostService,
    ) {}

    /**
     * Edits a community post's body (author-only).
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Post updated successfully",
        [Locale.Vi]: "Cập nhật bài thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => UpdateCommunityPostResponse,
        {
            name: "updateCommunityPost",
            description: "Edits a community post's body (author-only).",
        },
    )
    async execute(
        @Args("request")
            request: UpdateCommunityPostRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<CommunityPostNodeObject> {
        return this.updateCommunityPostService.execute({
            request,
            user,
        })
    }
}
