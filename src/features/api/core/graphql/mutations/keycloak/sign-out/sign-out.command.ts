import {
    ExecuteParams,
} from "../../../../types/execute"
import type {
    SignOutRequest,
} from "./graphql-types/request"

/** CQRS command carrying the request/user context for the signOut mutation. */
export class SignOutCommand {
    constructor(
        readonly params: ExecuteParams<SignOutRequest>,
    ) {}
}
