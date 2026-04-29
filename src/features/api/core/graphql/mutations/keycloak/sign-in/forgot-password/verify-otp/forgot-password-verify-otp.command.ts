import type {
    ForgotPasswordVerifyOtpRequest,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../../../types"

export class ForgotPasswordVerifyOtpCommand {
    constructor(
        readonly params: ExecuteParams<ForgotPasswordVerifyOtpRequest>,
    ) {}
}