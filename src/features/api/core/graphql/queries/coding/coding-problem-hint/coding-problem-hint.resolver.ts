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
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
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
    CodingProblemService,
} from "@modules/bussiness/coding/coding-problem.service"
import type {
    CodingProblemHintResult,
} from "@modules/bussiness/coding/types"
import {
    CodingProblemHintRequest,
} from "./graphql-types/request"
import {
    CodingProblemHintResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Loads a coding problem's "approach hint" markdown for the detail view. The
 * hint lives only in Elasticsearch (never Postgres / the CDN); returns null when
 * the problem has no hint authored.
 */
export class CodingProblemHintResolver {
    constructor(
        private readonly codingProblemService: CodingProblemService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Coding problem hint fetched successfully",
        [Locale.Vi]: "Lấy gợi ý tư duy thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => CodingProblemHintResponse,
        {
            name: "codingProblemHint",
            description: "Loads a coding problem's approach-hint markdown (from Elasticsearch, localized).",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Problem slug to load the hint for.",
            },
        )
            request: CodingProblemHintRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<CodingProblemHintResult | null> {
        // delegate to the domain service (reads ES, locale fallback to English)
        return this.codingProblemService.getHint({
            slug: request.slug,
            locale,
        })
    }
}
