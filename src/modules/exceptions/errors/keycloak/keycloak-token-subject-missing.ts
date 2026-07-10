import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a Keycloak access-token payload with no user id (`sub`) claim. */
export type KeycloakTokenSubjectMissingExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when a decoded Keycloak access token's payload is valid but is
 * missing the `sub` (user id) claim.
 */
export class KeycloakTokenSubjectMissingException extends AbstractException {
    constructor({
        originalError,
    }: KeycloakTokenSubjectMissingExceptionMetadata) {
        super(
            "Missing Keycloak user id in token payload.",
            "KEYCLOAK_TOKEN_SUBJECT_MISSING_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.UNAUTHORIZED,
        )
    }
}
