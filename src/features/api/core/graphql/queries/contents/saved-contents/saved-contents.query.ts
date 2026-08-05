import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    SavedContentsRequest,
} from "./graphql-types"

/**
 * CQRS message carrying savedContents ExecuteParams into SavedContentsHandler.
 */
export class SavedContentsQuery {
    constructor(
        readonly params: ExecuteParams<SavedContentsRequest>,
    ) {}
}
