import {
    v5 as uuidv5,
} from "uuid"
import type {
    CourseId,
} from "./course-id"
import {
    COURSE_UUID_NAMESPACE,
} from "./namespace"
import {
    buildModuleId,
} from "./module"

/**
 * Parameters for building a lesson video ID.
 */
export interface BuildLessonVideoIdParams {
    /**
     * The course ID.
     */
    courseId: CourseId
    /**
     * The module index.
     */
    moduleIndex: number
    /**
     * The lesson video index.
     */
    lessonVideoIndex: number
}

/**
 * Build a lesson video ID.
 * @param params - The parameters for building the lesson video ID.
 * @returns The lesson video ID.
 */
export const buildLessonVideoId = (params: BuildLessonVideoIdParams) => {
    return uuidv5(
        `${buildModuleId(params)}-lesson-video-${params.lessonVideoIndex}`,
        COURSE_UUID_NAMESPACE,
    )
}

