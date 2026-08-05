import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    ToggleFavouriteRequest,
} from "./graphql-types/request"

/** CQRS envelope so favourite + activity-feed writes stay out of the resolver. */
export class ToggleFavouriteCommand {
    constructor(
        readonly params: ExecuteParams<ToggleFavouriteRequest>,
    ) { }
}
