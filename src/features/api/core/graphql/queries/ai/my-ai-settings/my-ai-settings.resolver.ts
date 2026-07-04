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
    MyAiSettingsResponse,
    MyAiSettingsResponseData,
} from "./graphql-types"

/**
 * Per-user AI lane settings — the saved lane preference plus the capabilities
 * the UI needs to decide which lanes are selectable (Auto / Premium).
 * Drives the lane selector on the AI settings page.
 *
 * Reads from Postgres (`ai_subscriptions`).
 */
@Resolver()
export class MyAiSettingsResolver {
    constructor(
        private readonly aiEntitlementService: AiEntitlementService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "AI settings fetched successfully",
        [Locale.Vi]: "Lấy cài đặt AI thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyAiSettingsResponse,
        {
            name: "myAiSettings",
            description:
                "Returns the authenticated user's AI lane settings — preferred + effective "
                + "lane and Premium capability flag.",
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
            preferredMode: settings.preferredMode,
            effectiveMode: settings.effectiveMode,
            canPremium: settings.canPremium,
            tier: settings.tier,
        }
    }
}
