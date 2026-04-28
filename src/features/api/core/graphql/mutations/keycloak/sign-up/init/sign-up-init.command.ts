import type {
    SignUpInitRequest,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../../types"

export class SignUpInitCommand {
    constructor(
        readonly params: ExecuteParams<SignUpInitRequest>,
    ) {}
}

