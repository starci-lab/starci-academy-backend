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
 * Parameters for building a QNA ID.
 */
export interface BuildQnaIdParams {
    /**
     * The course ID.
     */
    courseId: CourseId
    /**
     * The QNA index.
     */
    qnaIndex: number
}

/**
 * Build a QNA ID.
 * @param params - The parameters for building the QNA ID.
 * @returns The QNA ID.
 */
export const buildQnaId = (params: BuildQnaIdParams) => {
    return uuidv5(
        `${buildCourseId({
            courseId: params.courseId,
        })}-qna-${params.qnaIndex}`,
        COURSE_UUID_NAMESPACE,
    )
}

