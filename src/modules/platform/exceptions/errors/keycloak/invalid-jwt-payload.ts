import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when `jwt.verify` yields a non-object payload. */
export interface KeycloakJwtInvalidPayloadExceptionMetadata extends AbstractExceptionMetadata {
    payload?: unknown
}

/** Thrown when the decoded JWT body is missing or not a claims object. */
export class KeycloakJwtInvalidPayloadException extends AbstractException {
    constructor({
        payload,
        originalError,
    }: KeycloakJwtInvalidPayloadExceptionMetadata = {

    }) {
        super(
            "JWT payload is invalid or not a claim set",
            "KEYCLOAK_JWT_INVALID_PAYLOAD_EXCEPTION",
            {
                payload,
                originalError,
            },
        )
    }
}
