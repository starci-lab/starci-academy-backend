import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    TailorCvBlocksRequest,
} from "./graphql-types"

/** CQRS envelope for JD-aligning block wording in memory. */
export class TailorCvBlocksCommand {
    constructor(
        readonly params: ExecuteParams<TailorCvBlocksRequest>,
    ) { }
}
