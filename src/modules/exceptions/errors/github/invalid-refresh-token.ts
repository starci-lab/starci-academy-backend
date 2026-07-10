import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a GitHub OAuth redirect whose refresh-token introspection failed. */
export type InvalidRefreshTokenExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when the GitHub OAuth redirect handler's Keycloak refresh-token
 * introspection comes back inactive or without a subject.
 */
export class InvalidRefreshTokenException extends AbstractException {
    constructor({
        originalError,
    }: InvalidRefreshTokenExceptionMetadata) {
        super(
            "Invalid refresh token.",
            "INVALID_REFRESH_TOKEN_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.UNAUTHORIZED,
        )
    }
}
