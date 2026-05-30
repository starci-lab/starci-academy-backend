import {
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
    MyCreditUsageResponse,
    MyCreditUsageResponseData,
} from "./graphql-types"

/**
 * Per-user AI credit usage snapshot — used / quota / remaining / overQuota.
 * Source of truth is `credit_usage_histories`; the sum is Redis-cached by
 * {@link CreditUsageService} so this query stays cheap.
 */
@Resolver()
export class MyCreditUsageResolver {
    constructor(
        private readonly creditUsageService: CreditUsageService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "AI credit usage fetched successfully",
        [Locale.Vi]: "Lấy lượng credit AI đã dùng thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyCreditUsageResponse,
        {
            name: "myCreditUsage",
            description:
                "Returns the authenticated user's AI credit usage snapshot "
                + "(used / quota / remaining / overQuota) from credit_usage_histories.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<MyCreditUsageResponseData> {
        const snapshot = await this.creditUsageService.getSnapshot(user.id)
        return {
            usedCredits: snapshot.usedCredits,
            quota: snapshot.quota,
            remainingCredits: snapshot.remainingCredits,
            overQuota: snapshot.overQuota,
            resetAt: snapshot.resetAt,
        }
    }
}
