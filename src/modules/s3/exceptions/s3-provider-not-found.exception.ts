import {
    BadRequestException,
} from "@nestjs/common"

export type S3ProviderNotFoundExceptionDetails = {
    provider: unknown
    supportedProviders: readonly string[]
}

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

