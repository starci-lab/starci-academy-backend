import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a Keycloak user creation whose new user id could not be resolved. */
export interface KeycloakUserIdResolutionFailedExceptionMetadata extends AbstractExceptionMetadata {
    /** The username the create request was issued for. */
    username: string
}

/**
 * Thrown when Keycloak admin user-creation succeeds but neither the
 * `Location` header nor a by-username lookup yields the new user's id.
 */
export class KeycloakUserIdResolutionFailedException extends AbstractException {
    constructor({
        username,
        originalError,
    }: KeycloakUserIdResolutionFailedExceptionMetadata) {
        super(
            "Could not resolve user id after Keycloak user creation.",
            "KEYCLOAK_USER_ID_RESOLUTION_FAILED_EXCEPTION",
            {
                username,
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
