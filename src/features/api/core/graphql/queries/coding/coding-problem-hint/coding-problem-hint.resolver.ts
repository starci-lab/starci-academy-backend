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
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import {
    CodingProblemService,
    type CodingProblemHintResult,
} from "@modules/bussiness"
import {
    CodingProblemHintRequest,
    CodingProblemHintResponse,
} from "./graphql-types"

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
        [Locale.Vi]: "Lấy gợi ý tư duy thành công",
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
