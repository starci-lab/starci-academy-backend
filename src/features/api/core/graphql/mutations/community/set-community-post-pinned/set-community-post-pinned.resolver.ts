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
    SetCommunityPostPinnedRequest,
} from "./graphql-types/request"
import {
    SetCommunityPostPinnedResponse,
} from "./graphql-types/response"
import {
    SetCommunityPostPinnedService,
} from "./set-community-post-pinned.service"

@Resolver()
/** GraphQL resolver for the `setCommunityPostPinned` mutation. */
export class SetCommunityPostPinnedResolver {
    constructor(
        private readonly setCommunityPostPinnedService: SetCommunityPostPinnedService,
    ) {}

    /**
     * Pins/unpins a community post (founder-only; enforced in the domain service).
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Post pin updated successfully",
        [Locale.Vi]: "Cập nhật ghim bài thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SetCommunityPostPinnedResponse,
        {
            name: "setCommunityPostPinned",
            description: "Pins/unpins a community post (founder-only).",
        },
    )
    async execute(
        @Args("request")
            request: SetCommunityPostPinnedRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<CommunityPostNodeObject> {
        return this.setCommunityPostPinnedService.execute({
            request,
            user,
        })
    }
}
