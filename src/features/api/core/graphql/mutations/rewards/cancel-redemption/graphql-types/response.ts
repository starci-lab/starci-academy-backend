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
    description: "The redemption after being cancelled (its cost is now excluded from the spent sum).",
})
/**
 * The redemption's id + refreshed status after the cancel transition. The
 * cost is refunded implicitly -- `computeSpent` excludes `cancelled` rows from
 * the spent sum, so no balance field is returned here; the client re-fetches
 * `myRewardWallet`/an ops listing for the refreshed balance.
 */
export class CancelRedemptionData {
    @Field(
        () => String,
        {
            description: "Id of the cancelled redemption.",
        },
    )
        redemptionId: string

    @Field(
        () => GraphQLTypeRewardRedemptionStatus,
        {
            description: "The redemption's status after the transition (always `cancelled`).",
        },
    )
        status: RewardRedemptionStatus
}

@ObjectType({
    description: "Response wrapper for the cancelRedemption mutation.",
})
/**
 * Response wrapper for the cancelRedemption mutation.
 */
export class CancelRedemptionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CancelRedemptionData> {
    @Field(
        () => CancelRedemptionData,
        {
            nullable: true,
            description: "The redemption after being cancelled.",
        },
    )
        data: CancelRedemptionData
}
