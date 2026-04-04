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
 * Parameters for building a prerequisite ID.
 */
export interface BuildPrerequisiteIdParams {
    /**
     * The course ID.
     */
    courseId: CourseId
    /**
     * The prerequisite index.
     */
    prerequisiteIndex: number
}

/**
 * Build a prerequisite ID.
 * @param params - The parameters for building the prerequisite ID.
 * @returns The prerequisite ID.
 */
export const buildPrerequisiteId = (params: BuildPrerequisiteIdParams) => {
    return uuidv5(
        `${buildCourseId({
            courseId: params.courseId,
        })}-prerequisite-${params.prerequisiteIndex}`,
        COURSE_UUID_NAMESPACE,
    )
}

