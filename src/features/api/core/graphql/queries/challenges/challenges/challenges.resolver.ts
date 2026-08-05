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
    GraphQLLocale,
} from "@modules/api/apollo/server/decorators/locale.decorators"
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
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ChallengesRequest,
} from "./graphql-types/request"
import {
    ChallengesResponse,
    ChallengesResponseData,
} from "./graphql-types/response"
import {
    ChallengesService,
} from "./challenges.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
@Resolver()
/**
 * GraphQL entry for `challenges`: paginated catalog for one content item,
 * served from the locale ES index.
 */
export class ChallengesResolver {
    constructor(
        private readonly challengesService: ChallengesService,
    ) { }

    /**
     * Lists challenges for a module with page-based pagination.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Challenges fetched successfully",
        [Locale.Vi]: "Lấy danh sách challenge thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ChallengesResponse,
        {
            name: "challenges",
            description: "Lists challenges for a content item with page-based pagination.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Content id, pagination, and sort request.",
            },
        )
            request: ChallengesRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<ChallengesResponseData> {
        return this.challengesService.execute(
            {
                request,
                locale,
            },
        )
    }
}
