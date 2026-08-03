import {
    AbstractException,
    type AbstractExceptionMetadata,
} from "../abstract"

export interface S3BucketCreationFailedExceptionMetadata extends AbstractExceptionMetadata {
    bucket: string
    statusCode?: number
    providerCode?: string
    requestId?: string
    resource?: string
}

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
