import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    SavedContentsRequest,
} from "./graphql-types"

export class SavedContentsQuery {
    constructor(
        readonly params: ExecuteParams<SavedContentsRequest>,
    ) {}
}
