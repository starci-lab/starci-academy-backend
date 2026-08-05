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
    AiEntitlementService,
} from "@modules/ai"
import {
    MyCreditUsageResponse,
    MyCreditUsageResponseData,
} from "./graphql-types"

@Resolver()
/**
 * Per-user AI credit usage snapshot — used / quota / remaining / overQuota.
 * Source of truth is the unified pool (`ai_subscriptions`, tier-aware) via
 * {@link AiEntitlementService.snapshot} — the SAME source the quota gate reads,
 * so this can never drift from what actually blocks a grading call.
 */
export class MyCreditUsageResolver {
    constructor(
        private readonly aiEntitlementService: AiEntitlementService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "AI credit usage fetched successfully",
        [Locale.Vi]: "Lấy lượng credit AI đã dùng thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyCreditUsageResponse,
        {
            name: "myCreditUsage",
            description:
                "Returns the authenticated user's AI credit usage snapshot "
                + "(used / quota / remaining / overQuota) from the unified pool.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<MyCreditUsageResponseData> {
        const snapshot = await this.aiEntitlementService.snapshot({
            userId: user.id,
        })
        const overQuota = snapshot.credit.remaining5h <= 0
            || snapshot.credit.remainingWeek <= 0
        return {
            usedCredits: snapshot.credit.usedWeek,
            quota: snapshot.credit.limitWeek,
            remainingCredits: snapshot.credit.remainingWeek,
            overQuota,
            resetAt: snapshot.windowWeekResetAt,
            window5h: {
                usedCredits: snapshot.credit.used5h,
                quota: snapshot.credit.limit5h,
                remainingCredits: snapshot.credit.remaining5h,
                resetAt: snapshot.window5hResetAt,
            },
            windowWeek: {
                usedCredits: snapshot.credit.usedWeek,
                quota: snapshot.credit.limitWeek,
                remainingCredits: snapshot.credit.remainingWeek,
                resetAt: snapshot.windowWeekResetAt,
            },
        }
    }
}
