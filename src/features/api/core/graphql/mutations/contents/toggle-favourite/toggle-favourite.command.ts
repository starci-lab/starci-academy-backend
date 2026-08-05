import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ToggleFavouriteRequest,
} from "./graphql-types"

/** CQRS envelope so favourite + activity-feed writes stay out of the resolver. */
export class ToggleFavouriteCommand {
    constructor(
        readonly params: ExecuteParams<ToggleFavouriteRequest>,
    ) { }
}
