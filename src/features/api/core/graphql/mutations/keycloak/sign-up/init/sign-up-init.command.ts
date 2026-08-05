import type {
    SignUpInitRequest,
} from "./graphql-types/request"
import {
    ExecuteParams,
} from "../../../../../types/execute"

/** CQRS envelope for creating/resuming an unverified Keycloak user + OTP challenge. */
export class SignUpInitCommand {
    constructor(
        readonly params: ExecuteParams<SignUpInitRequest>,
    ) {}
}

