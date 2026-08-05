import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for an S3-compatible upload that failed against a provider. */
export interface S3UploadFailedExceptionMetadata extends AbstractExceptionMetadata {
    /** Provider the upload targeted (`"digitalOcean"` | `"minio"`). */
    provider: string
    /** Bucket the upload targeted. */
    bucket: string
    /** Object key the upload targeted. */
    key: string
}

/**
 * Thrown when an S3-compatible `PutObjectCommand` rejects -- carries the
 * provider/bucket/key context alongside the original SDK error for debugging.
 */
export class S3UploadFailedException extends AbstractException {
    constructor({
        provider,
        bucket,
        key,
        originalError,
    }: S3UploadFailedExceptionMetadata) {
        super(
            "S3 upload failed.",
            "S3_UPLOAD_FAILED_EXCEPTION",
            {
                provider,
                bucket,
                key,
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
