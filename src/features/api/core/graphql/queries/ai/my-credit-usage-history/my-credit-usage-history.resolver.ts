import {
    Args,
    Int,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
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
    CreditUsageService,
} from "@modules/bussiness"
import {
    MyCreditUsageHistoryResponse,
    MyCreditUsageHistoryResponseData,
} from "./graphql-types"

/** Hard ceiling on page size to keep the query cheap. */
const MAX_LIMIT = 200

/**
 * Per-user AI credit charge history (newest first), paginated.
 * Source of truth is `credit_usage_histories`; read directly (not cached) since
 * the history is viewed on demand, not on the grading hot path.
 */
@Resolver()
export class MyCreditUsageHistoryResolver {
    constructor(
        private readonly creditUsageService: CreditUsageService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "AI credit usage history fetched successfully",
        [Locale.Vi]: "Lấy lịch sử dùng credit AI thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyCreditUsageHistoryResponse,
        {
            name: "myCreditUsageHistory",
            description:
                "Returns the authenticated user's paginated AI credit charge history "
                + "(newest first) from credit_usage_histories.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("limit",
            {
                type: () => Int,
                nullable: true,
                defaultValue: 50,
            })
            limit: number,
        @Args("offset",
            {
                type: () => Int,
                nullable: true,
                defaultValue: 0,
            })
            offset: number,
    ): Promise<MyCreditUsageHistoryResponseData> {
        const page = await this.creditUsageService.getHistory(
            user.id,
            {
                limit: Math.min(Math.max(limit ?? 50,
                    1),
                MAX_LIMIT),
                offset: Math.max(offset ?? 0,
                    0),
            },
        )
        return {
            items: page.items.map((item) => ({
                id: item.id,
                mode: item.mode,
                recommendation: item.recommendation,
                model: item.model,
                provider: item.provider,
                credits: item.credits,
                createdAt: item.createdAt,
            })),
            total: page.total,
        }
    }
}
