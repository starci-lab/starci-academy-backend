import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a same-bucket S3 copy requested on an unimplemented provider. */
export interface S3CopyUnsupportedProviderExceptionMetadata extends AbstractExceptionMetadata {
    /** The provider requested (only `Minio` is implemented). */
    provider: string
}

/**
 * Thrown when {@link S3CopyService.copySameBucket} is called with a provider
 * other than `Minio` -- server-side copy is only implemented for MinIO so far.
 */
export class S3CopyUnsupportedProviderException extends AbstractException {
    constructor({
        provider,
        originalError,
    }: S3CopyUnsupportedProviderExceptionMetadata) {
        super(
            "S3 same-bucket copy is only implemented for MinIO.",
            "S3_COPY_UNSUPPORTED_PROVIDER_EXCEPTION",
            {
                provider,
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
