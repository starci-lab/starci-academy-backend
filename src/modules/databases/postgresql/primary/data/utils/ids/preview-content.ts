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
 * Parameters for building a preview content ID.
 */
export interface BuildPreviewContentIdParams {
    /**
     * The course ID.
     */
    courseId: CourseId
    /**
     * The module index.
     */
    moduleIndex: number
    /**
     * The preview content index.
     */
    previewContentIndex: number
}

/**
 * Build a preview content ID.
 * @param params - The parameters for building the preview content ID.
 * @returns The preview content ID.
 */
export const buildPreviewContentId = (params: BuildPreviewContentIdParams) => {
    return uuidv5(
        `${buildModuleId(params)}-preview-content-${params.previewContentIndex}`,
        COURSE_UUID_NAMESPACE,
    )
}

