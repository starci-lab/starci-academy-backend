/** A mount entry resolved from an indexed folder (`{index}` or `{index}-{slug}`). */
export interface ResolvedFilePath {
    /** The relative path to the file. */
    relativePath: string
    /** The order index of the file. */
    orderIndex: number
    /** The display index of the file. */
    displayId: string
}

/** A resolved file's parsed payload paired with its index and relative path. */
export interface ResolvedFileResult<T> {
    /** The data of the file. */
    data: T
    /** The index of the file. */
    index: number
    /** The relative path of the file. */
    relativePath: string
}
