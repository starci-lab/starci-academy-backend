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
 * Parameters for building a module ID.
 */
export interface BuildModuleIdParams {
    /**
     * The course ID.
     */
    courseId: CourseId
    /**
     * The module index.
     */
    moduleIndex: number
}

/**
 * Build a module ID.
 * @param params - The parameters for building the module ID.
 * @returns The module ID.
 */
export const buildModuleId = (params: BuildModuleIdParams) => {
    return uuidv5(
        `${params.courseId}-module-${params.moduleIndex}`,
        COURSE_UUID_NAMESPACE,
    )
}

