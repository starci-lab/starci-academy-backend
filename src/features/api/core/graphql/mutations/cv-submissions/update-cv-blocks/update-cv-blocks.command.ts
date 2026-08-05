import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    UpdateCvBlocksRequest,
} from "./graphql-types"

/** CQRS envelope for persisting editor edits to an existing document. */
export class UpdateCvBlocksCommand {
    constructor(
        readonly params: ExecuteParams<UpdateCvBlocksRequest>,
    ) { }
}
