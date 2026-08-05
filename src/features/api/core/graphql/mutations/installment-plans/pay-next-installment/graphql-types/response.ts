import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Checkout URL and identifiers for paying an installment plan's current cycle.",
})
/** Checkout URL + identifiers after creating an installment-plan cycle payment. */
export class PayNextInstallmentResponseData {
    @Field(
        () => ID,
        {
            description: "Id of the installment plan this checkout pays.",
        },
    )
        planId: string

    @Field(
        () => String,
        {
            description: "The checkout URL for the payment.",
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
            description: "Charged amount for this cycle (VND) — the plan's current minimum payment.",
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
    description: "Response wrapper for the payNextInstallment mutation.",
})
/**
 * Response wrapper for the `payNextInstallment` mutation.
 */
export class PayNextInstallmentResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<PayNextInstallmentResponseData>
{
    /** Checkout payload; null on error (the transform interceptor drops data on failure). */
    @Field(
        () => PayNextInstallmentResponseData,
        {
            nullable: true,
        },
    )
        data: PayNextInstallmentResponseData
}
