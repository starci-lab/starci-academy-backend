import {
    Field,
    ID,
    Int,
    InputType,
} from "@nestjs/graphql"
import {
    GraphQLTypePaymentType,
    PaymentType,
} from "@modules/databases"

@InputType({
    description: "Course id, pricing tier, and return URLs for PayOS or Sepay checkout.",
})
/** Request for course enroll mutation (tier, payment provider, optional PayOS URLs). */
export class CourseEnrollRequest {
    @Field(
        () => ID,
        {
            description: "Course id.",
        },
    )
        courseId: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "PayOS returnUrl after successful payment.",
        },
    )
        payosReturnUrl?: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "PayOS cancelUrl when the user abandons checkout.",
        },
    )
        payosCancelUrl?: string

    @Field(
        () => GraphQLTypePaymentType,
        {
            description: "The type of payment for the course enrollment.",
        },
    )
        paymentType: PaymentType

    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional Coin-shop voucher code to apply on top of the loyalty discount. A Percent voucher is honoured by every gateway; a Flat (VND) voucher is honoured only by the domestic VND gateways (PayOS/Sepay) and rejected on the international gateways (Stripe/PayPal/Crypto).",
        },
    )
        voucherCode?: string

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Pay in installments over this many months (3/6/12). Omit/null = pay in full (unchanged behaviour). Only the domestic VND gateways (PayOS/Sepay) support it.",
        },
    )
        installmentMonths?: number
}
