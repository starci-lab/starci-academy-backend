import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    AiSubTier,
    GraphQLTypeAiSubTier,
    GraphQLTypePaymentType,
    PaymentType,
} from "@modules/databases"

/**
 * Request for purchasing an AI subscription tier. Mirrors the course-enroll
 * checkout shape (PayOS / Sepay), but targets an {@link AiSubTier} instead of
 * a course.
 */
@InputType({
    description: "AI subscription tier + payment provider for checkout.",
})
export class PurchaseAiSubscriptionRequest {
    @Field(
        () => GraphQLTypeAiSubTier,
        {
            description: "AI subscription tier to purchase (plus / pro / max).",
        },
    )
        tier: AiSubTier

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
