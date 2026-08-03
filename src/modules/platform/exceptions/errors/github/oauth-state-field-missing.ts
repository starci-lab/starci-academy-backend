import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a GitHub OAuth callback whose decrypted state is missing a required field. */
export interface OAuthStateFieldMissingExceptionMetadata extends AbstractExceptionMetadata {
    /** The missing field (`"redirectUri"` | `"userId"`). */
    field: string
}

/**
 * Thrown when the GitHub OAuth callback's decrypted state payload parses but
 * is missing a required field (`redirectUri` or `userId`).
 */
export class OAuthStateFieldMissingException extends AbstractException {
    constructor({
        field,
        originalError,
    }: OAuthStateFieldMissingExceptionMetadata) {
        super(
            "OAuth state is missing a required field.",
            "OAUTH_STATE_FIELD_MISSING_EXCEPTION",
            {
                field,
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
