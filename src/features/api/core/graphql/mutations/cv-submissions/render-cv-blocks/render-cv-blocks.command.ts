import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    RenderCvBlocksRequest,
} from "./graphql-types"

export class RenderCvBlocksCommand {
    constructor(
        readonly params: ExecuteParams<RenderCvBlocksRequest>,
    ) { }
}
