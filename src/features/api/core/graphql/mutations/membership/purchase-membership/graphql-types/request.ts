import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    GraphQLTypePaymentType,
    PaymentType,
} from "@modules/databases/postgresql/primary/enums/payment-type"

@InputType({
    description: "Payment provider for a community membership checkout.",
})
/**
 * Request for purchasing community membership. Mirrors the AI-subscription
 * checkout shape (PayOS / Sepay / Stripe / PayPal / Crypto) but targets the
 * single membership product instead of a tier or a course.
 */
export class PurchaseMembershipRequest {
    @Field(
        () => GraphQLTypePaymentType,
        {
            description: "Payment provider for the purchase.",
        },
    )
        paymentType: PaymentType

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
}
