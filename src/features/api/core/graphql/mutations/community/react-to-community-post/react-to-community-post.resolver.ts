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
import type {
    ReactionSummaryObject,
} from "../../../shared/discussion"
import {
    ReactToCommunityPostRequest,
    ReactToCommunityPostResponse,
} from "./graphql-types"
import {
    ReactToCommunityPostService,
} from "./react-to-community-post.service"

@Resolver()
/** GraphQL resolver for the `reactToCommunityPost` mutation. */
export class ReactToCommunityPostResolver {
    constructor(
        private readonly reactToCommunityPostService: ReactToCommunityPostService,
    ) {}

    /**
     * Sets/changes/removes the current user's reaction on a community post.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Reaction updated successfully",
        [Locale.Vi]: "Cập nhật cảm xúc thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ReactToCommunityPostResponse,
        {
            name: "reactToCommunityPost",
            description: "Sets/changes/removes the current user's reaction on a community post.",
        },
    )
    async execute(
        @Args("request")
            request: ReactToCommunityPostRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<ReactionSummaryObject> {
        return this.reactToCommunityPostService.execute({
            request,
            user,
        })
    }
}
