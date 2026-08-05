import {
    Args,
    Query,
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
    ContentReactionsRequest,
} from "./graphql-types/request"
import {
    ContentReactionsResponse,
} from "./graphql-types/response"
import {
    ContentReactionsService,
} from "./content-reactions.service"

@Resolver()
/** GraphQL resolver for the `contentReactions` query. */
export class ContentReactionsResolver {
    constructor(
        private readonly contentReactionsService: ContentReactionsService,
    ) {}

    /**
     * Returns the aggregate reaction summary for a content the current user is enrolled in.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Reactions fetched successfully",
        [Locale.Vi]: "Lấy cảm xúc thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ContentReactionsResponse,
        {
            name: "contentReactions",
            description: "Returns the aggregate reaction summary for a content.",
        },
    )
    async execute(
        @Args("request")
            request: ContentReactionsRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<ReactionSummaryObject> {
        return this.contentReactionsService.execute({
            request,
            user,
        })
    }
}
