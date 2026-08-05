import type {
    SignInInitRequest,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../../types"

/** CQRS envelope for password check + OTP challenge before any session exists. */
export class SignInInitCommand {
    constructor(
        readonly params: ExecuteParams<SignInInitRequest>,
    ) {}
}

