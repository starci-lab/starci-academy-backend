import type {
    SignUpInitRequest,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../../types"

/** CQRS envelope for creating/resuming an unverified Keycloak user + OTP challenge. */
export class SignUpInitCommand {
    constructor(
        readonly params: ExecuteParams<SignUpInitRequest>,
    ) {}
}

