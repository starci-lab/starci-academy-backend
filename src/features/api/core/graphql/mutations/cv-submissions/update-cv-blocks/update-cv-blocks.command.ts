import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    UpdateCvBlocksRequest,
} from "./graphql-types/request"

/** CQRS envelope for persisting editor edits to an existing document. */
export class UpdateCvBlocksCommand {
    constructor(
        readonly params: ExecuteParams<UpdateCvBlocksRequest>,
    ) { }
}
