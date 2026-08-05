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
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-optional-auth-graphql.guard"
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
    WeeklyChallengeService,
} from "@modules/bussiness/weekly-challenge/weekly-challenge.service"
import {
    WeeklyChallengeObject,
    WeeklyChallengeResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * The current ISO week's auto-rotated challenge event. Deterministically picks one
 * challenge for the week and reports who passed it this week. Optional auth -- an
 * anonymous viewer gets `viewerPassed = false`. Read-only (the rotation is a pure
 * function of the calendar). Delegates to {@link WeeklyChallengeService}.
 */
export class WeeklyChallengeResolver {
    constructor(
        private readonly weeklyChallengeService: WeeklyChallengeService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Weekly challenge fetched successfully",
        [Locale.Vi]: "Lấy thử thách tuần thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => WeeklyChallengeResponse,
        {
            name: "weeklyChallenge",
            description: "The current ISO week's auto-rotated challenge event (read-only).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity | undefined,
    ): Promise<WeeklyChallengeObject | null> {
        // anonymous viewers (no token) get viewerPassed = false
        return this.weeklyChallengeService.getWeeklyChallenge(user?.id ?? null)
    }
}
