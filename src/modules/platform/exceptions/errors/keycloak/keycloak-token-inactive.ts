import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a Keycloak access token that failed introspection. */
export type KeycloakTokenInactiveExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown by {@link AbstractKeycloakAuthGuard} / {@link KeycloakOptionalAuthGraphQLGuard}
 * when the Bearer token's introspection comes back inactive or without a
 * subject.
 */
export class KeycloakTokenInactiveException extends AbstractException {
    constructor({
        originalError,
    }: KeycloakTokenInactiveExceptionMetadata) {
        super(
            "Invalid or inactive token.",
            "KEYCLOAK_TOKEN_INACTIVE_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.UNAUTHORIZED,
        )
    }
}
