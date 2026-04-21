/**
 * Params for resolving a challenge directory under `modules/{module}/challenges/`.
 */
export interface ChallengeDirPathParams {
    /** Course order index on the mount. */
    courseIndex: number
    /** Module order index on the mount. */
    moduleIndex: number
    /** Content order index on the mount. */
    contentIndex: number
    /** Challenge order index on the mount. */
    challengeIndex: number
}

/**
 * Params for listing challenge folder indices.
 */
export interface ChallengeDirIndexesParams {
    /** Course order index on the mount. */
    courseIndex: number
    /** Module order index on the mount. */
    moduleIndex: number
    /** Content order index on the mount. */
    contentIndex: number
}

/**
 * Resolved challenge mount folder.
 */
export interface ChallengeDirPathResult {
    /** Display slug from the folder name (after the leading index). */
    displayId: string
    /** Absolute path to the challenge folder on the mount. */
    path: string
}
