import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * Payload of a successful daily-quest claim: the user's refreshed Coin
 * balance after the grant.
 */
@ObjectType({
    description: "Result of claiming the daily-quest reward.",
})
export class ClaimDailyQuestRewardData {
    @Field(
        () => Int,
        {
            description: "The user's Coin balance after the grant.",
        },
    )
        balance: number
}

/**
 * Response wrapper for the claimDailyQuestReward mutation.
 */
@ObjectType({
    description: "Response wrapper for the claimDailyQuestReward mutation.",
})
export class ClaimDailyQuestRewardResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ClaimDailyQuestRewardData> {
    @Field(
        () => ClaimDailyQuestRewardData,
        {
            nullable: true,
            description: "The refreshed reward balance after claiming.",
        },
    )
        data: ClaimDailyQuestRewardData
}
