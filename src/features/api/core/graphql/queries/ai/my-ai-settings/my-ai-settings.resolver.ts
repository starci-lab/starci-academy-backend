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
    MyAiSettingsResponse,
    MyAiSettingsResponseData,
} from "./graphql-types/response"

@Resolver()
/**
 * Per-user AI lane settings -- the saved lane preference plus the capabilities
 * the UI needs to decide which lanes are selectable (Auto / Premium).
 * Drives the lane selector on the AI settings page.
 *
 * Reads from Postgres (`ai_subscriptions`).
 */
export class MyAiSettingsResolver {
    constructor(
        private readonly aiEntitlementService: AiEntitlementService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "AI settings fetched successfully",
        [Locale.Vi]: "Lấy cài đặt AI thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyAiSettingsResponse,
        {
            name: "myAiSettings",
            description:
                "Returns the authenticated user's AI capabilities — the paid-model "
                + "unlock flag and the active tier.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<MyAiSettingsResponseData> {
        const settings = await this.aiEntitlementService.getSettings({
            userId: user.id,
        })
        return {
            canPremium: settings.canPremium,
            tier: settings.tier,
        }
    }
}
