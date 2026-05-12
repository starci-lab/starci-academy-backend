import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ToggleFavouriteRequest,
} from "./graphql-types"

export class ToggleFavouriteCommand {
    constructor(
        readonly params: ExecuteParams<ToggleFavouriteRequest>,
    ) { }
}
