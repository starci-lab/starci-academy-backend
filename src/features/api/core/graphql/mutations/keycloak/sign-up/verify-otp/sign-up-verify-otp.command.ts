import {
    ExecuteParams,
} from "../../../../../types"
import type {
    SignUpVerifyOtpInput,
} from "./graphql-types"

export class SignUpVerifyOtpCommand {
    constructor(
        readonly params: ExecuteParams<SignUpVerifyOtpInput>
    ) {}
}

