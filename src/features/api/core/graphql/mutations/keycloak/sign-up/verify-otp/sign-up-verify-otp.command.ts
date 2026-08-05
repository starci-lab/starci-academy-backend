import {
    ExecuteParams,
} from "../../../../../types"
import type {
    SignUpVerifyOtpInput,
} from "./graphql-types"

/** CQRS envelope for verifying email and minting the first session. */
export class SignUpVerifyOtpCommand {
    constructor(
        readonly params: ExecuteParams<SignUpVerifyOtpInput>
    ) {}
}

