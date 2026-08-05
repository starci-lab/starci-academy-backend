import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    SavedContentsRequest,
} from "./graphql-types/request"

/**
 * CQRS message carrying savedContents ExecuteParams into SavedContentsHandler.
 */
export class SavedContentsQuery {
    constructor(
        readonly params: ExecuteParams<SavedContentsRequest>,
    ) {}
}
