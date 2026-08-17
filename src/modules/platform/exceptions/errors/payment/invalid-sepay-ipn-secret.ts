import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a SePay IPN request that cannot authenticate. */
export type InvalidSepayIpnSecretExceptionMetadata = AbstractExceptionMetadata

/** Thrown when the inbound SePay `X-Secret-Key` is absent or invalid. */
export class InvalidSepayIpnSecretException extends AbstractException {
    constructor({
        originalError,
    }: InvalidSepayIpnSecretExceptionMetadata) {
        super(
            "Invalid SePay IPN secret.",
            "INVALID_SEPAY_IPN_SECRET_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.UNAUTHORIZED,
        )
    }
}
