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
import {
    CodingProblemsRequest,
} from "./graphql-types/request"
import {
    CodingProblemsResponse,
    type CodingProblemsResponseData,
} from "./graphql-types/response"

@Resolver()
/**
 * Lists enabled coding problems with optional difficulty/tag filters and
 * pagination, plus the ids the authenticated user has already solved (for the
 * "solved" badges in the list).
 */
export class CodingProblemsResolver {
    constructor(
        private readonly codingProblemService: CodingProblemService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Coding problems fetched successfully",
        [Locale.Vi]: "Lấy danh sách bài tập thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => CodingProblemsResponse,
        {
            name: "codingProblems",
            description: "Lists enabled coding problems with filters, pagination, and the user's solved ids.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Filters + pagination.",
            },
        )
            request: CodingProblemsRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<CodingProblemsResponseData> {
        // catalog only -- per-user solved/points come from the myCodingProgress query
        return this.codingProblemService.list({
            difficulty: request.difficulty,
            tag: request.tag,
            page: request.page,
            limit: request.limit,
            locale,
        })
    }
}
