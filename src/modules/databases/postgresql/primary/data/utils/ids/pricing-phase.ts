import {
    v5 as uuidv5,
} from "uuid"
import type {
    CourseId,
} from "./course-id"
import {
    buildCourseId,
} from "./course"
import {
    COURSE_UUID_NAMESPACE,
} from "./namespace"

/**
 * Parameters for building a pricing phase ID.
 */
export interface BuildPricingPhaseIdParams {
    /**
     * The course ID.
     */
    courseId: CourseId
    /**
     * The phase index.
     */
    phaseIndex: number
}

/**
 * Build a pricing phase ID.
 * @param params - The parameters for building the pricing phase ID.
 * @returns The pricing phase ID.
 */
export const buildPricingPhaseId = (params: BuildPricingPhaseIdParams) => {
    return uuidv5(
        `${buildCourseId({
            courseId: params.courseId,
        })}-pricing-${params.phaseIndex}`,
        COURSE_UUID_NAMESPACE,
    )
}

