import {
    HttpStatus,
} from "@nestjs/common"
import {
    AbstractException,
} from "../abstract"
import type {
    AbstractExceptionMetadata,
} from "../abstract"

/** Metadata retained when the timeout wraps an infrastructure failure. */
export type RefreshTokenExchangeTimeoutExceptionMetadata = AbstractExceptionMetadata

/** Raised when no refresh-token exchange leader publishes before the bounded wait ends. */
export class RefreshTokenExchangeTimeoutException extends AbstractException {
    constructor({
        originalError,
    }: RefreshTokenExchangeTimeoutExceptionMetadata) {
        super(
            "Timed out waiting for refresh-token exchange leader.",
            "REFRESH_TOKEN_EXCHANGE_TIMEOUT_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.GATEWAY_TIMEOUT,
        )
    }
}
