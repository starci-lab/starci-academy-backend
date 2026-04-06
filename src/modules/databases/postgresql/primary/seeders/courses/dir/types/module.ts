/**
 * Params for resolving a module directory under a course mount.
 */
export interface ModuleDirPathParams {
    /** Course order index on the mount. */
    courseIndex: number
    /** Module order index on the mount. */
    moduleIndex: number
}

/**
 * Resolved module mount folder: disk segment and slug after the leading index.
 */
export interface ModuleDirPathResult {
    /** Display slug from `{index}-{slug}` (everything after the first hyphen). */
    displayId: string
    /** Absolute path to the module root on the mount. */
    path: string
}
