import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    DeleteCvBlocksRequest,
} from "./graphql-types"

/** CQRS envelope for deleting a saved CV document. */
export class DeleteCvBlocksCommand {
    constructor(
        readonly params: ExecuteParams<DeleteCvBlocksRequest>,
    ) { }
}
