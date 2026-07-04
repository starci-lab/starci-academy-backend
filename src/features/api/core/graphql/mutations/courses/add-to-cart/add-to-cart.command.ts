import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    AddToCartRequest,
} from "./graphql-types"

/** CQRS command carrying the request/user context for the addToCart mutation. */
export class AddToCartCommand {
    constructor(
        readonly params: ExecuteParams<AddToCartRequest>,
    ) {}
}
