import {
    ExecuteParams,
} from "../../../../../types"
import type {
    SignInVerifyOtpRequest,
} from "./graphql-types"

/** CQRS envelope for releasing parked tokens after OTP succeeds. */
export class SignInVerifyOtpCommand {
    constructor(
        readonly params: ExecuteParams<SignInVerifyOtpRequest>
    ) {}
}

