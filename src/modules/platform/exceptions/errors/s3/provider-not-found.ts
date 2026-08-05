import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link S3ProviderNotFoundException}. */
export interface S3ProviderNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** The provider the caller asked for, which is not one this app supports. */
    provider: unknown
    /** The providers that ARE supported, so the caller can see why it was rejected. */
    supportedProviders: ReadonlyArray<string>
}

/**
 * Thrown when an S3 operation names a provider outside DigitalOcean/MinIO.
 * Fail closed -- guessing a client would write to the wrong bucket.
 *
 * Carries `httpStatus: 400`, because this is a caller mistake rather than a
 * server fault: without it `AbstractExceptionHttpFilter` would default to 500
 * and tell the caller the service is broken when the request is.
 */
export class S3ProviderNotFoundException extends AbstractException {
    constructor({
        provider,
        supportedProviders,
        originalError,
    }: S3ProviderNotFoundExceptionMetadata) {
        super(
            "S3 provider not supported",
            "S3_PROVIDER_NOT_FOUND_EXCEPTION",
            {
                provider,
                supportedProviders,
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
