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
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    MyAiQuotaResponse,
    MyAiQuotaResponseData,
} from "./graphql-types/response"

@Resolver()
/**
 * Per-user AI quota snapshot -- the single credit pool (free base + tier) with
 * limit/used/remaining per 5h + weekly window, plus the reset times + the
 * active tier. Drives the usage card in the UI.
 *
 * Reads from Postgres (`ai_subscriptions`), not Redis -- counters live on the
 * entity with lazy window resets applied on read.
 */
export class MyAiQuotaResolver {
    constructor(
        private readonly aiEntitlementService: AiEntitlementService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "AI quota fetched successfully",
        [Locale.Vi]: "Lấy hạn mức AI thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyAiQuotaResponse,
        {
            name: "myAiQuota",
            description:
                "Returns the authenticated user's AI quota snapshot — a single credit pool "
                + "(free base + tier) with limit/used/remaining per 5h + weekly window.",
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
            tier: snapshot.tier,
            credit: {
                limit5h: snapshot.credit.limit5h,
                used5h: snapshot.credit.used5h,
                remaining5h: snapshot.credit.remaining5h,
                limitWeek: snapshot.credit.limitWeek,
                usedWeek: snapshot.credit.usedWeek,
                remainingWeek: snapshot.credit.remainingWeek,
            },
            window5hResetAt: snapshot.window5hResetAt,
            windowWeekResetAt: snapshot.windowWeekResetAt,
            allowedCategories: snapshot.allowedCategories,
            ceil: snapshot.ceil,
        }
    }
}
