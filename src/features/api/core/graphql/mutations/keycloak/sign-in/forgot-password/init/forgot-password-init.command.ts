import type {
    ForgotPasswordInitRequest,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../../../types"

/** CQRS envelope for starting reset: email + intended password, no session yet. */
export class ForgotPasswordInitCommand {
    constructor(
        readonly params: ExecuteParams<ForgotPasswordInitRequest>,
    ) {}
}