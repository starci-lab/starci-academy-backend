import {
    ExecuteParams,
} from "../../../../../types/execute"
import type {
    SignInVerifyOtpRequest,
} from "./graphql-types/request"

/** CQRS envelope for releasing parked tokens after OTP succeeds. */
export class SignInVerifyOtpCommand {
    constructor(
        readonly params: ExecuteParams<SignInVerifyOtpRequest>
    ) {}
}

