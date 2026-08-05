import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"
import {
    GraphQLTypeRewardRedemptionStatus,
    RewardRedemptionStatus,
} from "@modules/databases/postgresql/primary/enums/reward-redemption-status"

@ObjectType({
    description: "The redemption after being marked fulfilled.",
})
/**
 * The redemption's id + refreshed status after the fulfil transition.
 */
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

@ObjectType({
    description: "Response wrapper for the fulfillRedemption mutation.",
})
/**
 * Response wrapper for the fulfillRedemption mutation.
 */
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
