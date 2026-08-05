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
    CreateCommunityPostRequest,
} from "./graphql-types/request"
import {
    CreateCommunityPostResponse,
} from "./graphql-types/response"
import {
    CreateCommunityPostService,
} from "./create-community-post.service"

@Resolver()
/** GraphQL resolver for the `createCommunityPost` mutation. */
export class CreateCommunityPostResolver {
    constructor(
        private readonly createCommunityPostService: CreateCommunityPostService,
    ) {}

    /**
     * Creates a community post (quota-checked for non-members).
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Post created successfully",
        [Locale.Vi]: "Đăng bài thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => CreateCommunityPostResponse,
        {
            name: "createCommunityPost",
            description: "Creates a community post.",
        },
    )
    async execute(
        @Args("request")
            request: CreateCommunityPostRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<CommunityPostNodeObject> {
        return this.createCommunityPostService.execute({
            request,
            user,
        })
    }
}
