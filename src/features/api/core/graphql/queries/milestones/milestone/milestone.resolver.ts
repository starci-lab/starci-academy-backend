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
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MilestoneRequest,
} from "./graphql-types/request"
import {
    MilestoneResponse,
} from "./graphql-types/response"
import {
    MilestoneService,
} from "./milestone.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness/guards/graphql-must-enrolled.guard"
import {
    GraphQLCacheInterceptor,
    GraphQLCacheResponse,
} from "@modules/integrations/cache/interceptors/graphql-cache.interceptor"
import {
    CacheKey,
} from "@modules/integrations/cache/enums/cache-key"

@Resolver(() => MilestoneEntity)
/**
 * Auth + enrollment-gated GraphQL entry for `milestone` -- cached per id so the
 * hydrated task tree is not re-fetched on every detail-page load.
 */
export class MilestoneResolver {
    constructor(
        private readonly milestoneService: MilestoneService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Milestone fetched successfully",
        [Locale.Vi]: "Lấy milestone thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @GraphQLCacheResponse({
        key: CacheKey.Milestone,
        argsExtractor: (request) => [request.id],
    })
    @UseInterceptors(
        GraphQLTransformInterceptor,
        GraphQLCacheInterceptor,
    )
    @Query(
        () => MilestoneResponse,
        {
            name: "milestone",
            description: "Returns a single milestone by id (with nested tasks and criteria).",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Milestone lookup: provide id.",
            },
        )
            request: MilestoneRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<MilestoneEntity> {
        return this.milestoneService.execute(
            {
                request,
                locale,
            },
        )
    }
}
