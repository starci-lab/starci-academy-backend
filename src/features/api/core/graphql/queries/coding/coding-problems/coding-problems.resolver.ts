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
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    CodingProblemService,
} from "@modules/bussiness"
import {
    CodingProblemsRequest,
    CodingProblemsResponse,
    type CodingProblemsResponseData,
} from "./graphql-types"

/**
 * Lists enabled coding problems with optional difficulty/tag filters and
 * pagination, plus the ids the authenticated user has already solved (for the
 * "solved" badges in the list).
 */
@Resolver()
export class CodingProblemsResolver {
    constructor(
        private readonly codingProblemService: CodingProblemService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Coding problems fetched successfully",
        [Locale.Vi]: "Lấy danh sách bài tập thành công",
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
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<CodingProblemsResponseData> {
        // delegate to the domain service, scoping solved flags to the current user
        return this.codingProblemService.list({
            difficulty: request.difficulty,
            tag: request.tag,
            page: request.page,
            limit: request.limit,
            userId: user.id,
            locale,
        })
    }
}
