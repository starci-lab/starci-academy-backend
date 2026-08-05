import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a Keycloak access-token payload that fails shape validation. */
export type KeycloakTokenPayloadInvalidExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when a decoded Keycloak access token's payload is missing or not a
 * valid claims object -- used by the register/login HTTP handlers (distinct
 * from {@link InvalidJwtPayloadException}, which guards the lower-level
 * `jwt.verify` step).
 */
export class KeycloakTokenPayloadInvalidException extends AbstractException {
    constructor({
        originalError,
    }: KeycloakTokenPayloadInvalidExceptionMetadata) {
        super(
            "Invalid Keycloak access token payload.",
            "KEYCLOAK_TOKEN_PAYLOAD_INVALID_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.UNAUTHORIZED,
        )
    }
}
