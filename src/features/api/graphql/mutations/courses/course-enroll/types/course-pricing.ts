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
    course: CourseEntity
}
