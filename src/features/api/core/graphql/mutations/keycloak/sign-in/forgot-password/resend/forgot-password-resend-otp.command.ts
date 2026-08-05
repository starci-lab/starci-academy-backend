import type {
    ForgotPasswordResendOtpRequest,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../../../types"

/** CQRS envelope for rotating a reset OTP without restarting the password challenge. */
export class ForgotPasswordResendOtpCommand {
    constructor(
        readonly params: ExecuteParams<ForgotPasswordResendOtpRequest>,
    ) {}
}