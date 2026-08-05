import type {
    S3Provider 
} from "@modules/s3"

/** Message for when courses are seeded successfully. */
export interface CoursesSeededSuccessfullyMessage {
    /** The number of courses that were seeded. */
    count: number
}

/**
 * Message for when a single user trips the per-user content-access rate limit --
 * i.e. suspected bulk scraping of lesson content. Logged (with the offender's
 * email) so the account can be reviewed / disabled and used as takedown evidence.
 */
export interface ContentScrapeDetectedMessage {
    /** The offending user's id. */
    userId: string
    /** The offending user's email (evidence / who to contact or ban). */
    email?: string
    /** How many content reads this user made inside the window. */
    count: number
    /** The configured per-window limit that was exceeded. */
    limit: number
    /** The rolling window length, in seconds. */
    windowSeconds: number
}

/** Message for when a single mount entity is skipped during init seed. */
export interface InitSeederEntitySkippedMessage {
    /** Entity kind (e.g. challenge, content). */
    entityType: string
    /** Mount path relative to the courses root. */
    relativePath: string
    /** Exception code when available. */
    errorCode?: string
    /** Human-readable skip reason. */
    errorMessage: string
    /** Stack trace when the error is an `Error`. */
    errorStack?: string
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