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
    /** Loyalty discount percent (0-100) to apply to the resolved base price. Default 0. */
    discountPercent?: number
    /**
     * Price a SPECIFIC phase instead of the course's current phase -- used to preview
     * a future tier (e.g. "price rises to X" scarcity). Defaults to the current phase.
     */
    phase?: PricingPhase
}

/** Params for resolving the USD (dollars) amount for a course tier (international gateways). */
export interface ResolveCourseAmountUsdParams {
    /** Course with `pricingPhases` loaded; the active phase decides the charged USD price. */
    course: CourseEntity
    /** Loyalty discount percent (0-100) to apply to the resolved base price. Default 0. */
    discountPercent?: number
    /**
     * Price a SPECIFIC phase instead of the course's current phase -- used to preview
     * a future tier (e.g. "price rises to X" scarcity). Defaults to the current phase.
     */
    phase?: PricingPhase
}
