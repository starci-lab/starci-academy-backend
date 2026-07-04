import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    RemoveFromCartRequest,
} from "./graphql-types"

/** CQRS command carrying the request/user context for the removeFromCart mutation. */
export class RemoveFromCartCommand {
    constructor(
        readonly params: ExecuteParams<RemoveFromCartRequest>,
    ) {}
}
