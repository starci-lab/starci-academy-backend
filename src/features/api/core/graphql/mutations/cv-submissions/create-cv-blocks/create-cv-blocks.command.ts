import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    CreateCvBlocksRequest,
} from "./graphql-types"

export class CreateCvBlocksCommand {
    constructor(
        readonly params: ExecuteParams<CreateCvBlocksRequest>,
    ) { }
}
