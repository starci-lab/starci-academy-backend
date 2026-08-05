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
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    MilestoneEntity,
} from "@modules/databases"
import {
    MilestoneRequest,
    MilestoneResponse,
} from "./graphql-types"
import {
    MilestoneService,
} from "./milestone.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"
import {
    GraphQLCacheInterceptor,
    GraphQLCacheResponse,
} from "@modules/cache"
import {
    CacheKey,
} from "@modules/cache"

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
