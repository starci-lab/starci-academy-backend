import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for an admin-key guard whose mounted secret is unset. */
export type AdminApiKeyNotConfiguredExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when the admin API key guard (REST or GraphQL) cannot read a
 * configured admin secret — a server misconfiguration, not a caller error,
 * so it maps to 500 rather than 401.
 */
export class AdminApiKeyNotConfiguredException extends AbstractException {
    constructor({
        originalError,
    }: AdminApiKeyNotConfiguredExceptionMetadata) {
        super(
            "Admin API key is not configured.",
            "ADMIN_API_KEY_NOT_CONFIGURED_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
