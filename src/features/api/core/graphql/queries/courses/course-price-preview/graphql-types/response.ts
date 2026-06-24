import {
    Field,
    Float,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    DiscountReason,
    GraphQLTypeDiscountReason,
} from "@modules/databases"

/**
 * Pre-checkout price preview for a single course: the original vs loyalty-discounted
 * price (VND always; USD when the active phase has one) plus the discount metadata,
 * computed with the SAME services applied at checkout so the shown price equals the
 * eventual charge. Lets the payment modal show "what + how much + why discounted"
 * before the buyer picks a gateway.
 */
@ObjectType({
    description: "Pre-checkout price preview for a course, priced with the viewer's loyalty discount.",
})
export class CoursePricePreviewData {
    @Field(
        () => Int,
        {
            description: "Original (pre-discount) VND price.",
        },
    )
        originalPriceVnd: number

    @Field(
        () => Int,
        {
            description: "Active-phase VND price BEFORE loyalty (between original/list and discounted) — for the price breakdown.",
        },
    )
        phasePriceVnd: number

    @Field(
        () => Int,
        {
            description: "Loyalty-discounted VND price (what the viewer would pay via PayOS / Sepay).",
        },
    )
        discountedPriceVnd: number

    @Field(
        () => Int,
        {
            description: "Loyalty discount percent applied (0–30).",
        },
    )
        discountPercent: number

    @Field(
        () => Float,
        {
            nullable: true,
            description: "Original (pre-discount) USD price; null when the active phase has no USD price.",
        },
    )
        originalPriceUsd: number | null

    @Field(
        () => Float,
        {
            nullable: true,
            description: "Active-phase USD price BEFORE loyalty (between original/list and discounted) — for the breakdown; null when no USD price.",
        },
    )
        phasePriceUsd: number | null

    @Field(
        () => Float,
        {
            nullable: true,
            description: "Loyalty-discounted USD price; null when the active phase has no USD price.",
        },
    )
        discountedPriceUsd: number | null

    @Field(
        () => GraphQLTypeDiscountReason,
        {
            description: "Why the loyalty discount applies (drives FE copy).",
        },
    )
        discountReason: DiscountReason

    @Field(
        () => Int,
        {
            description: "Number of courses the viewer already owns (fed the discount).",
        },
    )
        enrolledCount: number
}

/**
 * Response wrapper for the coursePricePreview query.
 */
@ObjectType({
    description: "Response wrapper for the coursePricePreview query.",
})
export class CoursePricePreviewResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CoursePricePreviewData> {
    @Field(
        () => CoursePricePreviewData,
        {
            nullable: true,
            description: "The course's pre-checkout price preview.",
        },
    )
        data: CoursePricePreviewData
}
