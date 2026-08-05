import {
    AbstractException,
    type AbstractExceptionMetadata,
} from "../abstract"

/** Bucket name + provider error from a failed ensure-bucket call. */
export interface S3BucketCreationFailedExceptionMetadata extends AbstractExceptionMetadata {
    bucket: string
    statusCode?: number
    providerCode?: string
    requestId?: string
    resource?: string
}

/** Aborts startup/sync when the bucket cannot be created — later puts would fail opaquely. */
export class S3BucketCreationFailedException extends AbstractException {
    constructor(
        {
            bucket,
            statusCode,
            providerCode,
            requestId,
            resource,
            originalError,
        }: S3BucketCreationFailedExceptionMetadata
    ) {
        super(
            "S3 bucket creation failed",
            "S3_BUCKET_CREATION_FAILED_EXCEPTION",
            {
                bucket,
                statusCode,
                providerCode,
                requestId,
                resource,
                originalError,
            }
        )
    }
}
