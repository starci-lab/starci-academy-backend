/** AWS SDK response metadata carried on a failed S3-compatible request. */
export interface S3LikeErrorMetadata {
    /** HTTP status code returned by the provider. */
    httpStatusCode?: number
    /** Provider request id from the SDK metadata. */
    requestId?: string
}

/** Shape of an S3-compatible provider error. */
export type S3LikeError = Error & {
    /** Provider-specific error code (e.g. "NoSuchKey", "AccessDenied"). */
    Code?: string
    /** The S3 resource (bucket/key) the error refers to. */
    Resource?: string
    /** Provider request id for the failed operation (legacy field). */
    RequestId?: string
    /** AWS SDK response metadata for the failed request. */
    $metadata?: S3LikeErrorMetadata
}
