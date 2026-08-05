import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Checkout URL and identifiers after creating a multi-course payment.",
})
/**
 * Payload returned after creating a multi-course checkout: the gateway redirect
 * info plus the number of courses the order will enroll on success.
 */
export class CoursesCheckoutResponseData {
    /** Hosted checkout URL (redirect) or form action URL (SePay). */
    @Field(
        () => String,
        {
            description: "The checkout URL the client redirects to (or POSTs the SePay fields to).",
        },
    )
        checkoutUrl: string

    /** The order code echoed by the gateway (also the transaction reference id). */
    @Field(
        () => String,
        {
            description: "The reference id of the order (gateway order code).",
        },
    )
        referenceId: string

    /** Primary key of the parent `transactions` row (the order). */
    @Field(
        () => ID,
        {
            description: "Primary key of the parent `transactions` row (the order).",
        },
    )
        transactionId: string

    /** Total charged amount (VND). */
    @Field(
        () => String,
        {
            description: "Total charged amount (VND).",
        },
    )
        amount: number

    /** Number of courses this order will enroll the buyer into on payment success. */
    @Field(
        () => Int,
        {
            description: "Number of courses this order enrolls on success.",
        },
    )
        itemCount: number

    /** When set (SePay PG), JSON of signed checkout fields the client POSTs as a form; null for redirect providers. */
    @Field(
        () => String,
        {
            nullable: true,
            description:
                "When set (SePay PG), JSON of signed checkout fields the client "
                + "POSTs as a form to `checkoutUrl`; null for redirect providers.",
        },
    )
        checkoutFields?: string
}

@ObjectType({
    description: "Response wrapper for the multi-course checkout mutation.",
})
/**
 * Response wrapper for the `coursesCheckout` mutation.
 */
export class CoursesCheckoutResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CoursesCheckoutResponseData>
{
    /** Checkout payload; null on error (the transform interceptor drops data on failure). */
    @Field(
        () => CoursesCheckoutResponseData,
        {
            nullable: true,
        },
    )
        data: CoursesCheckoutResponseData
}
