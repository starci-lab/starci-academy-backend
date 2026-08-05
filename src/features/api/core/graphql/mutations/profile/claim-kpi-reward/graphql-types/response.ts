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
    description: "Result of claiming one weekly KPI's coin reward.",
})
/**
 * Payload of a successful KPI-reward claim: the coin amount just granted and
 * the user's refreshed Coin balance.
 */
export class ClaimKpiRewardData {
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
    description: "Response wrapper for the claimKpiReward mutation.",
})
/**
 * Response wrapper for the claimKpiReward mutation.
 */
export class ClaimKpiRewardResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ClaimKpiRewardData> {
    @Field(
        () => ClaimKpiRewardData,
        {
            nullable: true,
            description: "The reward granted by this claim.",
        },
    )
        data: ClaimKpiRewardData
}
