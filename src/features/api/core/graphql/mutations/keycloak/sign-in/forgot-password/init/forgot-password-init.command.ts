import type {
    ForgotPasswordInitRequest,
} from "./graphql-types/request"
import {
    ExecuteParams,
} from "../../../../../../types/execute"

/** CQRS envelope for starting reset: email + intended password, no session yet. */
export class ForgotPasswordInitCommand {
    constructor(
        readonly params: ExecuteParams<ForgotPasswordInitRequest>,
    ) {}
}