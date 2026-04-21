/**
 * Params for resolving a lesson-video directory under `modules/{module}/lession-videos/`.
 */
export interface LessonVideoDirPathParams {
    /** Course order index on the mount. */
    courseIndex: number
    /** Module order index on the mount. */
    moduleIndex: number
    /** Content order index on the mount. */
    contentIndex: number
    /** Lesson-video order index on the mount. */
    lessonVideoIndex: number
}

/**
 * Params for listing lesson-video folder indices.
 */
export interface LessonVideoDirIndexesParams {
    /** Course order index on the mount. */
    courseIndex: number
    /** Module order index on the mount. */
    moduleIndex: number
    /** Content order index on the mount. */
    contentIndex: number
}

/**
 * Resolved lesson-video mount folder.
 */
export interface LessonVideoDirPathResult {
    /** Display slug from the folder name (after the leading index). */
    displayId: string
    /** Absolute path to the lesson-video folder on the mount. */
    path: string
}
