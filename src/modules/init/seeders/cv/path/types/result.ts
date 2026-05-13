/**
 * One parsed mount entry, same shape as course seeders' `ResolvedFileResult`.
 */
export interface ResolvedFileResult<T> {
    /**
     * Parsed entity graph for TypeORM cascade save.
     */
    data: T
    /**
     * Zero-based order among discovered mount entries (matches sorted directory list).
     */
    index: number
    /**
     * Path relative to the data root (e.g. `cv/0-standard`).
     */
    relativePath: string
}
