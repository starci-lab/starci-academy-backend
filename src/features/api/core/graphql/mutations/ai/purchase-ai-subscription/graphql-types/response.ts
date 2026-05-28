import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** Checkout URL + identifiers after creating an AI subscription payment link. */
@ObjectType({
    description: "Checkout URL and identifiers for an AI subscription purchase.",
})
export class PurchaseAiSubscriptionResponseData {
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
    description: "Response wrapper for the purchaseAiSubscription mutation.",
})
export class PurchaseAiSubscriptionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<PurchaseAiSubscriptionResponseData>
{
    @Field(
        () => PurchaseAiSubscriptionResponseData,
        {
            nullable: true,
            description: "Checkout payload for the AI subscription purchase.",
        },
    )
        data: PurchaseAiSubscriptionResponseData
}
