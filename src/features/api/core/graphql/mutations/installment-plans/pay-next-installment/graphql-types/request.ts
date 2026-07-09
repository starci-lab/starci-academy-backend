import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    GraphQLTypePaymentType,
    PaymentType,
} from "@modules/databases"

/**
 * Request for paying the CURRENT cycle of an installment (trả góp) plan —
 * charges exactly `computeMinPaymentVnd(plan)`, never the whole remaining
 * balance. MVP is VND-only (PayOS / Sepay); other payment types are rejected
 * by the handler.
 */
@InputType({
    description: "Plan id + payment provider + redirect URLs for paying an installment plan's current cycle.",
})
export class PayNextInstallmentRequest {
    /** The plan being paid — must belong to the requesting user. */
    @Field(
        () => ID,
        {
            description: "Id of the installment plan to pay the current cycle of.",
        },
    )
        planId: string

    /** Domestic gateway only (VND) — Stripe/PayPal/Crypto are rejected (MVP scope). */
    @Field(
        () => GraphQLTypePaymentType,
        {
            description: "Payment provider for the installment payment (PayOS / Sepay only, MVP).",
        },
    )
        paymentType: PaymentType

    /** Redirect URL after a successful payment (required by PayOS). */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Return URL after successful payment.",
        },
    )
        returnUrl?: string

    /** Redirect URL when the buyer abandons checkout (required by PayOS). */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Cancel URL when the buyer abandons checkout.",
        },
    )
        cancelUrl?: string
}
