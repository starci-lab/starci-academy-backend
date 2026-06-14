import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** Checkout URL + identifiers after creating a membership payment link. */
@ObjectType({
    description: "Checkout URL and identifiers for a community membership purchase.",
})
export class PurchaseMembershipResponseData {
    @Field(
        () => String,
        {
            description: "The checkout URL for the preflight transaction.",
        },
    )
        checkoutUrl: string

    @Field(
        () => String,
        {
            description: "The reference ID (provider order code) of the transaction.",
        },
    )
        referenceId: string

    @Field(
        () => ID,
        {
            description: "Primary key of the `transactions` row.",
        },
    )
        transactionId: string

    @Field(
        () => String,
        {
            description: "Charged amount (VND).",
        },
    )
        amount: number

    @Field(
        () => String,
        {
            nullable: true,
            description:
                "When set (SePay PG), JSON of signed checkout fields the client "
                + "POSTs as a form to `checkoutUrl`; null for redirect providers (PayOS).",
        },
    )
        checkoutFields?: string
}

@ObjectType({
    description: "Response wrapper for the purchaseMembership mutation.",
})
export class PurchaseMembershipResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<PurchaseMembershipResponseData>
{
    @Field(
        () => PurchaseMembershipResponseData,
        {
            nullable: true,
            description: "Checkout payload for the community membership purchase.",
        },
    )
        data: PurchaseMembershipResponseData
}
