import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** The refreshed freeze inventory + Coin balance after a purchase. */
@ObjectType({
    description: "Refreshed streak-freeze count + Coin balance after the purchase.",
})
export class BuyStreakFreezeData {
    @Field(
        () => Int,
        {
            description: "The viewer's streak-freeze count after the purchase.",
        },
    )
        streakFreezes: number

    @Field(
        () => Int,
        {
            description: "The viewer's spendable Coin balance after the purchase.",
        },
    )
        coinBalance: number
}

/**
 * Response for buying a streak freeze.
 */
@ObjectType({
    description: "Response for the buyStreakFreeze mutation.",
})
export class BuyStreakFreezeResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<BuyStreakFreezeData>
{
    @Field(
        () => BuyStreakFreezeData,
        {
            nullable: true,
            description: "Refreshed streak-freeze count + Coin balance.",
        },
    )
        data: BuyStreakFreezeData
}
