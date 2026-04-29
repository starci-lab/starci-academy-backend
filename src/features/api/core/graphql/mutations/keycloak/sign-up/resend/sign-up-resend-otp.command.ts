import type {
    SignUpResendOtpRequest,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../../types"

export class SignUpResendOtpCommand {
    constructor(
        readonly params: ExecuteParams<SignUpResendOtpRequest>,
    ) {}
}
