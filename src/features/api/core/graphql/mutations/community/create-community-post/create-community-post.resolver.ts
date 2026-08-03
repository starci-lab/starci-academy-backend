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
    CommunityPostNodeObject,
} from "../../../shared/community"
import {
    CreateCommunityPostRequest,
    CreateCommunityPostResponse,
} from "./graphql-types"
import {
    CreateCommunityPostService,
} from "./create-community-post.service"

/** GraphQL resolver for the `createCommunityPost` mutation. */
@Resolver()
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
        [Locale.Vi]: "Đăng bài thành công",
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
