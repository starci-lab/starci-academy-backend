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
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    StreakService,
} from "@modules/bussiness"
import {
    BuyStreakFreezeData,
    BuyStreakFreezeResponse,
} from "./graphql-types"

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
        [Locale.Vi]: "Mua đóng băng chuỗi ngày thành công",
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
