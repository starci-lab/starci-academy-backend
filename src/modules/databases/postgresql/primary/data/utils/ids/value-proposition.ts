import {
    v5 as uuidv5,
} from "uuid"
import type {
    CourseId,
} from "./course-id"
import {
    COURSE_UUID_NAMESPACE,
} from "./namespace"

/**
 * Parameters for building a value proposition ID.
 */
export interface BuildValuePropositionIdParams {
    /**
     * The course ID.
     */
    courseId: CourseId
    /**
     * The value proposition index.
     */
    valuePropositionIndex: number
}

/**
 * Build a value proposition ID.
 * @param params - The parameters for building the value proposition ID.
 * @returns The value proposition ID.
 */
export const buildValuePropositionId = (params: BuildValuePropositionIdParams) => {
    return uuidv5(
        `${params.courseId}-value-proposition-${params.valuePropositionIndex}`,
        COURSE_UUID_NAMESPACE,
    )
}

