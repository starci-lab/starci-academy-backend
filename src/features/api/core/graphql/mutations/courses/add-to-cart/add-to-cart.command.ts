import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    AddToCartRequest,
} from "./graphql-types/request"

/** CQRS command carrying the request/user context for the addToCart mutation. */
export class AddToCartCommand {
    constructor(
        readonly params: ExecuteParams<AddToCartRequest>,
    ) {}
}
