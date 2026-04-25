import type {
    S3Provider 
} from "@modules/s3"

/** Message for when courses are seeded successfully. */
export interface CoursesSeededSuccessfullyMessage {
    /** The number of courses that were seeded. */
    count: number
}

/** Message for when a context file is loaded successfully (s3/filesystem). */
export interface ContextFileLoadedSuccessfullyMessage {
    /** The index of the context. */
    index: number
    /** The relative path to the file. */
    relativePath: string
    /** The type of the context. */
    type: string
    /** The provider of the context. */
    provider?: S3Provider
}