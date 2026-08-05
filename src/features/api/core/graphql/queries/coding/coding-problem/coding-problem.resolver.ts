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
    CodingProblemEntity,
} from "@modules/databases/postgresql/primary/entities/coding-problem.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    CodingProblemService,
} from "@modules/bussiness/coding/coding-problem.service"
import {
    CodingProblemRequest,
} from "./graphql-types/request"
import {
    CodingProblemResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Loads one coding problem by slug for the detail/editor view -- statement,
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
