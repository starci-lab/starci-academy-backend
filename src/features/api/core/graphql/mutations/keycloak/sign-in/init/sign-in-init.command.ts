import type {
    SignInInitRequest,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../../types"

export class SignInInitCommand {
    constructor(
        readonly params: ExecuteParams<SignInInitRequest>,
    ) {}
}

