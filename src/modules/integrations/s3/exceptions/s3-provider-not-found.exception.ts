import {
    BadRequestException,
} from "@nestjs/common"

/**
 * Payload for {@link S3ProviderNotFoundException}: the unknown provider plus the
 * supported list so the caller can see why the upload/read was rejected.
 */
export type S3ProviderNotFoundExceptionDetails = {
    provider: unknown
    supportedProviders: readonly string[]
}

/**
 * Thrown when an S3 operation names a provider outside DigitalOcean/MinIO.
 * Fail closed — guessing a client would write to the wrong bucket.
 */
export class S3ProviderNotFoundException extends BadRequestException {
    constructor(
        details: S3ProviderNotFoundExceptionDetails,
    ) {
        super({
            message: "S3 provider not supported",
            ...details,
        })
    }
}

