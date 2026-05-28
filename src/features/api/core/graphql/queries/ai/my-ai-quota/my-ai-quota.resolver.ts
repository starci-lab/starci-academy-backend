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
    MyAiQuotaResponse,
    MyAiQuotaResponseData,
} from "./graphql-types"

/**
 * Per-user AI quota snapshot — caps + used + remaining for BOTH the free Auto
 * lane (complimentary, counted in "lượt") and the paid Premium lane (credits),
 * plus the 5h / weekly window reset times. Drives the usage bar in the UI.
 *
 * Reads from Postgres (`ai_subscriptions`), not Redis — counters live on the
 * entity with lazy window resets applied on read.
 */
@Resolver()
export class MyAiQuotaResolver {
    constructor(
        private readonly aiEntitlementService: AiEntitlementService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "AI quota fetched successfully",
        [Locale.Vi]: "Lấy hạn mức AI thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyAiQuotaResponse,
        {
            name: "myAiQuota",
            description:
                "Returns the authenticated user's AI quota snapshot — Auto (complimentary) "
                + "uses and Premium credits, each with limit/used/remaining per 5h + weekly window.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<MyAiQuotaResponseData> {
        const snapshot = await this.aiEntitlementService.snapshot({
            userId: user.id,
        })
        return {
            mode: snapshot.mode,
            tier: snapshot.tier,
            auto: {
                limit5h: snapshot.auto.limit5h,
                used5h: snapshot.auto.used5h,
                remaining5h: snapshot.auto.remaining5h,
                limitWeek: snapshot.auto.limitWeek,
                usedWeek: snapshot.auto.usedWeek,
                remainingWeek: snapshot.auto.remainingWeek,
            },
            premium: {
                limit5h: snapshot.premium.limit5h,
                used5h: snapshot.premium.used5h,
                remaining5h: snapshot.premium.remaining5h,
                limitWeek: snapshot.premium.limitWeek,
                usedWeek: snapshot.premium.usedWeek,
                remainingWeek: snapshot.premium.remainingWeek,
            },
            window5hResetAt: snapshot.window5hResetAt,
            windowWeekResetAt: snapshot.windowWeekResetAt,
        }
    }
}
