import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    UpdateCvBlocksRequest,
} from "./graphql-types"

export class UpdateCvBlocksCommand {
    constructor(
        readonly params: ExecuteParams<UpdateCvBlocksRequest>,
    ) { }
}
