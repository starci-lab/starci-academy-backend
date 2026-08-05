import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Result of claiming the weekly-challenge reward.",
})
/**
 * Payload of a successful weekly-challenge claim: the coin amount just
 * granted and the user's refreshed Coin balance.
 */
export class ClaimWeeklyChallengeRewardData {
    @Field(
        () => Int,
        {
            description: "Coin amount granted by this claim.",
        },
    )
        coinReward: number

    @Field(
        () => Int,
        {
            description: "The user's Coin balance after the grant.",
        },
    )
        balance: number
}

@ObjectType({
    description: "Response wrapper for the claimWeeklyChallengeReward mutation.",
})
/**
 * Response wrapper for the claimWeeklyChallengeReward mutation.
 */
export class ClaimWeeklyChallengeRewardResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ClaimWeeklyChallengeRewardData> {
    @Field(
        () => ClaimWeeklyChallengeRewardData,
        {
            nullable: true,
            description: "The reward granted by this claim.",
        },
    )
        data: ClaimWeeklyChallengeRewardData
}
