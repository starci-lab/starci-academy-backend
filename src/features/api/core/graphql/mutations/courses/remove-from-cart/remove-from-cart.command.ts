import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    RemoveFromCartRequest,
} from "./graphql-types/request"

/** CQRS command carrying the request/user context for the removeFromCart mutation. */
export class RemoveFromCartCommand {
    constructor(
        readonly params: ExecuteParams<RemoveFromCartRequest>,
    ) {}
}
