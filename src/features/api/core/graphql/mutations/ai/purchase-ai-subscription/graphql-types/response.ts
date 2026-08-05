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
    description: "Checkout URL and identifiers for an AI subscription purchase.",
})
/** Checkout URL + identifiers after creating an AI subscription payment link. */
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
/**
 * GraphQL envelope for AI-subscription checkout. `data` is nullable so the
 * transform interceptor can null it on the error path -- a required field would
 * crash GraphQL and hide the real payment-provider failure.
 */
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
