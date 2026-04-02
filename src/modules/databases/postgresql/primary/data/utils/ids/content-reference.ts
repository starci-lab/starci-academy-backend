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
    buildContentId,
} from "./content"

/**
 * Parameters for building a content reference ID.
 */
export interface BuildContentReferenceIdParams {
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
    /**
     * The reference index within the content.
     */
    referenceIndex: number
}

/**
 * Build a deterministic content reference ID.
 */
export const buildContentReferenceId = (params: BuildContentReferenceIdParams) => {
    return uuidv5(
        `${buildContentId({
            courseId: params.courseId,
            moduleIndex: params.moduleIndex,
            contentIndex: params.contentIndex,
        })}-reference-${params.referenceIndex}`,
        COURSE_UUID_NAMESPACE,
    )
}
