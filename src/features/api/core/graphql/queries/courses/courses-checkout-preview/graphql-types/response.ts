import {
    Field,
    Float,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    InstallmentOptionItem,
} from "../../course-price-preview/graphql-types"

@ObjectType({
    description: "Preview price of one course in a multi-course order.",
})
/**
 * One priced line of the checkout preview: the list vs charged price of a single
 * course, keyed by course id so the client can match it to the cart row it holds.
 */
export class CoursesCheckoutPreviewLine {
    /** Id of the course this line prices. */
    @Field(
        () => ID,
        {
            description: "Id of the course this line prices.",
        },
    )
        courseId: string

    /** List (pre-discount) VND price -- the struck "before" price. */
    @Field(
        () => Int,
        {
            description: "List (pre-discount) VND price.",
        },
    )
        listVnd: number

    /** Charged VND price with loyalty + bundle discount applied. */
    @Field(
        () => Int,
        {
            description: "Charged VND price (loyalty + bundle applied).",
        },
    )
        chargedVnd: number

    /** List USD price, or null when the course has no USD price. */
    @Field(
        () => Float,
        {
            nullable: true,
            description: "List (pre-discount) USD price, or null when unset.",
        },
    )
        listUsd: number | null

    /** Charged USD price with discount applied, or null when the course has no USD price. */
    @Field(
        () => Float,
        {
            nullable: true,
            description: "Charged USD price, or null when unset.",
        },
    )
        chargedUsd: number | null

    /** Combined loyalty + bundle discount percent applied to this line (0-100). */
    @Field(
        () => Int,
        {
            description: "Combined loyalty + bundle discount percent for this line (0–100).",
        },
    )
        discountPercent: number
}

@ObjectType({
    description: "Preview of a multi-course order: per-course lines + order totals.",
})
/**
 * The full checkout preview: per-course lines + the summed order totals + the
 * bundle context, computed by the SAME service that prices the real checkout so
 * the shown total equals the charged total.
 */
export class CoursesCheckoutPreviewData {
    /** One priced line per purchasable course (empty when nothing to buy). */
    @Field(
        () => [CoursesCheckoutPreviewLine],
        {
            description: "One priced line per purchasable course.",
        },
    )
        lines: Array<CoursesCheckoutPreviewLine>

    /** Sum of every line's LIST VND price (struck "before" order total). */
    @Field(
        () => Int,
        {
            description: "Sum of every line's list VND price.",
        },
    )
        totalListVnd: number

    /** Sum of every line's CHARGED VND price (the domestic gateway total). */
    @Field(
        () => Int,
        {
            description: "Sum of every line's charged VND price.",
        },
    )
        totalChargedVnd: number

    /** VND saved across the order (`totalListVnd − totalChargedVnd`). */
    @Field(
        () => Int,
        {
            description: "Total VND saved across the order.",
        },
    )
        savingsVnd: number

    /** Sum of every line's LIST USD price, or null when any line lacks a USD price. */
    @Field(
        () => Float,
        {
            nullable: true,
            description: "Sum of every line's list USD price, or null when any lacks USD.",
        },
    )
        totalListUsd: number | null

    /** Sum of every line's CHARGED USD price, or null when any line lacks a USD price. */
    @Field(
        () => Float,
        {
            nullable: true,
            description: "Sum of every line's charged USD price, or null when any lacks USD.",
        },
    )
        totalChargedUsd: number | null

    /** Order-wide bundle bonus percent applied (0 / 5 / 10 by course count). */
    @Field(
        () => Int,
        {
            description: "Order-wide bundle bonus percent (0 / 5 / 10 by course count).",
        },
    )
        bundleBonusPercent: number

    /** Number of purchasable courses in the order. */
    @Field(
        () => Int,
        {
            description: "Number of purchasable courses in the order.",
        },
    )
        itemCount: number

    /** Offered installment terms priced off the whole order's charged VND total -- empty for a free/USD-only order. */
    @Field(
        () => [InstallmentOptionItem],
        {
            description: "Offered installment terms for the order's charged VND total — empty for a free order.",
        },
    )
        installmentOptions: Array<InstallmentOptionItem>
}

@ObjectType({
    description: "Response wrapper for the multi-course checkout preview query.",
})
/**
 * Response wrapper for the `coursesCheckoutPreview` query.
 */
export class CoursesCheckoutPreviewResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CoursesCheckoutPreviewData>
{
    /** Preview payload; null on error (the transform interceptor drops data on failure). */
    @Field(
        () => CoursesCheckoutPreviewData,
        {
            nullable: true,
        },
    )
        data: CoursesCheckoutPreviewData
}
