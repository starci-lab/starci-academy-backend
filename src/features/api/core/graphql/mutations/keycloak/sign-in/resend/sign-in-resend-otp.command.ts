import type {
    SignInResendOtpRequest,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../../types"

export class SignInResendOtpCommand {
    constructor(
        readonly params: ExecuteParams<SignInResendOtpRequest>,
    ) {}
}
