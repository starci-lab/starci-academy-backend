import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    TailorCvBlocksRequest,
} from "./graphql-types"

export class TailorCvBlocksCommand {
    constructor(
        readonly params: ExecuteParams<TailorCvBlocksRequest>,
    ) { }
}
