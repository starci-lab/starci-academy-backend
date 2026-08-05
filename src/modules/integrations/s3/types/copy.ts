import {
    S3Provider,
} from "../enums/s3"

/** Params for copying an object to a new key within the same bucket. */
export interface S3CopySameBucketParams {
    /** Existing object key. */
    sourceKey: string
    /** Destination key in the same bucket. */
    destKey: string
    /** The S3 provider whose bucket the copy is performed in. */
    provider: S3Provider
}
