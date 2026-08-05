/** The result of resolving a file path. */
export interface ResolvedFilePath {
    /** The relative path to the file. */
    relativePath: string
    /** The order index of the file. */
    orderIndex: number
    /** The display index of the file. */
    displayId: string
}

/** The result of resolving a file path. */
export interface ResolvedFileResult<T> {
    /** The data of the file. */
    data: T
    /** The index of the file. */
    index: number
    /** The relative path of the file. */
    relativePath: string
}
