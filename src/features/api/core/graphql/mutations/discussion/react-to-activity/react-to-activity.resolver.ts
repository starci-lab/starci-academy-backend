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
    ReactionSummaryObject,
} from "../../../shared/discussion"
import {
    ReactToActivityRequest,
    ReactToActivityResponse,
} from "./graphql-types"
import {
    ReactToActivityService,
} from "./react-to-activity.service"

@Resolver()
/** GraphQL resolver for the `reactToActivity` mutation. */
export class ReactToActivityResolver {
    constructor(
        private readonly reactToActivityService: ReactToActivityService,
    ) {}

    /**
     * Sets/changes/removes the current user's reaction on a feed activity. Auth
     * required; reacting to your OWN activity is rejected in the service.
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
        () => ReactToActivityResponse,
        {
            name: "reactToActivity",
            description: "Sets/changes/removes the current user's reaction on a feed activity.",
        },
    )
    async execute(
        @Args("request")
            request: ReactToActivityRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<ReactionSummaryObject> {
        return this.reactToActivityService.execute({
            request,
            user,
        })
    }
}
