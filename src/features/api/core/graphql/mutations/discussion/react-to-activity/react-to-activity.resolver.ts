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
    ReactionSummaryObject,
} from "../../../shared/discussion/object-types/reaction-summary.object"
import {
    ReactToActivityRequest,
} from "./graphql-types/request"
import {
    ReactToActivityResponse,
} from "./graphql-types/response"
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
