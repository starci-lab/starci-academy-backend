import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** Payload: checkout URL, order identifiers, and charged amount after creating a payment link. */
@ObjectType({
    description: "Checkout URL and identifiers after creating a PayOS payment link.",
})
export class CourseEnrollResponseData {
    @Field(
        () => String,
        {
            description: "PayOS hosted checkout URL.",
        },
    )
        checkoutUrl: string

    @Field(
        () => String,
        {
            description: "PayOS order code (string form).",
        },
    )
        orderCode: string

    @Field(
        () => ID,
        {
            description: "Primary key of the `preflight_transactions` row.",
        },
    )
        preflightTransactionId: string

    @Field(
        () => String,
        {
            description: "PayOS payment link id.",
        },
    )
        paymentLinkId: string

    @Field(
        () => Int,
        {
            description: "Charged amount (VND).",
        },
    )
        amount: number
}

@ObjectType({
    description: "Response wrapper for the course enroll mutation.",
})
export class CourseEnrollResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CourseEnrollResponseData>
{
    @Field(
        () => CourseEnrollResponseData,
    )
        data: CourseEnrollResponseData
}
