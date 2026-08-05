import type {
    SignUpResendOtpRequest,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../../types"

/** CQRS envelope for rotating a sign-up OTP without recreating the Keycloak user. */
export class SignUpResendOtpCommand {
    constructor(
        readonly params: ExecuteParams<SignUpResendOtpRequest>,
    ) {}
}
