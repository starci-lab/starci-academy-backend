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
 * Parameters for building a content ID.
 */
export interface BuildContentIdParams {
    /**
     * The course ID.
     */
    courseId: CourseId
    /**
     * The module index.
     */
    moduleIndex: number
    /**
     * The content index.
     */
    contentIndex: number
}

/**
 * Build a content ID.
 * @param params - The parameters for building the content ID.
 * @returns The content ID.
 */
export const buildContentId = (params: BuildContentIdParams) => {
    return uuidv5(
        `${buildModuleId(params)}-content-${params.contentIndex}`,
        COURSE_UUID_NAMESPACE,
    )
}

