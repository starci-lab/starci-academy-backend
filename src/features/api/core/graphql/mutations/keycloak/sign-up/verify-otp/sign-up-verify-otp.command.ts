import {
    ExecuteParams,
} from "../../../../../types/execute"
import type {
    SignUpVerifyOtpInput,
} from "./graphql-types/request"

/** CQRS envelope for verifying email and minting the first session. */
export class SignUpVerifyOtpCommand {
    constructor(
        readonly params: ExecuteParams<SignUpVerifyOtpInput>
    ) {}
}

