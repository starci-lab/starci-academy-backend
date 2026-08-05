import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Result of claiming the daily-quest reward.",
})
/**
 * Payload of a successful daily-quest claim: the user's refreshed Coin
 * balance after the grant.
 */
export class ClaimDailyQuestRewardData {
    @Field(
        () => Int,
        {
            description: "The user's Coin balance after the grant.",
        },
    )
        balance: number
}

@ObjectType({
    description: "Response wrapper for the claimDailyQuestReward mutation.",
})
/**
 * Response wrapper for the claimDailyQuestReward mutation.
 */
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
