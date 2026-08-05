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
    DailyQuestService,
} from "@modules/bussiness"
import {
    ClaimDailyQuestRewardData,
    ClaimDailyQuestRewardResponse,
} from "./graphql-types"

@Resolver()
/**
 * Claim the daily-quest reward for the authenticated user. Delegates the
 * completeness + already-claimed checks, the reward grant, and the completion
 * insert to {@link DailyQuestService} (one atomic transaction). A typed exception
 * surfaces when the quest is incomplete or already claimed today.
 */
export class ClaimDailyQuestRewardResolver {
    constructor(
        private readonly dailyQuestService: DailyQuestService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Daily quest reward claimed successfully",
        [Locale.Vi]: "Nhận thưởng nhiệm vụ hằng ngày thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ClaimDailyQuestRewardResponse,
        {
            name: "claimDailyQuestReward",
            description: "Claim the completed daily-quest reward (grants points once per day).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<ClaimDailyQuestRewardData> {
        return this.dailyQuestService.claimReward(user.id)
    }
}
