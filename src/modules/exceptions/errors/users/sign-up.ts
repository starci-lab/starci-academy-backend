import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Thrown when sign-up is attempted but the Keycloak account email is already verified. */
export interface UserEmailAlreadyVerifiedExceptionMetadata extends AbstractExceptionMetadata {
    email: string
}

/** User email is already verified in Keycloak; sign-up OTP flow is not applicable. */
export class UserEmailAlreadyVerifiedException extends AbstractException {
    constructor(
        {
            email,
            originalError,
        }: UserEmailAlreadyVerifiedExceptionMetadata
    ) {
        super(
            "User email is already verified",
            "USER_EMAIL_ALREADY_VERIFIED_EXCEPTION",
            {
                email,
                originalError,
            }
        )
    }
}
