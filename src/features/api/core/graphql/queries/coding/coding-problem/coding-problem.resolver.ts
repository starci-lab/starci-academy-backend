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
    CodingProblemEntity,
    Locale,
} from "@modules/databases"
import {
    CodingProblemService,
} from "@modules/bussiness"
import {
    CodingProblemRequest,
    CodingProblemResponse,
} from "./graphql-types"

@Resolver()
/**
 * Loads one coding problem by slug for the detail/editor view — statement,
 * starter code, and SAMPLE testcases only (hidden testcases are never exposed).
 */
export class CodingProblemResolver {
    constructor(
        private readonly codingProblemService: CodingProblemService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Coding problem fetched successfully",
        [Locale.Vi]: "Lấy bài tập thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => CodingProblemResponse,
        {
            name: "codingProblem",
            description: "Loads a coding problem by slug with starter code + sample testcases (localized).",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Problem slug to load.",
            },
        )
            request: CodingProblemRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<CodingProblemEntity> {
        // delegate to the domain service (filters hidden testcases + localizes)
        return this.codingProblemService.getBySlug({
            slug: request.slug,
            locale,
        })
    }
}
