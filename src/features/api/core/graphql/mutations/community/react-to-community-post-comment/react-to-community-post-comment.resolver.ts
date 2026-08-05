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
import type {
    ReactionSummaryObject,
} from "../../../shared/discussion/object-types/reaction-summary.object"
import {
    ReactToCommunityPostCommentRequest,
} from "./graphql-types/request"
import {
    ReactToCommunityPostCommentResponse,
} from "./graphql-types/response"
import {
    ReactToCommunityPostCommentService,
} from "./react-to-community-post-comment.service"

@Resolver()
/** GraphQL resolver for the `reactToCommunityPostComment` mutation. */
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
        [Locale.Vi]: "Cập nhật cảm xúc thành công", // vn-ok: vi-locale string emitted to clients
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
