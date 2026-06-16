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
 * The refreshed wallet + inventory after a redemption.
 */
@ObjectType({
    description: "Refreshed điểm quà balance + streak-freeze count after redeeming.",
})
export class RedeemRewardData {
    @Field(
        () => Int,
        {
            description: "The viewer's remaining điểm quà balance after the redemption.",
        },
    )
        balance: number

    @Field(
        () => Int,
        {
            description: "The viewer's streak-freeze count after the redemption.",
        },
    )
        streakFreezes: number
}

/**
 * Response wrapper for the redeemReward mutation.
 */
@ObjectType({
    description: "Response wrapper for the redeemReward mutation.",
})
export class RedeemRewardResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<RedeemRewardData> {
    @Field(
        () => RedeemRewardData,
        {
            nullable: true,
            description: "Refreshed balance + streak-freeze count.",
        },
    )
        data: RedeemRewardData
}
