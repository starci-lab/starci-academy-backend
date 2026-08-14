import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when JWKS returns no key for `kid`. */
export type KeycloakJwksSigningKeyNotFoundExceptionMetadata = AbstractExceptionMetadata

/** Thrown when the realm JWKS document has no matching key for the token `kid`. */
export class KeycloakJwksSigningKeyNotFoundException extends AbstractException {
    constructor({
        originalError,
    }: KeycloakJwksSigningKeyNotFoundExceptionMetadata) {
        super(
            "JWKS signing key not found for kid",
            "KEYCLOAK_JWKS_SIGNING_KEY_NOT_FOUND_EXCEPTION",
            {
                originalError,
            },
        )
    }
}
