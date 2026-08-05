import type {
    SignInResendOtpRequest,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../../types"

/** CQRS envelope for rotating a sign-in OTP without repeating the password check. */
export class SignInResendOtpCommand {
    constructor(
        readonly params: ExecuteParams<SignInResendOtpRequest>,
    ) {}
}
