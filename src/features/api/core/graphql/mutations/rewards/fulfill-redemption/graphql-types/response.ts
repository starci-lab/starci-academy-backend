import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    GraphQLTypeRewardRedemptionStatus,
    RewardRedemptionStatus,
} from "@modules/databases"

/**
 * The redemption's id + refreshed status after the fulfil transition.
 */
@ObjectType({
    description: "The redemption after being marked fulfilled.",
})
export class FulfillRedemptionData {
    @Field(
        () => String,
        {
            description: "Id of the fulfilled redemption.",
        },
    )
        redemptionId: string

    @Field(
        () => GraphQLTypeRewardRedemptionStatus,
        {
            description: "The redemption's status after the transition (always `fulfilled`).",
        },
    )
        status: RewardRedemptionStatus
}

/**
 * Response wrapper for the fulfillRedemption mutation.
 */
@ObjectType({
    description: "Response wrapper for the fulfillRedemption mutation.",
})
export class FulfillRedemptionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<FulfillRedemptionData> {
    @Field(
        () => FulfillRedemptionData,
        {
            nullable: true,
            description: "The redemption after being marked fulfilled.",
        },
    )
        data: FulfillRedemptionData
}
