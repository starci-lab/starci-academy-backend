import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    DeleteCvBlocksRequest,
} from "./graphql-types/request"

/** CQRS envelope for deleting a saved CV document. */
export class DeleteCvBlocksCommand {
    constructor(
        readonly params: ExecuteParams<DeleteCvBlocksRequest>,
    ) { }
}
