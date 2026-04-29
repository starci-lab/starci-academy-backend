import type {
    ForgotPasswordResendOtpRequest,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../../../types"

export class ForgotPasswordResendOtpCommand {
    constructor(
        readonly params: ExecuteParams<ForgotPasswordResendOtpRequest>,
    ) {}
}