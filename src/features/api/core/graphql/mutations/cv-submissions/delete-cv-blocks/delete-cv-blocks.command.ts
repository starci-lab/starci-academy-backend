import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    DeleteCvBlocksRequest,
} from "./graphql-types"

export class DeleteCvBlocksCommand {
    constructor(
        readonly params: ExecuteParams<DeleteCvBlocksRequest>,
    ) { }
}
