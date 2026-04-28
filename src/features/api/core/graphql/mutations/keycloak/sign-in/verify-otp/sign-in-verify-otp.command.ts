import {
    ExecuteParams,
} from "../../../../../types"
import type {
    SignInVerifyOtpRequest,
} from "./graphql-types"

export class SignInVerifyOtpCommand {
    constructor(
        readonly params: ExecuteParams<SignInVerifyOtpRequest>
    ) {}
}

