import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a Keycloak-guarded request whose `Authorization` header is malformed. */
export type KeycloakAuthHeaderInvalidFormatExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown by {@link AbstractKeycloakAuthGuard} / {@link KeycloakOptionalAuthGraphQLGuard}
 * when `Authorization` is present but not a well-formed `Bearer <token>` value.
 */
export class KeycloakAuthHeaderInvalidFormatException extends AbstractException {
    constructor({
        originalError,
    }: KeycloakAuthHeaderInvalidFormatExceptionMetadata) {
        super(
            "Invalid Authorization header format.",
            "KEYCLOAK_AUTH_HEADER_INVALID_FORMAT_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.UNAUTHORIZED,
        )
    }
}
