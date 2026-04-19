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
} from "@modules/databases"
import {
    ChallengesRequest,
    ChallengesResponse,
    ChallengesResponseData,
} from "./graphql-types"
import {
    ChallengesService,
} from "./challenges.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"

@Resolver()
export class ChallengesResolver {
    constructor(
        private readonly challengesService: ChallengesService,
    ) {}

    /**
     * Lists challenges for a module with page-based pagination.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Challenges fetched successfully",
        [Locale.Vi]: "Lấy danh sách challenge thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ChallengesResponse,
        {
            name: "challenges",
            description: "Lists challenges for a module with page-based pagination.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Module id, pagination, and sort request.",
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
