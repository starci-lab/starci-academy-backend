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
 * One redeemable reward in the gifts store, localized to the request locale.
 */
@ObjectType({
    description: "A redeemable reward in the điểm quà gifts store.",
})
export class RewardObject {
    @Field(
        () => String,
        {
            description: "Stable reward key, used as the redeem identifier.",
        },
    )
        key: string

    @Field(
        () => String,
        {
            description: "Display title (localized).",
        },
    )
        title: string

    @Field(
        () => String,
        {
            description: "Short description of what the reward gives (localized).",
        },
    )
        description: string

    @Field(
        () => Int,
        {
            description: "Cost in điểm quà (reward points).",
        },
    )
        cost: number

    @Field(
        () => String,
        {
            description: "Reward kind — 'digital' or 'physical'.",
        },
    )
        kind: string
}

/**
 * Response wrapper for the rewards catalog query.
 */
@ObjectType({
    description: "Response wrapper for the rewards query.",
})
export class RewardsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<RewardObject>> {
    @Field(
        () => [RewardObject],
        {
            nullable: true,
            description: "The redeemable reward catalog.",
        },
    )
        data: Array<RewardObject>
}
