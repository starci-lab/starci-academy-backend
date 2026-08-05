import {
    DiscountReason,
} from "@modules/databases/postgresql/primary/enums/discount-reason"

/** Row shape for the recommended-course id selection (popularity-ordered). */
export interface RecommendedCourseIdRow {
    /** Course primary key. */
    id: string
}

/**
 * One priced recommended course -- the course's display fields plus the original
 * and loyalty-discounted prices (VND always, USD when configured) and the
 * discount metadata used for FE copy.
 */
export interface RecommendedCourseItem {
    displayId: string
    title: string
    description: string | null
    thumbnailUrl: string | null
    originalPriceVnd: number
    discountedPriceVnd: number
    discountPercent: number
    originalPriceUsd: number | null
    discountedPriceUsd: number | null
    discountReason: DiscountReason
    enrolledCount: number
}

/** Params for listing recommended courses for a viewer. */
export interface ListRecommendedCoursesParams {
    /** The viewer to price + exclude already-owned courses for. */
    userId: string
    /** Maximum number of courses to return. */
    limit: number
}
