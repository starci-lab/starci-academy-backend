import {
    ExecuteParams,
} from "../../../../../types"
import type {
    SignInVerifyOtpInput,
} from "./graphql-types"

export class SignInVerifyOtpCommand {
    constructor(
        readonly params: ExecuteParams<SignInVerifyOtpInput>
    ) {}
}

