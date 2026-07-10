import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a Keycloak-guarded request with no `Authorization` header. */
export type KeycloakAuthHeaderMissingExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown by {@link AbstractKeycloakAuthGuard} when the request carries no
 * `Authorization` header at all.
 */
export class KeycloakAuthHeaderMissingException extends AbstractException {
    constructor({
        originalError,
    }: KeycloakAuthHeaderMissingExceptionMetadata) {
        super(
            "Missing Authorization header.",
            "KEYCLOAK_AUTH_HEADER_MISSING_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.UNAUTHORIZED,
        )
    }
}
