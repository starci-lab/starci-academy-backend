import {
    Mutation,
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
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    StreakService,
} from "@modules/bussiness/streak/streak.service"
import {
    BuyStreakFreezeData,
    BuyStreakFreezeResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Buy one streak freeze for the current user, spending Coin. Delegates the
 * balance/cap check + atomic spend to {@link StreakService.buyStreakFreeze}
 * (pessimistic row lock; race-safe against concurrent purchases). Throws a
 * typed exception when the viewer already holds the max freezes or lacks the
 * Coin.
 */
export class BuyStreakFreezeResolver {
    constructor(
        private readonly streakService: StreakService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Streak freeze purchased successfully",
        [Locale.Vi]: "Mua đóng băng chuỗi ngày thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => BuyStreakFreezeResponse,
        {
            name: "buyStreakFreeze",
            description: "Buy one streak freeze for the current user (spends Coin).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<BuyStreakFreezeData> {
        const {
            streakFreezes,
            points,
        } = await this.streakService.buyStreakFreeze(user.id)
        return {
            streakFreezes,
            coinBalance: points,
        }
    }
}
