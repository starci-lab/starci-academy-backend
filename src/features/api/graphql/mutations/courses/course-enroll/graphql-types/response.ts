import {
    Field,
    ID,
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
        {
            nullable: true,
        },
    )
        data: CourseEnrollResponseData
}
