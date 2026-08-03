import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when JWKS returns no key for `kid`. */
export type JwksSigningKeyNotFoundExceptionMetadata = AbstractExceptionMetadata

/** Thrown when the realm JWKS document has no matching key for the token `kid`. */
export class JwksSigningKeyNotFoundException extends AbstractException {
    constructor({
        originalError,
    }: JwksSigningKeyNotFoundExceptionMetadata) {
        super(
            "JWKS signing key not found for kid",
            "KEYCLOAK_JWKS_SIGNING_KEY_NOT_FOUND",
            {
                originalError,
            },
        )
    }
}
