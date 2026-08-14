import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when the JWT header has no `kid`. */
export interface KeycloakJwtHeaderKidNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    alg?: string
    typ?: string
}

/** Thrown when resolving JWKS signing key but `kid` is absent from the JWT header. */
export class KeycloakJwtHeaderKidNotFoundException extends AbstractException {
    constructor({
        alg,
        typ,
        originalError,
    }: KeycloakJwtHeaderKidNotFoundExceptionMetadata = {

    }) {
        super(
            "JWT header is missing kid",
            "KEYCLOAK_JWT_HEADER_KID_NOT_FOUND_EXCEPTION",
            {
                alg,
                typ,
                originalError,
            },
        )
    }
}
