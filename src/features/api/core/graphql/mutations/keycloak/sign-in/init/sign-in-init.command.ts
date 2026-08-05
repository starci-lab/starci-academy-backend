import type {
    SignInInitRequest,
} from "./graphql-types/request"
import {
    ExecuteParams,
} from "../../../../../types/execute"

/** CQRS envelope for password check + OTP challenge before any session exists. */
export class SignInInitCommand {
    constructor(
        readonly params: ExecuteParams<SignInInitRequest>,
    ) {}
}

