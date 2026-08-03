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
    UpdateCommunityPostRequest,
    UpdateCommunityPostResponse,
} from "./graphql-types"
import {
    UpdateCommunityPostService,
} from "./update-community-post.service"

/** GraphQL resolver for the `updateCommunityPost` mutation. */
@Resolver()
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
        [Locale.Vi]: "Cập nhật bài thành công",
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
