import type {
    CourseEntity,
    PricingPhase,
} from "@modules/databases"

/** Params for {@link getCoursePricingPhaseRow}. */
export interface GetCoursePricingPhaseRowParams {
    course: CourseEntity
    phase: PricingPhase
}

/** Params for resolving integer VND amount for a course tier. */
export interface ResolveCourseAmountVndParams {
    /** Course with `pricingPhases` loaded; the active phase decides the charged price. */
    course: CourseEntity
    /** Loyalty discount percent (0–100) to apply to the resolved base price. Default 0. */
    discountPercent?: number
}

/** Params for resolving the USD (dollars) amount for a course tier (international gateways). */
export interface ResolveCourseAmountUsdParams {
    /** Course with `pricingPhases` loaded; the active phase decides the charged USD price. */
    course: CourseEntity
    /** Loyalty discount percent (0–100) to apply to the resolved base price. Default 0. */
    discountPercent?: number
}
