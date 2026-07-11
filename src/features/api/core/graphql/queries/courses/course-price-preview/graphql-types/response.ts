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
    GraphQLTypePricingPhase,
    PricingPhase,
} from "@modules/databases"

/**
 * One offered installment ("trả góp") term for this course's discounted price —
 * the payment modal renders these as the 3/6/12-month choices with each term's
 * per-month + total (markup already applied). Empty for a free course.
 */
@ObjectType({
    description: "One offered installment term (months + markup + total + per-month) for a course.",
})
export class InstallmentOptionItem {
    @Field(
        () => Int,
        {
            description: "Number of monthly cycles (3, 6, or 12).",
        },
    )
        months: number

    @Field(
        () => Int,
        {
            description: "Markup percent this term adds over the discounted price.",
        },
    )
        markupPercent: number

    @Field(
        () => Int,
        {
            description: "Whole amount owed across the schedule (discounted price + markup).",
        },
    )
        totalAmountVnd: number

    @Field(
        () => Int,
        {
            description: "Amount charged each cycle (incl. the first at checkout) = total / months.",
        },
    )
        monthlyAmountVnd: number
}

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

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Final VND price after ALSO applying a valid `voucherCode` (on top of loyalty); null when no code was given.",
        },
    )
        voucherDiscountedPriceVnd: number | null

    @Field(
        () => GraphQLTypePricingPhase,
        {
            description: "The course's current pricing phase (drives scarcity copy, e.g. 'Pioneer').",
        },
    )
        currentPhase: PricingPhase

    @Field(
        () => GraphQLTypePricingPhase,
        {
            nullable: true,
            description: "The phase the course advances to once the current one sells out; null when already at the final (Regular) phase.",
        },
    )
        nextPhase: PricingPhase | null

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Seats left at the CURRENT phase price (slotAvailable − paid enrollments); null when the phase has no seat cap (unlimited).",
        },
    )
        seatsRemainingInCurrentPhase: number | null

    @Field(
        () => Int,
        {
            nullable: true,
            description: "VND price a buyer pays AFTER the current phase sells out (the next tier, before loyalty); null when already at the final phase. Powers 'price rises to X' scarcity.",
        },
    )
        nextPhasePriceVnd: number | null

    @Field(
        () => Float,
        {
            nullable: true,
            description: "USD price after the current phase sells out (next tier); null when no next-phase USD price.",
        },
    )
        nextPhasePriceUsd: number | null

    @Field(
        () => [InstallmentOptionItem],
        {
            description: "Offered installment (trả góp) terms for the discounted VND price — empty for a free course or USD-only checkout.",
        },
    )
        installmentOptions: Array<InstallmentOptionItem>
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
