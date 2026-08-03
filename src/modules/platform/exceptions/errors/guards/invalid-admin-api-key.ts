import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for an admin-key guard rejection due to a mismatched key. */
export type InvalidAdminApiKeyExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when the admin API key guard (REST or GraphQL) receives an
 * `x-admin-api-key` header that does not match the mounted secret.
 */
export class InvalidAdminApiKeyException extends AbstractException {
    constructor({
        originalError,
    }: InvalidAdminApiKeyExceptionMetadata) {
        super(
            "Invalid admin API key.",
            "INVALID_ADMIN_API_KEY_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.FORBIDDEN,
        )
    }
}
