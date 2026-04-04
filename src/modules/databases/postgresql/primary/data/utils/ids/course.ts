import {
    CourseId 
} from "./course-id"
import {
    v5 as uuidv5 
} from "uuid"
import {
    COURSE_UUID_NAMESPACE 
} from "./namespace"

/**
 * Parameters for building a course ID.
 */
export interface BuildCourseIdParams {
    /**
     * The course ID.
     */
    courseId: CourseId
}

/**
 * Build a course ID.
 * @param params - The parameters for building the course ID.
 * @returns The course ID.
 */
export const buildCourseId = (
    {
        courseId,
    }: BuildCourseIdParams,
): string => {
    return uuidv5(
        courseId.toLowerCase(),
        COURSE_UUID_NAMESPACE,
    )
}