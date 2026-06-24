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
    ReactToCommunityPostCommentRequest,
    ReactToCommunityPostCommentResponse,
} from "./graphql-types"
import {
    ReactToCommunityPostCommentService,
} from "./react-to-community-post-comment.service"

@Resolver()
export class ReactToCommunityPostCommentResolver {
    constructor(
        private readonly reactToCommunityPostCommentService: ReactToCommunityPostCommentService,
    ) {}

    /**
     * Sets/changes/removes the current user's reaction on a community post comment.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Reaction updated successfully",
        [Locale.Vi]: "Cập nhật cảm xúc thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ReactToCommunityPostCommentResponse,
        {
            name: "reactToCommunityPostComment",
            description: "Sets/changes/removes the current user's reaction on a community post comment.",
        },
    )
    async execute(
        @Args("request")
            request: ReactToCommunityPostCommentRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<ReactionSummaryObject> {
        return this.reactToCommunityPostCommentService.execute({
            request,
            user,
        })
    }
}
