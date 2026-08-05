import type {
    SignInResendOtpRequest,
} from "./graphql-types/request"
import {
    ExecuteParams,
} from "../../../../../types/execute"

/** CQRS envelope for rotating a sign-in OTP without repeating the password check. */
export class SignInResendOtpCommand {
    constructor(
        readonly params: ExecuteParams<SignInResendOtpRequest>,
    ) {}
}
