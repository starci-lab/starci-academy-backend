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
    description: "Refreshed streak-freeze count + Coin balance after the purchase.",
})
/** The refreshed freeze inventory + Coin balance after a purchase. */
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

@ObjectType({
    description: "Response for the buyStreakFreeze mutation.",
})
/**
 * Response for buying a streak freeze.
 */
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
