import type {
    ForgotPasswordResendOtpRequest,
} from "./graphql-types/request"
import {
    ExecuteParams,
} from "../../../../../../types/execute"

/** CQRS envelope for rotating a reset OTP without restarting the password challenge. */
export class ForgotPasswordResendOtpCommand {
    constructor(
        readonly params: ExecuteParams<ForgotPasswordResendOtpRequest>,
    ) {}
}