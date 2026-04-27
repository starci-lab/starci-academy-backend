import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    AddToFavoritesRequest,
} from "./graphql-types"

export class AddToFavoritesCommand {
    constructor(
        readonly params: ExecuteParams<AddToFavoritesRequest>,
    ) { }
}
