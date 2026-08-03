import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a GitHub OAuth callback whose decoded state payload is malformed. */
export type InvalidOAuthStatePayloadExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when the GitHub OAuth callback's `state` param decodes into a
 * payload missing `iv`/`authTag`/`ciphertext` — the state was tampered with
 * or came from a different flow.
 */
export class InvalidOAuthStatePayloadException extends AbstractException {
    constructor({
        originalError,
    }: InvalidOAuthStatePayloadExceptionMetadata) {
        super(
            "Invalid OAuth state payload.",
            "INVALID_OAUTH_STATE_PAYLOAD_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
