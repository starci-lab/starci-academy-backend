import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Checkout URL and identifiers for a community membership purchase.",
})
/** Checkout URL + identifiers after creating a membership payment link. */
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
/**
 * GraphQL envelope for community-membership checkout. `data` is nullable so
 * the transform interceptor can null it on the error path instead of crashing
 * GraphQL over a missing checkout payload.
 */
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
