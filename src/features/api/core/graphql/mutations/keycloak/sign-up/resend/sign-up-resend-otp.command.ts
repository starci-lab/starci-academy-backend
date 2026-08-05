import type {
    SignUpResendOtpRequest,
} from "./graphql-types/request"
import {
    ExecuteParams,
} from "../../../../../types/execute"

/** CQRS envelope for rotating a sign-up OTP without recreating the Keycloak user. */
export class SignUpResendOtpCommand {
    constructor(
        readonly params: ExecuteParams<SignUpResendOtpRequest>,
    ) {}
}
