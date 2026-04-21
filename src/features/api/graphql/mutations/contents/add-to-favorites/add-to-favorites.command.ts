import {
    ExecuteParams,
} from "@features/api/types"
import {
    AddToFavoritesRequest,
} from "./graphql-types"

export class AddToFavoritesCommand {
    constructor(
        readonly params: ExecuteParams<AddToFavoritesRequest>,
    ) { }
}
