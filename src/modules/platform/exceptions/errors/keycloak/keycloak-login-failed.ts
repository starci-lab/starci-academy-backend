import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a password grant rejected by the identity provider. */
export type KeycloakLoginFailedExceptionMetadata = AbstractExceptionMetadata

/** Stable client-facing boundary for invalid/disabled/non-existent credentials. */
export class KeycloakLoginFailedException extends AbstractException {
    constructor(
        {
            originalError,
        }: KeycloakLoginFailedExceptionMetadata = {
        },
    ) {
        super(
            "Invalid email or password.",
            "KEYCLOAK_LOGIN_FAILED_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.UNAUTHORIZED,
        )
    }
}
