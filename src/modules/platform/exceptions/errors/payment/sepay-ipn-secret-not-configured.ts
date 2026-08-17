import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a missing server-side SePay IPN secret. */
export type SepayIpnSecretNotConfiguredExceptionMetadata = AbstractExceptionMetadata

/** Thrown when the API has no mounted SePay IPN secret and must fail closed. */
export class SepayIpnSecretNotConfiguredException extends AbstractException {
    constructor({
        originalError,
    }: SepayIpnSecretNotConfiguredExceptionMetadata) {
        super(
            "SePay IPN secret is not configured.",
            "SEPAY_IPN_SECRET_NOT_CONFIGURED_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
