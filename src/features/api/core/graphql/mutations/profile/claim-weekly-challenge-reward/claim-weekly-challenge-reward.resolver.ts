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
    WeeklyChallengeService,
} from "@modules/bussiness"
import {
    ClaimWeeklyChallengeRewardData,
    ClaimWeeklyChallengeRewardResponse,
} from "./graphql-types"

/**
 * Claim the authenticated user's Coin reward for passing the current ISO
 * week's featured challenge. Delegates the pass + already-claimed checks and
 * the reward grant to {@link WeeklyChallengeService} (one atomic transaction).
 * A typed exception surfaces when the challenge hasn't been passed yet or was
 * already claimed this week.
 */
@Resolver()
export class ClaimWeeklyChallengeRewardResolver {
    constructor(
        private readonly weeklyChallengeService: WeeklyChallengeService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Weekly-challenge reward claimed successfully",
        [Locale.Vi]: "Nhận thưởng thử thách tuần thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ClaimWeeklyChallengeRewardResponse,
        {
            name: "claimWeeklyChallengeReward",
            description: "Claim the current user's coin reward for the passed weekly challenge.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<ClaimWeeklyChallengeRewardData> {
        return this.weeklyChallengeService.claimReward(user.id)
    }
}
