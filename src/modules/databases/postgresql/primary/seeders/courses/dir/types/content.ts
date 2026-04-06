/**
 * Params for resolving a content directory under `modules/{module}/contents/`.
 */
export interface ContentDirPathParams {
    /** Course order index on the mount. */
    courseIndex: number
    /** Module order index on the mount. */
    moduleIndex: number
    /** Content order index on the mount. */
    contentIndex: number
}

/**
 * Params for listing content folder indices under `contents/`.
 */
export interface ContentDirIndexesParams {
    /** Course order index on the mount. */
    courseIndex: number
    /** Module order index on the mount. */
    moduleIndex: number
}

/**
 * Resolved content mount folder: slug from `{index}-{slug}` (or legacy numeric folder).
 */
export interface ContentDirPathResult {
    /** Display slug from the folder name (after the leading index). */
    displayId: string
    /** Absolute path to the content item folder on the mount. */
    path: string
}
