/**
 * Resolved course mount folder: disk segment and slug after the leading index.
 */
export interface CourseDirPathResult {
    /** Display slug from `{index}-{slug}` (everything after the first hyphen). */
    displayId: string
    /** Absolute path to the course root on the mount. */
    path: string
}
