import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    RemoveFromFavoritesRequest,
} from "./graphql-types"

export class RemoveFromFavoritesCommand {
    constructor(
        readonly params: ExecuteParams<RemoveFromFavoritesRequest>,
    ) {}
}
