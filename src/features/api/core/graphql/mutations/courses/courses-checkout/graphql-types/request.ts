import {
    Field,
    ID,
    Int,
    InputType,
} from "@nestjs/graphql"
import {
    GraphQLTypePaymentType,
    PaymentType,
} from "@modules/databases/postgresql/primary/enums/payment-type"

@InputType({
    description: "Course ids, payment provider, and redirect URLs for a multi-course checkout.",
})
/**
 * Request for the multi-course cart checkout: the set of courses to buy in one
 * payment, the chosen gateway, and the redirect URLs used by the redirect
 * providers (PayOS / Sepay / Stripe / PayPal / Crypto).
 */
export class CoursesCheckoutRequest {
    /**
     * Ids of the courses to buy in one payment. Duplicates and courses the user
     * already owns are dropped server-side.
     */
    @Field(
        () => [ID],
        {
            description: "Ids of the courses to buy in one payment.",
        },
    )
        courseIds: Array<string>

    /**
     * The payment provider that will collect the summed total.
     */
    @Field(
        () => GraphQLTypePaymentType,
        {
            description: "The payment provider for the multi-course checkout.",
        },
    )
        paymentType: PaymentType

    /**
     * Redirect URL after a successful payment (required by every redirect provider).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Return URL after successful payment.",
        },
    )
        returnUrl?: string

    /**
     * Redirect URL when the buyer abandons checkout (required by every redirect provider).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Cancel URL when the buyer abandons checkout.",
        },
    )
        cancelUrl?: string

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Pay the whole cart in installments over this many months (3/6/12). Omit/null = pay in full. Only the domestic VND gateways (PayOS/Sepay) support it.",
        },
    )
        installmentMonths?: number
}
