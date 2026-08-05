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
    description: "Checkout URL and identifiers after creating a PayOS payment link.",
})
/** Payload: checkout URL, order identifiers, and charged amount after creating a payment link. */
export class CourseEnrollResponseData {
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
            description: "The reference ID of the preflight transaction.",
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
    description: "Response wrapper for the course enroll mutation.",
})
/** GraphQL envelope carrying the payment-link payload the client must redirect or POST to; `data` stays null when checkout creation fails. */
export class CourseEnrollResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CourseEnrollResponseData>
{
    @Field(
        () => CourseEnrollResponseData,
        {
            nullable: true,
        },
    )
        data: CourseEnrollResponseData
}
