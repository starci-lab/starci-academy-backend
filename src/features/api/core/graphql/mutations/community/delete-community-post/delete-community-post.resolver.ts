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
    DeletedCommunityPostObject,
} from "../../../shared/community"
import {
    DeleteCommunityPostRequest,
    DeleteCommunityPostResponse,
} from "./graphql-types"
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
        [Locale.Vi]: "Xoá bài thành công",
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
