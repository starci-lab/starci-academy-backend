import type {
    ForgotPasswordVerifyOtpRequest,
} from "./graphql-types/request"
import {
    ExecuteParams,
} from "../../../../../../types/execute"

/** CQRS envelope for applying the parked reset password after OTP succeeds. */
export class ForgotPasswordVerifyOtpCommand {
    constructor(
        readonly params: ExecuteParams<ForgotPasswordVerifyOtpRequest>,
    ) {}
}